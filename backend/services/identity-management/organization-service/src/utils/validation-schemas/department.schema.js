// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\validation-schemas\department.schema.js

const Joi = require('joi');

const contactSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  extension: Joi.string().optional()
});

const locationSchema = Joi.object({
  building: Joi.string().optional(),
  floor: Joi.string().optional(),
  room: Joi.string().optional()
});

const headSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  designation: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const resourcesSchema = Joi.object({
  staff: Joi.number().min(0).optional(),
  budget: Joi.number().min(0).optional(),
  facilities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    quantity: Joi.number().optional(),
    status: Joi.string().optional()
  })).optional()
});

const createDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  type: Joi.string().valid('ACADEMIC', 'ADMINISTRATIVE', 'SUPPORT', 'RESEARCH').required(),
  description: Joi.string().optional(),
  parentDepartmentId: Joi.string().uuid().optional(),
  head: headSchema.optional(),
  contact: contactSchema.required(),
  location: locationSchema.optional(),
  resources: resourcesSchema.optional()
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('ACADEMIC', 'ADMINISTRATIVE', 'SUPPORT', 'RESEARCH').optional(),
  description: Joi.string().optional(),
  contact: contactSchema.optional(),
  location: locationSchema.optional(),
  resources: resourcesSchema.optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'RESTRUCTURING').optional()
}).min(1);

const updateDepartmentHeadSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  name: Joi.string().required(),
  designation: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const updateDepartmentResourcesSchema = Joi.object({
  staff: Joi.number().min(0).optional(),
  budget: Joi.number().min(0).optional(),
  facilities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    quantity: Joi.number().optional(),
    status: Joi.string().optional()
  })).optional()
}).min(1);

const moveDepartmentSchema = Joi.object({
  newParentId: Joi.string().uuid().optional(),
  newBranchId: Joi.string().uuid().optional()
}).or('newParentId', 'newBranchId');

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentHeadSchema,
  updateDepartmentResourcesSchema,
  moveDepartmentSchema
};
