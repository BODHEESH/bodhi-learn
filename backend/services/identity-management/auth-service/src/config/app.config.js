// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\config\app.config.js
const config = {
  service: {
    name: process.env.SERVICE_NAME || 'auth-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port: process.env.PORT || 3001
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    prefix: process.env.REDIS_PREFIX || 'auth_service',
    db: parseInt(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    exchange: process.env.RABBITMQ_EXCHANGE || 'auth_events',
    queue: process.env.RABBITMQ_QUEUE || 'auth_service_queue'
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM || 'no-reply@bodhilearn.com',
    replyTo: process.env.EMAIL_REPLY_TO
  },
  security: {
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    passwordMaxLength: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
    hashRounds: parseInt(process.env.PASSWORD_HASH_ROUNDS) || 12,
    passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/,
    mfa: {
      issuer: process.env.MFA_ISSUER || 'Bodhi Learn',
      digits: parseInt(process.env.MFA_TOKEN_LENGTH) || 6,
      window: parseInt(process.env.MFA_TOKEN_WINDOW) || 1,
      backupCodesCount: parseInt(process.env.MFA_BACKUP_CODES_COUNT) || 10
    },
    rateLimits: {
      login: {
        windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        max: parseInt(process.env.LOGIN_RATE_LIMIT) || 5
      },
      refresh: {
        windowMs: parseInt(process.env.REFRESH_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
        max: parseInt(process.env.REFRESH_RATE_LIMIT) || 100
      }
    }
  },
  services: {
    user: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:3002'
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'
    }
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: process.env.LOG_FILE || 'auth-service.log'
  }
};

module.exports = config;
