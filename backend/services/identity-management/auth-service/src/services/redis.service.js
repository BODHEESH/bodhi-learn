  // \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\redis.service.js

  const Redis = require('ioredis');
  const config = require('../config/app.config');

  class RedisService {
    constructor() {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('error', (error) => {
        console.error('Redis Client Error:', error);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });
    }

    async setRefreshToken(token, userData, expiryInSeconds = 7 * 24 * 60 * 60) {
      try {
        await this.client.set(
          `refresh_token:${token}`,
          JSON.stringify(userData),
          'EX',
          expiryInSeconds
        );
      } catch (error) {
        console.error('Error setting refresh token:', error);
        throw error;
      }
    }

    async getRefreshToken(token) {
      try {
        const data = await this.client.get(`refresh_token:${token}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error getting refresh token:', error);
        throw error;
      }
    }

    async deleteRefreshToken(token) {
      try {
        await this.client.del(`refresh_token:${token}`);
      } catch (error) {
        console.error('Error deleting refresh token:', error);
        throw error;
      }
    }

    async close() {
      await this.client.quit();
    }
  }

  module.exports = { RedisService };
