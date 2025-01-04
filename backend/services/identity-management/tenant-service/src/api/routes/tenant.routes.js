// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\routes\tenant.routes.js

const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const tenantSettingsController = require('../controllers/tenant-settings.controller');
const tenantBillingController = require('../controllers/tenant-billing.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateTenantAccess } = require('../middlewares/tenant-access');
const { rateLimiter } = require('../middlewares/rate-limiter');
const { validate } = require('../middlewares/validation');
const { tenantValidation } = require('../validations/tenant.validation');

// Tenant Management
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  validate(tenantValidation.createTenant),
  rateLimiter,
  tenantController.createTenant
);

router.get(
  '/',
  authenticate,
  authorize(['admin']),
  validate(tenantValidation.listTenants),
  rateLimiter,
  tenantController.listTenants
);

router.get(
  '/:id',
  authenticate,
  validateTenantAccess,
  validate(tenantValidation.getTenant),
  rateLimiter,
  tenantController.getTenant
);

router.put(
  '/:id',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.updateTenant),
  rateLimiter,
  tenantController.updateTenant
);

router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validate(tenantValidation.deleteTenant),
  rateLimiter,
  tenantController.deleteTenant
);

// Tenant Settings
router.get(
  '/:id/settings',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantSettingsController.getSettings
);

router.put(
  '/:id/settings',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.updateSettings),
  rateLimiter,
  tenantSettingsController.updateSettings
);

router.patch(
  '/:id/settings/:key',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.updateSetting),
  rateLimiter,
  tenantSettingsController.updateSetting
);

// Tenant Billing
router.get(
  '/:id/billing',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantBillingController.getBilling
);

router.put(
  '/:id/billing',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.updateBilling),
  rateLimiter,
  tenantBillingController.updateBilling
);

router.post(
  '/:id/billing/payments',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.recordPayment),
  rateLimiter,
  tenantBillingController.recordPayment
);

router.get(
  '/:id/billing/history',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.getBillingHistory),
  rateLimiter,
  tenantBillingController.getBillingHistory
);

router.get(
  '/:id/billing/metrics',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  validate(tenantValidation.getBillingMetrics),
  rateLimiter,
  tenantBillingController.getBillingMetrics
);

module.exports = router;
