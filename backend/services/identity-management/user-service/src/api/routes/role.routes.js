// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\routes\role.routes.js

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, roleSchemas } = require('../middleware/validator');
const { apiLimiter, roleManagementLimiter } = require('../middleware/rate-limiter');

// Apply rate limiting to all routes
router.use(apiLimiter);

// List roles
router.get('/',
  authenticate,
  authorize('super_admin', 'tenant_admin'),
  roleController.list
);

// Get role by ID
router.get('/:id',
  authenticate,
  authorize('super_admin', 'tenant_admin'),
  roleController.getById
);

// Create role
router.post('/',
  authenticate,
  authorize('super_admin'),
  roleManagementLimiter,
  validate(roleSchemas.create),
  roleController.create
);

// Update role
router.put('/:id',
  authenticate,
  authorize('super_admin'),
  roleManagementLimiter,
  validate(roleSchemas.update),
  roleController.update
);

// Delete role
router.delete('/:id',
  authenticate,
  authorize('super_admin'),
  roleManagementLimiter,
  roleController.delete
);

// Add permissions to role
router.post('/:id/permissions',
  authenticate,
  authorize('super_admin'),
  roleManagementLimiter,
  roleController.addPermissions
);

// Remove permissions from role
router.delete('/:id/permissions',
  authenticate,
  authorize('super_admin'),
  roleManagementLimiter,
  roleController.removePermissions
);

// Get role hierarchy
router.get('/hierarchy',
  authenticate,
  authorize('super_admin', 'tenant_admin'),
  roleController.getHierarchy
);

module.exports = router;
