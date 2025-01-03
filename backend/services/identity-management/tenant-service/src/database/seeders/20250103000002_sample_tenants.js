// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\seeders\20250103000002_sample_tenants.js

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const systemUserId = uuidv4();
    const now = new Date();

    // Sample tenants data
    const sampleTenants = [
      {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        type: 'ENTERPRISE',
        features: ['advanced_security', 'custom_branding', 'api_access']
      },
      {
        name: 'StartUp Labs',
        slug: 'startup-labs',
        type: 'PREMIUM',
        features: ['basic_security', 'api_access']
      },
      {
        name: 'Small Business',
        slug: 'small-business',
        type: 'BASIC',
        features: ['basic_security']
      }
    ];

    // Create sample tenants
    for (const sample of sampleTenants) {
      const tenantId = uuidv4();

      // Create tenant
      await queryInterface.bulkInsert('tenants', [{
        id: tenantId,
        name: sample.name,
        slug: sample.slug,
        description: `Sample ${sample.type.toLowerCase()} tenant`,
        status: 'ACTIVE',
        type: sample.type,
        features: sample.features,
        settings: {},
        metadata: {
          isSample: true
        },
        userLimit: sample.type === 'ENTERPRISE' ? 1000 : 
                  sample.type === 'PREMIUM' ? 100 : 10,
        storageLimit: sample.type === 'ENTERPRISE' ? 5368709120 * 100 : 
                     sample.type === 'PREMIUM' ? 5368709120 * 10 : 5368709120,
        createdBy: systemUserId,
        createdAt: now,
        updatedAt: now
      }], {});

      // Create tenant settings
      await queryInterface.bulkInsert('tenant_settings', [{
        id: uuidv4(),
        tenantId: tenantId,
        settings: {},
        theme: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          logo: null
        },
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h'
        },
        features: {
          enabledFeatures: sample.features
        },
        integrations: {},
        notifications: {
          email: true,
          slack: false,
          webhook: false
        },
        security: {
          mfa: sample.type === 'ENTERPRISE',
          passwordPolicy: {
            minLength: sample.type === 'ENTERPRISE' ? 12 : 8,
            requireNumbers: true,
            requireSymbols: sample.type === 'ENTERPRISE',
            requireUppercase: true,
            requireLowercase: true
          },
          ipWhitelist: []
        },
        metadata: {
          isSample: true
        },
        createdBy: systemUserId,
        createdAt: now,
        updatedAt: now
      }], {});

      // Create tenant billing
      await queryInterface.bulkInsert('tenant_billing', [{
        id: uuidv4(),
        tenantId: tenantId,
        status: 'ACTIVE',
        plan: sample.type,
        billingCycle: 'MONTHLY',
        amount: sample.type === 'ENTERPRISE' ? 999.00 :
                sample.type === 'PREMIUM' ? 199.00 : 49.00,
        currency: 'USD',
        paymentMethodValid: true,
        metadata: {
          isSample: true
        },
        createdBy: systemUserId,
        createdAt: now,
        updatedAt: now
      }], {});

      // Create audit log entry
      await queryInterface.bulkInsert('tenant_audit_logs', [{
        id: uuidv4(),
        tenantId: tenantId,
        action: 'CREATE',
        entity: 'TENANT',
        entityId: tenantId,
        oldValues: {},
        newValues: {
          id: tenantId,
          name: sample.name,
          type: sample.type
        },
        metadata: {
          isSample: true,
          reason: 'Sample data creation'
        },
        createdBy: systemUserId,
        createdAt: now
      }], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove all sample data
    await queryInterface.bulkDelete('tenant_audit_logs', {
      metadata: {
        isSample: true
      }
    }, {});
    await queryInterface.bulkDelete('tenant_billing', {
      metadata: {
        isSample: true
      }
    }, {});
    await queryInterface.bulkDelete('tenant_settings', {
      metadata: {
        isSample: true
      }
    }, {});
    await queryInterface.bulkDelete('tenants', {
      metadata: {
        isSample: true
      }
    }, {});
  }
};
