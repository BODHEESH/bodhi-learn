// D:\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\validation.middleware.js
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Validation error:', {
          path: req.path,
          errors: errorMessages
        });

        throw new ValidationError('Validation failed', errorMessages);
      }
// D:\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\validation.middleware.js
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        logger.warn('Validation error:', {
          path: req.path,
          errors: errorMessages
        });

        throw new ValidationError('Validation failed', errorMessages);
      }

      // Replace request body with validated value
      req.body = value;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.error('Unexpected validation error:', error);
        next(new ValidationError('Invalid request data'));
      }
    }
  };
};

module.exports = {
  validateSchema
};
      // Replace request body with validated value
      req.body = value;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.error('Unexpected validation error:', error);
        next(new ValidationError('Invalid request data'));
      }
    }
  };
};

module.exports = {
  validateSchema
};