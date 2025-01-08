const Joi = require('joi');
const { CATEGORY_STATUS } = require('../constants/course.constants');

const createCategorySchema = {
    body: Joi.object().keys({
        name: Joi.string().required().trim(),
        description: Joi.string(),
        parentCategory: Joi.string(), // ObjectId
        icon: Joi.string(),
        status: Joi.string().valid(...Object.values(CATEGORY_STATUS)),
        organizationId: Joi.string().required(), // ObjectId
        tenantId: Joi.string().required() // ObjectId
    })
};

const updateCategorySchema = {
    params: Joi.object().keys({
        categoryId: Joi.string().required()
    }),
    body: Joi.object().keys({
        name: Joi.string().trim(),
        description: Joi.string(),
        parentCategory: Joi.string(), // ObjectId
        icon: Joi.string(),
        status: Joi.string().valid(...Object.values(CATEGORY_STATUS))
    }).min(1)
};

const getCategorySchema = {
    params: Joi.object().keys({
        categoryId: Joi.string().required()
    })
};

const deleteCategorySchema = {
    params: Joi.object().keys({
        categoryId: Joi.string().required()
    })
};

const queryCategoriesSchema = {
    query: Joi.object().keys({
        name: Joi.string(),
        status: Joi.string().valid(...Object.values(CATEGORY_STATUS)),
        parentCategory: Joi.string(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1).max(100).default(10),
        page: Joi.number().integer().min(1).default(1),
        organizationId: Joi.string().required(),
        tenantId: Joi.string().required()
    })
};

const bulkCreateCategoriesSchema = {
    body: Joi.object().keys({
        categories: Joi.array().items(
            Joi.object().keys({
                name: Joi.string().required().trim(),
                description: Joi.string(),
                parentCategory: Joi.string(), // ObjectId
                icon: Joi.string(),
                status: Joi.string().valid(...Object.values(CATEGORY_STATUS)),
                order: Joi.number().integer().min(0)
            })
        ).min(1).required()
    })
};

const reorderCategoriesSchema = {
    body: Joi.object().keys({
        orderData: Joi.array().items(
            Joi.object().keys({
                categoryId: Joi.string().required(), // ObjectId
                order: Joi.number().integer().min(0).required()
            })
        ).min(1).required()
    })
};

const moveCategorySchema = {
    params: Joi.object().keys({
        categoryId: Joi.string().required()
    }),
    body: Joi.object().keys({
        newParentId: Joi.string().allow(null) // ObjectId or null for root level
    }).required()
};

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    getCategorySchema,
    deleteCategorySchema,
    queryCategoriesSchema,
    bulkCreateCategoriesSchema,
    reorderCategoriesSchema,
    moveCategorySchema
};
