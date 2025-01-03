// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\migrations\20250104000000-add-security-fields.js


'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add new status to enum
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_users_status ADD VALUE IF NOT EXISTS 'locked'`,
        { transaction }
      );

      // Add new columns
      await queryInterface.addColumn(
        'users',
        'mfaEnabled',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'mfaSecret',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'backupCodes',
        {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'emailVerified',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'emailVerificationToken',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'emailVerificationExpires',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'passwordHistory',
        {
          type: Sequelize.JSONB,
          defaultValue: []
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'lockReason',
        {
          type: Sequelize.STRING,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'lockedAt',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'users',
        'passwordChangedAt',
        {
          type: Sequelize.DATE,
          allowNull: true
        },
        { transaction }
      );

      // Add indexes
      await queryInterface.addIndex(
        'users',
        ['mfaEnabled'],
        {
          name: 'users_mfa_enabled_idx',
          transaction
        }
      );

      await queryInterface.addIndex(
        'users',
        ['emailVerified'],
        {
          name: 'users_email_verified_idx',
          transaction
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove indexes
      await queryInterface.removeIndex('users', 'users_mfa_enabled_idx', { transaction });
      await queryInterface.removeIndex('users', 'users_email_verified_idx', { transaction });

      // Remove columns
      await queryInterface.removeColumn('users', 'mfaEnabled', { transaction });
      await queryInterface.removeColumn('users', 'mfaSecret', { transaction });
      await queryInterface.removeColumn('users', 'backupCodes', { transaction });
      await queryInterface.removeColumn('users', 'emailVerified', { transaction });
      await queryInterface.removeColumn('users', 'emailVerificationToken', { transaction });
      await queryInterface.removeColumn('users', 'emailVerificationExpires', { transaction });
      await queryInterface.removeColumn('users', 'passwordHistory', { transaction });
      await queryInterface.removeColumn('users', 'lockReason', { transaction });
      await queryInterface.removeColumn('users', 'lockedAt', { transaction });
      await queryInterface.removeColumn('users', 'passwordChangedAt', { transaction });

      // Remove locked status from enum
      await queryInterface.sequelize.query(
        `ALTER TYPE enum_users_status DROP VALUE IF EXISTS 'locked'`,
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
