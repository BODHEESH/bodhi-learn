const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { ValidationError } = require('./errors');
const config = require('../config/config');
const logger = require('../config/logger');

class FileUploader {
    constructor() {
        this.uploadDir = config.media.uploadDir;
        this.maxFileSize = config.media.maxFileSize;
        this.allowedTypes = config.media.allowedTypes;

        // Configure multer storage
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, this.uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = crypto.randomBytes(16).toString('hex');
                cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
            }
        });

        // Configure multer upload
        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: this.fileFilter.bind(this)
        });
    }

    /**
     * File filter for multer
     * @param {Object} req - Express request object
     * @param {Object} file - File object
     * @param {Function} cb - Callback function
     */
    fileFilter(req, file, cb) {
        if (!this.allowedTypes.includes(file.mimetype)) {
            cb(new ValidationError(`File type ${file.mimetype} not allowed`), false);
            return;
        }
        cb(null, true);
    }

    /**
     * Upload single file
     * @param {string} fieldName - Form field name
     * @returns {Function} Multer middleware
     */
    single(fieldName) {
        return this.upload.single(fieldName);
    }

    /**
     * Upload multiple files
     * @param {string} fieldName - Form field name
     * @param {number} maxCount - Maximum number of files
     * @returns {Function} Multer middleware
     */
    array(fieldName, maxCount) {
        return this.upload.array(fieldName, maxCount);
    }

    /**
     * Upload fields
     * @param {Object[]} fields - Array of field configs
     * @returns {Function} Multer middleware
     */
    fields(fields) {
        return this.upload.fields(fields);
    }

    /**
     * Delete file
     * @param {string} filename - Name of file to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(filename) {
        try {
            const fs = require('fs').promises;
            await fs.unlink(path.join(this.uploadDir, filename));
            return true;
        } catch (error) {
            logger.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Delete multiple files
     * @param {string[]} filenames - Names of files to delete
     * @returns {Promise<boolean>} Success status
     */
    async deleteFiles(filenames) {
        try {
            const fs = require('fs').promises;
            await Promise.all(
                filenames.map(filename => 
                    fs.unlink(path.join(this.uploadDir, filename))
                )
            );
            return true;
        } catch (error) {
            logger.error('Error deleting files:', error);
            return false;
        }
    }

    /**
     * Get file path
     * @param {string} filename - Name of file
     * @returns {string} Absolute file path
     */
    getFilePath(filename) {
        return path.join(this.uploadDir, filename);
    }

    /**
     * Get file URL
     * @param {string} filename - Name of file
     * @returns {string} File URL
     */
    getFileUrl(filename) {
        // This should be configured based on your application's URL structure
        return `/uploads/${filename}`;
    }

    /**
     * Check if file exists
     * @param {string} filename - Name of file
     * @returns {Promise<boolean>} Exists status
     */
    async fileExists(filename) {
        try {
            const fs = require('fs').promises;
            await fs.access(path.join(this.uploadDir, filename));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file stats
     * @param {string} filename - Name of file
     * @returns {Promise<Object>} File stats
     */
    async getFileStats(filename) {
        try {
            const fs = require('fs').promises;
            const stats = await fs.stat(path.join(this.uploadDir, filename));
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime
            };
        } catch (error) {
            logger.error('Error getting file stats:', error);
            return null;
        }
    }
}

module.exports = new FileUploader();
