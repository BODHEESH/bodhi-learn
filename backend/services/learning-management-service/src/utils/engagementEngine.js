const mongoose = require('mongoose');
const logger = require('../config/logger');
const notificationClient = require('./notificationClient');
const recommendationEngine = require('./recommendationEngine');
const moderationClient = require('./moderationClient');

class EngagementEngine {
    constructor() {
        this.engagementTypes = {
            LIKE: 'like',
            COMMENT: 'comment',
            SHARE: 'share',
            BOOKMARK: 'bookmark',
            FOLLOW: 'follow',
            MENTION: 'mention'
        };

        this.mentorshipTypes = {
            FORMAL: 'formal',
            PEER: 'peer',
            GROUP: 'group'
        };
    }

    /**
     * Record user engagement
     * @param {Object} engagement - Engagement data
     * @returns {Promise<Object>} Created engagement
     */
    async recordEngagement(engagement) {
        try {
            // Check content moderation if needed
            if (engagement.type === this.engagementTypes.COMMENT) {
                const moderationResult = await moderationClient.checkContent({
                    text: engagement.content,
                    type: 'comment',
                    userId: engagement.userId
                });

                if (!moderationResult.approved) {
                    throw new Error('Content violates community guidelines');
                }
            }

            // Create engagement record
            const engagementRecord = await mongoose.model('Engagement').create({
                userId: engagement.userId,
                targetId: engagement.targetId,
                targetType: engagement.targetType,
                type: engagement.type,
                content: engagement.content,
                metadata: engagement.metadata
            });

            // Update engagement stats
            await this.updateEngagementStats(engagement);

            // Process notifications
            await this.processEngagementNotifications(engagement);

            return engagementRecord;
        } catch (error) {
            logger.error('Error recording engagement:', error);
            throw error;
        }
    }

    /**
     * Update engagement statistics
     * @param {Object} engagement - Engagement data
     * @returns {Promise<void>}
     */
    async updateEngagementStats(engagement) {
        try {
            const update = {
                $inc: {
                    [`stats.${engagement.type}Count`]: 1,
                    'stats.totalEngagements': 1
                },
                $set: {
                    lastEngagementAt: new Date()
                }
            };

            // Update content stats
            await mongoose.model('Content').findByIdAndUpdate(
                engagement.targetId,
                update
            );

            // Update user stats
            await mongoose.model('UserStats').findOneAndUpdate(
                { userId: engagement.userId },
                update
            );
        } catch (error) {
            logger.error('Error updating engagement stats:', error);
            throw error;
        }
    }

    /**
     * Process engagement notifications
     * @param {Object} engagement - Engagement data
     * @returns {Promise<void>}
     */
    async processEngagementNotifications(engagement) {
        try {
            const content = await mongoose.model('Content').findById(engagement.targetId);
            const user = await mongoose.model('User').findById(engagement.userId);

            switch (engagement.type) {
                case this.engagementTypes.COMMENT:
                    await notificationClient.sendContentCommentNotification({
                        contentId: content._id,
                        contentTitle: content.title,
                        commentId: engagement._id,
                        commentText: engagement.content,
                        commenterId: user._id,
                        commenterName: user.name,
                        recipientId: content.creatorId
                    });
                    break;

                case this.engagementTypes.MENTION:
                    await notificationClient.sendContentMentionNotification({
                        contentId: content._id,
                        contentTitle: content.title,
                        mentionId: engagement._id,
                        mentionText: engagement.content,
                        mentionerId: user._id,
                        mentionerName: user.name,
                        recipientId: engagement.metadata.mentionedUserId
                    });
                    break;

                case this.engagementTypes.SHARE:
                    await notificationClient.sendContentSharedNotification({
                        contentId: content._id,
                        contentTitle: content.title,
                        sharerId: user._id,
                        sharerName: user.name,
                        recipientId: content.creatorId,
                        message: engagement.content
                    });
                    break;
            }
        } catch (error) {
            logger.error('Error processing engagement notifications:', error);
            throw error;
        }
    }

    /**
     * Create mentorship relationship
     * @param {Object} mentorship - Mentorship data
     * @returns {Promise<Object>} Created mentorship
     */
    async createMentorship(mentorship) {
        try {
            const mentorshipRecord = await mongoose.model('Mentorship').create({
                mentorId: mentorship.mentorId,
                menteeId: mentorship.menteeId,
                type: mentorship.type,
                goals: mentorship.goals,
                duration: mentorship.duration,
                schedule: mentorship.schedule,
                status: 'pending',
                metadata: mentorship.metadata
            });

            // Notify mentor
            await notificationClient.sendNotification({
                template: 'mentorship_request',
                recipients: [mentorship.mentorId],
                data: {
                    mentorshipId: mentorshipRecord._id,
                    menteeId: mentorship.menteeId,
                    type: mentorship.type,
                    goals: mentorship.goals
                },
                priority: 'high'
            });

            return mentorshipRecord;
        } catch (error) {
            logger.error('Error creating mentorship:', error);
            throw error;
        }
    }

