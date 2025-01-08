const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const initializeProgressSchema = {
    body: Joi.object().keys({
        curriculumId: Joi.string().required().custom(objectId),
        courseId: Joi.string().required().custom(objectId),
        enrollmentId: Joi.string().required().custom(objectId)
    })
};

const getProgressSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required().custom(objectId)
    })
};

const updateItemProgressSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required().custom(objectId),
        itemId: Joi.string().required().custom(objectId)
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('not_started', 'in_progress', 'completed', 'failed'),
        score: Joi.number().min(0).max(100),
        timeSpent: Joi.number().min(0),
        progress: Joi.number().min(0).max(100),
        action: Joi.string().valid('start', 'complete', 'fail', 'pause', 'resume', 'submit'),
        feedback: Joi.string(),
        notes: Joi.string()
    })
};

const addBookmarkSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required().custom(objectId),
        itemId: Joi.string().required().custom(objectId)
    }),
    body: Joi.object().keys({
        note: Joi.string().required()
    })
};

const addNoteSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required().custom(objectId),
        itemId: Joi.string().required().custom(objectId)
    }),
    body: Joi.object().keys({
        content: Joi.string().required()
    })
};

const getCourseProgressStatsSchema = {
    params: Joi.object().keys({
        courseId: Joi.string().required().custom(objectId)
    })
};

module.exports = {
    initializeProgressSchema,
    getProgressSchema,
    updateItemProgressSchema,
    addBookmarkSchema,
    addNoteSchema,
    getCourseProgressStatsSchema
};
