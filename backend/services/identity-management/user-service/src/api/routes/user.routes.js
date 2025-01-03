// // \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\routes\v1\user.routes.js

// const express = require('express');
// const userController = require('../../controllers/user.controller');
// const { authenticate, authorize } = require('../../middleware/auth.middleware');
// const { validateSchema } = require('../../middleware/validation.middleware');
// const { 
//   createUserSchema, 
//   updateUserSchema, 
//   updateProfileSchema 
// } = require('../../validation/user.schema');

// const router = express.Router();

// // Public routes (protected by API key)
// router.get('/by-email', userController.getByEmail);

// // Protected routes (require authentication)
// router.use(authenticate);

// // User management routes
// router.get('/', authorize(['admin']), userController.list);
// router.post('/', 
//   authorize(['admin']), 
//   validateSchema(createUserSchema), 
//   userController.create
// );
// router.get('/:id', userController.getById);
// router.put('/:id',
//   validateSchema(updateUserSchema),
//   userController.update
// );
// router.delete('/:id', 
//   authorize(['admin']), 
//   userController.delete
// );

// // Profile management
// router.get('/:id/profile', userController.getProfile);
// router.put('/:id/profile',
//   validateSchema(updateProfileSchema),
//   userController.updateProfile
// );

// // Role management
// router.get('/:id/roles', userController.getRoles);
// router.post('/:id/roles', 
//   authorize(['admin']), 
//   userController.assignRoles
// );
// router.delete('/:id/roles/:roleId', 
//   authorize(['admin']), 
//   userController.removeRole
// );

// // Status management
// router.post('/:id/activate', 
//   authorize(['admin']), 
//   userController.activate
// );
// router.post('/:id/deactivate', 
//   authorize(['admin']), 
//   userController.deactivate
// );
// router.post('/:id/suspend', 
//   authorize(['admin']), 
//   userController.suspend
// );

// // Password management
// router.put('/:id/password', userController.updatePassword);
// router.post('/:id/password/reset', userController.resetPassword);

// // MFA management
// router.get('/:id/mfa', userController.getMFAStatus);
// router.post('/:id/mfa/setup', userController.setupMFA);
// router.post('/:id/mfa/verify', userController.verifyMFA);
// router.delete('/:id/mfa', userController.disableMFA);
// router.post('/:id/mfa/backup-codes', userController.generateBackupCodes);

// // Activity tracking
// router.get('/:id/activity', userController.getActivityLogs);
// router.put('/:id/last-login', userController.updateLastLogin);

// module.exports = router;


// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\routes\v1\user.route.js


const express = require('express');
const validate = require('../../middleware/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const auth = require('../../middleware/auth');
const checkPermissions = require('../../middleware/permissions');

const router = express.Router();

// Core User Routes
router
  .route('/')
  .post(
    auth(),
    checkPermissions('users:create'),
    validate(userValidation.createUser),
    userController.createUser
  )
  .get(
    auth(),
    checkPermissions('users:read'),
    validate(userValidation.queryUsers),
    userController.getUsers
  );

router
  .route('/bulk')
  .post(
    auth(),
    checkPermissions('users:create'),
    validate(userValidation.bulkCreateUsers),
    userController.bulkCreateUsers
  );

router
  .route('/:id')
  .get(
    auth(),
    checkPermissions('users:read'),
    validate(userValidation.getUser),
    userController.getUser
  )
  .put(
    auth(),
    checkPermissions('users:update'),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    auth(),
    checkPermissions('users:delete'),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

// Profile Routes
router
  .route('/:id/profile')
  .get(
    auth(),
    checkPermissions('profile:read'),
    validate(userValidation.getUser),
    userController.getUserProfile
  )
  .put(
    auth(),
    checkPermissions('profile:update'),
    validate(userValidation.updateProfile),
    userController.updateUserProfile
  );

// Preferences Routes
router
  .route('/:id/preferences')
  .get(
    auth(),
    checkPermissions('preferences:read'),
    validate(userValidation.getUser),
    userController.getUserPreferences
  )
  .put(
    auth(),
    checkPermissions('preferences:update'),
    validate(userValidation.updatePreferences),
    userController.updateUserPreferences
  );

// MFA Routes
router
  .route('/:id/mfa/enable')
  .post(
    auth(),
    checkPermissions('mfa:manage'),
    validate(userValidation.getUser),
    userController.enableMfa
  );

router
  .route('/:id/mfa/verify')
  .post(
    auth(),
    validate(userValidation.mfaValidation),
    userController.verifyMfa
  );

router
  .route('/:id/mfa/disable')
  .post(
    auth(),
    checkPermissions('mfa:manage'),
    validate(userValidation.getUser),
    userController.disableMfa
  );

// Backup Codes Routes
router
  .route('/:id/backup-codes')
  .get(
    auth(),
    checkPermissions('mfa:manage'),
    validate(userValidation.getUser),
    userController.generateBackupCodes
  );

router
  .route('/:id/backup-codes/verify')
  .post(
    auth(),
    validate(userValidation.verifyBackupCode),
    userController.verifyBackupCode
  );

// Session Management Routes
router
  .route('/:id/sessions')
  .get(
    auth(),
    checkPermissions('sessions:read'),
    validate(userValidation.sessionManagement),
    userController.getUserSessions
  )
  .delete(
    auth(),
    checkPermissions('sessions:manage'),
    validate(userValidation.sessionManagement),
    userController.terminateAllSessions
  );

router
  .route('/:id/sessions/:sessionId')
  .delete(
    auth(),
    checkPermissions('sessions:manage'),
    validate(userValidation.sessionManagement),
    userController.terminateSession
  );

// Account Management Routes
router
  .route('/:id/lock')
  .post(
    auth(),
    checkPermissions('users:manage'),
    validate(userValidation.getUser),
    userController.lockAccount
  );

router
  .route('/:id/unlock')
  .post(
    auth(),
    checkPermissions('users:manage'),
    validate(userValidation.getUser),
    userController.unlockAccount
  );

module.exports = router;
