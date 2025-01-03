// auth-service/src/integrations/tenant-service.integration.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class TenantServiceIntegration {
    constructor() {
        this.baseUrl = config.tenantService.baseUrl;
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 5000
        });
    }

    async validateTenant(tenantId) {
        try {
            const response = await this.client.get(`/tenants/${tenantId}/validate`);
            return response.data;
        } catch (error) {
            logger.error(`Error validating tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async getTenantConfig(tenantId) {
        try {
            const response = await this.client.get(`/tenants/${tenantId}/config`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching tenant config ${tenantId}:`, error);
            throw error;
        }
    }
}

module.exports = new TenantServiceIntegration();