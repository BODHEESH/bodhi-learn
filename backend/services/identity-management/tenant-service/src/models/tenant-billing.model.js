// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\tenant-billing.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { metrics } = require('../utils/metrics');

class TenantBilling extends Model {
  static associate(models) {
    TenantBilling.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
  }

  // Instance methods
  async updateBillingStatus(status) {
    try {
      const oldStatus = this.status;
      this.status = status;
      await this.save();

      metrics.tenantBillingStatusChanged.inc({
        from: oldStatus,
        to: status
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'billing_status_update' });
      throw error;
    }
  }

  async recordPayment(amount, method) {
    try {
      this.lastPaymentAmount = amount;
      this.lastPaymentMethod = method;
      this.lastPaymentDate = new Date();
      this.totalPayments += amount;
      await this.save();

      metrics.tenantPaymentRecorded.inc({
        method,
        amount
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'payment_record' });
      throw error;
    }
  }

  // Validation methods
  isActive() {
    return this.status === 'ACTIVE';
  }

  hasValidPaymentMethod() {
    return this.paymentMethod && this.paymentMethodValid;
  }

  isOverdue() {
    if (!this.nextBillingDate) return false;
    return new Date() > this.nextBillingDate;
  }
}

TenantBilling.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED'),
    defaultValue: 'ACTIVE',
    allowNull: false
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'FREE'
  },
  billingCycle: {
    type: DataTypes.ENUM('MONTHLY', 'YEARLY'),
    defaultValue: 'MONTHLY',
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentMethodValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastPaymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastPaymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  lastPaymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalPayments: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  billingAddress: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  taxInfo: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'TenantBilling',
  tableName: 'tenant_billing',
  paranoid: true,
  indexes: [
    {
      fields: ['tenantId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['plan']
    },
    {
      fields: ['nextBillingDate']
    }
  ],
  hooks: {
    afterCreate: async (billing) => {
      metrics.tenantBillingCreated.inc({
        plan: billing.plan
      });
    },
    afterUpdate: async (billing) => {
      if (billing.changed('status')) {
        metrics.tenantBillingStatusChanged.inc({
          from: billing.previous('status'),
          to: billing.status
        });
      }
      if (billing.changed('plan')) {
        metrics.tenantBillingPlanChanged.inc({
          from: billing.previous('plan'),
          to: billing.plan
        });
      }
    }
  }
});

module.exports = TenantBilling;
