// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\validation-schemas\organization.schema.js

const Joi = require('joi');

const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  postalCode: Joi.string().required()
});

const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  website: Joi.string().uri().optional(),
  socialMedia: Joi.object().optional()
});

const createOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  type: Joi.string().valid('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'TRAINING_CENTER', 'OTHER').required(),
  address: addressSchema.required(),
  contact: contactSchema.required(),
  settings: Joi.object().optional(),
  branding: Joi.object().optional(),
  mainBranch: Joi.object({
    name: Joi.string().required(),
    code: Joi.string().required(),
    address: addressSchema.required(),
    contact: contactSchema.required()
  }).optional()
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'TRAINING_CENTER', 'OTHER').optional(),
  address: addressSchema.optional(),
  contact: contactSchema.optional(),
  settings: Joi.object().optional(),
  branding: Joi.object().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED').optional()
});

const updateOrganizationSettingsSchema = Joi.object({
  theme: Joi.object().optional(),
  notifications: Joi.object().optional(),
  features: Joi.object().optional(),
  preferences: Joi.object().optional(),
  integrations: Joi.object().optional()
}).min(1);

const verifyOrganizationSchema = Joi.object({
  licenses: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    number: Joi.string().required(),
    issuedBy: Joi.string().required(),
    issuedDate: Joi.date().required(),
    expiryDate: Joi.date().required(),
    status: Joi.string().required()
  })).optional(),
  accreditations: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    issuedBy: Joi.string().required(),
    issuedDate: Joi.date().required(),
    validUntil: Joi.date().required(),
    status: Joi.string().required()
  })).optional()
}).min(1);

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrganizationSettingsSchema,
  verifyOrganizationSchema
};