    /**
     * Update mentorship status
     * @param {Object} update - Mentorship update data
     * @returns {Promise<Object>} Updated mentorship
     */
    async updateMentorshipStatus(update) {
        try {
            const mentorship = await mongoose.model('Mentorship').findByIdAndUpdate(
                update.mentorshipId,
                {
                    $set: {
                        status: update.status,
                        statusNote: update.note
                    }
                },
                { new: true }
            );

            // Notify mentee
            await notificationClient.sendNotification({
                template: 'mentorship_status_update',
                recipients: [mentorship.menteeId],
                data: {
                    mentorshipId: mentorship._id,
                    status: update.status,
                    note: update.note
                }
            });

            return mentorship;
        } catch (error) {
            logger.error('Error updating mentorship status:', error);
            throw error;
        }
    }

    /**
     * Record mentorship session
     * @param {Object} session - Session data
     * @returns {Promise<Object>} Created session record
     */
    async recordMentorshipSession(session) {
        try {
            const sessionRecord = await mongoose.model('MentorshipSession').create({
                mentorshipId: session.mentorshipId,
                date: session.date,
                duration: session.duration,
                topics: session.topics,
                outcomes: session.outcomes,
                nextSteps: session.nextSteps,
                feedback: session.feedback
            });

            // Update mentorship stats
            await mongoose.model('Mentorship').findByIdAndUpdate(
                session.mentorshipId,
                {
                    $inc: {
                        'stats.sessionsCompleted': 1,
                        'stats.totalDuration': session.duration
                    },
                    $set: {
                        lastSessionAt: session.date
                    }
                }
            );

            // Award XP to both mentor and mentee
            const mentorship = await mongoose.model('Mentorship').findById(session.mentorshipId);
            await this.awardMentorshipXP(mentorship.mentorId, mentorship.menteeId);

            return sessionRecord;
        } catch (error) {
            logger.error('Error recording mentorship session:', error);
            throw error;
        }
    }

    /**
     * Award XP for mentorship session
     * @param {string} mentorId - Mentor ID
     * @param {string} menteeId - Mentee ID
     * @returns {Promise<void>}
     */
    async awardMentorshipXP(mentorId, menteeId) {
        try {
            const mentorXP = 100;
            const menteeXP = 50;

            // Award XP to mentor
            await mongoose.model('UserStats').findOneAndUpdate(
                { userId: mentorId },
                {
                    $inc: {
                        xp: mentorXP,
                        'mentorship.sessionsCompleted': 1
                    }
                }
            );

            // Award XP to mentee
            await mongoose.model('UserStats').findOneAndUpdate(
                { userId: menteeId },
                {
                    $inc: {
                        xp: menteeXP,
                        'mentorship.sessionsAttended': 1
                    }
                }
            );

            // Send notifications
            await Promise.all([
                notificationClient.sendNotification({
                    template: 'mentorship_xp_awarded',
                    recipients: [mentorId],
                    data: { xpAmount: mentorXP, role: 'mentor' }
                }),
                notificationClient.sendNotification({
                    template: 'mentorship_xp_awarded',
                    recipients: [menteeId],
                    data: { xpAmount: menteeXP, role: 'mentee' }
                })
            ]);
        } catch (error) {
            logger.error('Error awarding mentorship XP:', error);
            throw error;
        }
    }

    /**
     * Get recommended mentors
     * @param {Object} params - Search parameters
     * @returns {Promise<Array>} Recommended mentors
     */
    async getRecommendedMentors(params) {
        try {
            const {
                userId,
                skills,
                type = this.mentorshipTypes.FORMAL,
                limit = 5
            } = params;

            // Find qualified mentors
            const qualifiedMentors = await mongoose.model('UserStats').find({
                userId: { $ne: userId },
                'mentorship.isMentor': true,
                'mentorship.mentorshipType': type,
                skills: { $in: skills }
            }).sort({
                'mentorship.rating': -1,
                'mentorship.sessionsCompleted': -1
            }).limit(limit * 2);

            // Check mentor availability
            const availableMentors = await Promise.all(
                qualifiedMentors.map(async mentor => {
                    const activeMentorships = await mongoose.model('Mentorship').countDocuments({
                        mentorId: mentor.userId,
                        status: 'active'
                    });
                    return {
                        mentor,
                        activeMentorships
                    };
                })
            );

            // Select most suitable mentors
            return availableMentors
                .filter(m => m.activeMentorships < 3) // Max 3 active mentorships
                .sort((a, b) => a.activeMentorships - b.activeMentorships)
                .slice(0, limit)
                .map(m => m.mentor);
        } catch (error) {
            logger.error('Error getting recommended mentors:', error);
            throw error;
        }
    }

