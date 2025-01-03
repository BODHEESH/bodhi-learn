// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/app.config');
const { RedisService } = require('./redis.service');
const { MessageQueue } = require('../utils/message-queue');
const { AuthError, ValidationError } = require('../utils/errors');
const { UserService } = require('./user.service');

class AuthService {
  constructor() {
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
    this.userService = new UserService();
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  generateTokens(userData) {
    const { userId, institutionId, roles } = userData;

    // Access token - short lived
    const accessToken = jwt.sign(
      { 
        userId,
        institutionId,
        roles,
        type: 'access'
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
