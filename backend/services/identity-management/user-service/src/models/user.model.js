// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\user.model.js

const { DataTypes } = require('sequelize');
const BaseModel = require('./base.model');
const bcrypt = require('bcryptjs');
const config = require('../config/app.config');

class User extends BaseModel {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        passwordHash: {
          type: DataTypes.STRING,
          allowNull: false
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending', 'locked'),
          defaultValue: 'pending'
        },
        institutionId: {
          type: DataTypes.UUID,
          allowNull: false
        },
        mfaEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        mfaSecret: {
          type: DataTypes.STRING
        },
        backupCodes: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        emailVerificationToken: {
          type: DataTypes.STRING
        },
        emailVerificationExpires: {
          type: DataTypes.DATE
        },
        passwordHistory: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        lockReason: {
          type: DataTypes.STRING
        },
        lockedAt: {
          type: DataTypes.DATE
        },
        passwordChangedAt: {
          type: DataTypes.DATE
        },
        lastLoginAt: {
          type: DataTypes.DATE
        },
        passwordResetToken: {
          type: DataTypes.STRING
        },
        passwordResetExpires: {
          type: DataTypes.DATE
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        indexes: [
          {
            unique: true,
            fields: ['email']
          },
          {
            fields: ['institutionId']
          },
          {
            fields: ['status']
          }
        ]
      }
    );

    this.beforeCreate(async (user) => {
      if (user.changed('passwordHash')) {
        user.passwordHash = await bcrypt.hash(
          user.passwordHash,
          config.security.bcryptRounds
        );
      }
    });

    this.beforeUpdate(async (user) => {
      if (user.changed('passwordHash')) {
        user.passwordHash = await bcrypt.hash(
          user.passwordHash,
          config.security.bcryptRounds
        );
      }
    });

    return this;
  }

  static associate(models) {
    this.belongsToMany(models.Role, {
      through: 'UserRoles',
      as: 'roles',
      foreignKey: 'userId'
    });

    this.hasOne(models.Profile, {
      foreignKey: 'userId',
      as: 'profile'
    });
  }

  // Instance methods
  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    return values;
  }
}

module.exports = User;
