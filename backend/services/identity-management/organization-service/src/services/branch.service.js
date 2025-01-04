// D:\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\services\branch.service.js

const { Branch, Department } = require('../models');
const { sequelize } = require('../database/connection');
const { CustomError } = require('../utils/errors');
const { redis } = require('../utils/redis');
const { messageQueue } = require('../utils/message-queue');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const { validateBranchData } = require('../validations/branch.validation');

class BranchService {
  constructor() {
    this.cacheKeyPrefix = 'branch:';
    this.cacheTTL = 3600; // 1 hour
  }

  getCacheKey(branchId) {
    return `${this.cacheKeyPrefix}${branchId}`;
  }

  async cacheBranch(branch) {
    const key = this.getCacheKey(branch.id);
    await redis.setex(key, this.cacheTTL, JSON.stringify(branch));
  }

  async getCachedBranch(branchId) {
    const key = this.getCacheKey(branchId);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async removeCachedBranch(branchId) {
    const key = this.getCacheKey(branchId);
    await redis.del(key);
  }

  async createBranch(organizationId, branchData) {
    const transaction = await sequelize.transaction();

    try {
      // Validate branch data
      const { error } = validateBranchData(branchData);
      if (error) {
        throw new CustomError('INVALID_BRANCH_DATA', error.details[0].message);
      }

      // Create branch
      const branch = await Branch.create({
        ...branchData,
        organizationId,
        status: 'ACTIVE'
      }, { transaction });

      await transaction.commit();

      // Cache branch
      await this.cacheBranch(branch);

      // Publish event
      await messageQueue.publish('branch.events', 'branch.created', {
        branchId: branch.id,
        organizationId,
        name: branch.name
      });

      // Track metrics
      metrics.branchCreated.inc({
        organization: organizationId
      });

      return branch;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating branch:', error);
      metrics.branchErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  async updateBranch(branchId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const branch = await Branch.findByPk(branchId, { transaction });
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      // Update branch
      const updatedBranch = await branch.update(updateData, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheBranch(updatedBranch);

      // Publish event
      await messageQueue.publish('branch.events', 'branch.updated', {
        branchId,
        updates: updateData
      });

      // Track metrics
      metrics.branchUpdated.inc({
        organization: branch.organizationId
      });

      return updatedBranch;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating branch:', error);
      metrics.branchErrors.inc({ type: 'update' });
      throw error;
    }
  }

  async getBranch(branchId, includeRelations = false) {
    try {
      // Check cache first
      const cached = await this.getCachedBranch(branchId);
      if (cached && !includeRelations) {
        metrics.branchCacheHits.inc();
        return cached;
      }

      const options = {
        where: { id: branchId }
      };

      if (includeRelations) {
        options.include = [{
          model: Department,
          as: 'departments',
          where: { status: 'ACTIVE' }
        }];
      }

      const branch = await Branch.findOne(options);
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      // Cache branch if no relations included
      if (!includeRelations) {
        await this.cacheBranch(branch);
      }

      metrics.branchRetrieved.inc({
        organization: branch.organizationId,
        cached: false
      });

      return branch;
    } catch (error) {
      logger.error('Error fetching branch:', error);
      metrics.branchErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  async listBranches(organizationId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const options = {
        where: { 
          organizationId,
          ...filters,
          status: { [Op.ne]: 'DELETED' }
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      };

      const { count, rows } = await Branch.findAndCountAll(options);

      metrics.branchListed.inc({
        organization: organizationId,
        count: rows.length
      });

      return {
        branches: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing branches:', error);
      metrics.branchErrors.inc({ type: 'listing' });
      throw error;
    }
  }

  async updateBranchStatus(branchId, status) {
    const transaction = await sequelize.transaction();

    try {
      const branch = await Branch.findByPk(branchId, { transaction });
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      const updatedBranch = await branch.update({ status }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheBranch(updatedBranch);

      // Publish event
      await messageQueue.publish('branch.events', 'branch.status.updated', {
        branchId,
        status
      });

      metrics.branchStatusUpdated.inc({
        organization: branch.organizationId,
        status
      });

      return updatedBranch;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating branch status:', error);
      metrics.branchErrors.inc({ type: 'status_update' });
      throw error;
    }
  }

  async updateBranchFacilities(branchId, facilities) {
    const transaction = await sequelize.transaction();

    try {
      const branch = await Branch.findByPk(branchId, { transaction });
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      const updatedBranch = await branch.update({ facilities }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheBranch(updatedBranch);

      // Publish event
      await messageQueue.publish('branch.events', 'branch.facilities.updated', {
        branchId,
        facilities
      });

      metrics.branchFacilitiesUpdated.inc({
        organization: branch.organizationId
      });

      return updatedBranch;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating branch facilities:', error);
      metrics.branchErrors.inc({ type: 'facilities_update' });
      throw error;
    }
  }

  async updateBranchCapacity(branchId, capacity) {
    const transaction = await sequelize.transaction();

    try {
      const branch = await Branch.findByPk(branchId, { transaction });
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      const updatedBranch = await branch.update({ capacity }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheBranch(updatedBranch);

      // Publish event
      await messageQueue.publish('branch.events', 'branch.capacity.updated', {
        branchId,
        capacity
      });

      metrics.branchCapacityUpdated.inc({
        organization: branch.organizationId
      });

      return updatedBranch;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating branch capacity:', error);
      metrics.branchErrors.inc({ type: 'capacity_update' });
      throw error;
    }
  }

  async getBranchAnalytics(branchId) {
    try {
      const branch = await Branch.findByPk(branchId, {
        include: [{
          model: Department,
          as: 'departments',
          where: { status: 'ACTIVE' }
        }]
      });

      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      const analytics = {
        totalDepartments: branch.departments.length,
        capacityUtilization: (branch.currentCapacity / branch.capacity) * 100,
        facilitiesCount: Object.keys(branch.facilities || {}).length,
        departmentDistribution: await this.getDepartmentDistribution(branch.departments),
        resourceUtilization: await this.getResourceUtilization(branchId),
        performanceMetrics: await this.getPerformanceMetrics(branchId)
      };

      metrics.branchAnalyticsRetrieved.inc({
        organization: branch.organizationId
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting branch analytics:', error);
      metrics.branchErrors.inc({ type: 'analytics' });
      throw error;
    }
  }

  // Helper methods
  async getDepartmentDistribution(departments) {
    return departments.reduce((acc, dept) => {
      acc[dept.type] = (acc[dept.type] || 0) + 1;
      return acc;
    }, {});
  }

  async getResourceUtilization(branchId) {
    // Implementation for resource utilization calculation
    return {};
  }

  async getPerformanceMetrics(branchId) {
    // Implementation for performance metrics calculation
    return {};
  }
}

module.exports = new BranchService();
