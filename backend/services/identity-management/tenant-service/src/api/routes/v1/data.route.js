// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\v1\data.route.js

const express = require('express');
const { validate } = require('express-validation');
const dataController = require('../../controllers/data.controller');
const dataValidation = require('../../validations/data.validation');
const auth = require('../../middlewares/auth');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

router
  .route('/export')
  .post(
    auth(),
    checkRole(['admin']),
    validate(dataValidation.exportData),
    dataController.exportData
  );

router
  .route('/import')
  .post(
    auth(),
    checkRole(['admin']),
    validate(dataValidation.importData),
    dataController.importData
  );

router
  .route('/export/:exportId')
  .get(
    auth(),
    validate(dataValidation.getExportStatus),
    dataController.getExportStatus
  )
  .delete(
    auth(),
    checkRole(['admin']),
    validate(dataValidation.deleteExport),
    dataController.deleteExport
  );

router
  .route('/import/:importId')
  .get(
    auth(),
    validate(dataValidation.getImportStatus),
    dataController.getImportStatus
  );

router
  .route('/tenant/:tenantId/export')
  .post(
    auth(),
    checkRole(['admin']),
    validate(dataValidation.exportTenantData),
    dataController.exportTenantData
  );

router
  .route('/tenant/:tenantId/import')
  .post(
    auth(),
    checkRole(['admin']),
    validate(dataValidation.importTenantData),
    dataController.importTenantData
  );

module.exports = router;
