// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\errors\error-mapper.js

const {
    CustomError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    IntegrationError,
    ServiceError
  } = require('./custom-error');
  
  // Map error codes to specific error classes
  const errorMap = {
    // Authentication errors
    'INVALID_CREDENTIALS': AuthenticationError,
    'TOKEN_EXPIRED': AuthenticationError,
    'INVALID_TOKEN': AuthenticationError,
    'NO_TOKEN': AuthenticationError,
  
    // Authorization errors
    'INSUFFICIENT_PERMISSIONS': AuthorizationError,
    'FORBIDDEN': AuthorizationError,
    'INVALID_SCOPE': AuthorizationError,
  
    // Validation errors
    'VALIDATION_ERROR': ValidationError,
    'INVALID_INPUT': ValidationError,
    'MISSING_REQUIRED_FIELD': ValidationError,
  
    // Not found errors
    'USER_NOT_FOUND': NotFoundError,
    'ORGANIZATION_NOT_FOUND': NotFoundError,
    'BRANCH_NOT_FOUND': NotFoundError,
    'DEPARTMENT_NOT_FOUND': NotFoundError,
    'RESOURCE_NOT_FOUND': NotFoundError,
  
    // Conflict errors
    'DUPLICATE_ENTRY': ConflictError,
    'ALREADY_EXISTS': ConflictError,
    'RESOURCE_IN_USE': ConflictError,
  
    // Database errors
    'DATABASE_ERROR': DatabaseError,
    'CONNECTION_ERROR': DatabaseError,
    'QUERY_ERROR': DatabaseError,
  
    // Integration errors
    'INTEGRATION_ERROR': IntegrationError,
    'SERVICE_UNAVAILABLE': IntegrationError,
    'EXTERNAL_API_ERROR': IntegrationError,
  
    // Service errors
    'INTERNAL_ERROR': ServiceError,
    'UNEXPECTED_ERROR': ServiceError
  };
  
  // Default error messages for common error codes
  const defaultErrorMessages = {
    'INVALID_CREDENTIALS': 'Invalid username or password',
    'TOKEN_EXPIRED': 'Authentication token has expired',
    'INVALID_TOKEN': 'Invalid authentication token',
    'NO_TOKEN': 'No authentication token provided',
    'INSUFFICIENT_PERMISSIONS': 'You do not have sufficient permissions',
    'FORBIDDEN': 'Access denied',
    'INVALID_SCOPE': 'Invalid token scope',
    'VALIDATION_ERROR': 'Validation error occurred',
    'INVALID_INPUT': 'Invalid input provided',
    'MISSING_REQUIRED_FIELD': 'Required field is missing',
    'USER_NOT_FOUND': 'User not found',
    'ORGANIZATION_NOT_FOUND': 'Organization not found',
    'BRANCH_NOT_FOUND': 'Branch not found',
    'DEPARTMENT_NOT_FOUND': 'Department not found',
    'RESOURCE_NOT_FOUND': 'Resource not found',
    'DUPLICATE_ENTRY': 'Resource already exists',
    'ALREADY_EXISTS': 'Resource already exists',
    'RESOURCE_IN_USE': 'Resource is currently in use',
    'DATABASE_ERROR': 'Database error occurred',
    'CONNECTION_ERROR': 'Database connection error',
    'QUERY_ERROR': 'Database query error',
    'INTEGRATION_ERROR': 'Integration service error',
    'SERVICE_UNAVAILABLE': 'Service is currently unavailable',
    'EXTERNAL_API_ERROR': 'External API error',
    'INTERNAL_ERROR': 'Internal server error',
    'UNEXPECTED_ERROR': 'An unexpected error occurred'
  };
  
  /**
   * Creates an appropriate error instance based on the error code
   * @param {string} code - Error code
   * @param {string} [message] - Custom error message (optional)
   * @param {any} [data] - Additional error data (optional)
   * @returns {CustomError} Appropriate error instance
   */
  function createError(code, message, data = null) {
    const ErrorClass = errorMap[code] || CustomError;
    const errorMessage = message || defaultErrorMessages[code] || 'An error occurred';
    return new ErrorClass(errorMessage, data);
  }
  
  /**
   * Maps an error to a standardized error response
   * @param {Error} error - Original error
   * @returns {CustomError} Mapped error
   */
  function mapError(error) {
    // If it's already a CustomError, return as is
    if (error instanceof CustomError) {
      return error;
    }
  
    // Map known error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message, error.details);
    }
  
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token');
    }
  
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token has expired');
    }
  
    // Map database errors
    if (error.name === 'SequelizeValidationError') {
      return new ValidationError('Validation error', error.errors);
    }
  
    if (error.name === 'SequelizeUniqueConstraintError') {
      return new ConflictError('Resource already exists', error.errors);
    }
  
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return new ConflictError('Related resource not found', error.fields);
    }
  
    // Default to ServiceError for unknown errors
    return new ServiceError(
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    );
  }
  
  module.exports = {
    createError,
    mapError,
    errorMap,
    defaultErrorMessages
  };
  