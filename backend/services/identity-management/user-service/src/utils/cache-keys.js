// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\cache-keys.js

const config = require('../config/app.config');

// Cache key generators
const cacheKeys = {
  // User keys
  user: {
    detail: (userId) => `user:${userId}`,
    list: (page = 1, limit = 10) => `users:list:${page}:${limit}`,
    search: (query, page = 1, limit = 10) => `users:search:${query}:${page}:${limit}`,
    byInstitution: (institutionId, page = 1, limit = 10) => 
      `users:institution:${institutionId}:${page}:${limit}`,
    byRole: (roleName, page = 1, limit = 10) => 
      `users:role:${roleName}:${page}:${limit}`,
    status: (userId) => `user:${userId}:status`
  },

  // Profile keys
  profile: {
    detail: (userId) => `profile:${userId}`,
    preferences: (userId) => `profile:${userId}:preferences`,
    metadata: (userId) => `profile:${userId}:metadata`
  },

  // Role keys
  role: {
    detail: (roleId) => `role:${roleId}`,
    list: () => 'roles:list',
    hierarchy: () => 'roles:hierarchy',
    byName: (name) => `role:name:${name}`,
    permissions: (roleId) => `role:${roleId}:permissions`
  },

  // Permission keys
  permission: {
    detail: (permissionId) => `permission:${permissionId}`,
    list: () => 'permissions:list',
    byResource: (resource) => `permissions:resource:${resource}`,
    byRole: (roleName) => `permissions:role:${roleName}`
  }
};

// TTL configurations
const cacheTTL = {
  user: {
    detail: config.cache.ttl.user,
    list: 300, // 5 minutes
    search: 300,
    byInstitution: 300,
    byRole: 300,
    status: 60 // 1 minute
  },
  profile: {
    detail: config.cache.ttl.profile,
    preferences: config.cache.ttl.profile,
    metadata: config.cache.ttl.profile
  },
  role: {
    detail: config.cache.ttl.role,
    list: config.cache.ttl.role,
    hierarchy: config.cache.ttl.role,
    permissions: config.cache.ttl.role
  },
  permission: {
    detail: config.cache.ttl.role,
    list: config.cache.ttl.role,
    byResource: config.cache.ttl.role,
    byRole: config.cache.ttl.role
  }
};

// Cache invalidation patterns
const invalidationPatterns = {
  user: {
    all: 'user:*',
    lists: 'users:list:*',
    search: 'users:search:*',
    byInstitution: (institutionId) => `users:institution:${institutionId}:*`,
    byRole: (roleName) => `users:role:${roleName}:*`
  },
  profile: {
    all: 'profile:*',
    user: (userId) => `profile:${userId}:*`
  },
  role: {
    all: 'role:*',
    lists: 'roles:*',
    hierarchy: 'roles:hierarchy'
  },
  permission: {
    all: 'permission:*',
    byResource: (resource) => `permissions:resource:${resource}:*`,
    byRole: (roleName) => `permissions:role:${roleName}:*`
  }
};

module.exports = {
  cacheKeys,
  cacheTTL,
  invalidationPatterns
};
