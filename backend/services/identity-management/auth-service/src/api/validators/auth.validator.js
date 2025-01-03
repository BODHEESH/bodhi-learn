// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\validators\auth.validator.js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
  
  institutionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid institution ID format',
      'any.required': 'Institution ID is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

const validateLoginInput = (data) => loginSchema.validate(data);
const validateRefreshToken = (data) => refreshTokenSchema.validate(data);

module.exports = {
  loginSchema,
  refreshTokenSchema,
  validateLoginInput,
  validateRefreshToken
};
