// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\performance-optimizer.js

const logger = require('./logger');
const { metrics } = require('./metrics');
const performanceMonitor = require('./performance');
const queryOptimizer = require('./queryOptimizer');

class PerformanceOptimizer {
  constructor() {
    this.optimizationRules = new Map();
    this.optimizationHistory = [];
    this.setupDefaultRules();
  }

  // Setup default optimization rules
  setupDefaultRules() {
    // Query optimization rules
    this.addRule('SLOW_QUERY', {
      condition: async (metrics) => {
        const queryDuration = await metrics.dbQueryDuration.get();
        return queryDuration > 1000; // 1 second threshold
      },
      action: async (context) => {
        const optimizedQuery = queryOptimizer.optimizeQuery(context.query, {
          useIndex: true,
          includeFields: context.requiredFields
        });
        return optimizedQuery;
      }
    });

    // Cache optimization rules
    this.addRule('LOW_CACHE_HIT_RATE', {
      condition: async (metrics) => {
        const hits = await metrics.cacheHits.get();
        const misses = await metrics.cacheMisses.get();
        const hitRate = hits / (hits + misses);
        return hitRate < 0.7; // 70% threshold
      },
      action: async (context) => {
        return {
          action: 'ADJUST_CACHE_STRATEGY',
          recommendations: [
            'Increase cache TTL',
            'Implement cache warming',
            'Review cache key strategy'
          ]
        };
      }
    });

    // Memory optimization rules
    this.addRule('HIGH_MEMORY_USAGE', {
      condition: async () => {
        const used = process.memoryUsage().heapUsed;
        const total = process.memoryUsage().heapTotal;
        return (used / total) > 0.85; // 85% threshold
      },
      action: async () => {
        global.gc && global.gc(); // Run garbage collection if available
        return {
          action: 'MEMORY_OPTIMIZATION',
          recommendations: [
            'Review memory leaks',
            'Implement pagination',
            'Optimize object allocation'
          ]
        };
      }
    });
  }

  // Add new optimization rule
  addRule(name, rule) {
    this.optimizationRules.set(name, rule);
  }

  // Run optimization checks
  async runOptimizationChecks() {
    const optimizations = [];

    for (const [name, rule] of this.optimizationRules) {
      try {
        if (await rule.condition(metrics)) {
          const result = await rule.action({
            metrics,
            timestamp: Date.now()
          });

          optimizations.push({
            rule: name,
            timestamp: Date.now(),
            result
          });

          logger.info('Optimization rule triggered', { rule: name, result });
        }
      } catch (error) {
        logger.error('Error in optimization rule', { rule: name, error });
      }
    }

    this.optimizationHistory.push(...optimizations);
    return optimizations;
  }

  // Optimize database query
  async optimizeQuery(query, context = {}) {
    const startTime = process.hrtime();

    try {
      // Apply query optimization strategies
      const optimizedQuery = await queryOptimizer.optimizeQuery(query, {
        useIndex: true,
        includeFields: context.requiredFields,
        defaultLimit: context.limit || 10
      });

      // Record optimization metrics
      const duration = process.hrtime(startTime);
      metrics.dbQueryDuration.observe(
        { query_type: 'optimized' },
        duration[0] + duration[1] / 1e9
      );

      return optimizedQuery;
    } catch (error) {
      logger.error('Query optimization failed', { error, query });
      return query; // Return original query if optimization fails
    }
  }

  // Optimize cache strategy
  async optimizeCacheStrategy(options = {}) {
    const {
      ttl = 3600,
      maxSize = 1000,
      evictionPolicy = 'LRU'
    } = options;

    return {
      ttl,
      maxSize,
      evictionPolicy,
      recommendations: [
        'Implement cache warming for frequently accessed data',
        'Use cache versioning for better cache invalidation',
        'Monitor cache hit rates for specific keys'
      ]
    };
  }

  // Optimize memory usage
  async optimizeMemory() {
    const initialMemory = process.memoryUsage();

    try {
      // Run garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Clear any internal caches
      queryOptimizer.clearCache();
      performanceMonitor.clearMeasurements();

      const finalMemory = process.memoryUsage();
      const reduction = {
        heapUsed: initialMemory.heapUsed - finalMemory.heapUsed,
        heapTotal: initialMemory.heapTotal - finalMemory.heapTotal
      };

      logger.info('Memory optimization completed', { reduction });

      return {
        success: true,
        memoryReduced: reduction,
        recommendations: [
          'Implement pagination for large data sets',
          'Use streams for file operations',
          'Review object lifecycle management'
        ]
      };
    } catch (error) {
      logger.error('Memory optimization failed', { error });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get optimization history
  getOptimizationHistory(options = {}) {
    const {
      limit = 10,
      rule = null,
      startTime = null,
      endTime = null
    } = options;

    let history = [...this.optimizationHistory];

    if (rule) {
      history = history.filter(item => item.rule === rule);
    }

    if (startTime) {
      history = history.filter(item => item.timestamp >= startTime);
    }

    if (endTime) {
      history = history.filter(item => item.timestamp <= endTime);
    }

    return history.slice(-limit);
  }

  // Clear optimization history
  clearOptimizationHistory() {
    this.optimizationHistory = [];
  }
}

module.exports = new PerformanceOptimizer();
