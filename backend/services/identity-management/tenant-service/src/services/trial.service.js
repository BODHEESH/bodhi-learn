// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\trial.service.js

const { Subscription, SubscriptionHistory } = require('../models');
const { NotificationService } = require('../integrations/notification.service');
const { CustomError } = require('../utils/errors');
const logger = require('../utils/logger');

class TrialService {
  constructor() {
    this.notificationService = new NotificationService();
    this.TRIAL_DURATION_DAYS = 14;
    this.REMINDER_DAYS = [7, 3, 1]; // Days before trial expiry to send reminders
  }

  async startTrial(tenantId) {
    try {
      // Check if tenant already had a trial
      const existingTrial = await Subscription.findOne({
        where: {
          tenantId,
          isTrial: true
        }
      });

      if (existingTrial) {
        throw new CustomError('TRIAL_EXISTS', 'Tenant has already used their trial period');
      }

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + this.TRIAL_DURATION_DAYS);

      // Create trial subscription
      const trial = await Subscription.create({
        tenantId,
        planType: 'PREMIUM', // Give access to premium features during trial
        status: 'ACTIVE',
        startDate,
        expiryDate,
        isTrial: true,
        autoRenew: false,
        price: 0,
        currency: 'USD'
      });

      // Record history
      await SubscriptionHistory.create({
        subscriptionId: trial.id,
        changeType: 'TRIAL_START',
        newValue: { startDate, expiryDate },
        reason: 'Trial period started'
      });

      // Schedule trial expiry notification
      await this.scheduleTrialNotifications(trial);

      return trial;
    } catch (error) {
      logger.error('Error starting trial:', error);
      throw error;
    }
  }

  async scheduleTrialNotifications(trial) {
    try {
      const now = new Date();
      const expiryDate = new Date(trial.expiryDate);

      for (const daysBeforeExpiry of this.REMINDER_DAYS) {
        const reminderDate = new Date(expiryDate);
        reminderDate.setDate(reminderDate.getDate() - daysBeforeExpiry);

        if (reminderDate > now) {
          await this.notificationService.sendSubscriptionNotification({
            type: 'TRIAL_REMINDER',
            tenantId: trial.tenantId,
            subscription: {
              ...trial.toJSON(),
              daysRemaining: daysBeforeExpiry
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error scheduling trial notifications:', error);
    }
  }

  async convertTrialToPaid(subscriptionId, planData) {
    try {
      const trial = await Subscription.findOne({
        where: {
          id: subscriptionId,
          isTrial: true,
          status: 'ACTIVE'
        }
      });

      if (!trial) {
        throw new CustomError('TRIAL_NOT_FOUND', 'Active trial subscription not found');
      }

      // Update subscription to paid plan
      await trial.update({
        planType: planData.planType,
        isTrial: false,
        autoRenew: true,
        price: planData.price,
        currency: planData.currency,
        billingCycle: planData.billingCycle
      });

      // Record history
      await SubscriptionHistory.create({
        subscriptionId: trial.id,
        changeType: 'TRIAL_CONVERSION',
        previousValue: { isTrial: true },
        newValue: { 
          isTrial: false,
          planType: planData.planType
        },
        reason: 'Trial converted to paid subscription'
      });

      // Notify about successful conversion
      await this.notificationService.sendSubscriptionNotification({
        type: 'TRIAL_CONVERTED',
        tenantId: trial.tenantId,
        subscription: trial.toJSON()
      });

      return trial;
    } catch (error) {
      logger.error('Error converting trial to paid subscription:', error);
      throw error;
    }
  }

  async handleTrialExpiry(subscriptionId) {
    try {
      const trial = await Subscription.findByPk(subscriptionId);
      
      if (!trial || !trial.isTrial) {
        return;
      }

      await trial.update({
        status: 'EXPIRED'
      });

      // Record history
      await SubscriptionHistory.create({
        subscriptionId: trial.id,
        changeType: 'TRIAL_EXPIRED',
        previousValue: { status: 'ACTIVE' },
        newValue: { status: 'EXPIRED' },
        reason: 'Trial period expired'
      });

      // Send final notification
      await this.notificationService.sendSubscriptionNotification({
        type: 'TRIAL_EXPIRED',
        tenantId: trial.tenantId,
        subscription: trial.toJSON()
      });

    } catch (error) {
      logger.error('Error handling trial expiry:', error);
      throw error;
    }
  }
}

module.exports = new TrialService();
