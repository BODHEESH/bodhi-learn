// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\routes\password.routes.js

const express = require('express');
const AuthMiddleware = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate-request');
const { rateLimiter } = require('../middleware/rate-limiter');
const PasswordController = require('../controllers/password.controller');
const {
  resetPasswordSchema,
  changePasswordSchema
} = require('../validators/password.validator');

const router = express.Router();

// Public routes with rate limiting
router.post(
  '/forgot-password',
  rateLimiter('forgotPassword'),
  PasswordController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimiter('resetPassword'),
  validateRequest(resetPasswordSchema),
  PasswordController.resetPassword
);

// Protected routes
router.use(AuthMiddleware.validateToken);

router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  PasswordController.changePassword
);

module.exports = router;
