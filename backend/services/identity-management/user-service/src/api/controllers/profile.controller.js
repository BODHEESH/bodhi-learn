// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\api\controllers\profile.controller.js

const profileService = require('../../services/profile.service');
const { ValidationError } = require('../../utils/errors');
const config = require('../../config/app.config');

class ProfileController {
  async getByUserId(req, res, next) {
    try {
      const profile = await profileService.findByUserId(req.params.userId);
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const profile = await profileService.update(req.params.userId, req.body);
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAvatar(req, res, next) {
    try {
      if (!req.file) {
        throw new ValidationError('Avatar file is required');
      }

      // Validate file type
      if (!config.storage.avatarAllowedTypes.includes(req.file.mimetype)) {
        throw new ValidationError('Invalid file type. Allowed types: ' + 
          config.storage.avatarAllowedTypes.join(', '));
      }

      // Validate file size
      if (req.file.size > config.storage.avatarSizeLimit) {
        throw new ValidationError(`File size should not exceed ${config.storage.avatarSizeLimit / (1024 * 1024)}MB`);
      }

      const profile = await profileService.updateAvatar(req.params.userId, req.file);
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const { preferences } = req.body;
      if (!preferences || typeof preferences !== 'object') {
        throw new ValidationError('Preferences object is required');
      }

      const profile = await profileService.updatePreferences(req.params.userId, preferences);
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMetadata(req, res, next) {
    try {
      const { metadata } = req.body;
      if (!metadata || typeof metadata !== 'object') {
        throw new ValidationError('Metadata object is required');
      }

      const profile = await profileService.updateMetadata(req.params.userId, metadata);
      res.json({
        status: 'success',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
