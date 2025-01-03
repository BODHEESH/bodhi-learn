// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\validations\user.validation.js

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    institutionId: Joi.string().required().custom(objectId),
    roles: Joi.array().items(Joi.string().custom(objectId)),
    status: Joi.string().valid('active', 'inactive', 'pending')
  })
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    email: Joi.string().email(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    roles: Joi.array().items(Joi.string().custom(objectId)),
    status: Joi.string().valid('active', 'inactive', 'pending'),
    preferences: Joi.object()
  }).min(1)
};

const getUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  })
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  })
};

const queryUsers = {
  query: Joi.object().keys({
    email: Joi.string(),
    name: Joi.string(),
    status: Joi.string(),
    role: Joi.string(),
    institutionId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    mfaEnabled: Joi.boolean(),
    emailVerified: Joi.boolean()
  })
};

const updateProfile = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    avatar: Joi.string().uri(),
    phoneNumber: Joi.string(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      zipCode: Joi.string()
    }),
    dateOfBirth: Joi.date(),
    gender: Joi.string(),
    bio: Joi.string(),
    socialLinks: Joi.object({
      linkedin: Joi.string().uri(),
      twitter: Joi.string().uri(),
      github: Joi.string().uri()
    })
  }).min(1)
};

const updatePreferences = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().min(1)
};

const mfaValidation = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    token: Joi.string().required().length(6)
  })
};

const verifyBackupCode = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    code: Joi.string().required().length(8)
  })
};

const sessionManagement = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
    sessionId: Joi.string()
  })
};

const bulkCreateUsers = {
  body: Joi.array().items(
    Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required().min(8),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      institutionId: Joi.string().required().custom(objectId),
      roles: Joi.array().items(Joi.string().custom(objectId)),
      status: Joi.string().valid('active', 'inactive', 'pending')
    })
  ).min(1).max(100)
};

module.exports = {
  createUser,
  updateUser,
  getUser,
  deleteUser,
  queryUsers,
  updateProfile,
  updatePreferences,
  mfaValidation,
  verifyBackupCode,
  sessionManagement,
  bulkCreateUsers
};
