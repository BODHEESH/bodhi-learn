// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\seeders\20250103000001_default_tenants.js

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultTenantId = uuidv4();
    const systemUserId = uuidv4();
    const now = new Date();

    // Create default tenant
    await queryInterface.bulkInsert('tenants', [{
      id: defaultTenantId,
      name: 'Default Organization',
      slug: 'default-org',
      description: 'Default organization for system administration',
      status: 'ACTIVE',
      type: 'ENTERPRISE',
      features: ['all'],
      settings: {
        isSystemTenant: true,
        allowSubtenants: true
      },
      metadata: {
        isDefault: true,
        systemCreated: true
      },
      userLimit: -1, // Unlimited
      storageLimit: -1, // Unlimited
      createdBy: systemUserId,
      createdAt: now,
      updatedAt: now
    }], {});

    // Create tenant settings
    await queryInterface.bulkInsert('tenant_settings', [{
      id: uuidv4(),
      tenantId: defaultTenantId,
      settings: {
        isSystemSettings: true
      },
      theme: {
        primaryColor: '#1a73e8',
        secondaryColor: '#5f6368',
        logo: null
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h'
      },
      features: {
        enabledFeatures: ['all']
      },
      integrations: {},
      notifications: {
        email: true,
        slack: false,
        webhook: false
      },
      security: {
        mfa: true,
        passwordPolicy: {
          minLength: 12,
          requireNumbers: true,
          requireSymbols: true,
          requireUppercase: true,
          requireLowercase: true
        },
        ipWhitelist: []
      },
      metadata: {
        isDefault: true,
        systemCreated: true
      },
      createdBy: systemUserId,
      createdAt: now,
      updatedAt: now
    }], {});

    // Create tenant billing
    await queryInterface.bulkInsert('tenant_billing', [{
      id: uuidv4(),
      tenantId: defaultTenantId,
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      billingCycle: 'YEARLY',
      amount: 0.00,
      currency: 'USD',
      paymentMethodValid: true,
      metadata: {
        isDefault: true,
        systemCreated: true,
        billingExempt: true
      },
      createdBy: systemUserId,
      createdAt: now,
      updatedAt: now
    }], {});

    // Create initial audit log
    await queryInterface.bulkInsert('tenant_audit_logs', [{
      id: uuidv4(),
      tenantId: defaultTenantId,
      action: 'CREATE',
      entity: 'TENANT',
      entityId: defaultTenantId,
      oldValues: {},
      newValues: {
        id: defaultTenantId,
        name: 'Default Organization',
        type: 'ENTERPRISE'
      },
      metadata: {
        isSystemAction: true,
        reason: 'Initial system setup'
      },
      createdBy: systemUserId,
      createdAt: now
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all seeded data in reverse order
    await queryInterface.bulkDelete('tenant_audit_logs', null, {});
    await queryInterface.bulkDelete('tenant_billing', null, {});
    await queryInterface.bulkDelete('tenant_settings', null, {});
    await queryInterface.bulkDelete('tenants', null, {});
  }
};
