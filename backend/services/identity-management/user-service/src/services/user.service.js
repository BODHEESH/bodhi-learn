// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\user.service.js

const BaseService = require('./base.service');
const { User, Role, Profile, UserRole, ActivityLog } = require('../models');
const { ValidationError, AuthError, NotFoundError } = require('../utils/errors');
const { MessageQueue } = require('../utils/message-queue');
const { RedisService } = require('./redis.service');
const config = require('../config/app.config');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const logger = require('../utils/logger');
const crypto = require('crypto');

class UserService extends BaseService {
  constructor() {
    super(User);
    this.messageQueue = new MessageQueue();
    this.redis = new RedisService();
  }

  // User CRUD operations with caching
  async findById(id, options = {}) {
    const cacheKey = `user:${id}`;
    
    try {
      // Try to get from cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const user = await super.findById(id, {
        include: [
          { model: Role, as: 'roles' },
          { model: Profile, as: 'profile' }
        ],
        ...options
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(user), config.cache.ttl.user);
      return user;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async findByEmail(email, institutionId) {
    const cacheKey = `user:email:${email}:${institutionId}`;
    
    try {
      // Try to get from cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const user = await this.findOne({
        where: { email, institutionId },
        include: [
          { model: Role, as: 'roles' },
          { model: Profile, as: 'profile' }
        ]
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(user), config.cache.ttl.user);
      return user;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async create(userData) {
    return this.withTransaction(async (transaction) => {
      try {
        // Hash password
        const hashedPassword = await this.hashPassword(userData.password);

        // Create user
        const user = await super.create({
          ...userData,
          passwordHash: hashedPassword
        }, { transaction });

        // Create associated profile
        if (userData.profile) {
          await Profile.create(
            {
              userId: user.id,
              ...userData.profile
            },
            { transaction }
          );
        }

        // Assign roles
        if (userData.roles?.length) {
          await this.assignRoles(user.id, userData.roles, transaction);
        }

        // Publish user created event
        await this.messageQueue.publish('user.created', {
          userId: user.id,
          institutionId: user.institutionId,
          email: user.email
        });

        // Invalidate cache
        await this.invalidateUserCache(user.id);

        return this.findById(user.id);
      } catch (error) {
        logger.error('Error creating user:', error);
        throw error;
      }
    });
  }

  async update(id, updateData) {
    return this.withTransaction(async (transaction) => {
      try {
        const user = await this.findById(id);
        if (!user) {
          throw new NotFoundError('User not found');
        }

        // Update user
        await super.update(id, updateData, { transaction });

        // Update profile if provided
        if (updateData.profile) {
          await Profile.update(
            updateData.profile,
            {
              where: { userId: id },
              transaction
            }
          );
        }

        // Publish user updated event
        await this.messageQueue.publish('user.updated', {
          userId: id,
          institutionId: user.institutionId,
          updates: Object.keys(updateData)
        });

        // Invalidate cache
        await this.invalidateUserCache(id);

        return this.findById(id);
      } catch (error) {
        logger.error('Error updating user:', error);
        throw error;
      }
    });
  }

  async delete(id) {
    return this.withTransaction(async (transaction) => {
      try {
        const user = await this.findById(id);
        if (!user) {
          throw new NotFoundError('User not found');
        }

        // Delete user and related data
        await Promise.all([
          super.delete(id, { transaction }),
          Profile.destroy({ where: { userId: id }, transaction }),
          UserRole.destroy({ where: { userId: id }, transaction }),
          ActivityLog.destroy({ where: { userId: id }, transaction })
        ]);

        // Publish user deleted event
        await this.messageQueue.publish('user.deleted', {
          userId: id,
          institutionId: user.institutionId
        });

        // Invalidate cache
        await this.invalidateUserCache(id);

        return true;
      } catch (error) {
        logger.error('Error deleting user:', error);
        throw error;
      }
    });
  }

  // Role management
  async assignRoles(userId, roleIds, transaction) {
    try {
      const userRoleData = roleIds.map(roleId => ({
        userId,
        roleId
      }));

      await UserRole.bulkCreate(userRoleData, {
        transaction,
        ignoreDuplicates: true
      });

      // Invalidate cache
      await this.invalidateUserCache(userId);

      return this.getUserRoles(userId);
    } catch (error) {
      logger.error('Error assigning roles:', error);
      throw error;
    }
  }

  async removeRole(userId, roleId) {
    try {
      await UserRole.destroy({
        where: {
          userId,
          roleId
        }
      });

      // Invalidate cache
      await this.invalidateUserCache(userId);

      return this.getUserRoles(userId);
    } catch (error) {
      logger.error('Error removing role:', error);
      throw error;
    }
  }

  async getUserRoles(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'roles' }]
      });

      return user ? user.roles : [];
    } catch (error) {
      logger.error('Error getting user roles:', error);
      throw error;
    }
  }

  // Password management
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(config.security.hashRounds);
    return bcrypt.hash(password, salt);
  }

  async updatePassword(userId, currentPassword, newPassword) {
    return this.withTransaction(async (transaction) => {
      try {
        const user = await this.findById(userId);
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new AuthError('Current password is incorrect');
        }

        // Check if password was previously used
        const wasUsed = await this.isPasswordPreviouslyUsed(userId, newPassword);
        if (wasUsed) {
          throw new ValidationError('Password was previously used');
        }

        // Hash and update new password
        const hashedPassword = await this.hashPassword(newPassword);
        
        // Add current password to history before updating
        await this.addPasswordToHistory(userId, user.passwordHash);
        
        await super.update(userId, { 
          passwordHash: hashedPassword,
          passwordChangedAt: new Date()
        }, { transaction });

        // Publish password changed event
        await this.messageQueue.publish('user.password_changed', {
          userId,
          institutionId: user.institutionId
        });

        // Invalidate all sessions
        const sessionKey = `user:sessions:${userId}`;
        await this.redis.del(sessionKey);

        // Invalidate cache
        await this.invalidateUserCache(userId);

        return true;
      } catch (error) {
        logger.error('Error updating password:', error);
        throw error;
      }
    });
  }

  // MFA management
  async setupMFA(userId) {
    try {
      const user = await this.findById(userId);
      
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `${config.app.name}:${user.email}`
      });

      // Generate QR code
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Store secret temporarily (10 minutes)
      await this.redis.set(
        `mfa:setup:${userId}`,
        secret.base32,
        config.security.mfa.setupTTL
      );

      return {
        secret: secret.base32,
        qrCode: qrCodeUrl
      };
    } catch (error) {
      logger.error('Error setting up MFA:', error);
      throw error;
    }
  }
  async verifyAndEnableMFA(userId, token) {
    try {
      // Retrieve the stored secret from Redis
      const secret = await this.redis.get(`mfa:setup:${userId}`);
      if (!secret) {
        throw new ValidationError('MFA setup has expired');
      }
  
      // Verify the provided token using the stored secret
      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: config.security.mfa.window, // Configured window for token validation
      });
  
      if (!isValid) {
        throw new ValidationError('Invalid MFA token');
      }
  
      // Generate backup codes
      const backupCodes = await this.generateBackupCodes();
  
      // Update user data with MFA details and hashed backup codes
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(async (code) => ({
          code: await this.hashPassword(code),
          used: false,
        }))
      );
  
      await this.update(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        backupCodes: hashedBackupCodes,
      });
  
      // Clear the setup secret from Redis
      await this.redis.del(`mfa:setup:${userId}`);
  
      // Return backup codes to the user
      return { backupCodes };
    } catch (error) {
      logger.error('Error verifying MFA:', error);
      throw error;
    }
  }  

  async verifyMFA(userId, token) {
    try {
      const user = await this.findById(userId);
      if (!user.mfaEnabled) {
        throw new ValidationError('MFA is not enabled');
      }

      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: config.security.mfa.window
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying MFA token:', error);
      throw error;
    }
  }

  // MFA Backup Codes
  async generateBackupCodes(count = 8) {
    try {
      const codes = [];
      
      for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
      }

      return codes;
    } catch (error) {
      logger.error('Error generating backup codes:', error);
      throw error;
    }
  }

  async verifyBackupCode(userId, code) {
    try {
      const user = await this.findById(userId);
      if (!user.backupCodes?.length) {
        throw new ValidationError('No backup codes available');
      }

      const backupCode = user.backupCodes.find(bc => !bc.used);
      if (!backupCode) {
        throw new ValidationError('All backup codes have been used');
      }

      const isValid = await bcrypt.compare(code, backupCode.code);
      if (!isValid) {
        throw new ValidationError('Invalid backup code');
      }

      // Mark backup code as used
      backupCode.used = true;
      await this.update(userId, { backupCodes: user.backupCodes });

      return true;
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      throw error;
    }
  }

  // Email verification
  async sendVerificationEmail(userId) {
    try {
      const user = await this.findById(userId);
      const token = crypto.randomBytes(32).toString('hex');
      
      // Store verification token with expiry
      await this.redis.set(
        `email:verify:${userId}`,
        token,
        config.security.emailVerification.ttl
      );

      // Publish event for email service to handle
      await this.messageQueue.publish('user.email_verification_requested', {
        userId,
        email: user.email,
        token,
        institutionId: user.institutionId
      });

      return true;
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  async verifyEmail(userId, token) {
    try {
      const storedToken = await this.redis.get(`email:verify:${userId}`);
      if (!storedToken || storedToken !== token) {
        throw new ValidationError('Invalid or expired verification token');
      }

      // Update user email verification status
      await this.update(userId, { emailVerified: true });
      
      // Clear verification token
      await this.redis.del(`email:verify:${userId}`);

      // Publish event
      await this.messageQueue.publish('user.email_verified', {
        userId,
        institutionId: user.institutionId
      });

      return true;
    } catch (error) {
      logger.error('Error verifying email:', error);
      throw error;
    }
  }

  // Bulk Operations
  async bulkCreate(users) {
    return this.withTransaction(async (transaction) => {
      try {
        const createdUsers = [];
        
        for (const userData of users) {
          const hashedPassword = await this.hashPassword(userData.password);
          
          const user = await super.create({
            ...userData,
            passwordHash: hashedPassword
          }, { transaction });

          if (userData.profile) {
            await Profile.create(
              {
                userId: user.id,
                ...userData.profile
              },
              { transaction }
            );
          }

          if (userData.roles?.length) {
            await this.assignRoles(user.id, userData.roles, transaction);
          }

          createdUsers.push(user);
        }

        // Publish bulk creation event
        await this.messageQueue.publish('user.bulk_created', {
          count: createdUsers.length,
          userIds: createdUsers.map(u => u.id)
        });

        return createdUsers;
      } catch (error) {
        logger.error('Error in bulk user creation:', error);
        throw error;
      }
    });
  }

  // Advanced Search and Filtering
  async advancedSearch(filters = {}, options = {}) {
    try {
      const {
        email,
        name,
        status,
        role,
        institutionId,
        createdAfter,
        createdBefore,
        lastLoginAfter,
        lastLoginBefore,
        mfaEnabled,
        emailVerified
      } = filters;

      const whereClause = {};
      
      if (email) {
        whereClause.email = { [Op.iLike]: `%${email}%` };
      }
      
      if (name) {
        whereClause[Op.or] = [
          { firstName: { [Op.iLike]: `%${name}%` } },
          { lastName: { [Op.iLike]: `%${name}%` } }
        ];
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (institutionId) {
        whereClause.institutionId = institutionId;
      }
      
      if (createdAfter || createdBefore) {
        whereClause.createdAt = {};
        if (createdAfter) whereClause.createdAt[Op.gte] = createdAfter;
        if (createdBefore) whereClause.createdAt[Op.lte] = createdBefore;
      }
      
      if (lastLoginAfter || lastLoginBefore) {
        whereClause.lastLoginAt = {};
        if (lastLoginAfter) whereClause.lastLoginAt[Op.gte] = lastLoginAfter;
        if (lastLoginBefore) whereClause.lastLoginAt[Op.lte] = lastLoginBefore;
      }
      
      if (mfaEnabled !== undefined) {
        whereClause.mfaEnabled = mfaEnabled;
      }
      
      if (emailVerified !== undefined) {
        whereClause.emailVerified = emailVerified;
      }

      const include = [
        { model: Profile, as: 'profile' }
      ];

      // Add role filter if specified
      if (role) {
        include.push({
          model: Role,
          as: 'roles',
          where: { name: role }
        });
      } else {
        include.push({
          model: Role,
          as: 'roles'
        });
      }

      return this.findAll(whereClause, {
        ...options,
        include
      });
    } catch (error) {
      logger.error('Error in advanced search:', error);
      throw error;
    }
  }

  // Cache management
  async invalidateUserCache(userId) {
    try {
      const user = await super.findById(userId);
      if (user) {
        await Promise.all([
          this.redis.del(`user:${userId}`),
          this.redis.del(`user:email:${user.email}:${user.institutionId}`)
        ]);
      }
    } catch (error) {
      logger.error('Error invalidating user cache:', error);
      throw error;
    }
  }

  // Activity logging
  async logActivity(userId, action, metadata = {}) {
    try {
      await ActivityLog.create({
        userId,
        action,
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
      // Don't throw error for activity logging
    }
  }

  // Search and filtering
  async search(query, options = {}) {
    try {
      const searchCondition = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { firstName: { [Op.iLike]: `%${query}%` } },
          { lastName: { [Op.iLike]: `%${query}%` } }
        ]
      };

      return this.findAll(searchCondition, {
        ...options,
        include: [
          { model: Role, as: 'roles' },
          { model: Profile, as: 'profile' }
        ]
      });
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }

  // User Preferences Management
  async updatePreferences(userId, preferences) {
    try {
      const user = await this.findById(userId);
      const currentPreferences = user.preferences || {};
      
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences
      };

      await this.update(userId, { preferences: updatedPreferences });
      
      // Publish preferences updated event
      await this.messageQueue.publish('user.preferences_updated', {
        userId,
        institutionId: user.institutionId,
        preferences: updatedPreferences
      });

      return updatedPreferences;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async getPreferences(userId) {
    try {
      const user = await this.findById(userId);
      return user.preferences || {};
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  // Session Management
  async createSession(userId, deviceInfo) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const session = {
        id: sessionId,
        userId,
        deviceInfo,
        createdAt: new Date(),
        lastActivityAt: new Date()
      };

      await this.redis.hset(
        `user:sessions:${userId}`,
        sessionId,
        JSON.stringify(session)
      );

      await this.logActivity(userId, 'session_created', {
        sessionId,
        deviceInfo
      });

      return sessionId;
    } catch (error) {
      logger.error('Error creating user session:', error);
      throw error;
    }
  }

  async updateSessionActivity(userId, sessionId) {
    try {
      const sessionKey = `user:sessions:${userId}`;
      const sessionData = await this.redis.hget(sessionKey, sessionId);
      
      if (!sessionData) {
        throw new NotFoundError('Session not found');
      }

      const session = JSON.parse(sessionData);
      session.lastActivityAt = new Date();

      await this.redis.hset(
        sessionKey,
        sessionId,
        JSON.stringify(session)
      );

      return true;
    } catch (error) {
      logger.error('Error updating session activity:', error);
      throw error;
    }
  }

  async terminateSession(userId, sessionId) {
    try {
      const sessionKey = `user:sessions:${userId}`;
      await this.redis.hdel(sessionKey, sessionId);

      await this.logActivity(userId, 'session_terminated', {
        sessionId
      });

      return true;
    } catch (error) {
      logger.error('Error terminating session:', error);
      throw error;
    }
  }

  async getUserSessions(userId) {
    try {
      const sessionKey = `user:sessions:${userId}`;
      const sessions = await this.redis.hgetall(sessionKey);

      return Object.values(sessions).map(session => JSON.parse(session));
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      throw error;
    }
  }

  // Security Enhancements
  async recordLoginAttempt(userId, success) {
    try {
      const attemptsKey = `login:attempts:${userId}`;
      const currentAttempts = parseInt(await this.redis.get(attemptsKey) || '0');

      if (!success) {
        const newAttempts = currentAttempts + 1;
        await this.redis.set(attemptsKey, newAttempts, config.security.loginAttempts.ttl);

        if (newAttempts >= config.security.loginAttempts.max) {
          await this.lockAccount(userId, 'Too many failed login attempts');
        }
      } else {
        await this.redis.del(attemptsKey);
      }

      await this.logActivity(userId, success ? 'login_success' : 'login_failed');
    } catch (error) {
      logger.error('Error recording login attempt:', error);
      throw error;
    }
  }

  async lockAccount(userId, reason) {
    try {
      await this.update(userId, {
        status: 'locked',
        lockReason: reason,
        lockedAt: new Date()
      });

      // Publish account locked event
      await this.messageQueue.publish('user.account_locked', {
        userId,
        reason
      });

      await this.logActivity(userId, 'account_locked', { reason });
    } catch (error) {
      logger.error('Error locking account:', error);
      throw error;
    }
  }

  async unlockAccount(userId) {
    try {
      await this.update(userId, {
        status: 'active',
        lockReason: null,
        lockedAt: null
      });

      // Publish account unlocked event
      await this.messageQueue.publish('user.account_unlocked', {
        userId
      });

      await this.logActivity(userId, 'account_unlocked');
    } catch (error) {
      logger.error('Error unlocking account:', error);
      throw error;
    }
  }

  // Password History Management
  async addPasswordToHistory(userId, passwordHash) {
    try {
      const user = await this.findById(userId);
      const passwordHistory = user.passwordHistory || [];

      // Add new password to history
      passwordHistory.unshift({
        hash: passwordHash,
        createdAt: new Date()
      });

      // Keep only the last N passwords
      const maxHistory = config.security.password.historySize || 5;
      if (passwordHistory.length > maxHistory) {
        passwordHistory.length = maxHistory;
      }

      await this.update(userId, { passwordHistory });
    } catch (error) {
      logger.error('Error adding password to history:', error);
      throw error;
    }
  }

  async isPasswordPreviouslyUsed(userId, newPassword) {
    try {
      const user = await this.findById(userId);
      const passwordHistory = user.passwordHistory || [];

      // Check against previous passwords
      for (const historyEntry of passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, historyEntry.hash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking password history:', error);
      throw error;
    }
  }

  // Override password update to include history
  async updatePassword(userId, currentPassword, newPassword) {
    return this.withTransaction(async (transaction) => {
      try {
        const user = await this.findById(userId);
        
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new AuthError('Current password is incorrect');
        }

        // Check if password was previously used
        const wasUsed = await this.isPasswordPreviouslyUsed(userId, newPassword);
        if (wasUsed) {
          throw new ValidationError('Password was previously used');
        }

        // Hash and update new password
        const hashedPassword = await this.hashPassword(newPassword);
        
        // Add current password to history before updating
        await this.addPasswordToHistory(userId, user.passwordHash);
        
        await super.update(userId, { 
          passwordHash: hashedPassword,
          passwordChangedAt: new Date()
        }, { transaction });

        // Publish password changed event
        await this.messageQueue.publish('user.password_changed', {
          userId,
          institutionId: user.institutionId
        });

        // Invalidate all sessions
        const sessionKey = `user:sessions:${userId}`;
        await this.redis.del(sessionKey);

        // Invalidate cache
        await this.invalidateUserCache(userId);

        return true;
      } catch (error) {
        logger.error('Error updating password:', error);
        throw error;
      }
    });
  }
}

module.exports = new UserService();
