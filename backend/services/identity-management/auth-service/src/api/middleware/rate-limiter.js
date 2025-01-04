// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\rate-limiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../services/redis.service');
const logger = require('../utils/logger');

const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.client.call(...args)
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: options.max || 100, // Default: 100 requests per windowMs
    message: {
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: options.message || 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        limit: options.max,
        window: options.windowMs
      });
      res.status(429).json({
        status: 'error',
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests, please try again later.'
      });
    }
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Login attempts limiter
const loginLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

// Password reset limiter
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.'
});

// MFA verification limiter
const mfaVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many MFA verification attempts, please try again later.'
});

module.exports = {
  apiLimiter,
  loginLimiter,
  passwordResetLimiter,
  mfaVerifyLimiter
};
