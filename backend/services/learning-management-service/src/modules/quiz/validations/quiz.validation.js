const Joi = require('joi');
const { objectId } = require('../../../validations/custom.validation');

const createQuiz = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string(),
        courseId: Joi.string().custom(objectId).required(),
        moduleId: Joi.string().custom(objectId).required(),
        assessmentId: Joi.string().custom(objectId).required(),
        settings: Joi.object().keys({
            timeLimit: Joi.number().min(1),
            attemptsAllowed: Joi.number().min(1),
            passingScore: Joi.number().min(0).max(100),
            shuffleQuestions: Joi.boolean(),
            showResults: Joi.boolean(),
            showFeedback: Joi.boolean(),
            requireLockdown: Joi.boolean(),
            gradingType: Joi.string().valid('automatic', 'manual', 'hybrid')
        }),
        schedule: Joi.object().keys({
            startDate: Joi.date(),
            endDate: Joi.date().greater(Joi.ref('startDate')),
            timezone: Joi.string(),
            lateSubmission: Joi.object().keys({
                allowed: Joi.boolean(),
                deadline: Joi.date().greater(Joi.ref('endDate')),
                penalty: Joi.number().min(0).max(100)
            })
        }),
        prerequisites: Joi.array().items(
            Joi.object().keys({
                type: Joi.string().valid('quiz', 'module', 'assignment').required(),
                id: Joi.string().custom(objectId).required(),
                minimumScore: Joi.number().min(0).max(100)
            })
        ),
        metadata: Joi.object().keys({
            difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
            estimatedDuration: Joi.number().min(1),
            tags: Joi.array().items(Joi.string()),
            skills: Joi.array().items(Joi.string())
        })
    })
};

const getQuiz = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    })
};

const updateQuiz = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        title: Joi.string(),
        description: Joi.string(),
        settings: Joi.object().keys({
            timeLimit: Joi.number().min(1),
            attemptsAllowed: Joi.number().min(1),
            passingScore: Joi.number().min(0).max(100),
            shuffleQuestions: Joi.boolean(),
            showResults: Joi.boolean(),
            showFeedback: Joi.boolean(),
            requireLockdown: Joi.boolean(),
            gradingType: Joi.string().valid('automatic', 'manual', 'hybrid')
        }),
        schedule: Joi.object().keys({
            startDate: Joi.date(),
            endDate: Joi.date().greater(Joi.ref('startDate')),
            timezone: Joi.string(),
            lateSubmission: Joi.object().keys({
                allowed: Joi.boolean(),
                deadline: Joi.date().greater(Joi.ref('endDate')),
                penalty: Joi.number().min(0).max(100)
            })
        }),
        prerequisites: Joi.array().items(
            Joi.object().keys({
                type: Joi.string().valid('quiz', 'module', 'assignment').required(),
                id: Joi.string().custom(objectId).required(),
                minimumScore: Joi.number().min(0).max(100)
            })
        ),
        metadata: Joi.object().keys({
            difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
            estimatedDuration: Joi.number().min(1),
            tags: Joi.array().items(Joi.string()),
            skills: Joi.array().items(Joi.string())
        }),
        status: Joi.string().valid('draft', 'published', 'archived', 'scheduled')
    })
};

const deleteQuiz = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    })
};

const listQuizzes = {
    query: Joi.object().keys({
        courseId: Joi.string().custom(objectId),
        moduleId: Joi.string().custom(objectId),
        status: Joi.string(),
        difficulty: Joi.string(),
        tags: Joi.array().items(Joi.string()),
        skills: Joi.array().items(Joi.string()),
        sortBy: Joi.string(),
        limit: Joi.number().integer(),
        page: Joi.number().integer()
    })
};

const startQuiz = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    })
};

const submitQuiz = {
    params: Joi.object().keys({
        attemptId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        answers: Joi.array().items(
            Joi.object().keys({
                questionId: Joi.string().custom(objectId).required(),
                response: Joi.any().required(),
                timeSpent: Joi.number(),
                confidence: Joi.string().valid('high', 'medium', 'low')
            })
        ).required()
    })
};

const getQuizResults = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    })
};

const getQuizStats = {
    params: Joi.object().keys({
        quizId: Joi.string().custom(objectId).required()
    })
};

const reviewQuizAttempt = {
    params: Joi.object().keys({
        attemptId: Joi.string().custom(objectId).required()
    }),
    body: Joi.object().keys({
        feedback: Joi.array().items(
            Joi.object().keys({
                questionId: Joi.string().custom(objectId).required(),
                correct: Joi.boolean().required(),
                explanation: Joi.string(),
                points: Joi.number().min(0),
                suggestions: Joi.array().items(Joi.string())
            })
        ).required()
    })
};

module.exports = {
    createQuiz,
    getQuiz,
    updateQuiz,
    deleteQuiz,
    listQuizzes,
    startQuiz,
    submitQuiz,
    getQuizResults,
    getQuizStats,
    reviewQuizAttempt
};
