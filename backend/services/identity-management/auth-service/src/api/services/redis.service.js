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
      const key = `refresh_token:${token}`;
      const userKey = `user_tokens:${userData.userId}`;

      // Store token data
      await this.client.set(
        key,
        JSON.stringify(userData),
        'EX',
        expiryInSeconds
      );

      // Add token to user's set of tokens
      await this.client.sadd(userKey, token);
      await this.client.expire(userKey, expiryInSeconds);
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
      const data = await this.getRefreshToken(token);
      if (data) {
        const userKey = `user_tokens:${data.userId}`;
        await Promise.all([
          this.client.del(`refresh_token:${token}`),
          this.client.srem(userKey, token)
        ]);
      }
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      throw error;
    }
  }

  async deleteUserRefreshTokens(userId) {
    try {
      const userKey = `user_tokens:${userId}`;
      const tokens = await this.client.smembers(userKey);

      // Delete all refresh tokens and the user's token set
      const pipeline = this.client.pipeline();
      tokens.forEach(token => {
        pipeline.del(`refresh_token:${token}`);
      });
      pipeline.del(userKey);

      await pipeline.exec();
    } catch (error) {
      console.error('Error deleting user refresh tokens:', error);
      throw error;
    }
  }

  async setResetToken(token, userId, expiryInSeconds = 3600) {
    try {
      const key = `reset_token:${token}`;
      await this.client.set(key, userId, 'EX', expiryInSeconds);
    } catch (error) {
      console.error('Error setting reset token:', error);
      throw error;
    }
  }

  async getResetToken(token) {
    try {
      return await this.client.get(`reset_token:${token}`);
    } catch (error) {
      console.error('Error getting reset token:', error);
      throw error;
    }
  }

  async deleteResetToken(token) {
    try {
      await this.client.del(`reset_token:${token}`);
    } catch (error) {
      console.error('Error deleting reset token:', error);
      throw error;
    }
  }

  async setTempMFADetails(userId, mfaDetails, expiryInSeconds = 600) {
    try {
      const key = `mfa_setup:${userId}`;
      await this.client.set(
        key,
        JSON.stringify(mfaDetails),
        'EX',
        expiryInSeconds
      );
    } catch (error) {
      console.error('Error setting MFA details:', error);
      throw error;
    }
  }

  async getTempMFADetails(userId) {
    try {
      const data = await this.client.get(`mfa_setup:${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting MFA details:', error);
      throw error;
    }
  }

  async deleteTempMFADetails(userId) {
    try {
      await this.client.del(`mfa_setup:${userId}`);
    } catch (error) {
      console.error('Error deleting MFA details:', error);
      throw error;
    }
  }

  async setRateLimitKey(key, attempts, expiryInSeconds = 300) {
    try {
      const exists = await this.client.exists(key);
      if (!exists) {
        await this.client.set(key, attempts, 'EX', expiryInSeconds);
      } else {
        await this.client.incr(key);
      }
    } catch (error) {
      console.error('Error setting rate limit:', error);
      throw error;
    }
  }

  async getRateLimitAttempts(key) {
    try {
      const attempts = await this.client.get(key);
      return attempts ? parseInt(attempts) : 0;
    } catch (error) {
      console.error('Error getting rate limit attempts:', error);
      throw error;
    }
  }

  async close() {
    await this.client.quit();
  }
}

module.exports = { RedisService };
