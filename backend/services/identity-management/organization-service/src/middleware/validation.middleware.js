const { CustomError } = require('../../utils/errors');
const logger = require('../../utils/logger');
const { metrics } = require('../../utils/metrics');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));

        // Track validation errors
        metrics.validationErrors.inc({
          path: req.path,
          type: property
        });

        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: details
        });

        throw new CustomError('VALIDATION_ERROR', 'Validation failed', details);
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');
const validateBody = (schema) => validate(schema, 'body');

module.exports = {
  validateParams,
  validateQuery,
  validateBody
};
