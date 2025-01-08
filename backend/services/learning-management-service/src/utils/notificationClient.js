const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config');

class NotificationClient {
    constructor() {
        this.baseURL = config.notificationService.baseURL;
        this.apiKey = config.notificationService.apiKey;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        this.templates = {
            CONTENT_COMMENT: 'learning_content_comment',
            CONTENT_REPLY: 'learning_content_reply',
            ACHIEVEMENT_UNLOCKED: 'learning_achievement_unlocked',
            LEVEL_UP: 'learning_level_up',
            CONTENT_MENTION: 'learning_content_mention',
            CONTENT_SHARED: 'learning_content_shared',
            SKILL_MILESTONE: 'learning_skill_milestone',
            LEARNING_REMINDER: 'learning_reminder',
            COURSE_UPDATE: 'learning_course_update',
            ASSIGNMENT_DUE: 'learning_assignment_due'
        };
    }

    /**
     * Send notification to notification service
     * @param {Object} notification - Notification data
     * @returns {Promise<Object>} Notification response
     */
    async sendNotification(notification) {
        try {
            const response = await this.client.post('/notifications', {
                template: notification.template,
                recipients: notification.recipients,
                data: notification.data,
                metadata: {
                    ...notification.metadata,
                    source: 'learning-management-service',
                    sourceType: notification.sourceType || 'learning'
                },
                priority: notification.priority || 'normal',
                channels: notification.channels || ['email', 'in_app']
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Send content comment notification
     * @param {Object} params - Notification parameters
     */
    async sendContentCommentNotification({
        contentId,
        contentTitle,
        commentId,
        commentText,
        commenterId,
        commenterName,
        recipientId
    }) {
        await this.sendNotification({
            template: this.templates.CONTENT_COMMENT,
            recipients: [recipientId],
            data: {
                contentId,
                contentTitle,
                commentId,
                commentText,
                commenterId,
                commenterName
            },
            metadata: {
                contentId,
                commentId
            }
        });
    }

    /**
     * Send achievement unlocked notification
     * @param {Object} params - Notification parameters
     */
    async sendAchievementNotification({
        userId,
        achievementId,
        achievementTitle,
        achievementDescription,
        xpGained
    }) {
        await this.sendNotification({
            template: this.templates.ACHIEVEMENT_UNLOCKED,
            recipients: [userId],
            data: {
                achievementId,
                achievementTitle,
                achievementDescription,
                xpGained
            },
            metadata: {
                achievementId
            },
            priority: 'high'
        });
    }

    /**
     * Send level up notification
     * @param {Object} params - Notification parameters
     */
    async sendLevelUpNotification({
        userId,
        newLevel,
        xpGained,
        unlockedRewards
    }) {
        await this.sendNotification({
            template: this.templates.LEVEL_UP,
            recipients: [userId],
            data: {
                newLevel,
                xpGained,
                unlockedRewards
            },
            priority: 'high'
        });
    }

    /**
     * Send content mention notification
     * @param {Object} params - Notification parameters
     */
    async sendContentMentionNotification({
        contentId,
        contentTitle,
        mentionId,
        mentionText,
        mentionerId,
        mentionerName,
        recipientId
    }) {
        await this.sendNotification({
            template: this.templates.CONTENT_MENTION,
            recipients: [recipientId],
            data: {
                contentId,
                contentTitle,
                mentionId,
                mentionText,
                mentionerId,
                mentionerName
            },
            metadata: {
                contentId,
                mentionId
            }
        });
    }

    /**
     * Send content shared notification
     * @param {Object} params - Notification parameters
     */
    async sendContentSharedNotification({
        contentId,
        contentTitle,
        sharerId,
        sharerName,
        recipientId,
        message
    }) {
        await this.sendNotification({
            template: this.templates.CONTENT_SHARED,
            recipients: [recipientId],
            data: {
                contentId,
                contentTitle,
                sharerId,
                sharerName,
                message
            },
            metadata: {
                contentId
            }
        });
    }

    /**
     * Send skill milestone notification
     * @param {Object} params - Notification parameters
     */
    async sendSkillMilestoneNotification({
        userId,
        skill,
        newLevel,
        progress
    }) {
        await this.sendNotification({
            template: this.templates.SKILL_MILESTONE,
            recipients: [userId],
            data: {
                skill,
                newLevel,
                progress
            }
        });
    }

    /**
     * Send learning reminder notification
     * @param {Object} params - Notification parameters
     */
    async sendLearningReminderNotification({
        userId,
        contentId,
        contentTitle,
        daysInactive
    }) {
        await this.sendNotification({
            template: this.templates.LEARNING_REMINDER,
            recipients: [userId],
            data: {
                contentId,
                contentTitle,
                daysInactive
            },
            metadata: {
                contentId
            },
            channels: ['email', 'push']
        });
    }

    /**
     * Send course update notification
     * @param {Object} params - Notification parameters
     */
    async sendCourseUpdateNotification({
        courseId,
        courseTitle,
        updateType,
        updateDetails,
        recipientIds
    }) {
        await this.sendNotification({
            template: this.templates.COURSE_UPDATE,
            recipients: recipientIds,
            data: {
                courseId,
                courseTitle,
                updateType,
                updateDetails
            },
            metadata: {
                courseId
            }
        });
    }

    /**
     * Send assignment due notification
     * @param {Object} params - Notification parameters
     */
    async sendAssignmentDueNotification({
        assignmentId,
        assignmentTitle,
        dueDate,
        recipientId
    }) {
        await this.sendNotification({
            template: this.templates.ASSIGNMENT_DUE,
            recipients: [recipientId],
            data: {
                assignmentId,
                assignmentTitle,
                dueDate
            },
            metadata: {
                assignmentId
            },
            priority: 'high',
            channels: ['email', 'push', 'in_app']
        });
    }

    /**
     * Send batch notifications
     * @param {Array} notifications - Array of notifications
     * @returns {Promise<Array>} Notification responses
     */
    async sendBatchNotifications(notifications) {
        try {
            const response = await this.client.post('/notifications/batch', {
                notifications: notifications.map(notification => ({
                    template: notification.template,
                    recipients: notification.recipients,
                    data: notification.data,
                    metadata: {
                        ...notification.metadata,
                        source: 'learning-management-service',
                        sourceType: notification.sourceType || 'learning'
                    },
                    priority: notification.priority || 'normal',
                    channels: notification.channels || ['email', 'in_app']
                }))
            });

            return response.data;
        } catch (error) {
            logger.error('Error sending batch notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationClient();
