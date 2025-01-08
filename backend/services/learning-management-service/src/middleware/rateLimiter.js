const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false
});

/**
 * Create a rate limiter with custom options
 * @param {Object} options
 * @returns {Function}
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100, // Limit each IP to 100 requests per windowMs
        message = 'Too many requests, please try again later.',
        statusCode = httpStatus.TOO_MANY_REQUESTS,
        keyGenerator = (req) => {
            // Generate key based on IP and user ID (if authenticated)
            return `${req.ip}:${req.user?.id || 'anonymous'}`;
        }
    } = options;

    return rateLimit({
        store: new RedisStore({
            client: redisClient,
            prefix: 'rate-limit:'
        }),
        windowMs,
        max,
        message: {
            status: 'error',
            code: statusCode,
            message
        },
        keyGenerator,
        handler: (req, res, next) => {
            next(new ApiError(statusCode, message));
        }
    });
};

// Rate limiter for API endpoints
const apiLimiter = createRateLimiter();

// Stricter rate limiter for authentication endpoints
const authLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 requests per hour
});

// Rate limiter for file uploads
const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50 // 50 uploads per hour
});

// Rate limiter for content creation
const contentCreationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100 // 100 content creations per hour
});

// Rate limiter for media processing
const mediaProcessingLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20 // 20 media processing requests per hour
});

// Organization-specific rate limiter
const organizationLimiter = createRateLimiter({
    keyGenerator: (req) => {
        return `org:${req.user?.organizationId}:${req.ip}`;
    },
    max: 1000, // 1000 requests per 15 minutes per organization
    message: 'Organization request limit exceeded.'
});

module.exports = {
    apiLimiter,
    authLimiter,
    uploadLimiter,
    contentCreationLimiter,
    mediaProcessingLimiter,
    organizationLimiter,
    createRateLimiter
};
