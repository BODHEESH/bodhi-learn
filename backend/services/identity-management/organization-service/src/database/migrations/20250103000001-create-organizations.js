// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\database\migrations\20250103000001-create-organizations.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'TRAINING_CENTER', 'OTHER'),
        allowNull: false
      },
      address: {
        type: Sequelize.JSON,
        allowNull: false
      },
      contact: {
        type: Sequelize.JSON,
        allowNull: false
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      branding: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'),
        defaultValue: 'ACTIVE'
      },
      verificationStatus: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      licenses: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      accreditations: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('organizations', ['tenantId']);
    await queryInterface.addIndex('organizations', ['status']);
    await queryInterface.addIndex('organizations', ['verificationStatus']);
    await queryInterface.addIndex('organizations', ['type']);
    await queryInterface.addIndex('organizations', ['code']);
    await queryInterface.addIndex('organizations', ['deletedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('organizations');
  }
};
