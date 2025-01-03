// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\database\migrations\20250103000003_create_tenant_billing_table.js

// Migration: Create tenant_billing table
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tenant_billing', {
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
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED'),
        defaultValue: 'ACTIVE',
        allowNull: false
      },
      plan: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'FREE'
      },
      billingCycle: {
        type: DataTypes.ENUM('MONTHLY', 'YEARLY'),
        defaultValue: 'MONTHLY',
        allowNull: false
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
      },
      paymentMethodValid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastPaymentDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastPaymentAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      lastPaymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      totalPayments: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      billingAddress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        allowNull: false
      },
      taxInfo: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
    await queryInterface.addIndex('tenant_billing', ['tenantId']);
    await queryInterface.addIndex('tenant_billing', ['status']);
    await queryInterface.addIndex('tenant_billing', ['plan']);
    await queryInterface.addIndex('tenant_billing', ['nextBillingDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tenant_billing');
  }
};
