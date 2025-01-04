const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * System Monitoring Routes
 */
router.get('/monitoring/status', authMiddleware, 'MonitoringController.getSystemStatus');
router.get('/monitoring/metrics', authMiddleware, 'MonitoringController.getMetrics');
router.get('/monitoring/alerts', authMiddleware, 'MonitoringController.getAlerts');
router.post('/monitoring/alerts', authMiddleware, 'MonitoringController.createAlert');
router.get('/monitoring/performance', authMiddleware, 'MonitoringController.getPerformanceMetrics');
router.get('/monitoring/health', authMiddleware, 'MonitoringController.getHealthStatus');
router.get('/monitoring/logs', authMiddleware, 'MonitoringController.getLogs');

/**
 * Backup Management Routes
 */
router.get('/backups', authMiddleware, 'BackupController.list');
router.get('/backups/:id', authMiddleware, 'BackupController.get');
router.post('/backups', authMiddleware, 'BackupController.create');
router.post('/backups/:id/restore', authMiddleware, 'BackupController.restore');
router.get('/backups/schedule', authMiddleware, 'BackupController.getSchedule');
router.post('/backups/schedule', authMiddleware, 'BackupController.scheduleBackup');
router.get('/backups/status', authMiddleware, 'BackupController.getBackupStatus');

/**
 * Security Routes
 */
router.get('/security/threats', authMiddleware, 'SecurityController.getThreats');
router.get('/security/vulnerabilities', authMiddleware, 'SecurityController.getVulnerabilities');
router.post('/security/scan', authMiddleware, 'SecurityController.runSecurityScan');
router.get('/security/access-logs', authMiddleware, 'SecurityController.getAccessLogs');
router.get('/security/reports', authMiddleware, 'SecurityController.getSecurityReports');
router.post('/security/incidents', authMiddleware, 'SecurityController.reportIncident');
router.get('/security/compliance', authMiddleware, 'SecurityController.getComplianceStatus');

/**
 * Integration Routes
 */
router.get('/integrations', authMiddleware, 'IntegrationController.list');
router.get('/integrations/:id', authMiddleware, 'IntegrationController.get');
router.post('/integrations', authMiddleware, 'IntegrationController.create');
router.put('/integrations/:id', authMiddleware, 'IntegrationController.update');
router.delete('/integrations/:id', authMiddleware, 'IntegrationController.delete');
router.get('/integrations/:id/status', authMiddleware, 'IntegrationController.getStatus');
router.post('/integrations/:id/sync', authMiddleware, 'IntegrationController.syncData');

/**
 * API Management Routes
 */
router.get('/api/endpoints', authMiddleware, 'APIController.listEndpoints');
router.get('/api/usage', authMiddleware, 'APIController.getUsageStats');
router.get('/api/documentation', authMiddleware, 'APIController.getDocumentation');
router.post('/api/keys', authMiddleware, 'APIController.generateKey');
router.delete('/api/keys/:id', authMiddleware, 'APIController.revokeKey');
router.get('/api/rate-limits', authMiddleware, 'APIController.getRateLimits');
router.put('/api/rate-limits', authMiddleware, 'APIController.updateRateLimits');

/**
 * Configuration Management Routes
 */
router.get('/config', authMiddleware, 'ConfigController.getConfigurations');
router.get('/config/:key', authMiddleware, 'ConfigController.getConfiguration');
router.put('/config/:key', authMiddleware, 'ConfigController.updateConfiguration');
router.post('/config/validate', authMiddleware, 'ConfigController.validateConfiguration');
router.get('/config/history', authMiddleware, 'ConfigController.getConfigurationHistory');
router.post('/config/rollback/:version', authMiddleware, 'ConfigController.rollbackConfiguration');

module.exports = router;
