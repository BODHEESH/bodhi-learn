const mongoose = require('mongoose');
const logger = require('../config/logger');

class RecommendationEngine {
    /**
     * Get content recommendations for a user
     * @param {string} userId - User ID
     * @param {Object} options - Recommendation options
     * @returns {Promise<Array>}
     */
    async getContentRecommendations(userId, options = {}) {
        const {
            limit = 10,
            includeTypes = ['article', 'video', 'quiz'],
            excludeCompleted = true
        } = options;

        try {
            // Get user's learning history
            const userHistory = await mongoose.model('UserProgress').find({ userId });
            
            // Get user's interests and skill levels
            const userProfile = await mongoose.model('UserProfile').findOne({ userId });
            
            // Build recommendation pipeline
            const pipeline = [
                // Match content types and status
                {
                    $match: {
                        type: { $in: includeTypes },
                        status: 'published',
                        organizationId: userProfile.organizationId,
                        tenantId: userProfile.tenantId
                    }
                }
            ];

            // Exclude completed content if requested
            if (excludeCompleted) {
                const completedContentIds = userHistory
                    .filter(h => h.status === 'completed')
                    .map(h => h.contentId);
                pipeline.push({
                    $match: {
                        _id: { $nin: completedContentIds }
                    }
                });
            }

            // Match user's skill level
            if (userProfile.skillLevels) {
                pipeline.push({
                    $match: {
                        'metadata.difficulty': {
                            $in: this.getAppropriateSkillLevels(userProfile.skillLevels)
                        }
                    }
                });
            }

            // Score based on user interests
            if (userProfile.interests) {
                pipeline.push({
                    $addFields: {
                        interestScore: {
                            $size: {
                                $setIntersection: ['$metadata.tags', userProfile.interests]
                            }
                        }
                    }
                });
            }

            // Add popularity score
            pipeline.push({
                $addFields: {
                    popularityScore: {
                        $add: [
                            { $ifNull: ['$stats.viewCount', 0] },
                            { $multiply: [{ $ifNull: ['$stats.ratingAverage', 0] }, 10] },
                            { $multiply: [{ $ifNull: ['$stats.completionCount', 0] }, 2] }
                        ]
                    }
                }
            });

            // Calculate final score
            pipeline.push({
                $addFields: {
                    finalScore: {
                        $add: [
                            { $ifNull: ['$interestScore', 0] },
                            { $divide: ['$popularityScore', 100] }
                        ]
                    }
                }
            });

            // Sort and limit results
            pipeline.push(
                { $sort: { finalScore: -1 } },
                { $limit: limit }
            );

            // Execute pipeline
            const recommendations = await mongoose.model('Content').aggregate(pipeline);

            return recommendations;
        } catch (error) {
            logger.error('Error getting content recommendations:', error);
            throw error;
        }
    }

    /**
     * Get media recommendations for a user
     * @param {string} userId - User ID
     * @param {Object} options - Recommendation options
     * @returns {Promise<Array>}
     */
    async getMediaRecommendations(userId, options = {}) {
        const {
            limit = 10,
            includeTypes = ['video', 'audio', 'document'],
            excludeViewed = false
        } = options;

        try {
            // Get user's viewing history
            const userHistory = await mongoose.model('MediaView').find({ userId });
            
            // Get user's profile
            const userProfile = await mongoose.model('UserProfile').findOne({ userId });

            // Build recommendation pipeline
            const pipeline = [
                // Match media types
                {
                    $match: {
                        type: { $in: includeTypes },
                        organizationId: userProfile.organizationId,
                        tenantId: userProfile.tenantId
                    }
                }
            ];

            // Exclude viewed media if requested
            if (excludeViewed) {
                const viewedMediaIds = userHistory.map(h => h.mediaId);
                pipeline.push({
                    $match: {
                        _id: { $nin: viewedMediaIds }
                    }
                });
            }

            // Score based on user interests
            if (userProfile.interests) {
                pipeline.push({
                    $addFields: {
                        interestScore: {
                            $size: {
                                $setIntersection: ['$metadata.tags', userProfile.interests]
                            }
                        }
                    }
                });
            }

            // Add popularity score
            pipeline.push({
                $addFields: {
                    popularityScore: {
                        $add: [
                            { $ifNull: ['$stats.viewCount', 0] },
                            { $multiply: [{ $ifNull: ['$stats.rating', 0] }, 10] },
                            { $multiply: [{ $ifNull: ['$stats.downloadCount', 0] }, 2] }
                        ]
                    }
                }
            });

            // Calculate final score
            pipeline.push({
                $addFields: {
                    finalScore: {
                        $add: [
                            { $ifNull: ['$interestScore', 0] },
                            { $divide: ['$popularityScore', 100] }
                        ]
                    }
                }
            });

            // Sort and limit results
            pipeline.push(
                { $sort: { finalScore: -1 } },
                { $limit: limit }
            );

            // Execute pipeline
            const recommendations = await mongoose.model('Media').aggregate(pipeline);

            return recommendations;
        } catch (error) {
            logger.error('Error getting media recommendations:', error);
            throw error;
        }
    }

    /**
     * Get appropriate skill levels based on user's current skills
     * @param {Object} userSkills - User's skill levels
     * @returns {Array<string>}
     */
    getAppropriateSkillLevels(userSkills) {
        const skillLevels = ['beginner', 'intermediate', 'advanced'];
        const appropriateLevels = new Set();

        Object.values(userSkills).forEach(level => {
            const currentIndex = skillLevels.indexOf(level);
            // Include current level and one level above
            appropriateLevels.add(level);
            if (currentIndex < skillLevels.length - 1) {
                appropriateLevels.add(skillLevels[currentIndex + 1]);
            }
        });

        return Array.from(appropriateLevels);
    }

    /**
     * Update user interests based on activity
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async updateUserInterests(userId) {
        try {
            // Get user's recent activity
            const recentContent = await mongoose.model('UserProgress')
                .find({ userId })
                .sort({ updatedAt: -1 })
                .limit(50)
                .populate('contentId');

            const recentMedia = await mongoose.model('MediaView')
                .find({ userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('mediaId');

            // Extract and count tags
            const tagCounts = {};
            
            // Process content tags
            recentContent.forEach(progress => {
                if (progress.contentId?.metadata?.tags) {
                    progress.contentId.metadata.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });

            // Process media tags
            recentMedia.forEach(view => {
                if (view.mediaId?.metadata?.tags) {
                    view.mediaId.metadata.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });

            // Sort tags by frequency
            const topTags = Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([tag]) => tag);

            // Update user profile
            await mongoose.model('UserProfile').findOneAndUpdate(
                { userId },
                { $set: { interests: topTags } },
                { new: true }
            );
        } catch (error) {
            logger.error('Error updating user interests:', error);
            throw error;
        }
    }
}

module.exports = new RecommendationEngine();
