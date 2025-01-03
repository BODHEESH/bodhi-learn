// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\auth-client.service.js

const axios = require('axios');
const { AuthError } = require('../utils/errors');
const config = require('../config/app.config');
const logger = require('../utils/logger');

class AuthClientService {
  constructor() {
    this.client = axios.create({
      baseURL: config.services.auth.url,
      timeout: 5000
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        logger.error('Auth service error:', {
          status: error.response?.status,
          message: error.message,
          path: error.config?.url
        });

        if (error.response?.status === 401) {
          throw new AuthError('Invalid or expired token');
        }

        throw error;
      }
    );
  }

  async validateToken(token) {
    try {
      const response = await this.client.post('/api/auth/validate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      throw new AuthError('Token validation failed');
    }
  }

  async invalidateToken(token) {
    try {
      await this.client.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error) {
      logger.error('Token invalidation failed:', error);
      return false;
    }
  }

  async getUserStatus(userId) {
    try {
      const response = await this.client.get(`/api/auth/status/${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Get user status failed:', error);
      throw error;
    }
  }
}

module.exports = new AuthClientService();
