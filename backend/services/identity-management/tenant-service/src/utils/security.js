// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\security.js

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('./logger');

class SecurityUtils {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.secretKey = config.security.encryptionKey;
    this.jwtSecret = config.security.jwtSecret;
  }

  // Encrypt sensitive data
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(64);
      const key = crypto.pbkdf2Sync(this.secretKey, salt, 2145, 32, 'sha512');
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(String(text), 'utf8'),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      return {
        content: encrypted.toString('hex'),
        tag: authTag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive data
  decrypt(encrypted) {
    try {
      const key = crypto.pbkdf2Sync(
        this.secretKey,
        Buffer.from(encrypted.salt, 'hex'),
        2145,
        32,
        'sha512'
      );

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(encrypted.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted.content, 'hex')),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  // Hash password
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(12);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  // Verify password
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification error:', error);
      throw new Error('Password verification failed');
    }
  }

  // Generate JWT token
  generateToken(payload, expiresIn = '24h') {
    try {
      return jwt.sign(payload, this.jwtSecret, { expiresIn });
    } catch (error) {
      logger.error('Token generation error:', error);
      throw new Error('Token generation failed');
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error('Token verification failed');
    }
  }

  // Generate secure random string
  generateSecureString(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      logger.error('Secure string generation error:', error);
      throw new Error('Secure string generation failed');
    }
  }

  // Sanitize data to prevent XSS
  sanitizeData(data) {
    if (typeof data !== 'string') return data;
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Rate limiting configuration
  getRateLimitConfig() {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    };
  }

  // CORS configuration
  getCorsConfig() {
    return {
      origin: config.security.allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: 86400 // 24 hours
    };
  }

  // Helmet configuration for security headers
  getHelmetConfig() {
    return {
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
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' }
    };
  }
}

module.exports = new SecurityUtils();
