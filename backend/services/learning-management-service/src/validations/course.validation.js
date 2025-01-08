const Joi = require('joi');

const courseValidation = {
    // Course Creation
    createCourse: {
        body: Joi.object({
            title: Joi.string().min(5).max(200).required(),
            description: Joi.string().min(20).max(2000).required(),
            category: Joi.string().required(),
            objectives: Joi.array().items(Joi.string()).min(1).required(),
            requirements: Joi.array().items(Joi.string()),
            metadata: Joi.object({
                tags: Joi.array().items(Joi.string()),
                level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
                estimatedDuration: Joi.number(),
                skillsGained: Joi.array().items(Joi.string())
            }).required(),
            settings: Joi.object({
                enrollment: Joi.string().valid('open', 'invite', 'approval'),
                maxStudents: Joi.number(),
                startDate: Joi.date(),
                endDate: Joi.date()
            })
        })
    },

    // Version Management
    createVersion: {
        params: Joi.object({
            courseId: Joi.string().required()
        }),
        body: Joi.object({
            title: Joi.string().min(5).max(200).required(),
            description: Joi.string().min(20).max(2000).required(),
            objectives: Joi.array().items(Joi.string()).min(1).required(),
            content: Joi.array().items(Joi.string()),
            requirements: Joi.array().items(Joi.string())
        })
    },

    publishVersion: {
        params: Joi.object({
            courseId: Joi.string().required(),
            version: Joi.string().required()
        })
    },

    // Template Management
    createTemplate: {
        body: Joi.object({
            name: Joi.string().required(),
            description: Joi.string(),
            structure: Joi.object({
                sections: Joi.array().items(Joi.object({
                    title: Joi.string().required(),
                    description: Joi.string(),
                    contentTypes: Joi.array().items(Joi.string())
                }))
            }).required(),
            settings: Joi.object().pattern(Joi.string(), Joi.any())
        })
    },

    // Workflow Management
    updateWorkflowStage: {
        params: Joi.object({
            courseId: Joi.string().required()
        }),
        body: Joi.object({
            stage: Joi.string().valid('planning', 'development', 'review', 'published').required(),
            assignedTo: Joi.string(),
            comments: Joi.string()
        })
    },

    // Analytics
    getAnalytics: {
        params: Joi.object({
            courseId: Joi.string().required()
        }),
        query: Joi.object({
            period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
            metrics: Joi.array().items(Joi.string())
        })
    },

    // Filtering
    getCourses: {
        query: Joi.object({
            category: Joi.string(),
            level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
            tags: Joi.array().items(Joi.string()),
            status: Joi.string().valid('draft', 'review', 'published', 'archived'),
            instructor: Joi.string(),
            page: Joi.number().min(1).default(1),
            limit: Joi.number().min(1).max(100).default(10),
            sortBy: Joi.string(),
            sortOrder: Joi.string().valid('asc', 'desc')
        })
    }
};

module.exports = courseValidation;
