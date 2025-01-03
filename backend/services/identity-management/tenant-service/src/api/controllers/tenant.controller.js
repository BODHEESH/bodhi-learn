// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\controllers\tenant.controller.js

const tenantService = require('../../services/tenant.service');
const { validateTenant } = require('../../validators/tenant.validator');
const { ApiError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const { metrics } = require('../../utils/metrics');

class TenantController {
  // Create new tenant
  async createTenant(req, res, next) {
    try {
      const { error } = validateTenant(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const tenant = await tenantService.createTenant(req.body, req.user.id);
      metrics.apiRequests.inc({ endpoint: '/tenants', method: 'POST', status: 201 });
      
      res.status(201).json({
        success: true,
        data: tenant
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants', method: 'POST' });
      next(error);
    }
  }

  // Get tenant by ID
  async getTenant(req, res, next) {
    try {
      const tenant = await tenantService.getTenantById(req.params.id, {
        include: ['settings', 'billing']
      });

      if (!tenant) {
        throw new ApiError(404, 'Tenant not found');
      }

      metrics.apiRequests.inc({ endpoint: '/tenants/:id', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'GET' });
      next(error);
    }
  }

  // Update tenant
  async updateTenant(req, res, next) {
    try {
      const { error } = validateTenant(req.body, true);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const tenant = await tenantService.updateTenant(
        req.params.id,
        req.body,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:id', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'PUT' });
      next(error);
    }
  }

  // Delete tenant
  async deleteTenant(req, res, next) {
    try {
      await tenantService.deleteTenant(req.params.id, req.user.id);
      metrics.apiRequests.inc({ endpoint: '/tenants/:id', method: 'DELETE', status: 200 });

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'DELETE' });
      next(error);
    }
  }

  // List tenants
  async listTenants(req, res, next) {
    try {
      const { page, limit, status, type, search, sortBy, sortOrder } = req.query;
      
      const result = await tenantService.listTenants({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        search,
        sortBy,
        sortOrder
      });

      metrics.apiRequests.inc({ endpoint: '/tenants', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: result.tenants,
        pagination: result.pagination
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants', method: 'GET' });
      next(error);
    }
  }

  // Get tenant metrics
  async getTenantMetrics(req, res, next) {
    try {
      const metrics = await tenantService.getTenantMetrics(req.params.id);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantController();
