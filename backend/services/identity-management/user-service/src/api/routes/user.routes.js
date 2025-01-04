const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateSchema } = require('../middleware/validation.middleware');
const { apiLimiter, createUserLimiter } = require('../middleware/rate-limiter');
const { 
  createUserSchema, 
  updateUserSchema, 
  updateProfileSchema,
  mfaSchema,
  backupCodeSchema 
} = require('../validators/user.schema');

const router = express.Router();

// Apply rate limiting to all routes
router.use(apiLimiter);

// Public routes (protected by API key)
router.get('/by-email', userController.getByEmail);

// Protected routes (require authentication)
router.use(authenticate);

// User management routes
router.get('/', authorize(['admin']), userController.getUsers);
router.post('/', 
  authorize(['admin']), 
  createUserLimiter,
  validateSchema(createUserSchema), 
  userController.createUser
);
router.get('/:id', userController.getUser);
router.put('/:id',
  validateSchema(updateUserSchema),
  userController.updateUser
);
router.delete('/:id', 
  authorize(['admin']), 
  userController.deleteUser
);

// Profile management
router.get('/:id/profile', userController.getUserProfile);
router.put('/:id/profile',
  validateSchema(updateProfileSchema),
  userController.updateUserProfile
);

// Preferences
router.get('/:id/preferences', userController.getUserPreferences);
router.put('/:id/preferences', userController.updateUserPreferences);

// MFA routes
router.post('/:id/mfa/enable', 
  validateSchema(mfaSchema),
  userController.enableMfa
);
router.post('/:id/mfa/verify', 
  validateSchema(mfaSchema),
  userController.verifyMfa
);
router.delete('/:id/mfa', userController.disableMfa);

// Backup codes
router.post('/:id/backup-codes', userController.generateBackupCodes);
router.post('/:id/backup-codes/verify',
  validateSchema(backupCodeSchema),
  userController.verifyBackupCode
);

// Session management
router.get('/:id/sessions', userController.getUserSessions);
router.delete('/:id/sessions/:sessionId', userController.terminateSession);
router.delete('/:id/sessions', userController.terminateAllSessions);

// Account management
router.post('/:id/lock', authorize(['admin']), userController.lockAccount);
router.post('/:id/unlock', authorize(['admin']), userController.unlockAccount);

// Bulk operations
router.post('/bulk', authorize(['admin']), userController.bulkCreateUsers);

module.exports = router;
