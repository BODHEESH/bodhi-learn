// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\utils\errors.js

class BaseError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ApiError extends BaseError {
  constructor(message, statusCode = 400) {
    super(message, statusCode, true);
  }
}

class AuthError extends BaseError {
  constructor(message) {
    super(message, 401, true);
  }
}

class ValidationError extends BaseError {
  constructor(message) {
    super(message, 400, true);
  }
}

class ForbiddenError extends BaseError {
  constructor(message = 'Access forbidden') {
    super(message, 403, true);
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

class ServiceError extends BaseError {
  constructor(message, originalError = null) {
    super(message, 503, true);
    this.originalError = originalError;
  }
}

module.exports = {
  BaseError,
  ApiError,
  AuthError,
  ValidationError,
  ForbiddenError,
  NotFoundError,
  ServiceError
};
