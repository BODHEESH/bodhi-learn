const { Course } = require('../models/course.model');
const { ERROR_MESSAGES } = require('../constants/course.constants');
const ApiError = require('../../../utils/ApiError');
const { getPagination } = require('../../../utils/pagination');
const { COURSE_STATUS } = require('../constants/course.constants');
const Enrollment = require('../models/enrollment.model');
const CurriculumProgress = require('../models/curriculum-progress.model');
const mongoose = require('mongoose');
const httpStatus = require('http-status');

class CourseService {
    /**
     * Create a new course
     * @param {Object} courseData - Course data
     * @returns {Promise<Course>}
     */
    async createCourse(courseData) {
        // Check if course with same title exists
        const existingCourse = await Course.findOne({ 
            title: courseData.title,
            organizationId: courseData.organizationId,
            tenantId: courseData.tenantId 
        });

        if (existingCourse) {
            throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_TITLE);
        }

        const course = new Course(courseData);
        return course.save();
    }

    /**
     * Get course by ID
     * @param {string} courseId - Course ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Course>}
     */
    async getCourseById(courseId, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        }).populate('instructor category prerequisites');

        if (!course) {
            throw new ApiError(404, ERROR_MESSAGES.COURSE_NOT_FOUND);
        }

        return course;
    }

    /**
     * Update course
     * @param {string} courseId - Course ID
     * @param {Object} updateData - Data to update
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Course>}
     */
    async updateCourse(courseId, updateData, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(404, ERROR_MESSAGES.COURSE_NOT_FOUND);
        }

        // Check title uniqueness if title is being updated
        if (updateData.title && updateData.title !== course.title) {
            const existingCourse = await Course.findOne({
                title: updateData.title,
                organizationId,
                tenantId,
                _id: { $ne: courseId }
            });

            if (existingCourse) {
                throw new ApiError(400, ERROR_MESSAGES.DUPLICATE_TITLE);
            }
        }

        Object.assign(course, updateData);
        return course.save();
    }

    /**
     * Delete course
     * @param {string} courseId - Course ID
     * @param {string} organizationId - Organization ID
     * @param {string} tenantId - Tenant ID
     * @returns {Promise<Course>}
     */
    async deleteCourse(courseId, organizationId, tenantId) {
        const course = await Course.findOneAndDelete({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(404, ERROR_MESSAGES.COURSE_NOT_FOUND);
        }

        return course;
    }

    /**
     * Query courses with filters and pagination
     * @param {Object} filter - Filter criteria
     * @param {Object} options - Query options
     * @returns {Promise<{courses: Course[], page: number, limit: number, totalPages: number, totalResults: number}>}
     */
    async queryCourses(filter, options) {
        const { limit, page, skip } = getPagination(options);
        const { sortBy } = options;

        const query = Course.find(filter)
            .populate('instructor category')
            .sort(sortBy)
            .skip(skip)
            .limit(limit);

        const [courses, totalResults] = await Promise.all([
            query.exec(),
            Course.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalResults / limit);

        return {
            courses,
            page,
            limit,
            totalPages,
            totalResults
        };
    }

    // Get featured courses
    async getFeaturedCourses(filter, options, organizationId, tenantId) {
        const courses = await Course.find({
            ...filter,
            organizationId,
            tenantId,
            status: COURSE_STATUS.PUBLISHED
        })
            .sort({ 'stats.totalEnrollments': -1, 'rating.averageScore': -1 })
            .limit(options.limit || 10)
            .populate('instructor', 'name email')
            .populate('category', 'name')
            .populate('curriculum');
        return courses;
    }

    // Get recommended courses for a user
    async getRecommendedCourses(userId, filter, options, organizationId, tenantId) {
        // Get user's enrolled courses and their categories
        const enrollments = await Enrollment.find({ user: userId });
        const enrolledCourseIds = enrollments.map(e => e.course);
        
        const enrolledCourses = await Course.find({
            _id: { $in: enrolledCourseIds }
        });
        
        const categoryIds = [...new Set(enrolledCourses.map(c => c.category))];
        const skillTags = [...new Set(enrolledCourses.flatMap(c => c.skills || []))];
        
        // Find similar courses
        const courses = await Course.find({
            ...filter,
            organizationId,
            tenantId,
            status: COURSE_STATUS.PUBLISHED,
            _id: { $nin: enrolledCourseIds },
            $or: [
                { category: { $in: categoryIds } },
                { skills: { $in: skillTags } }
            ]
        })
            .sort({ 'rating.averageScore': -1 })
            .limit(options.limit || 10)
            .populate('instructor', 'name email')
            .populate('category', 'name')
            .populate('curriculum');
        
        return courses;
    }

    // Get course analytics
    async getCourseAnalytics(courseId, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        // Get enrollment trends
        const enrollmentTrends = await Enrollment.aggregate([
            {
                $match: {
                    course: course._id
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Get completion rates
        const completionStats = await CurriculumProgress.aggregate([
            {
                $match: {
                    course: course._id
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgProgress: { $avg: '$progress' },
                    avgTimeSpent: { $avg: '$timeSpent' }
                }
            }
        ]);

        // Get revenue trends
        const revenueTrends = await Enrollment.aggregate([
            {
                $match: {
                    course: course._id,
                    amountPaid: { $gt: 0 }
                }
            },
            {
                $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$amountPaid' }
            }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        return {
            enrollmentTrends,
            completionStats,
            revenueTrends
        };
    }

    // Update course settings
    async updateCourseSettings(courseId, settings, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        Object.assign(course.settings, settings);
        await course.save();

        return course;
    }

    // Add or update course resources
    async updateCourseResources(courseId, resources, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        course.resources = resources;
        await course.save();

        return course;
    }

    // Add or update course FAQs
    async updateCourseFAQs(courseId, faqs, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        course.faqs = faqs;
        await course.save();

        return course;
    }

    // Update course schedule
    async updateCourseSchedule(courseId, schedule, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        Object.assign(course.schedule, schedule);
        await course.save();

        return course;
    }

    // Get course certificate template
    async getCourseCertificate(courseId, userId, organizationId, tenantId) {
        const course = await Course.findOne({
            _id: courseId,
            organizationId,
            tenantId
        });

        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
        }

        if (!course.certification.enabled) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Course certificates are not enabled');
        }

        const progress = await CurriculumProgress.findOne({
            course: courseId,
            user: userId,
            status: 'completed'
        });

        if (!progress) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Course not completed');
        }

        // TODO: Generate certificate using template
        return {
            certificateId: new mongoose.Types.ObjectId(),
            courseTitle: course.title,
            userName: progress.user.name,
            completionDate: progress.completionDate,
            validUntil: course.certification.validityPeriod ? 
                new Date(progress.completionDate.getTime() + course.certification.validityPeriod * 30 * 24 * 60 * 60 * 1000) : 
                null
        };
    }
}

module.exports = new CourseService();