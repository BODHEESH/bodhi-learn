// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\v1\tenant.route.js

const express = require('express');
const { validate } = require('express-validation');
const tenantController = require('../../controllers/tenant.controller');
const tenantValidation = require('../../validations/tenant.validation');
const auth = require('../../middlewares/auth');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

/**
 * Tenant Management Routes
 */
router
  .route('/')
  .post(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.createTenant),
    tenantController.createTenant
  )
  .get(
    auth(),
    validate(tenantValidation.listTenants),
    tenantController.listTenants
  );

router
  .route('/:tenantId')
  .get(
    auth(),
    validate(tenantValidation.getTenant),
    tenantController.getTenant
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.updateTenant),
    tenantController.updateTenant
  )
  .delete(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.deleteTenant),
    tenantController.deleteTenant
  );

/**
 * Tenant Settings Routes
 */
router
  .route('/:tenantId/settings')
  .get(
    auth(),
    validate(tenantValidation.getTenantSettings),
    tenantController.getTenantSettings
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.updateTenantSettings),
    tenantController.updateTenantSettings
  );

/**
 * Tenant Billing Routes
 */
router
  .route('/:tenantId/billing')
  .get(
    auth(),
    validate(tenantValidation.getTenantBilling),
    tenantController.getTenantBilling
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.updateTenantBilling),
    tenantController.updateTenantBilling
  );

/**
 * Tenant Plan Management Routes
 */
router
  .route('/:tenantId/plan')
  .patch(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.upgradePlan),
    tenantController.upgradePlan
  );

/**
 * Tenant Analytics Routes
 */
router
  .route('/:tenantId/analytics')
  .get(
    auth(),
    validate(tenantValidation.getTenantAnalytics),
    tenantController.getTenantAnalytics
  );

/**
 * Tenant Health Routes
 */
router
  .route('/:tenantId/health')
  .get(
    auth(),
    validate(tenantValidation.checkTenantHealth),
    tenantController.checkTenantHealth
  );

/**
 * Tenant Backup Routes
 */
router
  .route('/:tenantId/backup')
  .post(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.createTenantBackup),
    tenantController.createTenantBackup
  )
  .get(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.listTenantBackups),
    tenantController.listTenantBackups
  );

router
  .route('/:tenantId/backup/:backupId')
  .get(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.getTenantBackup),
    tenantController.getTenantBackup
  )
  .post(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.restoreTenantFromBackup),
    tenantController.restoreTenantFromBackup
  )
  .delete(
    auth(),
    checkRole(['admin']),
    validate(tenantValidation.deleteTenantBackup),
    tenantController.deleteTenantBackup
  );

/**
 * Tenant Resource Management Routes
 */
router
  .route('/:tenantId/resources')
  .get(
    auth(),
    validate(tenantValidation.getTenantResources),
    tenantController.getTenantResources
  );

router
  .route('/:tenantId/usage')
  .get(
    auth(),
    validate(tenantValidation.getResourceUsage),
    tenantController.getResourceUsage
  );

module.exports = router;