    /**
     * Create learning challenge
     * @param {Object} challenge - Challenge data
     * @returns {Promise<Object>} Created challenge
     */
    async createLearningChallenge(challenge) {
        try {
            const challengeRecord = await mongoose.model('LearningChallenge').create({
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                startDate: challenge.startDate,
                endDate: challenge.endDate,
                goals: challenge.goals,
                rewards: challenge.rewards,
                participants: [],
                creatorId: challenge.creatorId,
                metadata: challenge.metadata
            });

            // Notify potential participants
            const eligibleUsers = await this.getEligibleChallengeParticipants(challenge);
            await Promise.all(
                eligibleUsers.map(user => 
                    notificationClient.sendNotification({
                        template: 'new_learning_challenge',
                        recipients: [user._id],
                        data: {
                            challengeId: challengeRecord._id,
                            title: challenge.title,
                            startDate: challenge.startDate,
                            rewards: challenge.rewards
                        }
                    })
                )
            );

            return challengeRecord;
        } catch (error) {
            logger.error('Error creating learning challenge:', error);
            throw error;
        }
    }

    /**
     * Join learning challenge
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated challenge
     */
    async joinLearningChallenge(challengeId, userId) {
        try {
            const challenge = await mongoose.model('LearningChallenge').findByIdAndUpdate(
                challengeId,
                {
                    $addToSet: {
                        participants: {
                            userId,
                            joinedAt: new Date(),
                            progress: 0,
                            status: 'active'
                        }
                    }
                },
                { new: true }
            );

            // Create progress tracker
            await mongoose.model('ChallengeProgress').create({
                challengeId,
                userId,
                milestones: challenge.goals.map(goal => ({
                    goal,
                    status: 'pending'
                }))
            });

            return challenge;
        } catch (error) {
            logger.error('Error joining learning challenge:', error);
            throw error;
        }
    }

    /**
     * Track challenge progress
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User ID
     * @param {Object} progress - Progress data
     * @returns {Promise<Object>} Updated progress
     */
    async trackChallengeProgress(challengeId, userId, progress) {
        try {
            const challengeProgress = await mongoose.model('ChallengeProgress').findOneAndUpdate(
                { challengeId, userId },
                {
                    $set: {
                        'milestones.$[milestone].status': progress.status,
                        'milestones.$[milestone].completedAt': new Date()
                    }
                },
                {
                    arrayFilters: [{ 'milestone.goal': progress.goalId }],
                    new: true
                }
            );

            // Check if challenge is completed
            const allCompleted = challengeProgress.milestones.every(m => m.status === 'completed');
            if (allCompleted) {
                await this.completeLearningChallenge(challengeId, userId);
            }

            return challengeProgress;
        } catch (error) {
            logger.error('Error tracking challenge progress:', error);
            throw error;
        }
    }

    /**
     * Complete learning challenge
     * @param {string} challengeId - Challenge ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async completeLearningChallenge(challengeId, userId) {
        try {
            const challenge = await mongoose.model('LearningChallenge').findById(challengeId);
            
            // Award rewards
            await this.awardChallengeRewards(userId, challenge.rewards);

            // Update challenge status
            await mongoose.model('LearningChallenge').updateOne(
                { _id: challengeId, 'participants.userId': userId },
                {
                    $set: {
                        'participants.$.status': 'completed',
                        'participants.$.completedAt': new Date()
                    }
                }
            );

            // Send completion notification
            await notificationClient.sendNotification({
                template: 'challenge_completed',
                recipients: [userId],
                data: {
                    challengeId,
                    title: challenge.title,
                    rewards: challenge.rewards
                },
                priority: 'high'
            });
        } catch (error) {
            logger.error('Error completing learning challenge:', error);
            throw error;
        }
    }

    /**
     * Create group study session
     * @param {Object} session - Session data
     * @returns {Promise<Object>} Created session
     */
    async createGroupStudySession(session) {
        try {
            const sessionRecord = await mongoose.model('GroupStudySession').create({
                title: session.title,
                description: session.description,
                scheduledDate: session.scheduledDate,
                duration: session.duration,
                maxParticipants: session.maxParticipants,
                topics: session.topics,
                facilitatorId: session.facilitatorId,
                type: session.type,
                resources: session.resources,
                participants: [{ userId: session.facilitatorId, role: 'facilitator' }],
                metadata: session.metadata
            });

            // Notify potential participants
            const eligibleParticipants = await this.getEligibleSessionParticipants(session);
            await Promise.all(
                eligibleParticipants.map(user =>
                    notificationClient.sendNotification({
                        template: 'new_study_session',
                        recipients: [user._id],
                        data: {
                            sessionId: sessionRecord._id,
                            title: session.title,
                            scheduledDate: session.scheduledDate,
                            facilitatorId: session.facilitatorId
                        }
                    })
                )
            );

            return sessionRecord;
        } catch (error) {
            logger.error('Error creating group study session:', error);
            throw error;
        }
    }

