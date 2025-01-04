const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Authentication & Authorization Routes
 */
router.post('/auth/login', 'AuthController.login');
router.post('/auth/register', 'AuthController.register');
router.post('/auth/refresh-token', 'AuthController.refreshToken');
router.post('/auth/logout', authMiddleware, 'AuthController.logout');
router.post('/auth/forgot-password', 'AuthController.forgotPassword');
router.post('/auth/reset-password', 'AuthController.resetPassword');

/**
 * User Management Routes
 */
router.get('/users', authMiddleware, 'UserController.listUsers');
router.get('/users/:id', authMiddleware, 'UserController.getUser');
router.post('/users', authMiddleware, 'UserController.createUser');
router.put('/users/:id', authMiddleware, 'UserController.updateUser');
router.delete('/users/:id', authMiddleware, 'UserController.deleteUser');
router.put('/users/:id/status', authMiddleware, 'UserController.updateUserStatus');

/**
 * Organization Routes
 */
router.get('/organizations', authMiddleware, 'OrganizationController.list');
router.get('/organizations/:id', authMiddleware, 'OrganizationController.get');
router.post('/organizations', authMiddleware, 'OrganizationController.create');
router.put('/organizations/:id', authMiddleware, 'OrganizationController.update');
router.delete('/organizations/:id', authMiddleware, 'OrganizationController.delete');
router.post('/organizations/:id/verify', authMiddleware, 'OrganizationController.verify');

/**
 * Tenant Routes
 */
router.get('/tenants', authMiddleware, 'TenantController.list');
router.get('/tenants/:id', authMiddleware, 'TenantController.get');
router.post('/tenants', authMiddleware, 'TenantController.create');
router.put('/tenants/:id', authMiddleware, 'TenantController.update');
router.delete('/tenants/:id', authMiddleware, 'TenantController.delete');
router.put('/tenants/:id/settings', authMiddleware, 'TenantController.updateSettings');

/**
 * Role & Permission Routes
 */
router.get('/roles', authMiddleware, 'RoleController.list');
router.post('/roles', authMiddleware, 'RoleController.create');
router.put('/roles/:id', authMiddleware, 'RoleController.update');
router.delete('/roles/:id', authMiddleware, 'RoleController.delete');
router.get('/permissions', authMiddleware, 'PermissionController.list');
router.post('/roles/:id/permissions', authMiddleware, 'RoleController.assignPermissions');

module.exports = router;
