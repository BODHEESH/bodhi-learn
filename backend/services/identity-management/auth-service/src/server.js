// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\server.js

require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

const server = app.start();

const gracefulShutdown = async () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    // Close Redis connections
    const redis = app.getRedisService();
    if (redis) {
      await redis.close();
      logger.info('Redis connections closed');
    }

    // Close message queue connections
    const messageQueue = app.getMessageQueue();
    if (messageQueue) {
      await messageQueue.close();
      logger.info('Message queue connections closed');
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Listen for shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
