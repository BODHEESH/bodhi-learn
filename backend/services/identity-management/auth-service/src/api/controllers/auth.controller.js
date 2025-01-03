// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\controllers\auth.controller.js

const { AuthService } = require('../services/auth.service');
const { validateSchema } = require('../utils/validation');
const {
  loginSchema,
  passwordResetSchema,
  passwordUpdateSchema,
  mfaVerifySchema,
  refreshTokenSchema
} = require('../utils/validation-schemas/auth.schema');

class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  async login(req, res) {
    try {
      const validatedData = await validateSchema(loginSchema, req.body);
      const result = await this.authService.login(validatedData);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async refresh(req, res) {
    try {
      const validatedData = await validateSchema(refreshTokenSchema, req.body);
      const result = await this.authService.refreshToken(validatedData.refreshToken);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async logout(req, res) {
    try {
      await this.authService.logout(req.user.id, req.token);
      res.status(204).send();
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const validatedData = await validateSchema(passwordResetSchema, req.body);
      await this.authService.requestPasswordReset(validatedData.email);
      res.json({ message: 'Password reset link sent successfully' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async updatePassword(req, res) {
    try {
      const validatedData = await validateSchema(passwordUpdateSchema, req.body);
      await this.authService.updatePassword(
        req.user.id,
        validatedData.currentPassword,
        validatedData.newPassword
      );
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async setupMFA(req, res) {
    try {
      const result = await this.authService.setupMFA(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async verifyMFA(req, res) {
    try {
      const validatedData = await validateSchema(mfaVerifySchema, req.body);
      const result = await this.authService.verifyMFA(req.user.id, validatedData.code);
      res.json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async disableMFA(req, res) {
    try {
      const validatedData = await validateSchema(mfaVerifySchema, req.body);
      await this.authService.disableMFA(req.user.id, validatedData.code);
      res.status(204).send();
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

module.exports = { AuthController };
