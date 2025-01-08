const Redis = require('ioredis');
const logger = require('../config/logger');
const config = require('../config/config');

class AdvancedCacheManager {
    constructor() {
        // Create main Redis client
        this.client = new Redis(config.cache.redis.url, {
            retryStrategy: (times) => Math.min(times * 50, 2000),
            maxRetriesPerRequest: 3
        });

        // Create pub/sub clients for cache invalidation
        this.subscriber = new Redis(config.cache.redis.url);
        this.publisher = new Redis(config.cache.redis.url);

        // Set up event handlers
        this.setupEventHandlers();

        // Cache configuration
        this.config = {
            defaultTTL: config.cache.redis.ttl,
            maxCacheSize: 1000000, // 1MB in bytes
            compressionThreshold: 100000, // 100KB in bytes
            staleWhileRevalidate: true,
            backgroundRefresh: true,
            circuitBreaker: {
                threshold: 5,
                timeout: 60000
            }
        };

        // Circuit breaker state
        this.circuitBreaker = {
            failures: 0,
            lastFailure: null,
            isOpen: false
        };

        // Initialize compression
        this.setupCompression();
    }

    setupEventHandlers() {
        // Handle Redis connection events
        this.client.on('error', (error) => {
            logger.error('Redis cache error:', error);
            this.handleFailure();
        });

        this.client.on('connect', () => {
            logger.info('Connected to Redis cache');
            this.resetCircuitBreaker();
        });

        // Subscribe to cache invalidation events
        this.subscriber.subscribe('cache:invalidate');
        this.subscriber.on('message', (channel, message) => {
            if (channel === 'cache:invalidate') {
                this.handleInvalidationMessage(JSON.parse(message));
            }
        });
    }

    setupCompression() {
        const zlib = require('zlib');
        this.compress = (data) => new Promise((resolve, reject) => {
            zlib.gzip(JSON.stringify(data), (error, compressed) => {
                if (error) reject(error);
                else resolve(compressed);
            });
        });

        this.decompress = (data) => new Promise((resolve, reject) => {
            zlib.gunzip(data, (error, decompressed) => {
                if (error) reject(error);
                else resolve(JSON.parse(decompressed.toString()));
            });
        });
    }

    async get(key, options = {}) {
        if (this.circuitBreaker.isOpen) {
            logger.warn('Circuit breaker is open, skipping cache');
            return null;
        }

        try {
            const cached = await this.client.get(key);
            if (!cached) return null;

            // Check if value is compressed
            const value = cached.startsWith('compressed:') 
                ? await this.decompress(Buffer.from(cached.slice(11), 'base64'))
                : JSON.parse(cached);

            // Handle stale-while-revalidate
            if (options.staleWhileRevalidate && value._expires && value._expires < Date.now()) {
                this.refreshCache(key, options);
                return value.data;
            }

            return value.data;
        } catch (error) {
            logger.error('Cache get error:', error);
            this.handleFailure();
            return null;
        }
    }

    async set(key, value, ttl = this.config.defaultTTL, options = {}) {
        if (this.circuitBreaker.isOpen) {
            logger.warn('Circuit breaker is open, skipping cache');
            return false;
        }

        try {
            const cacheValue = {
                data: value,
                _created: Date.now(),
                _expires: Date.now() + (ttl * 1000)
            };

            let serialized = JSON.stringify(cacheValue);

            // Compress if size exceeds threshold
            if (serialized.length > this.config.compressionThreshold) {
                const compressed = await this.compress(cacheValue);
                serialized = 'compressed:' + compressed.toString('base64');
            }

            // Check cache size limit
            if (serialized.length > this.config.maxCacheSize) {
                logger.warn('Cache value exceeds size limit:', key);
                return false;
            }

            await this.client.set(key, serialized, 'EX', ttl);

            // Set up background refresh if enabled
            if (options.backgroundRefresh && options.refreshFunction) {
                this.setupBackgroundRefresh(key, options);
            }

            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            this.handleFailure();
            return false;
        }
    }

    async mget(keys) {
        if (this.circuitBreaker.isOpen) return keys.map(() => null);

        try {
            const values = await this.client.mget(keys);
            return await Promise.all(values.map(async (value) => {
                if (!value) return null;
                return value.startsWith('compressed:')
                    ? (await this.decompress(Buffer.from(value.slice(11), 'base64'))).data
                    : JSON.parse(value).data;
            }));
        } catch (error) {
            logger.error('Cache mget error:', error);
            this.handleFailure();
            return keys.map(() => null);
        }
    }

    async invalidate(pattern, reason = '') {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                // Publish invalidation event
                await this.publisher.publish('cache:invalidate', JSON.stringify({
                    pattern,
                    reason,
                    timestamp: Date.now()
                }));
            }
            return true;
        } catch (error) {
            logger.error('Cache invalidation error:', error);
            return false;
        }
    }

    async handleInvalidationMessage(message) {
        logger.info('Cache invalidation received:', message);
        // Implement any additional invalidation logic here
    }

    setupBackgroundRefresh(key, options) {
        const refreshInterval = options.refreshInterval || (options.ttl * 0.75);
        setTimeout(async () => {
            try {
                const newValue = await options.refreshFunction();
                await this.set(key, newValue, options.ttl, options);
            } catch (error) {
                logger.error('Background refresh error:', error);
            }
        }, refreshInterval * 1000);
    }

    handleFailure() {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();

        if (this.circuitBreaker.failures >= this.config.circuitBreaker.threshold) {
            this.circuitBreaker.isOpen = true;
            setTimeout(() => this.resetCircuitBreaker(), this.config.circuitBreaker.timeout);
        }
    }

    resetCircuitBreaker() {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.lastFailure = null;
        this.circuitBreaker.isOpen = false;
    }

    async getStats() {
        const info = await this.client.info();
        return {
            circuitBreaker: this.circuitBreaker,
            redisInfo: info,
            config: this.config
        };
    }
}

module.exports = new AdvancedCacheManager();
