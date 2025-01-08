const courseCategoryService = require('../services/course-category.service');
const catchAsync = require('../../../utils/catchAsync');
const pick = require('../../../utils/pick');

class CourseCategoryController {
    /**
     * Create category
     * @route POST /api/course-categories
     * @access Private (manageCourses)
     */
    createCategory = catchAsync(async (req, res) => {
        const categoryData = {
            ...req.body,
            createdBy: req.user.id,
            updatedBy: req.user.id
        };
        const category = await courseCategoryService.createCategory(categoryData);
        res.status(201).json({
            status: 'success',
            data: { category }
        });
    });

    /**
     * Get category by ID
     * @route GET /api/course-categories/:categoryId
     * @access Private
     */
    getCategory = catchAsync(async (req, res) => {
        const { categoryId } = req.params;
        const { organizationId, tenantId } = req.user;
        const category = await courseCategoryService.getCategoryById(categoryId, organizationId, tenantId);
        res.json({
            status: 'success',
            data: { category }
        });
    });

    /**
     * Update category
     * @route PATCH /api/course-categories/:categoryId
     * @access Private (manageCourses)
     */
    updateCategory = catchAsync(async (req, res) => {
        const { categoryId } = req.params;
        const { organizationId, tenantId } = req.user;
        const updateData = {
            ...req.body,
            updatedBy: req.user.id
        };
        const category = await courseCategoryService.updateCategory(categoryId, updateData, organizationId, tenantId);
        res.json({
            status: 'success',
            data: { category }
        });
    });

    /**
     * Delete category
     * @route DELETE /api/course-categories/:categoryId
     * @access Private (manageCourses)
     */
    deleteCategory = catchAsync(async (req, res) => {
        const { categoryId } = req.params;
        const { organizationId, tenantId } = req.user;
        await courseCategoryService.deleteCategory(categoryId, organizationId, tenantId);
        res.status(204).send();
    });

    /**
     * Get all categories with filters
     * @route GET /api/course-categories
     * @access Private
     */
    getCategories = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'name',
            'status',
            'parentCategory',
            'organizationId',
            'tenantId'
        ]);

        const options = pick(req.query, ['sortBy', 'limit', 'page']);
        
        const result = await courseCategoryService.queryCategories(filter, options);
        res.json({
            status: 'success',
            data: result
        });
    });

    /**
     * Get category hierarchy
     * @route GET /api/course-categories/hierarchy
     * @access Private
     */
    getCategoryHierarchy = catchAsync(async (req, res) => {
        const { organizationId, tenantId } = req.user;
        const hierarchy = await courseCategoryService.getCategoryHierarchy(organizationId, tenantId);
        res.json({
            status: 'success',
            data: { hierarchy }
        });
    });

    /**
     * Bulk create categories
     * @route POST /api/course-categories/bulk
     * @access Private (manageCourses)
     */
    bulkCreateCategories = catchAsync(async (req, res) => {
        const categories = req.body.categories.map(category => ({
            ...category,
            createdBy: req.user.id,
            updatedBy: req.user.id,
            organizationId: req.user.organizationId,
            tenantId: req.user.tenantId
        }));

        const createdCategories = await courseCategoryService.bulkCreateCategories(categories);
        res.status(201).json({
            status: 'success',
            data: { categories: createdCategories }
        });
    });

    /**
     * Reorder categories
     * @route PATCH /api/course-categories/reorder
     * @access Private (manageCourses)
     */
    reorderCategories = catchAsync(async (req, res) => {
        const { organizationId, tenantId } = req.user;
        const { orderData } = req.body;

        const categories = await courseCategoryService.reorderCategories(
            organizationId,
            tenantId,
            orderData
        );

        res.json({
            status: 'success',
            data: { categories }
        });
    });

    /**
     * Move category
     * @route PATCH /api/course-categories/:categoryId/move
     * @access Private (manageCourses)
     */
    moveCategory = catchAsync(async (req, res) => {
        const { categoryId } = req.params;
        const { newParentId } = req.body;
        const { organizationId, tenantId } = req.user;

        const category = await courseCategoryService.moveCategory(
            categoryId,
            newParentId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { category }
        });
    });

    /**
     * Get category statistics
     * @route GET /api/course-categories/:categoryId/stats
     * @access Private
     */
    getCategoryStats = catchAsync(async (req, res) => {
        const { categoryId } = req.params;
        const { organizationId, tenantId } = req.user;

        const stats = await courseCategoryService.getCategoryStats(
            categoryId,
            organizationId,
            tenantId
        );

        res.json({
            status: 'success',
            data: { stats }
        });
    });
}

module.exports = new CourseCategoryController();