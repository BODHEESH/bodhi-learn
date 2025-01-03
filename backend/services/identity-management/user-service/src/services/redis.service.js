// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\redis.service.js

const Redis = require('ioredis');
const config = require('../config/app.config');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      keyPrefix: config.redis.prefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    this.client.on('close', () => {
      logger.info('Redis Client Connection Closed');
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? value : null;
    } catch (error) {
      logger.error('Redis Get Error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (ttl) {
        await this.client.set(key, value, 'EX', ttl);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis Set Error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis Delete Error:', error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis Delete Pattern Error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis Exists Error:', error);
      return false;
    }
  }

  async incr(key) {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis Increment Error:', error);
      return null;
    }
  }

  async expire(key, seconds) {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis Expire Error:', error);
      return false;
    }
  }

  async ttl(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL Error:', error);
      return -1;
    }
  }

  // Hash operations
  async hset(key, field, value) {
    try {
      return await this.client.hset(key, field, value);
    } catch (error) {
      logger.error('Redis Hash Set Error:', error);
      return false;
    }
  }

  async hget(key, field) {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      logger.error('Redis Hash Get Error:', error);
      return null;
    }
  }

  async hdel(key, field) {
    try {
      return await this.client.hdel(key, field);
    } catch (error) {
      logger.error('Redis Hash Delete Error:', error);
      return false;
    }
  }

  // List operations
  async lpush(key, value) {
    try {
      return await this.client.lpush(key, value);
    } catch (error) {
      logger.error('Redis List Push Error:', error);
      return false;
    }
  }

  async rpop(key) {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      logger.error('Redis List Pop Error:', error);
      return null;
    }
  }

  // Set operations
  async sadd(key, member) {
    try {
      return await this.client.sadd(key, member);
    } catch (error) {
      logger.error('Redis Set Add Error:', error);
      return false;
    }
  }

  async srem(key, member) {
    try {
      return await this.client.srem(key, member);
    } catch (error) {
      logger.error('Redis Set Remove Error:', error);
      return false;
    }
  }

  async smembers(key) {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Redis Set Members Error:', error);
      return [];
    }
  }

  // Connection management
  async disconnect() {
    try {
      await this.client.quit();
      logger.info('Redis Client Disconnected');
    } catch (error) {
      logger.error('Redis Disconnect Error:', error);
    }
  }
}

module.exports = {
  RedisService,
  redis: new RedisService() // Export singleton instance
};
