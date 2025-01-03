// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\tenant-billing.service.js

const { TenantBilling } = require('../../models');
const { redis } = require('./redis.service');
const { messageQueue } = require('../utils/message-queue');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

class TenantBillingService {
  constructor() {
    this.cacheKeyPrefix = 'tenant:billing:';
    this.cacheTTL = 3600; // 1 hour
  }

  // Get tenant billing
  async getTenantBilling(tenantId) {
    try {
      // Check cache first
      const cachedBilling = await this.getCachedBilling(tenantId);
      if (cachedBilling) {
        metrics.billingCacheHits.inc();
        return cachedBilling;
      }

      const billing = await TenantBilling.findOne({
        where: { tenantId }
      });

      if (billing) {
        await this.cacheBilling(billing);
      }

      return billing;
    } catch (error) {
      logger.error('Billing retrieval failed:', error);
      metrics.billingErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  // Create billing record
  async createBilling(data, userId) {
    try {
      const billing = await TenantBilling.create({
        ...data,
        createdBy: userId
      });

      // Cache billing data
      await this.cacheBilling(billing);

      // Publish billing creation event
      await messageQueue.publish('tenant.events', 'tenant.billing.created', {
        tenantId: billing.tenantId,
        plan: billing.plan
      });

      metrics.billingCreated.inc({
        plan: billing.plan
      });

      return billing;
    } catch (error) {
      logger.error('Billing creation failed:', error);
      metrics.billingErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  // Update billing
  async updateBilling(tenantId, data, userId) {
    try {
      const billing = await this.getTenantBilling(tenantId);
      if (!billing) {
        throw new Error('Billing record not found');
      }

      const updatedBilling = await billing.update({
        ...data,
        updatedBy: userId
      });

      // Update cache
      await this.cacheBilling(updatedBilling);

      // Publish billing update event
      await messageQueue.publish('tenant.events', 'tenant.billing.updated', {
        tenantId,
        updates: data
      });

      metrics.billingUpdated.inc();

      return updatedBilling;
    } catch (error) {
      logger.error('Billing update failed:', error);
      metrics.billingErrors.inc({ type: 'update' });
      throw error;
    }
  }

  // Update billing status
  async updateBillingStatus(tenantId, status, userId) {
    try {
      const billing = await this.getTenantBilling(tenantId);
      if (!billing) {
        throw new Error('Billing record not found');
      }

      await billing.updateBillingStatus(status);
      billing.updatedBy = userId;
      await billing.save();

      // Update cache
      await this.cacheBilling(billing);

      // Publish billing status update event
      await messageQueue.publish('tenant.events', 'tenant.billing.status.updated', {
        tenantId,
        status
      });

      metrics.billingStatusUpdated.inc({
        status
      });

      return billing;
    } catch (error) {
      logger.error('Billing status update failed:', error);
      metrics.billingErrors.inc({ type: 'status_update' });
      throw error;
    }
  }

  // Record payment
  async recordPayment(tenantId, amount, method, userId) {
    try {
      const billing = await this.getTenantBilling(tenantId);
      if (!billing) {
        throw new Error('Billing record not found');
      }

      await billing.recordPayment(amount, method);
      billing.updatedBy = userId;
      await billing.save();

      // Update cache
      await this.cacheBilling(billing);

      // Publish payment recorded event
      await messageQueue.publish('tenant.events', 'tenant.payment.recorded', {
        tenantId,
        amount,
        method
      });

      metrics.paymentRecorded.inc({
        method,
        amount
      });

      return billing;
    } catch (error) {
      logger.error('Payment recording failed:', error);
      metrics.billingErrors.inc({ type: 'payment_record' });
      throw error;
    }
  }

  // Cache management
  async cacheBilling(billing) {
    try {
      const key = this.getCacheKey(billing.tenantId);
      await redis.set(key, JSON.stringify(billing), 'EX', this.cacheTTL);
    } catch (error) {
      logger.error('Billing caching failed:', error);
    }
  }

  async getCachedBilling(tenantId) {
    try {
      const key = this.getCacheKey(tenantId);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Billing cache retrieval failed:', error);
      return null;
    }
  }

  async removeBillingFromCache(tenantId) {
    try {
      const key = this.getCacheKey(tenantId);
      await redis.del(key);
    } catch (error) {
      logger.error('Billing cache removal failed:', error);
    }
  }

  getCacheKey(tenantId) {
    return `${this.cacheKeyPrefix}${tenantId}`;
  }
}

module.exports = new TenantBillingService();
