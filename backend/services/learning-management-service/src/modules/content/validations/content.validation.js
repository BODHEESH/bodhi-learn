const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const contentBlockSchema = Joi.object().keys({
    type: Joi.string().valid('text', 'image', 'video', 'audio', 'document', 'code', 'quiz', 'interactive', 'embed').required(),
    title: Joi.string(),
    description: Joi.string(),
    content: Joi.object().keys({
        text: Joi.string().when('type', { is: 'text', then: Joi.required() }),
        format: Joi.string().valid('plain', 'markdown', 'html'),
        mediaId: Joi.string().custom(objectId).when('type', {
            is: Joi.string().valid('image', 'video', 'audio', 'document'),
            then: Joi.required()
        }),
        url: Joi.string().uri(),
        thumbnailUrl: Joi.string().uri(),
        duration: Joi.number(),
        code: Joi.string().when('type', { is: 'code', then: Joi.required() }),
        language: Joi.string().when('type', { is: 'code', then: Joi.required() }),
        questions: Joi.array().items(Joi.string().custom(objectId)).when('type', {
            is: 'quiz',
            then: Joi.required()
        }),
        interactiveType: Joi.string().valid('simulation', 'game', 'exercise').when('type', {
            is: 'interactive',
            then: Joi.required()
        }),
        config: Joi.object(),
        embedCode: Joi.string().when('type', { is: 'embed', then: Joi.required() }),
        embedType: Joi.string().valid('iframe', 'script').when('type', {
            is: 'embed',
            then: Joi.required()
        })
    }).required(),
    metadata: Joi.object().keys({
        tags: Joi.array().items(Joi.string()),
        language: Joi.string(),
        difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        estimatedTime: Joi.number(),
        skills: Joi.array().items(
            Joi.object().keys({
                name: Joi.string().required(),
                level: Joi.number().min(1).max(10).required()
            })
        )
    }),
    settings: Joi.object().keys({
        isPublic: Joi.boolean(),
        allowComments: Joi.boolean(),
        showMetadata: Joi.boolean(),
        requireAuth: Joi.boolean()
    })
});

const createContentSchema = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string(),
        type: Joi.string().valid('article', 'lesson', 'tutorial', 'guide', 'documentation').required(),
        blocks: Joi.array().items(contentBlockSchema),
        category: Joi.string().custom(objectId),
        tags: Joi.array().items(Joi.string()),
        metadata: Joi.object().keys({
            contributors: Joi.array().items(Joi.string().custom(objectId)),
            language: Joi.string(),
            level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
            estimatedTime: Joi.number(),
            prerequisites: Joi.array().items(
                Joi.object().keys({
                    content: Joi.string().custom(objectId).required(),
                    description: Joi.string()
                })
            ),
            skills: Joi.array().items(
                Joi.object().keys({
                    name: Joi.string().required(),
                    level: Joi.number().min(1).max(10).required()
                })
            ),
            keywords: Joi.array().items(Joi.string())
        }),
        settings: Joi.object().keys({
            isPublic: Joi.boolean(),
            allowComments: Joi.boolean(),
            allowRatings: Joi.boolean(),
            requireAuth: Joi.boolean(),
            showAuthor: Joi.boolean(),
            enableVersioning: Joi.boolean()
        })
    })
};

const getContentsSchema = {
    query: Joi.object().keys({
        type: Joi.string().valid('article', 'lesson', 'tutorial', 'guide', 'documentation'),
        category: Joi.string().custom(objectId),
        status: Joi.string().valid('draft', 'review', 'published', 'archived'),
        tags: Joi.array().items(Joi.string()),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getContentSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    })
};

const updateContentSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        title: Joi.string(),
        description: Joi.string(),
        type: Joi.string().valid('article', 'lesson', 'tutorial', 'guide', 'documentation'),
        blocks: Joi.array().items(contentBlockSchema),
        category: Joi.string().custom(objectId),
        tags: Joi.array().items(Joi.string()),
        metadata: Joi.object().keys({
            contributors: Joi.array().items(Joi.string().custom(objectId)),
            language: Joi.string(),
            level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
            estimatedTime: Joi.number(),
            prerequisites: Joi.array().items(
                Joi.object().keys({
                    content: Joi.string().custom(objectId).required(),
                    description: Joi.string()
                })
            ),
            skills: Joi.array().items(
                Joi.object().keys({
                    name: Joi.string().required(),
                    level: Joi.number().min(1).max(10).required()
                })
            ),
            keywords: Joi.array().items(Joi.string())
        }),
        settings: Joi.object().keys({
            isPublic: Joi.boolean(),
            allowComments: Joi.boolean(),
            allowRatings: Joi.boolean(),
            requireAuth: Joi.boolean(),
            showAuthor: Joi.boolean(),
            enableVersioning: Joi.boolean()
        }),
        version: Joi.object().keys({
            major: Joi.number(),
            minor: Joi.number(),
            patch: Joi.number()
        })
    })
};

const deleteContentSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    })
};

const addContentBlockSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    }),
    body: contentBlockSchema
};

const updateContentBlockSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required(),
        blockId: Joi.string().custom(objectId).required()
    }),
    body: contentBlockSchema
};

const deleteContentBlockSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required(),
        blockId: Joi.string().custom(objectId).required()
    })
};

const addRatingSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        rating: Joi.number().min(1).max(5).required()
    })
};

const recordCompletionSchema = {
    params: Joi.object().keys({
        contentId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        timeSpent: Joi.number().required()
    })
};

module.exports = {
    createContentSchema,
    getContentsSchema,
    getContentSchema,
    updateContentSchema,
    deleteContentSchema,
    addContentBlockSchema,
    updateContentBlockSchema,
    deleteContentBlockSchema,
    addRatingSchema,
    recordCompletionSchema
};
