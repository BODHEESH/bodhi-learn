const mongoose = require('mongoose');
const logger = require('../config/logger');
const metrics = require('../utils/metrics');
const recommendationEngine = require('../utils/recommendationEngine');

class ProgressTracker {
    /**
     * Track content view
     * @param {string} userId - User ID
     * @param {string} contentId - Content ID
     * @returns {Promise<void>}
     */
    async trackContentView(userId, contentId) {
        try {
            const content = await mongoose.model('Content').findById(contentId);
            if (!content) return;

            // Update content stats
            await mongoose.model('Content').updateOne(
                { _id: contentId },
                { $inc: { 'stats.viewCount': 1 } }
            );

            // Record user progress
            await mongoose.model('UserProgress').findOneAndUpdate(
                { userId, contentId },
                {
                    $inc: { viewCount: 1 },
                    $set: { lastViewedAt: new Date() }
                },
                { upsert: true }
            );

            // Record metrics
            metrics.recordContentView(content.type, content.organizationId, content.tenantId);

        } catch (error) {
            logger.error('Error tracking content view:', error);
            throw error;
        }
    }

    /**
     * Track content completion
     * @param {string} userId - User ID
     * @param {string} contentId - Content ID
     * @param {number} score - Completion score
     * @returns {Promise<void>}
     */
    async trackContentCompletion(userId, contentId, score) {
        try {
            const content = await mongoose.model('Content').findById(contentId);
            if (!content) return;

            // Update content stats
            await mongoose.model('Content').updateOne(
                { _id: contentId },
                { 
                    $inc: { 
                        'stats.completionCount': 1,
                        'stats.totalScore': score
                    },
                    $set: {
                        'stats.averageScore': {
                            $divide: [
                                { $add: ['$stats.totalScore', score] },
                                { $add: ['$stats.completionCount', 1] }
                            ]
                        }
                    }
                }
            );

            // Record user progress
            await mongoose.model('UserProgress').findOneAndUpdate(
                { userId, contentId },
                {
                    $set: {
                        status: 'completed',
                        score,
                        completedAt: new Date()
                    }
                },
                { upsert: true }
            );

            // Update user profile
            await this.updateUserProgress(userId);

            // Update recommendations
            await recommendationEngine.updateUserInterests(userId);

        } catch (error) {
            logger.error('Error tracking content completion:', error);
            throw error;
        }
    }

    /**
     * Track media view
     * @param {string} userId - User ID
     * @param {string} mediaId - Media ID
     * @returns {Promise<void>}
     */
    async trackMediaView(userId, mediaId) {
        try {
            const media = await mongoose.model('Media').findById(mediaId);
            if (!media) return;

            // Update media stats
            await mongoose.model('Media').updateOne(
                { _id: mediaId },
                { $inc: { 'stats.viewCount': 1 } }
            );

            // Record view
            await mongoose.model('MediaView').create({
                userId,
                mediaId,
                timestamp: new Date()
            });

            // Record metrics
            metrics.recordMediaView(media.type, media.organizationId, media.tenantId);

        } catch (error) {
            logger.error('Error tracking media view:', error);
            throw error;
        }
    }

    /**
     * Update user progress
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async updateUserProgress(userId) {
        try {
            // Get user's completed content
            const completedContent = await mongoose.model('UserProgress')
                .find({
                    userId,
                    status: 'completed'
                })
                .populate('contentId');

            // Calculate skill levels
            const skillProgress = {};
            completedContent.forEach(progress => {
                const content = progress.contentId;
                if (content?.metadata?.skills) {
                    content.metadata.skills.forEach(skill => {
                        if (!skillProgress[skill]) {
                            skillProgress[skill] = {
                                count: 0,
                                totalScore: 0
                            };
                        }
                        skillProgress[skill].count += 1;
                        skillProgress[skill].totalScore += progress.score || 0;
                    });
                }
            });

            // Calculate skill levels
            const skillLevels = {};
            Object.entries(skillProgress).forEach(([skill, progress]) => {
                const averageScore = progress.totalScore / progress.count;
                if (progress.count >= 10 && averageScore >= 80) {
                    skillLevels[skill] = 'advanced';
                } else if (progress.count >= 5 && averageScore >= 60) {
                    skillLevels[skill] = 'intermediate';
                } else {
                    skillLevels[skill] = 'beginner';
                }
            });

            // Update user profile
            await mongoose.model('UserProfile').findOneAndUpdate(
                { userId },
                { $set: { skillLevels } },
                { upsert: true }
            );

        } catch (error) {
            logger.error('Error updating user progress:', error);
            throw error;
        }
    }
}

const progressTracker = new ProgressTracker();

/**
 * Middleware to track content views
 */
const trackContentView = async (req, res, next) => {
    try {
        if (req.params.contentId) {
            await progressTracker.trackContentView(req.user.id, req.params.contentId);
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to track content completion
 */
const trackContentCompletion = async (req, res, next) => {
    try {
        if (req.params.contentId) {
            await progressTracker.trackContentCompletion(
                req.user.id,
                req.params.contentId,
                req.body.score
            );
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware to track media views
 */
const trackMediaView = async (req, res, next) => {
    try {
        if (req.params.mediaId) {
            await progressTracker.trackMediaView(req.user.id, req.params.mediaId);
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    trackContentView,
    trackContentCompletion,
    trackMediaView,
    progressTracker
};
