// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\rate-limiter.js

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../../services/redis.service');

// Create a limiter for general API endpoints
const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.client.call(...args)
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create a stricter limiter for user creation
const createUserLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.client.call(...args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 user creations per windowMs
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many user creation attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Create a limiter for role management
const roleManagementLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redis.client.call(...args)
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 role management requests per windowMs
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many role management requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  createUserLimiter,
  roleManagementLimiter
};
