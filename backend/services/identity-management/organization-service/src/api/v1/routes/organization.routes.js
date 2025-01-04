// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\routes\organization.routes.js

const express = require('express');
const router = express.Router();

// Controllers
const organizationController = require('../controllers/organization.controller');
const branchController = require('../controllers/branch.controller');
const departmentController = require('../controllers/department.controller');

// Middleware
const { authenticate, authorize } = require('../middlewares/auth');
const { validateTenant } = require('../middlewares/tenant');
const { 
  validateOrganization, 
  validateBranch, 
  validateDepartment 
} = require('../middlewares/organization');
const { rateLimiter } = require('../middlewares/rate-limiter');
const { validate } = require('../middlewares/validation');
const { 
  organizationValidation,
  branchValidation,
  departmentValidation 
} = require('../validations');

// Organization routes
router.post(
  '/tenants/:tenantId/organizations',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateTenant,
  validate(organizationValidation.createOrganization),
  rateLimiter,
  organizationController.createOrganization
);

router.put(
  '/organizations/:organizationId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  validate(organizationValidation.updateOrganization),
  rateLimiter,
  organizationController.updateOrganization
);

router.get(
  '/organizations/:organizationId',
  authenticate,
  validateOrganization,
  rateLimiter,
  organizationController.getOrganization
);

router.get(
  '/tenants/:tenantId/organizations',
  authenticate,
  validateTenant,
  validate(organizationValidation.listOrganizations),
  rateLimiter,
  organizationController.listOrganizations
);

router.put(
  '/organizations/:organizationId/settings',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  validate(organizationValidation.updateSettings),
  rateLimiter,
  organizationController.updateOrganizationSettings
);

router.post(
  '/organizations/:organizationId/verify',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validateOrganization,
  validate(organizationValidation.verifyOrganization),
  rateLimiter,
  organizationController.verifyOrganization
);

router.get(
  '/organizations/:organizationId/structure',
  authenticate,
  validateOrganization,
  rateLimiter,
  organizationController.getOrganizationStructure
);

// Branch routes
router.post(
  '/organizations/:organizationId/branches',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  validate(branchValidation.createBranch),
  rateLimiter,
  branchController.createBranch
);

router.get(
  '/organizations/:organizationId/branches',
  authenticate,
  validateOrganization,
  validate(branchValidation.listBranches),
  rateLimiter,
  branchController.listBranches
);

router.get(
  '/branches/:branchId',
  authenticate,
  validateBranch,
  rateLimiter,
  branchController.getBranch
);

router.put(
  '/branches/:branchId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  validate(branchValidation.updateBranch),
  rateLimiter,
  branchController.updateBranch
);

router.put(
  '/branches/:branchId/status',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  validate(branchValidation.updateStatus),
  rateLimiter,
  branchController.updateBranchStatus
);

router.put(
  '/branches/:branchId/facilities',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  validate(branchValidation.updateFacilities),
  rateLimiter,
  branchController.updateBranchFacilities
);

router.put(
  '/branches/:branchId/capacity',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  validate(branchValidation.updateCapacity),
  rateLimiter,
  branchController.updateBranchCapacity
);

router.get(
  '/branches/:branchId/analytics',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  rateLimiter,
  branchController.getBranchAnalytics
);

// Department routes
router.post(
  '/branches/:branchId/departments',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateBranch,
  validate(departmentValidation.createDepartment),
  rateLimiter,
  departmentController.createDepartment
);

router.get(
  '/branches/:branchId/departments',
  authenticate,
  validateBranch,
  validate(departmentValidation.listDepartments),
  rateLimiter,
  departmentController.listDepartments
);

router.get(
  '/departments/:departmentId',
  authenticate,
  validateDepartment,
  rateLimiter,
  departmentController.getDepartment
);

router.put(
  '/departments/:departmentId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateDepartment,
  validate(departmentValidation.updateDepartment),
  rateLimiter,
  departmentController.updateDepartment
);

router.put(
  '/departments/:departmentId/head',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateDepartment,
  validate(departmentValidation.updateHead),
  rateLimiter,
  departmentController.updateDepartmentHead
);

router.put(
  '/departments/:departmentId/resources',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateDepartment,
  validate(departmentValidation.updateResources),
  rateLimiter,
  departmentController.updateDepartmentResources
);

router.get(
  '/departments/:departmentId/hierarchy',
  authenticate,
  validateDepartment,
  rateLimiter,
  departmentController.getDepartmentHierarchy
);

router.post(
  '/departments/:departmentId/move',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateDepartment,
  validate(departmentValidation.moveDepartment),
  rateLimiter,
  departmentController.moveDepartment
);

router.get(
  '/departments/:departmentId/analytics',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateDepartment,
  rateLimiter,
  departmentController.getDepartmentAnalytics
);

module.exports = router;
