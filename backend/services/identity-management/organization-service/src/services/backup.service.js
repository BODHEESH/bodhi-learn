const { Organization, Branch, Department } = require('../models');
const { sequelize } = require('../database/connection');
const { CustomError } = require('../utils/errors');
const { redis } = require('../utils/redis');
const { messageQueue } = require('../utils/message-queue');
const { metrics } = require('../utils/metrics');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { BackupCrypto, BackupCompression, BackupVerification } = require('../utils/backup-tools');

class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.crypto = new BackupCrypto();
    this.compression = new BackupCompression();
    this.verification = new BackupVerification();
  }

  async createBackup(organizationId, options = {}) {
    const transaction = await sequelize.transaction();
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // Get organization data
      const organization = await Organization.findByPk(organizationId, {
        include: [
          {
            model: Branch,
            include: [
              {
                model: Department
              }
            ]
          }
        ],
        transaction
      });

      if (!organization) {
        throw new CustomError('ORGANIZATION_NOT_FOUND', 'Organization not found');
      }

      const backupData = {
        id: backupId,
        timestamp,
        organizationId,
        data: {
          organization: organization.toJSON(),
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            type: options.type || 'FULL_BACKUP'
          }
        }
      };

      // Generate manifest and checksum
      const manifest = await this.verification.generateManifest(backupData);
      const checksum = await this.verification.generateChecksum(JSON.stringify(backupData));

      // Compress data
      let processedData = Buffer.from(JSON.stringify(backupData));
      if (options.compression?.enabled !== false) {
        processedData = await this.compression.compress(processedData, {
          algorithm: options.compression?.algorithm || 'gzip',
          level: options.compression?.level || 6
        });
        manifest.metadata.compressed = true;
      }

      // Encrypt data if enabled
      if (options.encryption?.enabled !== false) {
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new CustomError('ENCRYPTION_ERROR', 'Encryption key not found');
        }
        processedData = await this.crypto.encrypt(processedData, encryptionKey, {
          algorithm: options.encryption?.algorithm,
          keyDerivation: options.encryption?.keyDerivation
        });
        manifest.metadata.encrypted = true;
      }

      // Create backup directory if it doesn't exist
      await fs.mkdir(this.backupDir, { recursive: true });

      // Write backup and manifest
      const backupPath = path.join(this.backupDir, `${organizationId}_${timestamp}.bak`);
      const manifestPath = path.join(this.backupDir, `${organizationId}_${timestamp}.manifest`);
      
      await Promise.all([
        fs.writeFile(backupPath, processedData),
        fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
      ]);

      await transaction.commit();

      // Publish backup event
      await messageQueue.publish('organization.events', 'organization.backup.created', {
        backupId,
        organizationId,
        timestamp,
        path: backupPath,
        manifest
      });

      // Track metrics
      metrics.backupCreated.inc({
        organization: organizationId,
        type: options.type || 'FULL_BACKUP',
        compressed: !!manifest.metadata.compressed,
        encrypted: !!manifest.metadata.encrypted
      });

      // Rotate old backups if needed
      if (options.retention?.enabled !== false) {
        await this.rotateBackups(organizationId, options.retention?.days);
      }

      return {
        backupId,
        timestamp,
        path: backupPath,
        manifest
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating backup:', error);
      metrics.backupErrors.inc({ type: 'creation' });
      throw error;
    }
  }

  async restoreFromBackup(backupPath, options = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Read backup and manifest files
      const manifestPath = backupPath.replace('.bak', '.manifest');
      const [backupContent, manifestContent] = await Promise.all([
        fs.readFile(backupPath),
        fs.readFile(manifestPath, 'utf8')
      ]);

      const manifest = JSON.parse(manifestContent);
      let processedData = backupContent;

      // Decrypt if encrypted
      if (manifest.metadata.encrypted) {
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new CustomError('ENCRYPTION_ERROR', 'Encryption key not found');
        }
        processedData = await this.crypto.decrypt(processedData, encryptionKey, {
          algorithm: manifest.metadata.encryptionAlgorithm
        });
      }

      // Decompress if compressed
      if (manifest.metadata.compressed) {
        processedData = await this.compression.decompress(
          processedData,
          manifest.metadata.compressionAlgorithm
        );
      }

      const backup = JSON.parse(processedData.toString());
      const { organizationId } = backup;

      // Validate backup if required
      if (options.verification?.enabled !== false) {
        await this.verification.validateBackupStructure(backup);
        await this.verification.validateRestoreCompatibility(backup, '1.0');
        
        const checksum = await this.verification.generateChecksum(JSON.stringify(backup.data));
        if (checksum !== manifest.checksum) {
          throw new CustomError('VERIFICATION_ERROR', 'Backup checksum verification failed');
        }
      }

      // Check if organization exists
      const existingOrg = await Organization.findByPk(organizationId);
      if (existingOrg && !options.force) {
        throw new CustomError('ORGANIZATION_EXISTS', 'Organization already exists. Use force option to override.');
      }

      // Delete existing data if force is true
      if (existingOrg && options.force) {
        await Organization.destroy({
          where: { id: organizationId },
          force: true,
          transaction
        });
      }

      // Restore organization
      const organization = backup.data.organization;
      const restoredOrg = await Organization.create(
        {
          ...organization,
          branches: organization.branches.map(branch => ({
            ...branch,
            departments: branch.departments
          }))
        },
        {
          include: [{
            model: Branch,
            include: [Department]
          }],
          transaction
        }
      );

      await transaction.commit();

      // Clear cache
      await redis.del(`org:${organizationId}`);
      await this.clearRelatedCache(organizationId);

      // Publish restore event
      await messageQueue.publish('organization.events', 'organization.restored', {
        organizationId,
        backupId: backup.id,
        timestamp: backup.timestamp,
        manifest
      });

      // Track metrics
      metrics.backupRestored.inc({
        organization: organizationId,
        type: manifest.metadata.type
      });

      return restoredOrg;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error restoring from backup:', error);
      metrics.backupErrors.inc({ type: 'restore' });
      throw error;
    }
  }

  async listBackups(organizationId) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith(organizationId) && file.endsWith('.manifest'))
          .map(async file => {
            const content = await fs.readFile(path.join(this.backupDir, file), 'utf8');
            return JSON.parse(content);
          })
      );

      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  async rotateBackups(organizationId, retentionDays = 30) {
    try {
      const backups = await this.listBackups(organizationId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      for (const backup of backups) {
        const backupDate = new Date(backup.timestamp);
        if (backupDate < cutoffDate) {
          const backupPath = path.join(this.backupDir, `${organizationId}_${backup.timestamp}.bak`);
          const manifestPath = path.join(this.backupDir, `${organizationId}_${backup.timestamp}.manifest`);
          
          await Promise.all([
            fs.unlink(backupPath).catch(() => {}),
            fs.unlink(manifestPath).catch(() => {})
          ]);
          
          // Track metrics
          metrics.backupRotated.inc({
            organization: organizationId
          });
        }
      }
    } catch (error) {
      logger.error('Error rotating backups:', error);
      metrics.backupErrors.inc({ type: 'rotation' });
      throw error;
    }
  }

  async verifyBackup(backupPath) {
    try {
      const manifestPath = backupPath.replace('.bak', '.manifest');
      const [backupContent, manifestContent] = await Promise.all([
        fs.readFile(backupPath),
        fs.readFile(manifestPath, 'utf8')
      ]);

      const manifest = JSON.parse(manifestContent);
      let processedData = backupContent;

      // Decrypt if encrypted
      if (manifest.metadata.encrypted) {
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new CustomError('ENCRYPTION_ERROR', 'Encryption key not found');
        }
        processedData = await this.crypto.decrypt(processedData, encryptionKey, {
          algorithm: manifest.metadata.encryptionAlgorithm
        });
      }

      // Decompress if compressed
      if (manifest.metadata.compressed) {
        processedData = await this.compression.decompress(
          processedData,
          manifest.metadata.compressionAlgorithm
        );
      }

      const backup = JSON.parse(processedData.toString());

      // Validate backup structure and compatibility
      await this.verification.validateBackupStructure(backup);
      await this.verification.validateRestoreCompatibility(backup, '1.0');
      
      // Verify checksum
      const checksum = await this.verification.generateChecksum(JSON.stringify(backup.data));
      if (checksum !== manifest.checksum) {
        throw new CustomError('VERIFICATION_ERROR', 'Backup checksum verification failed');
      }

      // Validate data integrity
      await this.verification.validateDataIntegrity(backup);

      return {
        valid: true,
        manifest,
        details: {
          organizationId: backup.organizationId,
          timestamp: backup.timestamp,
          type: manifest.metadata.type,
          size: manifest.metadata.size,
          compressed: manifest.metadata.compressed,
          encrypted: manifest.metadata.encrypted
        }
      };
    } catch (error) {
      logger.error('Error verifying backup:', error);
      metrics.backupErrors.inc({ type: 'verification' });
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async clearRelatedCache(organizationId) {
    const keys = await redis.keys(`*:${organizationId}:*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }
}

module.exports = new BackupService();
