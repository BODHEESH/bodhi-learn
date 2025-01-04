const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Gamification Routes
 */
router.get('/gamification/points', authMiddleware, 'GamificationController.getPoints');
router.post('/gamification/points/award', authMiddleware, 'GamificationController.awardPoints');
router.get('/gamification/badges', authMiddleware, 'GamificationController.listBadges');
router.post('/gamification/badges', authMiddleware, 'GamificationController.createBadge');
router.post('/gamification/badges/award', authMiddleware, 'GamificationController.awardBadge');
router.get('/gamification/leaderboard', authMiddleware, 'GamificationController.getLeaderboard');
router.get('/gamification/achievements', authMiddleware, 'GamificationController.getAchievements');
router.get('/gamification/progress', authMiddleware, 'GamificationController.getProgress');

/**
 * Social Learning Routes
 */
router.get('/social/posts', authMiddleware, 'SocialLearningController.listPosts');
router.post('/social/posts', authMiddleware, 'SocialLearningController.createPost');
router.put('/social/posts/:id', authMiddleware, 'SocialLearningController.updatePost');
router.delete('/social/posts/:id', authMiddleware, 'SocialLearningController.deletePost');
router.post('/social/posts/:id/like', authMiddleware, 'SocialLearningController.likePost');
router.post('/social/posts/:id/comment', authMiddleware, 'SocialLearningController.commentOnPost');
router.get('/social/feed', authMiddleware, 'SocialLearningController.getFeed');
router.get('/social/trending', authMiddleware, 'SocialLearningController.getTrending');

/**
 * Collaboration Routes
 */
router.get('/collaboration/groups', authMiddleware, 'CollaborationController.listGroups');
router.post('/collaboration/groups', authMiddleware, 'CollaborationController.createGroup');
router.put('/collaboration/groups/:id', authMiddleware, 'CollaborationController.updateGroup');
router.delete('/collaboration/groups/:id', authMiddleware, 'CollaborationController.deleteGroup');
router.post('/collaboration/groups/:id/join', authMiddleware, 'CollaborationController.joinGroup');
router.post('/collaboration/groups/:id/leave', authMiddleware, 'CollaborationController.leaveGroup');
router.get('/collaboration/projects', authMiddleware, 'CollaborationController.listProjects');
router.post('/collaboration/projects', authMiddleware, 'CollaborationController.createProject');

/**
 * Mentorship Routes
 */
router.get('/mentorship/programs', authMiddleware, 'MentorshipController.listPrograms');
router.post('/mentorship/programs', authMiddleware, 'MentorshipController.createProgram');
router.put('/mentorship/programs/:id', authMiddleware, 'MentorshipController.updateProgram');
router.get('/mentorship/mentors', authMiddleware, 'MentorshipController.listMentors');
router.post('/mentorship/mentors', authMiddleware, 'MentorshipController.registerMentor');
router.post('/mentorship/matches', authMiddleware, 'MentorshipController.createMatch');
router.get('/mentorship/sessions', authMiddleware, 'MentorshipController.listSessions');
router.post('/mentorship/feedback', authMiddleware, 'MentorshipController.submitFeedback');

/**
 * Community Routes
 */
router.get('/community/events', authMiddleware, 'CommunityController.listEvents');
router.post('/community/events', authMiddleware, 'CommunityController.createEvent');
router.put('/community/events/:id', authMiddleware, 'CommunityController.updateEvent');
router.get('/community/discussions', authMiddleware, 'CommunityController.listDiscussions');
router.post('/community/discussions', authMiddleware, 'CommunityController.createDiscussion');
router.get('/community/members', authMiddleware, 'CommunityController.listMembers');
router.get('/community/analytics', authMiddleware, 'CommunityController.getAnalytics');
router.post('/community/reports', authMiddleware, 'CommunityController.generateReport');

/**
 * Engagement Analytics Routes
 */
router.get('/analytics/engagement', authMiddleware, 'EngagementAnalyticsController.getMetrics');
router.get('/analytics/participation', authMiddleware, 'EngagementAnalyticsController.getParticipationRate');
router.get('/analytics/retention', authMiddleware, 'EngagementAnalyticsController.getRetentionMetrics');
router.get('/analytics/activity', authMiddleware, 'EngagementAnalyticsController.getActivityMetrics');
router.get('/analytics/social', authMiddleware, 'EngagementAnalyticsController.getSocialMetrics');
router.get('/analytics/reports', authMiddleware, 'EngagementAnalyticsController.generateReports');

module.exports = router;
