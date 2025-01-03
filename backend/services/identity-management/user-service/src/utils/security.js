// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\security.js

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const csrf = require('csurf');
const hpp = require('hpp');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/app.config');
const logger = require('./logger');
const { metrics } = require('./metrics');

// Security middleware configuration
const securityMiddleware = {
  // Enhanced Helmet configuration
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    expectCt: {
      enforce: true,
      maxAge: 30,
      reportUri: config.security.reportUri
    },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  }),

  // Enhanced CORS configuration
  cors: cors({
    origin: config.security.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 600
  }),

  // Rate limiting with different tiers
  rateLimiter: {
    standard: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    }),
    auth: rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    }),
    api: rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'API rate limit exceeded, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.ip
    })
  },

  // CSRF protection
  csrf: csrf({
    cookie: {
      key: '_csrf',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  }),

  // HTTP Parameter Pollution protection
  hpp: hpp(),

  // Request ID middleware
  requestId: (req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
  }
};

// Security utilities
const securityUtils = {
  // Input sanitization
  sanitizeInput: (input) => {
    // Implement input sanitization logic
    return input.replace(/[<>]/g, '');
  },

  // IP filtering
  ipFilter: (req, res, next) => {
    const clientIp = req.ip;
    if (config.security.blacklistedIPs.includes(clientIp)) {
      logger.warn('Blocked request from blacklisted IP', { ip: clientIp });
      metrics.securityEvents.inc({ type: 'ip_blocked' });
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  },

  // JWT token verification with additional security
  verifyToken: (token) => {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });

      // Check token in blacklist
      if (redis.exists(`blacklist:${token}`)) {
        throw new Error('Token has been revoked');
      }

      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      metrics.securityEvents.inc({ type: 'token_verification_failed' });
      throw error;
    }
  },

  // Password strength validation
  validatePassword: (password) => {
    const requirements = {
      minLength: 12,
      hasUpperCase: /[A-Z]/,
      hasLowerCase: /[a-z]/,
      hasNumbers: /\d/,
      hasSpecialChar: /[!@#$%^&*]/
    };

    const errors = [];

    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`);
    }
    if (!requirements.hasUpperCase.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!requirements.hasLowerCase.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!requirements.hasNumbers.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!requirements.hasSpecialChar.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Security headers check middleware
  securityHeadersCheck: (req, res, next) => {
    const requiredHeaders = ['user-agent', 'host'];
    const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);

    if (missingHeaders.length > 0) {
      logger.warn('Request missing required headers', { missingHeaders });
      metrics.securityEvents.inc({ type: 'missing_headers' });
      return res.status(400).json({ error: 'Missing required headers' });
    }

    next();
  },

  // SQL injection prevention
  preventSQLInjection: (value) => {
    // Remove SQL injection patterns
    return value.replace(/['";\\]/g, '');
  },

  // Security event logging
  logSecurityEvent: (event) => {
    logger.warn('Security event detected', event);
    metrics.securityEvents.inc({ type: event.type });
  }
};

// Security monitoring
const securityMonitoring = {
  // Monitor failed login attempts
  trackFailedLogins: (userId, ip) => {
    const key = `failed_logins:${userId}`;
    redis.incr(key);
    redis.expire(key, 3600); // Expire after 1 hour

    redis.get(key).then(attempts => {
      if (parseInt(attempts) >= 5) {
        logger.warn('Multiple failed login attempts detected', { userId, ip });
        metrics.securityEvents.inc({ type: 'multiple_failed_logins' });
      }
    });
  },

  // Monitor suspicious activities
  trackSuspiciousActivity: (userId, activity) => {
    logger.warn('Suspicious activity detected', { userId, activity });
    metrics.securityEvents.inc({ type: 'suspicious_activity' });
  }
};

module.exports = {
  securityMiddleware,
  securityUtils,
  securityMonitoring
};
