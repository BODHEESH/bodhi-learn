// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrations\20250103000002_create_tenant_settings_table.js

// Migration: Create tenant_settings table
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_settings', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      theme: {
        type: DataTypes.JSONB,
        defaultValue: {
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          logo: null
        },
        allowNull: false
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h'
        },
        allowNull: false
      },
      features: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      integrations: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      notifications: {
        type: DataTypes.JSONB,
        defaultValue: {
          email: true,
          slack: false,
          webhook: false
        },
        allowNull: false
      },
      security: {
        type: DataTypes.JSONB,
        defaultValue: {
          mfa: false,
          passwordPolicy: {
            minLength: 8,
            requireNumbers: true,
            requireSymbols: true
          },
          ipWhitelist: []
        },
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('tenant_settings', ['tenantId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_settings');
  }
};
