const Redis = require('ioredis');
const config = require('../config/app.config');
const logger = require('../utils/logger');
const { RedisError } = require('../utils/errors');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeClient();
  }

  initializeClient() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db || 0,
      keyPrefix: 'auth:',
      retryStrategy: (times) => {
        const maxRetryDelay = 2000;
        const delay = Math.min(times * 50, maxRetryDelay);
        logger.warn('Redis connection retry', { attempt: times, delay });
        return delay;
      },
      reconnectOnError: (err) => {
        logger.error('Redis reconnect error:', err);
        return true;
      }
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Connected to Redis');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', (delay) => {
      logger.info('Reconnecting to Redis...', { delay });
    });
  }

  async checkConnection() {
    if (!this.isConnected) {
      throw new RedisError('Redis connection is not available');
    }
  }

  async setRefreshToken(token, userData, expiryInSeconds = 7 * 24 * 60 * 60) {
    await this.checkConnection();
    
    try {
      const key = `refresh_token:${token}`;
      await this.client.set(
        key,
        JSON.stringify(userData),
        'EX',
        expiryInSeconds
      );
      
      logger.debug('Refresh token stored', { 
        userId: userData.userId,
        expiryInSeconds 
      });
    } catch (error) {
      logger.error('Error setting refresh token:', error);
      throw new RedisError('Failed to store refresh token');
    }
  }

  async getRefreshToken(token) {
    await this.checkConnection();
    
    try {
      const key = `refresh_token:${token}`;
      const data = await this.client.get(key);
      
      if (!data) {
        logger.debug('Refresh token not found', { token });
        return null;
      }
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      throw new RedisError('Failed to retrieve refresh token');
    }
  }

  async deleteRefreshToken(token) {
    await this.checkConnection();
    
    try {
      const key = `refresh_token:${token}`;
      await this.client.del(key);
      logger.debug('Refresh token deleted', { token });
    } catch (error) {
      logger.error('Error deleting refresh token:', error);
      throw new RedisError('Failed to delete refresh token');
    }
  }

  async setMFASecret(userId, secret, expiryInSeconds = 5 * 60) {
    await this.checkConnection();
    
    try {
      const key = `mfa_secret:${userId}`;
      await this.client.set(
        key,
        secret,
        'EX',
        expiryInSeconds
      );
      logger.debug('MFA secret stored', { userId, expiryInSeconds });
    } catch (error) {
      logger.error('Error setting MFA secret:', error);
      throw new RedisError('Failed to store MFA secret');
    }
  }

  async getMFASecret(userId) {
    await this.checkConnection();
    
    try {
      const key = `mfa_secret:${userId}`;
      const secret = await this.client.get(key);
      return secret;
    } catch (error) {
      logger.error('Error getting MFA secret:', error);
      throw new RedisError('Failed to retrieve MFA secret');
    }
  }

  async clearUserSessions(userId) {
    await this.checkConnection();
    
    try {
      const pattern = `refresh_token:*`;
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        const data = await this.client.get(key);
        const userData = JSON.parse(data);
        
        if (userData.userId === userId) {
          await this.client.del(key);
        }
      }
      
      logger.info('User sessions cleared', { userId });
    } catch (error) {
      logger.error('Error clearing user sessions:', error);
      throw new RedisError('Failed to clear user sessions');
    }
  }

  async shutdown() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis connection closed gracefully');
      } catch (error) {
        logger.error('Error shutting down Redis:', error);
        this.client.disconnect();
      } finally {
        this.isConnected = false;
        this.client = null;
      }
    }
  }
}

// Create a singleton instance
const redisService = new RedisService();

module.exports = { redisService };
