// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\utils\errors.js

class BaseError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

class AuthError extends BaseError {
  constructor(message, code = 'UNAUTHORIZED', details = null) {
    super(message, 401, code, details);
  }
}

class ValidationError extends BaseError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class ForbiddenError extends BaseError {
  constructor(message = 'Access forbidden', code = 'FORBIDDEN', details = null) {
    super(message, 403, code, details);
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    super(message, 404, code, details);
  }
}

class ConflictError extends BaseError {
  constructor(message, code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

class RateLimitError extends BaseError {
  constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED', details = null) {
    super(message, 429, code, details);
  }
}

class RedisError extends BaseError {
  constructor(message, details = null) {
    super(message, 503, 'REDIS_ERROR', details);
  }
}

class MessageQueueError extends BaseError {
  constructor(message, details = null) {
    super(message, 503, 'MESSAGE_QUEUE_ERROR', details);
  }
}

class DatabaseError extends BaseError {
  constructor(message, details = null) {
    super(message, 503, 'DATABASE_ERROR', details);
  }
}

class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service temporarily unavailable', code = 'SERVICE_UNAVAILABLE', details = null) {
    super(message, 503, code, details);
  }
}

// Error handler function for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  BaseError,
  AuthError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  RedisError,
  MessageQueueError,
  DatabaseError,
  ServiceUnavailableError,
  asyncHandler
};
