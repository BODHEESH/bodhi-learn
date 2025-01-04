// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\error-handler.js

const { ValidationError, AuthError } = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id
  });

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof AuthError) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: err.message
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    });
  }

  // Default error response
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
};

module.exports = {
  errorHandler
};
