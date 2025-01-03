// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\rate-limiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { RedisService } = require('../../services/redis.service');

const redisClient = new RedisService().client;

const limiters = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: 'Too many login attempts, please try again later'
  },
  refresh: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 refresh attempts per IP
    message: 'Too many refresh token attempts, please try again later'
  }
};

const rateLimiter = (type) => {
  const config = limiters[type] || limiters.login;

  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `rate-limit:${type}:`
    }),
    windowMs: config.windowMs,
    max: config.max,
    message: { error: config.message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = { rateLimiter };
