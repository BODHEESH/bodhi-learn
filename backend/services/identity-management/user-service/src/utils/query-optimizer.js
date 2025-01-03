// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\query-optimizer.js

// Query optimization utilities
const { sequelize } = require('../database/connection');
const { redis } = require('../services/redis.service');
const logger = require('./logger');
const { metrics } = require('./metrics');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.queryStats = new Map();
  }

  // Analyze and optimize query
  async optimizeQuery(query, params = {}) {
    const startTime = process.hrtime();
    
    try {
      // Generate query plan
      const queryPlan = await sequelize.query(`EXPLAIN ANALYZE ${query}`, {
        type: sequelize.QueryTypes.RAW,
        replacements: params
      });

      // Analyze query performance
      const duration = process.hrtime(startTime);
      const executionTime = duration[0] * 1000 + duration[1] / 1e6;

      // Track query statistics
      this.updateQueryStats(query, executionTime);

      // Suggest optimizations
      const optimizations = this.analyzeQueryPlan(queryPlan);

      return {
        originalQuery: query,
        queryPlan,
        executionTime,
        optimizations
      };
    } catch (error) {
      logger.error('Query optimization failed:', error);
      metrics.queryOptimizationErrors.inc();
      throw error;
    }
  }

  // Analyze query plan and suggest optimizations
  analyzeQueryPlan(queryPlan) {
    const optimizations = [];

    // Check for sequential scans
    if (queryPlan.some(plan => plan.includes('Seq Scan'))) {
      optimizations.push({
        type: 'INDEX',
        message: 'Consider adding an index to avoid sequential scan'
      });
    }

    // Check for high-cost operations
    if (queryPlan.some(plan => plan.includes('cost='))) {
      const costPattern = /cost=(\d+\.\d+)\.\.(\d+\.\d+)/;
      const costs = queryPlan
        .map(plan => {
          const match = plan.match(costPattern);
          return match ? parseFloat(match[2]) : 0;
        })
        .filter(cost => cost > 0);

      if (costs.some(cost => cost > 1000)) {
        optimizations.push({
          type: 'PERFORMANCE',
          message: 'High-cost operation detected, consider query restructuring'
        });
      }
    }

    return optimizations;
  }

  // Update query statistics
  updateQueryStats(query, executionTime) {
    const stats = this.queryStats.get(query) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0
    };

    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);

    this.queryStats.set(query, stats);
    
    // Update metrics
    metrics.queryExecutionTime.observe(executionTime);
  }

  // Get query statistics
  getQueryStats(query) {
    return this.queryStats.get(query);
  }

  // Clear query statistics
  clearQueryStats() {
    this.queryStats.clear();
  }
}

module.exports = new QueryOptimizer();
