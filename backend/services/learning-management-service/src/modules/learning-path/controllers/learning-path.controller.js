const httpStatus = require('http-status');
const LearningPathService = require('../services/learning-path.service');
const { ApiError } = require('../../../utils/errors');
const logger = require('../../../config/logger');

class LearningPathController {
    /**
     * Create Learning Path
     */
    async createLearningPath(req, res, next) {
        try {
            const path = await LearningPathService.createLearningPath({
                ...req.body,
                createdBy: req.user.id,
                organization: req.user.organizationId
            });
            res.status(httpStatus.CREATED).json({
                status: 'success',
                data: path
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Learning Path
     */
    async getLearningPath(req, res, next) {
        try {
            const path = await LearningPathService.getLearningPathById(
                req.params.pathId,
                {
                    populate: ['stages.milestones.itemId', 'createdBy'],
                    select: req.query.fields
                }
            );
            if (!path) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
            }
            res.json({
                status: 'success',
                data: path
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update Learning Path
     */
    async updateLearningPath(req, res, next) {
        try {
            const path = await LearningPathService.updateLearningPath(
                req.params.pathId,
                req.body,
                req.user.id
            );
            res.json({
                status: 'success',
                data: path
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete Learning Path
     */
    async deleteLearningPath(req, res, next) {
        try {
            await LearningPathService.deleteLearningPath(req.params.pathId);
            res.status(httpStatus.NO_CONTENT).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * List Learning Paths
     */
    async listLearningPaths(req, res, next) {
        try {
            const filter = { ...req.query };
            const options = {
                limit: parseInt(req.query.limit, 10) || 10,
                page: parseInt(req.query.page, 10) || 1,
                sortBy: req.query.sortBy || 'createdAt:desc',
                populate: ['createdBy'],
                select: req.query.fields
            };
            const paths = await LearningPathService.queryLearningPaths(filter, options);
            res.json({
                status: 'success',
                data: paths
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Enroll in Learning Path
     */
    async enrollInPath(req, res, next) {
        try {
            const enrollment = await LearningPathService.enrollUser(
                req.params.pathId,
                req.user.id,
                req.body
            );
            res.status(httpStatus.CREATED).json({
                status: 'success',
                data: enrollment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update Progress
     */
    async updateProgress(req, res, next) {
        try {
            const enrollment = await LearningPathService.updateProgress(
                req.params.enrollmentId,
                req.body
            );
            res.json({
                status: 'success',
                data: enrollment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get User Progress
     */
    async getUserProgress(req, res, next) {
        try {
            const progress = await LearningPathService.getUserProgress(
                req.params.pathId,
                req.user.id
            );
            res.json({
                status: 'success',
                data: progress
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Learning Path Analytics
     */
    async getAnalytics(req, res, next) {
        try {
            const analytics = await LearningPathService.getAnalytics(
                req.params.pathId
            );
            res.json({
                status: 'success',
                data: analytics
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Stage Details
     */
    async getStageDetails(req, res, next) {
        try {
            const path = await LearningPathService.getLearningPathById(
                req.params.pathId
            );
            if (!path) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
            }

            const stage = path.stages[req.params.stageIndex];
            if (!stage) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Stage not found');
            }

            res.json({
                status: 'success',
                data: stage
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Milestone Details
     */
    async getMilestoneDetails(req, res, next) {
        try {
            const path = await LearningPathService.getLearningPathById(
                req.params.pathId
            );
            if (!path) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
            }

            const stage = path.stages[req.params.stageIndex];
            if (!stage) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Stage not found');
            }

            const milestone = stage.milestones[req.params.milestoneIndex];
            if (!milestone) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Milestone not found');
            }

            res.json({
                status: 'success',
                data: milestone
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Prerequisites
     */
    async getPrerequisites(req, res, next) {
        try {
            const path = await LearningPathService.getLearningPathById(
                req.params.pathId
            );
            if (!path) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
            }

            const prerequisites = path.prerequisites || [];
            res.json({
                status: 'success',
                data: prerequisites
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Learning Objectives
     */
    async getLearningObjectives(req, res, next) {
        try {
            const path = await LearningPathService.getLearningPathById(
                req.params.pathId
            );
            if (!path) {
                throw new ApiError(httpStatus.NOT_FOUND, 'Learning path not found');
            }

            const objectives = path.learningObjectives || [];
            res.json({
                status: 'success',
                data: objectives
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LearningPathController();
