// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\v1\audit.route.js

const express = require('express');
const { validate } = require('express-validation');
const auditController = require('../../controllers/audit.controller');
const auditValidation = require('../../validations/audit.validation');
const auth = require('../../middlewares/auth');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    validate(auditValidation.getAuditLogs),
    auditController.getAuditLogs
  );

router
  .route('/export')
  .post(
    auth(),
    checkRole(['admin']),
    validate(auditValidation.exportAuditLogs),
    auditController.exportAuditLogs
  );

router
  .route('/tenant/:tenantId')
  .get(
    auth(),
    validate(auditValidation.getTenantAuditLogs),
    auditController.getTenantAuditLogs
  );

router
  .route('/tenant/:tenantId/export')
  .post(
    auth(),
    checkRole(['admin']),
    validate(auditValidation.exportTenantAuditLogs),
    auditController.exportTenantAuditLogs
  );

router
  .route('/tenant/:tenantId/summary')
  .get(
    auth(),
    validate(auditValidation.getTenantAuditSummary),
    auditController.getTenantAuditSummary
  );

module.exports = router;
