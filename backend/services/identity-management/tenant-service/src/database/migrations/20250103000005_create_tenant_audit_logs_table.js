// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrations\20250103000005_create_tenant_audit_logs_table.js

// Migration: Create tenant_audit_logs table
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_audit_logs', {
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
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      entity: {
        type: DataTypes.STRING,
        allowNull: false
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      oldValues: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      newValues: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('tenant_audit_logs', ['tenantId']);
    await queryInterface.addIndex('tenant_audit_logs', ['action']);
    await queryInterface.addIndex('tenant_audit_logs', ['entity']);
    await queryInterface.addIndex('tenant_audit_logs', ['entityId']);
    await queryInterface.addIndex('tenant_audit_logs', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_audit_logs');
  }
};
