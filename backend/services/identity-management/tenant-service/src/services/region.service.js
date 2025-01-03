// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\region.service.js

const { Region, TenantRegion } = require('../models');
const logger = require('../config/logger');
const redis = require('../config/redis');
const config = require('../config/config');

class RegionService {
  constructor() {
    this.cacheKeyPrefix = 'region:';
    this.cacheDuration = 3600; // 1 hour
  }

  /**
   * Get all available regions
   * @returns {Promise<Region[]>}
   */
  async getRegions() {
    try {
      const cacheKey = `${this.cacheKeyPrefix}all`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const regions = await Region.find({ status: 'ACTIVE' });
      await redis.setex(cacheKey, this.cacheDuration, JSON.stringify(regions));
      
      return regions;
    } catch (error) {
      logger.error('Error getting regions:', error);
      throw error;
    }
  }

  /**
   * Get region by ID
   * @param {string} regionId - Region ID
   * @returns {Promise<Region>}
   */
  async getRegionById(regionId) {
    try {
      const cacheKey = `${this.cacheKeyPrefix}${regionId}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const region = await Region.findById(regionId);
      if (region) {
        await redis.setex(cacheKey, this.cacheDuration, JSON.stringify(region));
      }
      
      return region;
    } catch (error) {
      logger.error('Error getting region:', error);
      throw error;
    }
  }

  /**
   * Get tenant regions
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<TenantRegion[]>}
   */
  async getTenantRegions(tenantId) {
    try {
      const tenantRegions = await TenantRegion.find({ tenantId })
        .populate('region');
      return tenantRegions;
    } catch (error) {
      logger.error('Error getting tenant regions:', error);
      throw error;
    }
  }

  /**
   * Add region to tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} regionId - Region ID
   * @returns {Promise<TenantRegion>}
   */
  async addTenantRegion(tenantId, regionId) {
    try {
      const region = await this.getRegionById(regionId);
      if (!region) {
        throw new Error('Region not found');
      }

      const existingRegion = await TenantRegion.findOne({
        tenantId,
        regionId
      });

      if (existingRegion) {
        throw new Error('Region already added to tenant');
      }

      const tenantRegion = await TenantRegion.create({
        tenantId,
        regionId,
        status: 'ACTIVE',
        settings: region.defaultSettings
      });

      // Initialize region-specific resources
      await this.initializeRegionResources(tenantId, regionId);

      return tenantRegion;
    } catch (error) {
      logger.error('Error adding tenant region:', error);
      throw error;
    }
  }

  /**
   * Remove region from tenant
   * @param {string} tenantId - Tenant ID
   * @param {string} regionId - Region ID
   */
  async removeTenantRegion(tenantId, regionId) {
    try {
      const tenantRegion = await TenantRegion.findOne({
        tenantId,
        regionId
      });

      if (!tenantRegion) {
        throw new Error('Region not found for tenant');
      }

      // Cleanup region-specific resources
      await this.cleanupRegionResources(tenantId, regionId);

      await tenantRegion.remove();
    } catch (error) {
      logger.error('Error removing tenant region:', error);
      throw error;
    }
  }

  /**
   * Update tenant region settings
   * @param {string} tenantId - Tenant ID
   * @param {string} regionId - Region ID
   * @param {Object} settings - Region settings
   */
  async updateTenantRegionSettings(tenantId, regionId, settings) {
    try {
      const tenantRegion = await TenantRegion.findOne({
        tenantId,
        regionId
      });

      if (!tenantRegion) {
        throw new Error('Region not found for tenant');
      }

      tenantRegion.settings = {
        ...tenantRegion.settings,
        ...settings
      };

      await tenantRegion.save();
      return tenantRegion;
    } catch (error) {
      logger.error('Error updating tenant region settings:', error);
      throw error;
    }
  }

  /**
   * Initialize region resources for tenant
   * @private
   */
  async initializeRegionResources(tenantId, regionId) {
    try {
      const region = await this.getRegionById(regionId);
      
      // Initialize storage
      if (region.services.includes('storage')) {
        await this.initializeStorage(tenantId, region);
      }

      // Initialize database
      if (region.services.includes('database')) {
        await this.initializeDatabase(tenantId, region);
      }

      // Initialize cache
      if (region.services.includes('cache')) {
        await this.initializeCache(tenantId, region);
      }
    } catch (error) {
      logger.error('Error initializing region resources:', error);
      throw error;
    }
  }

  /**
   * Cleanup region resources for tenant
   * @private
   */
  async cleanupRegionResources(tenantId, regionId) {
    try {
      const region = await this.getRegionById(regionId);
      
      // Cleanup storage
      if (region.services.includes('storage')) {
        await this.cleanupStorage(tenantId, region);
      }

      // Cleanup database
      if (region.services.includes('database')) {
        await this.cleanupDatabase(tenantId, region);
      }

      // Cleanup cache
      if (region.services.includes('cache')) {
        await this.cleanupCache(tenantId, region);
      }
    } catch (error) {
      logger.error('Error cleaning up region resources:', error);
      throw error;
    }
  }

  // Private helper methods for resource management
  async initializeStorage(tenantId, region) {
    // Implementation depends on your storage service (S3, GCS, etc.)
  }

  async initializeDatabase(tenantId, region) {
    // Implementation depends on your database service
  }

  async initializeCache(tenantId, region) {
    // Implementation depends on your cache service (Redis, Memcached, etc.)
  }

  async cleanupStorage(tenantId, region) {
    // Implementation depends on your storage service
  }

  async cleanupDatabase(tenantId, region) {
    // Implementation depends on your database service
  }

  async cleanupCache(tenantId, region) {
    // Implementation depends on your cache service
  }
}

module.exports = new RegionService();
