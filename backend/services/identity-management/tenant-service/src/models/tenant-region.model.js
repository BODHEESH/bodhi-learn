// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\tenant-region.model.js

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tenantRegionSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tenant',
      required: true
    },
    regionId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Region',
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'FAILED'],
      default: 'ACTIVE'
    },
    resources: {
      storage: {
        used: Number,
        limit: Number
      },
      compute: {
        used: Number,
        limit: Number
      },
      database: {
        used: Number,
        limit: Number
      }
    },
    settings: {
      type: mongoose.SchemaTypes.Mixed,
      default: {}
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

// Ensure unique tenant-region combination
tenantRegionSchema.index({ tenantId: 1, regionId: 1 }, { unique: true });

tenantRegionSchema.plugin(toJSON);
tenantRegionSchema.plugin(paginate);

const TenantRegion = mongoose.model('TenantRegion', tenantRegionSchema);
module.exports = TenantRegion;
