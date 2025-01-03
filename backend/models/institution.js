const { Model, DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

class Institution extends Model { }

Institution.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    domain: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
    },
    settings: {
        type: DataTypes.JSONB,
        defaultValue: {}
    },
    subscription_plan: {
        type: DataTypes.STRING(50)
    },
    subscription_status: {
        type: DataTypes.ENUM('trial', 'active', 'expired'),
        defaultValue: 'trial'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deleted_at: {
        type: DataTypes.DATE
    }
}, {
    sequelize,
    modelName: 'Institution',
    tableName: 'institutions',
    paranoid: true,
    timestamps: true,
    indexes: [
        {
            fields: ['code'],
            unique: true
        },
        {
            fields: ['domain'],
            unique: true
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = Institution;
