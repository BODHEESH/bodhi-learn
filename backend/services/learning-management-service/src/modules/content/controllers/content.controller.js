const httpStatus = require('http-status');
const catchAsync = require('../../../utils/catchAsync');
const contentService = require('../services/content.service');
const pick = require('../../../utils/pick');

class ContentController {
    /**
     * Create content
     * POST /api/contents
     */
    createContent = catchAsync(async (req, res) => {
        const content = await contentService.createContent({
            ...req.body,
            'metadata.author': req.user.id,
            organizationId: req.user.organizationId,
            tenantId: req.user.tenantId
        });
        res.status(httpStatus.CREATED).send({ status: 'success', data: { content } });
    });

    /**
     * Get contents
     * GET /api/contents
     */
    getContents = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['type', 'category', 'status', 'tags']);
        const options = pick(req.query, ['sortBy', 'limit', 'page']);
        filter.organizationId = req.user.organizationId;
        filter.tenantId = req.user.tenantId;

        const result = await contentService.queryContents(filter, options);
        res.send({
            status: 'success',
            data: result.results,
            pagination: result.pagination
        });
    });

    /**
     * Get content
     * GET /api/contents/:contentId
     */
    getContent = catchAsync(async (req, res) => {
        const content = await contentService.getContentById(req.params.contentId);
        if (content.organizationId.toString() !== req.user.organizationId.toString() ||
            content.tenantId.toString() !== req.user.tenantId.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
        }
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Update content
     * PATCH /api/contents/:contentId
     */
    updateContent = catchAsync(async (req, res) => {
        const content = await contentService.updateContent(req.params.contentId, req.body);
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Delete content
     * DELETE /api/contents/:contentId
     */
    deleteContent = catchAsync(async (req, res) => {
        await contentService.deleteContent(req.params.contentId);
        res.status(httpStatus.NO_CONTENT).send();
    });

    /**
     * Publish content
     * POST /api/contents/:contentId/publish
     */
    publishContent = catchAsync(async (req, res) => {
        const content = await contentService.publishContent(req.params.contentId, req.user.id);
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Archive content
     * POST /api/contents/:contentId/archive
     */
    archiveContent = catchAsync(async (req, res) => {
        const content = await contentService.archiveContent(req.params.contentId);
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Add content block
     * POST /api/contents/:contentId/blocks
     */
    addContentBlock = catchAsync(async (req, res) => {
        const content = await contentService.addContentBlock(req.params.contentId, req.body);
        res.status(httpStatus.CREATED).send({ status: 'success', data: { content } });
    });

    /**
     * Update content block
     * PATCH /api/contents/:contentId/blocks/:blockId
     */
    updateContentBlock = catchAsync(async (req, res) => {
        const content = await contentService.updateContentBlock(
            req.params.contentId,
            req.params.blockId,
            req.body
        );
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Delete content block
     * DELETE /api/contents/:contentId/blocks/:blockId
     */
    deleteContentBlock = catchAsync(async (req, res) => {
        const content = await contentService.deleteContentBlock(
            req.params.contentId,
            req.params.blockId
        );
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Record content view
     * POST /api/contents/:contentId/views
     */
    recordView = catchAsync(async (req, res) => {
        const content = await contentService.recordView(req.params.contentId, req.user.id);
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Add content rating
     * POST /api/contents/:contentId/ratings
     */
    addRating = catchAsync(async (req, res) => {
        const content = await contentService.addRating(req.params.contentId, req.body.rating);
        res.send({ status: 'success', data: { content } });
    });

    /**
     * Record content completion
     * POST /api/contents/:contentId/completions
     */
    recordCompletion = catchAsync(async (req, res) => {
        const content = await contentService.recordCompletion(
            req.params.contentId,
            req.body.timeSpent
        );
        res.send({ status: 'success', data: { content } });
    });
}

module.exports = new ContentController();
