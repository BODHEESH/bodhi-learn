const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('../config/config');
const logger = require('../config/logger');

class SecurityManager {
    constructor() {
        this.setupSecurityConfig();
    }

    setupSecurityConfig() {
        this.config = {
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100 // limit each IP to 100 requests per windowMs
            },
            csrf: {
                enabled: true,
                ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
                cookieOptions: {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict'
                }
            },
            cors: {
                origin: config.security.allowedOrigins,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                allowedHeaders: ['Content-Type', 'Authorization'],
                credentials: true
            },
            helmet: {
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
                xssFilter: true,
                noSniff: true,
                referrerPolicy: { policy: 'same-origin' }
            }
        };
    }

    getMiddleware() {
        return {
            // Rate limiting
            rateLimiter: rateLimit(this.config.rateLimit),

            // Security headers
            helmet: helmet(this.config.helmet),

            // Parameter pollution protection
            hpp: hpp(),

            // XSS protection
            xss: xss(),

            // MongoDB query sanitization
            mongoSanitize: mongoSanitize(),

            // Custom security middleware
            securityHeaders: this.securityHeaders.bind(this),
            validateInput: this.validateInput.bind(this),
            auditLog: this.auditLog.bind(this)
        };
    }

    securityHeaders(req, res, next) {
        // Set security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
    }

    validateInput(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid input data',
                    details: error.details.map(detail => detail.message)
                });
            }
            next();
        };
    }

    auditLog(req, res, next) {
        const startTime = Date.now();
        
        // Log request
        logger.info({
            type: 'request',
            method: req.method,
            path: req.path,
            ip: req.ip,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });

        // Log response
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            logger.info({
                type: 'response',
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                userId: req.user?.id,
                timestamp: new Date().toISOString()
            });
        });

        next();
    }

    hashData(data) {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }

    encryptData(data, key = config.security.encryptionKey) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag: authTag.toString('hex')
        };
    }

    decryptData(encryptedData, key = config.security.encryptionKey) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    validateToken(token) {
        try {
            // Add additional token validation logic here
            return true;
        } catch (error) {
            logger.error('Token validation error:', error);
            return false;
        }
    }

    sanitizeData(data) {
        if (typeof data !== 'object') return data;

        const sanitized = Array.isArray(data) ? [] : {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeData(value);
            } else if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    sanitizeString(str) {
        return str
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }

    generateSecureId(prefix = '') {
        return `${prefix}${crypto.randomBytes(16).toString('hex')}`;
    }
}

module.exports = new SecurityManager();
