const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config');

class ModerationClient {
    constructor() {
        this.baseURL = config.moderationService.baseURL;
        this.apiKey = config.moderationService.apiKey;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check content for moderation
     * @param {Object} content - Content to moderate
     * @returns {Promise<Object>} Moderation result
     */
    async checkContent(content) {
        try {
            const response = await this.client.post('/moderate/content', {
                text: content.text,
                type: content.type,
                userId: content.userId,
                contextId: content.contextId,
                contextType: content.contextType,
                metadata: {
                    ...content.metadata,
                    source: 'learning-management-service'
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error checking content moderation:', error);
            throw error;
        }
    }

    /**
     * Report content for moderation
     * @param {Object} report - Report data
     * @returns {Promise<Object>} Report result
     */
    async reportContent(report) {
        try {
            const response = await this.client.post('/reports', {
                contentId: report.contentId,
                contentType: report.contentType,
                reportType: report.reportType,
                reporterId: report.reporterId,
                reason: report.reason,
                details: report.details,
                metadata: {
                    ...report.metadata,
                    source: 'learning-management-service'
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error reporting content:', error);
            throw error;
        }
    }

    /**
     * Get content moderation status
     * @param {string} contentId - Content ID
     * @param {string} contentType - Content type
     * @returns {Promise<Object>} Moderation status
     */
    async getContentModerationStatus(contentId, contentType) {
        try {
            const response = await this.client.get(`/moderate/status/${contentType}/${contentId}`);
            return response.data;
        } catch (error) {
            logger.error('Error getting content moderation status:', error);
            throw error;
        }
    }

    /**
     * Check batch content for moderation
     * @param {Array} contents - Array of content to moderate
     * @returns {Promise<Array>} Moderation results
     */
    async checkBatchContent(contents) {
        try {
            const response = await this.client.post('/moderate/batch', {
                contents: contents.map(content => ({
                    text: content.text,
                    type: content.type,
                    userId: content.userId,
                    contextId: content.contextId,
                    contextType: content.contextType,
                    metadata: {
                        ...content.metadata,
                        source: 'learning-management-service'
                    }
                }))
            });

            return response.data;
        } catch (error) {
            logger.error('Error checking batch content moderation:', error);
            throw error;
        }
    }
}

module.exports = new ModerationClient();
