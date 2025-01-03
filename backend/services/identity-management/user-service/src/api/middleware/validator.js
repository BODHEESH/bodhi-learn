// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\validator.js

const Joi = require('joi');
const { ValidationError } = require('../../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    const validationResult = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params
      },
      { abortEarly: false }
    );

    if (validationResult.error) {
      const details = validationResult.error.details.map(detail => ({
        field: detail.path.slice(1).join('.'),
        message: detail.message
      }));

      return next(new ValidationError('Validation failed', details));
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  id: Joi.string().uuid(),
  email: Joi.string().email(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  name: Joi.string().min(2).max(50),
  phone: Joi.string().pattern(/^\+?[\d\s-]+$/),
  date: Joi.date().iso(),
  url: Joi.string().uri(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  institutionId: Joi.string().uuid(),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'pending')
};

// Request validation schemas
const userSchemas = {
  create: Joi.object({
    body: Joi.object({
      email: schemas.email.required(),
      password: schemas.password.required(),
      firstName: schemas.name.required(),
      lastName: schemas.name.required(),
      institutionId: schemas.institutionId.required(),
      roles: Joi.array().items(Joi.string()).min(1),
      profile: Joi.object({
        phoneNumber: schemas.phone,
        dateOfBirth: schemas.date,
        gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
        address: Joi.object(),
        bio: Joi.string().max(500)
      })
    }).required(),
    query: Joi.object(),
    params: Joi.object()
  }),

  update: Joi.object({
    body: Joi.object({
      firstName: schemas.name,
      lastName: schemas.name,
      status: schemas.status,
      roles: Joi.array().items(Joi.string()),
      profile: Joi.object({
        phoneNumber: schemas.phone,
        dateOfBirth: schemas.date,
        gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
        address: Joi.object(),
        bio: Joi.string().max(500)
      })
    }).min(1).required(),
    query: Joi.object(),
    params: Joi.object({
      id: schemas.id.required()
    })
  }),

  list: Joi.object({
    query: Joi.object({
      page: schemas.page.default(1),
      limit: schemas.limit.default(10),
      institutionId: schemas.institutionId,
      status: schemas.status,
      search: Joi.string(),
      sortBy: Joi.string(),
      sortOrder: Joi.string().valid('ASC', 'DESC')
    }),
    body: Joi.object(),
    params: Joi.object()
  })
};

const profileSchemas = {
  update: Joi.object({
    body: Joi.object({
      phoneNumber: schemas.phone,
      dateOfBirth: schemas.date,
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
      address: Joi.object(),
      bio: Joi.string().max(500),
      preferences: Joi.object(),
      metadata: Joi.object()
    }).min(1).required(),
    query: Joi.object(),
    params: Joi.object({
      userId: schemas.id.required()
    })
  })
};

const roleSchemas = {
  create: Joi.object({
    body: Joi.object({
      name: Joi.string().required(),
      displayName: Joi.string().required(),
      description: Joi.string(),
      permissions: Joi.array().items(Joi.string()),
      level: Joi.number().integer().min(0),
      metadata: Joi.object()
    }).required(),
    query: Joi.object(),
    params: Joi.object()
  }),

  update: Joi.object({
    body: Joi.object({
      displayName: Joi.string(),
      description: Joi.string(),
      permissions: Joi.array().items(Joi.string()),
      level: Joi.number().integer().min(0),
      metadata: Joi.object()
    }).min(1).required(),
    query: Joi.object(),
    params: Joi.object({
      id: schemas.id.required()
    })
  })
};

module.exports = {
  validate,
  schemas,
  userSchemas,
  profileSchemas,
  roleSchemas
};
