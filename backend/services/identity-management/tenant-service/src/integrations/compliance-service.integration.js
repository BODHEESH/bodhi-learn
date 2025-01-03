// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\compliance-service.integration.js

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');

class ComplianceServiceIntegration {
  constructor() {
    this.baseUrl = config.services.compliance.baseUrl;
    this.apiKey = config.services.compliance.apiKey;
  }

  async validateCompliance(tenantId, complianceType) {
    try {
      const response = await axios.post(`${this.baseUrl}/validate`, {
        tenantId,
        complianceType
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error validating compliance:', error);
      throw error;
    }
  }

  async getComplianceStatus(tenantId) {
    try {
      const response = await axios.get(`${this.baseUrl}/status/${tenantId}`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting compliance status:', error);
      throw error;
    }
  }

  async updateComplianceSettings(tenantId, settings) {
    try {
      const response = await axios.put(`${this.baseUrl}/settings/${tenantId}`, {
        settings
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating compliance settings:', error);
      throw error;
    }
  }

  async generateComplianceReport(tenantId, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/reports/${tenantId}`, {
        ...options,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      throw error;
    }
  }

  async trackComplianceViolation(tenantId, violation) {
    try {
      const response = await axios.post(`${this.baseUrl}/violations`, {
        tenantId,
        ...violation,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error tracking compliance violation:', error);
      throw error;
    }
  }

  async getComplianceAudit(tenantId, timeRange = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/audit/${tenantId}`, {
        params: {
          startDate: timeRange.startDate,
          endDate: timeRange.endDate
        },
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting compliance audit:', error);
      throw error;
    }
  }
}

module.exports = new ComplianceServiceIntegration();
