// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\program-learning-reference.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class ProgramLearningReference extends Model {
  static associate(models) {
    ProgramLearningReference.belongsTo(models.AcademicProgram, {
      foreignKey: 'programId',
      as: 'program'
    });
  }
}

ProgramLearningReference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    programId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'academic_programs',
        key: 'id'
      }
    },
    // References to Learning Management Service
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to course in learning management service'
    },
    curriculumId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to curriculum in learning management service'
    },
    type: {
      type: DataTypes.ENUM('course', 'curriculum', 'assessment'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'ProgramLearningReference',
    tableName: 'program_learning_references',
    paranoid: true,
    timestamps: true
  }
);

module.exports = ProgramLearningReference;
