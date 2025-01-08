const assessmentService = require('../services/assessment.service');
const { NotFoundError } = require('../../../utils/errors');
const logger = require('../../../config/logger');

class AssessmentController {
    /**
     * Assessment Management
     */
    async createAssessment(req, res, next) {
        try {
            const assessment = await assessmentService.createAssessment(req.body, req.user.id);
            res.status(201).json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    async getAssessment(req, res, next) {
        try {
            const assessment = await assessmentService.findById(req.params.assessmentId);
            if (!assessment) {
                throw new NotFoundError('Assessment not found');
            }

            res.json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAssessment(req, res, next) {
        try {
            const assessment = await assessmentService.updateAssessment(
                req.params.assessmentId,
                req.body,
                req.user.id
            );
            res.json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    async publishAssessment(req, res, next) {
        try {
            const assessment = await assessmentService.publishAssessment(
                req.params.assessmentId,
                req.user.id
            );
            res.json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Question Management
     */
    async addQuestion(req, res, next) {
        try {
            const assessment = await assessmentService.addQuestion(
                req.params.assessmentId,
                req.body,
                req.user.id
            );
            res.status(201).json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    async updateQuestion(req, res, next) {
        try {
            const assessment = await assessmentService.updateQuestion(
                req.params.assessmentId,
                req.params.questionId,
                req.body,
                req.user.id
            );
            res.json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submission Management
     */
    async startSubmission(req, res, next) {
        try {
            const submission = await assessmentService.startSubmission(
                req.params.assessmentId,
                req.user.id,
                {
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    ...req.body.metadata
                }
            );
            res.status(201).json({
                status: 'success',
                data: submission
            });
        } catch (error) {
            next(error);
        }
    }

    async submitAssessment(req, res, next) {
        try {
            const submission = await assessmentService.submitAssessment(
                req.params.submissionId,
                req.body.answers,
                req.user.id
            );
            res.json({
                status: 'success',
                data: submission
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubmission(req, res, next) {
        try {
            const submission = await assessmentService.findSubmissionById(req.params.submissionId);
            if (!submission) {
                throw new NotFoundError('Submission not found');
            }

            res.json({
                status: 'success',
                data: submission
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Analytics
     */
    async getAssessmentStats(req, res, next) {
        try {
            const stats = await assessmentService.getAssessmentStats(
                req.params.assessmentId
            );
            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk Operations
     */
    async importQuestions(req, res, next) {
        try {
            const assessment = await assessmentService.importQuestions(
                req.params.assessmentId,
                req.body.questions,
                req.user.id
            );
            res.json({
                status: 'success',
                data: assessment
            });
        } catch (error) {
            next(error);
        }
    }

    async exportAssessment(req, res, next) {
        try {
            const exportData = await assessmentService.exportAssessment(
                req.params.assessmentId,
                req.query.format || 'json'
            );
            res.json({
                status: 'success',
                data: exportData
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Real-time Features
     */
    async joinAssessment(req, res, next) {
        try {
            const { assessmentId } = req.params;
            const { socketId } = req.body;

            const joinData = await assessmentService.joinAssessment(
                assessmentId,
                req.user.id,
                socketId
            );

            res.json({
                status: 'success',
                data: joinData
            });
        } catch (error) {
            next(error);
        }
    }

    async leaveAssessment(req, res, next) {
        try {
            const { assessmentId } = req.params;
            await assessmentService.leaveAssessment(
                assessmentId,
                req.user.id
            );

            res.json({
                status: 'success',
                message: 'Successfully left assessment'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Enhanced Analytics
     */
    async getPerformanceMetrics(req, res, next) {
        try {
            const metrics = await assessmentService.getPerformanceMetrics(
                req.params.assessmentId
            );
            res.json({
                status: 'success',
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    async getQuestionMetrics(req, res, next) {
        try {
            const metrics = await assessmentService.getQuestionMetrics(
                req.params.assessmentId
            );
            res.json({
                status: 'success',
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    async getTimeMetrics(req, res, next) {
        try {
            const metrics = await assessmentService.getTimeMetrics(
                req.params.assessmentId
            );
            res.json({
                status: 'success',
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    async getEngagementMetrics(req, res, next) {
        try {
            const metrics = await assessmentService.getEngagementMetrics(
                req.params.assessmentId
            );
            res.json({
                status: 'success',
                data: metrics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Advanced Features
     */
    async generateReport(req, res, next) {
        try {
            const report = await assessmentService.generateReport(
                req.params.assessmentId,
                req.query.format || 'pdf'
            );
            res.json({
                status: 'success',
                data: report
            });
        } catch (error) {
            next(error);
        }
    }

    async bulkGrade(req, res, next) {
        try {
            const results = await assessmentService.bulkGrade(
                req.params.assessmentId,
                req.body.grades
            );
            res.json({
                status: 'success',
                data: results
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubmissionFeedback(req, res, next) {
        try {
            const feedback = await assessmentService.getSubmissionFeedback(
                req.params.submissionId
            );
            res.json({
                status: 'success',
                data: feedback
            });
        } catch (error) {
            next(error);
        }
    }

    async providePeerReview(req, res, next) {
        try {
            const review = await assessmentService.providePeerReview(
                req.params.submissionId,
                req.user.id,
                req.body.review
            );
            res.json({
                status: 'success',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }

    async requestHint(req, res, next) {
        try {
            const hint = await assessmentService.requestHint(
                req.params.submissionId,
                req.params.questionId,
                req.user.id
            );
            res.json({
                status: 'success',
                data: hint
            });
        } catch (error) {
            next(error);
        }
    }

    async saveProgress(req, res, next) {
        try {
            const progress = await assessmentService.saveProgress(
                req.params.submissionId,
                req.body.answers,
                req.user.id
            );
            res.json({
                status: 'success',
                data: progress
            });
        } catch (error) {
            next(error);
        }
    }

    async getLeaderboard(req, res, next) {
        try {
            const leaderboard = await assessmentService.getLeaderboard(
                req.params.assessmentId,
                req.query.type || 'score'
            );
            res.json({
                status: 'success',
                data: leaderboard
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AssessmentController();
