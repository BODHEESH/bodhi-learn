// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\audit.service.js

const { AuditLog } = require('../models');
const logger = require('../config/logger');
const queue = require('../config/queue');

class AuditService {
  /**
   * Create audit log entry
   * @param {Object} params - Audit log parameters
   * @returns {Promise<AuditLog>}
   */
  async log({
    tenantId,
    userId,
    action,
    resource,
    resourceId,
    details,
    metadata = {},
    ip,
    userAgent
  }) {
    try {
      const auditLog = await AuditLog.create({
        tenantId,
        userId,
        action,
        resource,
        resourceId,
        details,
        metadata,
        ip,
        userAgent,
        timestamp: new Date()
      });

      // Add to queue for async processing (e.g., external logging systems)
      await queue.add('audit-log', {
        auditLogId: auditLog.id,
        ...auditLog.toJSON()
      });

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   * @param {Object} params - Query parameters
   * @returns {Promise<AuditLog[]>}
   */
  async getAuditLogs({
    tenantId,
    userId,
    action,
    resource,
    resourceId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
    sortBy = 'timestamp',
    sortOrder = 'desc'
  }) {
    try {
      const query = {};
      
      if (tenantId) query.tenantId = tenantId;
      if (userId) query.userId = userId;
      if (action) query.action = action;
      if (resource) query.resource = resource;
      if (resourceId) query.resourceId = resourceId;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments(query)
      ]);

      return {
        results: logs,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      };
    } catch (error) {
      logger.error('Error retrieving audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   * @param {Object} params - Export parameters
   * @returns {Promise<string>} - URL to downloaded file
   */
  async exportAuditLogs({
    tenantId,
    format = 'csv',
    filters = {},
    destination = 's3'
  }) {
    try {
      const logs = await this.getAuditLogs({
        tenantId,
        ...filters,
        limit: 10000 // Max records for export
      });

      const exportJob = await queue.add('audit-log-export', {
        tenantId,
        format,
        destination,
        logs: logs.results,
        timestamp: new Date()
      });

      return exportJob.id;
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   * @param {number} days - Days to keep logs
   */
  async cleanupOldLogs(days = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
