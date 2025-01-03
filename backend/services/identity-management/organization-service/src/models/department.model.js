// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\department.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class Department extends Model {
  static associate(models) {
    Department.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    Department.belongsTo(models.Branch, {
      foreignKey: 'branchId',
      as: 'branch'
    });
    Department.belongsTo(models.Department, {
      foreignKey: 'parentDepartmentId',
      as: 'parentDepartment'
    });
    Department.hasMany(models.Department, {
      foreignKey: 'parentDepartmentId',
      as: 'childDepartments'
    });
  }
}

Department.init({
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
  branchId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Branches',
      key: 'id'
    }
  },
  parentDepartmentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Departments',
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
    type: DataTypes.ENUM('ACADEMIC', 'ADMINISTRATIVE', 'SUPPORT', 'RESEARCH'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  head: {
    type: DataTypes.JSON,
    allowNull: true,
    validate: {
      hasRequiredFields(value) {
        if (value) {
          const required = ['userId', 'name', 'designation'];
          required.forEach(field => {
            if (!value[field]) {
              throw new Error(`Department head must include ${field}`);
            }
          });
        }
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
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      building: null,
      floor: null,
      room: null
    }
  },
  resources: {
    type: DataTypes.JSON,
    defaultValue: {
      staff: 0,
      budget: 0,
      facilities: []
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'RESTRUCTURING'),
    defaultValue: 'ACTIVE'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Department',
  tableName: 'departments',
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['organizationId', 'branchId', 'code']
    },
    {
      fields: ['organizationId']
    },
    {
      fields: ['branchId']
    },
    {
      fields: ['parentDepartmentId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Department;
