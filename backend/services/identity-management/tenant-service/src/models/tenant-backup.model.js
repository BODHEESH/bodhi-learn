// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\tenant-backup.model.js

const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const { metrics } = require('../utils/metrics');

class TenantBackup extends Model {
  static associate(models) {
    TenantBackup.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
  }

  // Instance methods
  async updateStatus(status) {
    try {
      const oldStatus = this.status;
      this.status = status;
      await this.save();

      metrics.tenantBackupStatusChanged.inc({
        from: oldStatus,
        to: status
      });

      return true;
    } catch (error) {
      metrics.tenantErrors.inc({ type: 'backup_status_update' });
      throw error;
    }
  }
}

TenantBackup.init({
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
  backupId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
    allowNull: false
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  },
  error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
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
  modelName: 'TenantBackup',
  tableName: 'tenant_backups',
  paranoid: true,
  timestamps: true,
  hooks: {
    beforeCreate: async (backup) => {
      backup.startedAt = new Date();
    },
    afterCreate: async (backup) => {
      metrics.tenantBackupCreated.inc();
    },
    afterUpdate: async (backup) => {
      if (backup.status === 'COMPLETED') {
        backup.completedAt = new Date();
        metrics.tenantBackupCompleted.inc();
      } else if (backup.status === 'FAILED') {
        metrics.tenantBackupFailed.inc();
      }
    }
  }
});

module.exports = TenantBackup;
