const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Course Management Routes
 */
router.get('/courses', authMiddleware, 'CourseController.list');
router.get('/courses/:id', authMiddleware, 'CourseController.get');
router.post('/courses', authMiddleware, 'CourseController.create');
router.put('/courses/:id', authMiddleware, 'CourseController.update');
router.delete('/courses/:id', authMiddleware, 'CourseController.delete');
router.put('/courses/:id/publish', authMiddleware, 'CourseController.publish');
router.put('/courses/:id/unpublish', authMiddleware, 'CourseController.unpublish');

/**
 * Curriculum Routes
 */
router.get('/curriculum', authMiddleware, 'CurriculumController.list');
router.get('/curriculum/:id', authMiddleware, 'CurriculumController.get');
router.post('/curriculum', authMiddleware, 'CurriculumController.create');
router.put('/curriculum/:id', authMiddleware, 'CurriculumController.update');
router.delete('/curriculum/:id', authMiddleware, 'CurriculumController.delete');

/**
 * Content Management Routes
 */
router.get('/content', authMiddleware, 'ContentController.list');
router.get('/content/:id', authMiddleware, 'ContentController.get');
router.post('/content', authMiddleware, 'ContentController.create');
router.put('/content/:id', authMiddleware, 'ContentController.update');
router.delete('/content/:id', authMiddleware, 'ContentController.delete');
router.post('/content/:id/upload', authMiddleware, 'ContentController.uploadFile');

/**
 * Assessment Routes
 */
router.get('/assessments', authMiddleware, 'AssessmentController.list');
router.get('/assessments/:id', authMiddleware, 'AssessmentController.get');
router.post('/assessments', authMiddleware, 'AssessmentController.create');
router.put('/assessments/:id', authMiddleware, 'AssessmentController.update');
router.delete('/assessments/:id', authMiddleware, 'AssessmentController.delete');
router.post('/assessments/:id/submit', authMiddleware, 'AssessmentController.submit');
router.get('/assessments/:id/results', authMiddleware, 'AssessmentController.getResults');

/**
 * Assignment Routes
 */
router.get('/assignments', authMiddleware, 'AssignmentController.list');
router.get('/assignments/:id', authMiddleware, 'AssignmentController.get');
router.post('/assignments', authMiddleware, 'AssignmentController.create');
router.put('/assignments/:id', authMiddleware, 'AssignmentController.update');
router.delete('/assignments/:id', authMiddleware, 'AssignmentController.delete');
router.post('/assignments/:id/submit', authMiddleware, 'AssignmentController.submit');
router.put('/assignments/:id/grade', authMiddleware, 'AssignmentController.grade');

/**
 * Quiz Routes
 */
router.get('/quizzes', authMiddleware, 'QuizController.list');
router.get('/quizzes/:id', authMiddleware, 'QuizController.get');
router.post('/quizzes', authMiddleware, 'QuizController.create');
router.put('/quizzes/:id', authMiddleware, 'QuizController.update');
router.delete('/quizzes/:id', authMiddleware, 'QuizController.delete');
router.post('/quizzes/:id/start', authMiddleware, 'QuizController.start');
router.post('/quizzes/:id/submit', authMiddleware, 'QuizController.submit');

/**
 * Media Routes
 */
router.get('/media', authMiddleware, 'MediaController.list');
router.get('/media/:id', authMiddleware, 'MediaController.get');
router.post('/media', authMiddleware, 'MediaController.upload');
router.delete('/media/:id', authMiddleware, 'MediaController.delete');
router.get('/media/:id/stream', 'MediaController.stream');

/**
 * Progress Tracking Routes
 */
router.get('/progress', authMiddleware, 'ProgressController.getUserProgress');
router.get('/progress/course/:courseId', authMiddleware, 'ProgressController.getCourseProgress');
router.post('/progress/track', authMiddleware, 'ProgressController.trackProgress');
router.get('/progress/analytics', authMiddleware, 'ProgressController.getAnalytics');

/**
 * Learning Path Routes
 */
router.get('/learning-paths', authMiddleware, 'LearningPathController.list');
router.get('/learning-paths/:id', authMiddleware, 'LearningPathController.get');
router.post('/learning-paths', authMiddleware, 'LearningPathController.create');
router.put('/learning-paths/:id', authMiddleware, 'LearningPathController.update');
router.delete('/learning-paths/:id', authMiddleware, 'LearningPathController.delete');
router.post('/learning-paths/:id/enroll', authMiddleware, 'LearningPathController.enroll');

module.exports = router;
