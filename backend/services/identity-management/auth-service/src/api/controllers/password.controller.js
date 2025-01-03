// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\controllers\password.controller.js

const { AuthService } = require('../../services/auth.service');
const { ValidationError } = require('../../utils/errors');
const logger = require('../../utils/logger');

class PasswordController {
  constructor() {
    this.authService = new AuthService();
  }

  async forgotPassword(req, res, next) {
    try {
      const { email, institutionId } = req.body;

      if (!email || !institutionId) {
        throw new ValidationError('Email and institution ID are required');
      }

      await this.authService.initiatePasswordReset(email, institutionId);

      res.json({
        message: 'If an account exists with this email, you will receive password reset instructions'
      });
    } catch (error) {
      logger.error('Password reset initiation failed:', {
        error: error.message,
        email: req.body.email
      });
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      await this.authService.resetPassword(token, password);

      res.json({
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      logger.error('Password reset failed:', {
        error: error.message
      });
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, password } = req.body;
      const userId = req.user.userId;

      await this.authService.changePassword(userId, currentPassword, password);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Password change failed:', {
        error: error.message,
        userId: req.user.userId
      });
      next(error);
    }
  }
}

module.exports = new PasswordController();
