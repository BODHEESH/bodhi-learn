// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\subscription.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { metrics } = require('../utils/metrics');

class Subscription extends Model {
  static associate(models) {
    Subscription.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    Subscription.hasMany(models.SubscriptionHistory, {
      foreignKey: 'subscriptionId',
      as: 'history'
    });
  }

  // Instance methods
  async updatePlan(planType) {
    try {
      const oldPlan = this.planType;
      this.planType = planType;
      
      // Update limits based on plan
      switch (planType) {
        case 'COMMUNITY':
          this.userLimit = 500;
          this.storageLimit = 50; // GB
          break;
        case 'PREMIUM':
          this.userLimit = 2000;
          this.storageLimit = 500; // GB
          break;
        case 'ENTERPRISE':
          this.userLimit = null; // Unlimited
          this.storageLimit = null; // Unlimited
          break;
      }
      
      await this.save();

      metrics.subscriptionPlanChanges.inc({
        from: oldPlan,
        to: planType
      });

      return true;
    } catch (error) {
      metrics.subscriptionErrors.inc({ type: 'plan_update' });
      throw error;
    }
  }

  // Validation methods
  isActive() {
    return this.status === 'ACTIVE' && new Date() < this.expiryDate;
  }

  hasFeature(feature) {
    return this.features.includes(feature);
  }

  // Plan-specific checks
  isCommunity() {
    return this.planType === 'COMMUNITY';
  }

  isPremium() {
    return this.planType === 'PREMIUM';
  }

  isEnterprise() {
    return this.planType === 'ENTERPRISE';
  }
}

Subscription.init({
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
  planType: {
    type: DataTypes.ENUM('COMMUNITY', 'PREMIUM', 'ENTERPRISE'),
    allowNull: false,
    defaultValue: 'COMMUNITY'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ACTIVE'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  userLimit: {
    type: DataTypes.INTEGER,
    allowNull: true // null means unlimited for enterprise
  },
  storageLimit: {
    type: DataTypes.INTEGER, // in GB
    allowNull: true // null means unlimited for enterprise
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  billingCycle: {
    type: DataTypes.ENUM('MONTHLY', 'YEARLY'),
    defaultValue: 'MONTHLY'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  paymentStatus: {
    type: DataTypes.ENUM('PAID', 'PENDING', 'FAILED'),
    defaultValue: 'PENDING'
  },
  lastBillingDate: {
    type: DataTypes.DATE
  },
  nextBillingDate: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'Subscription',
  tableName: 'subscriptions',
  paranoid: true,
  hooks: {
    beforeCreate: async (subscription) => {
      // Set default features based on plan type
      subscription.features = getFeaturesByPlan(subscription.planType);
    },
    afterCreate: async (subscription) => {
      metrics.subscriptionsCreated.inc({
        plan: subscription.planType
      });
    },
    afterUpdate: async (subscription) => {
      if (subscription.changed('status')) {
        metrics.subscriptionStatusChanges.inc({
          from: subscription.previous('status'),
          to: subscription.status
        });
      }
    }
  }
});

// Helper function to get features by plan
function getFeaturesByPlan(planType) {
  const features = {
    COMMUNITY: [
      'BASIC_COURSE_MANAGEMENT',
      'STANDARD_ATTENDANCE',
      'BASIC_COMMUNICATION',
      'BASIC_REPORTING',
      'STANDARD_USER_MANAGEMENT'
    ],
    PREMIUM: [
      'ADVANCED_COURSE_MANAGEMENT',
      'AI_ANALYTICS',
      'ENHANCED_COMMUNICATION',
      'CUSTOM_REPORTING',
      'ADVANCED_USER_MANAGEMENT',
      'GAMIFICATION',
      'PARENT_PORTAL',
      'API_ACCESS'
    ],
    ENTERPRISE: [
      'FULL_FEATURE_ACCESS',
      'WHITE_LABELING',
      'CUSTOM_DEVELOPMENT',
      'ADVANCED_AI',
      'ENTERPRISE_SECURITY',
      'CUSTOM_WORKFLOWS',
      'COMPLETE_API_ACCESS',
      'PRIVATE_CLOUD'
    ]
  };
  
  return features[planType] || [];
}

module.exports = Subscription;
