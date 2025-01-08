require('dotenv').config();

module.exports = {
    app: {
        name: 'learning-management-service',
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
    },
    database: {
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/bodhi-learn',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: process.env.NODE_ENV !== 'production'
        }
    },
    services: {
        notification: {
            url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001',
            apiKey: process.env.NOTIFICATION_SERVICE_API_KEY
        },
        moderation: {
            url: process.env.MODERATION_SERVICE_URL || 'http://localhost:3002',
            apiKey: process.env.MODERATION_SERVICE_API_KEY
        },
        recommendation: {
            url: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3003',
            apiKey: process.env.RECOMMENDATION_SERVICE_API_KEY
        }
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiration: process.env.JWT_EXPIRATION || '24h'
    },
    cache: {
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            ttl: process.env.REDIS_TTL || 3600
        }
    },
    media: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf']
    },
    features: {
        enableModeration: process.env.ENABLE_MODERATION === 'true',
        enableRecommendations: process.env.ENABLE_RECOMMENDATIONS === 'true',
        enableNotifications: process.env.ENABLE_NOTIFICATIONS === 'true'
    }
};
