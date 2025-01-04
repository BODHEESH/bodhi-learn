const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .min(8)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required'
    }),
  institutionId: Joi.string()
    .required()
    .messages({
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

const passwordResetSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  institutionId: Joi.string()
    .required()
    .messages({
      'any.required': 'Institution ID is required'
    })
});

const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .required()
    .min(8)
    .not(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'any.required': 'New password is required',
      'any.invalid': 'New password must be different from current password'
    })
});

const mfaSetupSchema = Joi.object({
  type: Joi.string()
    .valid('totp', 'sms')
    .required()
    .messages({
      'any.only': 'MFA type must be either totp or sms',
      'any.required': 'MFA type is required'
    }),
  phoneNumber: Joi.when('type', {
    is: 'sms',
    then: Joi.string()
      .required()
      .pattern(/^\+[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Invalid phone number format. Must be in E.164 format',
        'any.required': 'Phone number is required for SMS MFA'
      })
  })
});

const mfaVerifySchema = Joi.object({
  code: Joi.string()
    .required()
    .pattern(/^\d{6}$/)
    .messages({
      'string.pattern.base': 'MFA code must be 6 digits',
      'any.required': 'MFA code is required'
    }),
  type: Joi.string()
    .valid('totp', 'sms')
    .required()
    .messages({
      'any.only': 'MFA type must be either totp or sms',
      'any.required': 'MFA type is required'
    })
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  mfaSetupSchema,
  mfaVerifySchema
};
