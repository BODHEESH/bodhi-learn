const express = require('express');
const auth = require('../../../middleware/auth');
const validate = require('../../../middleware/validate');
const mediaController = require('../controllers/media.controller');
const mediaValidation = require('../validations/media.validation');
const { uploadContent } = require('../../../middleware/contentProcessor');
const { cacheMiddleware, clearMediaCache } = require('../../../middleware/cache');
const { uploadLimiter, mediaProcessingLimiter } = require('../../../middleware/rateLimiter');

const router = express.Router();

// Base media routes with caching and rate limiting
router
    .route('/')
    .post(
        auth('manageMedia'),
        uploadLimiter,
        uploadContent('file'),
        validate(mediaValidation.createMediaSchema),
        mediaController.createMedia
    )
    .get(
        auth(),
        cacheMiddleware({ ttl: 300 }), // Cache for 5 minutes
        validate(mediaValidation.getMediaItemsSchema),
        mediaController.getMediaItems
    );

router
    .route('/:mediaId')
    .get(
        auth(),
        cacheMiddleware({ ttl: 3600 }), // Cache for 1 hour
        validate(mediaValidation.getMediaItemSchema),
        mediaController.getMediaItem
    )
    .patch(
        auth('manageMedia'),
        clearMediaCache,
        validate(mediaValidation.updateMediaSchema),
        mediaController.updateMedia
    )
    .delete(
        auth('manageMedia'),
        clearMediaCache,
        validate(mediaValidation.deleteMediaSchema),
        mediaController.deleteMedia
    );

// Transcription routes with processing rate limit
router.post(
    '/:mediaId/transcriptions',
    auth('manageMedia'),
    mediaProcessingLimiter,
    validate(mediaValidation.addTranscriptionSchema),
    mediaController.addTranscription
);

// Annotation routes with caching
router
    .route('/:mediaId/annotations')
    .post(
        auth(),
        clearMediaCache,
        validate(mediaValidation.addAnnotationSchema),
        mediaController.addAnnotation
    );

router
    .route('/:mediaId/annotations/:annotationId')
    .patch(
        auth(),
        clearMediaCache,
        validate(mediaValidation.updateAnnotationSchema),
        mediaController.updateAnnotation
    )
    .delete(
        auth(),
        clearMediaCache,
        validate(mediaValidation.deleteAnnotationSchema),
        mediaController.deleteAnnotation
    );

// Version routes with processing rate limit
router.post(
    '/:mediaId/versions',
    auth('manageMedia'),
    mediaProcessingLimiter,
    validate(mediaValidation.addVersionSchema),
    mediaController.addVersion
);

// Statistics routes with caching
router.post(
    '/:mediaId/views',
    auth(),
    validate(mediaValidation.getMediaItemSchema),
    mediaController.recordView
);

router.post(
    '/:mediaId/downloads',
    auth(),
    validate(mediaValidation.getMediaItemSchema),
    mediaController.recordDownload
);

// Processing routes with rate limit
router.patch(
    '/:mediaId/processing',
    auth('manageMedia'),
    mediaProcessingLimiter,
    validate(mediaValidation.updateProcessingStatusSchema),
    mediaController.updateProcessingStatus
);

module.exports = router;
