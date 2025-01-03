// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\middleware\auth.js

const axios = require('axios');
const { AuthError } = require('../../utils/errors');
const config = require('../../config/app.config');
const logger = require('../../utils/logger');

const validateToken = async (token) => {
  try {
    const response = await axios.post(
      `${config.services.auth.url}/api/auth/validate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    logger.error('Token validation error:', error.message);
    throw new AuthError('Invalid token');
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthError('No authorization token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthError('Invalid authorization header format');
    }

    const userData = await validateToken(token);
    req.user = userData;
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('User not authenticated'));
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return next(new AuthError('Insufficient permissions'));
    }

    next();
  };
};

const authorizeInstitution = (paramName = 'institutionId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('User not authenticated'));
    }

    const institutionId = req.params[paramName] || req.body[paramName];
    if (!institutionId) {
      return next(new AuthError('Institution ID not provided'));
    }

    // Super admin can access all institutions
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    // Check if user belongs to the institution
    if (req.user.institutionId !== institutionId) {
      return next(new AuthError('Access denied for this institution'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeInstitution
};
