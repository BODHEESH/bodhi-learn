const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const fileProcessor = require('../utils/fileProcessor');
const storageManager = require('../utils/storageManager');
const config = require('../config/config');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'temp'));
    },
    filename: function (req, file, cb) {
        const uniquePrefix = uuidv4();
        cb(null, uniquePrefix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // Define allowed file types based on content type
    const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
        document: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
    };

    const contentType = req.body.type || req.query.type;
    if (!contentType || !allowedTypes[contentType]) {
        cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid content type'));
        return;
    }

    if (!allowedTypes[contentType].includes(file.mimetype)) {
        cb(new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type'));
        return;
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize
    }
});

/**
 * Process uploaded content
 */
const processContent = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const contentType = req.body.type || req.query.type;
        let processedResult;

        // Process file based on content type
        switch (contentType) {
            case 'image':
                processedResult = await fileProcessor.processImage(req.file.path, {
                    quality: req.body.quality || 'medium',
                    generateThumbnail: true
                });
                break;
            case 'video':
                processedResult = await fileProcessor.processVideo(req.file.path, {
                    quality: req.body.quality || 'medium',
                    generateThumbnail: true
                });
                break;
            case 'document':
                processedResult = await fileProcessor.processDocument(req.file.path, {
                    generatePreview: true
                });
                break;
            default:
                throw new ApiError(httpStatus.BAD_REQUEST, 'Unsupported content type');
        }

        // Upload processed files to storage
        const uploadPromises = [];

        // Upload main file
        uploadPromises.push(
            storageManager.uploadFile(processedResult.processedPath, {
                contentType: req.file.mimetype,
                metadata: {
                    originalName: req.file.originalname,
                    contentType: contentType
                }
            })
        );

        // Upload thumbnail if exists
        if (processedResult.thumbnailPath) {
            uploadPromises.push(
                storageManager.uploadFile(processedResult.thumbnailPath, {
                    key: `thumbnails/${path.basename(processedResult.thumbnailPath)}`,
                    contentType: 'image/jpeg'
                })
            );
        }

        const [mainFile, thumbnail] = await Promise.all(uploadPromises);

        // Add processed file info to request
        req.processedFile = {
            ...mainFile,
            thumbnail: thumbnail || null,
            metadata: processedResult.metadata
        };

        // Clean up temporary files
        const filesToClean = [
            req.file.path,
            processedResult.processedPath,
            processedResult.thumbnailPath
        ].filter(Boolean);
        await fileProcessor.cleanup(filesToClean);

        next();
    } catch (error) {
        // Clean up the uploaded file in case of error
        if (req.file) {
            await fileProcessor.cleanup([req.file.path]);
        }
        next(error);
    }
};

/**
 * Handle file upload for different content types
 */
const uploadContent = (field) => {
    return [upload.single(field), processContent];
};

module.exports = {
    uploadContent
};
