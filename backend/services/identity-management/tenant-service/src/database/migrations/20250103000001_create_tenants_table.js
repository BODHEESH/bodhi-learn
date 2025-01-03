// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrations\20250103000001_create_tenants_table.js

// Migration: Create tenants table
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenants', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'),
        defaultValue: 'ACTIVE',
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE'),
        defaultValue: 'TRIAL',
        allowNull: false
      },
      features: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        allowNull: false
      },
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      userLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: false
      },
      userCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      storageLimit: {
        type: DataTypes.BIGINT,
        defaultValue: 5368709120, // 5GB in bytes
        allowNull: false
      },
      storageUsed: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
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
    await queryInterface.addIndex('tenants', ['slug'], { unique: true });
    await queryInterface.addIndex('tenants', ['status']);
    await queryInterface.addIndex('tenants', ['type']);
    await queryInterface.addIndex('tenants', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenants');
  }
};
