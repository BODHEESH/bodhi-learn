// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\validations\tenant.validation.js

const Joi = require('joi');
const { password } = require('./custom.validation');

module.exports = {
  // Create new tenant
  createTenant: {
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(100),
      slug: Joi.string().required().min(2).max(100),
      description: Joi.string().max(500),
      industry: Joi.string(),
      size: Joi.string().valid('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
      plan: Joi.string().valid('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
      features: Joi.array().items(Joi.string()),
      settings: Joi.object(),
      metadata: Joi.object()
    })
  },

  // List tenants
  listTenants: {
    query: Joi.object().keys({
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      sortBy: Joi.string(),
      status: Joi.string(),
      plan: Joi.string(),
      search: Joi.string()
    })
  },

  // Get tenant by ID
  getTenant: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    })
  },

  // Update tenant
  updateTenant: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
      name: Joi.string().min(2).max(100),
      description: Joi.string().max(500),
      industry: Joi.string(),
      size: Joi.string().valid('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED'),
      features: Joi.array().items(Joi.string()),
      metadata: Joi.object()
    }).min(1)
  },

  // Delete tenant
  deleteTenant: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    })
  },

  // Get tenant settings
  getTenantSettings: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    })
  },

  // Update tenant settings
  updateTenantSettings: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
      settings: Joi.object().required(),
      theme: Joi.object(),
      preferences: Joi.object(),
      features: Joi.object(),
      integrations: Joi.object()
    }).min(1)
  },

  // Get tenant billing
  getTenantBilling: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    })
  },

  // Update tenant billing
  updateTenantBilling: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
      plan: Joi.string().valid('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
      billingCycle: Joi.string().valid('MONTHLY', 'YEARLY'),
      paymentMethod: Joi.object(),
      billingAddress: Joi.object()
    }).min(1)
  },

  // Upgrade plan
  upgradePlan: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
      plan: Joi.string().valid('FREE', 'BASIC', 'PRO', 'ENTERPRISE').required()
    })
  },

  // Get tenant analytics
  getTenantAnalytics: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
      period: Joi.string().pattern(/^\d+[dwmy]$/),
      metrics: Joi.array().items(Joi.string())
    })
  },

  // Check tenant health
  checkTenantHealth: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    })
  },

  // Create tenant backup
  createTenantBackup: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    body: Joi.object().keys({
      includeData: Joi.array().items(Joi.string()),
      metadata: Joi.object()
    })
  },

  // List tenant backups
  listTenantBackups: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      status: Joi.string(),
      sortBy: Joi.string()
    })
  },

  // Get tenant backup
  getTenantBackup: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required(),
      backupId: Joi.string().required()
    })
  },

  // Restore tenant from backup
  restoreTenantFromBackup: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required(),
      backupId: Joi.string().required()
    }),
    body: Joi.object().keys({
      options: Joi.object({
        includeUsers: Joi.boolean(),
        includeResources: Joi.boolean()
      })
    })
  },

  // Delete tenant backup
  deleteTenantBackup: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required(),
      backupId: Joi.string().required()
    })
  },

  // Get tenant resources
  getTenantResources: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
      type: Joi.string(),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      sortBy: Joi.string()
    })
  },

  // Get resource usage
  getResourceUsage: {
    params: Joi.object().keys({
      tenantId: Joi.string().uuid().required()
    }),
    query: Joi.object().keys({
      resources: Joi.array().items(Joi.string()),
      period: Joi.string().pattern(/^\d+[dwmy]$/)
    })
  }
};
