// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\validation.middleware.js

const { ValidationError } = require('../../utils/errors');
const logger = require('../../utils/logger');

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

        throw new ValidationError('Validation failed', errorMessages);
      }

      // Replace request body with validated value
      req.body = value;
      next();
    } catch (error) {
      logger.error('Validation error:', error);
      next(error);
    }
  };
};

module.exports = {
  validateSchema
};
