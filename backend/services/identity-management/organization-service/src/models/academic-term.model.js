// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\academic-term.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class AcademicTerm extends Model {
  static associate(models) {
    AcademicTerm.belongsTo(models.AcademicCalendar, {
      foreignKey: 'calendarId',
      as: 'calendar'
    });
    
    AcademicTerm.hasMany(models.AcademicEvent, {
      foreignKey: 'termId',
      as: 'events'
    });
  }
}

AcademicTerm.init(
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
    type: {
      type: DataTypes.ENUM('semester', 'trimester', 'quarter'),
      allowNull: false
    },
    sequence: {
      type: DataTypes.INTEGER, // Order in the academic year
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    registrationStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    registrationEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    addDropStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    addDropEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    finalExamStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    finalExamEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    gradeSubmissionDeadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
      defaultValue: 'upcoming'
    },
    calendarId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'academic_calendars',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'AcademicTerm',
    tableName: 'academic_terms',
    paranoid: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['calendarId', 'sequence']
      }
    ]
  }
);

module.exports = AcademicTerm;
