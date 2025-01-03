// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\organization.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class Organization extends Model {
  static associate(models) {
    Organization.hasMany(models.Branch, {
      foreignKey: 'organizationId',
      as: 'branches'
    });
    Organization.hasMany(models.Department, {
      foreignKey: 'organizationId',
      as: 'departments'
    });
    Organization.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
  }
}

Organization.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tenants',
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
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 20]
    }
  },
  type: {
    type: DataTypes.ENUM('K12', 'HIGHER_EDUCATION', 'COACHING', 'VOCATIONAL', 'CORPORATE'),
    allowNull: false
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
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      academicYear: {
        start: null,
        end: null
      },
      workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      timezone: 'UTC',
      gradeSystem: 'PERCENTAGE' // PERCENTAGE, GPA, CUSTOM
    }
  },
  branding: {
    type: DataTypes.JSON,
    defaultValue: {
      logo: null,
      colors: {
        primary: '#000000',
        secondary: '#ffffff'
      },
      fonts: {
        primary: 'Arial',
        secondary: 'Times New Roman'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
    defaultValue: 'ACTIVE'
  },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  licenses: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  accreditations: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Organization',
  tableName: 'organizations',
  paranoid: true, // Soft deletes
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['tenantId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Organization;
