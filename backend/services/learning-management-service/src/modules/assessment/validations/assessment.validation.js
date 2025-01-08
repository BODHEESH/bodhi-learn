const Joi = require('joi');

const assessmentValidation = {
    // Assessment Management
    createAssessment: {
        body: Joi.object({
            title: Joi.string().min(5).max(200).required(),
            description: Joi.string().max(2000),
            type: Joi.string().valid('quiz', 'exam', 'practice', 'survey').required(),
            courseId: Joi.string().required(),
            settings: Joi.object({
                timeLimit: Joi.number(),
                passingScore: Joi.number().min(0).max(100),
                maxAttempts: Joi.number().min(1),
                shuffleQuestions: Joi.boolean(),
                showResults: Joi.string().valid(
                    'immediately',
                    'after_submission',
                    'after_due_date',
                    'never'
                ),
                dueDate: Joi.date(),
                gradingType: Joi.string().valid('automatic', 'manual', 'hybrid')
            }),
            metadata: Joi.object({
                estimatedDuration: Joi.number(),
                difficulty: Joi.string().valid('easy', 'medium', 'hard'),
                tags: Joi.array().items(Joi.string()),
                skills: Joi.array().items(Joi.string())
            })
        })
    },

    updateAssessment: {
        params: Joi.object({
            assessmentId: Joi.string().required()
        }),
        body: Joi.object({
            title: Joi.string().min(5).max(200),
            description: Joi.string().max(2000),
            settings: Joi.object({
                timeLimit: Joi.number(),
                passingScore: Joi.number().min(0).max(100),
                maxAttempts: Joi.number().min(1),
                shuffleQuestions: Joi.boolean(),
                showResults: Joi.string().valid(
                    'immediately',
                    'after_submission',
                    'after_due_date',
                    'never'
                ),
                dueDate: Joi.date(),
                gradingType: Joi.string().valid('automatic', 'manual', 'hybrid')
            }),
            metadata: Joi.object({
                estimatedDuration: Joi.number(),
                difficulty: Joi.string().valid('easy', 'medium', 'hard'),
                tags: Joi.array().items(Joi.string()),
                skills: Joi.array().items(Joi.string())
            })
        })
    },

    // Question Management
    addQuestion: {
        params: Joi.object({
            assessmentId: Joi.string().required()
        }),
        body: Joi.object({
            type: Joi.string().valid(
                'multiple-choice',
                'true-false',
                'essay',
                'coding',
                'matching',
                'fill-blank'
            ).required(),
            content: Joi.object({
                question: Joi.string().required(),
                options: Joi.array().items(Joi.object({
                    id: Joi.string().required(),
                    text: Joi.string().required(),
                    isCorrect: Joi.boolean()
                })),
                correctAnswer: Joi.any(),
                explanation: Joi.string()
            }).required(),
            metadata: Joi.object({
                difficulty: Joi.string().valid('easy', 'medium', 'hard').required(),
                tags: Joi.array().items(Joi.string()),
                skills: Joi.array().items(Joi.string()),
                bloomsLevel: Joi.string().valid(
                    'remember',
                    'understand',
                    'apply',
                    'analyze',
                    'evaluate',
                    'create'
                )
            }),
            scoring: Joi.object({
                points: Joi.number().required(),
                partialCredit: Joi.boolean(),
                rubric: Joi.array().items(Joi.object({
                    criterion: Joi.string().required(),
                    points: Joi.number().required(),
                    description: Joi.string()
                }))
            }),
            settings: Joi.object({
                timeLimit: Joi.number(),
                attempts: Joi.number(),
                shuffleOptions: Joi.boolean()
            })
        })
    },

    updateQuestion: {
        params: Joi.object({
            assessmentId: Joi.string().required(),
            questionId: Joi.string().required()
        }),
        body: Joi.object({
            content: Joi.object({
                question: Joi.string(),
                options: Joi.array().items(Joi.object({
                    id: Joi.string().required(),
                    text: Joi.string().required(),
                    isCorrect: Joi.boolean()
                })),
                correctAnswer: Joi.any(),
                explanation: Joi.string()
            }),
            metadata: Joi.object({
                difficulty: Joi.string().valid('easy', 'medium', 'hard'),
                tags: Joi.array().items(Joi.string()),
                skills: Joi.array().items(Joi.string()),
                bloomsLevel: Joi.string().valid(
                    'remember',
                    'understand',
                    'apply',
                    'analyze',
                    'evaluate',
                    'create'
                )
            }),
            scoring: Joi.object({
                points: Joi.number(),
                partialCredit: Joi.boolean(),
                rubric: Joi.array().items(Joi.object({
                    criterion: Joi.string().required(),
                    points: Joi.number().required(),
                    description: Joi.string()
                }))
            }),
            settings: Joi.object({
                timeLimit: Joi.number(),
                attempts: Joi.number(),
                shuffleOptions: Joi.boolean()
            })
        })
    },

    // Submission Management
    startSubmission: {
        params: Joi.object({
            assessmentId: Joi.string().required()
        }),
        body: Joi.object({
            metadata: Joi.object({
                ipAddress: Joi.string(),
                userAgent: Joi.string()
            })
        })
    },

    submitAssessment: {
        params: Joi.object({
            submissionId: Joi.string().required()
        }),
        body: Joi.object({
            answers: Joi.array().items(Joi.object({
                questionId: Joi.string().required(),
                answer: Joi.any().required(),
                timeSpent: Joi.number()
            })).required()
        })
    },

    // Analytics
    getAssessmentStats: {
        params: Joi.object({
            assessmentId: Joi.string().required()
        }),
        query: Joi.object({
            period: Joi.string().valid('7d', '30d', '90d', 'all').default('all')
        })
    }
};

module.exports = assessmentValidation;
