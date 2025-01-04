const express = require('express');
const router = express.Router();

// Import all service routes
const identityRoutes = require('./identity.routes');
const learningRoutes = require('./learning.routes');
const academicRoutes = require('./academic.routes');
const studentLifeRoutes = require('./student-life.routes');
const communicationRoutes = require('./communication.routes');
const resourceRoutes = require('./resource.routes');
const financialRoutes = require('./financial.routes');
const complianceRoutes = require('./compliance.routes');
const infrastructureRoutes = require('./infrastructure.routes');
const supportRoutes = require('./support.routes');
const engagementRoutes = require('./engagement.routes');
const marketingRoutes = require('./marketing.routes');
const operationsRoutes = require('./operations.routes');
const monetizationRoutes = require('./monetization.routes');

// Mount routes
router.use('/api/v1/identity', identityRoutes);
router.use('/api/v1/learning', learningRoutes);
router.use('/api/v1/academic', academicRoutes);
router.use('/api/v1/student-life', studentLifeRoutes);
router.use('/api/v1/communication', communicationRoutes);
router.use('/api/v1/resources', resourceRoutes);
router.use('/api/v1/financial', financialRoutes);
router.use('/api/v1/compliance', complianceRoutes);
router.use('/api/v1/infrastructure', infrastructureRoutes);
router.use('/api/v1/support', supportRoutes);
router.use('/api/v1/engagement', engagementRoutes);
router.use('/api/v1/marketing', marketingRoutes);
router.use('/api/v1/operations', operationsRoutes);
router.use('/api/v1/monetization', monetizationRoutes);

module.exports = router;
