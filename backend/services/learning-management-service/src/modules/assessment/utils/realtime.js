const socketIO = require('socket.io');
const logger = require('../../../config/logger');
const { Assessment } = require('../models/assessment.model');

class RealtimeManager {
    constructor() {
        this.io = null;
        this.activeAssessments = new Map();
    }

    initialize(server) {
        this.io = socketIO(server);
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            // Join assessment room
            socket.on('joinAssessment', async (data) => {
                try {
                    await this.handleJoinAssessment(socket, data);
                } catch (error) {
                    logger.error('Error joining assessment:', error);
                    socket.emit('error', { message: 'Failed to join assessment' });
                }
            });

            // Leave assessment room
            socket.on('leaveAssessment', async (data) => {
                try {
                    await this.handleLeaveAssessment(socket, data);
                } catch (error) {
                    logger.error('Error leaving assessment:', error);
                }
            });

            // Update progress
            socket.on('updateProgress', async (data) => {
                try {
                    await this.handleProgressUpdate(socket, data);
                } catch (error) {
                    logger.error('Error updating progress:', error);
                }
            });

            // Collaborative features
            socket.on('collaborativeAction', async (data) => {
                try {
                    await this.handleCollaborativeAction(socket, data);
                } catch (error) {
                    logger.error('Error handling collaborative action:', error);
                }
            });

            // Handle disconnection
            socket.on('disconnect', async () => {
                try {
                    await this.handleDisconnection(socket);
                } catch (error) {
                    logger.error('Error handling disconnection:', error);
                }
            });
        });
    }

    /**
     * Event Handlers
     */
    async handleJoinAssessment(socket, { assessmentId, userId }) {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment || !assessment.realtime.enabled) {
            throw new Error('Assessment not found or realtime not enabled');
        }

        // Join room
        socket.join(`assessment:${assessmentId}`);
        socket.assessmentId = assessmentId;
        socket.userId = userId;

        // Update active participants
        await this.updateParticipant(assessmentId, userId, {
            status: 'active',
            lastActive: new Date()
        });

        // Send initial state
        const assessmentState = await this.getAssessmentState(assessmentId);
        socket.emit('assessmentState', assessmentState);

        // Notify others
        this.io.to(`assessment:${assessmentId}`).emit('participantJoined', {
            userId,
            timestamp: new Date()
        });
    }

    async handleLeaveAssessment(socket, { assessmentId, userId }) {
        // Leave room
        socket.leave(`assessment:${assessmentId}`);

        // Update participant status
        await this.updateParticipant(assessmentId, userId, {
            status: 'inactive',
            lastActive: new Date()
        });

        // Notify others
        this.io.to(`assessment:${assessmentId}`).emit('participantLeft', {
            userId,
            timestamp: new Date()
        });
    }

    async handleProgressUpdate(socket, { assessmentId, userId, progress }) {
        // Update participant progress
        await this.updateParticipant(assessmentId, userId, {
            progress,
            lastActive: new Date()
        });

        // Update assessment analytics
        await this.updateAssessmentAnalytics(assessmentId);

        // Broadcast progress update if enabled
        const assessment = await Assessment.findById(assessmentId);
        if (assessment.realtime.settings.showProgress) {
            this.io.to(`assessment:${assessmentId}`).emit('progressUpdate', {
                userId,
                progress,
                timestamp: new Date()
            });
        }
    }

    async handleCollaborativeAction(socket, { assessmentId, action, data }) {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment.realtime.settings.collaborative) {
            return;
        }

        switch (action) {
            case 'discussion':
                await this.handleDiscussion(socket, assessmentId, data);
                break;
            case 'hint':
                await this.handleHintRequest(socket, assessmentId, data);
                break;
            case 'peerHelp':
                await this.handlePeerHelp(socket, assessmentId, data);
                break;
            default:
                logger.warn(`Unknown collaborative action: ${action}`);
        }
    }

    async handleDisconnection(socket) {
        if (socket.assessmentId && socket.userId) {
            await this.handleLeaveAssessment(socket, {
                assessmentId: socket.assessmentId,
                userId: socket.userId
            });
        }
    }

    /**
     * Helper Methods
     */
    async updateParticipant(assessmentId, userId, update) {
        await Assessment.findOneAndUpdate(
            {
                _id: assessmentId,
                'realtime.currentParticipants.userId': userId
            },
            {
                $set: {
                    'realtime.currentParticipants.$': {
                        userId,
                        ...update
                    }
                }
            },
            { upsert: true }
        );
    }

    async getAssessmentState(assessmentId) {
        const assessment = await Assessment.findById(assessmentId);
        return {
            participants: assessment.realtime.currentParticipants,
            analytics: assessment.realtime.analytics,
            leaderboard: await this.generateLeaderboard(assessmentId)
        };
    }

    async updateAssessmentAnalytics(assessmentId) {
        const assessment = await Assessment.findById(assessmentId);
        const participants = assessment.realtime.currentParticipants;

        // Calculate participation rate
        const activeParticipants = participants.filter(p => p.status === 'active');
        const participationRate = activeParticipants.length / participants.length;

        // Calculate average completion time
        const completedParticipants = participants.filter(p => p.progress === 100);
        const averageCompletionTime = completedParticipants.length > 0
            ? completedParticipants.reduce((sum, p) => sum + p.timeSpent, 0) / completedParticipants.length
            : 0;

        // Identify dropoff points
        const dropoffPoints = this.calculateDropoffPoints(participants);

        // Update analytics
        await Assessment.findByIdAndUpdate(assessmentId, {
            'realtime.analytics': {
                participationRate,
                averageCompletionTime,
                dropoffPoints
            }
        });
    }

    async generateLeaderboard(assessmentId) {
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment.realtime.settings.showLeaderboard) {
            return null;
        }

        const participants = assessment.realtime.currentParticipants
            .filter(p => p.progress > 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (b.progress !== a.progress) return b.progress - a.progress;
                return a.timeSpent - b.timeSpent;
            })
            .slice(0, 10);

        return participants.map(p => ({
            userId: p.userId,
            score: p.score,
            progress: p.progress,
            timeSpent: p.timeSpent
        }));
    }

    calculateDropoffPoints(participants) {
        const progressCounts = new Map();
        participants.forEach(p => {
            const progressBucket = Math.floor(p.progress / 10) * 10;
            progressCounts.set(progressBucket, (progressCounts.get(progressBucket) || 0) + 1);
        });

        return Array.from(progressCounts.entries())
            .map(([progress, count]) => ({ progress, count }))
            .sort((a, b) => a.progress - b.progress);
    }

    /**
     * Collaborative Features
     */
    async handleDiscussion(socket, assessmentId, { questionId, message }) {
        this.io.to(`assessment:${assessmentId}`).emit('discussion', {
            questionId,
            userId: socket.userId,
            message,
            timestamp: new Date()
        });
    }

    async handleHintRequest(socket, assessmentId, { questionId }) {
        const assessment = await Assessment.findById(assessmentId);
        const question = assessment.questions.id(questionId);

        if (question.hints && question.hints.length > 0) {
            socket.emit('hint', {
                questionId,
                hint: question.hints[0],
                timestamp: new Date()
            });
        }
    }

    async handlePeerHelp(socket, assessmentId, { questionId, helpType }) {
        this.io.to(`assessment:${assessmentId}`).emit('peerHelpRequest', {
            questionId,
            userId: socket.userId,
            helpType,
            timestamp: new Date()
        });
    }
}

module.exports = new RealtimeManager();
