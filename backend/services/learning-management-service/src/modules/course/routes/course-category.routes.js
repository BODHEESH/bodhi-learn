const express = require('express');
const courseCategoryController = require('../controllers/course-category.controller');
const validate = require('../../../middleware/validate');
const auth = require('../../../middleware/auth');
const courseCategoryValidation = require('../validations/course-category.validation');

const router = express.Router();

router
    .route('/')
    .post(
        auth('manageCourses'),
        validate(courseCategoryValidation.createCategorySchema),
        courseCategoryController.createCategory
    )
    .get(
        auth(),
        validate(courseCategoryValidation.queryCategoriesSchema),
        courseCategoryController.getCategories
    );

router
    .route('/bulk')
    .post(
        auth('manageCourses'),
        validate(courseCategoryValidation.bulkCreateCategoriesSchema),
        courseCategoryController.bulkCreateCategories
    );

router
    .route('/reorder')
    .patch(
        auth('manageCourses'),
        validate(courseCategoryValidation.reorderCategoriesSchema),
        courseCategoryController.reorderCategories
    );

router
    .route('/hierarchy')
    .get(
        auth(),
        courseCategoryController.getCategoryHierarchy
    );

router
    .route('/:categoryId/move')
    .patch(
        auth('manageCourses'),
        validate(courseCategoryValidation.moveCategorySchema),
        courseCategoryController.moveCategory
    );

router
    .route('/:categoryId/stats')
    .get(
        auth(),
        validate(courseCategoryValidation.getCategorySchema),
        courseCategoryController.getCategoryStats
    );

router
    .route('/:categoryId')
    .get(
        auth(),
        validate(courseCategoryValidation.getCategorySchema),
        courseCategoryController.getCategory
    )
    .patch(
        auth('manageCourses'),
        validate(courseCategoryValidation.updateCategorySchema),
        courseCategoryController.updateCategory
    )
    .delete(
        auth('manageCourses'),
        validate(courseCategoryValidation.deleteCategorySchema),
        courseCategoryController.deleteCategory
    );

module.exports = router;
