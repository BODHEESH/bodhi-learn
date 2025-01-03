// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\audit-log.model.js

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const auditLogSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: {
      type: String,
      required: true,
      index: true
    },
    changes: {
      type: mongoose.SchemaTypes.Mixed
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      required: true
    },
    ip: {
      type: String
    },
    userAgent: {
      type: String
    },
    metadata: {
      type: mongoose.SchemaTypes.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

auditLogSchema.plugin(toJSON);
auditLogSchema.plugin(paginate);

// Create indexes for common queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
