// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\config\index.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  app: {
    name: 'organization-service',
    version: '1.0.0',
    port: parseInt(process.env.PORT || '3000'),
    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api/v1'
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10')
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileLevel: process.env.FILE_LOG_LEVEL || 'info',
    consoleLevel: process.env.CONSOLE_LOG_LEVEL || 'debug'
  },

  services: {
    tenant: {
      baseUrl: process.env.TENANT_SERVICE_URL || 'http://localhost:3001',
      apiKey: process.env.TENANT_SERVICE_API_KEY
    },
    user: {
      baseUrl: process.env.USER_SERVICE_URL || 'http://localhost:3002',
      apiKey: process.env.USER_SERVICE_API_KEY
    },
    auth: {
      baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3003',
      apiKey: process.env.AUTH_SERVICE_API_KEY
    }
  },

  cache: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'org:'
    }
  },

  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true
  },

  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100') // limit each IP to 100 requests per windowMs
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    enableRequestSigning: process.env.ENABLE_REQUEST_SIGNING === 'true',
    requestSigningKey: process.env.REQUEST_SIGNING_KEY
  },

  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics'
  },

  validation: {
    organization: {
      nameMinLength: parseInt(process.env.ORG_NAME_MIN_LENGTH || '2'),
      nameMaxLength: parseInt(process.env.ORG_NAME_MAX_LENGTH || '100'),
      codeMinLength: parseInt(process.env.ORG_CODE_MIN_LENGTH || '2'),
      codeMaxLength: parseInt(process.env.ORG_CODE_MAX_LENGTH || '20')
    },
    branch: {
      nameMinLength: parseInt(process.env.BRANCH_NAME_MIN_LENGTH || '2'),
      nameMaxLength: parseInt(process.env.BRANCH_NAME_MAX_LENGTH || '100'),
      codeMinLength: parseInt(process.env.BRANCH_CODE_MIN_LENGTH || '2'),
      codeMaxLength: parseInt(process.env.BRANCH_CODE_MAX_LENGTH || '20')
    },
    department: {
      nameMinLength: parseInt(process.env.DEPT_NAME_MIN_LENGTH || '2'),
      nameMaxLength: parseInt(process.env.DEPT_NAME_MAX_LENGTH || '100'),
      codeMinLength: parseInt(process.env.DEPT_CODE_MIN_LENGTH || '2'),
      codeMaxLength: parseInt(process.env.DEPT_CODE_MAX_LENGTH || '20')
    }
  }
};
