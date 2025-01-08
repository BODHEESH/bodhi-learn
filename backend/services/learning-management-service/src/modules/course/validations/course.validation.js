const Joi = require('joi');
const { COURSE_STATUS, ENROLLMENT_TYPE } = require('../constants/course.constants');

const createCourseSchema = {
    body: Joi.object().keys({
        title: Joi.string().required().trim(),
        description: Joi.string().required(),
        thumbnail: Joi.string(),
        instructor: Joi.string().required(), // ObjectId
        category: Joi.string().required(), // ObjectId
        duration: Joi.number().required().min(1),
        price: Joi.number().required().min(0),
        status: Joi.string().valid(...Object.values(COURSE_STATUS)),
        enrollmentType: Joi.string().valid(...Object.values(ENROLLMENT_TYPE)),
        prerequisites: Joi.array().items(Joi.string()), // Array of ObjectIds
        tags: Joi.array().items(Joi.string()),
        organizationId: Joi.string().required(), // ObjectId
        tenantId: Joi.string().required() // ObjectId
    })
};

const updateCourseSchema = {
    params: Joi.object().keys({
        courseId: Joi.string().required()
    }),
    body: Joi.object().keys({
        title: Joi.string().trim(),
        description: Joi.string(),
        thumbnail: Joi.string(),
        instructor: Joi.string(), // ObjectId
        category: Joi.string(), // ObjectId
        duration: Joi.number().min(1),
        price: Joi.number().min(0),
        status: Joi.string().valid(...Object.values(COURSE_STATUS)),
        enrollmentType: Joi.string().valid(...Object.values(ENROLLMENT_TYPE)),
        prerequisites: Joi.array().items(Joi.string()), // Array of ObjectIds
        tags: Joi.array().items(Joi.string())
    }).min(1)
};

const getCourseSchema = {
    params: Joi.object().keys({
        courseId: Joi.string().required()
    })
};

const deleteCourseSchema = {
    params: Joi.object().keys({
        courseId: Joi.string().required()
    })
};

const queryCoursesSchema = {
    query: Joi.object().keys({
        title: Joi.string(),
        category: Joi.string(),
        instructor: Joi.string(),
        status: Joi.string().valid(...Object.values(COURSE_STATUS)),
        enrollmentType: Joi.string().valid(...Object.values(ENROLLMENT_TYPE)),
        minPrice: Joi.number(),
        maxPrice: Joi.number(),
        sortBy: Joi.string(),
        limit: Joi.number().integer().min(1).max(100).default(10),
        page: Joi.number().integer().min(1).default(1),
        organizationId: Joi.string().required(),
        tenantId: Joi.string().required()
    })
};

module.exports = {
    createCourseSchema,
    updateCourseSchema,
    getCourseSchema,
    deleteCourseSchema,
    queryCoursesSchema
};