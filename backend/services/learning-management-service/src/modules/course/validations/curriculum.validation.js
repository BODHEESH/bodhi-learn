const Joi = require('joi');
const { CURRICULUM_STATUS, CURRICULUM_ITEM_TYPE } = require('../constants/curriculum.constants');

const curriculumItemSchema = Joi.object().keys({
    title: Joi.string().required().trim(),
    description: Joi.string(),
    type: Joi.string().valid(...Object.values(CURRICULUM_ITEM_TYPE)).required(),
    contentId: Joi.string().required(), // ObjectId
    duration: Joi.number().min(0),
    order: Joi.number().integer().min(0),
    isPreview: Joi.boolean(),
    isRequired: Joi.boolean(),
    status: Joi.string().valid(...Object.values(CURRICULUM_STATUS))
});

const sectionSchema = Joi.object().keys({
    title: Joi.string().required().trim(),
    description: Joi.string(),
    order: Joi.number().integer().min(0),
    items: Joi.array().items(curriculumItemSchema)
});

const createCurriculumSchema = {
    body: Joi.object().keys({
        course: Joi.string().required(), // ObjectId
        title: Joi.string().required().trim(),
        description: Joi.string(),
        sections: Joi.array().items(sectionSchema),
        status: Joi.string().valid(...Object.values(CURRICULUM_STATUS)),
        organizationId: Joi.string().required(), // ObjectId
        tenantId: Joi.string().required() // ObjectId
    })
};

const updateCurriculumSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required()
    }),
    body: Joi.object().keys({
        title: Joi.string().trim(),
        description: Joi.string(),
        sections: Joi.array().items(sectionSchema),
        status: Joi.string().valid(...Object.values(CURRICULUM_STATUS))
    }).min(1)
};

const getCurriculumSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required()
    })
};

const deleteCurriculumSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required()
    })
};

const addSectionSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required()
    }),
    body: sectionSchema
};

const updateSectionSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required()
    }),
    body: Joi.object().keys({
        title: Joi.string().trim(),
        description: Joi.string(),
        order: Joi.number().integer().min(0)
    }).min(1)
};

const deleteSectionSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required()
    })
};

const addItemSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required()
    }),
    body: curriculumItemSchema
};

const updateItemSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required(),
        itemId: Joi.string().required()
    }),
    body: Joi.object().keys({
        title: Joi.string().trim(),
        description: Joi.string(),
        type: Joi.string().valid(...Object.values(CURRICULUM_ITEM_TYPE)),
        contentId: Joi.string(), // ObjectId
        duration: Joi.number().min(0),
        order: Joi.number().integer().min(0),
        isPreview: Joi.boolean(),
        isRequired: Joi.boolean(),
        status: Joi.string().valid(...Object.values(CURRICULUM_STATUS))
    }).min(1)
};

const deleteItemSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required(),
        itemId: Joi.string().required()
    })
};

const reorderSectionsSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required()
    }),
    body: Joi.object().keys({
        orderData: Joi.array().items(
            Joi.object().keys({
                sectionId: Joi.string().required(),
                order: Joi.number().integer().min(0).required()
            })
        ).min(1).required()
    })
};

const reorderItemsSchema = {
    params: Joi.object().keys({
        curriculumId: Joi.string().required(),
        sectionId: Joi.string().required()
    }),
    body: Joi.object().keys({
        orderData: Joi.array().items(
            Joi.object().keys({
                itemId: Joi.string().required(),
                order: Joi.number().integer().min(0).required()
            })
        ).min(1).required()
    })
};

module.exports = {
    createCurriculumSchema,
    updateCurriculumSchema,
    getCurriculumSchema,
    deleteCurriculumSchema,
    addSectionSchema,
    updateSectionSchema,
    deleteSectionSchema,
    addItemSchema,
    updateItemSchema,
    deleteItemSchema,
    reorderSectionsSchema,
    reorderItemsSchema
};
