const { Department, Branch } = require('../models');
const { sequelize } = require('../database/connection');
const { CustomError } = require('../utils/errors');
const { redis } = require('../utils/redis');
const { messageQueue } = require('../utils/message-queue');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const { validateDepartmentData } = require('../validations/department.validation');

class DepartmentService {
  constructor() {
    this.cacheKeyPrefix = 'dept:';
    this.cacheTTL = 3600; // 1 hour
  }

  getCacheKey(departmentId) {
    return `${this.cacheKeyPrefix}${departmentId}`;
  }

  async cacheDepartment(department) {
    const key = this.getCacheKey(department.id);
    await redis.setex(key, this.cacheTTL, JSON.stringify(department));
  }

  async getCachedDepartment(departmentId) {
    const key = this.getCacheKey(departmentId);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async removeCachedDepartment(departmentId) {
    const key = this.getCacheKey(departmentId);
    await redis.del(key);
  }

  async createDepartment(branchId, departmentData) {
    const transaction = await sequelize.transaction();

    try {
      // Validate department data
      const { error } = validateDepartmentData(departmentData);
      if (error) {
        throw new CustomError('INVALID_DEPARTMENT_DATA', error.details[0].message);
      }

      // Get branch to verify it exists and get organizationId
      const branch = await Branch.findByPk(branchId, { transaction });
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      // Create department
      const department = await Department.create({
        ...departmentData,
        branchId,
        organizationId: branch.organizationId,
        status: 'ACTIVE'
      }, { transaction });

      await transaction.commit();

      // Cache department
      await this.cacheDepartment(department);

      // Publish event
      await messageQueue.publish('department.events', 'department.created', {
        departmentId: department.id,
        branchId,
        organizationId: branch.organizationId,
        name: department.name
      });

      // Track metrics
      metrics.departmentCreated.inc({
        organization: branch.organizationId,
        branch: branchId
      });

      return department;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating department:', error);
      metrics.departmentErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  async updateDepartment(departmentId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const department = await Department.findByPk(departmentId, { transaction });
      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      // Update department
      const updatedDepartment = await department.update(updateData, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheDepartment(updatedDepartment);

      // Publish event
      await messageQueue.publish('department.events', 'department.updated', {
        departmentId,
        updates: updateData
      });

      // Track metrics
      metrics.departmentUpdated.inc({
        organization: department.organizationId,
        branch: department.branchId
      });

      return updatedDepartment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating department:', error);
      metrics.departmentErrors.inc({ type: 'update' });
      throw error;
    }
  }

  async getDepartment(departmentId, includeRelations = false) {
    try {
      // Check cache first
      const cached = await this.getCachedDepartment(departmentId);
      if (cached && !includeRelations) {
        metrics.departmentCacheHits.inc();
        return cached;
      }

      const options = {
        where: { id: departmentId }
      };

      if (includeRelations) {
        options.include = [{
          model: Department,
          as: 'childDepartments',
          where: { status: 'ACTIVE' }
        }];
      }

      const department = await Department.findOne(options);
      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      // Cache department if no relations included
      if (!includeRelations) {
        await this.cacheDepartment(department);
      }

      metrics.departmentRetrieved.inc({
        organization: department.organizationId,
        branch: department.branchId,
        cached: false
      });

      return department;
    } catch (error) {
      logger.error('Error fetching department:', error);
      metrics.departmentErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  async listDepartments(branchId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const options = {
        where: { 
          branchId,
          ...filters,
          status: { [Op.ne]: 'DELETED' }
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      };

      const { count, rows } = await Department.findAndCountAll(options);

      metrics.departmentListed.inc({
        branch: branchId,
        count: rows.length
      });

      return {
        departments: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing departments:', error);
      metrics.departmentErrors.inc({ type: 'listing' });
      throw error;
    }
  }

  async updateDepartmentHead(departmentId, headData) {
    const transaction = await sequelize.transaction();

    try {
      const department = await Department.findByPk(departmentId, { transaction });
      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      const updatedDepartment = await department.update({
        headId: headData.userId,
        headName: headData.name,
        headTitle: headData.title,
        headStartDate: headData.startDate
      }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheDepartment(updatedDepartment);

      // Publish event
      await messageQueue.publish('department.events', 'department.head.updated', {
        departmentId,
        headData
      });

      metrics.departmentHeadUpdated.inc({
        organization: department.organizationId,
        branch: department.branchId
      });

      return updatedDepartment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating department head:', error);
      metrics.departmentErrors.inc({ type: 'head_update' });
      throw error;
    }
  }

  async updateDepartmentResources(departmentId, resources) {
    const transaction = await sequelize.transaction();

    try {
      const department = await Department.findByPk(departmentId, { transaction });
      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      const updatedDepartment = await department.update({ resources }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheDepartment(updatedDepartment);

      // Publish event
      await messageQueue.publish('department.events', 'department.resources.updated', {
        departmentId,
        resources
      });

      metrics.departmentResourcesUpdated.inc({
        organization: department.organizationId,
        branch: department.branchId
      });

      return updatedDepartment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating department resources:', error);
      metrics.departmentErrors.inc({ type: 'resources_update' });
      throw error;
    }
  }

  async getDepartmentHierarchy(departmentId) {
    try {
      const department = await Department.findOne({
        where: { id: departmentId },
        include: [{
          model: Department,
          as: 'childDepartments',
          where: { status: 'ACTIVE' },
          include: [{
            model: Department,
            as: 'childDepartments',
            where: { status: 'ACTIVE' }
          }]
        }]
      });

      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      metrics.departmentHierarchyRetrieved.inc({
        organization: department.organizationId,
        branch: department.branchId
      });

      return department;
    } catch (error) {
      logger.error('Error fetching department hierarchy:', error);
      metrics.departmentErrors.inc({ type: 'hierarchy_retrieval' });
      throw error;
    }
  }

  async moveDepartment(departmentId, targetBranchId) {
    const transaction = await sequelize.transaction();

    try {
      const [department, targetBranch] = await Promise.all([
        Department.findByPk(departmentId, { transaction }),
        Branch.findByPk(targetBranchId, { transaction })
      ]);

      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }
      if (!targetBranch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Target branch not found');
      }

      // Check if target branch is in same organization
      if (department.organizationId !== targetBranch.organizationId) {
        throw new CustomError('INVALID_OPERATION', 'Cannot move department to different organization');
      }

      const oldBranchId = department.branchId;
      const updatedDepartment = await department.update({
        branchId: targetBranchId
      }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheDepartment(updatedDepartment);

      // Publish event
      await messageQueue.publish('department.events', 'department.moved', {
        departmentId,
        oldBranchId,
        newBranchId: targetBranchId
      });

      metrics.departmentMoved.inc({
        organization: department.organizationId,
        fromBranch: oldBranchId,
        toBranch: targetBranchId
      });

      return updatedDepartment;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error moving department:', error);
      metrics.departmentErrors.inc({ type: 'move' });
      throw error;
    }
  }

  async getDepartmentAnalytics(departmentId) {
    try {
      const department = await Department.findByPk(departmentId, {
        include: [{
          model: Department,
          as: 'childDepartments',
          where: { status: 'ACTIVE' }
        }]
      });

      if (!department) {
        throw new CustomError('DEPARTMENT_NOT_FOUND', 'Department not found');
      }

      const analytics = {
        totalEmployees: await this.getEmployeeCount(departmentId),
        childDepartments: department.childDepartments.length,
        resourceUtilization: await this.getResourceUtilization(departmentId),
        performanceMetrics: await this.getPerformanceMetrics(departmentId),
        budgetAnalysis: await this.getBudgetAnalysis(departmentId),
        projectMetrics: await this.getProjectMetrics(departmentId)
      };

      metrics.departmentAnalyticsRetrieved.inc({
        organization: department.organizationId,
        branch: department.branchId
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting department analytics:', error);
      metrics.departmentErrors.inc({ type: 'analytics' });
      throw error;
    }
  }

  // Helper methods
  async getEmployeeCount(departmentId) {
    // Implementation for employee count calculation
    return 0;
  }

  async getResourceUtilization(departmentId) {
    // Implementation for resource utilization calculation
    return {};
  }

  async getPerformanceMetrics(departmentId) {
    // Implementation for performance metrics calculation
    return {};
  }

  async getBudgetAnalysis(departmentId) {
    // Implementation for budget analysis calculation
    return {};
  }

  async getProjectMetrics(departmentId) {
    // Implementation for project metrics calculation
    return {};
  }
}

module.exports = new DepartmentService();