    /**
     * Join group study session
     * @param {string} sessionId - Session ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated session
     */
    async joinGroupStudySession(sessionId, userId) {
        try {
            const session = await mongoose.model('GroupStudySession').findByIdAndUpdate(
                sessionId,
                {
                    $addToSet: {
                        participants: {
                            userId,
                            role: 'participant',
                            joinedAt: new Date()
                        }
                    }
                },
                { new: true }
            );

            // Notify facilitator
            await notificationClient.sendNotification({
                template: 'session_participant_joined',
                recipients: [session.facilitatorId],
                data: {
                    sessionId,
                    title: session.title,
                    userId
                }
            });

            return session;
        } catch (error) {
            logger.error('Error joining group study session:', error);
            throw error;
        }
    }

    /**
     * Record session participation
     * @param {string} sessionId - Session ID
     * @param {Object} participation - Participation data
     * @returns {Promise<Object>} Participation record
     */
    async recordSessionParticipation(sessionId, participation) {
        try {
            const participationRecord = await mongoose.model('SessionParticipation').create({
                sessionId,
                userId: participation.userId,
                duration: participation.duration,
                contributions: participation.contributions,
                feedback: participation.feedback,
                rating: participation.rating
            });

            // Update user stats
            await mongoose.model('UserStats').findOneAndUpdate(
                { userId: participation.userId },
                {
                    $inc: {
                        'studySession.attended': 1,
                        'studySession.totalDuration': participation.duration
                    }
                }
            );

            // Award XP based on participation
            const xpAmount = this.calculateSessionParticipationXP(participation);
            await this.awardXP(participation.userId, xpAmount);

            return participationRecord;
        } catch (error) {
            logger.error('Error recording session participation:', error);
            throw error;
        }
    }

    /**
     * Calculate session participation XP
     * @param {Object} participation - Participation data
     * @returns {number} XP amount
     */
    calculateSessionParticipationXP(participation) {
        let xp = 0;

        // Base XP for attendance
        xp += 50;

        // XP for duration (1 XP per minute, max 120)
        xp += Math.min(participation.duration, 120);

        // XP for contributions
        xp += participation.contributions.length * 10;

        // XP for providing feedback
        if (participation.feedback) xp += 20;

        return xp;
    }

    /**
     * Get engagement metrics
     * @param {Object} query - Query parameters
     * @returns {Promise<Object>} Engagement metrics
     */
    async getEngagementMetrics(query) {
        try {
            const {
                userId,
                contentId,
                timeframe = '30d',
                type
            } = query;

            const timeframeStart = this.getTimeframeStart(timeframe);
            const matchStage = {
                createdAt: { $gte: timeframeStart }
            };

            if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
            if (contentId) matchStage.targetId = mongoose.Types.ObjectId(contentId);
            if (type) matchStage.type = type;

            const metrics = await mongoose.model('Engagement').aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            type: '$type',
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                        },
                        count: { $sum: 1 },
                        uniqueUsers: { $addToSet: '$userId' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.type',
                        dailyStats: {
                            $push: {
                                date: '$_id.date',
                                count: '$count',
                                uniqueUsers: { $size: '$uniqueUsers' }
                            }
                        },
                        totalCount: { $sum: '$count' },
                        uniqueUsers: { $addToSet: '$uniqueUsers' }
                    }
                }
            ]);

            return this.processEngagementMetrics(metrics);
        } catch (error) {
            logger.error('Error getting engagement metrics:', error);
            throw error;
        }
    }

    /**
     * Process engagement metrics
     * @param {Array} metrics - Raw metrics data
     * @returns {Object} Processed metrics
     */
    processEngagementMetrics(metrics) {
        const processed = {};
        
        metrics.forEach(metric => {
            processed[metric._id] = {
                total: metric.totalCount,
                uniqueUsers: metric.uniqueUsers.flat().length,
                dailyStats: metric.dailyStats.sort((a, b) => a.date.localeCompare(b.date))
            };
        });

        return processed;
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
}

module.exports = new EngagementEngine();
