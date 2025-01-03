// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\performance.js

const { performance } = require('perf_hooks');
const logger = require('./logger');
const { metrics } = require('./metrics');

class PerformanceMonitor {
  constructor() {
    this.measurements = new Map();
    this.thresholds = {
      API_RESPONSE: 1000, // 1 second
      DB_QUERY: 500, // 500ms
      CACHE_OPERATION: 100, // 100ms
      EVENT_PROCESSING: 200 // 200ms
    };
  }

  // Start measuring performance
  startMeasurement(operationId, type) {
    const start = performance.now();
    this.measurements.set(operationId, {
      start,
      type,
      marks: []
    });
    return operationId;
  }

  // Add performance mark during operation
  addMark(operationId, markName) {
    const measurement = this.measurements.get(operationId);
    if (measurement) {
      measurement.marks.push({
        name: markName,
        timestamp: performance.now()
      });
    }
  }

  // End measurement and get results
  endMeasurement(operationId) {
    const measurement = this.measurements.get(operationId);
    if (!measurement) return null;

    const end = performance.now();
    const duration = end - measurement.start;

    // Record metrics based on operation type
    this._recordMetrics(measurement.type, duration);

    // Check if duration exceeds threshold
    this._checkThreshold(measurement.type, duration, operationId);

    // Calculate durations between marks
    const markDurations = this._calculateMarkDurations(measurement.marks);

    const result = {
      operationId,
      type: measurement.type,
      totalDuration: duration,
      marks: markDurations
    };

    this.measurements.delete(operationId);
    return result;
  }

  // Record metrics based on operation type
  _recordMetrics(type, duration) {
    switch (type) {
      case 'API_RESPONSE':
        metrics.httpRequestDuration.observe({ operation_type: type }, duration / 1000);
        break;
      case 'DB_QUERY':
        metrics.dbQueryDuration.observe({ operation_type: type }, duration / 1000);
        break;
      case 'CACHE_OPERATION':
        metrics.messageProcessingDuration.observe(
          { operation_type: type },
          duration / 1000
        );
        break;
      case 'EVENT_PROCESSING':
        metrics.messageProcessingDuration.observe(
          { operation_type: type },
          duration / 1000
        );
        break;
    }
  }

  // Check if duration exceeds threshold
  _checkThreshold(type, duration, operationId) {
    const threshold = this.thresholds[type];
    if (threshold && duration > threshold) {
      logger.warn('Performance threshold exceeded', {
        type,
        duration,
        threshold,
        operationId
      });
    }
  }

  // Calculate durations between marks
  _calculateMarkDurations(marks) {
    const durations = [];
    for (let i = 0; i < marks.length - 1; i++) {
      durations.push({
        from: marks[i].name,
        to: marks[i + 1].name,
        duration: marks[i + 1].timestamp - marks[i].timestamp
      });
    }
    return durations;
  }

  // Update threshold for operation type
  updateThreshold(type, value) {
    if (this.thresholds.hasOwnProperty(type)) {
      this.thresholds[type] = value;
      logger.info('Performance threshold updated', { type, value });
    }
  }

  // Get current thresholds
  getThresholds() {
    return { ...this.thresholds };
  }

  // Clear all measurements
  clearMeasurements() {
    this.measurements.clear();
  }

  // Performance middleware for Express
  createPerformanceMiddleware() {
    return (req, res, next) => {
      const operationId = `${req.method}-${req.path}-${Date.now()}`;
      this.startMeasurement(operationId, 'API_RESPONSE');

      // Add response hook
      res.on('finish', () => {
        const result = this.endMeasurement(operationId);
        if (result) {
          logger.debug('API Response Performance', {
            method: req.method,
            path: req.path,
            duration: result.totalDuration,
            statusCode: res.statusCode
          });
        }
      });

      next();
    };
  }

  // Create performance wrapper for async functions
  async measureAsync(type, operation) {
    const operationId = `${type}-${Date.now()}`;
    this.startMeasurement(operationId, type);

    try {
      const result = await operation();
      const measurement = this.endMeasurement(operationId);
      
      logger.debug('Async Operation Performance', {
        type,
        duration: measurement.totalDuration
      });

      return result;
    } catch (error) {
      this.measurements.delete(operationId);
      throw error;
    }
  }

  // Create performance wrapper for sync functions
  measureSync(type, operation) {
    const operationId = `${type}-${Date.now()}`;
    this.startMeasurement(operationId, type);

    try {
      const result = operation();
      const measurement = this.endMeasurement(operationId);

      logger.debug('Sync Operation Performance', {
        type,
        duration: measurement.totalDuration
      });

      return result;
    } catch (error) {
      this.measurements.delete(operationId);
      throw error;
    }
  }
}

module.exports = new PerformanceMonitor();
