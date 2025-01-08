const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const httpStatus = require('http-status');
const { CurriculumProgress } = require('../models/curriculum-progress.model');
const { Curriculum } = require('../models/curriculum.model');
const curriculumProgressService = require('../services/curriculum-progress.service');
const ApiError = require('../../../utils/ApiError');
const { setupTestDB } = require('../../../../tests/utils/setupTestDB');
const { userOne, insertUsers } = require('../../../../tests/fixtures/user.fixture');
const { courseOne, insertCourses } = require('../../../../tests/fixtures/course.fixture');

setupTestDB();

describe('Curriculum Progress', () => {
    let mongod;
    let curriculum;
    let progress;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongod.stop();
    });

    beforeEach(async () => {
        await insertUsers([userOne]);
        await insertCourses([courseOne]);

        // Create test curriculum
        curriculum = await Curriculum.create({
            course: courseOne._id,
            title: 'Test Curriculum',
            sections: [
                {
                    title: 'Section 1',
                    items: [
                        {
                            title: 'Item 1',
                            type: 'video',
                            contentId: new mongoose.Types.ObjectId(),
                            duration: 30
                        },
                        {
                            title: 'Item 2',
                            type: 'quiz',
                            contentId: new mongoose.Types.ObjectId(),
                            duration: 20
                        }
                    ]
                }
            ],
            organizationId: userOne.organizationId,
            tenantId: userOne.tenantId,
            status: 'published'
        });
    });

    describe('Initialize Progress', () => {
        test('should initialize progress correctly', async () => {
            progress = await curriculumProgressService.initializeProgress(
                userOne._id,
                curriculum._id,
                courseOne._id,
                new mongoose.Types.ObjectId(),
                userOne.organizationId,
                userOne.tenantId
            );

            expect(progress).toBeDefined();
            expect(progress.user).toEqual(userOne._id);
            expect(progress.curriculum).toEqual(curriculum._id);
            expect(progress.status).toBe('not_started');
            expect(progress.progress).toBe(0);
            expect(progress.sections.size).toBe(1);
        });

        test('should throw error if curriculum not found', async () => {
            await expect(
                curriculumProgressService.initializeProgress(
                    userOne._id,
                    new mongoose.Types.ObjectId(),
                    courseOne._id,
                    new mongoose.Types.ObjectId(),
                    userOne.organizationId,
                    userOne.tenantId
                )
            ).rejects.toThrow(ApiError);
        });
    });

    describe('Update Item Progress', () => {
        beforeEach(async () => {
            progress = await curriculumProgressService.initializeProgress(
                userOne._id,
                curriculum._id,
                courseOne._id,
                new mongoose.Types.ObjectId(),
                userOne.organizationId,
                userOne.tenantId
            );
        });

        test('should update item progress correctly', async () => {
            const itemId = curriculum.sections[0].items[0]._id;
            const updateData = {
                status: 'completed',
                score: 90,
                timeSpent: 25,
                progress: 100
            };

            const updatedProgress = await curriculumProgressService.updateItemProgress(
                userOne._id,
                curriculum._id,
                itemId,
                updateData,
                userOne.organizationId,
                userOne.tenantId
            );

            const [, item] = updatedProgress.findItem(itemId);
            expect(item.status).toBe('completed');
            expect(item.score).toBe(90);
            expect(item.timeSpent).toBe(25);
            expect(item.progress).toBe(100);
            expect(item.activityLog).toHaveLength(1);
        });

        test('should update section progress when item completed', async () => {
            const itemId = curriculum.sections[0].items[0]._id;
            await curriculumProgressService.updateItemProgress(
                userOne._id,
                curriculum._id,
                itemId,
                {
                    status: 'completed',
                    progress: 100
                },
                userOne.organizationId,
                userOne.tenantId
            );

            const updatedProgress = await CurriculumProgress.findById(progress._id);
            const section = updatedProgress.sections.get(curriculum.sections[0]._id.toString());
            expect(section.progress).toBe(50); // 1 of 2 items completed
            expect(section.status).toBe('in_progress');
        });
    });

    describe('Bookmarks and Notes', () => {
        beforeEach(async () => {
            progress = await curriculumProgressService.initializeProgress(
                userOne._id,
                curriculum._id,
                courseOne._id,
                new mongoose.Types.ObjectId(),
                userOne.organizationId,
                userOne.tenantId
            );
        });

        test('should add bookmark correctly', async () => {
            const itemId = curriculum.sections[0].items[0]._id;
            const note = 'Important concept';

            const updatedProgress = await curriculumProgressService.addBookmark(
                userOne._id,
                curriculum._id,
                itemId,
                note,
                userOne.organizationId,
                userOne.tenantId
            );

            expect(updatedProgress.bookmarks).toHaveLength(1);
            expect(updatedProgress.bookmarks[0].item).toEqual(itemId);
            expect(updatedProgress.bookmarks[0].note).toBe(note);
        });

        test('should add note correctly', async () => {
            const itemId = curriculum.sections[0].items[0]._id;
            const content = 'My study notes';

            const updatedProgress = await curriculumProgressService.addNote(
                userOne._id,
                curriculum._id,
                itemId,
                content,
                userOne.organizationId,
                userOne.tenantId
            );

            expect(updatedProgress.notes).toHaveLength(1);
            expect(updatedProgress.notes[0].item).toEqual(itemId);
            expect(updatedProgress.notes[0].content).toBe(content);
        });
    });

    describe('Progress Statistics', () => {
        beforeEach(async () => {
            // Create multiple progress records
            await Promise.all([
                curriculumProgressService.initializeProgress(
                    userOne._id,
                    curriculum._id,
                    courseOne._id,
                    new mongoose.Types.ObjectId(),
                    userOne.organizationId,
                    userOne.tenantId
                ),
                curriculumProgressService.initializeProgress(
                    new mongoose.Types.ObjectId(),
                    curriculum._id,
                    courseOne._id,
                    new mongoose.Types.ObjectId(),
                    userOne.organizationId,
                    userOne.tenantId
                )
            ]);
        });

        test('should get course progress statistics', async () => {
            const stats = await curriculumProgressService.getCourseProgressStats(
                courseOne._id,
                userOne.organizationId,
                userOne.tenantId
            );

            expect(stats).toBeDefined();
            expect(stats.length).toBeGreaterThan(0);
            expect(stats[0]).toHaveProperty('count');
            expect(stats[0]).toHaveProperty('avgProgress');
        });

        test('should get user progress statistics', async () => {
            const stats = await curriculumProgressService.getUserProgressStats(
                userOne._id,
                userOne.organizationId,
                userOne.tenantId
            );

            expect(stats).toBeDefined();
            expect(stats.length).toBeGreaterThan(0);
            expect(stats[0]).toHaveProperty('count');
            expect(stats[0]).toHaveProperty('avgProgress');
        });
    });
});
