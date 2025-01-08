const express = require('express');
const assessmentController = require('../controllers/assessment.controller');
const { auth, roles } = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const assessmentValidation = require('../validations/assessment.validation');
const security = require('../../../utils/security');

const router = express.Router();

/**
 * Assessment Management
 */
router.post(
    '/',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.createAssessment),
    security.getMiddleware().validateInput,
    assessmentController.createAssessment
);

router.get(
    '/:assessmentId',
    auth.verifyToken,
    validate(assessmentValidation.getAssessment),
    assessmentController.getAssessment
);

router.put(
    '/:assessmentId',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.updateAssessment),
    assessmentController.updateAssessment
);

router.post(
    '/:assessmentId/publish',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.publishAssessment),
    assessmentController.publishAssessment
);

/**
 * Question Management
 */
router.post(
    '/:assessmentId/questions',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.addQuestion),
    assessmentController.addQuestion
);

router.put(
    '/:assessmentId/questions/:questionId',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.updateQuestion),
    assessmentController.updateQuestion
);

/**
 * Submission Management
 */
router.post(
    '/:assessmentId/submissions/start',
    auth.verifyToken,
    validate(assessmentValidation.startSubmission),
    assessmentController.startSubmission
);

router.post(
    '/submissions/:submissionId/submit',
    auth.verifyToken,
    validate(assessmentValidation.submitAssessment),
    assessmentController.submitAssessment
);

router.get(
    '/submissions/:submissionId',
    auth.verifyToken,
    validate(assessmentValidation.getSubmission),
    assessmentController.getSubmission
);

/**
 * Real-time Features
 */
router.post(
    '/:assessmentId/join',
    auth.verifyToken,
    validate(assessmentValidation.joinAssessment),
    assessmentController.joinAssessment
);

router.post(
    '/:assessmentId/leave',
    auth.verifyToken,
    validate(assessmentValidation.leaveAssessment),
    assessmentController.leaveAssessment
);

/**
 * Analytics
 */
router.get(
    '/:assessmentId/analytics/performance',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.getAnalytics),
    assessmentController.getPerformanceMetrics
);

router.get(
    '/:assessmentId/analytics/questions',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.getAnalytics),
    assessmentController.getQuestionMetrics
);

router.get(
    '/:assessmentId/analytics/time',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.getAnalytics),
    assessmentController.getTimeMetrics
);

router.get(
    '/:assessmentId/analytics/engagement',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.getAnalytics),
    assessmentController.getEngagementMetrics
);

/**
 * Advanced Features
 */
router.get(
    '/:assessmentId/report',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.generateReport),
    assessmentController.generateReport
);

router.post(
    '/:assessmentId/bulk-grade',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.bulkGrade),
    assessmentController.bulkGrade
);

router.get(
    '/submissions/:submissionId/feedback',
    auth.verifyToken,
    validate(assessmentValidation.getSubmissionFeedback),
    assessmentController.getSubmissionFeedback
);

router.post(
    '/submissions/:submissionId/peer-review',
    auth.verifyToken,
    validate(assessmentValidation.providePeerReview),
    assessmentController.providePeerReview
);

router.get(
    '/submissions/:submissionId/questions/:questionId/hint',
    auth.verifyToken,
    validate(assessmentValidation.requestHint),
    assessmentController.requestHint
);

router.post(
    '/submissions/:submissionId/progress',
    auth.verifyToken,
    validate(assessmentValidation.saveProgress),
    assessmentController.saveProgress
);

router.get(
    '/:assessmentId/leaderboard',
    auth.verifyToken,
    validate(assessmentValidation.getLeaderboard),
    assessmentController.getLeaderboard
);

/**
 * Bulk Operations
 */
router.post(
    '/:assessmentId/import',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.importQuestions),
    assessmentController.importQuestions
);

router.get(
    '/:assessmentId/export',
    auth.verifyToken,
    roles(['admin', 'instructor']),
    validate(assessmentValidation.exportAssessment),
    assessmentController.exportAssessment
);

// Apply common middleware to all routes
router.use(security.getMiddleware().rateLimiter);
router.use(security.getMiddleware().helmet);
router.use(security.getMiddleware().xss);
router.use(security.getMiddleware().mongoSanitize);

module.exports = router;
