// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\audit.js

const { messageQueue } = require('./message-queue');
const logger = require('./logger');
const { metrics } = require('./metrics');

class AuditService {
  constructor() {
    this.eventTypes = {
      AUTH: 'authentication',
      ACCESS: 'access',
      DATA: 'data',
      SECURITY: 'security',
      SYSTEM: 'system'
    };
  }

  // Log audit event
  async logEvent(type, data) {
    try {
      const event = {
        type,
        timestamp: new Date(),
        ...data,
        metadata: {
          environment: process.env.NODE_ENV,
          serviceVersion: process.env.SERVICE_VERSION,
          ...data.metadata
        }
      };

      // Log to application logs
      logger.info('Audit event', event);

      // Send to message queue for processing
      await messageQueue.publish('audit', 'audit.event', event);

      // Update metrics
      metrics.auditEvents.inc({ type });

      return true;
    } catch (error) {
      logger.error('Failed to log audit event:', error);
      metrics.auditFailures.inc({ type });
      return false;
    }
  }

  // Authentication events
  async logAuth(userId, action, success, details = {}) {
    return this.logEvent(this.eventTypes.AUTH, {
      userId,
      action,
      success,
      details
    });
  }

  // Access control events
  async logAccess(userId, resource, action, allowed, details = {}) {
    return this.logEvent(this.eventTypes.ACCESS, {
      userId,
      resource,
      action,
      allowed,
      details
    });
  }

  // Data modification events
  async logDataChange(userId, resource, action, changes, details = {}) {
    return this.logEvent(this.eventTypes.DATA, {
      userId,
      resource,
      action,
      changes,
      details
    });
  }

  // Security events
  async logSecurityEvent(userId, eventType, severity, details = {}) {
    return this.logEvent(this.eventTypes.SECURITY, {
      userId,
      eventType,
      severity,
      details
    });
  }

  // System events
  async logSystemEvent(eventType, status, details = {}) {
    return this.logEvent(this.eventTypes.SYSTEM, {
      eventType,
      status,
      details
    });
  }

  // Audit middleware
  createAuditMiddleware(options = {}) {
    return async (req, res, next) => {
      const startTime = Date.now();

      // Capture the original end function
      const originalEnd = res.end;

      // Override the end function
      res.end = async function(...args) {
        const duration = Date.now() - startTime;

        // Log the request
        await this.logEvent(this.eventTypes.ACCESS, {
          userId: req.user?.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: {
            requestId: req.id,
            ...options.metadata
          }
        });

        // Call the original end function
        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }

  // Audit report generation
  async generateReport(startDate, endDate, filters = {}) {
    try {
      // Implementation for generating audit reports
      // This would typically query your audit log storage
      logger.info('Generating audit report', { startDate, endDate, filters });

      // Update metrics
      metrics.reportGeneration.inc();

      return {
        startDate,
        endDate,
        filters,
        // Add report data here
      };
    } catch (error) {
      logger.error('Failed to generate audit report:', error);
      metrics.reportFailures.inc();
      throw error;
    }
  }
}

module.exports = new AuditService();
