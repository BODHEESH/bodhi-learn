// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\utils\validation-schemas\branch.schema.js

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
  fax: Joi.string().optional(),
  emergencyContact: Joi.string().optional()
});

const operatingHoursSchema = Joi.object({
  monday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  tuesday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  wednesday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  thursday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  friday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  saturday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional(),
  sunday: Joi.object({
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
  }).optional()
});

const createBranchSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  code: Joi.string().min(2).max(20).required(),
  type: Joi.string().valid('MAIN', 'SATELLITE', 'VIRTUAL').required(),
  address: addressSchema.required(),
  contact: contactSchema.required(),
  facilities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    capacity: Joi.number().optional(),
    description: Joi.string().optional()
  })).optional(),
  capacity: Joi.object({
    students: Joi.number().min(0).optional(),
    staff: Joi.number().min(0).optional(),
    classrooms: Joi.number().min(0).optional()
  }).optional(),
  operatingHours: operatingHoursSchema.optional()
});

const updateBranchSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('MAIN', 'SATELLITE', 'VIRTUAL').optional(),
  address: addressSchema.optional(),
  contact: contactSchema.optional(),
  facilities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    capacity: Joi.number().optional(),
    description: Joi.string().optional()
  })).optional(),
  capacity: Joi.object({
    students: Joi.number().min(0).optional(),
    staff: Joi.number().min(0).optional(),
    classrooms: Joi.number().min(0).optional()
  }).optional(),
  operatingHours: operatingHoursSchema.optional()
}).min(1);

const updateBranchStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'CLOSED').required()
});

const updateBranchFacilitiesSchema = Joi.object({
  facilities: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    capacity: Joi.number().optional(),
    description: Joi.string().optional()
  })).required()
});

const updateBranchCapacitySchema = Joi.object({
  students: Joi.number().min(0).optional(),
  staff: Joi.number().min(0).optional(),
  classrooms: Joi.number().min(0).optional()
}).min(1);

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema,
  updateBranchFacilitiesSchema,
  updateBranchCapacitySchema
};
