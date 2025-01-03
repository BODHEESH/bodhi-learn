// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\validate-request.js

const { ValidationError } = require('../../utils/errors');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // include all errors
      allowUnknown: true, // ignore unknown props
      stripUnknown: true // remove unknown props
    };

    const { error, value } = schema.validate(req.body, validationOptions);
    
    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
        
      return next(new ValidationError(errorMessage));
    }

    // Replace request body with validated value
    req.body = value;
    return next();
  };
};

module.exports = { validateRequest };
