// auth-service/src/integrations/user-service.integration.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class UserServiceIntegration {
    constructor() {
        this.baseUrl = config.userService.baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000
        });
    }

    async validateUser(userId) {
        try {
            const response = await this.client.get(`/users/${userId}/validate`);
            return response.data;
        } catch (error) {
            logger.error(`Error validating user ${userId}:`, error);
            throw error;
        }
    }

    async getUserDetails(userId) {
        try {
            const response = await this.client.get(`/users/${userId}`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching user details for ${userId}:`, error);
            throw error;
        }
    }

    async updateUserAuthStatus(userId, status) {
        try {
            const response = await this.client.patch(`/users/${userId}/auth-status`, {
                status
            });
            return response.data;
        } catch (error) {
            logger.error(`Error updating auth status for user ${userId}:`, error);
            throw error;
        }
    }

    async getUserTenants(userId) {
        try {
            const response = await this.client.get(`/users/${userId}/tenants`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching tenants for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new UserServiceIntegration();