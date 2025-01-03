// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\validation-schemas\subscription.schema.js

const Joi = require('joi');

const subscriptionSchemas = {
  createSubscription: Joi.object({
    planType: Joi.string()
      .valid('COMMUNITY', 'PREMIUM', 'ENTERPRISE')
      .required(),
    billingCycle: Joi.string()
      .valid('MONTHLY', 'YEARLY')
      .required(),
    price: Joi.number()
      .positive()
      .required(),
    currency: Joi.string()
      .length(3)
      .uppercase()
      .default('USD'),
    autoRenew: Joi.boolean()
      .default(true)
  }),

  updateSubscription: Joi.object({
    planType: Joi.string()
      .valid('COMMUNITY', 'PREMIUM', 'ENTERPRISE'),
    billingCycle: Joi.string()
      .valid('MONTHLY', 'YEARLY'),
    autoRenew: Joi.boolean(),
    reason: Joi.string()
      .max(500)
  }),

  cancelSubscription: Joi.object({
    reason: Joi.string()
      .max(500)
      .required()
  })
};

module.exports = subscriptionSchemas;
