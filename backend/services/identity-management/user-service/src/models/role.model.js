// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\role.model.js

const { DataTypes } = require('sequelize');
const BaseModel = require('./base.model');

class Role extends BaseModel {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        displayName: {
          type: DataTypes.STRING,
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT
        },
        permissions: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        level: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        metadata: {
          type: DataTypes.JSONB,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        indexes: [
          {
            unique: true,
            fields: ['name']
          },
          {
            fields: ['level']
          }
        ]
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsToMany(models.User, {
      through: 'UserRoles',
      as: 'users',
      foreignKey: 'roleId'
    });
  }

  // Role hierarchy methods
  static async getHierarchy() {
    const roles = await this.findAll({
      order: [['level', 'ASC']]
    });
    return roles;
  }

  // Permission methods
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  async addPermissions(permissions) {
    this.permissions = [...new Set([...this.permissions, ...permissions])];
    await this.save();
  }

  async removePermissions(permissions) {
    this.permissions = this.permissions.filter(p => !permissions.includes(p));
    await this.save();
  }
}

module.exports = Role;
