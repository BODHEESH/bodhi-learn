// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\jest.setup.js

jest.setTimeout(30000);

// Mock Redis
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock message queue
jest.mock('./src/utils/queue', () => ({
  publishMessage: jest.fn(),
  consumeMessage: jest.fn()
}));

// Mock metrics
jest.mock('./src/utils/metrics', () => ({
  incrementCounter: jest.fn(),
  recordMetric: jest.fn()
}));
