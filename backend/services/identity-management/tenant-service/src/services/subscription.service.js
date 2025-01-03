// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\subscription.service.js

const { Subscription, SubscriptionHistory, Tenant } = require('../models');
const { PaymentService } = require('../integrations/payment.service');
const { NotificationService } = require('../integrations/notification.service');
const { CustomError } = require('../utils/errors');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');

class SubscriptionService {
  constructor() {
    this.paymentService = new PaymentService();
    this.notificationService = new NotificationService();
  }

  async createSubscription(tenantId, planData) {
    try {
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) {
        throw new CustomError('TENANT_NOT_FOUND', 'Tenant not found');
      }

      // Calculate expiry date based on billing cycle
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(
        expiryDate.getMonth() + (planData.billingCycle === 'YEARLY' ? 12 : 1)
      );

      const subscription = await Subscription.create({
        tenantId,
        planType: planData.planType,
        startDate,
        expiryDate,
        billingCycle: planData.billingCycle,
        price: planData.price,
        currency: planData.currency
      });

      // Create initial payment
      await this.paymentService.createPayment({
        subscriptionId: subscription.id,
        amount: planData.price,
        currency: planData.currency
      });

      // Record history
      await SubscriptionHistory.create({
        subscriptionId: subscription.id,
        changeType: 'PLAN_CHANGE',
        newValue: { planType: planData.planType },
        reason: 'Initial subscription'
      });

      // Notify relevant parties
      await this.notificationService.sendSubscriptionNotification({
        type: 'SUBSCRIPTION_CREATED',
        tenantId,
        subscription: subscription.toJSON()
      });

      metrics.subscriptionsCreated.inc({
        plan: planData.planType,
        billingCycle: planData.billingCycle
      });

      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      metrics.subscriptionErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updateData) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new CustomError('SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
      }

      const previousValues = {
        planType: subscription.planType,
        status: subscription.status
      };

      // Handle plan upgrade/downgrade
      if (updateData.planType && updateData.planType !== subscription.planType) {
        await subscription.updatePlan(updateData.planType);
      }

      // Update other fields
      await subscription.update(updateData);

      // Record history
      await SubscriptionHistory.create({
        subscriptionId,
        changeType: 'PLAN_CHANGE',
        previousValue: previousValues,
        newValue: updateData,
        reason: updateData.reason
      });

      // Notify about changes
      await this.notificationService.sendSubscriptionNotification({
        type: 'SUBSCRIPTION_UPDATED',
        tenantId: subscription.tenantId,
        subscription: subscription.toJSON()
      });

      return subscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      metrics.subscriptionErrors.inc({ type: 'update' });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId, reason) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new CustomError('SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
      }

      const previousStatus = subscription.status;
      await subscription.update({
        status: 'CANCELLED',
        autoRenew: false
      });

      // Record history
      await SubscriptionHistory.create({
        subscriptionId,
        changeType: 'CANCELLATION',
        previousValue: { status: previousStatus },
        newValue: { status: 'CANCELLED' },
        reason
      });

      // Cancel any pending payments
      await this.paymentService.cancelPendingPayments(subscriptionId);

      // Notify about cancellation
      await this.notificationService.sendSubscriptionNotification({
        type: 'SUBSCRIPTION_CANCELLED',
        tenantId: subscription.tenantId,
        subscription: subscription.toJSON()
      });

      metrics.subscriptionCancellations.inc({
        plan: subscription.planType
      });

      return subscription;
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      metrics.subscriptionErrors.inc({ type: 'cancellation' });
      throw error;
    }
  }

  async processRenewal(subscriptionId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription || !subscription.autoRenew) {
        return;
      }

      // Attempt payment
      const paymentResult = await this.paymentService.processRenewalPayment({
        subscriptionId,
        amount: subscription.price,
        currency: subscription.currency
      });

      if (paymentResult.success) {
        // Update subscription dates
        const newExpiryDate = new Date(subscription.expiryDate);
        newExpiryDate.setMonth(
          newExpiryDate.getMonth() + (subscription.billingCycle === 'YEARLY' ? 12 : 1)
        );

        await subscription.update({
          expiryDate: newExpiryDate,
          lastBillingDate: new Date(),
          nextBillingDate: newExpiryDate,
          paymentStatus: 'PAID'
        });

        // Record history
        await SubscriptionHistory.create({
          subscriptionId,
          changeType: 'RENEWAL',
          newValue: { expiryDate: newExpiryDate },
          metadata: { paymentId: paymentResult.paymentId }
        });

        metrics.subscriptionRenewals.inc({
          plan: subscription.planType,
          status: 'success'
        });
      } else {
        await subscription.update({ paymentStatus: 'FAILED' });
        metrics.subscriptionRenewals.inc({
          plan: subscription.planType,
          status: 'failed'
        });
      }

      return subscription;
    } catch (error) {
      logger.error('Error processing renewal:', error);
      metrics.subscriptionErrors.inc({ type: 'renewal' });
      throw error;
    }
  }

  async getSubscriptionDetails(subscriptionId) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId, {
        include: [{
          model: SubscriptionHistory,
          as: 'history',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }]
      });

      if (!subscription) {
        throw new CustomError('SUBSCRIPTION_NOT_FOUND', 'Subscription not found');
      }

      return subscription;
    } catch (error) {
      logger.error('Error fetching subscription details:', error);
      metrics.subscriptionErrors.inc({ type: 'fetch_details' });
      throw error;
    }
  }

  async validateFeatureAccess(subscriptionId, feature) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        return false;
      }

      return subscription.hasFeature(feature);
    } catch (error) {
      logger.error('Error validating feature access:', error);
      metrics.subscriptionErrors.inc({ type: 'feature_validation' });
      return false;
    }
  }
}

module.exports = new SubscriptionService();
