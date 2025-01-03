// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\recovery.js

const { redis } = require('../services/redis.service');
const { messageQueue } = require('./message-queue');
const { sequelize } = require('../database/connection');
const mongoose = require('mongoose');
const logger = require('./logger');
const { metrics } = require('./metrics');
const backupService = require('./backup');

class RecoveryService {
  constructor() {
    this.isRecovering = false;
    this.healthChecks = {
      postgres: this.checkPostgres.bind(this),
      mongodb: this.checkMongoDB.bind(this),
      redis: this.checkRedis.bind(this),
      rabbitmq: this.checkRabbitMQ.bind(this)
    };
  }

  // Health checks
  async checkPostgres() {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logger.error('PostgreSQL health check failed:', error);
      return false;
    }
  }

  async checkMongoDB() {
    try {
      return mongoose.connection.readyState === 1;
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
      return false;
    }
  }

  async checkRedis() {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async checkRabbitMQ() {
    try {
      return messageQueue.connected;
    } catch (error) {
      logger.error('RabbitMQ health check failed:', error);
      return false;
    }
  }

  // System health check
  async checkSystemHealth() {
    const results = {};
    let isHealthy = true;

    for (const [service, check] of Object.entries(this.healthChecks)) {
      results[service] = await check();
      if (!results[service]) {
        isHealthy = false;
      }
    }

    // Update metrics
    metrics.systemHealth.set(isHealthy ? 1 : 0);

    return {
      isHealthy,
      services: results
    };
  }

  // Recovery procedures
  async recoverPostgres() {
    try {
      logger.info('Starting PostgreSQL recovery');
      
      // Close existing connections
      await sequelize.close();

      // Get latest backup
      const latestBackup = await backupService.getLatestBackup('postgres');
      if (!latestBackup) {
        throw new Error('No PostgreSQL backup found');
      }

      // Restore from backup
      await backupService.restorePostgres(latestBackup);

      // Reconnect
      await sequelize.authenticate();

      logger.info('PostgreSQL recovery completed successfully');
      metrics.recoverySuccess.inc({ type: 'postgres' });
      return true;
    } catch (error) {
      logger.error('PostgreSQL recovery failed:', error);
      metrics.recoveryFailure.inc({ type: 'postgres' });
      return false;
    }
  }

  async recoverMongoDB() {
    try {
      logger.info('Starting MongoDB recovery');
      
      // Close existing connection
      await mongoose.disconnect();

      // Get latest backup
      const latestBackup = await backupService.getLatestBackup('mongodb');
      if (!latestBackup) {
        throw new Error('No MongoDB backup found');
      }

      // Restore from backup
      await backupService.restoreMongoDB(latestBackup);

      // Reconnect
      await mongoose.connect(process.env.MONGODB_URL);

      logger.info('MongoDB recovery completed successfully');
      metrics.recoverySuccess.inc({ type: 'mongodb' });
      return true;
    } catch (error) {
      logger.error('MongoDB recovery failed:', error);
      metrics.recoveryFailure.inc({ type: 'mongodb' });
      return false;
    }
  }

  async recoverRedis() {
    try {
      logger.info('Starting Redis recovery');
      
      // Reconnect to Redis
      await redis.disconnect();
      await redis.connect();

      // Clear stale data
      await redis.flushall();

      logger.info('Redis recovery completed successfully');
      metrics.recoverySuccess.inc({ type: 'redis' });
      return true;
    } catch (error) {
      logger.error('Redis recovery failed:', error);
      metrics.recoveryFailure.inc({ type: 'redis' });
      return false;
    }
  }

  async recoverRabbitMQ() {
    try {
      logger.info('Starting RabbitMQ recovery');
      
      // Reconnect to RabbitMQ
      await messageQueue.disconnect();
      await messageQueue.connect();

      logger.info('RabbitMQ recovery completed successfully');
      metrics.recoverySuccess.inc({ type: 'rabbitmq' });
      return true;
    } catch (error) {
      logger.error('RabbitMQ recovery failed:', error);
      metrics.recoveryFailure.inc({ type: 'rabbitmq' });
      return false;
    }
  }

  // Full system recovery
  async recoverSystem() {
    if (this.isRecovering) {
      logger.warn('Recovery already in progress');
      return false;
    }

    try {
      this.isRecovering = true;
      logger.info('Starting system recovery');

      // Check which services need recovery
      const health = await this.checkSystemHealth();
      const recoveryTasks = [];

      if (!health.services.postgres) {
        recoveryTasks.push(this.recoverPostgres());
      }
      if (!health.services.mongodb) {
        recoveryTasks.push(this.recoverMongoDB());
      }
      if (!health.services.redis) {
        recoveryTasks.push(this.recoverRedis());
      }
      if (!health.services.rabbitmq) {
        recoveryTasks.push(this.recoverRabbitMQ());
      }

      // Execute recovery tasks
      const results = await Promise.allSettled(recoveryTasks);
      const success = results.every(result => result.status === 'fulfilled' && result.value);

      if (success) {
        logger.info('System recovery completed successfully');
        metrics.recoverySuccess.inc({ type: 'system' });
      } else {
        logger.error('System recovery failed');
        metrics.recoveryFailure.inc({ type: 'system' });
      }

      return success;
    } catch (error) {
      logger.error('System recovery failed:', error);
      metrics.recoveryFailure.inc({ type: 'system' });
      return false;
    } finally {
      this.isRecovering = false;
    }
  }

  // Automatic recovery monitoring
  startMonitoring() {
    setInterval(async () => {
      const health = await this.checkSystemHealth();
      if (!health.isHealthy) {
        logger.warn('System unhealthy, initiating recovery');
        await this.recoverSystem();
      }
    }, 60000); // Check every minute
  }
}

module.exports = new RecoveryService();
