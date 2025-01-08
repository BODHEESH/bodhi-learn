const httpStatus = require('http-status');
const Content = require('../models/content.model');
const ApiError = require('../../../utils/ApiError');
const { getPagination } = require('../../../utils/pagination');

class ContentService {
    /**
     * Create content
     * @param {Object} contentBody
     * @returns {Promise<Content>}
     */
    async createContent(contentBody) {
        const content = await Content.create(contentBody);
        return content;
    }

    /**
     * Query for contents
     * @param {Object} filter - Mongo filter
     * @param {Object} options - Query options
     * @returns {Promise<QueryResult>}
     */
    async queryContents(filter, options) {
        const { limit, page, sortBy } = options;
        const contents = await Content.find(filter)
            .sort(sortBy)
            .skip(page * limit)
            .limit(limit)
            .populate('metadata.author', 'name email')
            .populate('metadata.contributors', 'name email')
            .populate('category', 'name');

        const totalResults = await Content.countDocuments(filter);
        const pagination = getPagination(page, limit, totalResults);

        return {
            results: contents,
            pagination
        };
    }

    /**
     * Get content by id
     * @param {ObjectId} id
     * @param {Object} options - Query options
     * @returns {Promise<Content>}
     */
    async getContentById(id, options = {}) {
        const content = await Content.findById(id)
            .populate('metadata.author', 'name email')
            .populate('metadata.contributors', 'name email')
            .populate('category', 'name');
        if (!content) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Content not found');
        }
        return content;
    }

    /**
     * Update content by id
     * @param {ObjectId} contentId
     * @param {Object} updateBody
     * @returns {Promise<Content>}
     */
    async updateContent(contentId, updateBody) {
        const content = await this.getContentById(contentId);
        
        if (updateBody.version) {
            content.version = {
                ...content.version,
                ...updateBody.version
            };
            delete updateBody.version;
        }

        Object.assign(content, updateBody);
        await content.save();
        return content;
    }

    /**
     * Delete content by id
     * @param {ObjectId} contentId
     * @returns {Promise<Content>}
     */
    async deleteContent(contentId) {
        const content = await this.getContentById(contentId);
        await content.remove();
        return content;
    }

    /**
     * Publish content
     * @param {ObjectId} contentId
     * @param {ObjectId} reviewerId
     * @returns {Promise<Content>}
     */
    async publishContent(contentId, reviewerId) {
        const content = await this.getContentById(contentId);
        await content.publish(reviewerId);
        return content;
    }

    /**
     * Archive content
     * @param {ObjectId} contentId
     * @returns {Promise<Content>}
     */
    async archiveContent(contentId) {
        const content = await this.getContentById(contentId);
        content.status = 'archived';
        content.archivedAt = new Date();
        await content.save();
        return content;
    }

    /**
     * Add content block
     * @param {ObjectId} contentId
     * @param {Object} blockData
     * @returns {Promise<Content>}
     */
    async addContentBlock(contentId, blockData) {
        const content = await this.getContentById(contentId);
        content.blocks.push(blockData);
        await content.save();
        return content;
    }

    /**
     * Update content block
     * @param {ObjectId} contentId
     * @param {ObjectId} blockId
     * @param {Object} blockData
     * @returns {Promise<Content>}
     */
    async updateContentBlock(contentId, blockId, blockData) {
        const content = await this.getContentById(contentId);
        const blockIndex = content.blocks.findIndex(block => block._id.equals(blockId));
        if (blockIndex === -1) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Content block not found');
        }
        content.blocks[blockIndex] = { ...content.blocks[blockIndex].toObject(), ...blockData };
        await content.save();
        return content;
    }

    /**
     * Delete content block
     * @param {ObjectId} contentId
     * @param {ObjectId} blockId
     * @returns {Promise<Content>}
     */
    async deleteContentBlock(contentId, blockId) {
        const content = await this.getContentById(contentId);
        const blockIndex = content.blocks.findIndex(block => block._id.equals(blockId));
        if (blockIndex === -1) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Content block not found');
        }
        content.blocks.splice(blockIndex, 1);
        await content.save();
        return content;
    }

    /**
     * Record content view
     * @param {ObjectId} contentId
     * @param {ObjectId} userId
     * @returns {Promise<Content>}
     */
    async recordView(contentId, userId) {
        const content = await this.getContentById(contentId);
        await content.incrementViews(userId);
        return content;
    }

    /**
     * Add content rating
     * @param {ObjectId} contentId
     * @param {number} rating
     * @returns {Promise<Content>}
     */
    async addRating(contentId, rating) {
        const content = await this.getContentById(contentId);
        await content.updateRating(rating);
        return content;
    }

    /**
     * Record content completion
     * @param {ObjectId} contentId
     * @param {number} timeSpent
     * @returns {Promise<Content>}
     */
    async recordCompletion(contentId, timeSpent) {
        const content = await this.getContentById(contentId);
        await content.recordCompletion(timeSpent);
        return content;
    }
}

module.exports = new ContentService();
