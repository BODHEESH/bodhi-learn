const Redis = require('ioredis');
const logger = require('../config/logger');
const config = require('../config/config');

class CacheManager {
    constructor() {
        this.client = new Redis(config.cache.redis.url, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3
        });

        this.defaultTTL = config.cache.redis.ttl;

        this.client.on('error', (error) => {
            logger.error('Redis cache error:', error);
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis cache');
        });

        // Cache key prefixes
        this.keyPrefix = {
            course: 'course:',
            content: 'content:',
            user: 'user:',
            mentorship: 'mentorship:',
            challenge: 'challenge:',
            studySession: 'study-session:',
            recommendation: 'recommendation:'
        };
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} Cached value
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} Success status
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Success status
     */
    async delete(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Get multiple values from cache
     * @param {string[]} keys - Cache keys
     * @returns {Promise<any[]>} Cached values
     */
    async mget(keys) {
        try {
            const values = await this.client.mget(keys);
            return values.map(value => value ? JSON.parse(value) : null);
        } catch (error) {
            logger.error('Cache mget error:', error);
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple values in cache
     * @param {Object[]} items - Array of {key, value} objects
     * @param {number} ttl - Time to live in seconds
     * @returns {Promise<boolean>} Success status
     */
    async mset(items, ttl = this.defaultTTL) {
        try {
            const pipeline = this.client.pipeline();
            
            items.forEach(({ key, value }) => {
                pipeline.set(key, JSON.stringify(value), 'EX', ttl);
            });

            await pipeline.exec();
            return true;
        } catch (error) {
            logger.error('Cache mset error:', error);
            return false;
        }
    }

    /**
     * Delete multiple values from cache
     * @param {string[]} keys - Cache keys
     * @returns {Promise<boolean>} Success status
     */
    async mdelete(keys) {
        try {
            await this.client.del(keys);
            return true;
        } catch (error) {
            logger.error('Cache mdelete error:', error);
            return false;
        }
    }

    /**
     * Clear cache by pattern
     * @param {string} pattern - Key pattern to clear
     * @returns {Promise<boolean>} Success status
     */
    async clearPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache clear pattern error:', error);
            return false;
        }
    }

    /**
     * Get cache key for entity
     * @param {string} type - Entity type
     * @param {string} id - Entity ID
     * @returns {string} Cache key
     */
    getKey(type, id) {
        return `${this.keyPrefix[type]}${id}`;
    }

    /**
     * Get cache keys for list
     * @param {string} type - Entity type
     * @param {Object} params - List parameters
     * @returns {string} Cache key
     */
    getListKey(type, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${params[key]}`)
            .join(':');
        return `${this.keyPrefix[type]}list:${sortedParams}`;
    }

    /**
     * Close Redis connection
     */
    async close() {
        await this.client.quit();
        logger.info('Redis cache connection closed');
    }
}

module.exports = new CacheManager();
