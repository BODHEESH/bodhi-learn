const courseService = require('../services/course.service');
const courseWorkflow = require('../utils/courseWorkflow');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class CourseController {
    /**
     * Course Management
     */
    async createCourse(req, res, next) {
        try {
            const course = await courseService.createCourseWorkflow(req.body, req.user.id);
            res.status(201).json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourse(req, res, next) {
        try {
            const course = await courseService.findById(req.params.courseId);
            if (!course) {
                throw new NotFoundError('Course not found');
            }

            res.json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    async getCourses(req, res, next) {
        try {
            const courses = await courseService.findByFilters(req.query);
            res.json({
                status: 'success',
                data: courses
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Version Management
     */
    async createVersion(req, res, next) {
        try {
            const version = await courseService.createVersion(
                req.params.courseId,
                req.body
            );
            res.status(201).json({
                status: 'success',
                data: version
            });
        } catch (error) {
            next(error);
        }
    }

    async publishVersion(req, res, next) {
        try {
            const course = await courseService.publishVersion(
                req.params.courseId,
                req.params.version
            );
            res.json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    async getVersionHistory(req, res, next) {
        try {
            const history = await courseService.getVersionHistory(req.params.courseId);
            res.json({
                status: 'success',
                data: history
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Template Management
     */
    async createTemplate(req, res, next) {
        try {
            const template = await courseService.createTemplate(req.body);
            res.status(201).json({
                status: 'success',
                data: template
            });
        } catch (error) {
            next(error);
        }
    }

    async getTemplates(req, res, next) {
        try {
            const templates = await courseService.getTemplates(req.query);
            res.json({
                status: 'success',
                data: templates
            });
        } catch (error) {
            next(error);
        }
    }

    async createFromTemplate(req, res, next) {
        try {
            const course = await courseService.createFromTemplate(
                req.params.templateId,
                req.body
            );
            res.status(201).json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Workflow Management
     */
    async updateWorkflowStage(req, res, next) {
        try {
            const course = await courseService.findById(req.params.courseId);
            if (!course) {
                throw new NotFoundError('Course not found');
            }

            await courseWorkflow.handleStageTransition({
                course,
                fromStage: course.workflow.currentStage,
                toStage: req.body.stage,
                userId: req.user.id
            });

            res.json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    async addWorkflowComment(req, res, next) {
        try {
            const course = await courseService.addWorkflowComment(
                req.params.courseId,
                req.body.stage,
                req.user.id,
                req.body.comment
            );
            res.json({
                status: 'success',
                data: course
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Analytics
     */
    async getCourseAnalytics(req, res, next) {
        try {
            const analytics = await courseService.getAnalytics(
                req.params.courseId,
                req.query.period
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
     * Related Courses
     */
    async getRelatedCourses(req, res, next) {
        try {
            const courses = await courseService.getRelatedCourses(
                req.params.courseId,
                req.query.limit
            );
            res.json({
                status: 'success',
                data: courses
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CourseController();
