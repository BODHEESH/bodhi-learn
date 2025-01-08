const httpStatus = require('http-status');
const Quiz = require('../models/quiz.model');
const QuizAttempt = require('../models/quiz-attempt.model');
const { ApiError } = require('../../../utils/errors');
const { paginate, calculateStats } = require('../../../utils/helpers');
const logger = require('../../../config/logger');

class QuizService {
    /**
     * Create Quiz
     */
    async createQuiz(quizData) {
        const quiz = await Quiz.create(quizData);
        return quiz;
    }

    /**
     * Get Quiz by ID
     */
    async getQuizById(quizId) {
        const quiz = await Quiz.findById(quizId)
            .populate('assessmentId')
            .populate('createdBy', 'name email');
        return quiz;
    }

    /**
     * Update Quiz
     */
    async updateQuiz(quizId, updateData, userId) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
        }

        Object.assign(quiz, {
            ...updateData,
            updatedBy: userId
        });

        await quiz.save();
        return quiz;
    }

    /**
     * Delete Quiz
     */
    async deleteQuiz(quizId) {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
        }

        await quiz.remove();
        return true;
    }

    /**
     * Query Quizzes
     */
    async queryQuizzes(filter, options) {
        const quizzes = await paginate(Quiz, filter, options, {
            populate: [
                {
                    path: 'assessmentId',
                    select: 'title totalQuestions totalPoints'
                },
                {
                    path: 'createdBy',
                    select: 'name email'
                }
            ]
        });
        return quizzes;
    }

    /**
     * Start Quiz
     */
    async startQuiz(quizId, userId) {
        const quiz = await Quiz.findById(quizId).populate('assessmentId');
        if (!quiz) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
        }

        // Check if quiz is available
        if (quiz.status !== 'published') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz is not available');
        }

        // Check schedule
        const now = new Date();
        if (quiz.schedule.startDate && now < quiz.schedule.startDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has not started yet');
        }
        if (quiz.schedule.endDate && now > quiz.schedule.endDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz has ended');
        }

        // Check attempts
        const attemptCount = await QuizAttempt.countDocuments({
            quizId,
            userId,
            status: { $in: ['completed', 'graded'] }
        });

        if (attemptCount >= quiz.settings.attemptsAllowed) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Maximum attempts reached');
        }

        // Check prerequisites
        if (quiz.prerequisites && quiz.prerequisites.length > 0) {
            for (const prereq of quiz.prerequisites) {
                const isCompleted = await this.checkPrerequisite(prereq, userId);
                if (!isCompleted) {
                    throw new ApiError(
                        httpStatus.BAD_REQUEST,
                        'Prerequisites not completed'
                    );
                }
            }
        }

        // Create attempt
        const attempt = await QuizAttempt.create({
            quizId,
            userId,
            startTime: now,
            status: 'in_progress',
            timeLimit: quiz.settings.timeLimit,
            questions: this.prepareQuestions(quiz.assessmentId.questions, quiz.settings)
        });

        return attempt;
    }

    /**
     * Submit Quiz
     */
    async submitQuiz(attemptId, answers, userId) {
        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Quiz attempt not found');
        }

        if (attempt.userId.toString() !== userId.toString()) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized');
        }

        if (attempt.status !== 'in_progress') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz already submitted');
        }

        // Check time limit
        const now = new Date();
        const timeSpent = (now - attempt.startTime) / 1000 / 60; // in minutes
        if (timeSpent > attempt.timeLimit) {
            attempt.status = 'timed_out';
        }

        // Process answers and calculate score
        const quiz = await Quiz.findById(attempt.quizId).populate('assessmentId');
        const results = await this.gradeQuiz(answers, quiz.assessmentId.questions);

        attempt.endTime = now;
        attempt.answers = answers;
        attempt.score = results.score;
        attempt.feedback = results.feedback;
        attempt.status = quiz.settings.gradingType === 'automatic' ? 'graded' : 'completed';
        attempt.passed = results.score >= quiz.settings.passingScore;

        await attempt.save();

        // Update quiz stats
        await this.updateQuizStats(attempt.quizId);

        return attempt;
    }

    /**
     * Get Quiz Results
     */
    async getQuizResults(quizId, userId) {
        const attempts = await QuizAttempt.find({
            quizId,
            userId,
            status: { $in: ['completed', 'graded'] }
        }).sort('-createdAt');

        return attempts;
    }

    /**
     * Get Quiz Statistics
     */
    async getQuizStats(quizId) {
        const attempts = await QuizAttempt.find({
            quizId,
            status: { $in: ['completed', 'graded'] }
        });

        const stats = calculateStats(attempts);
        return stats;
    }

    /**
     * Review Quiz Attempt
     */
    async reviewQuizAttempt(attemptId, feedback, userId) {
        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Quiz attempt not found');
        }

        if (attempt.status !== 'completed') {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Quiz not ready for review');
        }

        attempt.feedback = feedback;
        attempt.reviewedBy = userId;
        attempt.status = 'graded';
        attempt.reviewedAt = new Date();

        await attempt.save();
        return attempt;
    }

    /**
     * Helper Methods
     */
    async checkPrerequisite(prerequisite, userId) {
        switch (prerequisite.type) {
            case 'quiz':
                return this.checkQuizPrerequisite(prerequisite, userId);
            case 'module':
                return this.checkModulePrerequisite(prerequisite, userId);
            case 'assignment':
                return this.checkAssignmentPrerequisite(prerequisite, userId);
            default:
                return false;
        }
    }

    prepareQuestions(questions, settings) {
        let preparedQuestions = [...questions];

        if (settings.shuffleQuestions) {
            preparedQuestions = this.shuffleArray(preparedQuestions);
        }

        return preparedQuestions.map(q => ({
            ...q,
            answer: undefined // Remove answers for security
        }));
    }

    async gradeQuiz(answers, questions) {
        let totalScore = 0;
        let feedback = [];

        for (const answer of answers) {
            const question = questions.find(q => q._id.toString() === answer.questionId.toString());
            if (!question) continue;

            const result = await this.gradeQuestion(answer, question);
            totalScore += result.score;
            feedback.push(result.feedback);
        }

        return {
            score: totalScore,
            feedback
        };
    }

    async gradeQuestion(answer, question) {
        // Implement grading logic based on question type
        // This is a simplified version
        const isCorrect = this.compareAnswers(answer.response, question.correctAnswer);
        return {
            score: isCorrect ? question.points : 0,
            feedback: {
                questionId: question._id,
                correct: isCorrect,
                explanation: question.explanation
            }
        };
    }

    compareAnswers(userAnswer, correctAnswer) {
        // Implement answer comparison logic based on question type
        return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async updateQuizStats(quizId) {
        const attempts = await QuizAttempt.find({
            quizId,
            status: { $in: ['completed', 'graded'] }
        });

        const stats = {
            attempts: attempts.length,
            completions: attempts.filter(a => a.status === 'graded').length,
            averageScore: attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length,
            passRate: (attempts.filter(a => a.passed).length / attempts.length) * 100,
            averageTime: attempts.reduce((acc, a) => acc + (a.endTime - a.startTime), 0) / attempts.length
        };

        await Quiz.findByIdAndUpdate(quizId, { stats });
    }
}

module.exports = new QuizService();
