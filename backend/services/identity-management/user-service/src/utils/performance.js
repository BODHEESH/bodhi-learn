// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\performance.js

const compression = require('compression');
const { redis } = require('../services/redis.service');
const logger = require('./logger');
const { metrics } = require('./metrics');

// Compression middleware with optimization
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Response time tracking middleware
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const ms = duration[0] * 1000 + duration[1] / 1e6;

    // Log slow requests
    if (ms > 1000) {
      logger.warn('Slow request detected', {
        path: req.path,
        method: req.method,
        duration: ms
      });
    }

    // Track response time metrics
    metrics.httpRequestDurationMicroseconds
      .labels(req.method, req.path)
      .observe(ms / 1000);
  });

  next();
};

// Query optimization middleware
const queryOptimizer = (req, res, next) => {
  // Limit query parameters
  if (req.query.limit) {
    req.query.limit = Math.min(parseInt(req.query.limit), 100);
  }

  // Optimize sort parameters
  if (req.query.sort) {
    const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'];
    const sortField = req.query.sort.replace(/^-/, '');
    if (!allowedSortFields.includes(sortField)) {
      delete req.query.sort;
    }
  }

  next();
};

// Cache optimization
const cacheOptimizer = {
  // Optimized cache key generation
  generateKey: (prefix, params) => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  },

  // Batch cache operations
  async batchGet(keys) {
    try {
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.get(key));
      const results = await pipeline.exec();
      return results.map(([err, value]) => {
        if (err) {
          logger.error('Cache batch get error:', err);
          return null;
        }
        return value ? JSON.parse(value) : null;
      });
    } catch (error) {
      logger.error('Cache batch operation failed:', error);
      return keys.map(() => null);
    }
  },

  // Optimized cache warming
  async warmCache(items, keyFn, ttl) {
    try {
      const pipeline = redis.pipeline();
      items.forEach(item => {
        const key = keyFn(item);
        pipeline.set(key, JSON.stringify(item), 'EX', ttl);
      });
      await pipeline.exec();
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }
};

// Memory optimization
const memoryOptimizer = {
  // Garbage collection optimization
  optimizeMemory: () => {
    if (global.gc) {
      global.gc();
    }
  },

  // Memory usage monitoring
  monitorMemory: () => {
    const used = process.memoryUsage();
    metrics.memoryUsage.set(used.heapUsed / 1024 / 1024);
    
    // Alert on high memory usage
    if (used.heapUsed > used.heapTotal * 0.9) {
      logger.warn('High memory usage detected', {
        heapUsed: used.heapUsed,
        heapTotal: used.heapTotal
      });
    }
  }
};

// Connection pool optimization
const connectionOptimizer = {
  // Optimize database connections
  optimizeConnections: (pool) => {
    pool.on('acquire', () => {
      metrics.dbConnectionsActive.inc();
    });

    pool.on('release', () => {
      metrics.dbConnectionsActive.dec();
    });
  },

  // Monitor connection pool
  monitorPool: (pool) => {
    setInterval(() => {
      const stats = pool.pool.stats();
      metrics.dbConnectionPool.set({
        state: 'available'
      }, stats.available);
      metrics.dbConnectionPool.set({
        state: 'used'
      }, stats.used);
      metrics.dbConnectionPool.set({
        state: 'size'
      }, stats.size);
    }, 5000);
  }
};

module.exports = {
  compressionMiddleware,
  responseTimeMiddleware,
  queryOptimizer,
  cacheOptimizer,
  memoryOptimizer,
  connectionOptimizer
};
