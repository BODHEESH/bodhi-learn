const { AuthError } = require('../utils/errors');
const { AuthService } = require('../services/auth.service');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const authService = new AuthService();
    const validation = await authService.validateToken(token);

    if (!validation.valid) {
      throw new AuthError(validation.error || 'Invalid token');
    }

    // Attach decoded token data to request
    req.user = validation.decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
  }
  }
}

const requireRoles = (roles) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];
      const hasRequiredRole = roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new AuthError('Insufficient permissions');
      }

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
    }
    }
  }
};

const requireMFA = async (req, res, next) => {
  try {
    const authService = new AuthService();
    const user = await authService.getUserById(req.user.id);

    if (!user.mfaEnabled) {
      throw new AuthError('MFA is required for this operation');
    }

    next();
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
  }
}
};

module.exports = {
  authenticate,
  requireRoles,
  requireMFA
};
