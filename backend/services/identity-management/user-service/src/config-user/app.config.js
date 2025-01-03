// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\config\app.config.js

const config = {
    service: {
      name: 'user-service',
      version: '1.0.0',
      port: process.env.PORT || 3002
    },
    databases: {
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'bodhi_users',
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD,
        dialect: 'postgres',
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bodhi_users',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      prefix: 'user_service:'
    },
    security: {
      bcryptRounds: 12,
      passwordMinLength: 8,
      passwordMaxLength: 128,
      passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/
    },
    storage: {
      avatarSizeLimit: 5 * 1024 * 1024, // 5MB
      avatarAllowedTypes: ['image/jpeg', 'image/png'],
      avatarDimensions: {
        width: 200,
        height: 200
      }
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchanges: {
        user: 'user-exchange'
      },
      queues: {
        userEvents: 'user-events'
      }
    },
    services: {
      auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
      },
      tenant: {
        url: process.env.TENANT_SERVICE_URL || 'http://localhost:3003'
      }
    },
    cache: {
      ttl: {
        user: 3600, // 1 hour
        profile: 3600,
        role: 7200 // 2 hours
      }
    }
  };
  
  module.exports = config;
  