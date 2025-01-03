// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\backup.js

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;
const AWS = require('aws-sdk');
const config = require('../config/app.config');
const logger = require('./logger');
const { metrics } = require('./metrics');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region
    });
  }

  // Database backup
  async backupPostgres() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `postgres-backup-${timestamp}.sql`;
      const filepath = path.join(config.backup.localPath, filename);

      // Create backup using pg_dump
      await execAsync(`PGPASSWORD=${config.database.password} pg_dump -h ${config.database.host} -U ${config.database.user} -d ${config.database.name} -F c -f ${filepath}`);

      // Upload to S3
      await this.uploadToS3(filepath, `postgres/${filename}`);

      // Clean up local file
      await fs.unlink(filepath);

      logger.info('PostgreSQL backup completed successfully');
      metrics.backupSuccess.inc({ type: 'postgres' });
    } catch (error) {
      logger.error('PostgreSQL backup failed:', error);
      metrics.backupFailure.inc({ type: 'postgres' });
      throw error;
    }
  }

  async backupMongoDB() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mongodb-backup-${timestamp}`;
      const filepath = path.join(config.backup.localPath, filename);

      // Create backup using mongodump
      await execAsync(`mongodump --uri="${config.mongodb.url}" --out=${filepath}`);

      // Compress backup
      await execAsync(`tar -czf ${filepath}.tar.gz -C ${filepath} .`);

      // Upload to S3
      await this.uploadToS3(`${filepath}.tar.gz`, `mongodb/${filename}.tar.gz`);

      // Clean up local files
      await fs.rm(filepath, { recursive: true });
      await fs.unlink(`${filepath}.tar.gz`);

      logger.info('MongoDB backup completed successfully');
      metrics.backupSuccess.inc({ type: 'mongodb' });
    } catch (error) {
      logger.error('MongoDB backup failed:', error);
      metrics.backupFailure.inc({ type: 'mongodb' });
      throw error;
    }
  }

  // S3 operations
  async uploadToS3(filepath, key) {
    try {
      const fileContent = await fs.readFile(filepath);
      await this.s3.upload({
        Bucket: config.aws.backupBucket,
        Key: key,
        Body: fileContent,
        ServerSideEncryption: 'AES256'
      }).promise();

      logger.info('Backup uploaded to S3 successfully', { key });
    } catch (error) {
      logger.error('S3 upload failed:', error);
      throw error;
    }
  }

  async restoreFromS3(key, targetPath) {
    try {
      const data = await this.s3.getObject({
        Bucket: config.aws.backupBucket,
        Key: key
      }).promise();

      await fs.writeFile(targetPath, data.Body);
      logger.info('Backup downloaded from S3 successfully', { key });
    } catch (error) {
      logger.error('S3 download failed:', error);
      throw error;
    }
  }

  // Restore operations
  async restorePostgres(backupKey) {
    try {
      const localPath = path.join(config.backup.localPath, 'postgres-restore.sql');
      
      // Download from S3
      await this.restoreFromS3(backupKey, localPath);

      // Restore database
      await execAsync(`PGPASSWORD=${config.database.password} pg_restore -h ${config.database.host} -U ${config.database.user} -d ${config.database.name} -c ${localPath}`);

      // Clean up
      await fs.unlink(localPath);

      logger.info('PostgreSQL restore completed successfully');
      metrics.restoreSuccess.inc({ type: 'postgres' });
    } catch (error) {
      logger.error('PostgreSQL restore failed:', error);
      metrics.restoreFailure.inc({ type: 'postgres' });
      throw error;
    }
  }

  async restoreMongoDB(backupKey) {
    try {
      const localPath = path.join(config.backup.localPath, 'mongodb-restore.tar.gz');
      const extractPath = path.join(config.backup.localPath, 'mongodb-restore');

      // Download from S3
      await this.restoreFromS3(backupKey, localPath);

      // Extract backup
      await execAsync(`tar -xzf ${localPath} -C ${extractPath}`);

      // Restore database
      await execAsync(`mongorestore --uri="${config.mongodb.url}" --drop ${extractPath}`);

      // Clean up
      await fs.unlink(localPath);
      await fs.rm(extractPath, { recursive: true });

      logger.info('MongoDB restore completed successfully');
      metrics.restoreSuccess.inc({ type: 'mongodb' });
    } catch (error) {
      logger.error('MongoDB restore failed:', error);
      metrics.restoreFailure.inc({ type: 'mongodb' });
      throw error;
    }
  }

  // Scheduled backups
  scheduleBackups() {
    // Schedule PostgreSQL backup
    setInterval(async () => {
      try {
        await this.backupPostgres();
      } catch (error) {
        logger.error('Scheduled PostgreSQL backup failed:', error);
      }
    }, config.backup.postgresInterval);

    // Schedule MongoDB backup
    setInterval(async () => {
      try {
        await this.backupMongoDB();
      } catch (error) {
        logger.error('Scheduled MongoDB backup failed:', error);
      }
    }, config.backup.mongoInterval);
  }
}

module.exports = new BackupService();
