// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\errors\custom-error.js

class CustomError extends Error {
    constructor(code, message, statusCode = 400, data = null) {
      super(message);
      this.name = this.constructor.name;
      this.code = code;
      this.statusCode = statusCode;
      this.data = data;
      Error.captureStackTrace(this, this.constructor);
    }
  
    toJSON() {
      return {
        error: {
          code: this.code,
          message: this.message,
          data: this.data
        }
      };
    }
  }
  
  class ValidationError extends CustomError {
    constructor(message, data = null) {
      super('VALIDATION_ERROR', message, 400, data);
    }
  }
  
  class AuthenticationError extends CustomError {
    constructor(message, data = null) {
      super('AUTHENTICATION_ERROR', message, 401, data);
    }
  }
  
  class AuthorizationError extends CustomError {
    constructor(message, data = null) {
      super('AUTHORIZATION_ERROR', message, 403, data);
    }
  }
  
  class NotFoundError extends CustomError {
    constructor(message, data = null) {
      super('NOT_FOUND', message, 404, data);
    }
  }
  
  class ConflictError extends CustomError {
    constructor(message, data = null) {
      super('CONFLICT', message, 409, data);
    }
  }
  
  class DatabaseError extends CustomError {
    constructor(message, data = null) {
      super('DATABASE_ERROR', message, 500, data);
    }
  }
  
  class IntegrationError extends CustomError {
    constructor(message, data = null) {
      super('INTEGRATION_ERROR', message, 502, data);
    }
  }
  
  class ServiceError extends CustomError {
    constructor(message, data = null) {
      super('SERVICE_ERROR', message, 500, data);
    }
  }
  
  module.exports = {
    CustomError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    IntegrationError,
    ServiceError
  };
  