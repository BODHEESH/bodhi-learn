
// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\utils\redis.service.js
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
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async setRefreshToken(token, data, expirySeconds = 7 * 24 * 60 * 60) {
    const key = `refresh_token:${token}`;
    await this.client.setex(key, expirySeconds, JSON.stringify(data));
  }

  async getRefreshToken(token) {
    const key = `refresh_token:${token}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteRefreshToken(token) {
    const key = `refresh_token:${token}`;
    await this.client.del(key);
  }

  async close() {
    await this.client.quit();
  }
}

module.exports = { RedisService };
