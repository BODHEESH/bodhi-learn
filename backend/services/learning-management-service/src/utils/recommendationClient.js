const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');

class RecommendationClient {
    constructor() {
        this.baseURL = config.services.recommendation.url;
        this.apiKey = config.services.recommendation.apiKey;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Update course in recommendation engine
     * @param {Object} course - Course data
     * @returns {Promise<Object>} Update result
     */
    async updateCourse(course) {
        try {
            const response = await this.client.post('/courses/update', {
                courseId: course.courseId,
                title: course.title,
                description: course.description,
                tags: course.tags,
                skills: course.skills,
                level: course.level,
                rating: course.rating,
                metadata: {
                    source: 'learning-management-service',
                    type: 'course'
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error updating course in recommendation engine:', error);
            throw error;
        }
    }

    /**
     * Update user preferences in recommendation engine
     * @param {Object} preferences - User preferences data
     * @returns {Promise<Object>} Update result
     */
    async updateUserPreferences(preferences) {
        try {
            const response = await this.client.post('/users/preferences', {
                userId: preferences.userId,
                interests: preferences.interests,
                skills: preferences.skills,
                learningStyle: preferences.learningStyle,
                preferredLevels: preferences.preferredLevels,
                metadata: {
                    source: 'learning-management-service',
                    type: 'user_preferences'
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Update user activity in recommendation engine
     * @param {Object} activity - User activity data
     * @returns {Promise<Object>} Update result
     */
    async updateUserActivity(activity) {
        try {
            const response = await this.client.post('/users/activity', {
                userId: activity.userId,
                activityType: activity.type,
                itemId: activity.itemId,
                itemType: activity.itemType,
                interaction: activity.interaction,
                duration: activity.duration,
                progress: activity.progress,
                metadata: {
                    source: 'learning-management-service',
                    type: 'user_activity'
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error updating user activity:', error);
            throw error;
        }
    }

    /**
     * Get course recommendations for user
     * @param {Object} params - Recommendation parameters
     * @returns {Promise<Object>} Recommendations
     */
    async getCourseRecommendations(params) {
        try {
            const response = await this.client.get('/recommendations/courses', {
                params: {
                    userId: params.userId,
                    limit: params.limit || 10,
                    offset: params.offset || 0,
                    filters: params.filters
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error getting course recommendations:', error);
            throw error;
        }
    }

    /**
     * Get mentor recommendations for user
     * @param {Object} params - Recommendation parameters
     * @returns {Promise<Object>} Recommendations
     */
    async getMentorRecommendations(params) {
        try {
            const response = await this.client.get('/recommendations/mentors', {
                params: {
                    userId: params.userId,
                    skills: params.skills,
                    limit: params.limit || 10,
                    offset: params.offset || 0,
                    filters: params.filters
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error getting mentor recommendations:', error);
            throw error;
        }
    }

    /**
     * Get study group recommendations for user
     * @param {Object} params - Recommendation parameters
     * @returns {Promise<Object>} Recommendations
     */
    async getStudyGroupRecommendations(params) {
        try {
            const response = await this.client.get('/recommendations/study-groups', {
                params: {
                    userId: params.userId,
                    interests: params.interests,
                    limit: params.limit || 10,
                    offset: params.offset || 0,
                    filters: params.filters
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error getting study group recommendations:', error);
            throw error;
        }
    }

    /**
     * Get content recommendations for user
     * @param {Object} params - Recommendation parameters
     * @returns {Promise<Object>} Recommendations
     */
    async getContentRecommendations(params) {
        try {
            const response = await this.client.get('/recommendations/content', {
                params: {
                    userId: params.userId,
                    contentType: params.contentType,
                    context: params.context,
                    limit: params.limit || 10,
                    offset: params.offset || 0,
                    filters: params.filters
                }
            });

            return response.data;
        } catch (error) {
            logger.error('Error getting content recommendations:', error);
            throw error;
        }
    }
}

module.exports = new RecommendationClient();
