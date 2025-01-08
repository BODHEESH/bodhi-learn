const express = require('express');
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const courseController = require('../controllers/course.controller');
const courseValidation = require('../validations/course.validation');

const router = express.Router();

// Base course routes
router
    .route('/')
    .post(
        auth('manageCourses'),
        validate(courseValidation.createCourseSchema),
        courseController.createCourse
    )
    .get(
        auth(),
        validate(courseValidation.getCoursesSchema),
        courseController.getCourses
    );

router
    .route('/:courseId')
    .get(
        auth(),
        validate(courseValidation.getCourseSchema),
        courseController.getCourse
    )
    .patch(
        auth('manageCourses'),
        validate(courseValidation.updateCourseSchema),
        courseController.updateCourse
    )
    .delete(
        auth('manageCourses'),
        validate(courseValidation.deleteCourseSchema),
        courseController.deleteCourse
    );

// Featured and recommended courses
router.get(
    '/featured',
    auth(),
    validate(courseValidation.getFeaturedCoursesSchema),
    courseController.getFeaturedCourses
);

router.get(
    '/recommended',
    auth(),
    validate(courseValidation.getRecommendedCoursesSchema),
    courseController.getRecommendedCourses
);

// Course analytics
router.get(
    '/:courseId/analytics',
    auth('manageCourses'),
    validate(courseValidation.getCourseAnalyticsSchema),
    courseController.getCourseAnalytics
);

// Course settings
router.patch(
    '/:courseId/settings',
    auth('manageCourses'),
    validate(courseValidation.updateCourseSettingsSchema),
    courseController.updateCourseSettings
);

// Course resources
router.patch(
    '/:courseId/resources',
    auth('manageCourses'),
    validate(courseValidation.updateCourseResourcesSchema),
    courseController.updateCourseResources
);

// Course FAQs
router.patch(
    '/:courseId/faqs',
    auth('manageCourses'),
    validate(courseValidation.updateCourseFAQsSchema),
    courseController.updateCourseFAQs
);

// Course schedule
router.patch(
    '/:courseId/schedule',
    auth('manageCourses'),
    validate(courseValidation.updateCourseScheduleSchema),
    courseController.updateCourseSchedule
);

// Course certificate
router.get(
    '/:courseId/certificate',
    auth(),
    validate(courseValidation.getCourseCertificateSchema),
    courseController.getCourseCertificate
);

module.exports = router;