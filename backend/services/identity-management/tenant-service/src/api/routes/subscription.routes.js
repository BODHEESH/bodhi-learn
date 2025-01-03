// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\subscription.routes.js

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenant');

// Create new subscription for a tenant
router.post(
  '/tenants/:tenantId/subscriptions',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateTenant,
  subscriptionController.createSubscription
);

// Update subscription
router.put(
  '/subscriptions/:subscriptionId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  subscriptionController.updateSubscription
);

// Cancel subscription
router.post(
  '/subscriptions/:subscriptionId/cancel',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  subscriptionController.cancelSubscription
);

// Get subscription details
router.get(
  '/subscriptions/:subscriptionId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  subscriptionController.getSubscriptionDetails
);

// Validate feature access
router.get(
  '/subscriptions/:subscriptionId/features/:feature',
  authenticate,
  subscriptionController.validateFeatureAccess
);

// Process subscription renewal
router.post(
  '/subscriptions/:subscriptionId/renew',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  subscriptionController.processRenewal
);

module.exports = router;
