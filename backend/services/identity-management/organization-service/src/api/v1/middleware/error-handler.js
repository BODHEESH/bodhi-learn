// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\middleware\error-handler.js

const { CustomError } = require('../../../utils/errors/custom-error');
const logger = require('../../../utils/logger');
const { ValidationError } = require('sequelize');
const { ValidationError: JoiValidationError } = require('joi');

// Handle 404 errors for undefined routes
function notFoundHandler(req, res, next) {
  const error = new CustomError('NOT_FOUND', 'Resource not found', 404);
  next(error);
}

// Global error handler
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Error:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? { id: req.user.id } : null
  });

  // Handle different types of errors
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    const validationErrors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        data: validationErrors
      }
    });
  }

  // Handle Joi validation errors
  if (err instanceof JoiValidationError) {
    const validationErrors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        data: validationErrors
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }
    });
  }

  // Handle other known error types
  const errorMap = {
    'SequelizeUniqueConstraintError': {
      code: 'DUPLICATE_ENTRY',
      statusCode: 409,
      message: 'Duplicate entry'
    },
    'SequelizeForeignKeyConstraintError': {
      code: 'FOREIGN_KEY_VIOLATION',
      statusCode: 409,
      message: 'Foreign key constraint violation'
    },
    'SequelizeConnectionError': {
      code: 'DATABASE_CONNECTION_ERROR',
      statusCode: 503,
      message: 'Database connection error'
    }
  };

  const knownError = errorMap[err.name];
  if (knownError) {
    return res.status(knownError.statusCode).json({
      error: {
        code: knownError.code,
        message: knownError.message,
        data: process.env.NODE_ENV === 'development' ? err.message : null
      }
    });
  }

  // Handle unknown errors
  // In production, don't send the actual error message to the client
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'An unexpected error occurred';

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message,
      data: process.env.NODE_ENV === 'development' ? {
        name: err.name,
        message: err.message,
        stack: err.stack
      } : null
    }
  });
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler
};
