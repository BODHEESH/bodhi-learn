const { Assessment, Submission } = require('../models/assessment.model');
const { NotFoundError, ValidationError } = require('../../../utils/errors');
const BaseService = require('../../../services/base.service');
const cacheStrategy = require('../../../utils/cacheStrategy');
const logger = require('../../../config/logger');

class AssessmentService extends BaseService {
    constructor() {
        super(Assessment);
        this.cacheKeyPrefix = 'assessment:';
    }

    /**
     * Assessment Management
     */
    async createAssessment(assessmentData, userId) {
        const assessment = await this.create({
            ...assessmentData,
            createdBy: userId
        });

        // Cache the assessment
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}`,
            assessment
        );

        return assessment;
    }

    async updateAssessment(assessmentId, updateData, userId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        // Update assessment
        Object.assign(assessment, {
            ...updateData,
            updatedBy: userId,
            updatedAt: new Date()
        });

        await assessment.save();

        // Update cache
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}`,
            assessment
        );

        return assessment;
    }

    async publishAssessment(assessmentId, userId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        if (assessment.questions.length === 0) {
            throw new ValidationError('Cannot publish assessment without questions');
        }

        assessment.status = 'published';
        assessment.updatedBy = userId;
        assessment.updatedAt = new Date();

        await assessment.save();

        // Update cache
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}`,
            assessment
        );

        return assessment;
    }

    /**
     * Question Management
     */
    async addQuestion(assessmentId, questionData, userId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        assessment.questions.push({
            ...questionData,
            createdBy: userId
        });

        await assessment.save();

        // Update cache
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}`,
            assessment
        );

        return assessment;
    }

    async updateQuestion(assessmentId, questionId, questionData, userId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        const question = assessment.questions.id(questionId);
        if (!question) {
            throw new NotFoundError('Question not found');
        }

        Object.assign(question, {
            ...questionData,
            updatedBy: userId,
            updatedAt: new Date()
        });

        await assessment.save();

        // Update cache
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}`,
            assessment
        );

        return assessment;
    }

    /**
     * Submission Management
     */
    async startSubmission(assessmentId, userId, metadata) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        // Check if user has remaining attempts
        const attemptCount = await Submission.countDocuments({
            assessmentId,
            userId,
            status: { $in: ['submitted', 'graded'] }
        });

        if (assessment.settings.maxAttempts && attemptCount >= assessment.settings.maxAttempts) {
            throw new ValidationError('Maximum attempts reached');
        }

        // Create new submission
        const submission = await Submission.create({
            assessmentId,
            userId,
            status: 'in_progress',
            metadata: {
                ...metadata,
                startTime: new Date(),
                attempt: attemptCount + 1
            }
        });

        return submission;
    }

    async submitAssessment(submissionId, answers, userId) {
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }

        const assessment = await this.findById(submission.assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        // Process answers and calculate score
        const processedAnswers = await this.processAnswers(assessment, answers);
        const totalScore = this.calculateTotalScore(processedAnswers);
        const passingScore = assessment.settings.passingScore || 0;

        // Update submission
        submission.answers = processedAnswers;
        submission.status = assessment.settings.gradingType === 'automatic' ? 'graded' : 'submitted';
        submission.score = {
            total: totalScore,
            percentage: (totalScore / assessment.metadata.totalPoints) * 100,
            passing: totalScore >= passingScore
        };
        submission.metadata.endTime = new Date();
        submission.metadata.duration = submission.metadata.endTime - submission.metadata.startTime;

        await submission.save();

        // Update assessment statistics
        await this.updateAssessmentStats(assessment._id);

        return submission;
    }

    /**
     * Analytics and Stats
     */
    async getAssessmentStats(assessmentId) {
        const cacheKey = `${this.cacheKeyPrefix}${assessmentId}:stats`;

        return cacheStrategy.execute('assessment', 'read', cacheKey, null, async () => {
            const [assessment, submissions] = await Promise.all([
                this.findById(assessmentId),
                Submission.find({
                    assessmentId,
                    status: 'graded'
                })
            ]);

            if (!assessment) {
                throw new NotFoundError('Assessment not found');
            }

            // Calculate detailed stats
            const stats = this.calculateDetailedStats(assessment, submissions);

            return stats;
        });
    }

    /**
     * Real-time Features
     */
    async joinAssessment(assessmentId, userId, socketId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        const participant = {
            userId,
            socketId,
            status: 'active',
            progress: 0,
            lastActive: new Date()
        };

        assessment.realtime.currentParticipants.push(participant);
        await assessment.save();

        return {
            assessment: this.sanitizeAssessment(assessment),
            participant
        };
    }

    async leaveAssessment(assessmentId, userId) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        assessment.realtime.currentParticipants = 
            assessment.realtime.currentParticipants.filter(p => 
                !p.userId.equals(userId)
            );

        await assessment.save();
    }

    /**
     * Enhanced Analytics
     */
    async getPerformanceMetrics(assessmentId) {
        const analytics = require('../utils/analytics');
        return analytics.calculatePerformanceMetrics(assessmentId);
    }

    async getQuestionMetrics(assessmentId) {
        const analytics = require('../utils/analytics');
        return analytics.calculateQuestionMetrics(assessmentId);
    }

    async getTimeMetrics(assessmentId) {
        const analytics = require('../utils/analytics');
        return analytics.calculateTimeMetrics(assessmentId);
    }

    async getEngagementMetrics(assessmentId) {
        const analytics = require('../utils/analytics');
        return analytics.calculateEngagementMetrics(assessmentId);
    }

    /**
     * Advanced Features
     */
    async generateReport(assessmentId, format = 'pdf') {
        const assessment = await this.findById(assessmentId)
            .populate('submissions');

        const metrics = {
            performance: await this.getPerformanceMetrics(assessmentId),
            questions: await this.getQuestionMetrics(assessmentId),
            time: await this.getTimeMetrics(assessmentId),
            engagement: await this.getEngagementMetrics(assessmentId)
        };

        // Generate report based on format
        switch (format.toLowerCase()) {
            case 'pdf':
                return this.generatePDFReport(assessment, metrics);
            case 'excel':
                return this.generateExcelReport(assessment, metrics);
            case 'json':
                return metrics;
            default:
                throw new ValidationError('Unsupported report format');
        }
    }

    async bulkGrade(assessmentId, grades) {
        const assessment = await this.findById(assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        const results = [];
        for (const grade of grades) {
            try {
                const submission = await Submission.findById(grade.submissionId);
                if (!submission) {
                    results.push({
                        submissionId: grade.submissionId,
                        success: false,
                        error: 'Submission not found'
                    });
                    continue;
                }

                submission.status = 'graded';
                submission.score = grade.score;
                submission.feedback = grade.feedback;
                await submission.save();

                results.push({
                    submissionId: grade.submissionId,
                    success: true
                });
            } catch (error) {
                results.push({
                    submissionId: grade.submissionId,
                    success: false,
                    error: error.message
                });
            }
        }

        await this.updateAssessmentStats(assessmentId);
        return results;
    }

    async getSubmissionFeedback(submissionId) {
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }

        const assessment = await this.findById(submission.assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        return {
            overall: this.generateOverallFeedback(submission, assessment),
            byQuestion: this.generateQuestionFeedback(submission, assessment),
            improvement: this.generateImprovementSuggestions(submission, assessment)
        };
    }

    async providePeerReview(submissionId, reviewerId, review) {
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }

        const assessment = await this.findById(submission.assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        if (!assessment.settings.peerReview?.enabled) {
            throw new ValidationError('Peer review is not enabled for this assessment');
        }

        submission.peerReviews = submission.peerReviews || [];
        submission.peerReviews.push({
            reviewerId,
            review,
            timestamp: new Date()
        });

        await submission.save();
        return submission;
    }

    async requestHint(submissionId, questionId, userId) {
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }

        const assessment = await this.findById(submission.assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        const question = assessment.questions.id(questionId);
        if (!question) {
            throw new NotFoundError('Question not found');
        }

        if (!question.hints?.length) {
            throw new ValidationError('No hints available for this question');
        }

        const answer = submission.answers.find(a => 
            a.questionId.equals(questionId)
        );

        if (!answer) {
            throw new ValidationError('Question not yet attempted');
        }

        answer.hintsUsed = answer.hintsUsed || [];
        const nextHintIndex = answer.hintsUsed.length;

        if (nextHintIndex >= question.hints.length) {
            throw new ValidationError('No more hints available');
        }

        const hint = question.hints[nextHintIndex];
        answer.hintsUsed.push({
            hintIndex: nextHintIndex,
            timestamp: new Date()
        });

        await submission.save();
        return hint;
    }

    async saveProgress(submissionId, answers, userId) {
        const submission = await Submission.findById(submissionId);
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }

        const assessment = await this.findById(submission.assessmentId);
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        submission.answers = answers;
        submission.lastSaved = new Date();
        await submission.save();

        return {
            progress: this.calculateProgress(submission, assessment),
            lastSaved: submission.lastSaved
        };
    }

    async getLeaderboard(assessmentId, type = 'score') {
        const assessment = await this.findById(assessmentId)
            .populate('submissions');

        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        let submissions = assessment.submissions;

        // Sort based on type
        switch (type) {
            case 'score':
                submissions.sort((a, b) => b.score.total - a.score.total);
                break;
            case 'time':
                submissions.sort((a, b) => a.metadata.duration - b.metadata.duration);
                break;
            case 'accuracy':
                submissions.sort((a, b) => b.score.percentage - a.score.percentage);
                break;
            default:
                throw new ValidationError('Invalid leaderboard type');
        }

        // Get top 10
        return submissions.slice(0, 10).map(s => ({
            userId: s.userId,
            score: s.score,
            duration: s.metadata.duration,
            rank: submissions.indexOf(s) + 1
        }));
    }

    /**
     * Helper Methods
     */
    sanitizeAssessment(assessment) {
        const sanitized = assessment.toObject();
        
        // Remove sensitive data
        if (assessment.status !== 'published') {
            delete sanitized.questions;
        }
        delete sanitized.metadata.analytics;
        
        return sanitized;
    }

    calculateProgress(submission, assessment) {
        const totalQuestions = assessment.questions.length;
        const answeredQuestions = submission.answers.length;
        return Math.round((answeredQuestions / totalQuestions) * 100);
    }

    generateOverallFeedback(submission, assessment) {
        const score = submission.score;
        const passingScore = assessment.settings.passingScore || 0;

        let feedback = {
            performance: score.percentage >= passingScore ? 'Pass' : 'Fail',
            score: `${score.total}/${assessment.metadata.totalPoints}`,
            percentage: `${score.percentage}%`,
            timeSpent: this.formatDuration(submission.metadata.duration),
            strengths: [],
            weaknesses: []
        };

        // Analyze strengths and weaknesses
        submission.answers.forEach(answer => {
            const question = assessment.questions.id(answer.questionId);
            if (!question) return;

            const performance = answer.score / question.scoring.points;
            if (performance >= 0.8) {
                feedback.strengths.push(question.metadata.skills || []);
            } else if (performance <= 0.4) {
                feedback.weaknesses.push(question.metadata.skills || []);
            }
        });

        return feedback;
    }

    generateQuestionFeedback(submission, assessment) {
        return submission.answers.map(answer => {
            const question = assessment.questions.id(answer.questionId);
            if (!question) return null;

            return {
                questionId: answer.questionId,
                type: question.type,
                performance: (answer.score / question.scoring.points) * 100,
                timeSpent: this.formatDuration(answer.timeSpent),
                feedback: this.getQuestionFeedback(answer, question),
                improvement: this.getQuestionImprovement(answer, question)
            };
        }).filter(Boolean);
    }

    generateImprovementSuggestions(submission, assessment) {
        const suggestions = [];

        // Time management
        if (submission.metadata.duration > assessment.settings.timeLimit * 0.9) {
            suggestions.push({
                area: 'Time Management',
                suggestion: 'Try to manage your time better. Spend less time on difficult questions initially.'
            });
        }

        // Question type performance
        const typePerformance = new Map();
        submission.answers.forEach(answer => {
            const question = assessment.questions.id(answer.questionId);
            if (!question) return;

            const current = typePerformance.get(question.type) || {
                total: 0,
                correct: 0
            };
            current.total++;
            if (answer.score === question.scoring.points) {
                current.correct++;
            }
            typePerformance.set(question.type, current);
        });

        typePerformance.forEach((performance, type) => {
            if (performance.correct / performance.total < 0.6) {
                suggestions.push({
                    area: `${type} Questions`,
                    suggestion: `Practice more ${type} questions to improve your performance.`
                });
            }
        });

        return suggestions;
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }

    getQuestionFeedback(answer, question) {
        const performance = answer.score / question.scoring.points;
        
        if (performance === 1) {
            return question.content.feedback?.correct || 'Excellent work!';
        } else if (performance >= 0.5) {
            return question.content.feedback?.partial || 'Good attempt, but there\'s room for improvement.';
        } else {
            return question.content.feedback?.incorrect || 'Review this topic and try again.';
        }
    }

    getQuestionImprovement(answer, question) {
        const improvements = [];

        // Time management
        if (answer.timeSpent > question.metadata.estimatedTime * 1.5) {
            improvements.push('Spend less time on this type of question');
        }

        // Hint usage
        if (answer.hintsUsed?.length === question.hints?.length) {
            improvements.push('Try to solve without using all hints');
        }

        // Pattern-specific improvements
        switch (question.type) {
            case 'multiple-choice':
                if (answer.attempts > 1) {
                    improvements.push('Review elimination strategies for multiple choice');
                }
                break;
            case 'essay':
                if (answer.score < question.scoring.points * 0.7) {
                    improvements.push('Focus on key points and proper structure');
                }
                break;
            // Add more question type specific improvements
        }

        return improvements;
    }

    async processAnswers(assessment, answers) {
        return Promise.all(
            answers.map(async (answer) => {
                const question = assessment.questions.id(answer.questionId);
                if (!question) {
                    throw new ValidationError(`Invalid question ID: ${answer.questionId}`);
                }

                let score = 0;
                if (question.type === 'essay' || question.type === 'coding') {
                    // Manual grading required
                    score = null;
                } else {
                    score = await this.calculateQuestionScore(question, answer);
                }

                return {
                    questionId: answer.questionId,
                    answer: answer.answer,
                    score,
                    timeSpent: answer.timeSpent
                };
            })
        );
    }

    calculateQuestionScore(question, answer) {
        switch (question.type) {
            case 'multiple-choice':
            case 'true-false':
                return this.scoreMultipleChoice(question, answer);
            case 'matching':
                return this.scoreMatching(question, answer);
            case 'fill-blank':
                return this.scoreFillBlank(question, answer);
            default:
                return 0;
        }
    }

    calculateTotalScore(answers) {
        return answers.reduce((total, answer) => total + (answer.score || 0), 0);
    }

    async updateAssessmentStats(assessmentId) {
        const [assessment, submissions] = await Promise.all([
            this.findById(assessmentId),
            Submission.find({
                assessmentId,
                status: 'graded'
            })
        ]);

        if (!assessment || submissions.length === 0) return;

        // Calculate new stats
        const totalScores = submissions.map(s => s.score.total);
        const averageScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
        const completionRate = (submissions.length / assessment.stats.attempts) * 100;
        const timeSpentAvg = submissions.reduce((a, b) => a + b.metadata.duration, 0) / submissions.length;

        // Update assessment stats
        assessment.stats = {
            attempts: assessment.stats.attempts + 1,
            averageScore,
            completionRate,
            timeSpentAvg
        };

        await assessment.save();

        // Update cache
        await cacheStrategy.execute(
            'assessment',
            'write',
            `${this.cacheKeyPrefix}${assessment._id}:stats`,
            assessment.stats
        );
    }

    calculateDetailedStats(assessment, submissions) {
        return {
            overview: {
                totalSubmissions: submissions.length,
                averageScore: assessment.stats.averageScore,
                completionRate: assessment.stats.completionRate,
                averageTime: assessment.stats.timeSpentAvg
            },
            questionStats: assessment.questions.map(question => {
                const questionSubmissions = submissions.flatMap(s => 
                    s.answers.filter(a => a.questionId.equals(question._id))
                );
                return {
                    questionId: question._id,
                    averageScore: this.calculateAverageScore(questionSubmissions),
                    difficultyIndex: this.calculateDifficultyIndex(questionSubmissions),
                    discriminationIndex: this.calculateDiscriminationIndex(questionSubmissions)
                };
            }),
            scoreDistribution: this.calculateScoreDistribution(submissions),
            timeDistribution: this.calculateTimeDistribution(submissions)
        };
    }
}

module.exports = new AssessmentService();
