const express = require('express');
const courseController = require('../controllers/course.controller');
const courseValidation = require('../validations/course.validation');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const security = require('../utils/security');

const router = express.Router();

/**
 * Course Management Routes
 */
router
    .route('/')
    .post(
        auth.verifyToken,
        auth.checkRole(['admin', 'instructor']),
        validate(courseValidation.createCourse),
        security.getMiddleware().validateInput,
        courseController.createCourse
    )
    .get(
        validate(courseValidation.getCourses),
        courseController.getCourses
    );

router
    .route('/:courseId')
    .get(
        auth.verifyToken,
        courseController.getCourse
    );

/**
 * Version Management Routes
 */
router
    .route('/:courseId/versions')
    .post(
        auth.verifyToken,
        auth.checkOwnership('course'),
        validate(courseValidation.createVersion),
        courseController.createVersion
    )
    .get(
        auth.verifyToken,
        auth.checkPermission('course', 'read'),
        courseController.getVersionHistory
    );

router
    .route('/:courseId/versions/:version/publish')
    .post(
        auth.verifyToken,
        auth.checkRole(['admin', 'instructor']),
        auth.checkOwnership('course'),
        validate(courseValidation.publishVersion),
        courseController.publishVersion
    );

/**
 * Template Management Routes
 */
router
    .route('/templates')
    .post(
        auth.verifyToken,
        auth.checkRole(['admin']),
        validate(courseValidation.createTemplate),
        courseController.createTemplate
    )
    .get(
        auth.verifyToken,
        auth.checkPermission('template', 'read'),
        courseController.getTemplates
    );

router
    .route('/templates/:templateId/create')
    .post(
        auth.verifyToken,
        auth.checkRole(['admin', 'instructor']),
        courseController.createFromTemplate
    );

/**
 * Workflow Management Routes
 */
router
    .route('/:courseId/workflow')
    .put(
        auth.verifyToken,
        auth.checkOwnership('course'),
        validate(courseValidation.updateWorkflowStage),
        courseController.updateWorkflowStage
    );

router
    .route('/:courseId/workflow/comments')
    .post(
        auth.verifyToken,
        auth.checkPermission('course', 'comment'),
        courseController.addWorkflowComment
    );

/**
 * Analytics Routes
 */
router
    .route('/:courseId/analytics')
    .get(
        auth.verifyToken,
        auth.checkPermission('analytics', 'read'),
        validate(courseValidation.getAnalytics),
        courseController.getCourseAnalytics
    );

/**
 * Related Courses Routes
 */
router
    .route('/:courseId/related')
    .get(
        auth.verifyToken,
        courseController.getRelatedCourses
    );

// Apply common middleware to all routes
router.use(security.getMiddleware().rateLimiter);
router.use(security.getMiddleware().helmet);
router.use(security.getMiddleware().xss);
router.use(security.getMiddleware().mongoSanitize);

module.exports = router;
