// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\academic-calendar.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class AcademicCalendar extends Model {
  static associate(models) {
    AcademicCalendar.belongsTo(models.Organization, {
      foreignKey: 'organizationId',
      as: 'organization'
    });
    
    AcademicCalendar.hasMany(models.AcademicTerm, {
      foreignKey: 'calendarId',
      as: 'terms'
    });
    
    AcademicCalendar.hasMany(models.AcademicEvent, {
      foreignKey: 'calendarId',
      as: 'events'
    });
  }
}

AcademicCalendar.init(
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
    academicYear: {
      type: DataTypes.STRING,
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
    status: {
      type: DataTypes.ENUM('draft', 'published', 'active', 'archived'),
      defaultValue: 'draft'
    },
    description: {
      type: DataTypes.TEXT
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
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
    modelName: 'AcademicCalendar',
    tableName: 'academic_calendars',
    paranoid: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['organizationId', 'academicYear']
      }
    ]
  }
);

module.exports = AcademicCalendar;
