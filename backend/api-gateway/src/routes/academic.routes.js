const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Admission Routes
 */
router.get('/admissions', authMiddleware, 'AdmissionController.list');
router.get('/admissions/:id', authMiddleware, 'AdmissionController.get');
router.post('/admissions', authMiddleware, 'AdmissionController.create');
router.put('/admissions/:id', authMiddleware, 'AdmissionController.update');
router.delete('/admissions/:id', authMiddleware, 'AdmissionController.delete');
router.post('/admissions/:id/approve', authMiddleware, 'AdmissionController.approve');
router.post('/admissions/:id/reject', authMiddleware, 'AdmissionController.reject');

/**
 * Enrollment Routes
 */
router.get('/enrollments', authMiddleware, 'EnrollmentController.list');
router.get('/enrollments/:id', authMiddleware, 'EnrollmentController.get');
router.post('/enrollments', authMiddleware, 'EnrollmentController.create');
router.put('/enrollments/:id', authMiddleware, 'EnrollmentController.update');
router.delete('/enrollments/:id', authMiddleware, 'EnrollmentController.delete');
router.post('/enrollments/:id/confirm', authMiddleware, 'EnrollmentController.confirm');

/**
 * Attendance Routes
 */
router.get('/attendance', authMiddleware, 'AttendanceController.list');
router.get('/attendance/:id', authMiddleware, 'AttendanceController.get');
router.post('/attendance', authMiddleware, 'AttendanceController.mark');
router.put('/attendance/:id', authMiddleware, 'AttendanceController.update');
router.get('/attendance/report', authMiddleware, 'AttendanceController.generateReport');
router.get('/attendance/student/:studentId', authMiddleware, 'AttendanceController.getStudentAttendance');

/**
 * Examination Routes
 */
router.get('/exams', authMiddleware, 'ExaminationController.list');
router.get('/exams/:id', authMiddleware, 'ExaminationController.get');
router.post('/exams', authMiddleware, 'ExaminationController.create');
router.put('/exams/:id', authMiddleware, 'ExaminationController.update');
router.delete('/exams/:id', authMiddleware, 'ExaminationController.delete');
router.post('/exams/:id/schedule', authMiddleware, 'ExaminationController.schedule');
router.get('/exams/:id/results', authMiddleware, 'ExaminationController.getResults');

/**
 * Grading Routes
 */
router.get('/grades', authMiddleware, 'GradingController.list');
router.get('/grades/:id', authMiddleware, 'GradingController.get');
router.post('/grades', authMiddleware, 'GradingController.create');
router.put('/grades/:id', authMiddleware, 'GradingController.update');
router.get('/grades/student/:studentId', authMiddleware, 'GradingController.getStudentGrades');
router.get('/grades/course/:courseId', authMiddleware, 'GradingController.getCourseGrades');

/**
 * Performance Routes
 */
router.get('/performance', authMiddleware, 'PerformanceController.list');
router.get('/performance/:id', authMiddleware, 'PerformanceController.get');
router.post('/performance', authMiddleware, 'PerformanceController.create');
router.put('/performance/:id', authMiddleware, 'PerformanceController.update');
router.get('/performance/analytics', authMiddleware, 'PerformanceController.getAnalytics');
router.get('/performance/reports', authMiddleware, 'PerformanceController.generateReports');

/**
 * Certification Routes
 */
router.get('/certificates', authMiddleware, 'CertificationController.list');
router.get('/certificates/:id', authMiddleware, 'CertificationController.get');
router.post('/certificates', authMiddleware, 'CertificationController.create');
router.put('/certificates/:id', authMiddleware, 'CertificationController.update');
router.delete('/certificates/:id', authMiddleware, 'CertificationController.delete');
router.post('/certificates/:id/issue', authMiddleware, 'CertificationController.issue');
router.get('/certificates/:id/verify', 'CertificationController.verify');

/**
 * Academic Calendar Routes
 */
router.get('/calendar', authMiddleware, 'CalendarController.list');
router.get('/calendar/:id', authMiddleware, 'CalendarController.get');
router.post('/calendar', authMiddleware, 'CalendarController.create');
router.put('/calendar/:id', authMiddleware, 'CalendarController.update');
router.delete('/calendar/:id', authMiddleware, 'CalendarController.delete');
router.get('/calendar/events', authMiddleware, 'CalendarController.getEvents');

/**
 * Program Management Routes
 */
router.get('/programs', authMiddleware, 'ProgramController.list');
router.get('/programs/:id', authMiddleware, 'ProgramController.get');
router.post('/programs', authMiddleware, 'ProgramController.create');
router.put('/programs/:id', authMiddleware, 'ProgramController.update');
router.delete('/programs/:id', authMiddleware, 'ProgramController.delete');
router.get('/programs/:id/curriculum', authMiddleware, 'ProgramController.getCurriculum');
router.put('/programs/:id/status', authMiddleware, 'ProgramController.updateStatus');

module.exports = router;
