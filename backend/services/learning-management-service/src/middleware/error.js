const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const metrics = require('../utils/metrics');

const errorConverter = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode =
            error.statusCode || error instanceof mongoose.Error
                ? httpStatus.BAD_REQUEST
                : httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, false, err.stack);
    }
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    
    // Handle validation errors
    if (err instanceof mongoose.Error.ValidationError) {
        statusCode = httpStatus.BAD_REQUEST;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        statusCode = httpStatus.CONFLICT;
        message = 'Duplicate key error';
    }

    // Record error metrics
    metrics.recordApiError(req.method, req.originalUrl, statusCode);

    // Log error
    if (statusCode >= 500) {
        logger.error({
            requestId: req.id,
            error: err.message,
            stack: err.stack,
            context: {
                method: req.method,
                url: req.originalUrl,
                body: req.body,
                params: req.params,
                query: req.query,
                user: req.user?.id,
                organization: req.context?.organizationId,
                tenant: req.context?.tenantId
            }
        });
    }

    res.status(statusCode).send({
        status: 'error',
        code: statusCode,
        message,
        ...(config.env === 'development' && {
            stack: err.stack
        })
    });
};

module.exports = {
    errorConverter,
    errorHandler
};
