const cron = require('node-cron');
const { redis } = require('../utils/redis');
const { messageQueue } = require('../utils/message-queue');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class BackupScheduler {
  constructor() {
    this.schedulePrefix = 'backup:schedule:';
    this.lockPrefix = 'backup:lock:';
    this.lockTTL = 300; // 5 minutes
    this.schedules = new Map();
  }

  async initialize() {
    try {
      // Load existing schedules from Redis
      const scheduleKeys = await redis.keys(`${this.schedulePrefix}*`);
      for (const key of scheduleKeys) {
        const schedule = JSON.parse(await redis.get(key));
        await this.scheduleBackup(schedule);
      }

      logger.info('Backup scheduler initialized');
    } catch (error) {
      logger.error('Error initializing backup scheduler:', error);
      throw error;
    }
  }

  async scheduleBackup(config) {
    const {
      organizationId,
      schedule,
      type = 'FULL',
      retention = 30,
      compression = true,
      encryption = true,
      validation = true
    } = config;

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      throw new Error('Invalid cron schedule');
    }

    const scheduleId = uuidv4();
    const scheduleConfig = {
      id: scheduleId,
      organizationId,
      schedule,
      type,
      retention,
      compression,
      encryption,
      validation,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: null,
      status: 'ACTIVE'
    };

    // Store schedule in Redis
    await redis.set(
      `${this.schedulePrefix}${scheduleId}`,
      JSON.stringify(scheduleConfig)
    );

    // Create cron job
    const job = cron.schedule(schedule, async () => {
      await this.runScheduledBackup(scheduleId, scheduleConfig);
    });

    // Store job reference
    this.schedules.set(scheduleId, {
      config: scheduleConfig,
      job
    });

    // Calculate next run time
    const nextRun = job.nextDate().toISOString();
    scheduleConfig.nextRun = nextRun;
    
    // Update Redis with next run time
    await redis.set(
      `${this.schedulePrefix}${scheduleId}`,
      JSON.stringify(scheduleConfig)
    );

    // Publish event
    await messageQueue.publish('backup.events', 'backup.schedule.created', {
      scheduleId,
      organizationId,
      schedule,
      nextRun
    });

    // Track metrics
    metrics.backupScheduleCreated.inc({
      organization: organizationId,
      type
    });

    return {
      scheduleId,
      nextRun
    };
  }

  async runScheduledBackup(scheduleId, config) {
    const lockKey = `${this.lockPrefix}${scheduleId}`;
    
    try {
      // Try to acquire lock
      const locked = await redis.set(lockKey, '1', 'NX', 'EX', this.lockTTL);
      if (!locked) {
        logger.warn('Backup already in progress:', scheduleId);
        return;
      }

      // Update last run time
      config.lastRun = new Date().toISOString();
      await redis.set(
        `${this.schedulePrefix}${scheduleId}`,
        JSON.stringify(config)
      );

      // Publish start event
      await messageQueue.publish('backup.events', 'backup.schedule.running', {
        scheduleId,
        organizationId: config.organizationId
      });

      // Run backup
      const backupService = require('./backup.service');
      const result = await backupService.createBackup(config.organizationId, {
        type: config.type,
        compression: {
          enabled: config.compression
        },
        encryption: {
          enabled: config.encryption
        },
        verification: {
          enabled: config.validation
        },
        retention: {
          enabled: true,
          days: config.retention
        }
      });

      // Update next run time
      const job = this.schedules.get(scheduleId);
      if (job) {
        config.nextRun = job.job.nextDate().toISOString();
        await redis.set(
          `${this.schedulePrefix}${scheduleId}`,
          JSON.stringify(config)
        );
      }

      // Publish success event
      await messageQueue.publish('backup.events', 'backup.schedule.completed', {
        scheduleId,
        organizationId: config.organizationId,
        backupId: result.backupId
      });

      // Track metrics
      metrics.backupScheduleCompleted.inc({
        organization: config.organizationId,
        type: config.type,
        status: 'success'
      });
    } catch (error) {
      logger.error('Error running scheduled backup:', error);

      // Publish error event
      await messageQueue.publish('backup.events', 'backup.schedule.failed', {
        scheduleId,
        organizationId: config.organizationId,
        error: error.message
      });

      // Track metrics
      metrics.backupScheduleCompleted.inc({
        organization: config.organizationId,
        type: config.type,
        status: 'error'
      });
    } finally {
      // Release lock
      await redis.del(lockKey);
    }
  }

  async updateSchedule(scheduleId, updates) {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Validate and update schedule
    if (updates.schedule && !cron.validate(updates.schedule)) {
      throw new Error('Invalid cron schedule');
    }

    const updatedConfig = {
      ...schedule,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update Redis
    await redis.set(
      `${this.schedulePrefix}${scheduleId}`,
      JSON.stringify(updatedConfig)
    );

    // Update cron job if schedule changed
    if (updates.schedule) {
      const existingJob = this.schedules.get(scheduleId);
      if (existingJob) {
        existingJob.job.stop();
        const newJob = cron.schedule(updates.schedule, async () => {
          await this.runScheduledBackup(scheduleId, updatedConfig);
        });
        this.schedules.set(scheduleId, {
          config: updatedConfig,
          job: newJob
        });
      }
    }

    // Publish event
    await messageQueue.publish('backup.events', 'backup.schedule.updated', {
      scheduleId,
      updates
    });

    return updatedConfig;
  }

  async deleteSchedule(scheduleId) {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Stop cron job
    const existingJob = this.schedules.get(scheduleId);
    if (existingJob) {
      existingJob.job.stop();
      this.schedules.delete(scheduleId);
    }

    // Remove from Redis
    await redis.del(`${this.schedulePrefix}${scheduleId}`);

    // Publish event
    await messageQueue.publish('backup.events', 'backup.schedule.deleted', {
      scheduleId,
      organizationId: schedule.organizationId
    });

    return true;
  }

  async getSchedule(scheduleId) {
    const schedule = await redis.get(`${this.schedulePrefix}${scheduleId}`);
    return schedule ? JSON.parse(schedule) : null;
  }

  async listSchedules(organizationId) {
    const scheduleKeys = await redis.keys(`${this.schedulePrefix}*`);
    const schedules = await Promise.all(
      scheduleKeys.map(async key => {
        const schedule = JSON.parse(await redis.get(key));
        if (schedule.organizationId === organizationId) {
          return schedule;
        }
        return null;
      })
    );

    return schedules.filter(Boolean);
  }

  async pauseSchedule(scheduleId) {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Stop cron job
    const existingJob = this.schedules.get(scheduleId);
    if (existingJob) {
      existingJob.job.stop();
    }

    // Update status
    schedule.status = 'PAUSED';
    await redis.set(
      `${this.schedulePrefix}${scheduleId}`,
      JSON.stringify(schedule)
    );

    // Publish event
    await messageQueue.publish('backup.events', 'backup.schedule.paused', {
      scheduleId,
      organizationId: schedule.organizationId
    });

    return schedule;
  }

  async resumeSchedule(scheduleId) {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Create new cron job
    const job = cron.schedule(schedule.schedule, async () => {
      await this.runScheduledBackup(scheduleId, schedule);
    });

    // Store job reference
    this.schedules.set(scheduleId, {
      config: schedule,
      job
    });

    // Update status and next run
    schedule.status = 'ACTIVE';
    schedule.nextRun = job.nextDate().toISOString();
    await redis.set(
      `${this.schedulePrefix}${scheduleId}`,
      JSON.stringify(schedule)
    );

    // Publish event
    await messageQueue.publish('backup.events', 'backup.schedule.resumed', {
      scheduleId,
      organizationId: schedule.organizationId,
      nextRun: schedule.nextRun
    });

    return schedule;
  }
}

module.exports = new BackupScheduler();
