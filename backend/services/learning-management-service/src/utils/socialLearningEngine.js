const mongoose = require('mongoose');
const logger = require('../config/logger');
const notificationClient = require('./notificationClient');
const recommendationEngine = require('./recommendationEngine');

class SocialLearningEngine {
    /**
     * Create a study group
     * @param {Object} groupData - Study group data
     * @returns {Promise<Object>} Created study group
     */
    async createStudyGroup(groupData) {
        try {
            const group = await mongoose.model('StudyGroup').create({
                name: groupData.name,
                description: groupData.description,
                creator: groupData.creatorId,
                topics: groupData.topics,
                skillLevels: groupData.skillLevels,
                maxMembers: groupData.maxMembers,
                isPrivate: groupData.isPrivate,
                metadata: groupData.metadata
            });

            // Add creator as admin
            await this.addGroupMember(group._id, groupData.creatorId, 'admin');

            return group;
        } catch (error) {
            logger.error('Error creating study group:', error);
            throw error;
        }
    }

    /**
     * Add member to study group
     * @param {string} groupId - Study group ID
     * @param {string} userId - User ID
     * @param {string} role - Member role
     * @returns {Promise<Object>} Updated group membership
     */
    async addGroupMember(groupId, userId, role = 'member') {
        try {
            const membership = await mongoose.model('GroupMembership').create({
                groupId,
                userId,
                role,
                joinedAt: new Date()
            });

            // Notify group admins
            const admins = await mongoose.model('GroupMembership').find({
                groupId,
                role: 'admin'
            });

            const group = await mongoose.model('StudyGroup').findById(groupId);
            const user = await mongoose.model('User').findById(userId);

            for (const admin of admins) {
                await notificationClient.sendNotification({
                    template: 'group_member_joined',
                    recipients: [admin.userId],
                    data: {
                        groupId,
                        groupName: group.name,
                        userId,
                        userName: user.name
                    }
                });
            }

            return membership;
        } catch (error) {
            logger.error('Error adding group member:', error);
            throw error;
        }
    }

    /**
     * Create a discussion thread
     * @param {Object} threadData - Discussion thread data
     * @returns {Promise<Object>} Created thread
     */
    async createDiscussionThread(threadData) {
        try {
            const thread = await mongoose.model('DiscussionThread').create({
                title: threadData.title,
                content: threadData.content,
                creator: threadData.creatorId,
                groupId: threadData.groupId,
                contentId: threadData.contentId,
                tags: threadData.tags,
                metadata: threadData.metadata
            });

            // Notify group members
            if (threadData.groupId) {
                const members = await mongoose.model('GroupMembership').find({
                    groupId: threadData.groupId
                });

                const group = await mongoose.model('StudyGroup').findById(threadData.groupId);
                const creator = await mongoose.model('User').findById(threadData.creatorId);

                for (const member of members) {
                    if (member.userId.toString() !== threadData.creatorId) {
                        await notificationClient.sendNotification({
                            template: 'new_discussion_thread',
                            recipients: [member.userId],
                            data: {
                                threadId: thread._id,
                                threadTitle: thread.title,
                                groupId: group._id,
                                groupName: group.name,
                                creatorId: creator._id,
                                creatorName: creator.name
                            }
                        });
                    }
                }
            }

            return thread;
        } catch (error) {
            logger.error('Error creating discussion thread:', error);
            throw error;
        }
    }

