const winston = require('winston');
const config = require('./config');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: config.app.logLevel,
    format: logFormat,
    defaultMeta: { service: config.app.name },
    transports: [
        // Write all logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add stream for Morgan middleware
logger.stream = {
    write: function(message) {
        logger.info(message.trim());
    }
};

// Create a separate logger for request logging
const requestLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: `${config.app.name}-requests` },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/requests.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add request logging middleware
const requestLoggerMiddleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        requestLogger.info({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
    });

    next();
};

module.exports = {
    logger,
    requestLogger,
    requestLoggerMiddleware
};
