// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\auth.middleware.js

const jwt = require('jsonwebtoken');
const config = require('../../config/app.config');
const { AuthError } = require('../../utils/errors');
const userService = require('../../services/user.service');
const logger = require('../../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check if token is meant for this service
      if (decoded.type !== 'access') {
        throw new AuthError('Invalid token type');
      }

      // Get user from cache/database
      const user = await userService.findById(decoded.userId);
      if (!user) {
        throw new AuthError('User not found');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new AuthError('User account is not active');
      }

      // Attach user and token to request
      req.user = user;
      req.token = token;
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthError('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new AuthError('Token has expired');
      }
      throw error;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    next(error);
  }
};

const authorize = (roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await userService.getUserRoles(req.user.id);
      
      const hasRequiredRole = roles.some(role => 
        userRoles.some(userRole => userRole.name === role)
      );

      if (!hasRequiredRole) {
        throw new AuthError('Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      next(error);
    }
  };
};

const validateInstitution = async (req, res, next) => {
  try {
    const userInstitutionId = req.user.institutionId;
    const requestInstitutionId = req.body.institutionId || req.query.institutionId;

    if (requestInstitutionId && requestInstitutionId !== userInstitutionId) {
      throw new AuthError('Invalid institution access');
    }

    next();
  } catch (error) {
    logger.error('Institution validation error:', error);
    next(error);
  }
};

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new AuthError('API key is required');
    }

    // Validate API key (implement your validation logic)
    const isValid = await userService.validateApiKey(apiKey);
    if (!isValid) {
      throw new AuthError('Invalid API key');
    }

    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  validateInstitution,
  validateApiKey
};
