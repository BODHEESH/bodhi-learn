// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\config\app.config.js

// Configuration for the Tenant Service
const config = {
    app: {
      name: 'tenant-service',
      version: '1.0.0',
      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3002,
      apiPrefix: '/api/v1'
    },
    database: {
      url: process.env.DATABASE_URL,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10
      }
    },
    mongodb: {
      url: process.env.MONGODB_URL,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    redis: {
      url: process.env.REDIS_URL,
      options: {
        retryStrategy: times => Math.min(times * 50, 2000)
      }
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL,
      exchanges: {
        tenant: 'tenant.events',
        user: 'user.events',
        billing: 'billing.events'
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h'
    },
    aws: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      backupBucket: process.env.AWS_BACKUP_BUCKET
    },
    monitoring: {
      prometheusPath: '/metrics',
      healthCheckPath: '/health'
    },
    security: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000'],
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 100
      }
    },
    backup: {
      schedule: '0 0 * * *', // Daily at midnight
      retention: 30, // Days
      path: './backups'
    },
    services: {
      user: {
        url: process.env.USER_SERVICE_URL || 'http://user-service:3001',
        timeout: 5000
      },
      auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3000',
        timeout: 5000
      },
      billing: {
        url: process.env.BILLING_SERVICE_URL || 'http://billing-service:3003',
        timeout: 5000
      }
    }
  };
  
  module.exports = config;
  