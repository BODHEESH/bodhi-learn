// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\models\academic-event.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class AcademicEvent extends Model {
  static associate(models) {
    AcademicEvent.belongsTo(models.AcademicCalendar, {
      foreignKey: 'calendarId',
      as: 'calendar'
    });
    
    AcademicEvent.belongsTo(models.AcademicTerm, {
      foreignKey: 'termId',
      as: 'term'
    });
  }
}

AcademicEvent.init(
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
      type: DataTypes.ENUM(
        'holiday',
        'exam',
        'registration',
        'graduation',
        'orientation',
        'workshop',
        'seminar',
        'other'
      ),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isAllDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    location: {
      type: DataTypes.STRING
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    notificationSettings: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    calendarId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'academic_calendars',
        key: 'id'
      }
    },
    termId: {
      type: DataTypes.UUID,
      references: {
        model: 'academic_terms',
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
    modelName: 'AcademicEvent',
    tableName: 'academic_events',
    paranoid: true,
    timestamps: true,
    indexes: [
      {
        fields: ['calendarId', 'startDate']
      },
      {
        fields: ['termId', 'startDate']
      }
    ]
  }
);

module.exports = AcademicEvent;
