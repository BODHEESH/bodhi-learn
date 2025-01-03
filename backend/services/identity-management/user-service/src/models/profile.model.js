// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\profile.model.js

const { DataTypes } = require('sequelize');
const BaseModel = require('./base.model');

class Profile extends BaseModel {
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
          allowNull: false,
          unique: true
        },
        avatarUrl: {
          type: DataTypes.STRING
        },
        phoneNumber: {
          type: DataTypes.STRING,
          validate: {
            is: /^\+?[\d\s-]+$/
          }
        },
        dateOfBirth: {
          type: DataTypes.DATEONLY
        },
        gender: {
          type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say')
        },
        address: {
          type: DataTypes.JSONB
        },
        bio: {
          type: DataTypes.TEXT
        },
        preferences: {
          type: DataTypes.JSONB,
          defaultValue: {}
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'Profile',
        tableName: 'profiles',
        indexes: [
          {
            unique: true,
            fields: ['userId']
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

  // Custom methods for profile-specific operations
  async updateAvatar(url) {
    this.avatarUrl = url;
    await this.save();
  }

  async updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    await this.save();
  }

  async updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    await this.save();
  }
}

module.exports = Profile;
