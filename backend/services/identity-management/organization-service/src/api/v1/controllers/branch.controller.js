// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\controllers\branch.controller.js

const organizationService = require('../../../services/organization.service');
const branchService = require('../../../services/branch.service');
const { validateSchema } = require('../../../utils/validator');
const { CustomError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

class BranchController {
  async createBranch(req, res, next) {
    try {
      const { orgId } = req.params;
      const branchData = req.body;

      // Validate request body
      await validateSchema('createBranch', branchData);

      const branch = await organizationService.createBranch(orgId, branchData);
      
      res.status(201).json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Create branch error:', error);
      next(error);
    }
  }

  async updateBranch(req, res, next) {
    try {
      const { branchId } = req.params;
      const updateData = req.body;

      // Validate request body
      await validateSchema('updateBranch', updateData);

      const branch = await branchService.updateBranch(branchId, updateData);
      
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Update branch error:', error);
      next(error);
    }
  }

  async getBranch(req, res, next) {
    try {
      const { branchId } = req.params;
      const { includeRelations } = req.query;

      const branch = await branchService.getBranch(
        branchId, 
        includeRelations === 'true'
      );
      
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Get branch error:', error);
      next(error);
    }
  }

  async listBranches(req, res, next) {
    try {
      const { orgId } = req.params;
      const { page, limit, ...filters } = req.query;

      const result = await branchService.listBranches(
        orgId,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );
      
      res.json({
        success: true,
        data: result.branches,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List branches error:', error);
      next(error);
    }
  }

  async updateBranchStatus(req, res, next) {
    try {
      const { branchId } = req.params;
      const { status } = req.body;

      // Validate request body
      await validateSchema('updateBranchStatus', { status });

      const branch = await branchService.updateBranchStatus(branchId, status);
      
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Update branch status error:', error);
      next(error);
    }
  }

  async updateBranchFacilities(req, res, next) {
    try {
      const { branchId } = req.params;
      const { facilities } = req.body;

      // Validate request body
      await validateSchema('updateBranchFacilities', { facilities });

      const branch = await branchService.updateBranchFacilities(branchId, facilities);
      
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Update branch facilities error:', error);
      next(error);
    }
  }

  async updateBranchCapacity(req, res, next) {
    try {
      const { branchId } = req.params;
      const capacity = req.body;

      // Validate request body
      await validateSchema('updateBranchCapacity', capacity);

      const branch = await branchService.updateBranchCapacity(branchId, capacity);
      
      res.json({
        success: true,
        data: branch
      });
    } catch (error) {
      logger.error('Update branch capacity error:', error);
      next(error);
    }
  }

  async getBranchAnalytics(req, res, next) {
    try {
      const { branchId } = req.params;
      const { startDate, endDate } = req.query;

      const analytics = await branchService.getBranchAnalytics(
        branchId,
        startDate,
        endDate
      );
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Get branch analytics error:', error);
      next(error);
    }
  }
}

module.exports = new BranchController();
