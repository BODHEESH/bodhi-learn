// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\tenant-settings.service.js

const { TenantSettings } = require('../../models');
const { redis } = require('./redis.service');
const { messageQueue } = require('../utils/message-queue');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

class TenantSettingsService {
  constructor() {
    this.cacheKeyPrefix = 'tenant:settings:';
    this.cacheTTL = 3600; // 1 hour
  }

  // Get tenant settings
  async getTenantSettings(tenantId) {
    try {
      // Check cache first
      const cachedSettings = await this.getCachedSettings(tenantId);
      if (cachedSettings) {
        metrics.settingsCacheHits.inc();
        return cachedSettings;
      }

      const settings = await TenantSettings.findOne({
        where: { tenantId }
      });

      if (settings) {
        await this.cacheSettings(settings);
      }

      return settings;
    } catch (error) {
      logger.error('Settings retrieval failed:', error);
      metrics.settingsErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  // Update tenant settings
  async updateTenantSettings(tenantId, data, userId) {
    try {
      let settings = await this.getTenantSettings(tenantId);
      
      if (!settings) {
        settings = await TenantSettings.create({
          tenantId,
          ...data,
          createdBy: userId
        });
      } else {
        settings = await settings.update({
          ...data,
          updatedBy: userId
        });
      }

      // Update cache
      await this.cacheSettings(settings);

      // Publish settings update event
      await messageQueue.publish('tenant.events', 'tenant.settings.updated', {
        tenantId,
        updates: data
      });

      metrics.settingsUpdated.inc();

      return settings;
    } catch (error) {
      logger.error('Settings update failed:', error);
      metrics.settingsErrors.inc({ type: 'update' });
      throw error;
    }
  }

  // Update specific setting
  async updateSetting(tenantId, key, value, userId) {
    try {
      const settings = await this.getTenantSettings(tenantId);
      if (!settings) {
        throw new Error('Settings not found');
      }

      await settings.updateSetting(key, value);
      settings.updatedBy = userId;
      await settings.save();

      // Update cache
      await this.cacheSettings(settings);

      // Publish setting update event
      await messageQueue.publish('tenant.events', 'tenant.setting.updated', {
        tenantId,
        key,
        value
      });

      metrics.settingUpdated.inc({ key });

      return settings;
    } catch (error) {
      logger.error('Setting update failed:', error);
      metrics.settingsErrors.inc({ type: 'setting_update' });
      throw error;
    }
  }

  // Update theme settings
  async updateTheme(tenantId, themeData, userId) {
    try {
      const settings = await this.getTenantSettings(tenantId);
      if (!settings) {
        throw new Error('Settings not found');
      }

      settings.theme = {
        ...settings.theme,
        ...themeData
      };
      settings.updatedBy = userId;
      await settings.save();

      // Update cache
      await this.cacheSettings(settings);

      // Publish theme update event
      await messageQueue.publish('tenant.events', 'tenant.theme.updated', {
        tenantId,
        theme: themeData
      });

      metrics.themeUpdated.inc();

      return settings;
    } catch (error) {
      logger.error('Theme update failed:', error);
      metrics.settingsErrors.inc({ type: 'theme_update' });
      throw error;
    }
  }

  // Update security settings
  async updateSecurity(tenantId, securityData, userId) {
    try {
      const settings = await this.getTenantSettings(tenantId);
      if (!settings) {
        throw new Error('Settings not found');
      }

      settings.security = {
        ...settings.security,
        ...securityData
      };
      settings.updatedBy = userId;
      await settings.save();

      // Update cache
      await this.cacheSettings(settings);

      // Publish security update event
      await messageQueue.publish('tenant.events', 'tenant.security.updated', {
        tenantId,
        security: securityData
      });

      metrics.securityUpdated.inc();

      return settings;
    } catch (error) {
      logger.error('Security update failed:', error);
      metrics.settingsErrors.inc({ type: 'security_update' });
      throw error;
    }
  }

  // Cache management
  async cacheSettings(settings) {
    try {
      const key = this.getCacheKey(settings.tenantId);
      await redis.set(key, JSON.stringify(settings), 'EX', this.cacheTTL);
    } catch (error) {
      logger.error('Settings caching failed:', error);
    }
  }

  async getCachedSettings(tenantId) {
    try {
      const key = this.getCacheKey(tenantId);
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Settings cache retrieval failed:', error);
      return null;
    }
  }

  async removeSettingsFromCache(tenantId) {
    try {
      const key = this.getCacheKey(tenantId);
      await redis.del(key);
    } catch (error) {
      logger.error('Settings cache removal failed:', error);
    }
  }

  getCacheKey(tenantId) {
    return `${this.cacheKeyPrefix}${tenantId}`;
  }
}

module.exports = new TenantSettingsService();
