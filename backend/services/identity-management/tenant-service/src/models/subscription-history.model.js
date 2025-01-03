// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\subscription-history.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

class SubscriptionHistory extends Model {
  static associate(models) {
    SubscriptionHistory.belongsTo(models.Subscription, {
      foreignKey: 'subscriptionId',
      as: 'subscription'
    });
  }
}

SubscriptionHistory.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subscriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Subscriptions',
      key: 'id'
    }
  },
  changeType: {
    type: DataTypes.ENUM('PLAN_CHANGE', 'STATUS_CHANGE', 'PAYMENT', 'RENEWAL', 'CANCELLATION'),
    allowNull: false
  },
  previousValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  newValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'SubscriptionHistory',
  tableName: 'subscription_history',
  timestamps: true
});

module.exports = SubscriptionHistory;
