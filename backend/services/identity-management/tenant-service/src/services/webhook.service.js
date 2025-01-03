// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\webhook.service.js

const axios = require('axios');
const crypto = require('crypto');
const { WebhookEvent } = require('../models');
const logger = require('../config/logger');
const config = require('../config/config');
const queue = require('../config/queue');

class WebhookService {
  constructor() {
    this.webhookSecret = config.webhook.secret;
    this.retryAttempts = config.webhook.retryAttempts || 3;
    this.retryDelay = config.webhook.retryDelay || 5000;
  }

  /**
   * Create webhook signature
   * @param {Object} payload - Event payload
   * @returns {string} Signature
   */
  createSignature(payload) {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature
   * @param {Object} payload - Event payload
   * @returns {boolean}
   */
  verifySignature(signature, payload) {
    const expectedSignature = this.createSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Send webhook event
   * @param {string} tenantId - Tenant ID
   * @param {string} event - Event name
   * @param {Object} payload - Event payload
   */
  async sendWebhook(tenantId, event, payload) {
    try {
      const tenant = await TenantSettings.findOne({ tenantId });
      if (!tenant?.webhookUrl) {
        logger.info(`No webhook URL configured for tenant ${tenantId}`);
        return;
      }

      const webhookEvent = await WebhookEvent.create({
        tenantId,
        event,
        payload,
        status: 'PENDING'
      });

      // Add to queue for processing
      await queue.add('webhook', {
        webhookEventId: webhookEvent.id,
        tenantId,
        event,
        payload,
        attempt: 1
      });

      return webhookEvent;
    } catch (error) {
      logger.error('Error sending webhook:', error);
      throw error;
    }
  }

  /**
   * Process webhook event
   * @param {Object} job - Queue job
   */
  async processWebhook(job) {
    const { webhookEventId, tenantId, event, payload, attempt } = job.data;
    
    try {
      const tenant = await TenantSettings.findOne({ tenantId });
      const signature = this.createSignature(payload);

      const response = await axios.post(tenant.webhookUrl, {
        event,
        payload,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature
        },
        timeout: 5000
      });

      await WebhookEvent.findByIdAndUpdate(webhookEventId, {
        status: 'DELIVERED',
        response: response.data,
        deliveredAt: new Date()
      });

      logger.info(`Webhook ${webhookEventId} delivered successfully`);
    } catch (error) {
      logger.error(`Webhook ${webhookEventId} delivery failed:`, error);

      if (attempt < this.retryAttempts) {
        // Schedule retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await queue.add('webhook', {
          webhookEventId,
          tenantId,
          event,
          payload,
          attempt: attempt + 1
        }, { delay });

        await WebhookEvent.findByIdAndUpdate(webhookEventId, {
          status: 'RETRY_SCHEDULED',
          lastError: error.message
        });
      } else {
        await WebhookEvent.findByIdAndUpdate(webhookEventId, {
          status: 'FAILED',
          lastError: error.message
        });
      }
    }
  }

  /**
   * Get webhook events
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Query filters
   * @returns {Promise<WebhookEvent[]>}
   */
  async getWebhookEvents(tenantId, filters = {}) {
    return WebhookEvent.find({ tenantId, ...filters })
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
  }
}

module.exports = new WebhookService();
