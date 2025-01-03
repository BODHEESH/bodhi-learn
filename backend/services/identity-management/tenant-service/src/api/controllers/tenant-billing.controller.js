// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\controllers\tenant-billing.controller.js

const tenantBillingService = require('../../services/tenant-billing.service');
const { validateBilling } = require('../../validators/tenant-billing.validator');
const { ApiError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const { metrics } = require('../../utils/metrics');

class TenantBillingController {
  // Get tenant billing
  async getBilling(req, res, next) {
    try {
      const billing = await tenantBillingService.getTenantBilling(req.params.tenantId);
      
      if (!billing) {
        throw new ApiError(404, 'Billing record not found');
      }

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/billing', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: billing
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/billing', method: 'GET' });
      next(error);
    }
  }

  // Update billing
  async updateBilling(req, res, next) {
    try {
      const { error } = validateBilling(req.body);
      if (error) {
        throw new ApiError(400, error.details[0].message);
      }

      const billing = await tenantBillingService.updateBilling(
        req.params.tenantId,
        req.body,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/billing', method: 'PUT', status: 200 });

      res.json({
        success: true,
        data: billing
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/billing', method: 'PUT' });
      next(error);
    }
  }

  // Update billing status
  async updateBillingStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        throw new ApiError(400, 'Status is required');
      }

      const billing = await tenantBillingService.updateBillingStatus(
        req.params.tenantId,
        status,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/billing/status', method: 'PATCH', status: 200 });

      res.json({
        success: true,
        data: billing
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/billing/status', method: 'PATCH' });
      next(error);
    }
  }

  // Record payment
  async recordPayment(req, res, next) {
    try {
      const { amount, method } = req.body;
      if (!amount || !method) {
        throw new ApiError(400, 'Amount and payment method are required');
      }

      const billing = await tenantBillingService.recordPayment(
        req.params.tenantId,
        amount,
        method,
        req.user.id
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/billing/payments', method: 'POST', status: 201 });

      res.status(201).json({
        success: true,
        data: billing
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/billing/payments', method: 'POST' });
      next(error);
    }
  }

  // Get billing history
  async getBillingHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const history = await tenantBillingService.getBillingHistory(
        req.params.tenantId,
        {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      );

      metrics.apiRequests.inc({ endpoint: '/tenants/:tenantId/billing/history', method: 'GET', status: 200 });

      res.json({
        success: true,
        data: history.records,
        pagination: history.pagination
      });
    } catch (error) {
      metrics.apiErrors.inc({ endpoint: '/tenants/:tenantId/billing/history', method: 'GET' });
      next(error);
    }
  }

  // Get billing metrics
  async getBillingMetrics(req, res, next) {
    try {
      const metrics = await tenantBillingService.getBillingMetrics(req.params.tenantId);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantBillingController();
