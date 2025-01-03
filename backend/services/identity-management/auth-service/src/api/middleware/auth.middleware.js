// // \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\api\middleware\auth.middleware.js


// const { AuthError } = require('../../utils/errors');
// const { AuthService } = require('../../services/auth.service');

// class AuthMiddleware {
//   static async validateToken(req, res, next) {
//     try {
//       const authHeader = req.headers.authorization;
//       if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         throw new AuthError('No token provided');
//       }

//       const token = authHeader.split(' ')[1];
//       const authService = new AuthService();
//       const validation = await authService.validateToken(token);

//       if (!validation.valid) {
//         throw new AuthError(validation.error || 'Invalid token');
//       }

//       // Attach decoded token data to request
//       req.user = validation.decoded;
//       next();
//     } catch (error) {
//       next(error);
//     }
//   }

//   static requireRoles(roles) {
//     return (req, res, next) => {
//       try {
//         const userRoles = req.user.roles || [];
//         const hasRequiredRole = roles.some(role => userRoles.includes(role));

//         if (!hasRequiredRole) {
//           throw new AuthError('Insufficient permissions');
//         }

//         next();
//       } catch (error) {
//         next(error);
//       }
//     };
//   }

//   static validateInstitution(req, res, next) {
//     try {
//       const userInstitutionId = req.user.institutionId;
//       const requestInstitutionId = req.body.institutionId || req.query.institutionId;

//       if (requestInstitutionId && requestInstitutionId !== userInstitutionId) {
//         throw new AuthError('Invalid institution access');
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async validateApiKey(req, res, next) {
//     try {
//       const apiKey = req.headers['x-api-key'];
//       if (!apiKey) {
//         throw new AuthError('API key is required');
//       }

//       const authService = new AuthService();
//       const isValid = await authService.validateApiKey(apiKey);

//       if (!isValid) {
//         throw new AuthError('Invalid API key');
//       }

//       next();
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// module.exports = AuthMiddleware;


// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\middleware\auth.middleware.js

const { AuthService } = require('../services/auth.service');
const { AuthError } = require('../utils/errors');

const authService = new AuthService();

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const validation = await authService.validateToken(token);

    if (!validation.valid) {
      throw new AuthError(validation.error || 'Invalid token');
    }

    // Attach user data to request
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

async function requireRoles(roles) {
  return async (req, res, next) => {
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
  };
}

async function requireMFA(req, res, next) {
  try {
    if (!req.user.mfaVerified) {
      throw new AuthError('MFA verification required');
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

module.exports = {
  authenticate,
  requireRoles,
  requireMFA
};
