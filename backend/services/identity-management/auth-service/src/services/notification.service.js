// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\services\notification.service.js

const { MessageQueue } = require('../utils/message-queue');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.messageQueue = new MessageQueue();
    this.exchangeName = 'notifications';
  }

  async sendPasswordResetEmail(email, resetToken, institutionId) {
    try {
      await this.messageQueue.publish(
        this.exchangeName,
        'email.password.reset',
        {
          to: email,
          institutionId,
          type: 'password_reset',
          data: {
            resetToken,
            resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
          }
        }
      );

      logger.info('Password reset email queued:', { email });
    } catch (error) {
      logger.error('Failed to queue password reset email:', {
        error: error.message,
        email
      });
      throw error;
    }
  }

  async sendPasswordChangedNotification(userId, email, institutionId) {
    try {
      await this.messageQueue.publish(
        this.exchangeName,
        'email.password.changed',
        {
          to: email,
          institutionId,
          type: 'password_changed',
          data: {
            userId,
            timestamp: new Date().toISOString()
          }
        }
      );

      logger.info('Password changed notification queued:', { userId });
    } catch (error) {
      logger.error('Failed to queue password changed notification:', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  async sendLoginNotification(userId, email, loginDetails) {
    try {
      await this.messageQueue.publish(
        this.exchangeName,
        'email.security.login',
        {
          to: email,
          type: 'new_login',
          data: {
            userId,
            ...loginDetails,
            timestamp: new Date().toISOString()
          }
        }
      );

      logger.info('Login notification queued:', { userId });
    } catch (error) {
      logger.error('Failed to queue login notification:', {
        error: error.message,
        userId
      });
      // Don't throw error as this is a non-critical operation
    }
  }
}

module.exports = { NotificationService };
