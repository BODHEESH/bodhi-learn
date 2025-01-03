// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\events\handlers.js

const userService = require('../services/user.service');
const roleService = require('../services/role.service');
const { redis } = require('../services/redis.service');
const logger = require('../utils/logger');

const handlers = {
  // User events
  'user.created': async (data) => {
    try {
      logger.info('Processing user.created event:', data);
      
      // Invalidate user list cache for the institution
      await redis.delPattern(`users:institution:${data.institutionId}:*`);
      
      // Notify other services if needed
      // TODO: Implement notification logic
    } catch (error) {
      logger.error('Error handling user.created event:', error);
      throw error;
    }
  },

  'user.updated': async (data) => {
    try {
      logger.info('Processing user.updated event:', data);
      
      // Invalidate user cache
      await redis.del(`user:${data.userId}`);
      
      // Invalidate related caches based on updated fields
      if (data.updates.includes('roles')) {
        await redis.delPattern(`role:*`);
      }
      
      if (data.updates.includes('institutionId')) {
        await redis.delPattern(`users:institution:*`);
      }
    } catch (error) {
      logger.error('Error handling user.updated event:', error);
      throw error;
    }
  },

  'user.deleted': async (data) => {
    try {
      logger.info('Processing user.deleted event:', data);
      
      // Invalidate all related caches
      await redis.del(`user:${data.userId}`);
      await redis.delPattern(`users:institution:${data.institutionId}:*`);
      await redis.delPattern(`profile:${data.userId}`);
      
      // Clean up user roles
      await roleService.removeUserFromAllRoles(data.userId);
    } catch (error) {
      logger.error('Error handling user.deleted event:', error);
      throw error;
    }
  },

  'user.status.updated': async (data) => {
    try {
      logger.info('Processing user.status.updated event:', data);
      
      // Invalidate user cache
      await redis.del(`user:${data.userId}`);
      
      // Update auth service about status change
      // This will be handled by the auth service's event handlers
    } catch (error) {
      logger.error('Error handling user.status.updated event:', error);
      throw error;
    }
  },

  // Role events
  'role.created': async (data) => {
    try {
      logger.info('Processing role.created event:', data);
      
      // Invalidate role list cache
      await redis.delPattern('roles:*');
      
      // Update permissions cache if needed
      if (data.permissions && data.permissions.length > 0) {
        await redis.delPattern('permissions:*');
      }
    } catch (error) {
      logger.error('Error handling role.created event:', error);
      throw error;
    }
  },

  'role.updated': async (data) => {
    try {
      logger.info('Processing role.updated event:', data);
      
      // Invalidate specific role cache
      await redis.del(`role:${data.roleId}`);
      
      // Invalidate role list cache
      await redis.delPattern('roles:*');
      
      // If permissions were updated, invalidate permission caches
      if (data.updates.includes('permissions')) {
        await redis.delPattern('permissions:*');
      }
    } catch (error) {
      logger.error('Error handling role.updated event:', error);
      throw error;
    }
  },

  'role.deleted': async (data) => {
    try {
      logger.info('Processing role.deleted event:', data);
      
      // Invalidate all role-related caches
      await redis.del(`role:${data.roleId}`);
      await redis.delPattern('roles:*');
      await redis.delPattern(`permissions:role:${data.name}`);
      
      // Remove role from all users
      await userService.removeRoleFromAllUsers(data.name);
    } catch (error) {
      logger.error('Error handling role.deleted event:', error);
      throw error;
    }
  },

  // Permission events
  'permission.updated': async (data) => {
    try {
      logger.info('Processing permission.updated event:', data);
      
      // Invalidate permission caches
      await redis.delPattern('permissions:*');
      
      // Invalidate role caches since they contain permission data
      await redis.delPattern('roles:*');
    } catch (error) {
      logger.error('Error handling permission.updated event:', error);
      throw error;
    }
  },

  // Auth service events
  'auth.login': async (data) => {
    try {
      logger.info('Processing auth.login event:', data);
      
      // Update last login timestamp
      await userService.updateLastLogin(data.userId);
      
      // Invalidate user cache to reflect updated login time
      await redis.del(`user:${data.userId}`);
    } catch (error) {
      logger.error('Error handling auth.login event:', error);
      throw error;
    }
  },

  'auth.logout': async (data) => {
    try {
      logger.info('Processing auth.logout event:', data);
      
      // Perform any necessary cleanup
      // This could include invalidating certain caches or updating user status
    } catch (error) {
      logger.error('Error handling auth.logout event:', error);
      throw error;
    }
  }
};

module.exports = handlers;
