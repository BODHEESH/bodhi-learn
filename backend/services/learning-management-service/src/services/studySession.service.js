const BaseService = require('./base.service');
const { GroupStudySession } = require('../models/schemas');
const { NotFoundError, ValidationError } = require('../utils/errors');
const notificationClient = require('../utils/notificationClient');
const config = require('../config/config');

class StudySessionService extends BaseService {
    constructor() {
        super(GroupStudySession);
    }

    async create(data) {
        // Validate session data
        await this.validateSessionData(data);

        // Create session
        const session = await super.create(data);

        // Send notifications
        if (config.features.enableNotifications) {
            await this.notifyNewSession(session);
        }

        return session;
    }

    async update(id, data) {
        const session = await this.findById(id);

        // Validate update data
        await this.validateSessionData(data, session);

        // Update session
        const updatedSession = await super.update(id, data);

        // Notify participants about the update
        if (config.features.enableNotifications) {
            await this.notifySessionUpdate(updatedSession);
        }

        return updatedSession;
    }

    async joinSession(sessionId, participantData) {
        const session = await this.findById(sessionId);

        // Validate participant data
        await this.validateParticipantData(participantData, session);

        session.participants.push(participantData);
        await session.save();

        // Notify about new participant
        if (config.features.enableNotifications) {
            await this.notifyNewParticipant(session, participantData);
        }

        return session;
    }

    async leaveSession(sessionId, userId) {
        const session = await this.findById(sessionId);

        const participantIndex = session.participants.findIndex(
            p => p.userId.toString() === userId.toString()
        );

        if (participantIndex === -1) {
            throw new ValidationError('User is not a participant in this session');
        }

        session.participants.splice(participantIndex, 1);
        await session.save();

        // Notify about participant leaving
        if (config.features.enableNotifications) {
            await this.notifyParticipantLeft(session, userId);
        }

        return session;
    }

    async addResource(sessionId, resourceData) {
        const session = await this.findById(sessionId);

        // Validate resource data
        await this.validateResourceData(resourceData);

        session.resources.push(resourceData);
        await session.save();

        // Notify about new resource
        if (config.features.enableNotifications) {
            await this.notifyNewResource(session, resourceData);
        }

        return session;
    }

    async addNote(sessionId, noteData) {
        const session = await this.findById(sessionId);

        // Validate note data
        await this.validateNoteData(noteData);

        session.notes.push(noteData);
        await session.save();

        // Notify about new note
        if (config.features.enableNotifications) {
            await this.notifyNewNote(session, noteData);
        }

        return session;
    }

    async completeSession(sessionId, completionData) {
        const session = await this.findById(sessionId);

        if (session.status === 'completed') {
            throw new ValidationError('Session is already completed');
        }

        session.status = 'completed';
        session.summary = completionData.summary;
        session.outcomes = completionData.outcomes;
        session.completedAt = new Date();

        await session.save();

        // Notify about session completion
        if (config.features.enableNotifications) {
            await this.notifySessionCompletion(session);
        }

        return session;
    }

    // Private methods
    async validateSessionData(data, existingSession = null) {
        if (!data.title) {
            throw new ValidationError('Session title is required');
        }

        if (!data.scheduledDate || new Date(data.scheduledDate) < new Date()) {
            throw new ValidationError('Session must be scheduled in the future');
        }

        if (!data.duration || data.duration < 15 || data.duration > 240) {
            throw new ValidationError('Session duration must be between 15 and 240 minutes');
        }

        if (data.maxParticipants && data.maxParticipants < 2) {
            throw new ValidationError('Session must allow at least 2 participants');
        }
    }

    async validateParticipantData(data, session) {
        if (!data.userId) {
            throw new ValidationError('Participant must have a user ID');
        }

        if (session.participants.some(p => p.userId.toString() === data.userId.toString())) {
            throw new ValidationError('User is already a participant');
        }

        if (session.maxParticipants && session.participants.length >= session.maxParticipants) {
            throw new ValidationError('Session has reached maximum participants');
        }
    }

    async validateResourceData(data) {
        if (!data.title || !data.url) {
            throw new ValidationError('Resource must have title and URL');
        }

        // Add URL validation if needed
    }

    async validateNoteData(data) {
        if (!data.content || data.content.length < 5) {
            throw new ValidationError('Note content must be at least 5 characters long');
        }

        if (!data.userId) {
            throw new ValidationError('Note must have a user ID');
        }
    }

    // Notification methods
    async notifyNewSession(session) {
        await notificationClient.sendNotification({
            type: 'NEW_STUDY_SESSION',
            title: `New Study Session: ${session.title}`,
            description: `Scheduled for ${session.scheduledDate}`,
            recipients: ['ALL'],
            data: { sessionId: session._id }
        });
    }

    async notifySessionUpdate(session) {
        const recipients = session.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'STUDY_SESSION_UPDATE',
            title: `Study Session Updated: ${session.title}`,
            recipients,
            data: { sessionId: session._id }
        });
    }

    async notifyNewParticipant(session, participant) {
        const recipients = session.participants
            .map(p => p.userId)
            .filter(id => id.toString() !== participant.userId.toString());

        await notificationClient.sendNotification({
            type: 'NEW_SESSION_PARTICIPANT',
            title: `New Participant in ${session.title}`,
            recipients,
            data: { sessionId: session._id, participantId: participant.userId }
        });
    }

    async notifyParticipantLeft(session, userId) {
        const recipients = session.participants
            .map(p => p.userId)
            .filter(id => id.toString() !== userId.toString());

        await notificationClient.sendNotification({
            type: 'SESSION_PARTICIPANT_LEFT',
            title: `Participant Left ${session.title}`,
            recipients,
            data: { sessionId: session._id, participantId: userId }
        });
    }

    async notifyNewResource(session, resource) {
        const recipients = session.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'NEW_SESSION_RESOURCE',
            title: `New Resource in ${session.title}`,
            description: resource.title,
            recipients,
            data: { sessionId: session._id, resourceId: resource._id }
        });
    }

    async notifyNewNote(session, note) {
        const recipients = session.participants
            .map(p => p.userId)
            .filter(id => id.toString() !== note.userId.toString());

        await notificationClient.sendNotification({
            type: 'NEW_SESSION_NOTE',
            title: `New Note in ${session.title}`,
            recipients,
            data: { sessionId: session._id, noteId: note._id }
        });
    }

    async notifySessionCompletion(session) {
        const recipients = session.participants.map(p => p.userId);
        await notificationClient.sendNotification({
            type: 'STUDY_SESSION_COMPLETED',
            title: `Study Session Completed: ${session.title}`,
            description: session.summary,
            recipients,
            data: { sessionId: session._id }
        });
    }
}

module.exports = new StudySessionService();
