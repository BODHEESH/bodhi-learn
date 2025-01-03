// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\events\tenant.events.js

const queue = require('../utils/queue');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

const EXCHANGE = 'tenant-service';

const TenantEvents = {
  // Tenant lifecycle events
  TENANT_CREATED: 'tenant.created',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DELETED: 'tenant.deleted',
  TENANT_SUSPENDED: 'tenant.suspended',
  TENANT_ACTIVATED: 'tenant.activated',

  // Settings events
  SETTINGS_UPDATED: 'tenant.settings.updated',
  FEATURES_UPDATED: 'tenant.features.updated',

  // Billing events
  BILLING_UPDATED: 'tenant.billing.updated',
  PAYMENT_PROCESSED: 'tenant.billing.payment.processed',
  SUBSCRIPTION_CHANGED: 'tenant.billing.subscription.changed',

  // Limit events
  STORAGE_LIMIT_REACHED: 'tenant.limits.storage.reached',
  USER_LIMIT_REACHED: 'tenant.limits.users.reached',

  // Integration events
  INTEGRATION_ENABLED: 'tenant.integration.enabled',
  INTEGRATION_DISABLED: 'tenant.integration.disabled',
  INTEGRATION_UPDATED: 'tenant.integration.updated'
};

class TenantEventEmitter {
  // Publish tenant created event
  async publishTenantCreated(tenantData) {
    try {
      await queue.publishMessage(EXCHANGE, TenantEvents.TENANT_CREATED, {
        event: TenantEvents.TENANT_CREATED,
        timestamp: new Date().toISOString(),
        data: tenantData
      });

      metrics.messageQueueSize.inc({ queue_name: 'tenant_events' });
      logger.info('Published tenant created event', { tenantId: tenantData.id });
    } catch (error) {
      logger.error('Error publishing tenant created event:', error);
      throw error;
    }
  }

  // Publish tenant updated event
  async publishTenantUpdated(tenantId, changes) {
    try {
      await queue.publishMessage(EXCHANGE, TenantEvents.TENANT_UPDATED, {
        event: TenantEvents.TENANT_UPDATED,
        timestamp: new Date().toISOString(),
        tenantId,
        changes
      });

      metrics.messageQueueSize.inc({ queue_name: 'tenant_events' });
      logger.info('Published tenant updated event', { tenantId });
    } catch (error) {
      logger.error('Error publishing tenant updated event:', error);
      throw error;
    }
  }

  // Publish tenant deleted event
  async publishTenantDeleted(tenantId, reason) {
    try {
      await queue.publishMessage(EXCHANGE, TenantEvents.TENANT_DELETED, {
        event: TenantEvents.TENANT_DELETED,
        timestamp: new Date().toISOString(),
        tenantId,
        reason
      });

      metrics.messageQueueSize.inc({ queue_name: 'tenant_events' });
      logger.info('Published tenant deleted event', { tenantId });
    } catch (error) {
      logger.error('Error publishing tenant deleted event:', error);
      throw error;
    }
  }

  // Publish settings updated event
  async publishSettingsUpdated(tenantId, settings) {
    try {
      await queue.publishMessage(EXCHANGE, TenantEvents.SETTINGS_UPDATED, {
        event: TenantEvents.SETTINGS_UPDATED,
        timestamp: new Date().toISOString(),
        tenantId,
        settings
      });

      metrics.messageQueueSize.inc({ queue_name: 'tenant_events' });
      logger.info('Published settings updated event', { tenantId });
    } catch (error) {
      logger.error('Error publishing settings updated event:', error);
      throw error;
    }
  }

  // Publish billing updated event
  async publishBillingUpdated(tenantId, billingData) {
    try {
      await queue.publishMessage(EXCHANGE, TenantEvents.BILLING_UPDATED, {
        event: TenantEvents.BILLING_UPDATED,
        timestamp: new Date().toISOString(),
        tenantId,
        billingData
      });

      metrics.messageQueueSize.inc({ queue_name: 'tenant_events' });
      logger.info('Published billing updated event', { tenantId });
    } catch (error) {
      logger.error('Error publishing billing updated event:', error);
      throw error;
    }
  }

  // Subscribe to tenant events
  async subscribeToEvents(handlers) {
    try {
      // Subscribe to tenant created events
      await queue.consumeMessage(
        EXCHANGE,
        'tenant-created-queue',
        TenantEvents.TENANT_CREATED,
        handlers.onTenantCreated
      );

      // Subscribe to tenant updated events
      await queue.consumeMessage(
        EXCHANGE,
        'tenant-updated-queue',
        TenantEvents.TENANT_UPDATED,
        handlers.onTenantUpdated
      );

      // Subscribe to tenant deleted events
      await queue.consumeMessage(
        EXCHANGE,
        'tenant-deleted-queue',
        TenantEvents.TENANT_DELETED,
        handlers.onTenantDeleted
      );

      // Subscribe to settings updated events
      await queue.consumeMessage(
        EXCHANGE,
        'settings-updated-queue',
        TenantEvents.SETTINGS_UPDATED,
        handlers.onSettingsUpdated
      );

      // Subscribe to billing updated events
      await queue.consumeMessage(
        EXCHANGE,
        'billing-updated-queue',
        TenantEvents.BILLING_UPDATED,
        handlers.onBillingUpdated
      );

      logger.info('Successfully subscribed to all tenant events');
    } catch (error) {
      logger.error('Error subscribing to tenant events:', error);
      throw error;
    }
  }
}

module.exports = {
  TenantEvents,
  tenantEventEmitter: new TenantEventEmitter()
};
