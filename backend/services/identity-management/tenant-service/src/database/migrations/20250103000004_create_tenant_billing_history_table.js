// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrations\20250103000004_create_tenant_billing_history_table.js

// Migration: Create tenant_billing_history table
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_billing_history', {
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
      billingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tenant_billing',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: DataTypes.ENUM('PAYMENT', 'REFUND', 'ADJUSTMENT', 'PLAN_CHANGE'),
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING',
        allowNull: false
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
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
      }
    });

    // Add indexes
    await queryInterface.addIndex('tenant_billing_history', ['tenantId']);
    await queryInterface.addIndex('tenant_billing_history', ['billingId']);
    await queryInterface.addIndex('tenant_billing_history', ['type']);
    await queryInterface.addIndex('tenant_billing_history', ['status']);
    await queryInterface.addIndex('tenant_billing_history', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_billing_history');
  }
};
