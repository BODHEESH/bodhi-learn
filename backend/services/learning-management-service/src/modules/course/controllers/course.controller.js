const courseService = require('../services/course.service');
const catchAsync = require('../../../utils/catchAsync');
const pick = require('../../../utils/pick');

class CourseController {
    /**
     * Create course
     * POST /api/courses
     */
    createCourse = catchAsync(async (req, res) => {
        const courseData = {
            ...req.body,
            createdBy: req.user.id,
            updatedBy: req.user.id
        };
        const course = await courseService.createCourse(courseData);
        res.status(201).json({
            status: 'success',
            data: { course }
        });
    });

    /**
     * Get course by ID
     * GET /api/courses/:courseId
     */
    getCourse = catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { organizationId, tenantId } = req.user;
        const course = await courseService.getCourseById(courseId, organizationId, tenantId);
        res.json({
            status: 'success',
            data: { course }
        });
    });

    /**
     * Update course
     * PATCH /api/courses/:courseId
     */
    updateCourse = catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { organizationId, tenantId } = req.user;
        const updateData = {
            ...req.body,
            updatedBy: req.user.id
        };
        const course = await courseService.updateCourse(courseId, updateData, organizationId, tenantId);
        res.json({
            status: 'success',
            data: { course }
        });
    });

    /**
     * Delete course
     * DELETE /api/courses/:courseId
     */
    deleteCourse = catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { organizationId, tenantId } = req.user;
        await courseService.deleteCourse(courseId, organizationId, tenantId);
        res.status(204).send();
    });

    /**
     * Get all courses with filters
     * GET /api/courses
     */
    getCourses = catchAsync(async (req, res) => {
        const filter = pick(req.query, [
            'title',
            'category',
            'instructor',
            'status',
            'enrollmentType',
            'organizationId',
            'tenantId'
        ]);

        // Add price range filter if provided
        if (req.query.minPrice !== undefined) {
            filter.price = { $gte: Number(req.query.minPrice) };
        }
        if (req.query.maxPrice !== undefined) {
            filter.price = { ...filter.price, $lte: Number(req.query.maxPrice) };
        }

        const options = pick(req.query, ['sortBy', 'limit', 'page']);
        
        const result = await courseService.queryCourses(filter, options);
        res.json({
            status: 'success',
            data: result
        });
    });

    /**
     * Get featured courses
     * GET /api/courses/featured
     */
    getFeaturedCourses = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['category', 'level', 'languages', 'price']);
        const options = pick(req.query, ['limit']);
        const courses = await courseService.getFeaturedCourses(
            filter,
            options,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { courses } });
    });

    /**
     * Get recommended courses
     * GET /api/courses/recommended
     */
    getRecommendedCourses = catchAsync(async (req, res) => {
        const filter = pick(req.query, ['category', 'level', 'languages', 'price']);
        const options = pick(req.query, ['limit']);
        const courses = await courseService.getRecommendedCourses(
            req.user.id,
            filter,
            options,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { courses } });
    });

    /**
     * Get course analytics
     * GET /api/courses/:courseId/analytics
     */
    getCourseAnalytics = catchAsync(async (req, res) => {
        const analytics = await courseService.getCourseAnalytics(
            req.params.courseId,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: analytics });
    });

    /**
     * Update course settings
     * PATCH /api/courses/:courseId/settings
     */
    updateCourseSettings = catchAsync(async (req, res) => {
        const course = await courseService.updateCourseSettings(
            req.params.courseId,
            req.body,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { course } });
    });

    /**
     * Update course resources
     * PATCH /api/courses/:courseId/resources
     */
    updateCourseResources = catchAsync(async (req, res) => {
        const course = await courseService.updateCourseResources(
            req.params.courseId,
            req.body.resources,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { course } });
    });

    /**
     * Update course FAQs
     * PATCH /api/courses/:courseId/faqs
     */
    updateCourseFAQs = catchAsync(async (req, res) => {
        const course = await courseService.updateCourseFAQs(
            req.params.courseId,
            req.body.faqs,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { course } });
    });

    /**
     * Update course schedule
     * PATCH /api/courses/:courseId/schedule
     */
    updateCourseSchedule = catchAsync(async (req, res) => {
        const course = await courseService.updateCourseSchedule(
            req.params.courseId,
            req.body,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { course } });
    });

    /**
     * Get course certificate
     * GET /api/courses/:courseId/certificate
     */
    getCourseCertificate = catchAsync(async (req, res) => {
        const certificate = await courseService.getCourseCertificate(
            req.params.courseId,
            req.user.id,
            req.user.organizationId,
            req.user.tenantId
        );
        res.send({ status: 'success', data: { certificate } });
    });
}

module.exports = new CourseController();