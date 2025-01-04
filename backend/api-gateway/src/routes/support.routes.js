const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Helpdesk Routes
 */
router.get('/helpdesk/tickets', authMiddleware, 'HelpdeskController.listTickets');
router.get('/helpdesk/tickets/:id', authMiddleware, 'HelpdeskController.getTicket');
router.post('/helpdesk/tickets', authMiddleware, 'HelpdeskController.createTicket');
router.put('/helpdesk/tickets/:id', authMiddleware, 'HelpdeskController.updateTicket');
router.delete('/helpdesk/tickets/:id', authMiddleware, 'HelpdeskController.deleteTicket');
router.post('/helpdesk/tickets/:id/assign', authMiddleware, 'HelpdeskController.assignTicket');
router.post('/helpdesk/tickets/:id/close', authMiddleware, 'HelpdeskController.closeTicket');
router.get('/helpdesk/tickets/:id/history', authMiddleware, 'HelpdeskController.getTicketHistory');

/**
 * Ticket Management Routes
 */
router.get('/tickets/categories', authMiddleware, 'TicketController.listCategories');
router.post('/tickets/categories', authMiddleware, 'TicketController.createCategory');
router.get('/tickets/priority', authMiddleware, 'TicketController.listPriorities');
router.get('/tickets/status', authMiddleware, 'TicketController.listStatuses');
router.get('/tickets/reports', authMiddleware, 'TicketController.generateReports');
router.get('/tickets/sla', authMiddleware, 'TicketController.getSLAMetrics');
router.post('/tickets/:id/escalate', authMiddleware, 'TicketController.escalateTicket');

/**
 * FAQ Routes
 */
router.get('/faq/categories', authMiddleware, 'FAQController.listCategories');
router.get('/faq/articles', authMiddleware, 'FAQController.listArticles');
router.get('/faq/articles/:id', authMiddleware, 'FAQController.getArticle');
router.post('/faq/articles', authMiddleware, 'FAQController.createArticle');
router.put('/faq/articles/:id', authMiddleware, 'FAQController.updateArticle');
router.delete('/faq/articles/:id', authMiddleware, 'FAQController.deleteArticle');
router.get('/faq/search', authMiddleware, 'FAQController.searchArticles');
router.post('/faq/articles/:id/feedback', authMiddleware, 'FAQController.submitFeedback');

/**
 * Knowledge Base Routes
 */
router.get('/kb/articles', authMiddleware, 'KnowledgeBaseController.listArticles');
router.get('/kb/articles/:id', authMiddleware, 'KnowledgeBaseController.getArticle');
router.post('/kb/articles', authMiddleware, 'KnowledgeBaseController.createArticle');
router.put('/kb/articles/:id', authMiddleware, 'KnowledgeBaseController.updateArticle');
router.delete('/kb/articles/:id', authMiddleware, 'KnowledgeBaseController.deleteArticle');
router.get('/kb/categories', authMiddleware, 'KnowledgeBaseController.listCategories');
router.post('/kb/articles/:id/publish', authMiddleware, 'KnowledgeBaseController.publishArticle');
router.get('/kb/search', authMiddleware, 'KnowledgeBaseController.searchArticles');

/**
 * Support Chat Routes
 */
router.get('/chat/sessions', authMiddleware, 'SupportChatController.listSessions');
router.get('/chat/sessions/:id', authMiddleware, 'SupportChatController.getSession');
router.post('/chat/sessions', authMiddleware, 'SupportChatController.createSession');
router.put('/chat/sessions/:id', authMiddleware, 'SupportChatController.updateSession');
router.post('/chat/sessions/:id/messages', authMiddleware, 'SupportChatController.sendMessage');
router.get('/chat/sessions/:id/messages', authMiddleware, 'SupportChatController.getMessages');
router.post('/chat/sessions/:id/transfer', authMiddleware, 'SupportChatController.transferChat');
router.post('/chat/sessions/:id/end', authMiddleware, 'SupportChatController.endSession');

/**
 * Support Analytics Routes
 */
router.get('/analytics/tickets', authMiddleware, 'SupportAnalyticsController.getTicketAnalytics');
router.get('/analytics/satisfaction', authMiddleware, 'SupportAnalyticsController.getSatisfactionMetrics');
router.get('/analytics/response-time', authMiddleware, 'SupportAnalyticsController.getResponseTimeMetrics');
router.get('/analytics/agents', authMiddleware, 'SupportAnalyticsController.getAgentPerformance');
router.get('/analytics/trends', authMiddleware, 'SupportAnalyticsController.getTrends');
router.get('/analytics/reports', authMiddleware, 'SupportAnalyticsController.generateReports');

module.exports = router;
