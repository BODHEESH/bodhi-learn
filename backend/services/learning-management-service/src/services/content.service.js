const BaseService = require('./base.service');
const { Content } = require('../models/schemas');
const { NotFoundError, ValidationError } = require('../utils/errors');
const notificationClient = require('../utils/notificationClient');
const moderationClient = require('../utils/moderationClient');
const config = require('../config/config');

class ContentService extends BaseService {
    constructor() {
        super(Content);
    }

    async create(data) {
        // Validate content data
        await this.validateContentData(data);

        // Check content moderation if enabled
        if (config.features.enableModeration) {
            await this.moderateContent(data);
        }

        // Create content
        const content = await super.create(data);

        // Send notifications
        if (config.features.enableNotifications) {
            await this.notifyNewContent(content);
        }

        return content;
    }

    async update(id, data) {
        const content = await this.findById(id);

        // Validate update data
        await this.validateContentData(data, content);

        // Check content moderation for updates if enabled
        if (config.features.enableModeration) {
            await this.moderateContent(data);
        }

        // Update content
        const updatedContent = await super.update(id, data);

        // Notify relevant users about the update
        if (config.features.enableNotifications) {
            await this.notifyContentUpdate(updatedContent);
        }

        return updatedContent;
    }

    async addComment(contentId, commentData) {
        const content = await this.findById(contentId);

        // Validate comment data
        await this.validateCommentData(commentData);

        // Check comment moderation if enabled
        if (config.features.enableModeration) {
            await this.moderateComment(commentData);
        }

        content.comments.push(commentData);
        await content.save();

        // Notify about new comment
        if (config.features.enableNotifications) {
            await this.notifyNewComment(content, commentData);
        }

        return content;
    }

    async updateComment(contentId, commentId, commentData) {
        const content = await this.findById(contentId);
        const comment = content.comments.id(commentId);

        if (!comment) {
            throw new NotFoundError('Comment not found');
        }

        // Validate comment update
        await this.validateCommentData(commentData, comment);

        // Check comment moderation if enabled
        if (config.features.enableModeration) {
            await this.moderateComment(commentData);
        }

        Object.assign(comment, commentData);
        await content.save();

        return content;
    }

    async addReaction(contentId, reactionData) {
        const content = await this.findById(contentId);

        // Validate reaction data
        if (!reactionData.userId || !reactionData.type) {
            throw new ValidationError('Reaction must have user ID and type');
        }

        // Remove existing reaction from same user if exists
        const existingReactionIndex = content.reactions.findIndex(
            r => r.userId.toString() === reactionData.userId.toString()
        );

        if (existingReactionIndex > -1) {
            content.reactions.splice(existingReactionIndex, 1);
        }

        content.reactions.push(reactionData);
        await content.save();

        return content;
    }

    async removeReaction(contentId, userId) {
        const content = await this.findById(contentId);

        const reactionIndex = content.reactions.findIndex(
            r => r.userId.toString() === userId.toString()
        );

        if (reactionIndex > -1) {
            content.reactions.splice(reactionIndex, 1);
            await content.save();
        }

        return content;
    }

    async incrementViews(contentId) {
        return await this.update(contentId, { $inc: { views: 1 } });
    }

    // Private methods
    async validateContentData(data, existingContent = null) {
        if (!data.title || data.title.length < 5) {
            throw new ValidationError('Content title must be at least 5 characters long');
        }

        if (!data.content || data.content.length < 20) {
            throw new ValidationError('Content must be at least 20 characters long');
        }

        if (data.tags && (!Array.isArray(data.tags) || data.tags.length === 0)) {
            throw new ValidationError('At least one tag is required');
        }
    }

    async validateCommentData(data, existingComment = null) {
        if (!data.userId) {
            throw new ValidationError('Comment must have a user ID');
        }

        if (!data.text || data.text.length < 2) {
            throw new ValidationError('Comment must be at least 2 characters long');
        }
    }

    async moderateContent(data) {
        try {
            const moderationResult = await moderationClient.checkContent({
                title: data.title,
                content: data.content,
                tags: data.tags
            });

            if (!moderationResult.approved) {
                throw new ValidationError('Content violates moderation guidelines');
            }
        } catch (error) {
            this.logger.error('Content moderation failed:', error);
            throw error;
        }
    }

    async moderateComment(data) {
        try {
            const moderationResult = await moderationClient.checkContent({
                content: data.text
            });

            if (!moderationResult.approved) {
                throw new ValidationError('Comment violates moderation guidelines');
            }
        } catch (error) {
            this.logger.error('Comment moderation failed:', error);
            throw error;
        }
    }

    // Notification methods
    async notifyNewContent(content) {
        await notificationClient.sendNotification({
            type: 'NEW_CONTENT',
            title: `New Content: ${content.title}`,
            description: content.description,
            recipients: ['ADMIN', 'INSTRUCTOR'],
            data: { contentId: content._id }
        });
    }

    async notifyContentUpdate(content) {
        await notificationClient.sendNotification({
            type: 'CONTENT_UPDATE',
            title: `Content Updated: ${content.title}`,
            recipients: [...this.getContentSubscribers(content)],
            data: { contentId: content._id }
        });
    }

    async notifyNewComment(content, comment) {
        const recipients = this.getContentSubscribers(content)
            .filter(userId => userId.toString() !== comment.userId.toString());

        await notificationClient.sendNotification({
            type: 'NEW_COMMENT',
            title: `New Comment on: ${content.title}`,
            recipients,
            data: { contentId: content._id, commentId: comment._id }
        });
    }

    // Helper methods
    getContentSubscribers(content) {
        const subscribers = new Set([
            content.author,
            ...content.comments.map(c => c.userId),
            ...content.reactions.map(r => r.userId)
        ]);
        return Array.from(subscribers);
    }
}

module.exports = new ContentService();
