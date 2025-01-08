const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('../config/logger');

class CacheManager {
    constructor() {
        this.client = new Redis(config.redis.url, {
            maxRetriesPerRequest: 1,
            enableReadyCheck: false
        });

        this.client.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });

        this.defaultTTL = 3600; // 1 hour
    }

    /**
     * Generate cache key
     * @param {Object} req - Express request object
     * @returns {string}
     */
    generateKey(req) {
        const { originalUrl, method, user, query, body } = req;
        const key = `${method}:${originalUrl}:${user?.organizationId}:${user?.tenantId}`;
        
        // Include query params and body in cache key for more specific caching
        const params = {
            query: query || {},
            body: method !== 'GET' ? body : {}
        };

        return `${key}:${JSON.stringify(params)}`;
    }

    /**
     * Cache middleware
     * @param {Object} options - Cache options
     * @returns {Function}
     */
    cache(options = {}) {
        const ttl = options.ttl || this.defaultTTL;
        const exclude = options.exclude || [];

        return async (req, res, next) => {
            // Skip caching for excluded paths
            if (exclude.some(path => req.path.includes(path))) {
                return next();
            }

            const key = this.generateKey(req);

            try {
                // Try to get cached response
                const cachedResponse = await this.client.get(key);
                if (cachedResponse) {
                    const { statusCode, data } = JSON.parse(cachedResponse);
                    return res.status(statusCode).json(data);
                }

                // Store original send function
                const originalSend = res.send;

                // Override send function to cache response
                res.send = function (body) {
                    const responseData = {
                        statusCode: res.statusCode,
                        data: JSON.parse(body)
                    };

                    // Only cache successful responses
                    if (res.statusCode === 200) {
                        this.client.setex(key, ttl, JSON.stringify(responseData))
                            .catch(error => logger.error('Redis set error:', error));
                    }

                    // Call original send function
                    return originalSend.call(this, body);
                }.bind(res);

                next();
            } catch (error) {
                logger.error('Cache middleware error:', error);
                next();
            }
        };
    }

    /**
     * Clear cache by pattern
     * @param {string} pattern
     * @returns {Promise<void>}
     */
    async clearCache(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            logger.error('Cache clear error:', error);
        }
    }

    /**
     * Clear cache for specific organization and tenant
     * @param {string} organizationId
     * @param {string} tenantId
     * @returns {Promise<void>}
     */
    async clearOrganizationCache(organizationId, tenantId) {
        await this.clearCache(`*:${organizationId}:${tenantId}:*`);
    }

    /**
     * Clear cache for specific content
     * @param {string} contentId
     * @returns {Promise<void>}
     */
    async clearContentCache(contentId) {
        await this.clearCache(`*content*${contentId}*`);
    }

    /**
     * Clear cache for specific media
     * @param {string} mediaId
     * @returns {Promise<void>}
     */
    async clearMediaCache(mediaId) {
        await this.clearCache(`*media*${mediaId}*`);
    }
}

const cacheManager = new CacheManager();

/**
 * Cache middleware factory
 * @param {Object} options - Cache options
 * @returns {Function}
 */
const cacheMiddleware = (options = {}) => cacheManager.cache(options);

/**
 * Clear cache after content update
 */
const clearContentCache = async (req, res, next) => {
    try {
        if (req.params.contentId) {
            await cacheManager.clearContentCache(req.params.contentId);
        }
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Clear cache after media update
 */
const clearMediaCache = async (req, res, next) => {
    try {
        if (req.params.mediaId) {
            await cacheManager.clearMediaCache(req.params.mediaId);
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    cacheMiddleware,
    clearContentCache,
    clearMediaCache,
    cacheManager
};
