// user-service/src/integrations/auth-service.integration.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class AuthServiceIntegration {
    constructor() {
        this.baseUrl = config.authService.baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000
        });
    }

    async createUserAuth(userId, userData) {
        try {
            const response = await this.client.post('/auth/users', {
                userId,
                ...userData
            });
            return response.data;
        } catch (error) {
            logger.error(`Error creating auth for user ${userId}:`, error);
            throw error;
        }
    }

    async getUserRoles(userId, tenantId) {
        try {
            const response = await this.client.get(`/auth/users/${userId}/roles`, {
                params: { tenantId }
            });
            return response.data;
        } catch (error) {
            logger.error(`Error fetching roles for user ${userId}:`, error);
            throw error;
        }
    }

    async validateUserAccess(userId, tenantId, resource) {
        try {
            const response = await this.client.post('/auth/validate-access', {
                userId,
                tenantId,
                resource
            });
            return response.data;
        } catch (error) {
            logger.error(`Error validating access for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new AuthServiceIntegration();