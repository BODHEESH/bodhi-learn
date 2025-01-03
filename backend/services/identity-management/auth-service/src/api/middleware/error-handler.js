// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\error-handler.js

const { BaseError } = require('../../utils/errors');
const logger = require('../../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't expose internal server errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(500).json({
    status: 'error',
    message
  });
};

module.exports = { errorHandler };
