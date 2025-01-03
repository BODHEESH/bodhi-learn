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

  async updatePassword(userId, hashedPassword) {
    try {
      await this.client.patch(`/api/users/${userId}/password`, {
        password: hashedPassword
      });
    } catch (error) {
      throw new ServiceError('Failed to update password', error);
    }
  }

  async getMFADetails(userId) {
    try {
      const response = await this.client.get(`/api/users/${userId}/mfa`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new ServiceError('Failed to get MFA details', error);
    }
  }

  async enableMFA(userId, mfaDetails) {
    try {
      await this.client.post(`/api/users/${userId}/mfa`, mfaDetails);
    } catch (error) {
      throw new ServiceError('Failed to enable MFA', error);
    }
  }

  async updateBackupCodes(userId, backupCodes) {
    try {
      await this.client.patch(`/api/users/${userId}/mfa/backup-codes`, {
        backupCodes
      });
    } catch (error) {
      throw new ServiceError('Failed to update backup codes', error);
    }
  }

  async disableMFA(userId) {
    try {
      await this.client.delete(`/api/users/${userId}/mfa`);
    } catch (error) {
      throw new ServiceError('Failed to disable MFA', error);
    }
  }
}

module.exports = { UserService };
