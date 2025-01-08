const advancedCache = require('./advancedCache');
const logger = require('../config/logger');

class CachePatterns {
    constructor() {
        this.defaultTTL = 300; // 5 minutes
    }

    /**
     * Write-Through Cache Pattern
     * Updates both cache and database simultaneously
     */
    async writeThroughCache(key, value, writeFunction, ttl = this.defaultTTL) {
        try {
            // Write to database first
            await writeFunction(value);
            
            // Then update cache
            await advancedCache.set(key, value, ttl);
            
            return true;
        } catch (error) {
            logger.error('Write-through cache error:', error);
            throw error;
        }
    }

    /**
     * Write-Back Cache Pattern
     * Updates cache immediately and queues database update
     */
    async writeBackCache(key, value, writeFunction, ttl = this.defaultTTL) {
        try {
            // Update cache immediately
            await advancedCache.set(key, value, ttl);
            
            // Queue database update
            setImmediate(async () => {
                try {
                    await writeFunction(value);
                } catch (error) {
                    logger.error('Write-back database update error:', error);
                    // Invalidate cache on database write failure
                    await advancedCache.invalidate(key);
                }
            });
            
            return true;
        } catch (error) {
            logger.error('Write-back cache error:', error);
            throw error;
        }
    }

    /**
     * Write-Around Cache Pattern
     * Writes directly to database, bypassing cache
     */
    async writeAroundCache(value, writeFunction) {
        try {
            // Write directly to database
            await writeFunction(value);
            return true;
        } catch (error) {
            logger.error('Write-around cache error:', error);
            throw error;
        }
    }

    /**
     * Read-Through Cache Pattern with Batching
     * Reads from cache, falling back to database with request batching
     */
    async readThroughCache(keys, readFunction, ttl = this.defaultTTL) {
        try {
            // Try to get all keys from cache
            const cachedValues = await advancedCache.mget(keys);
            
            // Find missing keys
            const missingKeys = keys.filter((key, index) => !cachedValues[index]);
            
            if (missingKeys.length > 0) {
                // Batch read from database
                const dbValues = await readFunction(missingKeys);
                
                // Update cache with missing values
                await Promise.all(
                    Object.entries(dbValues).map(([key, value]) =>
                        advancedCache.set(key, value, ttl)
                    )
                );

                // Merge cached and database values
                return keys.map((key, index) => 
                    cachedValues[index] || dbValues[key]
                );
            }
            
            return cachedValues;
        } catch (error) {
            logger.error('Read-through cache error:', error);
            throw error;
        }
    }

    /**
     * Cache-Aside Pattern with Prefetching
     * Proactively loads data into cache based on access patterns
     */
    async cacheAsideWithPrefetch(key, readFunction, prefetchKeys = [], ttl = this.defaultTTL) {
        try {
            // Try to get from cache
            let value = await advancedCache.get(key);
            
            if (!value) {
                // Cache miss - read from database
                value = await readFunction(key);
                await advancedCache.set(key, value, ttl);
                
                // Prefetch related items
                this.prefetchRelatedItems(prefetchKeys, readFunction, ttl);
            }
            
            return value;
        } catch (error) {
            logger.error('Cache-aside with prefetch error:', error);
            throw error;
        }
    }

    /**
     * Refresh-Ahead Pattern
     * Automatically refreshes cache before expiration
     */
    async refreshAheadCache(key, readFunction, ttl = this.defaultTTL, refreshThreshold = 0.75) {
        try {
            const value = await advancedCache.get(key);
            
            if (value && value._expires) {
                const timeUntilExpiry = value._expires - Date.now();
                const shouldRefresh = timeUntilExpiry < (ttl * 1000 * (1 - refreshThreshold));
                
                if (shouldRefresh) {
                    // Refresh in background
                    this.refreshCacheValue(key, readFunction, ttl);
                }
            }
            
            return value?.data;
        } catch (error) {
            logger.error('Refresh-ahead cache error:', error);
            throw error;
        }
    }

    /**
     * Time-Based Cache Invalidation Pattern
     */
    async timeBasedInvalidation(pattern, interval) {
        setInterval(async () => {
            try {
                await advancedCache.invalidate(pattern);
                logger.info(`Time-based invalidation for pattern: ${pattern}`);
            } catch (error) {
                logger.error('Time-based invalidation error:', error);
            }
        }, interval);
    }

    /**
     * Event-Based Cache Invalidation Pattern
     */
    setupEventBasedInvalidation(eventEmitter) {
        const events = ['created', 'updated', 'deleted'];
        const resources = ['course', 'content', 'user', 'progress'];
        
        resources.forEach(resource => {
            events.forEach(event => {
                eventEmitter.on(`${resource}:${event}`, async (data) => {
                    try {
                        const patterns = this.getInvalidationPatterns(resource, event, data);
                        await Promise.all(
                            patterns.map(pattern => advancedCache.invalidate(pattern))
                        );
                    } catch (error) {
                        logger.error('Event-based invalidation error:', error);
                    }
                });
            });
        });
    }

    /**
     * Hierarchical Cache Pattern
     */
    async hierarchicalCache(key, readFunctions, ttls = []) {
        const caches = readFunctions.map((fn, index) => ({
            read: fn,
            ttl: ttls[index] || this.defaultTTL
        }));

        for (let i = 0; i < caches.length; i++) {
            try {
                const cacheKey = `L${i}:${key}`;
                let value = await advancedCache.get(cacheKey);

                if (value) {
                    // Update higher-level caches in background
                    this.updateHigherLevelCaches(key, value, caches.slice(0, i), ttls);
                    return value;
                }

                // Try to get value from current cache level
                value = await caches[i].read(key);
                if (value) {
                    await advancedCache.set(cacheKey, value, caches[i].ttl);
                    return value;
                }
            } catch (error) {
                logger.error(`Hierarchical cache L${i} error:`, error);
                continue;
            }
        }

        return null;
    }

    /**
     * Helper Methods
     */
    async prefetchRelatedItems(keys, readFunction, ttl) {
        setImmediate(async () => {
            try {
                const values = await readFunction(keys);
                await Promise.all(
                    Object.entries(values).map(([key, value]) =>
                        advancedCache.set(key, value, ttl)
                    )
                );
            } catch (error) {
                logger.error('Prefetch error:', error);
            }
        });
    }

    async refreshCacheValue(key, readFunction, ttl) {
        try {
            const newValue = await readFunction(key);
            await advancedCache.set(key, newValue, ttl);
        } catch (error) {
            logger.error('Cache refresh error:', error);
        }
    }

    getInvalidationPatterns(resource, event, data) {
        const patterns = [`${resource}:*`];
        
        if (data.id) {
            patterns.push(`${resource}:${data.id}`);
        }
        
        if (data.relatedResources) {
            data.relatedResources.forEach(related => {
                patterns.push(`${related.type}:${related.id}`);
            });
        }
        
        return patterns;
    }

    async updateHigherLevelCaches(key, value, caches, ttls) {
        setImmediate(async () => {
            try {
                await Promise.all(
                    caches.map((cache, index) =>
                        advancedCache.set(`L${index}:${key}`, value, ttls[index] || this.defaultTTL)
                    )
                );
            } catch (error) {
                logger.error('Higher-level cache update error:', error);
            }
        });
    }
}

module.exports = new CachePatterns();
