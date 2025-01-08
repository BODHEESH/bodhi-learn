const axios = require('axios');
const logger = require('../config/logger');
const config = require('../config/config');
const cache = require('./cache');

class AuthClient {
    constructor() {
        this.baseURL = config.services.auth.url;
        this.apiKey = config.services.auth.apiKey;

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Cache TTLs
        this.cacheTTL = {
            userProfile: 300, // 5 minutes
            permissions: 300,
            roles: 300,
            token: 3600 // 1 hour
        };
    }

    /**
     * Validate JWT token
     * @param {string} token - JWT token
     * @returns {Promise<Object>} Token validation result
     */
    async validateToken(token) {
        const cacheKey = `token:${token}`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.client.post('/auth/validate', { token });
            const result = response.data;

            // Cache successful validation
            if (result.valid) {
                await cache.set(cacheKey, result, this.cacheTTL.token);
            }

            return result;
        } catch (error) {
            logger.error('Token validation error:', error);
            throw error;
        }
    }

    /**
     * Get user profile
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User profile
     */
    async getUserProfile(userId) {
        const cacheKey = `user:${userId}:profile`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.client.get(`/users/${userId}/profile`);
            const profile = response.data;

            // Cache profile
            await cache.set(cacheKey, profile, this.cacheTTL.userProfile);

            return profile;
        } catch (error) {
            logger.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Check user permissions
     * @param {string} userId - User ID
     * @param {string} resource - Resource to check
     * @param {string} action - Action to check
     * @returns {Promise<boolean>} Permission status
     */
    async checkPermission(userId, resource, action) {
        const cacheKey = `user:${userId}:permission:${resource}:${action}`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached !== null) return cached;

        try {
            const response = await this.client.post('/auth/check-permission', {
                userId,
                resource,
                action
            });

            const hasPermission = response.data.allowed;

            // Cache permission check
            await cache.set(cacheKey, hasPermission, this.cacheTTL.permissions);

            return hasPermission;
        } catch (error) {
            logger.error('Permission check error:', error);
            throw error;
        }
    }

    /**
     * Get user roles
     * @param {string} userId - User ID
     * @returns {Promise<string[]>} User roles
     */
    async getUserRoles(userId) {
        const cacheKey = `user:${userId}:roles`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.client.get(`/users/${userId}/roles`);
            const roles = response.data;

            // Cache roles
            await cache.set(cacheKey, roles, this.cacheTTL.roles);

            return roles;
        } catch (error) {
            logger.error('Error fetching user roles:', error);
            throw error;
        }
    }

    /**
     * Check if user has role
     * @param {string} userId - User ID
     * @param {string|string[]} roles - Role(s) to check
     * @returns {Promise<boolean>} Has role status
     */
    async hasRole(userId, roles) {
        const userRoles = await this.getUserRoles(userId);
        const rolesToCheck = Array.isArray(roles) ? roles : [roles];
        return rolesToCheck.some(role => userRoles.includes(role));
    }

    /**
     * Invalidate user caches
     * @param {string} userId - User ID
     */
    async invalidateUserCaches(userId) {
        const patterns = [
            `user:${userId}:*`,
            `token:*`  // Invalidate all token caches as they might contain user data
        ];

        await Promise.all(patterns.map(pattern => cache.clearPattern(pattern)));
    }

    /**
     * Get user learning preferences
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Learning preferences
     */
    async getLearningPreferences(userId) {
        const cacheKey = `user:${userId}:learning_preferences`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.client.get(`/users/${userId}/learning-preferences`);
            const preferences = response.data;

            // Cache preferences
            await cache.set(cacheKey, preferences, this.cacheTTL.userProfile);

            return preferences;
        } catch (error) {
            logger.error('Error fetching learning preferences:', error);
            throw error;
        }
    }

    /**
     * Update user learning progress
     * @param {string} userId - User ID
     * @param {Object} progress - Learning progress data
     * @returns {Promise<Object>} Updated progress
     */
    async updateLearningProgress(userId, progress) {
        try {
            const response = await this.client.post(`/users/${userId}/learning-progress`, progress);
            
            // Invalidate relevant caches
            await this.invalidateUserCaches(userId);

            return response.data;
        } catch (error) {
            logger.error('Error updating learning progress:', error);
            throw error;
        }
    }

    /**
     * Get user achievements
     * @param {string} userId - User ID
     * @returns {Promise<Object[]>} User achievements
     */
    async getUserAchievements(userId) {
        const cacheKey = `user:${userId}:achievements`;
        
        // Check cache first
        const cached = await cache.get(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.client.get(`/users/${userId}/achievements`);
            const achievements = response.data;

            // Cache achievements
            await cache.set(cacheKey, achievements, this.cacheTTL.userProfile);

            return achievements;
        } catch (error) {
            logger.error('Error fetching user achievements:', error);
            throw error;
        }
    }
}

module.exports = new AuthClient();
