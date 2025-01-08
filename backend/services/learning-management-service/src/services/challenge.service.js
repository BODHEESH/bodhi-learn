const BaseService = require('./base.service');
const { LearningChallenge } = require('../models/schemas');
const { NotFoundError, ValidationError } = require('../utils/errors');
const notificationClient = require('../utils/notificationClient');
const config = require('../config/config');

class ChallengeService extends BaseService {
    constructor() {
        super(LearningChallenge);
    }

    async create(data) {
        // Validate challenge data
        await this.validateChallengeData(data);

        // Create challenge
        const challenge = await super.create(data);

        // Send notifications
        if (config.features.enableNotifications) {
            await this.notifyNewChallenge(challenge);
        }

        return challenge;
    }

    async update(id, data) {
        const challenge = await this.findById(id);

        // Validate update data
        await this.validateChallengeData(data, challenge);

        // Update challenge
        const updatedChallenge = await super.update(id, data);

        // Notify participants about the update
        if (config.features.enableNotifications) {
            await this.notifyChallengeUpdate(updatedChallenge);
        }

        return updatedChallenge;
    }

    async joinChallenge(challengeId, participantData) {
        const challenge = await this.findById(challengeId);

        // Validate participant data
        await this.validateParticipantData(participantData, challenge);

        challenge.participants.push(participantData);
        await challenge.save();

        // Notify about new participant
        if (config.features.enableNotifications) {
            await this.notifyNewParticipant(challenge, participantData);
        }

        return challenge;
    }

    async submitProgress(challengeId, userId, progressData) {
        const challenge = await this.findById(challengeId);
        const participant = challenge.participants.find(
            p => p.userId.toString() === userId.toString()
        );

        if (!participant) {
            throw new ValidationError('User is not a participant in this challenge');
        }

        // Validate progress data
        await this.validateProgressData(progressData, challenge);

        // Update participant progress
        participant.progress = progressData.progress;
        participant.completedGoals = progressData.completedGoals;
        participant.lastUpdateAt = new Date();

        if (progressData.progress === 100) {
            participant.completedAt = new Date();
            // Notify about participant completion
            if (config.features.enableNotifications) {
                await this.notifyParticipantCompletion(challenge, participant);
            }
        }

        await challenge.save();

        return challenge;
    }

    async addMilestone(challengeId, milestoneData) {
        const challenge = await this.findById(challengeId);

        // Validate milestone data
        await this.validateMilestoneData(milestoneData);

        challenge.milestones.push(milestoneData);
        await challenge.save();

        // Notify about new milestone
        if (config.features.enableNotifications) {
            await this.notifyNewMilestone(challenge, milestoneData);
        }

        return challenge;
    }

    async completeChallenge(challengeId) {
        const challenge = await this.findById(challengeId);

        if (challenge.status === 'completed') {
            throw new ValidationError('Challenge is already completed');
        }

        challenge.status = 'completed';
        challenge.completedAt = new Date();

        // Calculate and assign rewards
        await this.calculateAndAssignRewards(challenge);

        await challenge.save();

        // Notify about challenge completion
        if (config.features.enableNotifications) {
            await this.notifyChallengeCompletion(challenge);
        }

        return challenge;
    }

    // Private methods
    async validateChallengeData(data, existingChallenge = null) {
        if (!data.title || data.title.length < 5) {
            throw new ValidationError('Challenge title must be at least 5 characters long');
        }

        if (!data.description || data.description.length < 20) {
            throw new ValidationError('Challenge description must be at least 20 characters long');
        }

        if (data.startDate && data.endDate) {
            if (new Date(data.startDate) >= new Date(data.endDate)) {
                throw new ValidationError('End date must be after start date');
            }
        }

        if (data.goals && (!Array.isArray(data.goals) || data.goals.length === 0)) {
            throw new ValidationError('At least one goal is required');
        }
    }

