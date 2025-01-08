const httpStatus = require('http-status');
const QuizService = require('../services/quiz.service');
const { ApiError } = require('../../../utils/errors');
const logger = require('../../../config/logger');

class QuizController {
    constructor() {
        this.quizService = new QuizService();
    }

    /**
     * Create Quiz
     */
    async createQuiz(req, res, next) {
        try {
            const quiz = await this.quizService.createQuiz({
                ...req.body,
                createdBy: req.user.id
            });
            res.status(httpStatus.CREATED).json({
                status: 'success',
                data: quiz
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Quiz
     */
    async getQuiz(req, res, next) {
        try {
            const quiz = await this.quizService.getQuizById(req.params.quizId);
            if (!quiz) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
            }
            res.json({
                status: 'success',
                data: quiz
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update Quiz
     */
    async updateQuiz(req, res, next) {
        try {
            const quiz = await this.quizService.updateQuiz(
                req.params.quizId,
                req.body,
                req.user.id
            );
            res.json({
                status: 'success',
                data: quiz
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete Quiz
     */
    async deleteQuiz(req, res, next) {
        try {
            await this.quizService.deleteQuiz(req.params.quizId);
            res.status(httpStatus.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * List Quizzes
     */
    async listQuizzes(req, res, next) {
        try {
            const filter = { ...req.query };
            const options = {
                limit: parseInt(req.query.limit, 10) || 10,
                page: parseInt(req.query.page, 10) || 1,
                sortBy: req.query.sortBy || 'createdAt:desc'
            };
            const quizzes = await this.quizService.queryQuizzes(filter, options);
            res.json({
                status: 'success',
                data: quizzes
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Start Quiz
     */
    async startQuiz(req, res, next) {
        try {
            const attempt = await this.quizService.startQuiz(
                req.params.quizId,
                req.user.id
            );
            res.json({
                status: 'success',
                data: attempt
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit Quiz
     */
    async submitQuiz(req, res, next) {
        try {
            const result = await this.quizService.submitQuiz(
                req.params.attemptId,
                req.body.answers,
                req.user.id
            );
            res.json({
                status: 'success',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Quiz Results
     */
    async getQuizResults(req, res, next) {
        try {
            const results = await this.quizService.getQuizResults(
                req.params.quizId,
                req.user.id
            );
            res.json({
                status: 'success',
                data: results
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Quiz Statistics
     */
    async getQuizStats(req, res, next) {
        try {
            const stats = await this.quizService.getQuizStats(req.params.quizId);
            res.json({
                status: 'success',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Review Quiz Attempt
     */
    async reviewQuizAttempt(req, res, next) {
        try {
            const review = await this.quizService.reviewQuizAttempt(
                req.params.attemptId,
                req.body.feedback,
                req.user.id
            );
            res.json({
                status: 'success',
                data: review
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QuizController();
