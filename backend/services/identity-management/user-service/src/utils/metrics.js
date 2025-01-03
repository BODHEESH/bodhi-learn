// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\metrics.js

const promClient = require('prom-client');
const config = require('../config/app.config');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  prefix: config.metrics.prefix,
  register
});

// HTTP request duration histogram
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: `${config.metrics.prefix}http_request_duration_seconds`,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Request counter
const httpRequestsTotal = new promClient.Counter({
  name: `${config.metrics.prefix}http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Error counter
const errorCounter = new promClient.Counter({
  name: `${config.metrics.prefix}errors_total`,
  help: 'Total number of errors',
  labelNames: ['type', 'code']
});

// Database operation duration
const dbOperationDuration = new promClient.Histogram({
  name: `${config.metrics.prefix}db_operation_duration_seconds`,
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Cache metrics
const cacheHits = new promClient.Counter({
  name: `${config.metrics.prefix}cache_hits_total`,
  help: 'Total number of cache hits',
  labelNames: ['cache']
});

const cacheMisses = new promClient.Counter({
  name: `${config.metrics.prefix}cache_misses_total`,
  help: 'Total number of cache misses',
  labelNames: ['cache']
});

// Message queue metrics
const messageQueueOperations = new promClient.Counter({
  name: `${config.metrics.prefix}message_queue_operations_total`,
  help: 'Total number of message queue operations',
  labelNames: ['operation', 'queue']
});

// Active users gauge
const activeUsers = new promClient.Gauge({
  name: `${config.metrics.prefix}active_users`,
  help: 'Number of active users'
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(errorCounter);
register.registerMetric(dbOperationDuration);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);
register.registerMetric(messageQueueOperations);
register.registerMetric(activeUsers);

// Middleware for tracking request duration
const requestDurationMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationSeconds = duration[0] + duration[1] / 1e9;

    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(durationSeconds);

    httpRequestsTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });

  next();
};

module.exports = {
  register,
  metrics: {
    httpRequestDurationMicroseconds,
    httpRequestsTotal,
    errorCounter,
    dbOperationDuration,
    cacheHits,
    cacheMisses,
    messageQueueOperations,
    activeUsers
  },
  requestDurationMiddleware
};
