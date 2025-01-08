const BaseService = require('./base.service');
const { Course } = require('../models/schemas');
const { NotFoundError, ValidationError } = require('../utils/errors');
const notificationClient = require('../utils/notificationClient');
const moderationClient = require('../utils/moderationClient');
const recommendationClient = require('../utils/recommendationClient');
const config = require('../config/config');

class CourseService extends BaseService {
    constructor() {
        super(Course);
    }

    async create(data) {
        // Validate course data
        await this.validateCourseData(data);

        // Check content moderation if enabled
        if (config.features.enableModeration) {
            await this.moderateContent(data);
        }

        // Create course
        const course = await super.create(data);

        // Send notifications
        if (config.features.enableNotifications) {
            await this.notifyNewCourse(course);
        }

        // Update recommendation engine
        if (config.features.enableRecommendations) {
            await this.updateRecommendations(course);
        }

        return course;
    }

    async update(id, data) {
        const course = await this.findById(id);

        // Validate update data
        await this.validateCourseData(data, course);

        // Check content moderation for updates if enabled
        if (config.features.enableModeration) {
            await this.moderateContent(data);
        }

        // Update course
        const updatedCourse = await super.update(id, data);

        // Notify relevant users about the update
        if (config.features.enableNotifications) {
            await this.notifyUpdateCourse(updatedCourse);
        }

        // Update recommendation engine
        if (config.features.enableRecommendations) {
            await this.updateRecommendations(updatedCourse);
        }

        return updatedCourse;
    }

    async enrollStudent(courseId, studentId) {
        const course = await this.findById(courseId);

        if (course.enrolledStudents.includes(studentId)) {
            throw new ValidationError('Student already enrolled in this course');
        }

        if (course.maxStudents && course.enrolledStudents.length >= course.maxStudents) {
            throw new ValidationError('Course has reached maximum enrollment');
        }

        course.enrolledStudents.push(studentId);
        await course.save();

        // Notify course instructor and student
        if (config.features.enableNotifications) {
            await this.notifyEnrollment(course, studentId);
        }

        return course;
    }

    async unenrollStudent(courseId, studentId) {
        const course = await this.findById(courseId);
        
        const studentIndex = course.enrolledStudents.indexOf(studentId);
        if (studentIndex === -1) {
            throw new ValidationError('Student not enrolled in this course');
        }

        course.enrolledStudents.splice(studentIndex, 1);
        await course.save();

        // Notify course instructor
        if (config.features.enableNotifications) {
            await this.notifyUnenrollment(course, studentId);
        }

        return course;
    }

    async addModule(courseId, moduleData) {
        const course = await this.findById(courseId);

        // Validate module data
        if (!moduleData.title || !moduleData.description) {
            throw new ValidationError('Module must have title and description');
        }

        course.modules.push(moduleData);
        await course.save();

        // Notify enrolled students about new module
        if (config.features.enableNotifications) {
            await this.notifyNewModule(course, moduleData);
        }

        return course;
    }

    async updateModule(courseId, moduleId, moduleData) {
        const course = await this.findById(courseId);
        const module = course.modules.id(moduleId);

        if (!module) {
            throw new NotFoundError('Module not found');
        }

        Object.assign(module, moduleData);
        await course.save();

        // Notify enrolled students about module update
        if (config.features.enableNotifications) {
            await this.notifyModuleUpdate(course, module);
        }

        return course;
    }

    // Private methods
    async validateCourseData(data, existingCourse = null) {
        // Implement custom validation logic
        if (!data.title || data.title.length < 5) {
            throw new ValidationError('Course title must be at least 5 characters long');
        }

        if (!data.description || data.description.length < 20) {
            throw new ValidationError('Course description must be at least 20 characters long');
        }

        if (data.price && data.price < 0) {
            throw new ValidationError('Course price cannot be negative');
        }

        // Additional validations as needed
    }

    async moderateContent(data) {
        try {
            const moderationResult = await moderationClient.checkContent({
                title: data.title,
                description: data.description,
                content: data.content
            });

            if (!moderationResult.approved) {
                throw new ValidationError('Content violates moderation guidelines');
            }
        } catch (error) {
            this.logger.error('Content moderation failed:', error);
            throw error;
        }
    }

    async notifyNewCourse(course) {
        await notificationClient.sendNotification({
            type: 'NEW_COURSE',
            title: `New Course: ${course.title}`,
            description: course.description,
            recipients: ['ADMIN', 'INSTRUCTOR'],
            data: { courseId: course._id }
        });
    }

    async notifyUpdateCourse(course) {
        await notificationClient.sendNotification({
            type: 'COURSE_UPDATE',
            title: `Course Updated: ${course.title}`,
            description: 'Course content has been updated',
            recipients: [...course.enrolledStudents],
            data: { courseId: course._id }
        });
    }

    async notifyEnrollment(course, studentId) {
        await notificationClient.sendNotification({
            type: 'COURSE_ENROLLMENT',
            title: `New Enrollment in ${course.title}`,
            recipients: [...course.instructors, studentId],
            data: { courseId: course._id, studentId }
        });
    }

    async notifyUnenrollment(course, studentId) {
        await notificationClient.sendNotification({
            type: 'COURSE_UNENROLLMENT',
            title: `Student Unenrolled from ${course.title}`,
            recipients: course.instructors,
            data: { courseId: course._id, studentId }
        });
    }

    async notifyNewModule(course, module) {
        await notificationClient.sendNotification({
            type: 'NEW_MODULE',
            title: `New Module in ${course.title}`,
            description: module.title,
            recipients: course.enrolledStudents,
            data: { courseId: course._id, moduleId: module._id }
        });
    }

    async notifyModuleUpdate(course, module) {
        await notificationClient.sendNotification({
            type: 'MODULE_UPDATE',
            title: `Module Updated in ${course.title}`,
            description: module.title,
            recipients: course.enrolledStudents,
            data: { courseId: course._id, moduleId: module._id }
        });
    }

    async updateRecommendations(course) {
        try {
            await recommendationClient.updateCourse({
                courseId: course._id,
                title: course.title,
                description: course.description,
                tags: course.tags,
                skills: course.skills,
                level: course.level,
                rating: course.engagement.averageRating
            });
        } catch (error) {
            this.logger.error('Failed to update recommendation engine:', error);
            // Don't throw error as this is a non-critical operation
        }
    }
}

module.exports = new CourseService();
