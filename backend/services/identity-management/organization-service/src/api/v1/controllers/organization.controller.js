// \d\DREAM\bodhi-learn\backend\services\identity-management\organization-service\src\api\v1\controllers\organization.controller.js

const organizationService = require('../../../services/organization.service');
const { validateSchema } = require('../../../utils/validator');
const { CustomError } = require('../../../utils/errors');
const logger = require('../../../utils/logger');

class OrganizationController {
  async createOrganization(req, res, next) {
    try {
      const { tenantId } = req.params;
      const orgData = req.body;

      // Validate request body
      await validateSchema('createOrganization', orgData);

      const organization = await organizationService.createOrganization(tenantId, orgData);
      
      res.status(201).json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Create organization error:', error);
      next(error);
    }
  }

  async updateOrganization(req, res, next) {
    try {
      const { orgId } = req.params;
      const updateData = req.body;

      // Validate request body
      await validateSchema('updateOrganization', updateData);

      const organization = await organizationService.updateOrganization(orgId, updateData);
      
      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Update organization error:', error);
      next(error);
    }
  }

  async getOrganization(req, res, next) {
    try {
      const { orgId } = req.params;
      const { includeRelations } = req.query;

      const organization = await organizationService.getOrganization(
        orgId, 
        includeRelations === 'true'
      );
      
      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Get organization error:', error);
      next(error);
    }
  }

  async listOrganizations(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { page, limit, ...filters } = req.query;

      const result = await organizationService.listOrganizations(
        tenantId,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );
      
      res.json({
        success: true,
        data: result.organizations,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('List organizations error:', error);
      next(error);
    }
  }

  async updateOrganizationSettings(req, res, next) {
    try {
      const { orgId } = req.params;
      const settings = req.body;

      // Validate request body
      await validateSchema('updateOrganizationSettings', settings);

      const organization = await organizationService.updateOrganizationSettings(orgId, settings);
      
      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Update organization settings error:', error);
      next(error);
    }
  }

  async verifyOrganization(req, res, next) {
    try {
      const { orgId } = req.params;
      const verificationData = req.body;

      // Validate request body
      await validateSchema('verifyOrganization', verificationData);

      const organization = await organizationService.verifyOrganization(orgId, verificationData);
      
      res.json({
        success: true,
        data: organization
      });
    } catch (error) {
      logger.error('Verify organization error:', error);
      next(error);
    }
  }

  async getOrganizationStructure(req, res, next) {
    try {
      const { orgId } = req.params;

      const structure = await organizationService.getOrganizationStructure(orgId);
      
      res.json({
        success: true,
        data: structure
      });
    } catch (error) {
      logger.error('Get organization structure error:', error);
      next(error);
    }
  }
}

module.exports = new OrganizationController();
