// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\role.service.js

const BaseService = require('./base.service');
const { Role, User } = require('../models');
const { RedisService } = require('./redis.service');
const { MessageQueue } = require('../utils/message-queue');
const { ValidationError } = require('../utils/errors');
const config = require('../config/app.config');

class RoleService extends BaseService {
  constructor() {
    super(Role, 'Role');
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
  }

  async findById(id, options = {}) {
    const cacheKey = `role:${id}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const role = await super.findById(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      ...options
    });

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(role), config.cache.ttl.role);
    return role;
  }

  async findByName(name, options = {}) {
    const cacheKey = `role:name:${name}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const role = await this.findOne({ name }, options);

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(role), config.cache.ttl.role);
    return role;
  }

  async create(roleData) {
    // Validate role hierarchy
    if (roleData.level) {
      await this.validateRoleHierarchy(roleData.level);
    }

    const role = await super.create(roleData);

    // Publish role created event
    await this.messageQueue.publish('user-exchange', 'role.created', {
      roleId: role.id,
      name: role.name,
      permissions: role.permissions
    });

    return role;
  }

  async update(id, roleData) {
    // Validate role hierarchy if level is being updated
    if (roleData.level) {
      await this.validateRoleHierarchy(roleData.level);
    }

    const role = await super.update(id, roleData);

    // Invalidate caches
    await this.redis.del(`role:${id}`);
    if (role.name) {
      await this.redis.del(`role:name:${role.name}`);
    }

    // Publish role updated event
    await this.messageQueue.publish('user-exchange', 'role.updated', {
      roleId: id,
      updates: Object.keys(roleData)
    });

    return role;
  }

  async delete(id) {
    const role = await this.findById(id);
    
    // Check if role has any users
    const userCount = await User.count({
      include: [{
        model: Role,
        as: 'roles',
        where: { id }
      }]
    });

    if (userCount > 0) {
      throw new ValidationError('Cannot delete role with assigned users');
    }

    await super.delete(id);

    // Invalidate caches
    await this.redis.del(`role:${id}`);
    await this.redis.del(`role:name:${role.name}`);

    // Publish role deleted event
    await this.messageQueue.publish('user-exchange', 'role.deleted', {
      roleId: id,
      name: role.name
    });

    return true;
  }

  // Permission management
  async addPermissions(id, permissions) {
    const role = await this.findById(id);
    await role.addPermissions(permissions);

    // Invalidate caches
    await this.redis.del(`role:${id}`);
    await this.redis.del(`role:name:${role.name}`);

    // Publish permissions updated event
    await this.messageQueue.publish('user-exchange', 'role.permissions.updated', {
      roleId: id,
      addedPermissions: permissions
    });

    return role;
  }

  async removePermissions(id, permissions) {
    const role = await this.findById(id);
    await role.removePermissions(permissions);

    // Invalidate caches
    await this.redis.del(`role:${id}`);
    await this.redis.del(`role:name:${role.name}`);

    // Publish permissions updated event
    await this.messageQueue.publish('user-exchange', 'role.permissions.updated', {
      roleId: id,
      removedPermissions: permissions
    });

    return role;
  }

  // Role hierarchy management
  async getHierarchy() {
    const cacheKey = 'role:hierarchy';
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const hierarchy = await Role.getHierarchy();

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(hierarchy), config.cache.ttl.role);
    return hierarchy;
  }

  // Private methods
  async validateRoleHierarchy(level) {
    const existingRole = await Role.findOne({
      where: { level }
    });

    if (existingRole) {
      throw new ValidationError(`Role with level ${level} already exists`);
    }
  }
}

module.exports = new RoleService();
