// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\audit-service.integration.js

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');

class AuditServiceIntegration {
  constructor() {
    this.baseUrl = config.services.audit.baseUrl;
    this.apiKey = config.services.audit.apiKey;
  }

  async logAuditEvent(tenantId, event) {
    try {
      const response = await axios.post(`${this.baseUrl}/events`, {
        tenantId,
        ...event,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error logging audit event:', error);
      throw error;
    }
  }

  async getAuditTrail(tenantId, options = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/trail/${tenantId}`, {
        params: {
          startDate: options.startDate,
          endDate: options.endDate,
          eventTypes: options.eventTypes?.join(','),
          page: options.page || 1,
          limit: options.limit || 50
        },
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting audit trail:', error);
      throw error;
    }
  }

  async getComplianceReport(tenantId, reportType, timeRange = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/compliance/reports`, {
        tenantId,
        reportType,
        startDate: timeRange.startDate,
        endDate: timeRange.endDate
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

  async searchAuditLogs(tenantId, searchCriteria = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/search`, {
        tenantId,
        ...searchCriteria
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error searching audit logs:', error);
      throw error;
    }
  }

  async exportAuditLogs(tenantId, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/export`, {
        tenantId,
        format: options.format || 'CSV',
        ...options
      }, {
        headers: {
          'X-API-Key': this.apiKey
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditServiceIntegration();
