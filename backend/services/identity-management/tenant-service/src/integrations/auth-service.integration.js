// tenant-service/src/integrations/auth-service.integration.js
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

    async validateTenantAccess(token, tenantId) {
        try {
            const response = await this.client.post('/auth/validate-tenant-access', {
                token,
                tenantId
            });
            return response.data;
        } catch (error) {
            logger.error(`Error validating tenant access for tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async configureTenantAuth(tenantId, authConfig) {
        try {
            const response = await this.client.post(`/auth/tenant/${tenantId}/config`, {
                ...authConfig,
                // Auth configuration including:
                ssoEnabled: authConfig.ssoEnabled,
                mfaRequired: authConfig.mfaRequired,
                passwordPolicy: authConfig.passwordPolicy,
                sessionTimeout: authConfig.sessionTimeout,
                allowedIPs: authConfig.allowedIPs
            });
            return response.data;
        } catch (error) {
            logger.error(`Error configuring auth for tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async getTenantAuthConfig(tenantId) {
        try {
            const response = await this.client.get(`/auth/tenant/${tenantId}/config`);
            return response.data;
        } catch (error) {
            logger.error(`Error fetching auth config for tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async updateTenantAuthRoles(tenantId, roles) {
        try {
            const response = await this.client.put(`/auth/tenant/${tenantId}/roles`, {
                roles
            });
            return response.data;
        } catch (error) {
            logger.error(`Error updating auth roles for tenant ${tenantId}:`, error);
            throw error;
        }
    }

    async generateTenantApiKey(tenantId, scope) {
        try {
            const response = await this.client.post(`/auth/tenant/${tenantId}/api-key`, {
                scope
            });
            return response.data;
        } catch (error) {
            logger.error(`Error generating API key for tenant ${tenantId}:`, error);
            throw error;
        }
    }
}

module.exports = new AuthServiceIntegration();