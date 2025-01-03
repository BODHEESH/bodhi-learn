// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\permission.service.js

const Permission = require('../models/permission.schema');
const { RedisService } = require('./redis.service');
const { MessageQueue } = require('../utils/message-queue');
const { ValidationError, NotFoundError } = require('../utils/errors');
const config = require('../config/app.config');

class PermissionService {
  constructor() {
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
  }

  async findById(id) {
    const cacheKey = `permission:${id}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permission = await Permission.findById(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(permission), config.cache.ttl.permission);
    return permission;
  }

  async findByName(name) {
    const cacheKey = `permission:name:${name}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permission = await Permission.findOne({ name });
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(permission), config.cache.ttl.permission);
    return permission;
  }

  async create(permissionData) {
    // Check for duplicate name
    const existing = await Permission.findOne({ name: permissionData.name });
    if (existing) {
      throw new ValidationError('Permission with this name already exists');
    }

    const permission = await Permission.create(permissionData);

    // Publish permission created event
    await this.messageQueue.publish('user-exchange', 'permission.created', {
      permissionId: permission._id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action
    });

    return permission;
  }

  async update(id, permissionData) {
    // Check if updating name and it already exists
    if (permissionData.name) {
      const existing = await Permission.findOne({
        name: permissionData.name,
        _id: { $ne: id }
      });
      if (existing) {
        throw new ValidationError('Permission with this name already exists');
      }
    }

    const permission = await Permission.findByIdAndUpdate(
      id,
      permissionData,
      { new: true, runValidators: true }
    );

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Invalidate caches
    await this.redis.del(`permission:${id}`);
    if (permission.name) {
      await this.redis.del(`permission:name:${permission.name}`);
    }

    // Publish permission updated event
    await this.messageQueue.publish('user-exchange', 'permission.updated', {
      permissionId: id,
      updates: Object.keys(permissionData)
    });

    return permission;
  }

  async delete(id) {
    const permission = await Permission.findByIdAndDelete(id);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Invalidate caches
    await this.redis.del(`permission:${id}`);
    await this.redis.del(`permission:name:${permission.name}`);

    // Publish permission deleted event
    await this.messageQueue.publish('user-exchange', 'permission.deleted', {
      permissionId: id,
      name: permission.name
    });

    return true;
  }

  // Resource-based queries
  async findByResource(resource) {
    const cacheKey = `permissions:resource:${resource}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permissions = await Permission.find({ resource });

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(permissions), config.cache.ttl.permission);
    return permissions;
  }

  async findByResourceAction(resource, action) {
    const cacheKey = `permissions:resource:${resource}:action:${action}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permissions = await Permission.findByResourceAction(resource, action);

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(permissions), config.cache.ttl.permission);
    return permissions;
  }

  // Role-based queries
  async findByRole(roleName) {
    const cacheKey = `permissions:role:${roleName}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const permissions = await Permission.findByRole(roleName);

    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(permissions), config.cache.ttl.permission);
    return permissions;
  }

  // Permission checking
  async checkPermission(permissionName, context) {
    const permission = await this.findByName(permissionName);
    return permission.checkCondition(context);
  }

  // Bulk operations
  async createMany(permissions) {
    const createdPermissions = await Permission.insertMany(permissions);

    // Publish bulk creation event
    await this.messageQueue.publish('user-exchange', 'permissions.bulk.created', {
      count: createdPermissions.length,
      permissions: createdPermissions.map(p => ({
        id: p._id,
        name: p.name
      }))
    });

    return createdPermissions;
  }
}

module.exports = new PermissionService();
