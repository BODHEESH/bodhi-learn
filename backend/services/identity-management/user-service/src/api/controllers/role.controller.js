// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\controllers\role.controller.js

const roleService = require('../../services/role.service');
const { ValidationError } = require('../../utils/errors');

class RoleController {
  async create(req, res, next) {
    try {
      const role = await roleService.create(req.body);
      res.status(201).json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await roleService.findById(req.params.id);
      res.json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await roleService.findAll({}, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        status: 'success',
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.update(req.params.id, req.body);
      res.json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await roleService.delete(req.params.id);
      res.json({
        status: 'success',
        message: 'Role deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async addPermissions(req, res, next) {
    try {
      const { permissions } = req.body;
      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        throw new ValidationError('Permissions array is required');
      }

      const role = await roleService.addPermissions(req.params.id, permissions);
      res.json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async removePermissions(req, res, next) {
    try {
      const { permissions } = req.body;
      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        throw new ValidationError('Permissions array is required');
      }

      const role = await roleService.removePermissions(req.params.id, permissions);
      res.json({
        status: 'success',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  async getHierarchy(req, res, next) {
    try {
      const hierarchy = await roleService.getHierarchy();
      res.json({
        status: 'success',
        data: hierarchy
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();
