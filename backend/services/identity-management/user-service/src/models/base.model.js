// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\base.model.js

const { Model } = require('sequelize');

class BaseModel extends Model {
  static init(attributes, options) {
    super.init(
      {
        ...attributes,
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        ...options,
        paranoid: true, // Soft deletes
        timestamps: true
      }
    );
  }

  // Common methods for all models
  static async softDelete(id) {
    const instance = await this.findByPk(id);
    if (instance) {
      await instance.destroy();
      return true;
    }
    return false;
  }

  static async restore(id) {
    const instance = await this.findByPk(id, { paranoid: false });
    if (instance && instance.deletedAt) {
      await instance.restore();
      return true;
    }
    return false;
  }
}

module.exports = BaseModel;
