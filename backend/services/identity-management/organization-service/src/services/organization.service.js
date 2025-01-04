const { Organization, Branch, Department } = require('../models');
const { sequelize } = require('../database/connection');
const { CustomError } = require('../utils/errors');
const { TenantService } = require('../integrations/tenant.service');
const { redis } = require('../utils/redis');
const { messageQueue } = require('../utils/message-queue');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const { validateSettings, validateVerification } = require('../validations/organization.validation');

class OrganizationService {
  constructor() {
    this.tenantService = new TenantService();
    this.cacheKeyPrefix = 'org:';
    this.cacheTTL = 3600; // 1 hour
  }

  getCacheKey(orgId) {
    return `${this.cacheKeyPrefix}${orgId}`;
  }

  async cacheOrganization(organization) {
    const key = this.getCacheKey(organization.id);
    await redis.setex(key, this.cacheTTL, JSON.stringify(organization));
  }

  async getCachedOrganization(orgId) {
    const key = this.getCacheKey(orgId);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async removeCachedOrganization(orgId) {
    const key = this.getCacheKey(orgId);
    await redis.del(key);
  }

  async createOrganization(tenantId, orgData) {
    const transaction = await sequelize.transaction();

    try {
      // Verify tenant exists and is active
      await this.tenantService.verifyTenantAccess(tenantId);

      // Create organization
      const organization = await Organization.create({
        ...orgData,
        tenantId,
        status: 'ACTIVE',
        verificationStatus: 'PENDING'
      }, { transaction });

      // If main branch data is provided, create it
      if (orgData.mainBranch) {
        await Branch.create({
          ...orgData.mainBranch,
          organizationId: organization.id,
          type: 'MAIN',
          status: 'ACTIVE'
        }, { transaction });
      }

      await transaction.commit();

      // Cache organization
      await this.cacheOrganization(organization);

      // Publish event
      await messageQueue.publish('organization.events', 'organization.created', {
        organizationId: organization.id,
        tenantId,
        name: organization.name
      });

      // Track metrics
      metrics.organizationCreated.inc({
        tenant: tenantId
      });

      return organization;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating organization:', error);
      metrics.organizationErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  async updateOrganization(orgId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const organization = await Organization.findByPk(orgId, { transaction });
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Update organization
      const updatedOrg = await organization.update(updateData, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheOrganization(updatedOrg);

      // Publish event
      await messageQueue.publish('organization.events', 'organization.updated', {
        organizationId: orgId,
        updates: updateData
      });

      // Track metrics
      metrics.organizationUpdated.inc({
        tenant: organization.tenantId
      });

      return updatedOrg;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating organization:', error);
      metrics.organizationErrors.inc({ type: 'update' });
      throw error;
    }
  }

  async getOrganization(orgId, includeRelations = false) {
    try {
      // Check cache first
      const cached = await this.getCachedOrganization(orgId);
      if (cached && !includeRelations) {
        metrics.organizationCacheHits.inc();
        return cached;
      }

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

      // Cache organization if no relations included
      if (!includeRelations) {
        await this.cacheOrganization(organization);
      }

      metrics.organizationRetrieved.inc({
        tenant: organization.tenantId,
        cached: false
      });

      return organization;
    } catch (error) {
      logger.error('Error fetching organization:', error);
      metrics.organizationErrors.inc({ type: 'retrieval' });
      throw error;
    }
  }

  async listOrganizations(tenantId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const offset = (page - 1) * limit;

      const options = {
        where: { 
          tenantId,
          ...filters,
          status: { [Op.ne]: 'DELETED' }
        },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      };

      const { count, rows } = await Organization.findAndCountAll(options);

      metrics.organizationListed.inc({
        tenant: tenantId,
        count: rows.length
      });

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
      metrics.organizationErrors.inc({ type: 'listing' });
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
          where: { status: 'ACTIVE' },
          include: [{
            model: Department,
            as: 'departments',
            where: { status: 'ACTIVE' },
            include: [{
              model: Department,
              as: 'childDepartments',
              where: { status: 'ACTIVE' }
            }]
          }]
        }]
      });

      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      metrics.organizationStructureRetrieved.inc({
        tenant: organization.tenantId
      });

      return organization;
    } catch (error) {
      logger.error('Error fetching organization structure:', error);
      metrics.organizationErrors.inc({ type: 'structure_retrieval' });
      throw error;
    }
  }

  async updateOrganizationSettings(orgId, settings) {
    const transaction = await sequelize.transaction();

    try {
      // Validate settings
      const { error } = validateSettings(settings);
      if (error) {
        throw new CustomError('INVALID_SETTINGS', error.details[0].message);
      }

      const organization = await Organization.findByPk(orgId, { transaction });
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      // Merge existing settings with new settings
      const updatedSettings = {
        ...organization.settings,
        ...settings
      };

      const updatedOrg = await organization.update({ 
        settings: updatedSettings 
      }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheOrganization(updatedOrg);

      // Publish event
      await messageQueue.publish('organization.events', 'organization.settings.updated', {
        organizationId: orgId,
        settings: updatedSettings
      });

      metrics.organizationSettingsUpdated.inc({
        tenant: organization.tenantId
      });

      return updatedOrg;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating organization settings:', error);
      metrics.organizationErrors.inc({ type: 'settings_update' });
      throw error;
    }
  }

  async verifyOrganization(orgId, verificationData) {
    const transaction = await sequelize.transaction();

    try {
      // Validate verification data
      const { error } = validateVerification(verificationData);
      if (error) {
        throw new CustomError('INVALID_VERIFICATION', error.details[0].message);
      }

      const organization = await Organization.findByPk(orgId, { transaction });
      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      if (organization.verificationStatus === 'VERIFIED') {
        throw new CustomError('ALREADY_VERIFIED', 'Organization is already verified');
      }

      const updatedOrg = await organization.update({
        verificationStatus: 'VERIFIED',
        licenses: verificationData.licenses || organization.licenses,
        accreditations: verificationData.accreditations || organization.accreditations,
        verifiedAt: new Date(),
        verifiedBy: verificationData.verifiedBy
      }, { transaction });

      await transaction.commit();

      // Update cache
      await this.cacheOrganization(updatedOrg);

      // Publish event
      await messageQueue.publish('organization.events', 'organization.verified', {
        organizationId: orgId,
        verificationData
      });

      metrics.organizationVerified.inc({
        tenant: organization.tenantId
      });

      return updatedOrg;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error verifying organization:', error);
      metrics.organizationErrors.inc({ type: 'verification' });
      throw error;
    }
  }
}

module.exports = new OrganizationService();
