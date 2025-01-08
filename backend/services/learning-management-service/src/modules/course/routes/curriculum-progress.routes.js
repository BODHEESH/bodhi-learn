const express = require('express');
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const curriculumProgressController = require('../controllers/curriculum-progress.controller');
const curriculumProgressValidation = require('../validations/curriculum-progress.validation');

const router = express.Router();

// Initialize progress
router.post(
    '/',
    auth(),
    validate(curriculumProgressValidation.initializeProgressSchema),
    curriculumProgressController.initializeProgress
);

// Get progress
router.get(
    '/:curriculumId',
    auth(),
    validate(curriculumProgressValidation.getProgressSchema),
    curriculumProgressController.getProgress
);

// Update item progress
router.patch(
    '/:curriculumId/items/:itemId',
    auth(),
    validate(curriculumProgressValidation.updateItemProgressSchema),
    curriculumProgressController.updateItemProgress
);

// Bookmarks
router.post(
    '/:curriculumId/items/:itemId/bookmarks',
    auth(),
    validate(curriculumProgressValidation.addBookmarkSchema),
    curriculumProgressController.addBookmark
);

// Notes
router.post(
    '/:curriculumId/items/:itemId/notes',
    auth(),
    validate(curriculumProgressValidation.addNoteSchema),
    curriculumProgressController.addNote
);

// Statistics
router.get(
    '/stats/user',
    auth(),
    curriculumProgressController.getUserProgressStats
);

router.get(
    '/stats/course/:courseId',
    auth(),
    validate(curriculumProgressValidation.getCourseProgressStatsSchema),
    curriculumProgressController.getCourseProgressStats
);

router.get(
    '/stats/organization',
    auth('manageOrganization'),
    curriculumProgressController.getOrganizationProgressStats
);

module.exports = router;
