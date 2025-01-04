// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\routes\role.routes.js

const express = require('express');
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateSchema } = require('../middleware/validation.middleware');
const { apiLimiter, roleManagementLimiter } = require('../middleware/rate-limiter');
const { 
  createRoleSchema, 
  updateRoleSchema,
  addPermissionsSchema 
} = require('../validators/role.schema');

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// List roles
router.get('/',
  authenticate,
  authorize(['super_admin', 'tenant_admin']),
  roleController.list
);

// Get role by ID
router.get('/:id',
  authenticate,
  authorize(['super_admin', 'tenant_admin']),
  roleController.getById
);

// Create role
router.post('/',
  authenticate,
  authorize(['super_admin']),
  roleManagementLimiter,
  validateSchema(createRoleSchema),
  roleController.create
);

// Update role
router.put('/:id',
  authenticate,
  authorize(['super_admin']),
  roleManagementLimiter,
  validateSchema(updateRoleSchema),
  roleController.update
);

// Delete role
router.delete('/:id',
  authenticate,
  authorize(['super_admin']),
  roleManagementLimiter,
  roleController.delete
);

// Role permissions
router.post('/:id/permissions',
  authenticate,
  authorize(['super_admin']),
  roleManagementLimiter,
  validateSchema(addPermissionsSchema),
  roleController.addPermissions
);

router.delete('/:id/permissions',
  authenticate,
  authorize(['super_admin']),
  roleManagementLimiter,
  validateSchema(addPermissionsSchema),
  roleController.removePermissions
);

// Get role hierarchy
router.get('/hierarchy',
  authenticate,
  authorize(['super_admin', 'tenant_admin']),
  roleController.getHierarchy
);

module.exports = router;
