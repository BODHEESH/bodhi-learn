const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const ApiError = require('./ApiError');
const httpStatus = require('http-status');

class FileProcessor {
    /**
     * Process video file
     * @param {string} inputPath
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async processVideo(inputPath, options = {}) {
        const {
            generateThumbnail = true,
            thumbnailTime = '00:00:01',
            quality = 'medium',
            format = 'mp4'
        } = options;

        const outputPath = path.join(path.dirname(inputPath), `${uuidv4()}.${format}`);
        const thumbnailPath = generateThumbnail
            ? path.join(path.dirname(inputPath), `${uuidv4()}.jpg`)
            : null;

        try {
            // Get video metadata
            const metadata = await this.getVideoMetadata(inputPath);

            // Process video
            const command = ffmpeg(inputPath);
            
            // Set quality presets
            switch (quality) {
                case 'high':
                    command.videoBitrate(5000);
                    break;
                case 'medium':
                    command.videoBitrate(2500);
                    break;
                case 'low':
                    command.videoBitrate(1000);
                    break;
            }

            // Generate thumbnail if requested
            if (generateThumbnail) {
                await this.generateVideoThumbnail(inputPath, thumbnailPath, thumbnailTime);
            }

            // Process the video
            await new Promise((resolve, reject) => {
                command
                    .output(outputPath)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            return {
                processedPath: outputPath,
                thumbnailPath,
                metadata
            };
        } catch (error) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Video processing failed: ${error.message}`);
        }
    }

    /**
     * Process image file
     * @param {string} inputPath
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async processImage(inputPath, options = {}) {
        const {
            width,
            height,
            quality = 80,
            format = 'jpeg',
            generateThumbnail = true,
            thumbnailWidth = 200
        } = options;

        const outputPath = path.join(path.dirname(inputPath), `${uuidv4()}.${format}`);
        const thumbnailPath = generateThumbnail
            ? path.join(path.dirname(inputPath), `${uuidv4()}_thumb.${format}`)
            : null;

        try {
            // Get image metadata
            const metadata = await sharp(inputPath).metadata();

            // Process main image
            let processor = sharp(inputPath);
            if (width || height) {
                processor = processor.resize(width, height);
            }
            await processor
                .toFormat(format, { quality })
                .toFile(outputPath);

            // Generate thumbnail if requested
            if (generateThumbnail) {
                await sharp(inputPath)
                    .resize(thumbnailWidth)
                    .toFormat(format, { quality })
                    .toFile(thumbnailPath);
            }

            return {
                processedPath: outputPath,
                thumbnailPath,
                metadata
            };
        } catch (error) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Image processing failed: ${error.message}`);
        }
    }

    /**
     * Process document file
     * @param {string} inputPath
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async processDocument(inputPath, options = {}) {
        const {
            generatePreview = true,
            format = 'pdf'
        } = options;

        // TODO: Implement document processing logic
        // This could include:
        // - Converting to PDF
        // - Generating preview images
        // - Extracting text content
        // - Creating thumbnails

        return {
            processedPath: inputPath,
            previewPath: null,
            metadata: {}
        };
    }

    /**
     * Get video metadata
     * @param {string} filePath
     * @returns {Promise<Object>}
     */
    async getVideoMetadata(filePath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) reject(err);
                resolve(metadata);
            });
        });
    }

    /**
     * Generate video thumbnail
     * @param {string} inputPath
     * @param {string} outputPath
     * @param {string} thumbnailTime
     * @returns {Promise<void>}
     */
    async generateVideoThumbnail(inputPath, outputPath, thumbnailTime) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .screenshots({
                    timestamps: [thumbnailTime],
                    filename: path.basename(outputPath),
                    folder: path.dirname(outputPath)
                })
                .on('end', resolve)
                .on('error', reject);
        });
    }

    /**
     * Clean up temporary files
     * @param {string[]} filePaths
     * @returns {Promise<void>}
     */
    async cleanup(filePaths) {
        await Promise.all(
            filePaths.map(async (filePath) => {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.error(`Failed to delete file ${filePath}:`, error);
                }
            })
        );
    }
}

module.exports = new FileProcessor();
