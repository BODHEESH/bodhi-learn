const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const createMediaSchema = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string(),
        type: Joi.string().valid('image', 'video', 'audio', 'document', 'presentation').required(),
        fileDetails: Joi.object().keys({
            originalName: Joi.string().required(),
            encoding: Joi.string(),
            mimeType: Joi.string().required(),
            size: Joi.number().required(),
            extension: Joi.string().required(),
            duration: Joi.number(),
            dimensions: Joi.object().keys({
                width: Joi.number(),
                height: Joi.number()
            }),
            bitrate: Joi.number(),
            format: Joi.string()
        }).required(),
        storage: Joi.object().keys({
            provider: Joi.string().valid('local', 's3', 'gcs', 'azure').required(),
            bucket: Joi.string(),
            key: Joi.string(),
            url: Joi.string().required(),
            thumbnailUrl: Joi.string(),
            previewUrl: Joi.string()
        }).required(),
        metadata: Joi.object().keys({
            tags: Joi.array().items(Joi.string()),
            language: Joi.string(),
            copyright: Joi.string(),
            license: Joi.string(),
            location: Joi.object().keys({
                type: Joi.string().valid('Point'),
                coordinates: Joi.array().items(Joi.number()).length(2)
            }),
            captureDate: Joi.date(),
            keywords: Joi.array().items(Joi.string())
        }),
        settings: Joi.object().keys({
            isPublic: Joi.boolean(),
            allowDownload: Joi.boolean(),
            allowSharing: Joi.boolean(),
            requireAttribution: Joi.boolean(),
            autoProcess: Joi.object().keys({
                transcription: Joi.object().keys({
                    enabled: Joi.boolean(),
                    languages: Joi.array().items(Joi.string())
                }),
                thumbnails: Joi.object().keys({
                    enabled: Joi.boolean(),
                    intervals: Joi.array().items(Joi.number())
                }),
                optimization: Joi.object().keys({
                    enabled: Joi.boolean(),
                    quality: Joi.string().valid('low', 'medium', 'high')
                })
            })
        })
    })
};

const getMediaItemsSchema = {
    query: Joi.object().keys({
        type: Joi.string().valid('image', 'video', 'audio', 'document', 'presentation'),
        status: Joi.string().valid('draft', 'processing', 'active', 'archived'),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const getMediaItemSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    })
};

const updateMediaSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        title: Joi.string(),
        description: Joi.string(),
        metadata: Joi.object().keys({
            tags: Joi.array().items(Joi.string()),
            language: Joi.string(),
            copyright: Joi.string(),
            license: Joi.string(),
            location: Joi.object().keys({
                type: Joi.string().valid('Point'),
                coordinates: Joi.array().items(Joi.number()).length(2)
            }),
            captureDate: Joi.date(),
            keywords: Joi.array().items(Joi.string())
        }),
        settings: Joi.object().keys({
            isPublic: Joi.boolean(),
            allowDownload: Joi.boolean(),
            allowSharing: Joi.boolean(),
            requireAttribution: Joi.boolean(),
            autoProcess: Joi.object().keys({
                transcription: Joi.object().keys({
                    enabled: Joi.boolean(),
                    languages: Joi.array().items(Joi.string())
                }),
                thumbnails: Joi.object().keys({
                    enabled: Joi.boolean(),
                    intervals: Joi.array().items(Joi.number())
                }),
                optimization: Joi.object().keys({
                    enabled: Joi.boolean(),
                    quality: Joi.string().valid('low', 'medium', 'high')
                })
            })
        })
    })
};

const deleteMediaSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    })
};

const addTranscriptionSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        language: Joi.string().required(),
        content: Joi.string().required(),
        type: Joi.string().valid('auto', 'manual').required(),
        confidence: Joi.number(),
        segments: Joi.array().items(
            Joi.object().keys({
                startTime: Joi.number().required(),
                endTime: Joi.number().required(),
                text: Joi.string().required(),
                speaker: Joi.string()
            })
        )
    })
};

const addAnnotationSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        type: Joi.string().valid('note', 'highlight', 'bookmark', 'tag', 'custom').required(),
        content: Joi.object().keys({
            text: Joi.string(),
            color: Joi.string(),
            timestamp: Joi.number(),
            position: Joi.object().keys({
                x: Joi.number(),
                y: Joi.number()
            }),
            duration: Joi.number()
        }).required()
    })
};

const updateAnnotationSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required(),
        annotationId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        type: Joi.string().valid('note', 'highlight', 'bookmark', 'tag', 'custom'),
        content: Joi.object().keys({
            text: Joi.string(),
            color: Joi.string(),
            timestamp: Joi.number(),
            position: Joi.object().keys({
                x: Joi.number(),
                y: Joi.number()
            }),
            duration: Joi.number()
        })
    })
};

const deleteAnnotationSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required(),
        annotationId: Joi.string().custom(objectId).required()
    })
};

const addVersionSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        version: Joi.number().required(),
        url: Joi.string().required(),
        quality: Joi.string().required(),
        size: Joi.number().required()
    })
};

const updateProcessingStatusSchema = {
    params: Joi.object().keys({
        mediaId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('pending', 'processing', 'completed', 'failed').required(),
        progress: Joi.number().min(0).max(100),
        error: Joi.string()
    })
};

module.exports = {
    createMediaSchema,
    getMediaItemsSchema,
    getMediaItemSchema,
    updateMediaSchema,
    deleteMediaSchema,
    addTranscriptionSchema,
    addAnnotationSchema,
    updateAnnotationSchema,
    deleteAnnotationSchema,
    addVersionSchema,
    updateProcessingStatusSchema
};
