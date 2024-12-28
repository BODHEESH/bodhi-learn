// security.config.js// security.config.js
const helmet = require('helmet');
const redis = require('redis');
const jwt = require('jsonwebtoken');

// Redis client for caching
const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD
});

// Cache configuration
const cacheConfig = {
    ttl: {
        courses: 3600, // 1 hour
        userProfile: 1800, // 30 minutes
        contentMetadata: 7200 // 2 hours
    },
    invalidationPatterns: {
        userUpdate: ['user:*', 'profile:*'],
        courseUpdate: ['course:*', 'module:*'],
        contentUpdate: ['content:*']
    }
};

// Security configuration
const securityConfig = {
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        referrerPolicy: { policy: 'same-origin' }
    },
    cors: {
        origin: process.env.ALLOWED_ORIGINS.split(','),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
        refreshToken: {
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: '7d'
        }
    }
};

// Cache middleware
const cacheMiddleware = (type) => async (req, res, next) => {
    const key = `${type}:${req.params.id}`;

    try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Attach cache function to response object
        res.setCache = async (data) => {
            await redisClient.setEx(
                key,
                cacheConfig.ttl[type],
                JSON.stringify(data)
            );
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Cache invalidation helper
const invalidateCache = async (pattern) => {
    const patterns = cacheConfig.invalidationPatterns[pattern];
    if (!patterns) return;

    for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    }
};

module.exports = {
    securityConfig,
    cacheConfig,
    cacheMiddleware,
    invalidateCache,
    redisClient
};