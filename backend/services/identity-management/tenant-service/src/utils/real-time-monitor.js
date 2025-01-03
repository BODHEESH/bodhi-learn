// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\real-time-monitor.js

const EventEmitter = require('events');
const logger = require('./logger');
const { metrics } = require('./metrics');
const performanceMonitor = require('./performance');
const performanceOptimizer = require('./performance-optimizer');

class RealTimeMonitor extends EventEmitter {
  constructor() {
    super();
    this.isMonitoring = false;
    this.metrics = new Map();
    this.alerts = [];
    this.monitoringInterval = 1000; // 1 second
    this.retentionPeriod = 3600000; // 1 hour
  }

  // Start real-time monitoring
  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeMetrics();
      this.cleanupOldData();
    }, this.monitoringInterval);

    logger.info('Real-time monitoring started');
  }

  // Stop real-time monitoring
  stop() {
    if (!this.isMonitoring) return;

    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    logger.info('Real-time monitoring stopped');
  }

  // Collect current metrics
  async collectMetrics() {
    try {
      const currentMetrics = {
        timestamp: Date.now(),
        performance: await this.collectPerformanceMetrics(),
        resources: await this.collectResourceMetrics(),
        application: await this.collectApplicationMetrics()
      };

      this.metrics.set(currentMetrics.timestamp, currentMetrics);
      this.emit('metrics', currentMetrics);
    } catch (error) {
      logger.error('Error collecting real-time metrics:', error);
    }
  }

  // Collect performance metrics
  async collectPerformanceMetrics() {
    return {
      responseTime: await metrics.httpRequestDuration.get(),
      dbQueryTime: await metrics.dbQueryDuration.get(),
      cachePerformance: {
        hits: await metrics.cacheHits.get(),
        misses: await metrics.cacheMisses.get()
      }
    };
  }

  // Collect resource metrics
  async collectResourceMetrics() {
    const os = require('os');
    return {
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: os.loadavg()
      },
      memory: {
        used: process.memoryUsage(),
        system: {
          total: os.totalmem(),
          free: os.freemem()
        }
      },
      network: await this.getNetworkMetrics()
    };
  }

  // Collect application metrics
  async collectApplicationMetrics() {
    return {
      activeRequests: await metrics.apiRequests.get(),
      errorCount: await metrics.apiErrors.get(),
      activeConnections: await this.getActiveConnections(),
      queueSize: await metrics.messageQueueSize.get()
    };
  }

  // Get network metrics
  async getNetworkMetrics() {
    const networkStats = require('os').networkInterfaces();
    return Object.entries(networkStats).reduce((acc, [name, interfaces]) => {
      acc[name] = interfaces.map(iface => ({
        address: iface.address,
        netmask: iface.netmask,
        family: iface.family,
        mac: iface.mac,
        internal: iface.internal
      }));
      return acc;
    }, {});
  }

  // Get active connections
  async getActiveConnections() {
    // Implementation depends on your server setup
    return 0; // Placeholder
  }

  // Analyze collected metrics
  async analyzeMetrics() {
    const latestMetrics = Array.from(this.metrics.values()).pop();
    if (!latestMetrics) return;

    // Check for performance issues
    await this.checkPerformanceIssues(latestMetrics);

    // Check for resource issues
    await this.checkResourceIssues(latestMetrics);

    // Check for application issues
    await this.checkApplicationIssues(latestMetrics);

    // Run optimization if needed
    await this.triggerOptimization(latestMetrics);
  }

  // Check for performance issues
  async checkPerformanceIssues(metrics) {
    const { performance } = metrics;

    if (performance.responseTime > 1000) {
      this.createAlert('HIGH_RESPONSE_TIME', {
        value: performance.responseTime,
        threshold: 1000
      });
    }

    if (performance.dbQueryTime > 500) {
      this.createAlert('SLOW_DB_QUERY', {
        value: performance.dbQueryTime,
        threshold: 500
      });
    }
  }

  // Check for resource issues
  async checkResourceIssues(metrics) {
    const { resources } = metrics;

    // Check CPU usage
    if (resources.cpu.loadAverage[0] > 80) {
      this.createAlert('HIGH_CPU_USAGE', {
        value: resources.cpu.loadAverage[0],
        threshold: 80
      });
    }

    // Check memory usage
    const memoryUsage = (resources.memory.used.heapUsed / resources.memory.used.heapTotal) * 100;
    if (memoryUsage > 85) {
      this.createAlert('HIGH_MEMORY_USAGE', {
        value: memoryUsage,
        threshold: 85
      });
    }
  }

  // Check for application issues
  async checkApplicationIssues(metrics) {
    const { application } = metrics;

    // Check error rate
    const errorRate = (application.errorCount / application.activeRequests) * 100;
    if (errorRate > 5) {
      this.createAlert('HIGH_ERROR_RATE', {
        value: errorRate,
        threshold: 5
      });
    }

    // Check queue size
    if (application.queueSize > 1000) {
      this.createAlert('LARGE_QUEUE_SIZE', {
        value: application.queueSize,
        threshold: 1000
      });
    }
  }

  // Create and emit alert
  createAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    this.emit('alert', alert);

    logger.warn('Real-time monitoring alert', { type, data });
  }

  // Trigger optimization if needed
  async triggerOptimization(metrics) {
    try {
      const optimizations = await performanceOptimizer.runOptimizationChecks();
      if (optimizations.length > 0) {
        this.emit('optimization', optimizations);
      }
    } catch (error) {
      logger.error('Error running optimizations:', error);
    }
  }

  // Clean up old data
  cleanupOldData() {
    const cutoffTime = Date.now() - this.retentionPeriod;

    // Clean up old metrics
    for (const [timestamp] of this.metrics) {
      if (timestamp < cutoffTime) {
        this.metrics.delete(timestamp);
      }
    }

    // Clean up old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  // Get current metrics
  getCurrentMetrics() {
    return Array.from(this.metrics.values()).pop();
  }

  // Get metrics history
  getMetricsHistory(duration = 3600000) { // Default 1 hour
    const cutoffTime = Date.now() - duration;
    return Array.from(this.metrics.entries())
      .filter(([timestamp]) => timestamp > cutoffTime);
  }

  // Get active alerts
  getActiveAlerts() {
    return this.alerts;
  }
}

module.exports = new RealTimeMonitor();
