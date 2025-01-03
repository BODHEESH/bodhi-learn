// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\integrations\tenant.service.js

const axios = require('axios');
const config = require('../config');
const { CustomError } = require('../utils/errors');
const logger = require('../utils/logger');

class TenantService {
  constructor() {
    this.baseUrl = config.services.tenant.baseUrl;
    this.apiKey = config.services.tenant.apiKey;
  }

  async verifyTenantAccess(tenantId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tenants/${tenantId}/verify`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Tenant verification error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('TENANT_NOT_FOUND', 'Tenant not found');
      }
      if (error.response?.status === 403) {
        throw new CustomError('TENANT_ACCESS_DENIED', 'Access to tenant denied');
      }
      throw new CustomError('TENANT_SERVICE_ERROR', 'Error verifying tenant access');
    }
  }

  async getTenantDetails(tenantId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tenants/${tenantId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Get tenant details error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('TENANT_NOT_FOUND', 'Tenant not found');
      }
      throw new CustomError('TENANT_SERVICE_ERROR', 'Error fetching tenant details');
    }
  }

  async validateTenantSubscription(tenantId) {
    try {
      const response = await axios.get(`${this.baseUrl}/tenants/${tenantId}/subscription/validate`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Tenant subscription validation error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('TENANT_NOT_FOUND', 'Tenant not found');
      }
      if (error.response?.status === 403) {
        throw new CustomError('SUBSCRIPTION_INVALID', 'Invalid or expired subscription');
      }
      throw new CustomError('TENANT_SERVICE_ERROR', 'Error validating tenant subscription');
    }
  }

  async updateTenantUsage(tenantId, usageData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tenants/${tenantId}/usage`,
        usageData,
        {
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Update tenant usage error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('TENANT_NOT_FOUND', 'Tenant not found');
      }
      if (error.response?.status === 400) {
        throw new CustomError('USAGE_LIMIT_EXCEEDED', 'Tenant usage limit exceeded');
      }
      throw new CustomError('TENANT_SERVICE_ERROR', 'Error updating tenant usage');
    }
  }
}

module.exports = TenantService;
