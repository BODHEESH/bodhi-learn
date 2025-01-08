const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const createLearningPath = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string(),
        category: Joi.string().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert'),
        duration: Joi.number().required(),
        stages: Joi.array().items(
            Joi.object().keys({
                title: Joi.string().required(),
                description: Joi.string(),
                order: Joi.number().required(),
                milestones: Joi.array().items(
                    Joi.object().keys({
                        title: Joi.string().required(),
                        description: Joi.string(),
                        type: Joi.string()
                            .valid('course', 'quiz', 'assignment', 'project', 'assessment')
                            .required(),
                        itemId: Joi.string().custom(objectId).required(),
                        order: Joi.number().required(),
                        requiredToAdvance: Joi.boolean(),
                        completionCriteria: Joi.object().keys({
                            type: Joi.string().valid('completion', 'score', 'time'),
                            value: Joi.number()
                        }),
                        estimatedTime: Joi.number().required(),
                        skills: Joi.array().items(
                            Joi.object().keys({
                                name: Joi.string().required(),
                                level: Joi.string().valid('basic', 'intermediate', 'advanced')
                            })
                        )
                    })
                ),
                unlockCriteria: Joi.object().keys({
                    type: Joi.string().valid(
                        'previous_stage',
                        'specific_milestone',
                        'date',
                        'custom'
                    ),
                    value: Joi.any(),
                    customValidation: Joi.string()
                })
            })
        ),
        prerequisites: Joi.array().items(
            Joi.object().keys({
                type: Joi.string()
                    .valid('skill', 'course', 'learning_path')
                    .required(),
                itemId: Joi.string().custom(objectId),
                level: Joi.string(),
                required: Joi.boolean()
            })
        ),
        learningObjectives: Joi.array().items(
            Joi.object().keys({
                objective: Joi.string().required(),
                assessmentCriteria: Joi.string()
            })
        ),
        metadata: Joi.object().keys({
            tags: Joi.array().items(Joi.string()),
            difficulty: Joi.string().valid(
                'beginner',
                'intermediate',
                'advanced',
                'expert'
            ),
            skills: Joi.array().items(
                Joi.object().keys({
                    name: Joi.string().required(),
                    level: Joi.string()
                })
            ),
            industry: Joi.array().items(Joi.string()),
            certification: Joi.object().keys({
                available: Joi.boolean(),
                provider: Joi.string(),
                name: Joi.string(),
                validityPeriod: Joi.number()
            })
        }),
        settings: Joi.object().keys({
            selfPaced: Joi.boolean(),
            sequential: Joi.boolean(),
            requiresApproval: Joi.boolean(),
            allowSkipping: Joi.boolean(),
            deadlines: Joi.object().keys({
                enabled: Joi.boolean(),
                defaultDuration: Joi.number(),
                gracePeriod: Joi.number()
            }),
            progression: Joi.string().valid('linear', 'flexible', 'adaptive')
        }),
        visibility: Joi.string().valid('public', 'private', 'organization')
    })
};

