// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\__tests__\services\tenant.service.test.js

const tenantService = require('../../services/tenant.service');
const { Tenant } = require('../../models');
const { tenantEventEmitter } = require('../../events/tenant.events');
const { queryOptimizer } = require('../../utils/queryOptimizer');
const { ApiError } = require('../../utils/errors');

// Mock dependencies
jest.mock('../../models');
jest.mock('../../events/tenant.events');
jest.mock('../../utils/queryOptimizer');

describe('TenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const mockTenantData = {
      name: 'Test Tenant',
      slug: 'test-tenant',
      type: 'BASIC'
    };

    const mockCreatedTenant = {
      id: '123',
      ...mockTenantData,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a tenant successfully', async () => {
      // Mock the create method
      Tenant.create.mockResolvedValue(mockCreatedTenant);

      // Call the service method
      const result = await tenantService.createTenant(mockTenantData);

      // Assertions
      expect(Tenant.create).toHaveBeenCalledWith(mockTenantData);
      expect(tenantEventEmitter.publishTenantCreated).toHaveBeenCalledWith(mockCreatedTenant);
      expect(result).toEqual(mockCreatedTenant);
    });

    it('should throw error if tenant creation fails', async () => {
      // Mock the create method to throw error
      const error = new Error('Database error');
      Tenant.create.mockRejectedValue(error);

      // Call the service method and expect it to throw
      await expect(tenantService.createTenant(mockTenantData))
        .rejects
        .toThrow('Failed to create tenant');
    });
  });

  describe('getTenant', () => {
    const mockTenantId = '123';
    const mockTenant = {
      id: mockTenantId,
      name: 'Test Tenant',
      status: 'ACTIVE'
    };

    it('should get tenant by id successfully', async () => {
      // Mock the findByPk method
      Tenant.findByPk.mockResolvedValue(mockTenant);

      // Call the service method
      const result = await tenantService.getTenant(mockTenantId);

      // Assertions
      expect(Tenant.findByPk).toHaveBeenCalledWith(mockTenantId);
      expect(result).toEqual(mockTenant);
    });

    it('should throw error if tenant not found', async () => {
      // Mock the findByPk method to return null
      Tenant.findByPk.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(tenantService.getTenant(mockTenantId))
        .rejects
        .toThrow('Tenant not found');
    });
  });

  describe('updateTenant', () => {
    const mockTenantId = '123';
    const mockUpdateData = {
      name: 'Updated Tenant'
    };
    const mockUpdatedTenant = {
      id: mockTenantId,
      ...mockUpdateData,
      updatedAt: new Date()
    };

    it('should update tenant successfully', async () => {
      // Mock the findByPk and update methods
      Tenant.findByPk.mockResolvedValue(mockUpdatedTenant);
      mockUpdatedTenant.update = jest.fn().mockResolvedValue(mockUpdatedTenant);

      // Call the service method
      const result = await tenantService.updateTenant(mockTenantId, mockUpdateData);

      // Assertions
      expect(Tenant.findByPk).toHaveBeenCalledWith(mockTenantId);
      expect(mockUpdatedTenant.update).toHaveBeenCalledWith(mockUpdateData);
      expect(tenantEventEmitter.publishTenantUpdated).toHaveBeenCalledWith(
        mockTenantId,
        mockUpdateData
      );
      expect(result).toEqual(mockUpdatedTenant);
    });

    it('should throw error if tenant not found', async () => {
      // Mock the findByPk method to return null
      Tenant.findByPk.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(tenantService.updateTenant(mockTenantId, mockUpdateData))
        .rejects
        .toThrow('Tenant not found');
    });
  });

  describe('deleteTenant', () => {
    const mockTenantId = '123';
    const mockTenant = {
      id: mockTenantId,
      name: 'Test Tenant',
      destroy: jest.fn()
    };

    it('should delete tenant successfully', async () => {
      // Mock the findByPk method
      Tenant.findByPk.mockResolvedValue(mockTenant);
      mockTenant.destroy.mockResolvedValue(true);

      // Call the service method
      await tenantService.deleteTenant(mockTenantId);

      // Assertions
      expect(Tenant.findByPk).toHaveBeenCalledWith(mockTenantId);
      expect(mockTenant.destroy).toHaveBeenCalled();
      expect(tenantEventEmitter.publishTenantDeleted).toHaveBeenCalledWith(
        mockTenantId,
        'User requested deletion'
      );
    });

    it('should throw error if tenant not found', async () => {
      // Mock the findByPk method to return null
      Tenant.findByPk.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(tenantService.deleteTenant(mockTenantId))
        .rejects
        .toThrow('Tenant not found');
    });
  });

  describe('listTenants', () => {
    const mockTenants = [
      { id: '1', name: 'Tenant 1' },
      { id: '2', name: 'Tenant 2' }
    ];

    it('should list tenants with pagination', async () => {
      // Mock the findAndCountAll method
      Tenant.findAndCountAll.mockResolvedValue({
        rows: mockTenants,
        count: mockTenants.length
      });

      // Call the service method
      const result = await tenantService.listTenants({ page: 1, limit: 10 });

      // Assertions
      expect(Tenant.findAndCountAll).toHaveBeenCalled();
      expect(result.tenants).toEqual(mockTenants);
      expect(result.pagination).toBeDefined();
    });

    it('should apply filters when provided', async () => {
      const filters = { status: 'ACTIVE' };

      // Mock the findAndCountAll method
      Tenant.findAndCountAll.mockResolvedValue({
        rows: mockTenants,
        count: mockTenants.length
      });

      // Call the service method
      await tenantService.listTenants({ page: 1, limit: 10, filters });

      // Assertions
      expect(Tenant.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: filters
        })
      );
    });
  });
});
