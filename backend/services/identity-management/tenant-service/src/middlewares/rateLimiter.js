// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\middlewares\rateLimiter.js

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // Limit each IP to 100 requests per windowMs
  message = 'Too many requests from this IP, please try again later',
  path = '*'
} = {}) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max,
    message: new ApiError(httpStatus.TOO_MANY_REQUESTS, message),
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1', // Skip rate limiting for localhost
    keyGenerator: (req) => {
      // Use tenant ID if available, otherwise use IP
      return req.tenant ? `tenant:${req.tenant.id}` : req.ip;
    }
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  api: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'API rate limit exceeded'
  }),
  auth: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    path: '/auth/*'
  }),
  backup: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Backup operation rate limit exceeded',
    path: '/*/backup'
  })
};

module.exports = rateLimiters;
