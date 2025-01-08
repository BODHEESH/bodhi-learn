const httpStatus = require('http-status');
const catchAsync = require('../../../utils/catchAsync');
const curriculumProgressService = require('../services/curriculum-progress.service');
const ApiError = require('../../../utils/ApiError');

const initializeProgress = catchAsync(async (req, res) => {
    const { curriculumId, courseId, enrollmentId } = req.body;
    const progress = await curriculumProgressService.initializeProgress(
        req.user.id,
        curriculumId,
        courseId,
        enrollmentId,
        req.user.organizationId,
        req.user.tenantId
    );
    res.status(httpStatus.CREATED).send({ status: 'success', data: { progress } });
});

const getProgress = catchAsync(async (req, res) => {
    const progress = await curriculumProgressService.getProgress(
        req.user.id,
        req.params.curriculumId,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { progress } });
});

const updateItemProgress = catchAsync(async (req, res) => {
    const progress = await curriculumProgressService.updateItemProgress(
        req.user.id,
        req.params.curriculumId,
        req.params.itemId,
        req.body,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { progress } });
});

const addBookmark = catchAsync(async (req, res) => {
    const { note } = req.body;
    const progress = await curriculumProgressService.addBookmark(
        req.user.id,
        req.params.curriculumId,
        req.params.itemId,
        note,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { progress } });
});

const addNote = catchAsync(async (req, res) => {
    const { content } = req.body;
    const progress = await curriculumProgressService.addNote(
        req.user.id,
        req.params.curriculumId,
        req.params.itemId,
        content,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { progress } });
});

const getUserProgressStats = catchAsync(async (req, res) => {
    const stats = await curriculumProgressService.getUserProgressStats(
        req.user.id,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { stats } });
});

const getCourseProgressStats = catchAsync(async (req, res) => {
    const stats = await curriculumProgressService.getCourseProgressStats(
        req.params.courseId,
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { stats } });
});

const getOrganizationProgressStats = catchAsync(async (req, res) => {
    if (!req.user.isAdmin) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Not authorized to access organization stats');
    }
    const stats = await curriculumProgressService.getOrganizationProgressStats(
        req.user.organizationId,
        req.user.tenantId
    );
    res.send({ status: 'success', data: { stats } });
});

module.exports = {
    initializeProgress,
    getProgress,
    updateItemProgress,
    addBookmark,
    addNote,
    getUserProgressStats,
    getCourseProgressStats,
    getOrganizationProgressStats
};
