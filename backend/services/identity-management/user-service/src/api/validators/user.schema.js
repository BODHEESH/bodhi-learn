// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\validation\user.schema.js

const Joi = require('joi');
const { password } = require('./custom.validation');

const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .custom(password)
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  institutionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid institution ID format',
      'any.required': 'Institution ID is required'
    }),
  roles: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .messages({
      'array.min': 'At least one role must be assigned'
    }),
  profile: Joi.object({
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .messages({
        'string.pattern.base': 'Invalid phone number format'
      }),
    timezone: Joi.string(),
    language: Joi.string()
      .valid('en', 'es', 'fr', 'de')
      .default('en'),
    avatar: Joi.string().uri()
  })
});

const updateUserSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending')
}).min(1);

const updateProfileSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
  timezone: Joi.string(),
  language: Joi.string()
    .valid('en', 'es', 'fr', 'de'),
  avatar: Joi.string().uri(),
  bio: Joi.string().max(500),
  preferences: Joi.object({
    emailNotifications: Joi.boolean(),
    pushNotifications: Joi.boolean(),
    theme: Joi.string().valid('light', 'dark', 'system'),
    accessibility: Joi.object({
      highContrast: Joi.boolean(),
      fontSize: Joi.string().valid('small', 'medium', 'large')
    })
  })
}).min(1);

const passwordUpdateSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .custom(password)
    .required()
    .messages({
      'any.required': 'New password is required'
    })
});

const assignRolesSchema = Joi.object({
  roles: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one role must be assigned',
      'any.required': 'Roles are required'
    })
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  passwordUpdateSchema,
  assignRolesSchema
};
