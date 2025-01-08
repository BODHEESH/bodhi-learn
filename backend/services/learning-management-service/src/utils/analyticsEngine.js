const mongoose = require('mongoose');
const logger = require('../config/logger');

class AnalyticsEngine {
    /**
     * Get content analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Analytics data
     */
    async getContentAnalytics(query) {
        const {
            contentId,
            timeframe = '30d',
            organizationId,
            tenantId
        } = query;

        try {
            const timeframeStart = this.getTimeframeStart(timeframe);
            const matchStage = {
                createdAt: { $gte: timeframeStart }
            };

            if (contentId) matchStage.contentId = mongoose.Types.ObjectId(contentId);
            if (organizationId) matchStage.organizationId = organizationId;
            if (tenantId) matchStage.tenantId = tenantId;

            // Get view analytics
            const viewAnalytics = await mongoose.model('ContentView').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            contentId: '$contentId',
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        },
                        viewCount: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.contentId',
                        dailyViews: {
                            $push: {
                                date: '$_id.date',
                                views: '$viewCount',
                                uniqueUsers: { $size: '$uniqueUsers' }
                            }
                        },
                        totalViews: { $sum: '$viewCount' },
                        uniqueViewers: { $addToSet: '$uniqueUsers' }
                    }
                }
            ]);

            // Get completion analytics
            const completionAnalytics = await mongoose.model('ContentCompletion').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$contentId',
                        completions: { $sum: 1 },
                        averageScore: { $avg: '$score' },
                        averageTimeSpent: { $avg: '$timeSpent' }
                    }
                }
            ]);

            // Get engagement metrics
            const engagementAnalytics = await mongoose.model('ContentEngagement').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$contentId',
                        ratings: {
                            $push: '$rating'
                        },
                        comments: { $sum: 1 },
                        shares: { $sum: { $cond: ['$shared', 1, 0] } }
                    }
                },
                {
                    $project: {
                        ratings: 1,
                        comments: 1,
                        shares: 1,
                        averageRating: { $avg: '$ratings' }
                    }
                }
            ]);

            return {
                views: this.processViewAnalytics(viewAnalytics),
                completions: this.processCompletionAnalytics(completionAnalytics),
                engagement: this.processEngagementAnalytics(engagementAnalytics)
            };
        } catch (error) {
            logger.error('Error getting content analytics:', error);
            throw error;
        }
    }

    /**
     * Get media analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Analytics data
     */
    async getMediaAnalytics(query) {
        const {
            mediaId,
            timeframe = '30d',
            organizationId,
            tenantId
        } = query;

        try {
            const timeframeStart = this.getTimeframeStart(timeframe);
            const matchStage = {
                createdAt: { $gte: timeframeStart }
            };

            if (mediaId) matchStage.mediaId = mongoose.Types.ObjectId(mediaId);
            if (organizationId) matchStage.organizationId = organizationId;
            if (tenantId) matchStage.tenantId = tenantId;

            // Get view analytics
            const viewAnalytics = await mongoose.model('MediaView').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            mediaId: '$mediaId',
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        },
                        viewCount: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' },
                        totalDuration: { $sum: '$duration' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.mediaId',
                        dailyViews: {
                            $push: {
                                date: '$_id.date',
                                views: '$viewCount',
                                uniqueUsers: { $size: '$uniqueUsers' },
                                averageDuration: { $divide: ['$totalDuration', '$viewCount'] }
                            }
                        },
                        totalViews: { $sum: '$viewCount' },
                        uniqueViewers: { $addToSet: '$uniqueUsers' }
                    }
                }
            ]);

            // Get engagement analytics
            const engagementAnalytics = await mongoose.model('MediaEngagement').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$mediaId',
                        downloads: { $sum: 1 },
                        shares: { $sum: { $cond: ['$shared', 1, 0] } },
                        annotations: { $sum: { $size: '$annotations' } }
                    }
                }
            ]);

            return {
                views: this.processMediaViewAnalytics(viewAnalytics),
                engagement: this.processMediaEngagementAnalytics(engagementAnalytics)
            };
        } catch (error) {
            logger.error('Error getting media analytics:', error);
            throw error;
        }
    }

    /**
     * Get user analytics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Analytics data
     */
    async getUserAnalytics(query) {
        const {
            userId,
            timeframe = '30d',
            organizationId,
            tenantId
        } = query;

        try {
            const timeframeStart = this.getTimeframeStart(timeframe);
            const matchStage = {
                createdAt: { $gte: timeframeStart }
            };

            if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
            if (organizationId) matchStage.organizationId = organizationId;
            if (tenantId) matchStage.tenantId = tenantId;

            // Get learning progress
            const progressAnalytics = await mongoose.model('UserProgress').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$userId',
                        contentCompleted: { $sum: 1 },
                        averageScore: { $avg: '$score' },
                        totalTimeSpent: { $sum: '$timeSpent' },
                        skillProgress: {
                            $push: {
                                skill: '$skill',
                                level: '$level',
                                progress: '$progress'
                            }
                        }
                    }
                }
            ]);

            // Get engagement metrics
            const engagementAnalytics = await mongoose.model('UserEngagement').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$userId',
                        comments: { $sum: 1 },
                        ratings: { $sum: 1 },
                        shares: { $sum: 1 },
                        annotations: { $sum: 1 }
                    }
                }
            ]);

            return {
                progress: this.processUserProgressAnalytics(progressAnalytics),
                engagement: this.processUserEngagementAnalytics(engagementAnalytics)
            };
        } catch (error) {
            logger.error('Error getting user analytics:', error);
            throw error;
        }
    }

    /**
     * Get timeframe start date
     * @param {string} timeframe - Timeframe string
     * @returns {Date} Start date
     */
    getTimeframeStart(timeframe) {
        const now = new Date();
        const [value, unit] = timeframe.match(/(\d+)([dhm])/).slice(1);
        
        switch (unit) {
            case 'd':
                now.setDate(now.getDate() - parseInt(value));
                break;
            case 'h':
                now.setHours(now.getHours() - parseInt(value));
                break;
            case 'm':
                now.setMonth(now.getMonth() - parseInt(value));
                break;
        }

        return now;
    }

    /**
     * Process view analytics data
     * @param {Array} analytics - Raw analytics data
     * @returns {Object} Processed analytics
     */
    processViewAnalytics(analytics) {
        return analytics.map(item => ({
            contentId: item._id,
            totalViews: item.totalViews,
            uniqueViewers: item.uniqueViewers.flat().length,
            dailyStats: item.dailyViews.sort((a, b) => a.date.localeCompare(b.date))
        }));
    }

    /**
     * Process completion analytics data
     * @param {Array} analytics - Raw analytics data
     * @returns {Object} Processed analytics
     */
    processCompletionAnalytics(analytics) {
        return analytics.map(item => ({
            contentId: item._id,
            totalCompletions: item.completions,
            averageScore: Math.round(item.averageScore * 100) / 100,
            averageTimeSpent: Math.round(item.averageTimeSpent)
        }));
    }

    /**
     * Process engagement analytics data
     * @param {Array} analytics - Raw analytics data
     * @returns {Object} Processed analytics
     */
    processEngagementAnalytics(analytics) {
        return analytics.map(item => ({
            contentId: item._id,
            totalComments: item.comments,
            totalShares: item.shares,
            averageRating: Math.round(item.averageRating * 10) / 10,
            ratingDistribution: this.calculateRatingDistribution(item.ratings)
        }));
    }

    /**
     * Process media view analytics data
     * @param {Array} analytics - Raw analytics data
     * @returns {Object} Processed analytics
     */
    processMediaViewAnalytics(analytics) {
        return analytics.map(item => ({
            mediaId: item._id,
            totalViews: item.totalViews,
            uniqueViewers: item.uniqueViewers.flat().length,
            dailyStats: item.dailyViews.sort((a, b) => a.date.localeCompare(b.date))
        }));
    }

    /**
     * Process media engagement analytics data
     * @param {Array} analytics - Raw analytics data
     * @returns {Object} Processed analytics
     */
    processMediaEngagementAnalytics(analytics) {
        return analytics.map(item => ({
            mediaId: item._id,
            totalDownloads: item.downloads,
            totalShares: item.shares,
            totalAnnotations: item.annotations
        }));
    }

    /**
     * Calculate rating distribution
     * @param {Array} ratings - Array of ratings
     * @returns {Object} Rating distribution
     */
    calculateRatingDistribution(ratings) {
        const distribution = {};
        ratings.forEach(rating => {
            distribution[rating] = (distribution[rating] || 0) + 1;
        });
        return distribution;
    }
}

module.exports = new AnalyticsEngine();
