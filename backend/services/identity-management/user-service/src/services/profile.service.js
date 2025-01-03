// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\services\profile.service.js

const BaseService = require('./base.service');
const { Profile } = require('../models');
const { RedisService } = require('./redis.service');
const { MessageQueue } = require('../utils/message-queue');
const config = require('../config/app.config');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ProfileService extends BaseService {
  constructor() {
    super(Profile, 'Profile');
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
  }

  async findByUserId(userId, options = {}) {
    const cacheKey = `profile:${userId}`;
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const profile = await this.findOne({ userId }, options);
    
    // Cache the result
    await this.redis.set(cacheKey, JSON.stringify(profile), config.cache.ttl.profile);
    return profile;
  }

  async update(userId, profileData) {
    const profile = await this.findByUserId(userId);
    
    // Update profile
    await profile.update(profileData);

    // Invalidate cache
    await this.redis.del(`profile:${userId}`);

    // Publish profile updated event
    await this.messageQueue.publish('user-exchange', 'profile.updated', {
      userId,
      updates: Object.keys(profileData)
    });

    return profile;
  }

  async updateAvatar(userId, file) {
    const profile = await this.findByUserId(userId);

    // Process image
    const processedImage = await this.processAvatar(file);
    
    // Generate avatar URL
    const avatarUrl = `/avatars/${userId}${path.extname(file.originalname)}`;
    const avatarPath = path.join(process.cwd(), 'public', avatarUrl);

    // Save processed image
    await fs.writeFile(avatarPath, processedImage);

    // Update profile with new avatar URL
    await profile.updateAvatar(avatarUrl);

    // Invalidate cache
    await this.redis.del(`profile:${userId}`);

    // Publish avatar updated event
    await this.messageQueue.publish('user-exchange', 'profile.avatar.updated', {
      userId,
      avatarUrl
    });

    return profile;
  }

  async updatePreferences(userId, preferences) {
    const profile = await this.findByUserId(userId);
    await profile.updatePreferences(preferences);

    // Invalidate cache
    await this.redis.del(`profile:${userId}`);

    return profile;
  }

  async updateMetadata(userId, metadata) {
    const profile = await this.findByUserId(userId);
    await profile.updateMetadata(metadata);

    // Invalidate cache
    await this.redis.del(`profile:${userId}`);

    return profile;
  }

  // Private methods
  async processAvatar(file) {
    const { width, height } = config.storage.avatarDimensions;

    return sharp(file.buffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

module.exports = new ProfileService();
