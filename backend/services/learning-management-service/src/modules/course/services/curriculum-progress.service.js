const httpStatus = require('http-status');
const { CurriculumProgress } = require('../models/curriculum-progress.model');
const { Curriculum } = require('../models/curriculum.model');
const ApiError = require('../../../utils/ApiError');
const { CURRICULUM_STATUS } = require('../constants/curriculum.constants');

class CurriculumProgressService {
    /**
     * Initialize progress tracking for a user
     */
    async initializeProgress(userId, curriculumId, courseId, enrollmentId, organizationId, tenantId) {
        const curriculum = await Curriculum.findOne({
            _id: curriculumId,
            organizationId,
            tenantId,
            status: CURRICULUM_STATUS.PUBLISHED
        });

        if (!curriculum) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Curriculum not found or not published');
        }

        // Create sections map
        const sections = new Map();
        curriculum.sections.forEach(section => {
            const items = new Map();
            section.items.forEach(item => {
                items.set(item._id.toString(), {
                    item: item._id,
                    status: 'not_started',
                    activityLog: []
                });
            });

            sections.set(section._id.toString(), {
                section: section._id,
                status: 'not_started',
                progress: 0,
                items
            });
        });

        const progress = await CurriculumProgress.create({
            user: userId,
            curriculum: curriculumId,
            course: courseId,
            enrollmentId,
            organizationId,
            tenantId,
            sections,
            startDate: new Date()
        });

        return progress;
    }

    /**
     * Get progress for a user
     */
    async getProgress(userId, curriculumId, organizationId, tenantId) {
        const progress = await CurriculumProgress.findOne({
            user: userId,
            curriculum: curriculumId,
            organizationId,
            tenantId
        }).populate('curriculum');

        if (!progress) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Progress not found');
        }

        return progress;
    }

    /**
     * Update item progress
     */
    async updateItemProgress(userId, curriculumId, itemId, data, organizationId, tenantId) {
        const progress = await this.getProgress(userId, curriculumId, organizationId, tenantId);

        const [sectionId, item] = progress.findItem(itemId);
        if (!item) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Item not found in curriculum');
        }

        // Update item progress
        Object.assign(item, data);
        item.lastAttemptDate = new Date();
        item.attempts += 1;

        // Log activity
        progress.logActivity(itemId, data.action || 'complete', {
            timeSpent: data.timeSpent,
            score: data.score,
            progress: data.progress
        });

        await progress.save();
        return progress;
    }

    /**
     * Add bookmark
     */
    async addBookmark(userId, curriculumId, itemId, note, organizationId, tenantId) {
        const progress = await this.getProgress(userId, curriculumId, organizationId, tenantId);

        const [, item] = progress.findItem(itemId);
        if (!item) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Item not found in curriculum');
        }

        progress.bookmarks.push({
            item: itemId,
            note,
            timestamp: new Date()
        });

        await progress.save();
        return progress;
    }

    /**
     * Add note
     */
    async addNote(userId, curriculumId, itemId, content, organizationId, tenantId) {
        const progress = await this.getProgress(userId, curriculumId, organizationId, tenantId);

        const [, item] = progress.findItem(itemId);
        if (!item) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Item not found in curriculum');
        }

        progress.notes.push({
            item: itemId,
            content,
            timestamp: new Date()
        });

        await progress.save();
        return progress;
    }

    /**
     * Get course progress statistics
     */
    async getCourseProgressStats(courseId, organizationId, tenantId) {
        const stats = await CurriculumProgress.aggregate([
            {
                $match: {
                    course: courseId,
                    organizationId,
                    tenantId
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgProgress: { $avg: '$progress' },
                    avgScore: { $avg: '$overallScore' },
                    avgTimeSpent: { $avg: '$timeSpent' }
                }
            }
        ]);

        return stats;
    }

    /**
     * Get user progress statistics
     */
    async getUserProgressStats(userId, organizationId, tenantId) {
        const stats = await CurriculumProgress.aggregate([
            {
                $match: {
                    user: userId,
                    organizationId,
                    tenantId
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgProgress: { $avg: '$progress' },
                    avgScore: { $avg: '$overallScore' },
                    avgTimeSpent: { $avg: '$timeSpent' }
                }
            }
        ]);

        return stats;
    }

    /**
     * Get organization progress statistics
     */
    async getOrganizationProgressStats(organizationId, tenantId) {
        const stats = await CurriculumProgress.aggregate([
            {
                $match: {
                    organizationId,
                    tenantId
                }
            },
            {
                $group: {
                    _id: {
                        status: '$status',
                        course: '$course'
                    },
                    count: { $sum: 1 },
                    avgProgress: { $avg: '$progress' },
                    avgScore: { $avg: '$overallScore' },
                    avgTimeSpent: { $avg: '$timeSpent' }
                }
            }
        ]);

        return stats;
    }
}

module.exports = new CurriculumProgressService();
