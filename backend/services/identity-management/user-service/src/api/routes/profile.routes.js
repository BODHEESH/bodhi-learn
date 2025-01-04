// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\routes\profile.routes.js

const express = require('express');
const multer = require('multer');
const profileController = require('../controllers/profile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateSchema } = require('../middleware/validation.middleware');
const { apiLimiter } = require('../middleware/rate-limiter');
const { 
  updateProfileSchema, 
  updatePreferencesSchema 
} = require('../validators/profile.schema');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image file'), false);
    }
  }
});

// Apply rate limiting to all routes
router.use(apiLimiter);

// Get profile by user ID
router.get('/:userId',
  authenticate,
  profileController.getByUserId
);

// Update profile
router.put('/:userId',
  authenticate,
  validateSchema(updateProfileSchema),
  profileController.update
);

// Update avatar
router.patch('/:userId/avatar',
  authenticate,
  upload.single('avatar'),
  profileController.updateAvatar
);

// Update preferences
router.patch('/:userId/preferences',
  authenticate,
  validateSchema(updatePreferencesSchema),
  profileController.updatePreferences
);

// Update metadata
router.patch('/:userId/metadata',
  authenticate,
  authorize(['super_admin', 'tenant_admin']),
  profileController.updateMetadata
);

module.exports = router;
