const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Staff Management Routes
 */
router.get('/staff', authMiddleware, 'StaffController.list');
router.get('/staff/:id', authMiddleware, 'StaffController.get');
router.post('/staff', authMiddleware, 'StaffController.create');
router.put('/staff/:id', authMiddleware, 'StaffController.update');
router.delete('/staff/:id', authMiddleware, 'StaffController.delete');
router.get('/staff/:id/schedule', authMiddleware, 'StaffController.getSchedule');
router.post('/staff/:id/leave', authMiddleware, 'StaffController.requestLeave');
router.get('/staff/:id/performance', authMiddleware, 'StaffController.getPerformance');

/**
 * Department Management Routes
 */
router.get('/departments', authMiddleware, 'DepartmentController.list');
router.get('/departments/:id', authMiddleware, 'DepartmentController.get');
router.post('/departments', authMiddleware, 'DepartmentController.create');
router.put('/departments/:id', authMiddleware, 'DepartmentController.update');
router.delete('/departments/:id', authMiddleware, 'DepartmentController.delete');
router.get('/departments/:id/staff', authMiddleware, 'DepartmentController.getStaff');
router.get('/departments/:id/budget', authMiddleware, 'DepartmentController.getBudget');
router.get('/departments/:id/performance', authMiddleware, 'DepartmentController.getPerformance');

/**
 * Asset Management Routes
 */
router.get('/assets', authMiddleware, 'AssetController.list');
router.get('/assets/:id', authMiddleware, 'AssetController.get');
router.post('/assets', authMiddleware, 'AssetController.create');
router.put('/assets/:id', authMiddleware, 'AssetController.update');
router.delete('/assets/:id', authMiddleware, 'AssetController.delete');
router.post('/assets/:id/assign', authMiddleware, 'AssetController.assignAsset');
router.get('/assets/:id/history', authMiddleware, 'AssetController.getHistory');
router.post('/assets/:id/maintenance', authMiddleware, 'AssetController.scheduleMaintenance');

/**
 * Scheduling Routes
 */
router.get('/schedule/classes', authMiddleware, 'SchedulingController.listClasses');
router.post('/schedule/classes', authMiddleware, 'SchedulingController.scheduleClass');
router.get('/schedule/rooms', authMiddleware, 'SchedulingController.listRooms');
router.post('/schedule/rooms', authMiddleware, 'SchedulingController.scheduleRoom');
router.get('/schedule/faculty', authMiddleware, 'SchedulingController.listFaculty');
router.post('/schedule/faculty', authMiddleware, 'SchedulingController.scheduleFaculty');
router.get('/schedule/conflicts', authMiddleware, 'SchedulingController.checkConflicts');
router.post('/schedule/optimize', authMiddleware, 'SchedulingController.optimizeSchedule');

/**
 * Reporting Routes
 */
router.get('/reports/staff', authMiddleware, 'OperationsReportController.getStaffReports');
router.get('/reports/departments', authMiddleware, 'OperationsReportController.getDepartmentReports');
router.get('/reports/assets', authMiddleware, 'OperationsReportController.getAssetReports');
router.get('/reports/schedule', authMiddleware, 'OperationsReportController.getScheduleReports');
router.get('/reports/performance', authMiddleware, 'OperationsReportController.getPerformanceReports');
router.post('/reports/custom', authMiddleware, 'OperationsReportController.generateCustomReport');
router.get('/reports/analytics', authMiddleware, 'OperationsReportController.getAnalytics');
router.get('/reports/efficiency', authMiddleware, 'OperationsReportController.getEfficiencyMetrics');

/**
 * Resource Allocation Routes
 */
router.get('/resources/allocation', authMiddleware, 'ResourceController.getAllocation');
router.post('/resources/allocate', authMiddleware, 'ResourceController.allocateResources');
router.get('/resources/utilization', authMiddleware, 'ResourceController.getUtilization');
router.get('/resources/availability', authMiddleware, 'ResourceController.checkAvailability');
router.post('/resources/request', authMiddleware, 'ResourceController.requestResources');
router.get('/resources/forecast', authMiddleware, 'ResourceController.getForecast');
router.post('/resources/optimize', authMiddleware, 'ResourceController.optimizeAllocation');
router.get('/resources/conflicts', authMiddleware, 'ResourceController.checkConflicts');

module.exports = router;
