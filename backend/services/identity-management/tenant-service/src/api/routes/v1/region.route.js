// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\v1\region.route.js
const express = require('express');
const { validate } = require('express-validation');
const regionController = require('../../controllers/region.controller');
const regionValidation = require('../../validations/region.validation');
const auth = require('../../middlewares/auth');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.createRegion),
    regionController.createRegion
  )
  .get(
    auth(),
    validate(regionValidation.listRegions),
    regionController.listRegions
  );

router
  .route('/:regionId')
  .get(
    auth(),
    validate(regionValidation.getRegion),
    regionController.getRegion
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.updateRegion),
    regionController.updateRegion
  )
  .delete(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.deleteRegion),
    regionController.deleteRegion
  );

router
  .route('/:regionId/health')
  .get(
    auth(),
    validate(regionValidation.getRegionHealth),
    regionController.getRegionHealth
  );

router
  .route('/:regionId/metrics')
  .get(
    auth(),
    validate(regionValidation.getRegionMetrics),
    regionController.getRegionMetrics
  );

router
  .route('/tenant/:tenantId')
  .get(
    auth(),
    validate(regionValidation.getTenantRegions),
    regionController.getTenantRegions
  )
  .post(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.addTenantRegion),
    regionController.addTenantRegion
  );

router
  .route('/tenant/:tenantId/:regionId')
  .delete(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.removeTenantRegion),
    regionController.removeTenantRegion
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(regionValidation.updateTenantRegionSettings),
    regionController.updateTenantRegionSettings
  );

module.exports = router;
