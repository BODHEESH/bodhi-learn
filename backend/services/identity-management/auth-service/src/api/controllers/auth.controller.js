const { AuthService } = require('../services/auth.service');
const { AuthError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    try {
      const { email, password, institutionId } = req.body;
      const result = await this.authService.login({ email, password, institutionId });
      
      logger.info('User logged in successfully', { userId: result.user.id });
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      logger.error('Login failed:', error);
      this.handleError(res, error);
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      
      res.json({
        status: 'success',
        data: tokens
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      this.handleError(res, error);
    }
  }

  async logout(req, res) {
    try {
      await this.authService.logout(req.token);
      logger.info('User logged out successfully', { userId: req.user.id });
      
      res.status(204).send();
    } catch (error) {
      logger.error('Logout failed:', error);
      this.handleError(res, error);
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, institutionId } = req.body;
      await this.authService.requestPasswordReset(email, institutionId);
      
      logger.info('Password reset requested', { email });
      res.json({
        status: 'success',
        message: 'Password reset instructions sent to email'
      });
    } catch (error) {
      logger.error('Password reset request failed:', error);
      this.handleError(res, error);
    }
  }

  async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      await this.authService.updatePassword(req.user.id, currentPassword, newPassword);
      
      logger.info('Password updated successfully', { userId: req.user.id });
      res.json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Password update failed:', error);
      this.handleError(res, error);
    }
  }

  async setupMFA(req, res) {
    try {
      const { type, phoneNumber } = req.body;
      const mfaSetup = await this.authService.setupMFA(req.user.id, type, phoneNumber);
      
      logger.info('MFA setup initiated', { userId: req.user.id, type });
      res.json({
        status: 'success',
        data: mfaSetup
      });
    } catch (error) {
      logger.error('MFA setup failed:', error);
      this.handleError(res, error);
    }
  }

  async verifyMFA(req, res) {
    try {
      const { code, type } = req.body;
      await this.authService.verifyMFA(req.user.id, type, code);
      
      logger.info('MFA verified successfully', { userId: req.user.id });
      res.json({
        status: 'success',
        message: 'MFA verified successfully'
      });
    } catch (error) {
      logger.error('MFA verification failed:', error);
      this.handleError(res, error);
    }
  }

  async disableMFA(req, res) {
    try {
      await this.authService.disableMFA(req.user.id);
      
      logger.info('MFA disabled successfully', { userId: req.user.id });
      res.json({
        status: 'success',
        message: 'MFA disabled successfully'
      });
    } catch (error) {
      logger.error('MFA disable failed:', error);
      this.handleError(res, error);
    }
  }

  async resetUserMFA(req, res) {
    try {
      const { userId } = req.params;
      await this.authService.resetUserMFA(userId, req.user.id);
      
      logger.info('User MFA reset successfully', { 
        adminId: req.user.id,
        targetUserId: userId 
      });
      res.json({
        status: 'success',
        message: 'User MFA reset successfully'
      });
    } catch (error) {
      logger.error('User MFA reset failed:', error);
      this.handleError(res, error);
    }
  }

  handleError(res, error) {
    if (error instanceof AuthError) {
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: error.message
      });
    } else if (error instanceof ValidationError) {
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      });
    } else {
      res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      });
    }
  }
}

module.exports = { AuthController };
