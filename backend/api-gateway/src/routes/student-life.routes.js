const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Student Profile Routes
 */
router.get('/profiles', authMiddleware, 'StudentProfileController.list');
router.get('/profiles/:id', authMiddleware, 'StudentProfileController.get');
router.post('/profiles', authMiddleware, 'StudentProfileController.create');
router.put('/profiles/:id', authMiddleware, 'StudentProfileController.update');
router.get('/profiles/:id/academic-history', authMiddleware, 'StudentProfileController.getAcademicHistory');
router.get('/profiles/:id/achievements', authMiddleware, 'StudentProfileController.getAchievements');

/**
 * Activities Routes
 */
router.get('/activities', authMiddleware, 'ActivityController.list');
router.get('/activities/:id', authMiddleware, 'ActivityController.get');
router.post('/activities', authMiddleware, 'ActivityController.create');
router.put('/activities/:id', authMiddleware, 'ActivityController.update');
router.delete('/activities/:id', authMiddleware, 'ActivityController.delete');
router.post('/activities/:id/enroll', authMiddleware, 'ActivityController.enroll');
router.get('/activities/:id/participants', authMiddleware, 'ActivityController.getParticipants');

/**
 * Clubs Routes
 */
router.get('/clubs', authMiddleware, 'ClubController.list');
router.get('/clubs/:id', authMiddleware, 'ClubController.get');
router.post('/clubs', authMiddleware, 'ClubController.create');
router.put('/clubs/:id', authMiddleware, 'ClubController.update');
router.delete('/clubs/:id', authMiddleware, 'ClubController.delete');
router.post('/clubs/:id/join', authMiddleware, 'ClubController.join');
router.post('/clubs/:id/leave', authMiddleware, 'ClubController.leave');
router.get('/clubs/:id/members', authMiddleware, 'ClubController.getMembers');

/**
 * Events Routes
 */
router.get('/events', authMiddleware, 'EventController.list');
router.get('/events/:id', authMiddleware, 'EventController.get');
router.post('/events', authMiddleware, 'EventController.create');
router.put('/events/:id', authMiddleware, 'EventController.update');
router.delete('/events/:id', authMiddleware, 'EventController.delete');
router.post('/events/:id/register', authMiddleware, 'EventController.register');
router.get('/events/:id/attendees', authMiddleware, 'EventController.getAttendees');

/**
 * Counseling Routes
 */
router.get('/counseling/sessions', authMiddleware, 'CounselingController.listSessions');
router.get('/counseling/sessions/:id', authMiddleware, 'CounselingController.getSession');
router.post('/counseling/sessions', authMiddleware, 'CounselingController.bookSession');
router.put('/counseling/sessions/:id', authMiddleware, 'CounselingController.updateSession');
router.delete('/counseling/sessions/:id', authMiddleware, 'CounselingController.cancelSession');
router.get('/counseling/counselors', authMiddleware, 'CounselingController.listCounselors');

/**
 * Career Services Routes
 */
router.get('/careers/opportunities', authMiddleware, 'CareerController.listOpportunities');
router.get('/careers/opportunities/:id', authMiddleware, 'CareerController.getOpportunity');
router.post('/careers/opportunities', authMiddleware, 'CareerController.createOpportunity');
router.put('/careers/opportunities/:id', authMiddleware, 'CareerController.updateOpportunity');
router.get('/careers/workshops', authMiddleware, 'CareerController.listWorkshops');
router.post('/careers/workshops/:id/register', authMiddleware, 'CareerController.registerForWorkshop');

/**
 * Housing Routes
 */
router.get('/housing/accommodations', authMiddleware, 'HousingController.listAccommodations');
router.get('/housing/accommodations/:id', authMiddleware, 'HousingController.getAccommodation');
router.post('/housing/applications', authMiddleware, 'HousingController.applyForHousing');
router.get('/housing/applications/:id', authMiddleware, 'HousingController.getApplication');
router.put('/housing/applications/:id', authMiddleware, 'HousingController.updateApplication');
router.get('/housing/rooms', authMiddleware, 'HousingController.listAvailableRooms');

module.exports = router;