    async validateParticipantData(data, challenge) {
        if (!data.userId) {
            throw new ValidationError('Participant must have a user ID');
        }

        if (challenge.participants.some(p => p.userId.toString() === data.userId.toString())) {
            throw new ValidationError('User is already a participant');
        }

        if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
            throw new ValidationError('Challenge has reached maximum participants');
        }
    }

    async validateProgressData(data, challenge) {
        if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
            throw new ValidationError('Progress must be a number between 0 and 100');
        }

        if (!Array.isArray(data.completedGoals)) {
            throw new ValidationError('Completed goals must be an array');
        }

        // Validate that completed goals exist in challenge
        const invalidGoals = data.completedGoals.filter(
            goalId => !challenge.goals.find(g => g._id.toString() === goalId.toString())
        );

        if (invalidGoals.length > 0) {
            throw new ValidationError('Some completed goals do not exist in this challenge');
        }
    }

    async validateMilestoneData(data) {
        if (!data.title || data.title.length < 5) {
            throw new ValidationError('Milestone title must be at least 5 characters long');
        }

        if (!data.points || data.points <= 0) {
            throw new ValidationError('Milestone must have positive points value');
        }
    }

    async calculateAndAssignRewards(challenge) {
        const completedParticipants = challenge.participants.filter(p => p.completedAt);
        const totalParticipants = challenge.participants.length;

        completedParticipants.forEach((participant, index) => {
            let bonusPoints = 0;

            // First completion bonus
            if (index === 0) bonusPoints += 100;
            // Top 3 bonus
            else if (index < 3) bonusPoints += 50;

            // Completion speed bonus
            const completionTime = participant.completedAt - challenge.startDate;
            if (completionTime < challenge.expectedDuration) {
                bonusPoints += 25;
            }

            participant.rewards = {
                xp: challenge.rewards.xp + bonusPoints,
                badges: [...challenge.rewards.badges],
                achievements: [...challenge.rewards.achievements]
            };
        });
    }

    // Notification methods
    async notifyNewChallenge(challenge) {
        await notificationClient.sendNotification({
            type: 'NEW_CHALLENGE',
            title: `New Learning Challenge: ${challenge.title}`,
            description: challenge.description,
            recipients: ['ALL'],
            data: { challengeId: challenge._id }
        });
    }

    async notifyChallengeUpdate(challenge) {
        const recipients = challenge.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'CHALLENGE_UPDATE',
            title: `Challenge Updated: ${challenge.title}`,
            recipients,
            data: { challengeId: challenge._id }
        });
    }

    async notifyNewParticipant(challenge, participant) {
        const recipients = challenge.participants
            .map(p => p.userId)
            .filter(id => id.toString() !== participant.userId.toString());

        await notificationClient.sendNotification({
            type: 'NEW_CHALLENGE_PARTICIPANT',
            title: `New Participant in ${challenge.title}`,
            recipients,
            data: { challengeId: challenge._id, participantId: participant.userId }
        });
    }

    async notifyParticipantCompletion(challenge, participant) {
        const recipients = challenge.participants
            .map(p => p.userId)
            .filter(id => id.toString() !== participant.userId.toString());

        await notificationClient.sendNotification({
            type: 'CHALLENGE_PARTICIPANT_COMPLETED',
            title: `Participant Completed ${challenge.title}`,
            recipients,
            data: { challengeId: challenge._id, participantId: participant.userId }
        });
    }

    async notifyNewMilestone(challenge, milestone) {
        const recipients = challenge.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'NEW_CHALLENGE_MILESTONE',
            title: `New Milestone in ${challenge.title}`,
            description: milestone.title,
            recipients,
            data: { challengeId: challenge._id, milestoneId: milestone._id }
        });
    }

    async notifyChallengeCompletion(challenge) {
        const recipients = challenge.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'CHALLENGE_COMPLETED',
            title: `Challenge Completed: ${challenge.title}`,
            description: 'Check your rewards!',
            recipients,
            data: { challengeId: challenge._id }
        });
    }
}

module.exports = new ChallengeService();
