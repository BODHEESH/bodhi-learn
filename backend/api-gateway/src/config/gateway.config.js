// gateway.config.js
const rateLimit = require('express-rate-limit');
const circuitBreaker = require('opossum');
const axios = require('axios');

// Rate limiting configuration
const rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    message: 'Too many requests from this IP, please try again later.',
    // Different limits for different endpoints
    endpoints: {
        '/api/auth/*': {
            windowMs: 15 * 60 * 1000,
            max: 5 // Stricter limit for auth endpoints
        },
        '/api/content/*': {
            windowMs: 15 * 60 * 1000,
            max: 200 // More lenient for content endpoints
        }
    }
};

// Circuit breaker configuration
const breakerConfig = {
    timeout: 3000, // 3 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30 seconds
    // Configure different thresholds for different services
    services: {
        'user-service': {
            errorThreshold: 40,
            timeout: 2000
        },
        'course-service': {
            errorThreshold: 60,
            timeout: 4000
        }
    }
};

// API versioning configuration
const versionConfig = {
    defaultVersion: '1',
    versions: ['1', '2'],
    deprecated: [],
    versionExtractor: (req) => {
        return req.headers['accept-version'] || 'v1';
    }
};

// Service registry configuration
const serviceRegistry = {
    services: {
        'user-service': {
            versions: {
                'v1': 'http://user-service:3001/v1',
                'v2': 'http://user-service:3001/v2'
            }
        },
        'course-service': {
            versions: {
                'v1': 'http://course-service:3002/v1'
            }
        }
    }
};

// Create circuit breaker wrapper
const createServiceBreaker = (service) => {
    const config = breakerConfig.services[service] || breakerConfig;
    return new circuitBreaker(async function (endpoint) {
        const response = await axios.get(endpoint);
        return response.data;
    }, config);
};

module.exports = {
    rateLimitConfig,
    breakerConfig,
    versionConfig,
    serviceRegistry,
    createServiceBreaker
};