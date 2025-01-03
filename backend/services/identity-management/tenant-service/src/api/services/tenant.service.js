// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\tenant.service.js

const { Tenant, TenantSettings, TenantBilling } = require('../../models');
const { redis } = require('./redis.service');
const { messageQueue } = require('../utils/message-queue');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');
const config = require('../../config/app.config');

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
}

module.exports = new TenantService();
