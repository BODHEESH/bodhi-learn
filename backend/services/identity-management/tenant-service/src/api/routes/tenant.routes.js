// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\routes\tenant.routes.js

const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenant.controller');
const tenantSettingsController = require('../controllers/tenant-settings.controller');
const tenantBillingController = require('../controllers/tenant-billing.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { validateTenantAccess } = require('../../middleware/tenant-access');
const { rateLimiter } = require('../../middleware/rate-limiter');

// Tenant routes
router.post(
  '/',
  authenticate,
  authorize(['admin']),
  rateLimiter,
  tenantController.createTenant
);

router.get(
  '/',
  authenticate,
  authorize(['admin']),
  rateLimiter,
  tenantController.listTenants
);

router.get(
  '/:id',
  authenticate,
  validateTenantAccess,
  rateLimiter,
  tenantController.getTenant
);

router.put(
  '/:id',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantController.updateTenant
);

router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  rateLimiter,
  tenantController.deleteTenant
);

router.get(
  '/:id/metrics',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantController.getTenantMetrics
);

// Tenant Settings routes
router.get(
  '/:tenantId/settings',
  authenticate,
  validateTenantAccess,
  rateLimiter,
  tenantSettingsController.getSettings
);

router.put(
  '/:tenantId/settings',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantSettingsController.updateSettings
);

router.patch(
  '/:tenantId/settings/:key',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantSettingsController.updateSetting
);

router.put(
  '/:tenantId/settings/theme',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantSettingsController.updateTheme
);

router.put(
  '/:tenantId/settings/security',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantSettingsController.updateSecurity
);

// Tenant Billing routes
router.get(
  '/:tenantId/billing',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantBillingController.getBilling
);

router.put(
  '/:tenantId/billing',
  authenticate,
  validateTenantAccess,
  authorize(['admin']),
  rateLimiter,
  tenantBillingController.updateBilling
);

router.patch(
  '/:tenantId/billing/status',
  authenticate,
  authorize(['admin']),
  rateLimiter,
  tenantBillingController.updateBillingStatus
);

router.post(
  '/:tenantId/billing/payments',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantBillingController.recordPayment
);

router.get(
  '/:tenantId/billing/history',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantBillingController.getBillingHistory
);

router.get(
  '/:tenantId/billing/metrics',
  authenticate,
  validateTenantAccess,
  authorize(['admin', 'tenant_admin']),
  rateLimiter,
  tenantBillingController.getBillingMetrics
);

module.exports = router;
