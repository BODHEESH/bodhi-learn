// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\middleware\auth.js

const jwt = require('jsonwebtoken');
const config = require('../../../config');
const { CustomError } = require('../../../utils/errors');
const UserService = require('../../../integrations/user.service');
const logger = require('../../../utils/logger');

const userService = new UserService();

async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('UNAUTHORIZED', 'No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      
      // Get user details and validate
      const user = await userService.getUserDetails(decoded.userId);
      if (!user) {
        throw new CustomError('UNAUTHORIZED', 'Invalid user');
      }

      // Check if token is blacklisted (for logout)
      const isBlacklisted = await checkTokenBlacklist(token);
      if (isBlacklisted) {
        throw new CustomError('UNAUTHORIZED', 'Token has been invalidated');
      }

      // Add user info to request
      req.user = {
        id: user.id,
        email: user.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        tenantId: decoded.tenantId
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new CustomError('TOKEN_EXPIRED', 'Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new CustomError('INVALID_TOKEN', 'Invalid token');
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
}

async function authorize(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const organizationId = req.params.orgId;

      // If no specific roles required, just check if user is authenticated
      if (!requiredRoles.length) {
        return next();
      }

      // Get user roles for this organization
      let userRoles = user.roles;
      if (organizationId) {
        const roleData = await userService.getUserRoles(user.id, organizationId);
        userRoles = roleData.roles;
      }

      // Check if user has any of the required roles
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      if (!hasRequiredRole) {
        throw new CustomError('FORBIDDEN', 'Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      next(error);
    }
  };
}

async function checkPermissions(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // If no specific permissions required, proceed
      if (!requiredPermissions.length) {
        return next();
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        user.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new CustomError('FORBIDDEN', 'Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      next(error);
    }
  };
}

async function validateScope(requiredScopes = []) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // If no specific scopes required, proceed
      if (!requiredScopes.length) {
        return next();
      }

      // Get token scopes
      const tokenScopes = user.scopes || [];

      // Check if token has all required scopes
      const hasAllScopes = requiredScopes.every(scope =>
        tokenScopes.includes(scope)
      );

      if (!hasAllScopes) {
        throw new CustomError('FORBIDDEN', 'Insufficient token scope');
      }

      next();
    } catch (error) {
      logger.error('Scope validation error:', error);
      next(error);
    }
  };
}

// Helper function to check if a token is blacklisted
async function checkTokenBlacklist(token) {
  // Implement token blacklist check logic here
  // This could use Redis or another fast storage solution
  return false; // Placeholder
}

module.exports = {
  authenticate,
  authorize,
  checkPermissions,
  validateScope
};
