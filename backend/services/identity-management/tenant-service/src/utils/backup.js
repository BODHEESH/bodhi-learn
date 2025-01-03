// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\backup.js

const { S3 } = require('aws-sdk');
const { createReadStream, createWriteStream } = require('fs');
const { exec } = require('child_process');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

class BackupService {
  constructor() {
    this.s3 = new S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region
    });
    this.backupBucket = config.aws.backupBucket;
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `../../backups/db-backup-${timestamp}.sql`);

    try {
      // Create database dump
      await new Promise((resolve, reject) => {
        exec(
          `pg_dump -U ${config.database.username} -h ${config.database.host} ${config.database.database} > ${backupPath}`,
          (error, stdout, stderr) => {
            if (error) {
              logger.error('Error creating database backup:', error);
              reject(error);
              return;
            }
            resolve();
          }
        );
      });

      // Upload to S3
      const fileStream = createReadStream(backupPath);
      const uploadParams = {
        Bucket: this.backupBucket,
        Key: `database-backups/db-backup-${timestamp}.sql`,
        Body: fileStream
      };

      await this.s3.upload(uploadParams).promise();
      logger.info(`Database backup created and uploaded: ${uploadParams.Key}`);

      return {
        success: true,
        path: uploadParams.Key,
        timestamp
      };
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupKey) {
    const restorePath = path.join(__dirname, '../../backups/temp-restore.sql');

    try {
      // Download from S3
      const downloadParams = {
        Bucket: this.backupBucket,
        Key: backupKey
      };

      const fileStream = createWriteStream(restorePath);
      const s3Stream = this.s3.getObject(downloadParams).createReadStream();

      await new Promise((resolve, reject) => {
        s3Stream.pipe(fileStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      // Restore database
      await new Promise((resolve, reject) => {
        exec(
          `psql -U ${config.database.username} -h ${config.database.host} ${config.database.database} < ${restorePath}`,
          (error, stdout, stderr) => {
            if (error) {
              logger.error('Error restoring database:', error);
              reject(error);
              return;
            }
            resolve();
          }
        );
      });

      logger.info(`Database restored from backup: ${backupKey}`);

      return {
        success: true,
        backupKey
      };
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const params = {
        Bucket: this.backupBucket,
        Prefix: 'database-backups/'
      };

      const data = await this.s3.listObjects(params).promise();
      return data.Contents.map(obj => ({
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size
      }));
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  async deleteBackup(backupKey) {
    try {
      const params = {
        Bucket: this.backupBucket,
        Key: backupKey
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`Backup deleted: ${backupKey}`);

      return {
        success: true,
        backupKey
      };
    } catch (error) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }
}

module.exports = new BackupService();
