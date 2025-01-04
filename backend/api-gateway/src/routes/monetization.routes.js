const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

/**
 * Subscription Routes
 */
router.get('/subscriptions', authMiddleware, 'SubscriptionController.list');
router.get('/subscriptions/:id', authMiddleware, 'SubscriptionController.get');
router.post('/subscriptions', authMiddleware, 'SubscriptionController.create');
router.put('/subscriptions/:id', authMiddleware, 'SubscriptionController.update');
router.delete('/subscriptions/:id', authMiddleware, 'SubscriptionController.delete');
router.post('/subscriptions/:id/activate', authMiddleware, 'SubscriptionController.activate');
router.post('/subscriptions/:id/cancel', authMiddleware, 'SubscriptionController.cancel');
router.get('/subscriptions/:id/usage', authMiddleware, 'SubscriptionController.getUsage');

/**
 * Pricing Routes
 */
router.get('/pricing/plans', authMiddleware, 'PricingController.listPlans');
router.get('/pricing/plans/:id', authMiddleware, 'PricingController.getPlan');
router.post('/pricing/plans', authMiddleware, 'PricingController.createPlan');
router.put('/pricing/plans/:id', authMiddleware, 'PricingController.updatePlan');
router.delete('/pricing/plans/:id', authMiddleware, 'PricingController.deletePlan');
router.get('/pricing/features', authMiddleware, 'PricingController.listFeatures');
router.post('/pricing/features', authMiddleware, 'PricingController.createFeature');
router.get('/pricing/compare', authMiddleware, 'PricingController.comparePlans');

/**
 * Billing Routes
 */
router.get('/billing/invoices', authMiddleware, 'BillingController.listInvoices');
router.get('/billing/invoices/:id', authMiddleware, 'BillingController.getInvoice');
router.post('/billing/invoices', authMiddleware, 'BillingController.createInvoice');
router.put('/billing/invoices/:id', authMiddleware, 'BillingController.updateInvoice');
router.post('/billing/invoices/:id/send', authMiddleware, 'BillingController.sendInvoice');
router.get('/billing/transactions', authMiddleware, 'BillingController.listTransactions');
router.post('/billing/refunds', authMiddleware, 'BillingController.processRefund');
router.get('/billing/statements', authMiddleware, 'BillingController.getStatements');

/**
 * Revenue Analytics Routes
 */
router.get('/analytics/revenue', authMiddleware, 'RevenueAnalyticsController.getOverview');
router.get('/analytics/mrr', authMiddleware, 'RevenueAnalyticsController.getMRR');
router.get('/analytics/arr', authMiddleware, 'RevenueAnalyticsController.getARR');
router.get('/analytics/churn', authMiddleware, 'RevenueAnalyticsController.getChurnRate');
router.get('/analytics/ltv', authMiddleware, 'RevenueAnalyticsController.getLTV');
router.get('/analytics/retention', authMiddleware, 'RevenueAnalyticsController.getRetentionMetrics');
router.get('/analytics/forecasts', authMiddleware, 'RevenueAnalyticsController.getForecasts');
router.post('/analytics/reports', authMiddleware, 'RevenueAnalyticsController.generateReport');

/**
 * Payment Gateway Routes
 */
router.post('/payments/process', authMiddleware, 'PaymentGatewayController.processPayment');
router.get('/payments/methods', authMiddleware, 'PaymentGatewayController.listPaymentMethods');
router.post('/payments/methods', authMiddleware, 'PaymentGatewayController.addPaymentMethod');
router.delete('/payments/methods/:id', authMiddleware, 'PaymentGatewayController.removePaymentMethod');
router.post('/payments/verify', authMiddleware, 'PaymentGatewayController.verifyPayment');
router.get('/payments/status/:id', authMiddleware, 'PaymentGatewayController.getPaymentStatus');
router.post('/payments/refund', authMiddleware, 'PaymentGatewayController.processRefund');
router.get('/payments/history', authMiddleware, 'PaymentGatewayController.getPaymentHistory');

/**
 * Search Routes
 */
router.get('/search', authMiddleware, 'SearchController.search');
router.get('/search/filters', authMiddleware, 'SearchController.getFilters');
router.post('/search/index', authMiddleware, 'SearchController.reindex');
router.get('/search/suggestions', authMiddleware, 'SearchController.getSuggestions');
router.get('/search/popular', authMiddleware, 'SearchController.getPopularSearches');
router.post('/search/feedback', authMiddleware, 'SearchController.submitSearchFeedback');
router.get('/search/analytics', authMiddleware, 'SearchController.getSearchAnalytics');
router.post('/search/optimize', authMiddleware, 'SearchController.optimizeSearch');

module.exports = router;
