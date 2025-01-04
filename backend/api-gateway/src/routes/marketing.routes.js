const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Campaign Management Routes
 */
router.get('/campaigns', authMiddleware, 'CampaignController.list');
router.get('/campaigns/:id', authMiddleware, 'CampaignController.get');
router.post('/campaigns', authMiddleware, 'CampaignController.create');
router.put('/campaigns/:id', authMiddleware, 'CampaignController.update');
router.delete('/campaigns/:id', authMiddleware, 'CampaignController.delete');
router.post('/campaigns/:id/launch', authMiddleware, 'CampaignController.launch');
router.get('/campaigns/:id/performance', authMiddleware, 'CampaignController.getPerformance');
router.post('/campaigns/:id/pause', authMiddleware, 'CampaignController.pause');

/**
 * Analytics Routes
 */
router.get('/analytics/overview', authMiddleware, 'MarketingAnalyticsController.getOverview');
router.get('/analytics/campaigns', authMiddleware, 'MarketingAnalyticsController.getCampaignMetrics');
router.get('/analytics/leads', authMiddleware, 'MarketingAnalyticsController.getLeadMetrics');
router.get('/analytics/conversion', authMiddleware, 'MarketingAnalyticsController.getConversionMetrics');
router.get('/analytics/roi', authMiddleware, 'MarketingAnalyticsController.getROIMetrics');
router.get('/analytics/channels', authMiddleware, 'MarketingAnalyticsController.getChannelPerformance');
router.get('/analytics/reports', authMiddleware, 'MarketingAnalyticsController.generateReports');
router.post('/analytics/custom', authMiddleware, 'MarketingAnalyticsController.createCustomReport');

/**
 * Lead Management Routes
 */
router.get('/leads', authMiddleware, 'LeadController.list');
router.get('/leads/:id', authMiddleware, 'LeadController.get');
router.post('/leads', authMiddleware, 'LeadController.create');
router.put('/leads/:id', authMiddleware, 'LeadController.update');
router.delete('/leads/:id', authMiddleware, 'LeadController.delete');
router.post('/leads/:id/qualify', authMiddleware, 'LeadController.qualifyLead');
router.post('/leads/:id/convert', authMiddleware, 'LeadController.convertLead');
router.get('/leads/sources', authMiddleware, 'LeadController.getLeadSources');

/**
 * Content Marketing Routes
 */
router.get('/content', authMiddleware, 'ContentMarketingController.list');
router.get('/content/:id', authMiddleware, 'ContentMarketingController.get');
router.post('/content', authMiddleware, 'ContentMarketingController.create');
router.put('/content/:id', authMiddleware, 'ContentMarketingController.update');
router.delete('/content/:id', authMiddleware, 'ContentMarketingController.delete');
router.post('/content/:id/publish', authMiddleware, 'ContentMarketingController.publish');
router.get('/content/:id/performance', authMiddleware, 'ContentMarketingController.getPerformance');
router.get('/content/calendar', authMiddleware, 'ContentMarketingController.getContentCalendar');

/**
 * Social Media Routes
 */
router.get('/social/accounts', authMiddleware, 'SocialMediaController.listAccounts');
router.post('/social/accounts', authMiddleware, 'SocialMediaController.connectAccount');
router.delete('/social/accounts/:id', authMiddleware, 'SocialMediaController.disconnectAccount');
router.get('/social/posts', authMiddleware, 'SocialMediaController.listPosts');
router.post('/social/posts', authMiddleware, 'SocialMediaController.createPost');
router.get('/social/analytics', authMiddleware, 'SocialMediaController.getAnalytics');
router.get('/social/engagement', authMiddleware, 'SocialMediaController.getEngagementMetrics');
router.post('/social/schedule', authMiddleware, 'SocialMediaController.schedulePost');

/**
 * Email Marketing Routes
 */
router.get('/email/campaigns', authMiddleware, 'EmailMarketingController.listCampaigns');
router.post('/email/campaigns', authMiddleware, 'EmailMarketingController.createCampaign');
router.get('/email/templates', authMiddleware, 'EmailMarketingController.listTemplates');
router.post('/email/templates', authMiddleware, 'EmailMarketingController.createTemplate');
router.get('/email/subscribers', authMiddleware, 'EmailMarketingController.listSubscribers');
router.post('/email/subscribers', authMiddleware, 'EmailMarketingController.addSubscriber');
router.get('/email/analytics', authMiddleware, 'EmailMarketingController.getAnalytics');
router.post('/email/send', authMiddleware, 'EmailMarketingController.sendCampaign');

module.exports = router;
