const quizRoutes = require('./routes/quiz.routes');
const quizController = require('./controllers/quiz.controller');
const quizService = require('./services/quiz.service');
const Quiz = require('./models/quiz.model');
const QuizAttempt = require('./models/quiz-attempt.model');
const QuizUtils = require('./utils/quiz.utils');

module.exports = {
    routes: quizRoutes,
    controller: quizController,
    service: quizService,
    models: {
        Quiz,
        QuizAttempt
    },
    utils: QuizUtils
};
