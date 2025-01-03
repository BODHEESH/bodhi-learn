// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\models\permission.schema.js

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: String,
  resource: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  },
  conditions: [{
    type: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  }
}, {
  timestamps: true,
  collection: 'permissions'
});

// Indexes
permissionSchema.index({ name: 1 }, { unique: true });
permissionSchema.index({ resource: 1, action: 1 });

// Methods
permissionSchema.methods.checkCondition = function(context) {
  return this.conditions.every(condition => {
    switch (condition.type) {
      case 'ownership':
        return context.userId === context.resourceOwnerId;
      case 'institution':
        return context.institutionId === context.resourceInstitutionId;
      case 'role':
        return context.userRoles.includes(condition.value);
      default:
        return false;
    }
  });
};

// Statics
permissionSchema.statics.findByResourceAction = function(resource, action) {
  return this.find({ resource, action });
};

permissionSchema.statics.findByRole = function(roleName) {
  return this.find({
    'conditions.type': 'role',
    'conditions.value': roleName
  });
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
