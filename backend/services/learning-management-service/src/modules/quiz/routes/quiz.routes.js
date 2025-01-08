const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { auth, roles } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const quizValidation = require('../validations/quiz.validation');

/**
 * Quiz Management Routes
 */
router.post(
    '/',
    auth(),
    roles(['admin', 'instructor']),
    validate(quizValidation.createQuiz),
    quizController.createQuiz
);

router.get(
    '/:quizId',
    auth(),
    validate(quizValidation.getQuiz),
    quizController.getQuiz
);

router.put(
    '/:quizId',
    auth(),
    roles(['admin', 'instructor']),
    validate(quizValidation.updateQuiz),
    quizController.updateQuiz
);

router.delete(
    '/:quizId',
    auth(),
    roles(['admin', 'instructor']),
    validate(quizValidation.deleteQuiz),
    quizController.deleteQuiz
);

router.get(
    '/',
    auth(),
    validate(quizValidation.listQuizzes),
    quizController.listQuizzes
);

/**
 * Quiz Attempt Routes
 */
router.post(
    '/:quizId/start',
    auth(),
    validate(quizValidation.startQuiz),
    quizController.startQuiz
);

router.post(
    '/attempts/:attemptId/submit',
    auth(),
    validate(quizValidation.submitQuiz),
    quizController.submitQuiz
);

router.get(
    '/:quizId/results',
    auth(),
    validate(quizValidation.getQuizResults),
    quizController.getQuizResults
);

/**
 * Quiz Analytics Routes
 */
router.get(
    '/:quizId/stats',
    auth(),
    roles(['admin', 'instructor']),
    validate(quizValidation.getQuizStats),
    quizController.getQuizStats
);

/**
 * Quiz Review Routes
 */
router.post(
    '/attempts/:attemptId/review',
    auth(),
    roles(['admin', 'instructor']),
    validate(quizValidation.reviewQuizAttempt),
    quizController.reviewQuizAttempt
);

module.exports = router;
