// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\user.service.js

const axios = require('axios');
const config = require('../config/app.config');
const { ServiceError } = require('../utils/errors');

class UserService {
  constructor() {
    this.client = axios.create({
      baseURL: config.services.user.baseUrl,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getUserByEmail(email, institutionId) {
    try {
      const response = await this.client.get('/api/users/by-email', {
        params: { email, institutionId }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ServiceError('User service error', error);
    }
  }

  async getUserById(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ServiceError('User service error', error);
    }
  }

  async updateLastLogin(userId) {
    try {
      await this.client.patch(`/api/users/${userId}/last-login`, {
        lastLoginAt: new Date()
      });
    } catch (error) {
      // Non-critical error, just log it
      console.error('Failed to update last login:', error);
    }
  }
}

module.exports = { UserService };
