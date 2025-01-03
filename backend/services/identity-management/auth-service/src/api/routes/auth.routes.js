// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\routes\v1\auth.routes.js

const express = require('express');
const { AuthController } = require('../../controllers/auth.controller');
const { RateLimitMiddleware } = require('../../middleware/rate-limit.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();
const authController = new AuthController();
const rateLimitMiddleware = new RateLimitMiddleware();

// Public routes
router.post(
  '/login',
  rateLimitMiddleware.loginLimiter(),
  (req, res) => authController.login(req, res)
);

router.post(
  '/refresh',
  (req, res) => authController.refresh(req, res)
);

router.post(
  '/password/reset',
  rateLimitMiddleware.passwordResetLimiter(),
  (req, res) => authController.resetPassword(req, res)
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  (req, res) => authController.logout(req, res)
);

router.post(
  '/password/update',
  authenticate,
  (req, res) => authController.updatePassword(req, res)
);

// MFA routes
router.post(
  '/mfa/setup',
  authenticate,
  (req, res) => authController.setupMFA(req, res)
);

router.post(
  '/mfa/verify',
  authenticate,
  rateLimitMiddleware.mfaVerifyLimiter(),
  (req, res) => authController.verifyMFA(req, res)
);

router.post(
  '/mfa/disable',
  authenticate,
  rateLimitMiddleware.mfaVerifyLimiter(),
  (req, res) => authController.disableMFA(req, res)
);

module.exports = router;
