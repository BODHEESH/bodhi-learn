// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\logger\index.js

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('../../config');

// Custom format for log messages
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Configure log file transport with daily rotation
const fileTransport = new DailyRotateFile({
  filename: 'logs/organization-service-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: config.logging.fileLevel || 'info'
});

// Configure console transport
const consoleTransport = new winston.transports.Console({
  level: config.logging.consoleLevel || 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  )
});

// Create the logger instance
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: customFormat,
  defaultMeta: { service: 'organization-service' },
  transports: [fileTransport, consoleTransport]
});

// Add request context middleware
logger.requestContext = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  const context = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id
  };

  // Attach context to request for use in other middleware/handlers
  req.context = context;

  // Create a request-scoped logger
  req.logger = logger.child(context);

  // Log request
  req.logger.info('Incoming request', {
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body)
  });

  // Log response
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    req.logger.info('Request completed', {
      statusCode: res.statusCode,
      duration
    });
  });

  next();
};

// Helper function to generate request ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to sanitize sensitive data from request body
function sanitizeRequestBody(body) {
  if (!body) return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

// Add custom logging methods
logger.audit = (message, data) => {
  logger.info(message, { ...data, audit: true });
};

logger.metric = (name, value, tags = {}) => {
  logger.info('Metric recorded', {
    metric: true,
    name,
    value,
    tags
  });
};

logger.security = (message, data) => {
  logger.warn(message, { ...data, security: true });
};

// Error logging with stack trace
logger.logError = (error, context = {}) => {
  const errorData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    ...context
  };

  if (error.response) {
    errorData.response = {
      status: error.response.status,
      data: error.response.data
    };
  }

  logger.error('Error occurred', errorData);
};

// Performance logging
logger.startTimer = (label) => {
  const startTime = process.hrtime();
  return {
    end: () => {
      const diff = process.hrtime(startTime);
      const duration = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
      logger.info(`${label} completed`, { duration, performance: true });
      return duration;
    }
  };
};

module.exports = logger;
