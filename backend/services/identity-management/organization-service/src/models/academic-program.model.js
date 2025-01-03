// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\academic-program.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class AcademicProgram extends Model {
  static associate(models) {
    AcademicProgram.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    
    AcademicProgram.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
    
    // Instead of direct course management, we store references to learning management
    AcademicProgram.hasMany(models.ProgramLearningReference, {
      foreignKey: 'programId',
      as: 'learningReferences'
    });
  }
}

AcademicProgram.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    level: {
      type: DataTypes.ENUM('undergraduate', 'postgraduate', 'doctorate', 'diploma', 'certificate'),
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER, // Duration in months
      allowNull: false
    },
    totalCredits: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft', 'archived'),
      defaultValue: 'draft'
    },
    accreditation: {
      type: DataTypes.JSON, // Store accreditation details
      defaultValue: {}
    },
    admissionRequirements: {
      type: DataTypes.JSON, // Store admission requirements
      defaultValue: {}
    },
    learningOutcomes: {
      type: DataTypes.JSON, // Store program-level learning outcomes
      defaultValue: {}
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    // Reference to learning management service
    learningManagementId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to the program in learning management service'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AcademicProgram',
    tableName: 'academic_programs',
    paranoid: true,
    timestamps: true
  }
);

module.exports = AcademicProgram;
