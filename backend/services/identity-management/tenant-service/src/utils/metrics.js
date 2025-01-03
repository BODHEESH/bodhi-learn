// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\metrics.js

const prometheus = require('prom-client');
const logger = require('./logger');

// Create a Registry to register the metrics
const register = new prometheus.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'tenant-service'
});

// Enable the collection of default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const metrics = {
  // HTTP request metrics
  httpRequestDuration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),

  // API request counter
  apiRequests: new prometheus.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['endpoint', 'method', 'status']
  }),

  // API error counter
  apiErrors: new prometheus.Counter({
    name: 'api_errors_total',
    help: 'Total number of API errors',
    labelNames: ['endpoint', 'method']
  }),

  // Tenant metrics
  tenantCount: new prometheus.Gauge({
    name: 'tenant_count',
    help: 'Current number of tenants',
    labelNames: ['status', 'type']
  }),

  // Database metrics
  dbQueryDuration: new prometheus.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1]
  }),

  // Cache metrics
  cacheHits: new prometheus.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type']
  }),

  cacheMisses: new prometheus.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type']
  }),

  // Resource usage metrics
  resourceUsage: new prometheus.Gauge({
    name: 'resource_usage',
    help: 'Current resource usage by tenants',
    labelNames: ['tenant_id', 'resource_type']
  }),

  // Message queue metrics
  messageQueueSize: new prometheus.Gauge({
    name: 'message_queue_size',
    help: 'Current size of message queues',
    labelNames: ['queue_name']
  }),

  messageProcessingDuration: new prometheus.Histogram({
    name: 'message_processing_duration_seconds',
    help: 'Duration of message processing in seconds',
    labelNames: ['queue_name', 'message_type'],
    buckets: [0.1, 0.5, 1, 2, 5]
  })
};

// Register all metrics
Object.values(metrics).forEach(metric => register.registerMetric(metric));

// Middleware to track HTTP request duration
const httpRequestDurationMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode
      },
      durationInSeconds
    );
  });

  next();
};

// Function to track database query duration
const trackDbQuery = async (queryType, table, queryFn) => {
  const start = process.hrtime();

  try {
    const result = await queryFn();
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    metrics.dbQueryDuration.observe(
      {
        query_type: queryType,
        table: table
      },
      durationInSeconds
    );

    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Function to get metrics
const getMetrics = async () => {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    throw error;
  }
};

module.exports = {
  metrics,
  httpRequestDurationMiddleware,
  trackDbQuery,
  getMetrics
};
