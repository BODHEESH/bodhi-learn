// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\middleware\organization.js

const { Organization, Branch, Department } = require('../../../models');
const { CustomError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

async function validateOrganization(req, res, next) {
  try {
    const orgId = req.params.orgId;
    if (!orgId) {
      throw new CustomError('INVALID_REQUEST', 'Organization ID is required');
    }

    const organization = await Organization.findByPk(orgId);
    if (!organization) {
      throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    // Attach organization to request for later use
    req.organization = organization;
    next();
  } catch (error) {
    logger.error('Organization validation error:', error);
    next(error);
  }
}

async function validateBranch(req, res, next) {
  try {
    const branchId = req.params.branchId;
    if (!branchId) {
      throw new CustomError('INVALID_REQUEST', 'Branch ID is required');
    }

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
    }

    // Attach branch to request for later use
    req.branch = branch;
    next();
  } catch (error) {
    logger.error('Branch validation error:', error);
    next(error);
  }
}

async function validateDepartment(req, res, next) {
  try {
    const departmentId = req.params.departmentId;
    if (!departmentId) {
      throw new CustomError('INVALID_REQUEST', 'Department ID is required');
    }

    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
    }

    // Attach department to request for later use
    req.department = department;
    next();
  } catch (error) {
    logger.error('Department validation error:', error);
    next(error);
  }
}

async function validateOrganizationAccess(req, res, next) {
  try {
    const organization = req.organization;
    const user = req.user;

    // Check if user has access to this organization
    const hasAccess = await checkUserOrganizationAccess(user.id, organization.id);
    if (!hasAccess) {
      throw new CustomError('ACCESS_DENIED', 'You do not have access to this organization');
    }

    next();
  } catch (error) {
    logger.error('Organization access validation error:', error);
    next(error);
  }
}

async function validateBranchAccess(req, res, next) {
  try {
    const branch = req.branch;
    const user = req.user;

    // Check if user has access to this branch
    const hasAccess = await checkUserBranchAccess(user.id, branch.id);
    if (!hasAccess) {
      throw new CustomError('ACCESS_DENIED', 'You do not have access to this branch');
    }

    next();
  } catch (error) {
    logger.error('Branch access validation error:', error);
    next(error);
  }
}

async function validateDepartmentAccess(req, res, next) {
  try {
    const department = req.department;
    const user = req.user;

    // Check if user has access to this department
    const hasAccess = await checkUserDepartmentAccess(user.id, department.id);
    if (!hasAccess) {
      throw new CustomError('ACCESS_DENIED', 'You do not have access to this department');
    }

    next();
  } catch (error) {
    logger.error('Department access validation error:', error);
    next(error);
  }
}

// Helper functions to check access
async function checkUserOrganizationAccess(userId, organizationId) {
  // Implement your access check logic here
  // This could involve checking user roles, permissions, etc.
  return true; // Placeholder
}

async function checkUserBranchAccess(userId, branchId) {
  // Implement your access check logic here
  return true; // Placeholder
}

async function checkUserDepartmentAccess(userId, departmentId) {
  // Implement your access check logic here
  return true; // Placeholder
}

module.exports = {
  validateOrganization,
  validateBranch,
  validateDepartment,
  validateOrganizationAccess,
  validateBranchAccess,
  validateDepartmentAccess
};
