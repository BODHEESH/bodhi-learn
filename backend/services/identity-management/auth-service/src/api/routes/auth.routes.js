// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\routes\v1\auth.routes.js

const express = require('express');
const { AuthController } = require('../controllers/auth.controller');
const { 
  loginLimiter, 
  passwordResetLimiter, 
  mfaVerifyLimiter 
} = require('../middleware/rate-limiter');
const { 
  authenticate, 
  requireRoles, 
  requireMFA 
} = require('../middleware/auth.middleware');
const { validateSchema } = require('../middleware/validation.middleware');
const {
  loginSchema,
  refreshTokenSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  mfaSetupSchema,
  mfaVerifySchema
} = require('../validations/auth.validation');

const router = express.Router();

// Public routes
router.post('/login', 
  loginLimiter,
  validateSchema(loginSchema),
  AuthController.login
);

router.post('/refresh',
  validateSchema(refreshTokenSchema),
  AuthController.refreshToken
);

router.post('/password/reset',
  passwordResetLimiter,
  validateSchema(passwordResetSchema),
  AuthController.resetPassword
);

// Protected routes
router.post('/logout',
  authenticate,
  AuthController.logout
);

router.post('/password/update',
  authenticate,
  validateSchema(passwordUpdateSchema),
  AuthController.updatePassword
);

// MFA routes
router.post('/mfa/setup',
  authenticate,
  validateSchema(mfaSetupSchema),
  AuthController.setupMFA
);

router.post('/mfa/verify',
  authenticate,
  mfaVerifyLimiter,
  validateSchema(mfaVerifySchema),
  AuthController.verifyMFA
);

router.post('/mfa/disable',
  authenticate,
  requireMFA,
  AuthController.disableMFA
);

// Admin routes
router.post('/users/:userId/reset-mfa',
  authenticate,
  requireRoles(['admin']),
  AuthController.resetUserMFA
);

module.exports = router;
