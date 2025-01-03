// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\jest.setup.js

const { sequelize } = require('./src/database/models');
const { redis } = require('./src/services/redis.service');
const { messageQueue } = require('./src/utils/message-queue');

beforeAll(async () => {
  // Clear Redis cache
  await redis.flushall();
  
  // Clear database
  await sequelize.sync({ force: true });
  
  // Connect to message queue
  await messageQueue.connect();
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
  
  // Close Redis connection
  await redis.quit();
  
  // Close message queue connection
  await messageQueue.disconnect();
});
