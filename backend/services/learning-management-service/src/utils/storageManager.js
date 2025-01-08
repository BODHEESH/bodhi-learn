const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Storage } = require('@google-cloud/storage');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');
const ApiError = require('./ApiError');
const httpStatus = require('http-status');

class StorageManager {
    constructor() {
        this.initializeProviders();
    }

    /**
     * Initialize storage providers
     */
    initializeProviders() {
        // Initialize AWS S3
        if (config.aws && config.aws.enabled) {
            this.s3Client = new S3Client({
                region: config.aws.region,
                credentials: {
                    accessKeyId: config.aws.accessKeyId,
                    secretAccessKey: config.aws.secretAccessKey
                }
            });
        }

        // Initialize Google Cloud Storage
        if (config.gcp && config.gcp.enabled) {
            this.gcsClient = new Storage({
                projectId: config.gcp.projectId,
                keyFilename: config.gcp.keyFilePath
            });
        }

        // Initialize Azure Blob Storage
        if (config.azure && config.azure.enabled) {
            this.azureClient = BlobServiceClient.fromConnectionString(
                config.azure.connectionString
            );
        }
    }

    /**
     * Upload file to storage
     * @param {string} filePath
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async uploadFile(filePath, options = {}) {
        const {
            provider = config.storage.defaultProvider,
            bucket = config.storage.defaultBucket,
            key = path.basename(filePath),
            contentType,
            metadata = {},
            isPublic = false
        } = options;

        try {
            switch (provider) {
                case 's3':
                    return await this.uploadToS3(filePath, bucket, key, contentType, metadata, isPublic);
                case 'gcs':
                    return await this.uploadToGCS(filePath, bucket, key, contentType, metadata, isPublic);
                case 'azure':
                    return await this.uploadToAzure(filePath, bucket, key, contentType, metadata, isPublic);
                case 'local':
                    return await this.uploadToLocal(filePath, key);
                default:
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid storage provider');
            }
        } catch (error) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `File upload failed: ${error.message}`
            );
        }
    }

    /**
     * Upload file to AWS S3
     * @param {string} filePath
     * @param {string} bucket
     * @param {string} key
     * @param {string} contentType
     * @param {Object} metadata
     * @param {boolean} isPublic
     * @returns {Promise<Object>}
     */
    async uploadToS3(filePath, bucket, key, contentType, metadata, isPublic) {
        const fileContent = await fs.readFile(filePath);
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
            Metadata: metadata,
            ACL: isPublic ? 'public-read' : 'private'
        });

        await this.s3Client.send(command);
        return {
            provider: 's3',
            bucket,
            key,
            url: `https://${bucket}.s3.amazonaws.com/${key}`
        };
    }

    /**
     * Upload file to Google Cloud Storage
     * @param {string} filePath
     * @param {string} bucket
     * @param {string} key
     * @param {string} contentType
     * @param {Object} metadata
     * @param {boolean} isPublic
     * @returns {Promise<Object>}
     */
    async uploadToGCS(filePath, bucket, key, contentType, metadata, isPublic) {
        const bucketObj = this.gcsClient.bucket(bucket);
        const file = bucketObj.file(key);

        await file.save(await fs.readFile(filePath), {
            contentType,
            metadata,
            public: isPublic
        });

        return {
            provider: 'gcs',
            bucket,
            key,
            url: `https://storage.googleapis.com/${bucket}/${key}`
        };
    }

    /**
     * Upload file to Azure Blob Storage
     * @param {string} filePath
     * @param {string} container
     * @param {string} blobName
     * @param {string} contentType
     * @param {Object} metadata
     * @param {boolean} isPublic
     * @returns {Promise<Object>}
     */
    async uploadToAzure(filePath, container, blobName, contentType, metadata, isPublic) {
        const containerClient = this.azureClient.getContainerClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadFile(filePath, {
            blobHTTPHeaders: {
                blobContentType: contentType
            },
            metadata
        });

        if (isPublic) {
            await containerClient.setAccessPolicy('blob');
        }

        return {
            provider: 'azure',
            container,
            blobName,
            url: blockBlobClient.url
        };
    }

    /**
     * Upload file to local storage
     * @param {string} filePath
     * @param {string} key
     * @returns {Promise<Object>}
     */
    async uploadToLocal(filePath, key) {
        const uploadDir = path.join(process.cwd(), 'uploads');
        const targetPath = path.join(uploadDir, key);

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.copyFile(filePath, targetPath);

        return {
            provider: 'local',
            path: targetPath,
            key,
            url: `/uploads/${key}`
        };
    }

    /**
     * Delete file from storage
     * @param {Object} fileInfo
     * @returns {Promise<void>}
     */
    async deleteFile(fileInfo) {
        const { provider, bucket, key } = fileInfo;

        try {
            switch (provider) {
                case 's3':
                    await this.s3Client.send(
                        new DeleteObjectCommand({
                            Bucket: bucket,
                            Key: key
                        })
                    );
                    break;
                case 'gcs':
                    await this.gcsClient.bucket(bucket).file(key).delete();
                    break;
                case 'azure':
                    const containerClient = this.azureClient.getContainerClient(bucket);
                    await containerClient.deleteBlob(key);
                    break;
                case 'local':
                    await fs.unlink(path.join(process.cwd(), 'uploads', key));
                    break;
                default:
                    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid storage provider');
            }
        } catch (error) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `File deletion failed: ${error.message}`
            );
        }
    }
}

module.exports = new StorageManager();
