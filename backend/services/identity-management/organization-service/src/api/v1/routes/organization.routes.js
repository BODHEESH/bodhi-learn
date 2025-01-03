// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\routes\organization.routes.js

const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const branchController = require('../controllers/branch.controller');
const departmentController = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTenant } = require('../middleware/tenant');
const { validateOrganization } = require('../middleware/organization');

// Organization routes
router.post(
  '/tenants/:tenantId/organizations',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateTenant,
  organizationController.createOrganization
);

router.put(
  '/organizations/:orgId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  organizationController.updateOrganization
);

router.get(
  '/organizations/:orgId',
  authenticate,
  validateOrganization,
  organizationController.getOrganization
);

router.get(
  '/tenants/:tenantId/organizations',
  authenticate,
  validateTenant,
  organizationController.listOrganizations
);

router.put(
  '/organizations/:orgId/settings',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  organizationController.updateOrganizationSettings
);

router.post(
  '/organizations/:orgId/verify',
  authenticate,
  authorize(['SUPER_ADMIN']),
  validateOrganization,
  organizationController.verifyOrganization
);

router.get(
  '/organizations/:orgId/structure',
  authenticate,
  validateOrganization,
  organizationController.getOrganizationStructure
);

// Branch routes
router.post(
  '/organizations/:orgId/branches',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  branchController.createBranch
);

router.get(
  '/organizations/:orgId/branches',
  authenticate,
  validateOrganization,
  branchController.listBranches
);

router.get(
  '/branches/:branchId',
  authenticate,
  branchController.getBranch
);

router.put(
  '/branches/:branchId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  branchController.updateBranch
);

router.put(
  '/branches/:branchId/status',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  branchController.updateBranchStatus
);

router.put(
  '/branches/:branchId/facilities',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  branchController.updateBranchFacilities
);

router.put(
  '/branches/:branchId/capacity',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  branchController.updateBranchCapacity
);

router.get(
  '/branches/:branchId/analytics',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  branchController.getBranchAnalytics
);

// Department routes
router.post(
  '/organizations/:orgId/branches/:branchId/departments',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  validateOrganization,
  departmentController.createDepartment
);

router.get(
  '/branches/:branchId/departments',
  authenticate,
  departmentController.listDepartments
);

router.get(
  '/departments/:departmentId',
  authenticate,
  departmentController.getDepartment
);

router.put(
  '/departments/:departmentId',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  departmentController.updateDepartment
);

router.put(
  '/departments/:departmentId/head',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  departmentController.updateDepartmentHead
);

router.put(
  '/departments/:departmentId/resources',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  departmentController.updateDepartmentResources
);

router.get(
  '/departments/:departmentId/hierarchy',
  authenticate,
  departmentController.getDepartmentHierarchy
);

router.post(
  '/departments/:departmentId/move',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  departmentController.moveDepartment
);

router.get(
  '/departments/:departmentId/analytics',
  authenticate,
  authorize(['ADMIN', 'SUPER_ADMIN']),
  departmentController.getDepartmentAnalytics
);

module.exports = router;
