// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\branch.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class Branch extends Model {
  static associate(models) {
    Branch.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    Branch.hasMany(models.Department, {
      foreignKey: 'branchId',
      as: 'departments'
    });
  }
}

Branch.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  organizationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Organizations',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 20]
    }
  },
  type: {
    type: DataTypes.ENUM('MAIN', 'SATELLITE', 'VIRTUAL'),
    defaultValue: 'SATELLITE'
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      hasRequiredFields(value) {
        const required = ['street', 'city', 'state', 'country', 'postalCode'];
        required.forEach(field => {
          if (!value[field]) {
            throw new Error(`Address must include ${field}`);
          }
        });
      }
    }
  },
  contact: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      hasRequiredFields(value) {
        const required = ['email', 'phone'];
        required.forEach(field => {
          if (!value[field]) {
            throw new Error(`Contact must include ${field}`);
          }
        });
      }
    }
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  capacity: {
    type: DataTypes.JSON,
    defaultValue: {
      students: 0,
      staff: 0,
      classrooms: 0
    }
  },
  operatingHours: {
    type: DataTypes.JSON,
    defaultValue: {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' }
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'CLOSED'),
    defaultValue: 'ACTIVE'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Branch',
  tableName: 'branches',
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['organizationId', 'code']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Branch;
