// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\region.model.js

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const regionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      enum: ['AWS', 'GCP', 'AZURE']
    },
    location: {
      continent: String,
      country: String,
      city: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE'
    },
    services: [{
      type: String,
      enum: ['COMPUTE', 'STORAGE', 'DATABASE', 'CACHE']
    }],
    endpoints: {
      type: Map,
      of: String
    },
    capacity: {
      compute: Number,
      storage: Number,
      memory: Number
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

regionSchema.plugin(toJSON);
regionSchema.plugin(paginate);

const Region = mongoose.model('Region', regionSchema);
module.exports = Region;
