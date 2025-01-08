const { CourseCategory } = require('../models/course-category.model');
const { Course } = require('../models/course.model');
const { ERROR_MESSAGES } = require('../constants/course.constants');
const ApiError = require('../../../utils/ApiError');
const { getPagination } = require('../../../utils/pagination');

class CourseCategoryService {
    /**
     * Create a new category
     * @param {Object} categoryData - Category data
     * @returns {Promise<CourseCategory>}
     */
    async createCategory(categoryData) {
        // Check if category with same name exists in the organization
        const existingCategory = await CourseCategory.findOne({
            name: categoryData.name,
            organizationId: categoryData.organizationId,
            tenantId: categoryData.tenantId
        });

        if (existingCategory) {
            throw new ApiError(400, 'Category with this name already exists');
        }

        // Validate parent category if provided
        if (categoryData.parentCategory) {
            const parentCategory = await CourseCategory.findOne({
                _id: categoryData.parentCategory,
                organizationId: categoryData.organizationId,
                tenantId: categoryData.tenantId
            });

            if (!parentCategory) {
                throw new ApiError(404, 'Parent category not found');
            }
        }

        const category = new CourseCategory(categoryData);
        return category.save();
    }

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<CourseCategory>}
     */
    async getCategoryById(categoryId, organizationId, tenantId) {
        const category = await CourseCategory.findOne({
            _id: categoryId,
            organizationId,
            tenantId
        }).populate('parentCategory');

        if (!category) {
            throw new ApiError(404, ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        return category;
    }

    /**
     * Update category
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Data to update
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<CourseCategory>}
     */
    async updateCategory(categoryId, updateData, organizationId, tenantId) {
        const category = await CourseCategory.findOne({
            _id: categoryId,
            organizationId,
            tenantId
        });

        if (!category) {
            throw new ApiError(404, ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        // Check name uniqueness if name is being updated
        if (updateData.name && updateData.name !== category.name) {
            const existingCategory = await CourseCategory.findOne({
                name: updateData.name,
                organizationId,
                tenantId,
                _id: { $ne: categoryId }
            });

            if (existingCategory) {
                throw new ApiError(400, 'Category with this name already exists');
            }
        }

        // Validate parent category if being updated
        if (updateData.parentCategory) {
            // Prevent circular reference
            if (updateData.parentCategory.toString() === categoryId) {
                throw new ApiError(400, 'Category cannot be its own parent');
            }

            const parentCategory = await CourseCategory.findOne({
                _id: updateData.parentCategory,
                organizationId,
                tenantId
            });

            if (!parentCategory) {
                throw new ApiError(404, 'Parent category not found');
            }
        }

        Object.assign(category, updateData);
        return category.save();
    }

    /**
     * Delete category
     * @param {string} categoryId - Category ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<CourseCategory>}
     */
    async deleteCategory(categoryId, organizationId, tenantId) {
        // Check if category has any courses
        const coursesCount = await Course.countDocuments({
            category: categoryId,
            organizationId,
            tenantId
        });

        if (coursesCount > 0) {
            throw new ApiError(400, 'Cannot delete category with associated courses');
        }

        // Check if category has any child categories
        const childCategoriesCount = await CourseCategory.countDocuments({
            parentCategory: categoryId,
            organizationId,
            tenantId
        });

        if (childCategoriesCount > 0) {
            throw new ApiError(400, 'Cannot delete category with child categories');
        }

        const category = await CourseCategory.findOneAndDelete({
            _id: categoryId,
            organizationId,
            tenantId
        });

        if (!category) {
            throw new ApiError(404, ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        return category;
    }

    /**
     * Query categories with filters and pagination
     * @param {Object} filter - Filter criteria
     * @param {Object} options - Query options
     * @returns {Promise<{categories: CourseCategory[], page: number, limit: number, totalPages: number, totalResults: number}>}
     */
    async queryCategories(filter, options) {
        const { limit, page, skip } = getPagination(options);
        const { sortBy } = options;

        const query = CourseCategory.find(filter)
            .populate('parentCategory')
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        const [categories, totalResults] = await Promise.all([
            query.exec(),
            CourseCategory.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalResults / limit);

        return {
            categories,
            page,
            limit,
            totalPages,
            totalResults
        };
    }

    /**
     * Get category hierarchy
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Array>} - Array of categories with their children
     */
    async getCategoryHierarchy(organizationId, tenantId) {
        const categories = await CourseCategory.find({
            organizationId,
            tenantId,
            parentCategory: null // Get root categories
        }).lean();

        const buildHierarchy = async (parentCategories) => {
            const result = [];
            for (const category of parentCategories) {
                const children = await CourseCategory.find({
                    organizationId,
                    tenantId,
                    parentCategory: category._id
                }).lean();

                if (children.length > 0) {
                    category.children = await buildHierarchy(children);
                } else {
                    category.children = [];
                }
                result.push(category);
            }
            return result;
        };

        return buildHierarchy(categories);
    }

    /**
     * Bulk create categories
     * @param {Array} categories - Array of category data
     * @returns {Promise<Array>} - Array of created categories
     */
    async bulkCreateCategories(categories) {
        // Validate parent categories exist
        const parentIds = categories
            .filter(cat => cat.parentCategory)
            .map(cat => cat.parentCategory);

        if (parentIds.length > 0) {
            const existingParents = await CourseCategory.countDocuments({
                _id: { $in: parentIds }
            });

            if (existingParents !== [...new Set(parentIds)].length) {
                throw new ApiError(400, 'One or more parent categories do not exist');
            }
        }

        // Check for duplicate names within the same organization/tenant
        const names = categories.map(cat => cat.name);
        const existingCategories = await CourseCategory.find({
            name: { $in: names },
            organizationId: categories[0].organizationId,
            tenantId: categories[0].tenantId
        });

        if (existingCategories.length > 0) {
            throw new ApiError(400, 'One or more category names already exist');
        }

        return CourseCategory.insertMany(categories);
    }

    /**
     * Reorder categories
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @param {Array} orderData - Array of { categoryId, order } objects
     * @returns {Promise<Array>} - Updated categories
     */
    async reorderCategories(organizationId, tenantId, orderData) {
        const updateOperations = orderData.map(({ categoryId, order }) => ({
            updateOne: {
                filter: { _id: categoryId, organizationId, tenantId },
                update: { $set: { order } }
            }
        }));

        await CourseCategory.bulkWrite(updateOperations);
        
        return this.queryCategories(
            { organizationId, tenantId },
            { sortBy: 'order:asc' }
        );
    }

    /**
     * Move category to new parent
     * @param {string} categoryId - Category ID
     * @param {string} newParentId - New parent category ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<CourseCategory>}
     */
    async moveCategory(categoryId, newParentId, organizationId, tenantId) {
        const category = await CourseCategory.findOne({
            _id: categoryId,
            organizationId,
            tenantId
        });

        if (!category) {
            throw new ApiError(404, ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        // If moving to root level
        if (!newParentId) {
            category.parentCategory = null;
            return category.save();
        }

        // Check if new parent exists
        const newParent = await CourseCategory.findOne({
            _id: newParentId,
            organizationId,
            tenantId
        });

        if (!newParent) {
            throw new ApiError(404, 'New parent category not found');
        }

        // Prevent circular reference
        let currentParent = newParent;
        while (currentParent.parentCategory) {
            if (currentParent.parentCategory.toString() === categoryId) {
                throw new ApiError(400, 'Moving category would create a circular reference');
            }
            currentParent = await CourseCategory.findById(currentParent.parentCategory);
        }

        category.parentCategory = newParentId;
        return category.save();
    }

    /**
     * Get category statistics
     * @param {string} categoryId - Category ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Object>} - Category statistics
     */
    async getCategoryStats(categoryId, organizationId, tenantId) {
        const category = await CourseCategory.findOne({
            _id: categoryId,
            organizationId,
            tenantId
        });

        if (!category) {
            throw new ApiError(404, ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        // Get all descendant categories
        const descendants = await this.getAllDescendants(categoryId, organizationId, tenantId);
        const allCategoryIds = [categoryId, ...descendants.map(d => d._id)];

        const [coursesCount, activeCoursesCount, totalEnrollments] = await Promise.all([
            Course.countDocuments({ category: { $in: allCategoryIds } }),
            Course.countDocuments({ 
                category: { $in: allCategoryIds },
                status: 'published'
            }),
            Course.aggregate([
                { $match: { category: { $in: allCategoryIds } } },
                { $group: { _id: null, totalEnrollments: { $sum: '$enrollmentCount' } } }
            ])
        ]);

        return {
            coursesCount,
            activeCoursesCount,
            totalEnrollments: totalEnrollments[0]?.totalEnrollments || 0,
            subCategoriesCount: descendants.length
        };
    }

    /**
     * Get all descendant categories
     * @private
     */
    async getAllDescendants(categoryId, organizationId, tenantId) {
        const descendants = [];
        
        const getChildren = async (parentId) => {
            const children = await CourseCategory.find({
                parentCategory: parentId,
                organizationId,
                tenantId
            });
            
            for (const child of children) {
                descendants.push(child);
                await getChildren(child._id);
            }
        };

        await getChildren(categoryId);
        return descendants;
    }
}

module.exports = new CourseCategoryService();