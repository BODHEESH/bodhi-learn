const mongoose = require('mongoose');
const logger = require('../config/logger');

class GamificationEngine {
    constructor() {
        this.achievementTypes = {
            CONTENT_COMPLETION: 'content_completion',
            STREAK_MILESTONE: 'streak_milestone',
            SKILL_LEVEL: 'skill_level',
            ENGAGEMENT: 'engagement',
            CONTRIBUTION: 'contribution'
        };

        this.levelThresholds = [
            0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000
        ];
    }

    /**
     * Calculate user level based on XP
     * @param {number} xp - Experience points
     * @returns {Object} Level information
     */
    calculateLevel(xp) {
        let level = 0;
        for (let i = 0; i < this.levelThresholds.length; i++) {
            if (xp >= this.levelThresholds[i]) {
                level = i + 1;
            } else {
                break;
            }
        }

        const currentLevelXP = this.levelThresholds[level - 1] || 0;
        const nextLevelXP = this.levelThresholds[level] || currentLevelXP;
        const progress = nextLevelXP > currentLevelXP
            ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
            : 100;

        return {
            level,
            xp,
            nextLevelXP,
            progress: Math.round(progress)
        };
    }

    /**
     * Award XP for an action
     * @param {string} userId - User ID
     * @param {string} action - Action type
     * @param {Object} details - Action details
     * @returns {Promise<Object>} Updated user stats
     */
    async awardXP(userId, action, details = {}) {
        try {
            let xpAmount = 0;

            // Calculate XP based on action
            switch (action) {
                case 'content_completion':
                    xpAmount = this.calculateContentCompletionXP(details.score, details.difficulty);
                    break;
                case 'streak_continuation':
                    xpAmount = this.calculateStreakXP(details.streakDays);
                    break;
                case 'contribution':
                    xpAmount = this.calculateContributionXP(details.type);
                    break;
                case 'skill_milestone':
                    xpAmount = this.calculateSkillMilestoneXP(details.level);
                    break;
            }

            // Update user stats
            const userStats = await mongoose.model('UserStats').findOneAndUpdate(
                { userId },
                {
                    $inc: { xp: xpAmount },
                    $set: { lastActivityAt: new Date() }
                },
                { new: true, upsert: true }
            );

            // Check for level up
            const newLevel = this.calculateLevel(userStats.xp);
            if (newLevel.level > userStats.level) {
                await this.handleLevelUp(userId, newLevel.level);
            }

            return newLevel;
        } catch (error) {
            logger.error('Error awarding XP:', error);
            throw error;
        }
    }

    /**
     * Calculate XP for content completion
     * @param {number} score - Completion score
     * @param {string} difficulty - Content difficulty
     * @returns {number} XP amount
     */
    calculateContentCompletionXP(score, difficulty) {
        const baseXP = {
            beginner: 10,
            intermediate: 20,
            advanced: 30
        }[difficulty] || 10;

        return Math.round(baseXP * (score / 100));
    }

    /**
     * Calculate XP for streak continuation
     * @param {number} streakDays - Current streak days
     * @returns {number} XP amount
     */
    calculateStreakXP(streakDays) {
        const baseXP = 5;
        const bonus = Math.floor(streakDays / 7) * 10;
        return baseXP + bonus;
    }

    /**
     * Calculate XP for contributions
     * @param {string} type - Contribution type
     * @returns {number} XP amount
     */
    calculateContributionXP(type) {
        const xpValues = {
            comment: 2,
            rating: 1,
            annotation: 3,
            question: 5,
            answer: 10
        };
        return xpValues[type] || 1;
    }

    /**
     * Calculate XP for skill milestones
     * @param {string} level - Skill level achieved
     * @returns {number} XP amount
     */
    calculateSkillMilestoneXP(level) {
        const xpValues = {
            beginner: 50,
            intermediate: 100,
            advanced: 200
        };
        return xpValues[level] || 50;
    }

