// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\utils\logger.js

const winston = require('winston');
const config = require('../config/app.config');
const path = require('path');

// Custom log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length ? 
    JSON.stringify(metadata, null, 2) : '';
  
  return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
});

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!require('fs').existsSync(logsDir)) {
  require('fs').mkdirSync(logsDir);
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    logFormat
  ),
  defaultMeta: { 
    service: config.service.name,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Security logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ],
  exitOnError: false
});

// Development logging
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    handleRejections: true,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        const metaString = Object.keys(metadata).length ? 
          `\n${JSON.stringify(metadata, null, 2)}` : '';
        return `${timestamp} ${level}: ${message}${metaString}`;
      })
    )
  }));
}

// Add request logging middleware
logger.requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
};

// Add error logging middleware
logger.errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: {
      message: err.message,
      stack: err.stack,
      ...err
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      query: req.query,
      body: req.body
    }
  });
  next(err);
};

module.exports = logger;
