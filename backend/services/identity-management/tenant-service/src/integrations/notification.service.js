// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\notification.service.js

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.client = axios.create({
      baseURL: config.notification.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.notification.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async sendSubscriptionNotification(notificationData) {
    try {
      const { type, tenantId, subscription } = notificationData;

      const templates = {
        SUBSCRIPTION_CREATED: {
          template: 'subscription-created',
          subject: 'Subscription Created Successfully'
        },
        SUBSCRIPTION_UPDATED: {
          template: 'subscription-updated',
          subject: 'Subscription Updated'
        },
        SUBSCRIPTION_CANCELLED: {
          template: 'subscription-cancelled',
          subject: 'Subscription Cancelled'
        },
        SUBSCRIPTION_RENEWAL: {
          template: 'subscription-renewal',
          subject: 'Subscription Renewed'
        },
        PAYMENT_FAILED: {
          template: 'payment-failed',
          subject: 'Subscription Payment Failed'
        }
      };

      const templateInfo = templates[type];
      if (!templateInfo) {
        logger.warn(`Unknown notification type: ${type}`);
        return;
      }

      await this.client.post('/notifications', {
        tenantId,
        template: templateInfo.template,
        subject: templateInfo.subject,
        data: {
          subscription,
          timestamp: new Date().toISOString()
        }
      });

      logger.info(`Notification sent successfully: ${type}`);
    } catch (error) {
      logger.error('Failed to send notification:', error);
      // Don't throw error as notification failure shouldn't break the main flow
    }
  }

  async sendPaymentNotification(paymentData) {
    try {
      const { type, tenantId, payment } = paymentData;

      await this.client.post('/notifications/payment', {
        tenantId,
        type,
        payment
      });

      logger.info(`Payment notification sent successfully: ${type}`);
    } catch (error) {
      logger.error('Failed to send payment notification:', error);
    }
  }
}

module.exports = { NotificationService };
