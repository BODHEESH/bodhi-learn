// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\error-handler.js

const { ValidationError, NotFoundError, AuthError } = require('../../utils/errors');
const logger = require('../../utils/logger');

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

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: err.message
    });
  }

  if (err instanceof AuthError) {
    return res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: err.message
    });
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      status: 'error',
      code: 'DUPLICATE_ERROR',
      message: 'Duplicate entry',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // MongoDB errors
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({
      status: 'error',
      code: 'DUPLICATE_ERROR',
      message: 'Duplicate entry'
    });
  }

  // Default error
  return res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

module.exports = {
  errorHandler
};
