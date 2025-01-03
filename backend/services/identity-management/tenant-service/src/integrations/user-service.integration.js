// tenant-service/src/integrations/user-service.integration.js
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

    async getUsersByTenant(tenantId) {
        try {
            const response = await this.client.get(`/users/tenant/${tenantId}`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching users for tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async updateUserTenantStatus(userId, tenantId, status) {
        try {
            const response = await this.client.patch(`/users/${userId}/tenants/${tenantId}`, { status });
            return response.data;
        } catch (error) {
            logger.error(`Error updating user tenant status for user ${userId} and tenant ${tenantId}:`, error);
            throw error;
        }
    }
}

module.exports = new UserServiceIntegration();