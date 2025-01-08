const httpStatus = require('http-status');
const catchAsync = require('../../../utils/catchAsync');
const mediaService = require('../services/media.service');
const pick = require('../../../utils/pick');

class MediaController {
    /**
     * Create media
     * POST /api/media
     */
    createMedia = catchAsync(async (req, res) => {
        const media = await mediaService.createMedia({
            ...req.body,
            'metadata.author': req.user.id,
            'metadata.uploadedBy': req.user.id,
            organizationId: req.user.organizationId,
            tenantId: req.user.tenantId
        });
        res.status(httpStatus.CREATED).send({ status: 'success', data: { media } });
    });

    /**
     * Get media items
     * GET /api/media
     */
    getMediaItems = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['type', 'status']);
        const options = pick(req.query, ['sortBy', 'limit', 'page']);
        filter.organizationId = req.user.organizationId;
        filter.tenantId = req.user.tenantId;

        const result = await mediaService.queryMedia(filter, options);
        res.send({
            status: 'success',
            data: result.results,
            pagination: result.pagination
        });
    });

    /**
     * Get media item
     * GET /api/media/:mediaId
     */
    getMediaItem = catchAsync(async (req, res) => {
        const media = await mediaService.getMediaById(req.params.mediaId);
        if (media.organizationId.toString() !== req.user.organizationId.toString() ||
            media.tenantId.toString() !== req.user.tenantId.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
        }
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Update media
     * PATCH /api/media/:mediaId
     */
    updateMedia = catchAsync(async (req, res) => {
        const media = await mediaService.updateMedia(req.params.mediaId, req.body);
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Delete media
     * DELETE /api/media/:mediaId
     */
    deleteMedia = catchAsync(async (req, res) => {
        await mediaService.deleteMedia(req.params.mediaId);
        res.status(httpStatus.NO_CONTENT).send();
    });

    /**
     * Add transcription
     * POST /api/media/:mediaId/transcriptions
     */
    addTranscription = catchAsync(async (req, res) => {
        const media = await mediaService.addTranscription(req.params.mediaId, req.body);
        res.status(httpStatus.CREATED).send({ status: 'success', data: { media } });
    });

    /**
     * Add annotation
     * POST /api/media/:mediaId/annotations
     */
    addAnnotation = catchAsync(async (req, res) => {
        const media = await mediaService.addAnnotation(req.params.mediaId, {
            ...req.body,
            user: req.user.id
        });
        res.status(httpStatus.CREATED).send({ status: 'success', data: { media } });
    });

    /**
     * Update annotation
     * PATCH /api/media/:mediaId/annotations/:annotationId
     */
    updateAnnotation = catchAsync(async (req, res) => {
        const media = await mediaService.updateAnnotation(
            req.params.mediaId,
            req.params.annotationId,
            req.body
        );
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Delete annotation
     * DELETE /api/media/:mediaId/annotations/:annotationId
     */
    deleteAnnotation = catchAsync(async (req, res) => {
        const media = await mediaService.deleteAnnotation(
            req.params.mediaId,
            req.params.annotationId
        );
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Add version
     * POST /api/media/:mediaId/versions
     */
    addVersion = catchAsync(async (req, res) => {
        const media = await mediaService.addVersion(req.params.mediaId, req.body);
        res.status(httpStatus.CREATED).send({ status: 'success', data: { media } });
    });

    /**
     * Record view
     * POST /api/media/:mediaId/views
     */
    recordView = catchAsync(async (req, res) => {
        const media = await mediaService.recordView(req.params.mediaId);
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Record download
     * POST /api/media/:mediaId/downloads
     */
    recordDownload = catchAsync(async (req, res) => {
        const media = await mediaService.recordDownload(req.params.mediaId);
        res.send({ status: 'success', data: { media } });
    });

    /**
     * Update processing status
     * PATCH /api/media/:mediaId/processing
     */
    updateProcessingStatus = catchAsync(async (req, res) => {
        const media = await mediaService.updateProcessingStatus(
            req.params.mediaId,
            req.body.status,
            req.body.progress,
            req.body.error
        );
        res.send({ status: 'success', data: { media } });
    });
}

module.exports = new MediaController();
