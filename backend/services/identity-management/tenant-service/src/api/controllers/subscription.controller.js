// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\controllers\subscription.controller.js

const subscriptionService = require('../services/subscription.service');
const { validateSchema } = require('../utils/validator');
const { CustomError } = require('../utils/errors');
const logger = require('../utils/logger');

class SubscriptionController {
  async createSubscription(req, res, next) {
    try {
      const { tenantId } = req.params;
      const planData = req.body;

      // Validate request body
      await validateSchema('createSubscription', planData);

      const subscription = await subscriptionService.createSubscription(tenantId, planData);
      res.status(201).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Create subscription error:', error);
      next(error);
    }
  }

  async updateSubscription(req, res, next) {
    try {
      const { subscriptionId } = req.params;
      const updateData = req.body;

      // Validate request body
      await validateSchema('updateSubscription', updateData);

      const subscription = await subscriptionService.updateSubscription(subscriptionId, updateData);
      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Update subscription error:', error);
      next(error);
    }
  }

  async cancelSubscription(req, res, next) {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;

      const subscription = await subscriptionService.cancelSubscription(subscriptionId, reason);
      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      next(error);
    }
  }

  async getSubscriptionDetails(req, res, next) {
    try {
      const { subscriptionId } = req.params;

      const subscription = await subscriptionService.getSubscriptionDetails(subscriptionId);
      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Get subscription details error:', error);
      next(error);
    }
  }

  async validateFeatureAccess(req, res, next) {
    try {
      const { subscriptionId, feature } = req.params;

      const hasAccess = await subscriptionService.validateFeatureAccess(subscriptionId, feature);
      res.json({
        success: true,
        data: { hasAccess }
      });
    } catch (error) {
      logger.error('Validate feature access error:', error);
      next(error);
    }
  }

  async processRenewal(req, res, next) {
    try {
      const { subscriptionId } = req.params;

      const subscription = await subscriptionService.processRenewal(subscriptionId);
      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Process renewal error:', error);
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
