// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\events\subscriber.js

const { messageQueue } = require('../utils/message-queue');
const handlers = require('./handlers');
const logger = require('../utils/logger');
const config = require('../config/app.config');

class EventSubscriber {
  constructor() {
    this.messageQueue = messageQueue;
    this.handlers = handlers;
  }

  async start() {
    try {
      // Connect to message queue
      await this.messageQueue.connect();

      // Subscribe to user events queue
      await this.messageQueue.subscribe(
        config.rabbitmq.queues.userEvents,
        async (message) => {
          await this.handleEvent(message);
        }
      );

      logger.info('Event subscriber started successfully');
    } catch (error) {
      logger.error('Failed to start event subscriber:', error);
      throw error;
    }
  }

  async handleEvent(message) {
    const { type, data } = message;
    
    logger.debug('Received event:', { type, data });

    const handler = this.handlers[type];
    if (handler) {
      try {
        await handler(data);
        logger.debug('Successfully processed event:', { type, data });
      } catch (error) {
        logger.error('Error processing event:', { type, error });
        // Determine if the error is temporary and should be requeued
        error.temporary = this.isTemporaryError(error);
        throw error;
      }
    } else {
      logger.warn('No handler found for event type:', type);
    }
  }

  isTemporaryError(error) {
    // Define which types of errors should be considered temporary
    // and result in message requeuing
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.name === 'SequelizeConnectionError' ||
      error.name === 'MongoNetworkError'
    );
  }

  async stop() {
    try {
      await this.messageQueue.disconnect();
      logger.info('Event subscriber stopped successfully');
    } catch (error) {
      logger.error('Error stopping event subscriber:', error);
      throw error;
    }
  }
}

module.exports = new EventSubscriber();
