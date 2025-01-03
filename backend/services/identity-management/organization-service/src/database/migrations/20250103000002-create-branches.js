// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\database\migrations\20250103000002-create-branches.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('branches', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('MAIN', 'SATELLITE', 'VIRTUAL'),
        defaultValue: 'SATELLITE'
      },
      address: {
        type: Sequelize.JSON,
        allowNull: false
      },
      contact: {
        type: Sequelize.JSON,
        allowNull: false
      },
      facilities: {
        type: Sequelize.JSON,
        defaultValue: []
      },
      capacity: {
        type: Sequelize.JSON,
        defaultValue: {
          students: 0,
          staff: 0,
          classrooms: 0
        }
      },
      operatingHours: {
        type: Sequelize.JSON,
        defaultValue: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        }
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'CLOSED'),
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
    await queryInterface.addIndex('branches', ['organizationId']);
    await queryInterface.addIndex('branches', ['status']);
    await queryInterface.addIndex('branches', ['type']);
    await queryInterface.addIndex('branches', ['code']);
    await queryInterface.addIndex('branches', ['deletedAt']);
    await queryInterface.addIndex('branches', ['organizationId', 'code'], {
      unique: true,
      where: {
        deletedAt: null
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('branches');
  }
};
