const BaseService = require('./base.service');
const { Mentorship } = require('../models/schemas');
const { NotFoundError, ValidationError } = require('../utils/errors');
const notificationClient = require('../utils/notificationClient');
const config = require('../config/config');

class MentorshipService extends BaseService {
    constructor() {
        super(Mentorship);
    }

    async create(data) {
        // Validate mentorship data
        await this.validateMentorshipData(data);

        // Create mentorship
        const mentorship = await super.create(data);

        // Send notifications
        if (config.features.enableNotifications) {
            await this.notifyNewMentorship(mentorship);
        }

        return mentorship;
    }

    async update(id, data) {
        const mentorship = await this.findById(id);

        // Validate update data
        await this.validateMentorshipData(data, mentorship);

        // Update mentorship
        const updatedMentorship = await super.update(id, data);

        // Notify relevant users about the update
        if (config.features.enableNotifications) {
            await this.notifyUpdateMentorship(updatedMentorship);
        }

        return updatedMentorship;
    }

    async addSession(mentorshipId, sessionData) {
        const mentorship = await this.findById(mentorshipId);

        // Validate session data
        await this.validateSessionData(sessionData);

        mentorship.sessions.push(sessionData);
        await mentorship.save();

        // Notify participants about new session
        if (config.features.enableNotifications) {
            await this.notifyNewSession(mentorship, sessionData);
        }

        return mentorship;
    }

    async updateSession(mentorshipId, sessionId, sessionData) {
        const mentorship = await this.findById(mentorshipId);
        const session = mentorship.sessions.id(sessionId);

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        // Validate session update
        await this.validateSessionData(sessionData, session);

        Object.assign(session, sessionData);
        await mentorship.save();

        // Notify participants about session update
        if (config.features.enableNotifications) {
            await this.notifySessionUpdate(mentorship, session);
        }

        return mentorship;
    }

    async completeSession(mentorshipId, sessionId, completionData) {
        const mentorship = await this.findById(mentorshipId);
        const session = mentorship.sessions.id(sessionId);

        if (!session) {
            throw new NotFoundError('Session not found');
        }

        session.status = 'completed';
        session.completionNotes = completionData.notes;
        session.rating = completionData.rating;
        session.completedAt = new Date();

        await mentorship.save();

        // Notify participants about session completion
        if (config.features.enableNotifications) {
            await this.notifySessionCompletion(mentorship, session);
        }

        return mentorship;
    }

    async addGoal(mentorshipId, goalData) {
        const mentorship = await this.findById(mentorshipId);

        // Validate goal data
        if (!goalData.description || !goalData.targetDate) {
            throw new ValidationError('Goal must have description and target date');
        }

        mentorship.goals.push(goalData);
        await mentorship.save();

        // Notify participants about new goal
        if (config.features.enableNotifications) {
            await this.notifyNewGoal(mentorship, goalData);
        }

        return mentorship;
    }

    async updateGoalStatus(mentorshipId, goalId, status) {
        const mentorship = await this.findById(mentorshipId);
        const goal = mentorship.goals.id(goalId);

        if (!goal) {
            throw new NotFoundError('Goal not found');
        }

        goal.status = status;
        if (status === 'completed') {
            goal.completedAt = new Date();
        }

        await mentorship.save();

        // Notify participants about goal status update
        if (config.features.enableNotifications) {
            await this.notifyGoalUpdate(mentorship, goal);
        }

        return mentorship;
    }

    // Private methods
    async validateMentorshipData(data, existingMentorship = null) {
        if (!data.mentorId || !data.menteeId) {
            throw new ValidationError('Mentor and mentee IDs are required');
        }

        if (data.mentorId === data.menteeId) {
            throw new ValidationError('Mentor and mentee cannot be the same user');
        }

        if (!data.skillsFocus || data.skillsFocus.length === 0) {
            throw new ValidationError('At least one skill focus is required');
        }

        if (data.duration) {
            if (new Date(data.duration.start) >= new Date(data.duration.end)) {
                throw new ValidationError('End date must be after start date');
            }
        }
    }

    async validateSessionData(data, existingSession = null) {
        if (!data.date) {
            throw new ValidationError('Session date is required');
        }

        if (new Date(data.date) < new Date()) {
            throw new ValidationError('Session date must be in the future');
        }

        if (!data.duration || data.duration < 15 || data.duration > 240) {
            throw new ValidationError('Session duration must be between 15 and 240 minutes');
        }
    }

    // Notification methods
    async notifyNewMentorship(mentorship) {
        await notificationClient.sendNotification({
            type: 'NEW_MENTORSHIP',
            title: 'New Mentorship Relationship',
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id }
        });
    }

    async notifyUpdateMentorship(mentorship) {
        await notificationClient.sendNotification({
            type: 'MENTORSHIP_UPDATE',
            title: 'Mentorship Updated',
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id }
        });
    }

    async notifyNewSession(mentorship, session) {
        await notificationClient.sendNotification({
            type: 'NEW_MENTORSHIP_SESSION',
            title: 'New Mentorship Session Scheduled',
            description: `Session scheduled for ${session.date}`,
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id, sessionId: session._id }
        });
    }

    async notifySessionUpdate(mentorship, session) {
        await notificationClient.sendNotification({
            type: 'MENTORSHIP_SESSION_UPDATE',
            title: 'Mentorship Session Updated',
            description: `Session updated for ${session.date}`,
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id, sessionId: session._id }
        });
    }

    async notifySessionCompletion(mentorship, session) {
        await notificationClient.sendNotification({
            type: 'MENTORSHIP_SESSION_COMPLETED',
            title: 'Mentorship Session Completed',
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id, sessionId: session._id }
        });
    }

    async notifyNewGoal(mentorship, goal) {
        await notificationClient.sendNotification({
            type: 'NEW_MENTORSHIP_GOAL',
            title: 'New Mentorship Goal Added',
            description: goal.description,
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id, goalId: goal._id }
        });
    }

    async notifyGoalUpdate(mentorship, goal) {
        await notificationClient.sendNotification({
            type: 'MENTORSHIP_GOAL_UPDATE',
            title: 'Mentorship Goal Updated',
            description: `Goal status updated to: ${goal.status}`,
            recipients: [mentorship.mentorId, mentorship.menteeId],
            data: { mentorshipId: mentorship._id, goalId: goal._id }
        });
    }
}

module.exports = new MentorshipService();
