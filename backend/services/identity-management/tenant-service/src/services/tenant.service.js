// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\tenant.service.js

const { Tenant, TenantSettings, TenantBilling, TenantBackup } = require('../models');
const { redis } = require('./redis.service');
const { messageQueue } = require('../utils/message-queue');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const config = require('../config/app.config');
const { storageService } = require('../utils/storage.service');
const { Op } = require('sequelize');

class TenantService {
  constructor() {
    this.cacheKeyPrefix = 'tenant:';
    this.cacheTTL = 3600; // 1 hour
  }

  // Create new tenant
  async createTenant(data, userId) {
    try {
      const tenant = await Tenant.create({
        ...data,
        createdBy: userId
      });

      // Create default settings
      await TenantSettings.create({
        tenantId: tenant.id,
        createdBy: userId
      });

      // Create billing record
      await TenantBilling.create({
        tenantId: tenant.id,
        plan: data.plan || 'FREE',
        createdBy: userId
      });

      // Cache tenant data
      await this.cacheTenant(tenant);

      // Publish tenant creation event
      await messageQueue.publish('tenant.events', 'tenant.created', {
        tenantId: tenant.id,
        name: tenant.name,
        plan: data.plan
      });

      metrics.tenantCreated.inc({
        plan: data.plan || 'FREE'
      });

      return tenant;
    } catch (error) {
      logger.error('Tenant creation failed:', error);
      metrics.tenantErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  // Get tenant by ID
  async getTenantById(id, options = {}) {
    try {
      // Check cache first
      const cachedTenant = await this.getCachedTenant(id);
      if (cachedTenant && !options.skipCache) {
        metrics.tenantCacheHits.inc();
        return cachedTenant;
      }

      const tenant = await Tenant.findByPk(id, {
        include: options.include || [],
        ...options
      });

      if (tenant) {
        await this.cacheTenant(tenant);
      }

      return tenant;
    } catch (error) {
      logger.error('Tenant retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  // Update tenant
  async updateTenant(id, data, userId) {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const updatedTenant = await tenant.update({
        ...data,
        updatedBy: userId
      });

      // Update cache
      await this.cacheTenant(updatedTenant);

      // Publish tenant update event
      await messageQueue.publish('tenant.events', 'tenant.updated', {
        tenantId: tenant.id,
        updates: data
      });

      metrics.tenantUpdated.inc();

      return updatedTenant;
    } catch (error) {
      logger.error('Tenant update failed:', error);
      metrics.tenantErrors.inc({ type: 'update' });
      throw error;
    }
  }

  // Delete tenant
  async deleteTenant(id, userId) {
    try {
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Soft delete tenant and related records
      await tenant.update({
        status: 'DELETED',
        updatedBy: userId
      });
      await tenant.destroy();

      // Remove from cache
      await this.removeTenantFromCache(id);

      // Publish tenant deletion event
      await messageQueue.publish('tenant.events', 'tenant.deleted', {
        tenantId: tenant.id
      });

      metrics.tenantDeleted.inc();

      return true;
    } catch (error) {
      logger.error('Tenant deletion failed:', error);
      metrics.tenantErrors.inc({ type: 'deletion' });
      throw error;
    }
  }

  // List tenants with pagination
  async listTenants(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = options;

      const query = {
        where: {},
        order: [[sortBy, sortOrder]],
        limit,
        offset: (page - 1) * limit
      };

      if (status) {
        query.where.status = status;
      }

      if (type) {
        query.where.type = type;
      }

      if (search) {
        query.where = {
          ...query.where,
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { slug: { [Op.iLike]: `%${search}%` } }
          ]
        };
      }

      const { count, rows } = await Tenant.findAndCountAll(query);

      return {
        tenants: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Tenant listing failed:', error);
      metrics.tenantErrors.inc({ type: 'listing' });
      throw error;
    }
  }

  // Tenant Plan Management
  async upgradePlan(tenantId, newPlan, userId) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const billing = await TenantBilling.findOne({ where: { tenantId } });
      const oldPlan = billing.plan;

      // Update billing information
      await billing.update({
        plan: newPlan,
        updatedBy: userId,
        lastPlanChangeDate: new Date()
      });

      // Update tenant features based on new plan
      await this.updateTenantFeatures(tenant, newPlan);

      // Publish plan change event
      await messageQueue.publish('tenant.events', 'tenant.plan_changed', {
        tenantId,
        oldPlan,
        newPlan,
        userId
      });

      metrics.tenantPlanChanged.inc({
        from: oldPlan,
        to: newPlan
      });

      return billing;
    } catch (error) {
      logger.error('Plan upgrade failed:', error);
      metrics.tenantErrors.inc({ type: 'plan_upgrade' });
      throw error;
    }
  }

  // Tenant Usage Tracking
  async trackResourceUsage(tenantId, resourceType, usage) {
    try {
      const cacheKey = `${this.cacheKeyPrefix}usage:${tenantId}:${resourceType}`;
      const currentUsage = parseInt(await redis.get(cacheKey)) || 0;
      const newUsage = currentUsage + usage;

      await redis.set(cacheKey, newUsage);

      metrics.tenantResourceUsage.inc({
        resourceType,
        usage
      });

      // Check if usage exceeds limits
      await this.checkResourceLimits(tenantId, resourceType, newUsage);

      return newUsage;
    } catch (error) {
      logger.error('Resource usage tracking failed:', error);
      metrics.tenantErrors.inc({ type: 'usage_tracking' });
      throw error;
    }
  }

  // Resource Limits Management
  async checkResourceLimits(tenantId, resourceType, currentUsage) {
    try {
      const tenant = await this.getTenantById(tenantId);
      const billing = await TenantBilling.findOne({ where: { tenantId } });
      const limits = config.plans[billing.plan].limits;

      if (currentUsage > limits[resourceType]) {
        // Publish limit exceeded event
        await messageQueue.publish('tenant.events', 'tenant.limit_exceeded', {
          tenantId,
          resourceType,
          currentUsage,
          limit: limits[resourceType]
        });

        metrics.tenantLimitExceeded.inc({
          resourceType,
          plan: billing.plan
        });
      }
    } catch (error) {
      logger.error('Resource limit check failed:', error);
      metrics.tenantErrors.inc({ type: 'limit_check' });
      throw error;
    }
  }

  // Tenant Analytics
  async getTenantAnalytics(tenantId, period = '30d') {
    try {
      const analytics = {
        userCount: await this.getUserCount(tenantId),
        resourceUsage: await this.getResourceUsage(tenantId),
        activityMetrics: await this.getActivityMetrics(tenantId, period),
        billingMetrics: await this.getBillingMetrics(tenantId)
      };

      metrics.tenantAnalyticsRequested.inc({
        period
      });

      return analytics;
    } catch (error) {
      logger.error('Analytics retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'analytics' });
      throw error;
    }
  }

  // Tenant Health Check
  async checkTenantHealth(tenantId) {
    try {
      const tenant = await this.getTenantById(tenantId);
      const billing = await TenantBilling.findOne({ where: { tenantId } });
      
      const health = {
        status: tenant.status,
        billingStatus: billing.status,
        resourceUtilization: await this.getResourceUtilization(tenantId),
        lastActivityAt: tenant.lastActivityAt,
        warningFlags: await this.getWarningFlags(tenantId)
      };

      metrics.tenantHealthChecked.inc({
        status: tenant.status
      });

      return health;
    } catch (error) {
      logger.error('Health check failed:', error);
      metrics.tenantErrors.inc({ type: 'health_check' });
      throw error;
    }
  }

  // Tenant Data Export
  async exportTenantData(tenantId, options = {}) {
    try {
      const tenant = await this.getTenantById(tenantId, {
        include: ['settings', 'billing']
      });

      const data = {
        tenant: tenant.toJSON(),
        users: await this.getTenantUsers(tenantId),
        resources: await this.getTenantResources(tenantId),
        analytics: options.includeAnalytics ? 
          await this.getTenantAnalytics(tenantId) : undefined
      };

      metrics.tenantDataExported.inc();

      return data;
    } catch (error) {
      logger.error('Data export failed:', error);
      metrics.tenantErrors.inc({ type: 'data_export' });
      throw error;
    }
  }

  // Tenant Backup
  async createTenantBackup(tenantId) {
    try {
      const data = await this.exportTenantData(tenantId, { includeAnalytics: true });
      const backupId = `backup_${tenantId}_${Date.now()}`;
      
      // Store backup in configured storage
      await storageService.store(backupId, JSON.stringify(data));

      // Record backup metadata
      await TenantBackup.create({
        tenantId,
        backupId,
        size: JSON.stringify(data).length,
        status: 'COMPLETED'
      });

      metrics.tenantBackupCreated.inc();

      return backupId;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      metrics.tenantErrors.inc({ type: 'backup' });
      throw error;
    }
  }

  // Tenant Restore
  async restoreTenantFromBackup(tenantId, backupId) {
    try {
      // Validate backup exists
      const backup = await TenantBackup.findOne({
        where: { tenantId, backupId }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Retrieve backup data
      const data = JSON.parse(
        await storageService.retrieve(backupId)
      );

      // Perform restore operations
      await this.performRestore(tenantId, data);

      metrics.tenantRestored.inc();

      return true;
    } catch (error) {
      logger.error('Restore failed:', error);
      metrics.tenantErrors.inc({ type: 'restore' });
      throw error;
    }
  }

  // Cache management
  async cacheTenant(tenant) {
    try {
      const key = this.getCacheKey(tenant.id);
      await redis.set(key, JSON.stringify(tenant), 'EX', this.cacheTTL);
    } catch (error) {
      logger.error('Tenant caching failed:', error);
    }
  }

  async getCachedTenant(id) {
    try {
      const key = this.getCacheKey(id);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Tenant cache retrieval failed:', error);
      return null;
    }
  }

  async removeTenantFromCache(id) {
    try {
      const key = this.getCacheKey(id);
      await redis.del(key);
    } catch (error) {
      logger.error('Tenant cache removal failed:', error);
    }
  }

  getCacheKey(id) {
    return `${this.cacheKeyPrefix}${id}`;
  }

  // Helper methods
  async updateTenantFeatures(tenant, newPlan) {
    try {
      const planFeatures = config.plans[newPlan].features;
      
      // Update tenant features
      await tenant.update({
        features: planFeatures,
        updatedAt: new Date()
      });

      // Update tenant settings
      const settings = await TenantSettings.findOne({ where: { tenantId: tenant.id } });
      await settings.update({
        features: {
          ...settings.features,
          ...planFeatures
        }
      });

      metrics.tenantFeaturesUpdated.inc({
        plan: newPlan
      });

      return true;
    } catch (error) {
      logger.error('Feature update failed:', error);
      metrics.tenantErrors.inc({ type: 'feature_update' });
      throw error;
    }
  }

  async getUserCount(tenantId) {
    try {
      const count = await this.userService.countUsers({ tenantId });
      
      metrics.tenantMetricsRequested.inc({
        metric: 'user_count'
      });

      return count;
    } catch (error) {
      logger.error('User count retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'user_count' });
      throw error;
    }
  }

  async getResourceUsage(tenantId) {
    try {
      const cacheKeys = await redis.keys(`${this.cacheKeyPrefix}usage:${tenantId}:*`);
      const usage = {};

      for (const key of cacheKeys) {
        const resourceType = key.split(':')[3];
        usage[resourceType] = parseInt(await redis.get(key)) || 0;
      }

      metrics.tenantMetricsRequested.inc({
        metric: 'resource_usage'
      });

      return usage;
    } catch (error) {
      logger.error('Resource usage retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'resource_usage' });
      throw error;
    }
  }

  async getActivityMetrics(tenantId, period) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate - this.getPeriodInMilliseconds(period));

      const metrics = {
        logins: await this.getLoginCount(tenantId, startDate, endDate),
        apiCalls: await this.getApiCallCount(tenantId, startDate, endDate),
        resourceAccess: await this.getResourceAccessCount(tenantId, startDate, endDate),
        errorCount: await this.getErrorCount(tenantId, startDate, endDate)
      };

      return metrics;
    } catch (error) {
      logger.error('Activity metrics retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'activity_metrics' });
      throw error;
    }
  }

  async getBillingMetrics(tenantId) {
    try {
      const billing = await TenantBilling.findOne({ where: { tenantId } });
      
      return {
        currentPlan: billing.plan,
        billingCycle: billing.billingCycle,
        currentUsage: await this.getResourceUsage(tenantId),
        lastPayment: {
          amount: billing.lastPaymentAmount,
          date: billing.lastPaymentDate,
          method: billing.lastPaymentMethod
        },
        nextBillingDate: billing.nextBillingDate,
        outstandingBalance: billing.outstandingBalance
      };
    } catch (error) {
      logger.error('Billing metrics retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'billing_metrics' });
      throw error;
    }
  }

  async getResourceUtilization(tenantId) {
    try {
      const usage = await this.getResourceUsage(tenantId);
      const billing = await TenantBilling.findOne({ where: { tenantId } });
      const limits = config.plans[billing.plan].limits;
      
      const utilization = {};
      for (const [resource, used] of Object.entries(usage)) {
        utilization[resource] = {
          used,
          limit: limits[resource],
          percentage: (used / limits[resource]) * 100
        };
      }

      return utilization;
    } catch (error) {
      logger.error('Resource utilization retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'resource_utilization' });
      throw error;
    }
  }

  async getWarningFlags(tenantId) {
    try {
      const warnings = [];
      const tenant = await this.getTenantById(tenantId);
      const billing = await TenantBilling.findOne({ where: { tenantId } });
      const utilization = await this.getResourceUtilization(tenantId);

      // Check billing status
      if (billing.status !== 'ACTIVE') {
        warnings.push({
          type: 'BILLING',
          severity: 'HIGH',
          message: `Billing status is ${billing.status}`
        });
      }

      // Check resource utilization
      for (const [resource, data] of Object.entries(utilization)) {
        if (data.percentage >= 90) {
          warnings.push({
            type: 'RESOURCE_LIMIT',
            severity: 'HIGH',
            message: `${resource} usage at ${data.percentage.toFixed(1)}%`
          });
        }
      }

      // Check activity
      if (tenant.lastActivityAt && 
          new Date() - new Date(tenant.lastActivityAt) > 30 * 24 * 60 * 60 * 1000) {
        warnings.push({
          type: 'INACTIVITY',
          severity: 'MEDIUM',
          message: 'No activity in the last 30 days'
        });
      }

      return warnings;
    } catch (error) {
      logger.error('Warning flags retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'warning_flags' });
      throw error;
    }
  }

  async getTenantUsers(tenantId) {
    try {
      const users = await this.userService.findUsers({ tenantId });
      return users.map(user => ({
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        lastLoginAt: user.lastLoginAt
      }));
    } catch (error) {
      logger.error('User retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'user_retrieval' });
      throw error;
    }
  }

  async getTenantResources(tenantId) {
    try {
      const resources = [];
      
      // Get storage resources
      const storageFiles = await storageService.list(`tenant_${tenantId}/`);
      resources.push(...storageFiles.map(file => ({
        type: 'STORAGE',
        ...file
      })));

      // Get database resources
      const dbResources = await this.getDatabaseResources(tenantId);
      resources.push(...dbResources.map(resource => ({
        type: 'DATABASE',
        ...resource
      })));

      return resources;
    } catch (error) {
      logger.error('Resource retrieval failed:', error);
      metrics.tenantErrors.inc({ type: 'resource_retrieval' });
      throw error;
    }
  }

  async performRestore(tenantId, data) {
    const transaction = await sequelize.transaction();
    
    try {
      // Restore tenant data
      await Tenant.update(data.tenant, {
        where: { id: tenantId },
        transaction
      });

      // Restore settings
      await TenantSettings.update(data.tenant.settings, {
        where: { tenantId },
        transaction
      });

      // Restore billing
      await TenantBilling.update(data.tenant.billing, {
        where: { tenantId },
        transaction
      });

      // Restore users if included
      if (data.users) {
        await this.userService.restoreUsers(tenantId, data.users, transaction);
      }

      // Restore resources if included
      if (data.resources) {
        await this.restoreResources(tenantId, data.resources, transaction);
      }

      await transaction.commit();
      
      // Clear cache
      await this.clearTenantCache(tenantId);

      metrics.tenantRestoreCompleted.inc();

      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Restore operation failed:', error);
      metrics.tenantErrors.inc({ type: 'restore_operation' });
      throw error;
    }
  }

  // Private helper methods
  getPeriodInMilliseconds(period) {
    const units = {
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'm': 30 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };
    const value = parseInt(period);
    const unit = period.slice(-1);
    return value * (units[unit] || units.d);
  }

  async getLoginCount(tenantId, startDate, endDate) {
    // Implementation depends on your authentication service
    return await this.authService.getLoginCount(tenantId, startDate, endDate);
  }

  async getApiCallCount(tenantId, startDate, endDate) {
    // Implementation depends on your API gateway or logging service
    return await this.apiGateway.getCallCount(tenantId, startDate, endDate);
  }

  async getResourceAccessCount(tenantId, startDate, endDate) {
    // Implementation depends on your resource access logging
    return await this.accessLogger.getAccessCount(tenantId, startDate, endDate);
  }

  async getErrorCount(tenantId, startDate, endDate) {
    // Implementation depends on your error tracking service
    return await this.errorTracker.getErrorCount(tenantId, startDate, endDate);
  }

  async getDatabaseResources(tenantId) {
    // Implementation depends on your database structure
    const tables = ['users', 'profiles', 'settings', 'documents'];
    const resources = [];

    for (const table of tables) {
      const count = await sequelize.models[table].count({
        where: { tenantId }
      });
      resources.push({
        name: table,
        count,
        size: await this.getTableSize(table, tenantId)
      });
    }

    return resources;
  }

  async getTableSize(table, tenantId) {
    // This is a PostgreSQL-specific implementation
    const result = await sequelize.query(
      `SELECT pg_total_relation_size('"${table}"') as size 
       WHERE EXISTS (
         SELECT 1 FROM "${table}" 
         WHERE "tenantId" = :tenantId 
         LIMIT 1
       )`,
      {
        replacements: { tenantId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    return result[0]?.size || 0;
  }

  async clearTenantCache(tenantId) {
    const keys = await redis.keys(`${this.cacheKeyPrefix}*${tenantId}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}

module.exports = new TenantService();
