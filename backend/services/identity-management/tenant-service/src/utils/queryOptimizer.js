// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\queryOptimizer.js

const { Op } = require('sequelize');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');
const { metrics } = require('./metrics');

class QueryOptimizer {
  constructor() {
    this.redis = new Redis(config.redis.url);
    this.defaultTTL = 3600; // 1 hour
  }

  // Generate cache key based on query parameters
  generateCacheKey(model, query, includes = []) {
    const queryString = JSON.stringify({
      model: model.name,
      query,
      includes: includes.map(include => include.model.name)
    });
    return `query:${Buffer.from(queryString).toString('base64')}`;
  }

  // Cache query results
  async cacheResults(key, data, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
      metrics.cacheHits.inc({ cache_type: 'query' });
    } catch (error) {
      logger.error('Error caching query results:', error);
    }
  }

  // Get cached results
  async getCachedResults(key) {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        metrics.cacheHits.inc({ cache_type: 'query' });
        return JSON.parse(cached);
      }
      metrics.cacheMisses.inc({ cache_type: 'query' });
      return null;
    } catch (error) {
      logger.error('Error getting cached results:', error);
      return null;
    }
  }

  // Optimize query based on parameters
  optimizeQuery(query, options = {}) {
    const optimizedQuery = { ...query };

    // Add index hints if available
    if (options.useIndex) {
      optimizedQuery.useIndex = options.useIndex;
    }

    // Limit fields if not specifically requested
    if (!options.includeAllFields && !optimizedQuery.attributes) {
      optimizedQuery.attributes = options.defaultFields || ['id', 'createdAt', 'updatedAt'];
    }

    // Add pagination if not present
    if (!optimizedQuery.limit) {
      optimizedQuery.limit = options.defaultLimit || 10;
    }
    if (!optimizedQuery.offset && optimizedQuery.page) {
      optimizedQuery.offset = (optimizedQuery.page - 1) * optimizedQuery.limit;
    }

    return optimizedQuery;
  }

  // Execute optimized query with caching
  async executeQuery(model, query, options = {}) {
    const optimizedQuery = this.optimizeQuery(query, options);
    const cacheKey = this.generateCacheKey(model, optimizedQuery, options.include);

    // Try to get from cache first
    if (!options.skipCache) {
      const cached = await this.getCachedResults(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query and measure performance
    const start = process.hrtime();
    try {
      const results = await model.findAll(optimizedQuery);
      const duration = process.hrtime(start);
      const durationInSeconds = duration[0] + duration[1] / 1e9;

      // Record query duration
      metrics.dbQueryDuration.observe(
        {
          query_type: 'findAll',
          table: model.tableName
        },
        durationInSeconds
      );

      // Cache results if needed
      if (!options.skipCache) {
        await this.cacheResults(cacheKey, results);
      }

      return results;
    } catch (error) {
      logger.error('Error executing optimized query:', error);
      throw error;
    }
  }

  // Bulk operation optimizer
  async executeBulkOperation(model, operations, options = {}) {
    const batchSize = options.batchSize || 1000;
    const results = [];
    const batches = this.chunkArray(operations, batchSize);

    for (const batch of batches) {
      const start = process.hrtime();
      try {
        const batchResults = await model.bulkCreate(batch, options);
        results.push(...batchResults);

        const duration = process.hrtime(start);
        metrics.dbQueryDuration.observe(
          {
            query_type: 'bulkCreate',
            table: model.tableName
          },
          duration[0] + duration[1] / 1e9
        );
      } catch (error) {
        logger.error('Error in bulk operation:', error);
        throw error;
      }
    }

    return results;
  }

  // Helper function to chunk array for batch processing
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Clear cache for a model
  async clearModelCache(model) {
    try {
      const keys = await this.redis.keys(`query:${model.name}:*`);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      logger.error('Error clearing model cache:', error);
    }
  }
}

module.exports = new QueryOptimizer();
