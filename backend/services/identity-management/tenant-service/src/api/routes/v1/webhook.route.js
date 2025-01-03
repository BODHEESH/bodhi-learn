// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\routes\v1\webhook.route.js

const express = require('express');
const { validate } = require('express-validation');
const webhookController = require('../../controllers/webhook.controller');
const webhookValidation = require('../../validations/webhook.validation');
const auth = require('../../middlewares/auth');
const checkRole = require('../../middlewares/checkRole');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    checkRole(['admin']),
    validate(webhookValidation.createWebhook),
    webhookController.createWebhook
  )
  .get(
    auth(),
    validate(webhookValidation.listWebhooks),
    webhookController.listWebhooks
  );

router
  .route('/:webhookId')
  .get(
    auth(),
    validate(webhookValidation.getWebhook),
    webhookController.getWebhook
  )
  .patch(
    auth(),
    checkRole(['admin']),
    validate(webhookValidation.updateWebhook),
    webhookController.updateWebhook
  )
  .delete(
    auth(),
    checkRole(['admin']),
    validate(webhookValidation.deleteWebhook),
    webhookController.deleteWebhook
  );

router
  .route('/:webhookId/test')
  .post(
    auth(),
    checkRole(['admin']),
    validate(webhookValidation.testWebhook),
    webhookController.testWebhook
  );

router
  .route('/:webhookId/logs')
  .get(
    auth(),
    validate(webhookValidation.getWebhookLogs),
    webhookController.getWebhookLogs
  );

module.exports = router;