    /**
     * Add reply to discussion thread
     * @param {Object} replyData - Reply data
     * @returns {Promise<Object>} Created reply
     */
    async addThreadReply(replyData) {
        try {
            const reply = await mongoose.model('ThreadReply').create({
                threadId: replyData.threadId,
                content: replyData.content,
                creator: replyData.creatorId,
                parentReplyId: replyData.parentReplyId,
                metadata: replyData.metadata
            });

            // Process mentions
            if (replyData.mentions) {
                await this.processMentions(reply._id, replyData.mentions);
            }

            // Notify thread participants
            const thread = await mongoose.model('DiscussionThread').findById(replyData.threadId);
            const creator = await mongoose.model('User').findById(replyData.creatorId);
            const participants = await mongoose.model('ThreadReply').distinct('creator', {
                threadId: replyData.threadId
            });

            for (const participantId of participants) {
                if (participantId.toString() !== replyData.creatorId) {
                    await notificationClient.sendNotification({
                        template: 'thread_reply',
                        recipients: [participantId],
                        data: {
                            threadId: thread._id,
                            threadTitle: thread.title,
                            replyId: reply._id,
                            replyContent: reply.content,
                            creatorId: creator._id,
                            creatorName: creator.name
                        }
                    });
                }
            }

            return reply;
        } catch (error) {
            logger.error('Error adding thread reply:', error);
            throw error;
        }
    }

    /**
     * Process user mentions in a reply
     * @param {string} replyId - Reply ID
     * @param {Array} mentions - Array of mentioned user IDs
     * @returns {Promise<void>}
     */
    async processMentions(replyId, mentions) {
        try {
            const reply = await mongoose.model('ThreadReply').findById(replyId)
                .populate('threadId')
                .populate('creator');

            for (const userId of mentions) {
                await notificationClient.sendNotification({
                    template: 'thread_mention',
                    recipients: [userId],
                    data: {
                        threadId: reply.threadId._id,
                        threadTitle: reply.threadId.title,
                        replyId: reply._id,
                        replyContent: reply.content,
                        mentionerId: reply.creator._id,
                        mentionerName: reply.creator.name
                    }
                });
            }
        } catch (error) {
            logger.error('Error processing mentions:', error);
            throw error;
        }
    }

    /**
     * Create a collaborative note
     * @param {Object} noteData - Note data
     * @returns {Promise<Object>} Created note
     */
    async createCollaborativeNote(noteData) {
        try {
            const note = await mongoose.model('CollaborativeNote').create({
                title: noteData.title,
                content: noteData.content,
                creator: noteData.creatorId,
                contentId: noteData.contentId,
                groupId: noteData.groupId,
                collaborators: [{ userId: noteData.creatorId, role: 'owner' }],
                tags: noteData.tags,
                metadata: noteData.metadata
            });

            return note;
        } catch (error) {
            logger.error('Error creating collaborative note:', error);
            throw error;
        }
    }

    /**
     * Add collaborator to note
     * @param {string} noteId - Note ID
     * @param {string} userId - User ID
     * @param {string} role - Collaborator role
     * @returns {Promise<Object>} Updated note
     */
    async addNoteCollaborator(noteId, userId, role = 'editor') {
        try {
            const note = await mongoose.model('CollaborativeNote').findByIdAndUpdate(
                noteId,
                {
                    $push: {
                        collaborators: { userId, role }
                    }
                },
                { new: true }
            );

            // Notify user
            const creator = await mongoose.model('User').findById(note.creator);
            await notificationClient.sendNotification({
                template: 'note_collaboration_invite',
                recipients: [userId],
                data: {
                    noteId: note._id,
                    noteTitle: note.title,
                    creatorId: creator._id,
                    creatorName: creator.name,
                    role
                }
            });

            return note;
        } catch (error) {
            logger.error('Error adding note collaborator:', error);
            throw error;
        }
    }

    /**
     * Get recommended study groups
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Recommended groups
     */
    async getRecommendedGroups(userId) {
        try {
            const user = await mongoose.model('User').findById(userId);
            const userInterests = await recommendationEngine.getUserInterests(userId);

            // Find groups matching user's interests and skill levels
            const groups = await mongoose.model('StudyGroup').find({
                $or: [
                    { topics: { $in: userInterests.topics } },
                    { skillLevels: { $in: userInterests.skillLevels } }
                ],
                isPrivate: false,
                _id: {
                    $nin: await mongoose.model('GroupMembership')
                        .distinct('groupId', { userId })
                }
            }).limit(10);

            return groups;
        } catch (error) {
            logger.error('Error getting recommended groups:', error);
            throw error;
        }
    }

