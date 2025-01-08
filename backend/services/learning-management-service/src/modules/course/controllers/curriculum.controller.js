const curriculumService = require('../services/curriculum.service');
const catchAsync = require('../../../utils/catchAsync');

class CurriculumController {
    /**
     * Create curriculum
     * @route POST /api/curriculums
     * @access Private (manageCourses)
     */
    createCurriculum = catchAsync(async (req, res) => {
        const curriculumData = {
            ...req.body,
            createdBy: req.user.id,
            updatedBy: req.user.id
        };

        const curriculum = await curriculumService.createCurriculum(curriculumData);
        res.status(201).json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Get curriculum
     * @route GET /api/curriculums/:curriculumId
     * @access Private
     */
    getCurriculum = catchAsync(async (req, res) => {
        const { curriculumId } = req.params;
        const { organizationId, tenantId } = req.user;

        const curriculum = await curriculumService.getCurriculumById(
            curriculumId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Update curriculum
     * @route PATCH /api/curriculums/:curriculumId
     * @access Private (manageCourses)
     */
    updateCurriculum = catchAsync(async (req, res) => {
        const { curriculumId } = req.params;
        const { organizationId, tenantId } = req.user;
        const updateData = {
            ...req.body,
            updatedBy: req.user.id
        };

        const curriculum = await curriculumService.updateCurriculum(
            curriculumId,
            updateData,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Delete curriculum
     * @route DELETE /api/curriculums/:curriculumId
     * @access Private (manageCourses)
     */
    deleteCurriculum = catchAsync(async (req, res) => {
        const { curriculumId } = req.params;
        const { organizationId, tenantId } = req.user;

        await curriculumService.deleteCurriculum(curriculumId, organizationId, tenantId);
        res.status(204).send();
    });

    /**
     * Add section
     * @route POST /api/curriculums/:curriculumId/sections
     * @access Private (manageCourses)
     */
    addSection = catchAsync(async (req, res) => {
        const { curriculumId } = req.params;
        const { organizationId, tenantId } = req.user;
        const sectionData = req.body;

        const curriculum = await curriculumService.addSection(
            curriculumId,
            sectionData,
            organizationId,
            tenantId
        );

        res.status(201).json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Update section
     * @route PATCH /api/curriculums/:curriculumId/sections/:sectionId
     * @access Private (manageCourses)
     */
    updateSection = catchAsync(async (req, res) => {
        const { curriculumId, sectionId } = req.params;
        const { organizationId, tenantId } = req.user;
        const updateData = req.body;

        const curriculum = await curriculumService.updateSection(
            curriculumId,
            sectionId,
            updateData,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Delete section
     * @route DELETE /api/curriculums/:curriculumId/sections/:sectionId
     * @access Private (manageCourses)
     */
    deleteSection = catchAsync(async (req, res) => {
        const { curriculumId, sectionId } = req.params;
        const { organizationId, tenantId } = req.user;

        const curriculum = await curriculumService.deleteSection(
            curriculumId,
            sectionId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Add item to section
     * @route POST /api/curriculums/:curriculumId/sections/:sectionId/items
     * @access Private (manageCourses)
     */
    addItem = catchAsync(async (req, res) => {
        const { curriculumId, sectionId } = req.params;
        const { organizationId, tenantId } = req.user;
        const itemData = req.body;

        const curriculum = await curriculumService.addItem(
            curriculumId,
            sectionId,
            itemData,
            organizationId,
            tenantId
        );

        res.status(201).json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Update item
     * @route PATCH /api/curriculums/:curriculumId/sections/:sectionId/items/:itemId
     * @access Private (manageCourses)
     */
    updateItem = catchAsync(async (req, res) => {
        const { curriculumId, sectionId, itemId } = req.params;
        const { organizationId, tenantId } = req.user;
        const updateData = req.body;

        const curriculum = await curriculumService.updateItem(
            curriculumId,
            sectionId,
            itemId,
            updateData,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Delete item
     * @route DELETE /api/curriculums/:curriculumId/sections/:sectionId/items/:itemId
     * @access Private (manageCourses)
     */
    deleteItem = catchAsync(async (req, res) => {
        const { curriculumId, sectionId, itemId } = req.params;
        const { organizationId, tenantId } = req.user;

        const curriculum = await curriculumService.deleteItem(
            curriculumId,
            sectionId,
            itemId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Reorder sections
     * @route PATCH /api/curriculums/:curriculumId/sections/reorder
     * @access Private (manageCourses)
     */
    reorderSections = catchAsync(async (req, res) => {
        const { curriculumId } = req.params;
        const { organizationId, tenantId } = req.user;
        const { orderData } = req.body;

        const curriculum = await curriculumService.reorderSections(
            curriculumId,
            orderData,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Reorder items within a section
     * @route PATCH /api/curriculums/:curriculumId/sections/:sectionId/items/reorder
     * @access Private (manageCourses)
     */
    reorderItems = catchAsync(async (req, res) => {
        const { curriculumId, sectionId } = req.params;
        const { organizationId, tenantId } = req.user;
        const { orderData } = req.body;

        const curriculum = await curriculumService.reorderItems(
            curriculumId,
            sectionId,
            orderData,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });

    /**
     * Get curriculum by course
     * @route GET /api/curriculums/course/:courseId
     * @access Private
     */
    getCurriculumByCourse = catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { organizationId, tenantId } = req.user;

        const curriculum = await curriculumService.getCurriculumByCourse(
            courseId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { curriculum }
        });
    });
}

module.exports = new CurriculumController();
