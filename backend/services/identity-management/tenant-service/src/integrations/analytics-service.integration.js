// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\analytics-service.integration.js

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');

class AnalyticsServiceIntegration {
  constructor() {
    this.baseUrl = config.services.analytics.baseUrl;
    this.apiKey = config.services.analytics.apiKey;
  }

  async trackTenantEvent(tenantId, eventType, eventData) {
    try {
      const response = await axios.post(`${this.baseUrl}/events`, {
        tenantId,
        type: eventType,
        data: eventData,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error tracking tenant event:', error);
      throw error;
    }
  }

  async getTenantMetrics(tenantId, metrics = [], timeRange = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/metrics/${tenantId}`, {
        params: {
          metrics: metrics.join(','),
          startDate: timeRange.startDate,
          endDate: timeRange.endDate
        },
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting tenant metrics:', error);
      throw error;
    }
  }

  async generateTenantReport(tenantId, reportType, options = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/reports`, {
        tenantId,
        type: reportType,
        options,
        format: options.format || 'PDF'
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error generating tenant report:', error);
      throw error;
    }
  }

  async trackResourceUsage(tenantId, resourceType, usage) {
    try {
      const response = await axios.post(`${this.baseUrl}/usage`, {
        tenantId,
        resourceType,
        usage,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error tracking resource usage:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsServiceIntegration();
