const express = require('express');
const { validate } = require('../../../middlewares/validate');
const learningPathValidation = require('../validations/learning-path.validation');
const learningPathController = require('../controllers/learning-path.controller');
const auth = require('../../../middlewares/auth');
const { roles } = require('../../../config/roles');

const router = express.Router();

// Learning Path Management Routes
router
    .route('/')
    .post(
        auth(),
        validate(learningPathValidation.createLearningPath),
        learningPathController.createLearningPath
    )
    .get(
        auth(),
        validate(learningPathValidation.listLearningPaths),
        learningPathController.listLearningPaths
    );

router
    .route('/:pathId')
    .get(
        auth(),
        validate(learningPathValidation.getLearningPath),
        learningPathController.getLearningPath
    )
    .patch(
        auth(),
        validate(learningPathValidation.updateLearningPath),
        learningPathController.updateLearningPath
    )
    .delete(
        auth(),
        validate(learningPathValidation.deleteLearningPath),
        learningPathController.deleteLearningPath
    );

// Enrollment and Progress Routes
router
    .route('/:pathId/enroll')
    .post(
        auth(),
        validate(learningPathValidation.enrollInPath),
        learningPathController.enrollInPath
    );

router
    .route('/enrollments/:enrollmentId/progress')
    .patch(
        auth(),
        validate(learningPathValidation.updateProgress),
        learningPathController.updateProgress
    );

router
    .route('/:pathId/progress')
    .get(
        auth(),
        validate(learningPathValidation.getUserProgress),
        learningPathController.getUserProgress
    );

// Analytics Routes
router
    .route('/:pathId/analytics')
    .get(
        auth(roles.ADMIN, roles.INSTRUCTOR),
        validate(learningPathValidation.getAnalytics),
        learningPathController.getAnalytics
    );

// Stage and Milestone Routes
router
    .route('/:pathId/stages/:stageIndex')
    .get(
        auth(),
        validate(learningPathValidation.getStageDetails),
        learningPathController.getStageDetails
    );

router
    .route('/:pathId/stages/:stageIndex/milestones/:milestoneIndex')
    .get(
        auth(),
        validate(learningPathValidation.getMilestoneDetails),
        learningPathController.getMilestoneDetails
    );

// Prerequisites and Objectives Routes
router
    .route('/:pathId/prerequisites')
    .get(
        auth(),
        validate(learningPathValidation.getPrerequisites),
        learningPathController.getPrerequisites
    );

router
    .route('/:pathId/objectives')
    .get(
        auth(),
        validate(learningPathValidation.getLearningObjectives),
        learningPathController.getLearningObjectives
    );

module.exports = router;