    /**
     * Handle user level up
     * @param {string} userId - User ID
     * @param {number} newLevel - New level achieved
     * @returns {Promise<void>}
     */
    async handleLevelUp(userId, newLevel) {
        try {
            // Update user stats
            await mongoose.model('UserStats').updateOne(
                { userId },
                { $set: { level: newLevel } }
            );

            // Create achievement
            await this.createAchievement(userId, {
                type: 'level_up',
                level: newLevel,
                title: `Reached Level ${newLevel}`,
                description: `Congratulations on reaching level ${newLevel}!`,
                xpBonus: newLevel * 10
            });

            // Unlock rewards if any
            await this.unlockLevelRewards(userId, newLevel);
        } catch (error) {
            logger.error('Error handling level up:', error);
            throw error;
        }
    }

    /**
     * Create achievement
     * @param {string} userId - User ID
     * @param {Object} achievement - Achievement details
     * @returns {Promise<Object>} Created achievement
     */
    async createAchievement(userId, achievement) {
        try {
            const newAchievement = await mongoose.model('Achievement').create({
                userId,
                type: achievement.type,
                title: achievement.title,
                description: achievement.description,
                xpBonus: achievement.xpBonus,
                metadata: achievement.metadata,
                unlockedAt: new Date()
            });

            // Award bonus XP
            if (achievement.xpBonus) {
                await this.awardXP(userId, 'achievement_bonus', {
                    amount: achievement.xpBonus
                });
            }

            return newAchievement;
        } catch (error) {
            logger.error('Error creating achievement:', error);
            throw error;
        }
    }

    /**
     * Unlock level rewards
     * @param {string} userId - User ID
     * @param {number} level - User level
     * @returns {Promise<Array>} Unlocked rewards
     */
    async unlockLevelRewards(userId, level) {
        try {
            const rewards = await mongoose.model('Reward').find({
                levelRequired: { $lte: level },
                'unlockedBy.userId': { $ne: userId }
            });

            const unlockedRewards = await Promise.all(
                rewards.map(async (reward) => {
                    await mongoose.model('Reward').updateOne(
                        { _id: reward._id },
                        {
                            $push: {
                                unlockedBy: {
                                    userId,
                                    unlockedAt: new Date()
                                }
                            }
                        }
                    );
                    return reward;
                })
            );

            return unlockedRewards;
        } catch (error) {
            logger.error('Error unlocking rewards:', error);
            throw error;
        }
    }

    /**
     * Get user leaderboard
     * @param {Object} options - Leaderboard options
     * @returns {Promise<Array>} Leaderboard entries
     */
    async getLeaderboard(options = {}) {
        const {
            timeframe = 'all',
            scope = 'global',
            limit = 10,
            organizationId,
            tenantId
        } = options;

        try {
            const query = {};
            
            // Apply organization/tenant filters
            if (scope === 'organization' && organizationId) {
                query.organizationId = organizationId;
            }
            if (scope === 'tenant' && tenantId) {
                query.tenantId = tenantId;
            }

            // Apply timeframe filter
            if (timeframe !== 'all') {
                const timeframeStart = new Date();
                switch (timeframe) {
                    case 'daily':
                        timeframeStart.setHours(0, 0, 0, 0);
                        break;
                    case 'weekly':
                        timeframeStart.setDate(timeframeStart.getDate() - 7);
                        break;
                    case 'monthly':
                        timeframeStart.setMonth(timeframeStart.getMonth() - 1);
                        break;
                }
                query.lastActivityAt = { $gte: timeframeStart };
            }

            const leaderboard = await mongoose.model('UserStats')
                .find(query)
                .sort({ xp: -1 })
                .limit(limit)
                .populate('userId', 'name avatar');

            return leaderboard.map((entry, index) => ({
                rank: index + 1,
                user: entry.userId,
                xp: entry.xp,
                level: entry.level
            }));
        } catch (error) {
            logger.error('Error getting leaderboard:', error);
            throw error;
        }
    }
}

module.exports = new GamificationEngine();
