// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\services\data.service.js

const { Parser } = require('json2csv');
const xlsx = require('xlsx');
const { Storage } = require('@google-cloud/storage');
const { S3 } = require('aws-sdk');
const { Readable } = require('stream');
const logger = require('../config/logger');
const config = require('../config/config');
const queue = require('../config/queue');

class DataService {
  constructor() {
    this.storage = config.storage.provider === 'gcs'
      ? new Storage()
      : new S3(config.storage.s3);
    
    this.bucket = config.storage.bucket;
    this.exportableModels = [
      'Tenant',
      'TenantSettings',
      'TenantBilling',
      'TenantBackup',
      'AuditLog'
    ];
  }

  /**
   * Export tenant data
   * @param {Object} params - Export parameters
   * @returns {Promise<string>} - URL to exported file
   */
  async exportData({
    tenantId,
    format = 'json',
    models = [],
    filters = {},
    includeMetadata = true
  }) {
    try {
      // Validate models
      const invalidModels = models.filter(m => !this.exportableModels.includes(m));
      if (invalidModels.length > 0) {
        throw new Error(`Invalid models: ${invalidModels.join(', ')}`);
      }

      // If no models specified, export all
      const modelsToExport = models.length > 0 ? models : this.exportableModels;

      // Collect data from each model
      const data = {};
      for (const model of modelsToExport) {
        const Model = require(`../models/${model.toLowerCase()}.model`);
        data[model] = await Model.find({ tenantId, ...filters });
      }

      // Add metadata if requested
      if (includeMetadata) {
        data.metadata = {
          exportedAt: new Date(),
          tenant: tenantId,
          format,
          models: modelsToExport,
          filters
        };
      }

      // Convert data to requested format
      const formattedData = await this.formatData(data, format);

      // Upload to storage
      const fileName = `exports/${tenantId}/${new Date().toISOString()}.${format}`;
      const url = await this.uploadToStorage(fileName, formattedData);

      // Create export record
      await this.createExportRecord(tenantId, {
        format,
        models: modelsToExport,
        url,
        metadata: data.metadata
      });

      return url;
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Import tenant data
   * @param {Object} params - Import parameters
   * @returns {Promise<Object>} - Import results
   */
  async importData({
    tenantId,
    fileUrl,
    format = 'json',
    models = [],
    options = {}
  }) {
    try {
      // Download and parse file
      const data = await this.downloadAndParseFile(fileUrl, format);

      // Validate data structure
      this.validateImportData(data);

      // If specific models requested, filter data
      if (models.length > 0) {
        Object.keys(data).forEach(key => {
          if (!models.includes(key)) {
            delete data[key];
          }
        });
      }

      // Start import transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const results = {};

        // Import each model's data
        for (const [model, items] of Object.entries(data)) {
          if (model === 'metadata') continue;

          const Model = require(`../models/${model.toLowerCase()}.model`);
          
          if (options.clearExisting) {
            await Model.deleteMany({ tenantId }, { session });
          }

          // Prepare items for import
          const preparedItems = items.map(item => ({
            ...item,
            tenantId,
            _id: options.preserveIds ? item._id : new mongoose.Types.ObjectId()
          }));

          // Import items
          const imported = await Model.insertMany(preparedItems, { session });
          results[model] = imported.length;
        }

        // Create import record
        await this.createImportRecord(tenantId, {
          format,
          models: Object.keys(results),
          results,
          metadata: data.metadata
        }, { session });

        await session.commitTransaction();
        return results;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      logger.error('Error importing data:', error);
      throw error;
    }
  }

  /**
   * Format data for export
   * @private
   */
  async formatData(data, format) {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        const parser = new Parser({
          flatten: true,
          flattenSeparator: '__'
        });
        return parser.parse(this.flattenData(data));
      
      case 'xlsx':
        const wb = xlsx.utils.book_new();
        Object.entries(data).forEach(([sheet, items]) => {
          const ws = xlsx.utils.json_to_sheet(items);
          xlsx.utils.book_append_sheet(wb, ws, sheet);
        });
        return xlsx.write(wb, { type: 'buffer' });
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Upload data to storage
   * @private
   */
  async uploadToStorage(fileName, data) {
    if (config.storage.provider === 'gcs') {
      const bucket = this.storage.bucket(this.bucket);
      const file = bucket.file(fileName);
      
      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream();
        stream.on('finish', resolve);
        stream.on('error', reject);
        
        if (Buffer.isBuffer(data)) {
          stream.end(data);
        } else {
          Readable.from(data).pipe(stream);
        }
      });

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 1 week
      });

      return url;
    } else {
      // AWS S3
      const params = {
        Bucket: this.bucket,
        Key: fileName,
        Body: data,
        ContentType: this.getContentType(fileName)
      };

      await this.storage.upload(params).promise();
      return `https://${this.bucket}.s3.amazonaws.com/${fileName}`;
    }
  }

  /**
   * Download and parse file
   * @private
   */
  async downloadAndParseFile(fileUrl, format) {
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });

    switch (format.toLowerCase()) {
      case 'json':
        return JSON.parse(response.data.toString());
      
      case 'csv':
        // Implementation depends on your CSV parsing needs
        break;
      
      case 'xlsx':
        const wb = xlsx.read(response.data);
        const data = {};
        wb.SheetNames.forEach(sheet => {
          data[sheet] = xlsx.utils.sheet_to_json(wb.Sheets[sheet]);
        });
        return data;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Validate import data
   * @private
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    // Validate each model's data
    Object.entries(data).forEach(([model, items]) => {
      if (model === 'metadata') return;

      if (!Array.isArray(items)) {
        throw new Error(`Invalid data format for model ${model}`);
      }

      // Additional validation can be added here
    });
  }

  /**
   * Create export record
   * @private
   */
  async createExportRecord(tenantId, details) {
    const ExportRecord = require('../models/export.model');
    return ExportRecord.create({
      tenantId,
      type: 'EXPORT',
      ...details
    });
  }

  /**
   * Create import record
   * @private
   */
  async createImportRecord(tenantId, details, session) {
    const ImportRecord = require('../models/import.model');
    return ImportRecord.create([{
      tenantId,
      type: 'IMPORT',
      ...details
    }], { session });
  }

  /**
   * Get content type for file
   * @private
   */
  getContentType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const types = {
      json: 'application/json',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return types[ext] || 'application/octet-stream';
  }

  /**
   * Flatten nested object for CSV export
   * @private
   */
  flattenData(obj, prefix = '') {
    const flattened = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}__${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenData(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    });
    
    return flattened;
  }
}

module.exports = new DataService();
