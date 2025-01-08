const express = require('express');
const curriculumController = require('../controllers/curriculum.controller');
const validate = require('../../../middleware/validate');
const auth = require('../../../middleware/auth');
const curriculumValidation = require('../validations/curriculum.validation');

const router = express.Router();

// Base curriculum routes
router
    .route('/')
    .post(
        auth('manageCourses'),
        validate(curriculumValidation.createCurriculumSchema),
        curriculumController.createCurriculum
    );

router
    .route('/course/:courseId')
    .get(
        auth(),
        curriculumController.getCurriculumByCourse
    );

router
    .route('/:curriculumId')
    .get(
        auth(),
        validate(curriculumValidation.getCurriculumSchema),
        curriculumController.getCurriculum
    )
    .patch(
        auth('manageCourses'),
        validate(curriculumValidation.updateCurriculumSchema),
        curriculumController.updateCurriculum
    )
    .delete(
        auth('manageCourses'),
        validate(curriculumValidation.deleteCurriculumSchema),
        curriculumController.deleteCurriculum
    );

// Section routes
router
    .route('/:curriculumId/sections')
    .post(
        auth('manageCourses'),
        validate(curriculumValidation.addSectionSchema),
        curriculumController.addSection
    );

router
    .route('/:curriculumId/sections/reorder')
    .patch(
        auth('manageCourses'),
        validate(curriculumValidation.reorderSectionsSchema),
        curriculumController.reorderSections
    );

router
    .route('/:curriculumId/sections/:sectionId')
    .patch(
        auth('manageCourses'),
        validate(curriculumValidation.updateSectionSchema),
        curriculumController.updateSection
    )
    .delete(
        auth('manageCourses'),
        validate(curriculumValidation.deleteSectionSchema),
        curriculumController.deleteSection
    );

// Item routes
router
    .route('/:curriculumId/sections/:sectionId/items')
    .post(
        auth('manageCourses'),
        validate(curriculumValidation.addItemSchema),
        curriculumController.addItem
    );

router
    .route('/:curriculumId/sections/:sectionId/items/reorder')
    .patch(
        auth('manageCourses'),
        validate(curriculumValidation.reorderItemsSchema),
        curriculumController.reorderItems
    );

router
    .route('/:curriculumId/sections/:sectionId/items/:itemId')
    .patch(
        auth('manageCourses'),
        validate(curriculumValidation.updateItemSchema),
        curriculumController.updateItem
    )
    .delete(
        auth('manageCourses'),
        validate(curriculumValidation.deleteItemSchema),
        curriculumController.deleteItem
    );

module.exports = router;
