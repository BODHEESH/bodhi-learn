// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\usage-tracking.service.js

const { Subscription, Tenant } = require('../models');
const { CustomError } = require('../utils/errors');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const { redis } = require('../database/redis');

class UsageTrackingService {
  constructor() {
    this.USAGE_KEY_PREFIX = 'tenant_usage:';
    this.CACHE_TTL = 3600; // 1 hour
  }

  async trackResourceUsage(tenantId, resourceType, usage) {
    try {
      const key = `${this.USAGE_KEY_PREFIX}${tenantId}:${resourceType}`;
      const currentUsage = await this.getCurrentUsage(tenantId, resourceType);
      const newUsage = currentUsage + usage;

      // Check if usage is within limits
      await this.validateUsageLimit(tenantId, resourceType, newUsage);

      // Update usage in Redis
      await redis.set(key, newUsage);
      
      // Update metrics
      metrics.resourceUsage.inc({
        tenant: tenantId,
        resource: resourceType,
        amount: usage
      });

      return newUsage;
    } catch (error) {
      logger.error('Error tracking resource usage:', error);
      throw error;
    }
  }

  async getCurrentUsage(tenantId, resourceType) {
    const key = `${this.USAGE_KEY_PREFIX}${tenantId}:${resourceType}`;
    const usage = await redis.get(key);
    return usage ? parseFloat(usage) : 0;
  }

  async validateUsageLimit(tenantId, resourceType, newUsage) {
    const subscription = await Subscription.findOne({
      where: { tenantId, status: 'ACTIVE' }
    });

    if (!subscription) {
      throw new CustomError('SUBSCRIPTION_NOT_FOUND', 'No active subscription found');
    }

    let limit;
    switch (resourceType) {
      case 'storage':
        limit = subscription.storageLimit;
        break;
      case 'users':
        limit = subscription.userLimit;
        break;
      // Add more resource types as needed
    }

    if (limit && newUsage > limit) {
      throw new CustomError('USAGE_LIMIT_EXCEEDED', 
        `Usage limit exceeded for ${resourceType}. Limit: ${limit}, Current: ${newUsage}`);
    }
  }

  async getUsageReport(tenantId) {
    try {
      const subscription = await Subscription.findOne({
        where: { tenantId, status: 'ACTIVE' }
      });

      if (!subscription) {
        throw new CustomError('SUBSCRIPTION_NOT_FOUND', 'No active subscription found');
      }

      const storageUsage = await this.getCurrentUsage(tenantId, 'storage');
      const userUsage = await this.getCurrentUsage(tenantId, 'users');

      return {
        tenant: tenantId,
        plan: subscription.planType,
        usage: {
          storage: {
            used: storageUsage,
            limit: subscription.storageLimit,
            percentage: subscription.storageLimit ? 
              (storageUsage / subscription.storageLimit) * 100 : null
          },
          users: {
            used: userUsage,
            limit: subscription.userLimit,
            percentage: subscription.userLimit ? 
              (userUsage / subscription.userLimit) * 100 : null
          }
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error generating usage report:', error);
      throw error;
    }
  }

  async generateAlerts(tenantId) {
    try {
      const report = await this.getUsageReport(tenantId);
      const alerts = [];

      // Check storage usage
      if (report.usage.storage.percentage) {
        if (report.usage.storage.percentage >= 90) {
          alerts.push({
            type: 'CRITICAL',
            resource: 'storage',
            message: 'Storage usage is above 90%'
          });
        } else if (report.usage.storage.percentage >= 80) {
          alerts.push({
            type: 'WARNING',
            resource: 'storage',
            message: 'Storage usage is above 80%'
          });
        }
      }

      // Check user usage
      if (report.usage.users.percentage) {
        if (report.usage.users.percentage >= 90) {
          alerts.push({
            type: 'CRITICAL',
            resource: 'users',
            message: 'User limit usage is above 90%'
          });
        } else if (report.usage.users.percentage >= 80) {
          alerts.push({
            type: 'WARNING',
            resource: 'users',
            message: 'User limit usage is above 80%'
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Error generating alerts:', error);
      throw error;
    }
  }
}

module.exports = new UsageTrackingService();
