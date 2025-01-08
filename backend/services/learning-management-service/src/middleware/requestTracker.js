const { v4: uuidv4 } = require('uuid');
const metrics = require('../utils/metrics');
const logger = require('../config/logger');

/**
 * Request tracking middleware
 * Adds request tracking, timing, and metrics collection
 */
const requestTracker = () => {
    return (req, res, next) => {
        // Add request ID
        req.id = uuidv4();

        // Add timestamp
        req.timestamp = Date.now();

        // Add organization and tenant context
        req.context = {
            organizationId: req.user?.organizationId,
            tenantId: req.user?.tenantId
        };

        // Store original URL for metrics
        const route = req.originalUrl.split('?')[0];

        // Track response
        const cleanup = () => {
            res.removeListener('finish', onFinish);
            res.removeListener('error', onError);
        };

        const onFinish = () => {
            cleanup();
            const duration = (Date.now() - req.timestamp) / 1000; // Convert to seconds

            // Record API metrics
            metrics.recordApiLatency(req.method, route, res.statusCode, duration);

            if (res.statusCode >= 400) {
                metrics.recordApiError(req.method, route, res.statusCode);
            }

            // Log request details
            logger.info({
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}s`,
                userAgent: req.get('user-agent'),
                ip: req.ip,
                organization: req.context.organizationId,
                tenant: req.context.tenantId
            });
        };

        const onError = (error) => {
            cleanup();
            logger.error({
                requestId: req.id,
                method: req.method,
                url: req.originalUrl,
                error: error.message,
                stack: error.stack,
                organization: req.context.organizationId,
                tenant: req.context.tenantId
            });
        };

        res.on('finish', onFinish);
        res.on('error', onError);

        next();
    };
};

module.exports = requestTracker;
