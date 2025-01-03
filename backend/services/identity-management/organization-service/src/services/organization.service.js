// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\services\organization.service.js

const { Organization, Branch, Department } = require('../models');
const { sequelize } = require('../database/connection');
const { CustomError } = require('../utils/errors');
const { TenantService } = require('../integrations/tenant.service');
const logger = require('../utils/logger');

class OrganizationService {
  constructor() {
    this.tenantService = new TenantService();
  }

  async createOrganization(tenantId, orgData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify tenant exists and is active
      await this.tenantService.verifyTenantAccess(tenantId);

      // Create organization
      const organization = await Organization.create({
        ...orgData,
        tenantId
      }, { transaction });

      // If main branch data is provided, create it
      if (orgData.mainBranch) {
        await Branch.create({
          ...orgData.mainBranch,
          organizationId: organization.id,
          type: 'MAIN'
        }, { transaction });
      }

      await transaction.commit();
      return organization;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  async updateOrganization(orgId, updateData) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Update organization
      await organization.update(updateData);

      return organization;
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  async getOrganization(orgId, includeRelations = false) {
    try {
      const options = {
        where: { id: orgId }
      };

      if (includeRelations) {
        options.include = [
          {
            model: Branch,
            as: 'branches',
            include: [{
              model: Department,
              as: 'departments'
            }]
          }
        ];
      }

      const organization = await Organization.findOne(options);
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      return organization;
    } catch (error) {
      logger.error('Error fetching organization:', error);
      throw error;
    }
  }

  async listOrganizations(tenantId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const options = {
        where: { tenantId, ...filters },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      };

      const { count, rows } = await Organization.findAndCountAll(options);

      return {
        organizations: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing organizations:', error);
      throw error;
    }
  }

  async createBranch(orgId, branchData) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      const branch = await Branch.create({
        ...branchData,
        organizationId: orgId
      });

      return branch;
    } catch (error) {
      logger.error('Error creating branch:', error);
      throw error;
    }
  }

  async createDepartment(orgId, branchId, departmentData) {
    try {
      // Verify organization and branch exist
      const [organization, branch] = await Promise.all([
        Organization.findByPk(orgId),
        Branch.findOne({ where: { id: branchId, organizationId: orgId } })
      ]);

      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }
      if (!branch) {
        throw new CustomError('BRANCH_NOT_FOUND', 'Branch not found');
      }

      // Create department
      const department = await Department.create({
        ...departmentData,
        organizationId: orgId,
        branchId
      });

      return department;
    } catch (error) {
      logger.error('Error creating department:', error);
      throw error;
    }
  }

  async getOrganizationStructure(orgId) {
    try {
      const organization = await Organization.findOne({
        where: { id: orgId },
        include: [{
          model: Branch,
          as: 'branches',
          include: [{
            model: Department,
            as: 'departments',
            include: [{
              model: Department,
              as: 'childDepartments'
            }]
          }]
        }]
      });

      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      return organization;
    } catch (error) {
      logger.error('Error fetching organization structure:', error);
      throw error;
    }
  }

  async updateOrganizationSettings(orgId, settings) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Merge existing settings with new settings
      const updatedSettings = {
        ...organization.settings,
        ...settings
      };

      await organization.update({ settings: updatedSettings });

      return organization;
    } catch (error) {
      logger.error('Error updating organization settings:', error);
      throw error;
    }
  }

  async verifyOrganization(orgId, verificationData) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      await organization.update({
        verificationStatus: 'VERIFIED',
        licenses: verificationData.licenses || organization.licenses,
        accreditations: verificationData.accreditations || organization.accreditations
      });

      return organization;
    } catch (error) {
      logger.error('Error verifying organization:', error);
      throw error;
    }
  }
}

module.exports = new OrganizationService();
