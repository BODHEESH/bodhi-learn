const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Notification Routes
 */
router.get('/notifications', authMiddleware, 'NotificationController.list');
router.get('/notifications/:id', authMiddleware, 'NotificationController.get');
router.post('/notifications', authMiddleware, 'NotificationController.create');
router.put('/notifications/:id', authMiddleware, 'NotificationController.update');
router.delete('/notifications/:id', authMiddleware, 'NotificationController.delete');
router.post('/notifications/send', authMiddleware, 'NotificationController.send');
router.put('/notifications/:id/read', authMiddleware, 'NotificationController.markAsRead');

/**
 * Email Routes
 */
router.post('/email/send', authMiddleware, 'EmailController.send');
router.get('/email/templates', authMiddleware, 'EmailController.listTemplates');
router.post('/email/templates', authMiddleware, 'EmailController.createTemplate');
router.put('/email/templates/:id', authMiddleware, 'EmailController.updateTemplate');
router.get('/email/logs', authMiddleware, 'EmailController.getLogs');

/**
 * SMS Routes
 */
router.post('/sms/send', authMiddleware, 'SMSController.send');
router.get('/sms/templates', authMiddleware, 'SMSController.listTemplates');
router.post('/sms/templates', authMiddleware, 'SMSController.createTemplate');
router.get('/sms/logs', authMiddleware, 'SMSController.getLogs');

/**
 * Chat Routes
 */
router.get('/chats', authMiddleware, 'ChatController.list');
router.get('/chats/:id', authMiddleware, 'ChatController.get');
router.post('/chats', authMiddleware, 'ChatController.create');
router.post('/chats/:id/messages', authMiddleware, 'ChatController.sendMessage');
router.get('/chats/:id/messages', authMiddleware, 'ChatController.getMessages');
router.put('/chats/:id/status', authMiddleware, 'ChatController.updateStatus');

/**
 * Announcement Routes
 */
router.get('/announcements', authMiddleware, 'AnnouncementController.list');
router.get('/announcements/:id', authMiddleware, 'AnnouncementController.get');
router.post('/announcements', authMiddleware, 'AnnouncementController.create');
router.put('/announcements/:id', authMiddleware, 'AnnouncementController.update');
router.delete('/announcements/:id', authMiddleware, 'AnnouncementController.delete');
router.post('/announcements/:id/publish', authMiddleware, 'AnnouncementController.publish');

/**
 * Discussion Forum Routes
 */
router.get('/forums', authMiddleware, 'ForumController.list');
router.get('/forums/:id', authMiddleware, 'ForumController.get');
router.post('/forums', authMiddleware, 'ForumController.create');
router.put('/forums/:id', authMiddleware, 'ForumController.update');
router.delete('/forums/:id', authMiddleware, 'ForumController.delete');
router.get('/forums/:id/topics', authMiddleware, 'ForumController.getTopics');
router.post('/forums/:id/topics', authMiddleware, 'ForumController.createTopic');
router.post('/forums/topics/:id/replies', authMiddleware, 'ForumController.createReply');

/**
 * Feedback Routes
 */
router.get('/feedback', authMiddleware, 'FeedbackController.list');
router.get('/feedback/:id', authMiddleware, 'FeedbackController.get');
router.post('/feedback', authMiddleware, 'FeedbackController.create');
router.put('/feedback/:id', authMiddleware, 'FeedbackController.update');
router.get('/feedback/analytics', authMiddleware, 'FeedbackController.getAnalytics');
router.post('/feedback/:id/respond', authMiddleware, 'FeedbackController.respond');

module.exports = router;
