// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\billing-service.integration.js

const axios = require('axios');
const { logger } = require('../utils/logger');
const config = require('../config');

class BillingServiceIntegration {
  constructor() {
    this.baseUrl = config.services.billing.baseUrl;
    this.apiKey = config.services.billing.apiKey;
  }

  async createBillingAccount(tenantId, billingData) {
    try {
      const response = await axios.post(`${this.baseUrl}/accounts`, {
        tenantId,
        ...billingData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error creating billing account:', error);
      throw error;
    }
  }

  async updateBillingPlan(tenantId, planData) {
    try {
      const response = await axios.put(`${this.baseUrl}/accounts/${tenantId}/plan`, {
        ...planData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error updating billing plan:', error);
      throw error;
    }
  }

  async processPayment(tenantId, paymentData) {
    try {
      const response = await axios.post(`${this.baseUrl}/payments`, {
        tenantId,
        ...paymentData
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async getBillingHistory(tenantId, options = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/accounts/${tenantId}/history`, {
        params: options,
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting billing history:', error);
      throw error;
    }
  }

  async cancelSubscription(tenantId, reason) {
    try {
      const response = await axios.post(`${this.baseUrl}/accounts/${tenantId}/cancel`, {
        reason
      }, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }
}

module.exports = new BillingServiceIntegration();