    /**
     * Get learning network
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Learning network
     */
    async getLearningNetwork(userId) {
        try {
            // Get user's groups
            const groupMemberships = await mongoose.model('GroupMembership').find({ userId })
                .populate('groupId');

            // Get group members
            const networkMembers = await mongoose.model('GroupMembership').find({
                groupId: { $in: groupMemberships.map(m => m.groupId._id) },
                userId: { $ne: userId }
            }).populate('userId');

            // Get shared interests
            const userInterests = await recommendationEngine.getUserInterests(userId);
            const memberInterests = await Promise.all(
                networkMembers.map(async member => ({
                    member: member.userId,
                    interests: await recommendationEngine.getUserInterests(member.userId._id)
                }))
            );

            return {
                groups: groupMemberships.map(m => m.groupId),
                members: memberInterests.map(m => ({
                    user: m.member,
                    sharedInterests: this.getSharedInterests(userInterests, m.interests)
                }))
            };
        } catch (error) {
            logger.error('Error getting learning network:', error);
            throw error;
        }
    }

    /**
     * Get shared interests between two users
     * @param {Object} interests1 - First user's interests
     * @param {Object} interests2 - Second user's interests
     * @returns {Object} Shared interests
     */
    getSharedInterests(interests1, interests2) {
        return {
            topics: interests1.topics.filter(t => interests2.topics.includes(t)),
            skillLevels: interests1.skillLevels.filter(s => interests2.skillLevels.includes(s))
        };
    }

    /**
     * Create peer review request
     * @param {Object} reviewData - Review request data
     * @returns {Promise<Object>} Created review request
     */
    async createPeerReview(reviewData) {
        try {
            const review = await mongoose.model('PeerReview').create({
                contentId: reviewData.contentId,
                contentType: reviewData.contentType,
                creatorId: reviewData.creatorId,
                reviewers: reviewData.reviewerIds.map(id => ({
                    userId: id,
                    status: 'pending'
                })),
                rubric: reviewData.rubric,
                dueDate: reviewData.dueDate,
                metadata: reviewData.metadata
            });

            // Notify reviewers
            const creator = await mongoose.model('User').findById(reviewData.creatorId);
            for (const reviewerId of reviewData.reviewerIds) {
                await notificationClient.sendNotification({
                    template: 'peer_review_request',
                    recipients: [reviewerId],
                    data: {
                        reviewId: review._id,
                        contentId: review.contentId,
                        contentType: review.contentType,
                        creatorId: creator._id,
                        creatorName: creator.name,
                        dueDate: review.dueDate
                    },
                    priority: 'high'
                });
            }

            return review;
        } catch (error) {
            logger.error('Error creating peer review:', error);
            throw error;
        }
    }

    /**
     * Submit peer review
     * @param {Object} submissionData - Review submission data
     * @returns {Promise<Object>} Updated review
     */
    async submitPeerReview(submissionData) {
        try {
            const review = await mongoose.model('PeerReview').findOneAndUpdate(
                {
                    _id: submissionData.reviewId,
                    'reviewers.userId': submissionData.reviewerId
                },
                {
                    $set: {
                        'reviewers.$.status': 'completed',
                        'reviewers.$.feedback': submissionData.feedback,
                        'reviewers.$.ratings': submissionData.ratings,
                        'reviewers.$.submittedAt': new Date()
                    }
                },
                { new: true }
            );

            // Check if all reviews are completed
            const allCompleted = review.reviewers.every(r => r.status === 'completed');
            if (allCompleted) {
                await this.finalizePeerReview(review);
            }

            // Notify content creator
            await notificationClient.sendNotification({
                template: 'peer_review_submitted',
                recipients: [review.creatorId],
                data: {
                    reviewId: review._id,
                    contentId: review.contentId,
                    contentType: review.contentType,
                    reviewerId: submissionData.reviewerId,
                    isComplete: allCompleted
                }
            });

            return review;
        } catch (error) {
            logger.error('Error submitting peer review:', error);
            throw error;
        }
    }

