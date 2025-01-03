// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\integrations\user.service.js

const axios = require('axios');
const config = require('../config');
const { CustomError } = require('../utils/errors');
const logger = require('../utils/logger');

class UserService {
  constructor() {
    this.baseUrl = config.services.user.baseUrl;
    this.apiKey = config.services.user.apiKey;
  }

  async getUserDetails(userId) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Get user details error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User not found');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error fetching user details');
    }
  }

  async validateUserAccess(userId, organizationId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/${userId}/access/validate`,
        { organizationId },
        {
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('User access validation error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User not found');
      }
      if (error.response?.status === 403) {
        throw new CustomError('ACCESS_DENIED', 'User does not have required access');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error validating user access');
    }
  }

  async getUserRoles(userId, organizationId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/users/${userId}/roles`,
        {
          params: { organizationId },
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Get user roles error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User not found');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error fetching user roles');
    }
  }

  async assignUserToOrganization(userId, organizationId, roleData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/${userId}/organizations/${organizationId}/assign`,
        roleData,
        {
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Assign user to organization error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User not found');
      }
      if (error.response?.status === 409) {
        throw new CustomError('USER_ALREADY_ASSIGNED', 'User is already assigned to this organization');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error assigning user to organization');
    }
  }

  async removeUserFromOrganization(userId, organizationId) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/users/${userId}/organizations/${organizationId}`,
        {
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Remove user from organization error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User or organization assignment not found');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error removing user from organization');
    }
  }

  async updateUserOrganizationRoles(userId, organizationId, roles) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/users/${userId}/organizations/${organizationId}/roles`,
        { roles },
        {
          headers: {
            'x-api-key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Update user organization roles error:', error);
      if (error.response?.status === 404) {
        throw new CustomError('USER_NOT_FOUND', 'User or organization assignment not found');
      }
      throw new CustomError('USER_SERVICE_ERROR', 'Error updating user organization roles');
    }
  }
}

module.exports = UserService;
