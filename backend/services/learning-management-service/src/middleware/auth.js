const mongoose = require('mongoose');
const authClient = require('../utils/authClient');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const logger = require('../config/logger');
const cache = require('../utils/cache');

/**
 * Verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            throw new UnauthorizedError('No token provided');
        }

        try {
            // Validate token using auth service
            const validation = await authClient.validateToken(token);
            if (!validation.valid) {
                throw new UnauthorizedError('Invalid token');
            }

            // Attach user data to request
            req.user = validation.user;
            
            // Fetch and attach user profile
            req.userProfile = await authClient.getUserProfile(validation.user.id);

            next();
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Check if user has required roles
 */
const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('User not authenticated');
            }

            const hasRole = await authClient.hasRole(req.user.id, roles);
            if (!hasRole) {
                throw new ForbiddenError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user has required permissions
 */
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('User not authenticated');
            }

            const hasPermission = await authClient.checkPermission(req.user.id, resource, action);
            if (!hasPermission) {
                throw new ForbiddenError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user owns the resource or has admin rights
 */
const checkOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user.id;

            // Skip ownership check for admins
            const isAdmin = await authClient.hasRole(userId, 'admin');
            if (isAdmin) {
                return next();
            }

            let resource;
            let hasAccess = false;

            switch (resourceType) {
                case 'course':
                    resource = await mongoose.model('Course').findById(resourceId);
                    hasAccess = resource?.instructors.includes(userId);
                    break;
                case 'content':
                    resource = await mongoose.model('Content').findById(resourceId);
                    hasAccess = resource?.author.toString() === userId;
                    break;
                case 'mentorship':
                    resource = await mongoose.model('Mentorship').findById(resourceId);
                    hasAccess = resource?.mentorId.toString() === userId;
                    break;
                case 'studySession':
                    resource = await mongoose.model('GroupStudySession').findById(resourceId);
                    hasAccess = resource?.facilitatorId.toString() === userId;
                    break;
                case 'challenge':
                    resource = await mongoose.model('LearningChallenge').findById(resourceId);
                    hasAccess = resource?.creatorId.toString() === userId;
                    break;
                default:
                    logger.error(`Unknown resource type: ${resourceType}`);
                    throw new Error('Invalid resource type');
            }

            if (!hasAccess) {
                throw new ForbiddenError('You do not have permission to access this resource');
            }

            // Attach resource to request for later use
            req.resource = resource;
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Attach user learning context
 */
const attachLearningContext = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        const userId = req.user.id;
        const cacheKey = `user:${userId}:learning_context`;

        // Try to get from cache first
        let context = await cache.get(cacheKey);

        if (!context) {
            // Fetch all required data
            const [preferences, achievements, roles] = await Promise.all([
                authClient.getLearningPreferences(userId),
                authClient.getUserAchievements(userId),
                authClient.getUserRoles(userId)
            ]);

            context = {
                preferences,
                achievements,
                roles,
                timestamp: Date.now()
            };

            // Cache for 5 minutes
            await cache.set(cacheKey, context, 300);
        }

        req.learningContext = context;
        next();
    } catch (error) {
        logger.error('Error attaching learning context:', error);
        next();
    }
};

module.exports = {
    verifyToken,
    checkRole,
    checkPermission,
    checkOwnership,
    attachLearningContext
};
