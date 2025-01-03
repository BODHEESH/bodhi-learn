// \d\DREAM\bodhi - learn\backend\models\postgres\UserRole.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

class UserRole extends Model { }

UserRole.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: 'UserRole',
    tableName: 'user_roles',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id', 'role_id'],
            unique: true
        }
    ]
});

module.exports = UserRole;
