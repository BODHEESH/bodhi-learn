// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\performance-dashboard.js

const express = require('express');
const socketIo = require('socket.io');
const { metrics } = require('./metrics');
const logger = require('./logger');
const performanceMonitor = require('./performance');

class PerformanceDashboard {
  constructor() {
    this.app = express();
    this.metrics = new Map();
    this.alerts = [];
    this.connectedClients = new Set();
    this.updateInterval = 5000; // 5 seconds
  }

  // Initialize dashboard server
  initialize(port = 3001) {
    const server = this.app.listen(port, () => {
      logger.info(`Performance dashboard running on port ${port}`);
    });

    this.io = socketIo(server);
    this.setupRoutes();
    this.setupWebSocket();
    this.startMetricsCollection();
  }

  // Setup Express routes
  setupRoutes() {
    // Serve dashboard UI
    this.app.get('/', (req, res) => {
      res.sendFile(__dirname + '/dashboard/index.html');
    });

    // API endpoints for metrics
    this.app.get('/api/metrics', (req, res) => {
      res.json(Array.from(this.metrics.entries()));
    });

    this.app.get('/api/alerts', (req, res) => {
      res.json(this.alerts);
    });

    this.app.get('/api/thresholds', (req, res) => {
      res.json(performanceMonitor.getThresholds());
    });
  }

  // Setup WebSocket for real-time updates
  setupWebSocket() {
    this.io.on('connection', (socket) => {
      this.connectedClients.add(socket);
      logger.info('Dashboard client connected');

      socket.on('disconnect', () => {
        this.connectedClients.delete(socket);
        logger.info('Dashboard client disconnected');
      });

      // Handle threshold updates
      socket.on('updateThreshold', (data) => {
        const { type, value } = data;
        performanceMonitor.updateThreshold(type, value);
        this.broadcastThresholds();
      });
    });
  }

  // Start collecting metrics
  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
      this.broadcastMetrics();
      this.checkAlerts();
    }, this.updateInterval);
  }

  // Collect current metrics
  async collectMetrics() {
    try {
      const currentMetrics = {
        timestamp: Date.now(),
        system: await this.collectSystemMetrics(),
        application: await this.collectAppMetrics(),
        database: await this.collectDbMetrics()
      };

      this.metrics.set(Date.now(), currentMetrics);

      // Keep only last hour of metrics
      const oneHourAgo = Date.now() - 3600000;
      for (const [timestamp] of this.metrics) {
        if (timestamp < oneHourAgo) {
          this.metrics.delete(timestamp);
        }
      }
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  // Collect system metrics
  async collectSystemMetrics() {
    const os = require('os');
    return {
      cpu: {
        loadAvg: os.loadavg(),
        usagePercent: process.cpuUsage()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usagePercent: (1 - os.freemem() / os.totalmem()) * 100
      },
      uptime: process.uptime()
    };
  }

  // Collect application metrics
  async collectAppMetrics() {
    return {
      requestRate: await metrics.apiRequests.get(),
      responseTime: await metrics.httpRequestDuration.get(),
      errorRate: await metrics.apiErrors.get(),
      activeConnections: this.connectedClients.size
    };
  }

  // Collect database metrics
  async collectDbMetrics() {
    return {
      queryDuration: await metrics.dbQueryDuration.get(),
      cacheHitRate: await this.calculateCacheHitRate(),
      activeQueries: await this.getActiveQueries()
    };
  }

  // Calculate cache hit rate
  async calculateCacheHitRate() {
    const hits = await metrics.cacheHits.get();
    const misses = await metrics.cacheMisses.get();
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  // Get active database queries
  async getActiveQueries() {
    // Implementation depends on your database
    return 0; // Placeholder
  }

  // Broadcast metrics to connected clients
  broadcastMetrics() {
    const latestMetrics = Array.from(this.metrics.entries())
      .slice(-10); // Send last 10 data points

    this.io.emit('metrics', latestMetrics);
  }

  // Broadcast thresholds to connected clients
  broadcastThresholds() {
    this.io.emit('thresholds', performanceMonitor.getThresholds());
  }

  // Check for performance alerts
  checkAlerts() {
    const latestMetrics = Array.from(this.metrics.values()).pop();
    if (!latestMetrics) return;

    const alerts = [];

    // Check CPU usage
    if (latestMetrics.system.cpu.loadAvg[0] > 80) {
      alerts.push({
        type: 'HIGH_CPU_USAGE',
        value: latestMetrics.system.cpu.loadAvg[0],
        timestamp: Date.now()
      });
    }

    // Check memory usage
    if (latestMetrics.system.memory.usagePercent > 90) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        value: latestMetrics.system.memory.usagePercent,
        timestamp: Date.now()
      });
    }

    // Check response time
    if (latestMetrics.application.responseTime > 1000) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        value: latestMetrics.application.responseTime,
        timestamp: Date.now()
      });
    }

    // Check error rate
    const errorRate = latestMetrics.application.errorRate;
    if (errorRate > 5) { // 5% error rate threshold
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        value: errorRate,
        timestamp: Date.now()
      });
    }

    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      this.io.emit('alerts', alerts);
      
      // Keep only recent alerts
      const fiveMinutesAgo = Date.now() - 300000;
      this.alerts = this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
    }
  }
}

module.exports = new PerformanceDashboard();
