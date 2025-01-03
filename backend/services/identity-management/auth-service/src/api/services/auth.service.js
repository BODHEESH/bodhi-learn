// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\auth.service.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const config = require('../config/app.config');
const { RedisService } = require('./redis.service');
const { MessageQueue } = require('../utils/message-queue');
const { AuthError, ValidationError } = require('../utils/errors');
const { UserService } = require('./user.service');
const { EmailService } = require('./email.service');

class AuthService {
  constructor() {
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
    this.userService = new UserService();
    this.emailService = new EmailService();
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userData) {
    const { userId, institutionId, roles, mfaVerified } = userData;

    // Access token - short lived
    const accessToken = jwt.sign(
      { 
        userId,
        institutionId,
        roles,
        type: 'access',
        mfaVerified
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessTokenExpiry }
    );

    // Refresh token - long lived
    const refreshToken = jwt.sign(
      { 
        userId,
        type: 'refresh'
      },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  async login({ email, password, institutionId }) {
    // This would make an internal microservice call to user-service
    const user = await this.getUserDetails(email, institutionId);
    
    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Invalid credentials');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      institutionId: user.institutionId,
      roles: user.roles
    });

    // Store refresh token with user context
    await this.redis.setRefreshToken(tokens.refreshToken, {
      userId: user.id,
      institutionId: user.institutionId
    });

    // Publish login event
    await this.messageQueue.publish('auth-exchange', 'user.login', {
      userId: user.id,
      institutionId: user.institutionId,
      timestamp: new Date()
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles
      },
      tokens
    };
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      if (decoded.type !== 'refresh') {
        throw new AuthError('Invalid token type');
      }

      // Get token data from Redis
      const tokenData = await this.redis.getRefreshToken(refreshToken);
      if (!tokenData) {
        throw new AuthError('Invalid refresh token');
      }

      const { userId, institutionId } = tokenData;

      // Get user roles from user-service
      const user = await this.getUserById(userId);
      if (!user) {
        throw new AuthError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = this.generateTokens({
        userId,
        institutionId,
        roles: user.roles
      });

      // Rotate refresh token
      await Promise.all([
        this.redis.deleteRefreshToken(refreshToken),
        this.redis.setRefreshToken(tokens.refreshToken, { userId, institutionId })
      ]);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid refresh token');
      }
      throw error;
    }
  }

  async logout(refreshToken) {
    // Invalidate refresh token
    await this.redis.deleteRefreshToken(refreshToken);
  }

  async validateToken(token) {
    try {
      if (!token) {
        throw new AuthError('Token is required');
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      
      if (decoded.type !== 'access') {
        throw new AuthError('Invalid token type');
      }

      // Optional: Additional validation against user service
      const user = await this.getUserById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AuthError('User not found or inactive');
      }

      return {
        valid: true,
        decoded
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      throw error;
    }
  }

  async requestPasswordReset(email) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return;
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      config.jwt.resetSecret,
      { expiresIn: '1h' }
    );

    // Store reset token in Redis with expiry
    await this.redis.setResetToken(resetToken, user.id, 3600);

    // Send reset email
    await this.emailService.sendPasswordReset(user.email, resetToken);
  }

  async validateResetToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.resetSecret);
      if (decoded.type !== 'reset') {
        throw new AuthError('Invalid token type');
      }

      const storedUserId = await this.redis.getResetToken(token);
      if (!storedUserId || storedUserId !== decoded.userId) {
        throw new AuthError('Invalid or expired reset token');
      }

      return decoded.userId;
    } catch (error) {
      throw new AuthError('Invalid or expired reset token');
    }
  }

  async updatePassword(userId, currentPassword, newPassword) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new AuthError('User not found');
    }

    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthError('Current password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.userService.updatePassword(userId, hashedPassword);

    // Invalidate all refresh tokens for this user
    await this.redis.deleteUserRefreshTokens(userId);

    // Notify about password change
    await this.messageQueue.publish('auth-exchange', 'user.password.changed', {
      userId,
      timestamp: new Date()
    });
  }

  async setupMFA(userId) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new AuthError('User not found');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Bodhi Learn (${user.email})`
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substr(2, 10).toUpperCase()
    );

    // Hash backup codes before storing
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashPassword(code))
    );

    // Store MFA details temporarily (user needs to verify first)
    await this.redis.setTempMFADetails(userId, {
      secret: secret.base32,
      backupCodes: hashedBackupCodes
    }, 600); // 10 minutes expiry

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    };
  }

  async verifyMFA(userId, code) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new AuthError('User not found');
    }

    const mfaDetails = user.mfaEnabled
      ? await this.userService.getMFADetails(userId)
      : await this.redis.getTempMFADetails(userId);

    if (!mfaDetails) {
      throw new AuthError('MFA not set up or expired');
    }

    const isValidTOTP = speakeasy.totp.verify({
      secret: mfaDetails.secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isValidTOTP) {
      // Check if it's a valid backup code
      const isValidBackupCode = await this.verifyAndInvalidateBackupCode(
        userId,
        code,
        mfaDetails.backupCodes
      );

      if (!isValidBackupCode) {
        throw new AuthError('Invalid MFA code');
      }
    }

    if (!user.mfaEnabled) {
      // First time MFA verification - save the details permanently
      await this.userService.enableMFA(userId, mfaDetails);
      await this.redis.deleteTempMFADetails(userId);
    }

    // Generate new session tokens
    return this.generateTokens({
      userId: user.id,
      institutionId: user.institutionId,
      roles: user.roles,
      mfaVerified: true
    });
  }

  async verifyAndInvalidateBackupCode(userId, code, storedCodes) {
    for (let i = 0; i < storedCodes.length; i++) {
      const isValid = await this.verifyPassword(code, storedCodes[i]);
      if (isValid) {
        // Remove used backup code
        storedCodes.splice(i, 1);
        await this.userService.updateBackupCodes(userId, storedCodes);
        return true;
      }
    }
    return false;
  }

  async disableMFA(userId, code) {
    const user = await this.getUserById(userId);
    if (!user || !user.mfaEnabled) {
      throw new AuthError('MFA not enabled');
    }

    // Verify the code before disabling
    const mfaDetails = await this.userService.getMFADetails(userId);
    const isValidTOTP = speakeasy.totp.verify({
      secret: mfaDetails.secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isValidTOTP) {
      throw new AuthError('Invalid MFA code');
    }

    await this.userService.disableMFA(userId);

    // Invalidate all existing sessions
    await this.redis.deleteUserRefreshTokens(userId);

    // Notify about MFA change
    await this.messageQueue.publish('auth-exchange', 'user.mfa.disabled', {
      userId,
      timestamp: new Date()
    });
  }

  // Internal methods for microservice communication
  async getUserDetails(email, institutionId) {
    const user = await this.userService.getUserByEmail(email, institutionId);
    if (user) {
      // Update last login timestamp
      await this.userService.updateLastLogin(user.id);
    }
    return user;
  }

  async getUserById(userId) {
    return this.userService.getUserById(userId);
  }
}

module.exports = { AuthService };
