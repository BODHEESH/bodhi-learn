const httpStatus = require('http-status');
const Media = require('../models/media.model');
const ApiError = require('../../../utils/ApiError');
const { getPagination } = require('../../../utils/pagination');

class MediaService {
    /**
     * Create media
     * @param {Object} mediaBody
     * @returns {Promise<Media>}
     */
    async createMedia(mediaBody) {
        const media = await Media.create(mediaBody);
        
        // Start processing if auto-processing is enabled
        if (media.settings.autoProcess) {
            if (media.settings.autoProcess.thumbnails.enabled) {
                await media.generateThumbnail();
            }
            if (media.settings.autoProcess.transcription.enabled) {
                await media.transcribe();
            }
            if (media.settings.autoProcess.optimization.enabled) {
                await media.optimize();
            }
        }

        return media;
    }

    /**
     * Query for media
     * @param {Object} filter - Mongo filter
     * @param {Object} options - Query options
     * @returns {Promise<QueryResult>}
     */
    async queryMedia(filter, options) {
        const { limit, page, sortBy } = options;
        const media = await Media.find(filter)
            .sort(sortBy)
            .skip(page * limit)
            .limit(limit)
            .populate('metadata.author', 'name email')
            .populate('metadata.uploadedBy', 'name email');

        const totalResults = await Media.countDocuments(filter);
        const pagination = getPagination(page, limit, totalResults);

        return {
            results: media,
            pagination
        };
    }

    /**
     * Get media by id
     * @param {ObjectId} id
     * @returns {Promise<Media>}
     */
    async getMediaById(id) {
        const media = await Media.findById(id)
            .populate('metadata.author', 'name email')
            .populate('metadata.uploadedBy', 'name email');
        if (!media) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Media not found');
        }
        return media;
    }

    /**
     * Update media by id
     * @param {ObjectId} mediaId
     * @param {Object} updateBody
     * @returns {Promise<Media>}
     */
    async updateMedia(mediaId, updateBody) {
        const media = await this.getMediaById(mediaId);
        Object.assign(media, updateBody);
        await media.save();
        return media;
    }

    /**
     * Delete media by id
     * @param {ObjectId} mediaId
     * @returns {Promise<Media>}
     */
    async deleteMedia(mediaId) {
        const media = await this.getMediaById(mediaId);
        // TODO: Delete actual media files from storage
        await media.remove();
        return media;
    }

    /**
     * Add transcription
     * @param {ObjectId} mediaId
     * @param {Object} transcription
     * @returns {Promise<Media>}
     */
    async addTranscription(mediaId, transcription) {
        const media = await this.getMediaById(mediaId);
        media.transcriptions.push(transcription);
        await media.save();
        return media;
    }

    /**
     * Add annotation
     * @param {ObjectId} mediaId
     * @param {Object} annotation
     * @returns {Promise<Media>}
     */
    async addAnnotation(mediaId, annotation) {
        const media = await this.getMediaById(mediaId);
        media.annotations.push(annotation);
        await media.save();
        return media;
    }

    /**
     * Update annotation
     * @param {ObjectId} mediaId
     * @param {ObjectId} annotationId
     * @param {Object} annotationData
     * @returns {Promise<Media>}
     */
    async updateAnnotation(mediaId, annotationId, annotationData) {
        const media = await this.getMediaById(mediaId);
        const annotationIndex = media.annotations.findIndex(a => a._id.equals(annotationId));
        if (annotationIndex === -1) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Annotation not found');
        }
        media.annotations[annotationIndex] = {
            ...media.annotations[annotationIndex].toObject(),
            ...annotationData
        };
        await media.save();
        return media;
    }

    /**
     * Delete annotation
     * @param {ObjectId} mediaId
     * @param {ObjectId} annotationId
     * @returns {Promise<Media>}
     */
    async deleteAnnotation(mediaId, annotationId) {
        const media = await this.getMediaById(mediaId);
        const annotationIndex = media.annotations.findIndex(a => a._id.equals(annotationId));
        if (annotationIndex === -1) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Annotation not found');
        }
        media.annotations.splice(annotationIndex, 1);
        await media.save();
        return media;
    }

    /**
     * Add media version
     * @param {ObjectId} mediaId
     * @param {Object} version
     * @returns {Promise<Media>}
     */
    async addVersion(mediaId, version) {
        const media = await this.getMediaById(mediaId);
        media.versions.push(version);
        await media.save();
        return media;
    }

    /**
     * Record media view
     * @param {ObjectId} mediaId
     * @returns {Promise<Media>}
     */
    async recordView(mediaId) {
        const media = await this.getMediaById(mediaId);
        await media.incrementViews();
        return media;
    }

    /**
     * Record media download
     * @param {ObjectId} mediaId
     * @returns {Promise<Media>}
     */
    async recordDownload(mediaId) {
        const media = await this.getMediaById(mediaId);
        await media.recordDownload();
        return media;
    }

    /**
     * Update processing status
     * @param {ObjectId} mediaId
     * @param {string} status
     * @param {number} progress
     * @param {string} error
     * @returns {Promise<Media>}
     */
    async updateProcessingStatus(mediaId, status, progress = null, error = null) {
        const media = await this.getMediaById(mediaId);
        media.processing = {
            status,
            progress: progress || media.processing.progress,
            error,
            completedAt: status === 'completed' ? new Date() : media.processing.completedAt
        };
        await media.save();
        return media;
    }
}

module.exports = new MediaService();
