// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\notification-service.integration.js

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');

class NotificationServiceIntegration {
  constructor() {
    this.baseUrl = config.services.notification.baseUrl;
    this.apiKey = config.services.notification.apiKey;
  }

  async sendTenantCreatedNotification(tenantId, tenantData) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, {
        type: 'TENANT_CREATED',
        tenantId,
        data: tenantData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending tenant created notification:', error);
      throw error;
    }
  }

  async sendBillingNotification(tenantId, billingData) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, {
        type: 'BILLING_UPDATE',
        tenantId,
        data: billingData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending billing notification:', error);
      throw error;
    }
  }

  async sendSettingsUpdateNotification(tenantId, settingsData) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, {
        type: 'SETTINGS_UPDATE',
        tenantId,
        data: settingsData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending settings update notification:', error);
      throw error;
    }
  }

  async sendTenantStatusNotification(tenantId, status) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, {
        type: 'TENANT_STATUS_CHANGE',
        tenantId,
        data: { status }
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending tenant status notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationServiceIntegration();
