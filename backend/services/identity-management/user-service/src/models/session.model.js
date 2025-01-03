// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\session.model.js

const { DataTypes } = require('sequelize');
const BaseModel = require('./base.model');

class Session extends BaseModel {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false
        },
        deviceInfo: {
          type: DataTypes.JSONB,
          allowNull: true
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true
        },
        userAgent: {
          type: DataTypes.STRING,
          allowNull: true
        },
        lastActivityAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'Session',
        tableName: 'sessions',
        indexes: [
          {
            fields: ['userId']
          },
          {
            fields: ['lastActivityAt']
          },
          {
            fields: ['expiresAt']
          }
        ]
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  }

  // Custom methods
  isExpired() {
    return new Date() > this.expiresAt;
  }

  async updateActivity() {
    this.lastActivityAt = new Date();
    await this.save();
  }
}

module.exports = Session;
