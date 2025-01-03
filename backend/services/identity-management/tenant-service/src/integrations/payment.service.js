// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\integrations\payment.service.js

const axios = require('axios');
const config = require('../config');
const { CustomError } = require('../utils/errors');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.client = axios.create({
      baseURL: config.payment.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.payment.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createPayment(paymentData) {
    try {
      const response = await this.client.post('/payments', {
        subscriptionId: paymentData.subscriptionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: 'Subscription payment'
      });

      return response.data;
    } catch (error) {
      logger.error('Payment creation failed:', error);
      throw new CustomError('PAYMENT_FAILED', 'Failed to create payment');
    }
  }

  async processRenewalPayment(paymentData) {
    try {
      const response = await this.client.post('/payments/renewal', {
        subscriptionId: paymentData.subscriptionId,
        amount: paymentData.amount,
        currency: paymentData.currency
      });

      return {
        success: response.data.status === 'SUCCESS',
        paymentId: response.data.id
      };
    } catch (error) {
      logger.error('Renewal payment failed:', error);
      return { success: false };
    }
  }

  async cancelPendingPayments(subscriptionId) {
    try {
      await this.client.post(`/payments/subscription/${subscriptionId}/cancel`);
      return true;
    } catch (error) {
      logger.error('Failed to cancel pending payments:', error);
      throw new CustomError('PAYMENT_CANCELLATION_FAILED', 'Failed to cancel pending payments');
    }
  }

  async getPaymentHistory(subscriptionId) {
    try {
      const response = await this.client.get(`/payments/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch payment history:', error);
      throw new CustomError('PAYMENT_HISTORY_FAILED', 'Failed to fetch payment history');
    }
  }
}

module.exports = { PaymentService };
