// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\controllers\department.controller.js

const organizationService = require('../../../services/organization.service');
const departmentService = require('../../../services/department.service');
const { validateSchema } = require('../../../utils/validator');
const { CustomError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

class DepartmentController {
  async createDepartment(req, res, next) {
    try {
      const { orgId, branchId } = req.params;
      const departmentData = req.body;

      // Validate request body
      await validateSchema('createDepartment', departmentData);

      const department = await organizationService.createDepartment(
        orgId,
        branchId,
        departmentData
      );
      
      res.status(201).json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Create department error:', error);
      next(error);
    }
  }

  async updateDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;
      const updateData = req.body;

      // Validate request body
      await validateSchema('updateDepartment', updateData);

      const department = await departmentService.updateDepartment(
        departmentId,
        updateData
      );
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Update department error:', error);
      next(error);
    }
  }

  async getDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;
      const { includeRelations } = req.query;

      const department = await departmentService.getDepartment(
        departmentId,
        includeRelations === 'true'
      );
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Get department error:', error);
      next(error);
    }
  }

  async listDepartments(req, res, next) {
    try {
      const { branchId } = req.params;
      const { page, limit, ...filters } = req.query;

      const result = await departmentService.listDepartments(
        branchId,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );
      
      res.json({
        success: true,
        data: result.departments,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List departments error:', error);
      next(error);
    }
  }

  async updateDepartmentHead(req, res, next) {
    try {
      const { departmentId } = req.params;
      const headData = req.body;

      // Validate request body
      await validateSchema('updateDepartmentHead', headData);

      const department = await departmentService.updateDepartmentHead(
        departmentId,
        headData
      );
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Update department head error:', error);
      next(error);
    }
  }

  async updateDepartmentResources(req, res, next) {
    try {
      const { departmentId } = req.params;
      const resources = req.body;

      // Validate request body
      await validateSchema('updateDepartmentResources', resources);

      const department = await departmentService.updateDepartmentResources(
        departmentId,
        resources
      );
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Update department resources error:', error);
      next(error);
    }
  }

  async getDepartmentHierarchy(req, res, next) {
    try {
      const { departmentId } = req.params;

      const hierarchy = await departmentService.getDepartmentHierarchy(departmentId);
      
      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      logger.error('Get department hierarchy error:', error);
      next(error);
    }
  }

  async moveDepartment(req, res, next) {
    try {
      const { departmentId } = req.params;
      const { newParentId, newBranchId } = req.body;

      // Validate request body
      await validateSchema('moveDepartment', { newParentId, newBranchId });

      const department = await departmentService.moveDepartment(
        departmentId,
        newParentId,
        newBranchId
      );
      
      res.json({
        success: true,
        data: department
      });
    } catch (error) {
      logger.error('Move department error:', error);
      next(error);
    }
  }

  async getDepartmentAnalytics(req, res, next) {
    try {
      const { departmentId } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await departmentService.getDepartmentAnalytics(
        departmentId,
        startDate,
        endDate
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get department analytics error:', error);
      next(error);
    }
  }
}

module.exports = new DepartmentController();