const updateLearningPath = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        title: Joi.string(),
        description: Joi.string(),
        category: Joi.string(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert'),
        duration: Joi.number(),
        stages: Joi.array().items(
            Joi.object().keys({
                title: Joi.string(),
                description: Joi.string(),
                order: Joi.number(),
                milestones: Joi.array().items(
                    Joi.object().keys({
                        title: Joi.string(),
                        description: Joi.string(),
                        type: Joi.string().valid(
                            'course',
                            'quiz',
                            'assignment',
                            'project',
                            'assessment'
                        ),
                        itemId: Joi.string().custom(objectId),
                        order: Joi.number(),
                        requiredToAdvance: Joi.boolean(),
                        completionCriteria: Joi.object().keys({
                            type: Joi.string().valid('completion', 'score', 'time'),
                            value: Joi.number()
                        }),
                        estimatedTime: Joi.number(),
                        skills: Joi.array().items(
                            Joi.object().keys({
                                name: Joi.string(),
                                level: Joi.string().valid(
                                    'basic',
                                    'intermediate',
                                    'advanced'
                                )
                            })
                        )
                    })
                ),
                unlockCriteria: Joi.object().keys({
                    type: Joi.string().valid(
                        'previous_stage',
                        'specific_milestone',
                        'date',
                        'custom'
                    ),
                    value: Joi.any(),
                    customValidation: Joi.string()
                })
            })
        ),
        prerequisites: Joi.array().items(
            Joi.object().keys({
                type: Joi.string().valid('skill', 'course', 'learning_path'),
                itemId: Joi.string().custom(objectId),
                level: Joi.string(),
                required: Joi.boolean()
            })
        ),
        learningObjectives: Joi.array().items(
            Joi.object().keys({
                objective: Joi.string(),
                assessmentCriteria: Joi.string()
            })
        ),
        metadata: Joi.object().keys({
            tags: Joi.array().items(Joi.string()),
            difficulty: Joi.string().valid(
                'beginner',
                'intermediate',
                'advanced',
                'expert'
            ),
            skills: Joi.array().items(
                Joi.object().keys({
                    name: Joi.string(),
                    level: Joi.string()
                })
            ),
            industry: Joi.array().items(Joi.string()),
            certification: Joi.object().keys({
                available: Joi.boolean(),
                provider: Joi.string(),
                name: Joi.string(),
                validityPeriod: Joi.number()
            })
        }),
        settings: Joi.object().keys({
            selfPaced: Joi.boolean(),
            sequential: Joi.boolean(),
            requiresApproval: Joi.boolean(),
            allowSkipping: Joi.boolean(),
            deadlines: Joi.object().keys({
                enabled: Joi.boolean(),
                defaultDuration: Joi.number(),
                gracePeriod: Joi.number()
            }),
            progression: Joi.string().valid('linear', 'flexible', 'adaptive')
        }),
        visibility: Joi.string().valid('public', 'private', 'organization'),
        status: Joi.string().valid('draft', 'published', 'archived', 'deprecated')
    })
};

const getLearningPath = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    }),
    query: Joi.object().keys({
        fields: Joi.string()
    })
};

const deleteLearningPath = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    })
};

const listLearningPaths = {
    query: Joi.object().keys({
        title: Joi.string(),
        category: Joi.string(),
        level: Joi.string(),
        status: Joi.string(),
        visibility: Joi.string(),
        createdBy: Joi.string().custom(objectId),
        organization: Joi.string().custom(objectId),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer(),
        fields: Joi.string()
    })
};

const enrollInPath = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        deadline: Joi.date(),
        preferences: Joi.object().keys({
            notifications: Joi.object().keys({
                email: Joi.boolean(),
                push: Joi.boolean(),
                frequency: Joi.string().valid('daily', 'weekly', 'milestone')
            }),
            pacing: Joi.string().valid('self_paced', 'scheduled'),
            reminders: Joi.object().keys({
                enabled: Joi.boolean(),
                frequency: Joi.string().valid('daily', 'weekly', 'custom'),
                customDays: Joi.array().items(Joi.number().min(0).max(6))
            })
        })
    })
};

const updateProgress = {
    params: Joi.object().keys({
        enrollmentId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        completedMilestone: Joi.object().keys({
            stageIndex: Joi.number().required(),
            milestoneIndex: Joi.number().required(),
            score: Joi.number(),
            attempts: Joi.number(),
            timeSpent: Joi.number(),
            feedback: Joi.string()
        }),
        currentPosition: Joi.object().keys({
            stageIndex: Joi.number().required(),
            milestoneIndex: Joi.number().required()
        })
    })
};

const getUserProgress = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    })
};

const getAnalytics = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    })
};

const getStageDetails = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required(),
        stageIndex: Joi.number().required()
    })
};

const getMilestoneDetails = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required(),
        stageIndex: Joi.number().required(),
        milestoneIndex: Joi.number().required()
    })
};

const getPrerequisites = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    })
};

const getLearningObjectives = {
    params: Joi.object().keys({
        pathId: Joi.string().custom(objectId).required()
    })
};

module.exports = {
    createLearningPath,
    updateLearningPath,
    getLearningPath,
    deleteLearningPath,
    listLearningPaths,
    enrollInPath,
    updateProgress,
    getUserProgress,
    getAnalytics,
    getStageDetails,
    getMilestoneDetails,
    getPrerequisites,
    getLearningObjectives
};
