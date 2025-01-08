const express = require('express');
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const contentController = require('../controllers/content.controller');
const contentValidation = require('../validations/content.validation');
const { cacheMiddleware, clearContentCache } = require('../../../middleware/cache');
const { contentCreationLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();

// Base content routes with caching and rate limiting
router
    .route('/')
    .post(
        auth('manageContents'),
        contentCreationLimiter,
        validate(contentValidation.createContentSchema),
        contentController.createContent
    )
    .get(
        auth(),
        cacheMiddleware({ ttl: 300 }), // Cache for 5 minutes
        validate(contentValidation.getContentsSchema),
        contentController.getContents
    );

router
    .route('/:contentId')
    .get(
        auth(),
        cacheMiddleware({ ttl: 3600 }), // Cache for 1 hour
        validate(contentValidation.getContentSchema),
        contentController.getContent
    )
    .patch(
        auth('manageContents'),
        clearContentCache,
        validate(contentValidation.updateContentSchema),
        contentController.updateContent
    )
    .delete(
        auth('manageContents'),
        clearContentCache,
        validate(contentValidation.deleteContentSchema),
        contentController.deleteContent
    );

// Content block routes with caching
router
    .route('/:contentId/blocks')
    .post(
        auth('manageContents'),
        clearContentCache,
        validate(contentValidation.addContentBlockSchema),
        contentController.addContentBlock
    );

router
    .route('/:contentId/blocks/:blockId')
    .patch(
        auth('manageContents'),
        clearContentCache,
        validate(contentValidation.updateContentBlockSchema),
        contentController.updateContentBlock
    )
    .delete(
        auth('manageContents'),
        clearContentCache,
        validate(contentValidation.deleteContentBlockSchema),
        contentController.deleteContentBlock
    );

// Content lifecycle routes
router.post(
    '/:contentId/publish',
    auth('manageContents'),
    clearContentCache,
    validate(contentValidation.getContentSchema),
    contentController.publishContent
);

router.post(
    '/:contentId/archive',
    auth('manageContents'),
    clearContentCache,
    validate(contentValidation.getContentSchema),
    contentController.archiveContent
);

// Content interaction routes with caching
router.post(
    '/:contentId/views',
    auth(),
    validate(contentValidation.getContentSchema),
    contentController.recordView
);

router.post(
    '/:contentId/ratings',
    auth(),
    clearContentCache,
    validate(contentValidation.addRatingSchema),
    contentController.addRating
);

router.post(
    '/:contentId/completions',
    auth(),
    clearContentCache,
    validate(contentValidation.recordCompletionSchema),
    contentController.recordCompletion
);

module.exports = router;