    /**
     * Finalize peer review
     * @param {Object} review - Peer review object
     * @returns {Promise<void>}
     */
    async finalizePeerReview(review) {
        try {
            // Calculate average ratings
            const ratings = {};
            review.reviewers.forEach(reviewer => {
                Object.entries(reviewer.ratings).forEach(([criterion, rating]) => {
                    if (!ratings[criterion]) {
                        ratings[criterion] = [];
                    }
                    ratings[criterion].push(rating);
                });
            });

            const averageRatings = {};
            Object.entries(ratings).forEach(([criterion, scores]) => {
                averageRatings[criterion] = scores.reduce((a, b) => a + b) / scores.length;
            });

            // Update review status
            await mongoose.model('PeerReview').findByIdAndUpdate(
                review._id,
                {
                    $set: {
                        status: 'completed',
                        averageRatings,
                        completedAt: new Date()
                    }
                }
            );

            // Award XP to reviewers
            for (const reviewer of review.reviewers) {
                await this.awardReviewerXP(reviewer.userId);
            }

            // Notify creator of completion
            await notificationClient.sendNotification({
                template: 'peer_review_completed',
                recipients: [review.creatorId],
                data: {
                    reviewId: review._id,
                    contentId: review.contentId,
                    contentType: review.contentType,
                    averageRatings
                },
                priority: 'high'
            });
        } catch (error) {
            logger.error('Error finalizing peer review:', error);
            throw error;
        }
    }

    /**
     * Award XP to reviewer
     * @param {string} reviewerId - Reviewer ID
     * @returns {Promise<void>}
     */
    async awardReviewerXP(reviewerId) {
        try {
            const xpAmount = 50; // Base XP for completing a review
            await mongoose.model('UserStats').findOneAndUpdate(
                { userId: reviewerId },
                {
                    $inc: { 
                        xp: xpAmount,
                        reviewsCompleted: 1
                    }
                }
            );

            // Notify reviewer of XP gain
            await notificationClient.sendNotification({
                template: 'review_xp_awarded',
                recipients: [reviewerId],
                data: {
                    xpAmount
                }
            });
        } catch (error) {
            logger.error('Error awarding reviewer XP:', error);
            throw error;
        }
    }

    /**
     * Get recommended reviewers
     * @param {Object} params - Parameters for finding reviewers
     * @returns {Promise<Array>} Recommended reviewers
     */
    async getRecommendedReviewers(params) {
        try {
            const {
                contentId,
                contentType,
                creatorId,
                skillLevel,
                count = 3
            } = params;

            // Find users with similar or higher skill level
            const qualifiedUsers = await mongoose.model('UserStats').find({
                userId: { $ne: creatorId },
                [`skills.${params.subject}`]: { $gte: skillLevel }
            }).sort({
                reviewsCompleted: -1,
                xp: -1
            }).limit(count * 2);

            // Filter out users who are too busy
            const availableUsers = await Promise.all(
                qualifiedUsers.map(async user => {
                    const activeReviews = await mongoose.model('PeerReview').countDocuments({
                        'reviewers.userId': user.userId,
                        'reviewers.status': 'pending'
                    });
                    return {
                        user,
                        activeReviews
                    };
                })
            );

            // Select the most suitable reviewers
            return availableUsers
                .filter(u => u.activeReviews < 5) // Max 5 active reviews
                .sort((a, b) => a.activeReviews - b.activeReviews)
                .slice(0, count)
                .map(u => u.user);
        } catch (error) {
            logger.error('Error getting recommended reviewers:', error);
            throw error;
        }
    }
}

module.exports = new SocialLearningEngine();
