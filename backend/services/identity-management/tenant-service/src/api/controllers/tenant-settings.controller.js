// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\controllers\tenant-settings.controller.js

const tenantSettingsService = require('../../services/tenant-settings.service');
const { validateSettings } = require('../../validators/tenant-settings.validator');
const { ApiError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const { metrics } = require('../../utils/metrics');

class TenantSettingsController {
  // Get tenant settings
  async getSettings(req, res, next) {
    try {
      const settings = await tenantSettingsService.getTenantSettings(req.params.tenantId);
      
      if (!settings) {
        throw new ApiError(404, 'Settings not found');
      }

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/settings', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/settings', method: 'GET' });
      next(error);
    }
  }

  // Update tenant settings
  async updateSettings(req, res, next) {
    try {
      const { error } = validateSettings(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const settings = await tenantSettingsService.updateTenantSettings(
        req.params.tenantId,
        req.body,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/settings', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/settings', method: 'PUT' });
      next(error);
    }
  }

  // Update specific setting
  async updateSetting(req, res, next) {
    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        throw new ApiError(400, 'Key and value are required');
      }

      const settings = await tenantSettingsService.updateSetting(
        req.params.tenantId,
        key,
        value,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/settings/key', method: 'PATCH', status: 200 });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/settings/key', method: 'PATCH' });
      next(error);
    }
  }

  // Update theme settings
  async updateTheme(req, res, next) {
    try {
      const settings = await tenantSettingsService.updateTheme(
        req.params.tenantId,
        req.body,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/settings/theme', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/settings/theme', method: 'PUT' });
      next(error);
    }
  }

  // Update security settings
  async updateSecurity(req, res, next) {
    try {
      const settings = await tenantSettingsService.updateSecurity(
        req.params.tenantId,
        req.body,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/settings/security', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/settings/security', method: 'PUT' });
      next(error);
    }
  }
}

module.exports = new TenantSettingsController();
