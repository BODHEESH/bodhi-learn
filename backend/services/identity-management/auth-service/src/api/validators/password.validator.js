// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\validators\password.validator.js

const Joi = require('joi');
const config = require('../../config/app.config');

const passwordSchema = Joi.object({
  password: Joi.string()
    .min(config.security.passwordMinLength)
    .max(config.security.passwordMaxLength)
    .pattern(config.security.passwordPattern)
    .required()
    .messages({
      'string.min': `Password must be at least ${config.security.passwordMinLength} characters`,
      'string.max': `Password cannot exceed ${config.security.passwordMaxLength} characters`,
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords must match',
      'any.required': 'Password confirmation is required'
    })
});

const resetPasswordSchema = passwordSchema.keys({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    })
});

const changePasswordSchema = passwordSchema.keys({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    })
});

module.exports = {
  passwordSchema,
  resetPasswordSchema,
  changePasswordSchema
};
