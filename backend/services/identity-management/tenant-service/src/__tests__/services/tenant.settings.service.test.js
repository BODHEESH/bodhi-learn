// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\__tests__\services\tenant.settings.service.test.js

const tenantSettingsService = require('../../services/tenant.settings.service');
const { TenantSettings } = require('../../models');
const { tenantEventEmitter } = require('../../events/tenant.events');
const { ApiError } = require('../../utils/errors');

// Mock dependencies
jest.mock('../../models');
jest.mock('../../events/tenant.events');

describe('TenantSettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    const mockTenantId = '123';
    const mockSettings = {
      id: '456',
      tenantId: mockTenantId,
      settings: {
        theme: 'dark',
        notifications: true
      }
    };

    it('should get tenant settings successfully', async () => {
      // Mock the findOne method
      TenantSettings.findOne.mockResolvedValue(mockSettings);

      // Call the service method
      const result = await tenantSettingsService.getSettings(mockTenantId);

      // Assertions
      expect(TenantSettings.findOne).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId }
      });
      expect(result).toEqual(mockSettings);
    });

    it('should throw error if settings not found', async () => {
      // Mock the findOne method to return null
      TenantSettings.findOne.mockResolvedValue(null);

      // Call the service method and expect it to throw
      await expect(tenantSettingsService.getSettings(mockTenantId))
        .rejects
        .toThrow('Tenant settings not found');
    });
  });

  describe('updateSettings', () => {
    const mockTenantId = '123';
    const mockUpdateData = {
      settings: {
        theme: 'light',
        notifications: false
      }
    };
    const mockUpdatedSettings = {
      id: '456',
      tenantId: mockTenantId,
      ...mockUpdateData,
      updatedAt: new Date()
    };

    it('should update settings successfully', async () => {
      // Mock the findOne and update methods
      TenantSettings.findOne.mockResolvedValue(mockUpdatedSettings);
      mockUpdatedSettings.update = jest.fn().mockResolvedValue(mockUpdatedSettings);

      // Call the service method
      const result = await tenantSettingsService.updateSettings(
        mockTenantId,
        mockUpdateData
      );

      // Assertions
      expect(TenantSettings.findOne).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId }
      });
      expect(mockUpdatedSettings.update).toHaveBeenCalledWith(mockUpdateData);
      expect(tenantEventEmitter.publishSettingsUpdated).toHaveBeenCalledWith(
        mockTenantId,
        mockUpdateData
      );
      expect(result).toEqual(mockUpdatedSettings);
    });

    it('should create settings if not found', async () => {
      // Mock findOne to return null and create to return new settings
      TenantSettings.findOne.mockResolvedValue(null);
      TenantSettings.create.mockResolvedValue(mockUpdatedSettings);

      // Call the service method
      const result = await tenantSettingsService.updateSettings(
        mockTenantId,
        mockUpdateData
      );

      // Assertions
      expect(TenantSettings.create).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        ...mockUpdateData
      });
      expect(tenantEventEmitter.publishSettingsUpdated).toHaveBeenCalledWith(
        mockTenantId,
        mockUpdateData
      );
      expect(result).toEqual(mockUpdatedSettings);
    });
  });

  describe('validateSettings', () => {
    const mockSettings = {
      theme: 'dark',
      notifications: true,
      features: ['feature1', 'feature2']
    };

    it('should validate settings successfully', () => {
      // Call the service method
      const result = tenantSettingsService.validateSettings(mockSettings);

      // Assertions
      expect(result).toBe(true);
    });

    it('should throw error for invalid settings', () => {
      const invalidSettings = {
        theme: null,
        notifications: 'invalid'
      };

      // Call the service method and expect it to throw
      expect(() => tenantSettingsService.validateSettings(invalidSettings))
        .toThrow('Invalid settings format');
    });
  });

  describe('applyDefaultSettings', () => {
    const mockTenantId = '123';
    const mockTenantType = 'BASIC';

    it('should apply default settings successfully', async () => {
      // Mock the create method
      TenantSettings.create.mockResolvedValue({
        id: '456',
        tenantId: mockTenantId,
        settings: tenantSettingsService.getDefaultSettings(mockTenantType)
      });

      // Call the service method
      const result = await tenantSettingsService.applyDefaultSettings(
        mockTenantId,
        mockTenantType
      );

      // Assertions
      expect(TenantSettings.create).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        settings: expect.any(Object)
      });
      expect(result.settings).toBeDefined();
    });

    it('should throw error if default settings application fails', async () => {
      // Mock the create method to throw error
      const error = new Error('Database error');
      TenantSettings.create.mockRejectedValue(error);

      // Call the service method and expect it to throw
      await expect(
        tenantSettingsService.applyDefaultSettings(mockTenantId, mockTenantType)
      ).rejects.toThrow('Failed to apply default settings');
    });
  });
});
