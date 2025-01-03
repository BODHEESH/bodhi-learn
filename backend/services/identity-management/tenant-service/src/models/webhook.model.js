// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\models\webhook.model.js

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const webhookSchema = mongoose.Schema(
  {
    tenantId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    events: [{
      type: String,
      required: true
    }],
    secret: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'FAILED'],
      default: 'ACTIVE'
    },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    retryConfig: {
      maxAttempts: {
        type: Number,
        default: 3
      },
      backoffRate: {
        type: Number,
        default: 2
      }
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

webhookSchema.plugin(toJSON);
webhookSchema.plugin(paginate);

const Webhook = mongoose.model('Webhook', webhookSchema);
module.exports = Webhook;
