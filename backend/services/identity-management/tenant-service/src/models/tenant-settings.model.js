// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\tenant-settings.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { metrics } = require('../utils/metrics');

class TenantSettings extends Model {
  static associate(models) {
    TenantSettings.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
  }

  // Instance methods
  async updateSetting(key, value) {
    try {
      const oldValue = this.settings[key];
      this.settings = {
        ...this.settings,
        [key]: value
      };
      await this.save();

      metrics.tenantSettingsUpdated.inc({
        setting: key
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'settings_update' });
      throw error;
    }
  }

  async removeSetting(key) {
    try {
      const { [key]: removed, ...remaining } = this.settings;
      this.settings = remaining;
      await this.save();

      metrics.tenantSettingsRemoved.inc({
        setting: key
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'settings_remove' });
      throw error;
    }
  }
}

TenantSettings.init({
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
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  theme: {
    type: DataTypes.JSONB,
    defaultValue: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      logo: null
    },
    allowNull: false
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h'
    },
    allowNull: false
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  integrations: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  notifications: {
    type: DataTypes.JSONB,
    defaultValue: {
      email: true,
      slack: false,
      webhook: false
    },
    allowNull: false
  },
  security: {
    type: DataTypes.JSONB,
    defaultValue: {
      mfa: false,
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSymbols: true
      },
      ipWhitelist: []
    },
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
  modelName: 'TenantSettings',
  tableName: 'tenant_settings',
  paranoid: true,
  indexes: [
    {
      fields: ['tenantId']
    }
  ],
  hooks: {
    afterCreate: async (settings) => {
      metrics.tenantSettingsCreated.inc();
    },
    afterUpdate: async (settings) => {
      if (settings.changed('settings')) {
        metrics.tenantSettingsUpdated.inc();
      }
    }
  }
});

module.exports = TenantSettings;
