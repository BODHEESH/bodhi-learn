// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\database\migrations\20250103000003-create-departments.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      organizationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parentDepartmentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
        type: Sequelize.ENUM('ACADEMIC', 'ADMINISTRATIVE', 'SUPPORT', 'RESEARCH'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      head: {
        type: Sequelize.JSON,
        allowNull: true
      },
      contact: {
        type: Sequelize.JSON,
        allowNull: false
      },
      location: {
        type: Sequelize.JSON,
        defaultValue: {
          building: null,
          floor: null,
          room: null
        }
      },
      resources: {
        type: Sequelize.JSON,
        defaultValue: {
          staff: 0,
          budget: 0,
          facilities: []
        }
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'RESTRUCTURING'),
        defaultValue: 'ACTIVE'
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
    await queryInterface.addIndex('departments', ['organizationId']);
    await queryInterface.addIndex('departments', ['branchId']);
    await queryInterface.addIndex('departments', ['parentDepartmentId']);
    await queryInterface.addIndex('departments', ['status']);
    await queryInterface.addIndex('departments', ['type']);
    await queryInterface.addIndex('departments', ['code']);
    await queryInterface.addIndex('departments', ['deletedAt']);
    await queryInterface.addIndex('departments', ['organizationId', 'branchId', 'code'], {
      unique: true,
      where: {
        deletedAt: null
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('departments');
  }
};
