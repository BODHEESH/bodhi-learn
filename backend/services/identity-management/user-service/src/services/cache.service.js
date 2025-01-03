// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\cache.service.js

const { redis } = require('./redis.service');
const logger = require('../utils/logger');
const config = require('../config/app.config');

class CacheService {
  constructor(prefix = '') {
    this.redis = redis;
    this.prefix = prefix;
  }

  getKey(key) {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  async get(key) {
    try {
      const value = await this.redis.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.set(this.getKey(key), serialized, ttl);
      } else {
        await this.redis.set(this.getKey(key), serialized);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      await this.redis.delPattern(this.getKey(pattern));
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Cache decorators
  withCache(keyFn, ttl = null) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        const key = keyFn(...args);
        
        // Try to get from cache
        const cached = await this.cache.get(key);
        if (cached) {
          logger.debug('Cache hit:', { key });
          return cached;
        }

        // If not in cache, execute original method
        const result = await originalMethod.apply(this, args);
        
        // Cache the result
        if (result) {
          await this.cache.set(key, result, ttl);
        }

        return result;
      };

      return descriptor;
    };
  }

  // Batch operations
  async mget(keys) {
    try {
      const values = await this.redis.client.mget(
        keys.map(key => this.getKey(key))
      );
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValues, ttl = null) {
    try {
      const pipeline = this.redis.client.pipeline();
      
      for (const [key, value] of Object.entries(keyValues)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.set(this.getKey(key), serialized, 'EX', ttl);
        } else {
          pipeline.set(this.getKey(key), serialized);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  // Cache warming
  async warmUp(items, keyFn, ttl = null) {
    try {
      const keyValues = {};
      for (const item of items) {
        const key = keyFn(item);
        keyValues[key] = item;
      }
      
      await this.mset(keyValues, ttl);
      return true;
    } catch (error) {
      logger.error('Cache warm up error:', error);
      return false;
    }
  }

  // Cache invalidation strategies
  async invalidateEntity(entityId, relatedPatterns = []) {
    try {
      const pipeline = this.redis.client.pipeline();
      
      // Delete the main entity cache
      pipeline.del(this.getKey(entityId));
      
      // Delete related pattern caches
      for (const pattern of relatedPatterns) {
        pipeline.del(this.getKey(pattern));
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.redis.client.ping();
      return true;
    } catch (error) {
      logger.error('Cache health check error:', error);
      return false;
    }
  }
}

// Create cache instances for different entities
const cacheInstances = {
  user: new CacheService('user'),
  profile: new CacheService('profile'),
  role: new CacheService('role'),
  permission: new CacheService('permission')
};

module.exports = {
  CacheService,
  ...cacheInstances
};
