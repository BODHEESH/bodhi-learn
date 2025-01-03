// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\api\routes\index.js

const express = require('express');
const router = express.Router();
const tenantRoutes = require('./tenant.routes');
const { errorHandler } = require('../../middleware/error-handler');
const { notFoundHandler } = require('../../middleware/not-found');
const { metrics } = require('../../utils/metrics');

// Health check endpoint
router.get('/health', (req, res) => {
  metrics.apiRequests.inc({ endpoint: '/health', method: 'GET', status: 200 });
  res.json({
    status: 'healthy',
    service: 'tenant-service',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  metrics.apiRequests.inc({ endpoint: '/docs', method: 'GET', status: 302 });
  res.redirect('/api-docs');
});

// API version prefix
const API_PREFIX = '/api/v1';

// Mount tenant routes
router.use(`${API_PREFIX}/tenants`, tenantRoutes);

// Handle 404
router.use(notFoundHandler);

// Handle errors
router.use(errorHandler);

module.exports = router;
