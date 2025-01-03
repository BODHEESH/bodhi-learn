// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\events\handlers\tenant.handlers.js

const logger = require('../../utils/logger');
const { metrics } = require('../../utils/metrics');
const notificationService = require('../../integrations/notification-service.integration');
const analyticsService = require('../../integrations/analytics-service.integration');
const auditService = require('../../integrations/audit-service.integration');

class TenantEventHandlers {
  // Handle tenant created event
  async onTenantCreated(event) {
    const startTime = process.hrtime();
    try {
      const { data: tenantData } = event;

      // Send welcome notification
      await notificationService.sendTenantCreatedNotification(
        tenantData.id,
        tenantData
      );

      // Track analytics
      await analyticsService.trackTenantEvent(
        tenantData.id,
        'TENANT_CREATED',
        tenantData
      );

      // Log audit event
      await auditService.logAuditEvent(tenantData.id, {
        action: 'CREATE',
        entity: 'TENANT',
        entityId: tenantData.id,
        changes: tenantData
      });

      const duration = process.hrtime(startTime);
      metrics.messageProcessingDuration.observe(
        {
          queue_name: 'tenant_events',
          message_type: 'TENANT_CREATED'
        },
        duration[0] + duration[1] / 1e9
      );

      logger.info('Successfully processed tenant created event', {
        tenantId: tenantData.id
      });
    } catch (error) {
      logger.error('Error handling tenant created event:', error);
      throw error;
    }
  }

  // Handle tenant updated event
  async onTenantUpdated(event) {
    const startTime = process.hrtime();
    try {
      const { tenantId, changes } = event;

      // Send update notification
      await notificationService.sendTenantStatusNotification(
        tenantId,
        'UPDATED'
      );

      // Track analytics
      await analyticsService.trackTenantEvent(
        tenantId,
        'TENANT_UPDATED',
        changes
      );

      // Log audit event
      await auditService.logAuditEvent(tenantId, {
        action: 'UPDATE',
        entity: 'TENANT',
        entityId: tenantId,
        changes
      });

      const duration = process.hrtime(startTime);
      metrics.messageProcessingDuration.observe(
        {
          queue_name: 'tenant_events',
          message_type: 'TENANT_UPDATED'
        },
        duration[0] + duration[1] / 1e9
      );

      logger.info('Successfully processed tenant updated event', { tenantId });
    } catch (error) {
      logger.error('Error handling tenant updated event:', error);
      throw error;
    }
  }

  // Handle tenant deleted event
  async onTenantDeleted(event) {
    const startTime = process.hrtime();
    try {
      const { tenantId, reason } = event;

      // Send deletion notification
      await notificationService.sendTenantStatusNotification(
        tenantId,
        'DELETED'
      );

      // Track analytics
      await analyticsService.trackTenantEvent(
        tenantId,
        'TENANT_DELETED',
        { reason }
      );

      // Log audit event
      await auditService.logAuditEvent(tenantId, {
        action: 'DELETE',
        entity: 'TENANT',
        entityId: tenantId,
        changes: { reason }
      });

      const duration = process.hrtime(startTime);
      metrics.messageProcessingDuration.observe(
        {
          queue_name: 'tenant_events',
          message_type: 'TENANT_DELETED'
        },
        duration[0] + duration[1] / 1e9
      );

      logger.info('Successfully processed tenant deleted event', { tenantId });
    } catch (error) {
      logger.error('Error handling tenant deleted event:', error);
      throw error;
    }
  }

  // Handle settings updated event
  async onSettingsUpdated(event) {
    const startTime = process.hrtime();
    try {
      const { tenantId, settings } = event;

      // Send settings update notification
      await notificationService.sendSettingsUpdateNotification(
        tenantId,
        settings
      );

      // Track analytics
      await analyticsService.trackTenantEvent(
        tenantId,
        'SETTINGS_UPDATED',
        settings
      );

      // Log audit event
      await auditService.logAuditEvent(tenantId, {
        action: 'UPDATE',
        entity: 'TENANT_SETTINGS',
        entityId: tenantId,
        changes: settings
      });

      const duration = process.hrtime(startTime);
      metrics.messageProcessingDuration.observe(
        {
          queue_name: 'tenant_events',
          message_type: 'SETTINGS_UPDATED'
        },
        duration[0] + duration[1] / 1e9
      );

      logger.info('Successfully processed settings updated event', { tenantId });
    } catch (error) {
      logger.error('Error handling settings updated event:', error);
      throw error;
    }
  }

  // Handle billing updated event
  async onBillingUpdated(event) {
    const startTime = process.hrtime();
    try {
      const { tenantId, billingData } = event;

      // Send billing update notification
      await notificationService.sendBillingNotification(
        tenantId,
        billingData
      );

      // Track analytics
      await analyticsService.trackTenantEvent(
        tenantId,
        'BILLING_UPDATED',
        billingData
      );

      // Log audit event
      await auditService.logAuditEvent(tenantId, {
        action: 'UPDATE',
        entity: 'TENANT_BILLING',
        entityId: tenantId,
        changes: billingData
      });

      const duration = process.hrtime(startTime);
      metrics.messageProcessingDuration.observe(
        {
          queue_name: 'tenant_events',
          message_type: 'BILLING_UPDATED'
        },
        duration[0] + duration[1] / 1e9
      );

      logger.info('Successfully processed billing updated event', { tenantId });
    } catch (error) {
      logger.error('Error handling billing updated event:', error);
      throw error;
    }
  }
}

module.exports = new TenantEventHandlers();
