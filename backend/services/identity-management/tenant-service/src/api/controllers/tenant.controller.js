// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\controllers\tenant.controller.js

const tenantService = require('../services/tenant.service');
const { ApiError } = require('../utils/errors');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

class TenantController {
  // Create new tenant
  async createTenant(req, res, next) {
    try {
      const tenant = await tenantService.createTenant(req.body, req.user.id);
      logger.info('Tenant created successfully', { tenantId: tenant.id });
      metrics.apiRequests.inc({ endpoint: '/tenants', method: 'POST', status: 201 });
      
      res.status(201).json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Failed to create tenant', { error: error.message });
      metrics.apiErrors.inc({ endpoint: '/tenants', method: 'POST', error: error.name });
      next(error);
    }
  }

  // Get tenant by ID
  async getTenant(req, res, next) {
    try {
      const tenant = await tenantService.getTenantById(req.params.tenantId, {
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
      logger.error('Failed to get tenant', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'GET', error: error.name });
      next(error);
    }
  }

  // Update tenant
  async updateTenant(req, res, next) {
    try {
      const tenant = await tenantService.updateTenant(
        req.params.tenantId,
        req.body,
        req.user.id
      );

      logger.info('Tenant updated successfully', { tenantId: tenant.id });
      metrics.apiRequests.inc({ endpoint: '/tenants/:id', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: tenant
      });
    } catch (error) {
      logger.error('Failed to update tenant', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'PUT', error: error.name });
      next(error);
    }
  }

  // Delete tenant
  async deleteTenant(req, res, next) {
    try {
      await tenantService.deleteTenant(req.params.tenantId, req.user.id);
      logger.info('Tenant deleted successfully', { tenantId: req.params.tenantId });
      metrics.apiRequests.inc({ endpoint: '/tenants/:id', method: 'DELETE', status: 200 });

      res.json({
        success: true,
        message: 'Tenant deleted successfully'
      });
    } catch (error) {
      logger.error('Failed to delete tenant', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      metrics.apiErrors.inc({ endpoint: '/tenants/:id', method: 'DELETE', error: error.name });
      next(error);
    }
  }

  // List tenants
  async listTenants(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        type: req.query.type,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };
      
      const result = await tenantService.listTenants(filters);
      metrics.apiRequests.inc({ endpoint: '/tenants', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: result.tenants,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Failed to list tenants', { error: error.message });
      metrics.apiErrors.inc({ endpoint: '/tenants', method: 'GET', error: error.name });
      next(error);
    }
  }

  // Get tenant metrics
  async getTenantMetrics(req, res, next) {
    try {
      const metrics = await tenantService.getTenantMetrics(req.params.tenantId);
      logger.info('Tenant metrics retrieved', { tenantId: req.params.tenantId });
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Failed to get tenant metrics', { 
        tenantId: req.params.tenantId, 
        error: error.message 
      });
      metrics.apiErrors.inc({ 
        endpoint: '/tenants/:id/metrics', 
        method: 'GET', 
        error: error.name 
      });
      next(error);
    }
  }
}

module.exports = new TenantController();
