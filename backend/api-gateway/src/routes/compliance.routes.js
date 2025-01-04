const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Policy Management Routes
 */
router.get('/policies', authMiddleware, 'PolicyController.list');
router.get('/policies/:id', authMiddleware, 'PolicyController.get');
router.post('/policies', authMiddleware, 'PolicyController.create');
router.put('/policies/:id', authMiddleware, 'PolicyController.update');
router.delete('/policies/:id', authMiddleware, 'PolicyController.delete');
router.post('/policies/:id/publish', authMiddleware, 'PolicyController.publish');
router.get('/policies/:id/versions', authMiddleware, 'PolicyController.getVersions');
router.post('/policies/:id/acknowledge', authMiddleware, 'PolicyController.acknowledgePolicy');

/**
 * Audit Logs Routes
 */
router.get('/audit-logs', authMiddleware, 'AuditController.list');
router.get('/audit-logs/:id', authMiddleware, 'AuditController.get');
router.post('/audit-logs', authMiddleware, 'AuditController.create');
router.get('/audit-logs/search', authMiddleware, 'AuditController.search');
router.get('/audit-logs/reports', authMiddleware, 'AuditController.generateReports');
router.get('/audit-logs/user/:userId', authMiddleware, 'AuditController.getUserActivity');
router.get('/audit-logs/system', authMiddleware, 'AuditController.getSystemActivity');

/**
 * Data Protection Routes
 */
router.get('/data-protection/policies', authMiddleware, 'DataProtectionController.listPolicies');
router.get('/data-protection/consents', authMiddleware, 'DataProtectionController.listConsents');
router.post('/data-protection/consents', authMiddleware, 'DataProtectionController.recordConsent');
router.get('/data-protection/requests', authMiddleware, 'DataProtectionController.listRequests');
router.post('/data-protection/requests', authMiddleware, 'DataProtectionController.createRequest');
router.put('/data-protection/requests/:id', authMiddleware, 'DataProtectionController.updateRequest');
router.get('/data-protection/breaches', authMiddleware, 'DataProtectionController.listBreaches');
router.post('/data-protection/breaches', authMiddleware, 'DataProtectionController.reportBreach');

/**
 * Regulatory Compliance Routes
 */
router.get('/regulatory/requirements', authMiddleware, 'RegulatoryController.listRequirements');
router.get('/regulatory/requirements/:id', authMiddleware, 'RegulatoryController.getRequirement');
router.post('/regulatory/requirements', authMiddleware, 'RegulatoryController.addRequirement');
router.put('/regulatory/requirements/:id', authMiddleware, 'RegulatoryController.updateRequirement');
router.get('/regulatory/compliance-status', authMiddleware, 'RegulatoryController.getComplianceStatus');
router.post('/regulatory/assessments', authMiddleware, 'RegulatoryController.createAssessment');
router.get('/regulatory/reports', authMiddleware, 'RegulatoryController.generateReports');

/**
 * Reporting Routes
 */
router.get('/reports/compliance', authMiddleware, 'ReportingController.getComplianceReports');
router.get('/reports/audit', authMiddleware, 'ReportingController.getAuditReports');
router.get('/reports/data-protection', authMiddleware, 'ReportingController.getDataProtectionReports');
router.get('/reports/regulatory', authMiddleware, 'ReportingController.getRegulatoryReports');
router.post('/reports/generate', authMiddleware, 'ReportingController.generateCustomReport');
router.get('/reports/scheduled', authMiddleware, 'ReportingController.getScheduledReports');
router.post('/reports/schedule', authMiddleware, 'ReportingController.scheduleReport');

module.exports = router;
