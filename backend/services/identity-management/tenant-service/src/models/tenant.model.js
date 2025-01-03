// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\tenant.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { metrics } = require('../utils/metrics');

class Tenant extends Model {
  static associate(models) {
    // Define associations here
    Tenant.hasMany(models.TenantSettings, {
      foreignKey: 'tenantId',
      as: 'settings'
    });
    Tenant.hasMany(models.TenantBilling, {
      foreignKey: 'tenantId',
      as: 'billing'
    });
  }

  // Instance methods
  async updateStatus(status) {
    try {
      const oldStatus = this.status;
      this.status = status;
      await this.save();

      metrics.tenantStatusChanges.inc({
        from: oldStatus,
        to: status
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'status_update' });
      throw error;
    }
  }

  async addFeature(feature) {
    try {
      const features = new Set(this.features);
      features.add(feature);
      this.features = Array.from(features);
      await this.save();
      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'feature_update' });
      throw error;
    }
  }

  async removeFeature(feature) {
    try {
      this.features = this.features.filter(f => f !== feature);
      await this.save();
      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'feature_update' });
      throw error;
    }
  }

  // Validation methods
  isActive() {
    return this.status === 'ACTIVE';
  }

  hasFeature(feature) {
    return this.features.includes(feature);
  }

  isWithinUserLimit() {
    return this.userCount < this.userLimit;
  }

  // Utility methods
  toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    return values;
  }
}

Tenant.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'),
    defaultValue: 'ACTIVE',
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE'),
    defaultValue: 'TRIAL',
    allowNull: false
  },
  features: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    allowNull: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  userLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  userCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  storageLimit: {
    type: DataTypes.BIGINT,
    defaultValue: 5368709120, // 5GB in bytes
    allowNull: false
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
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
  modelName: 'Tenant',
  tableName: 'tenants',
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeCreate: async (tenant) => {
      tenant.slug = tenant.slug || tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    },
    afterCreate: async (tenant) => {
      metrics.tenantCreated.inc({
        type: tenant.type
      });
    },
    afterUpdate: async (tenant) => {
      if (tenant.changed('status')) {
        metrics.tenantStatusChanges.inc({
          from: tenant.previous('status'),
          to: tenant.status
        });
      }
    }
  }
});

module.exports = Tenant;
