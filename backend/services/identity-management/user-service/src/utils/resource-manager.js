// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\resource-manager.js

// Resource management utilities
const os = require('os');
const v8 = require('v8');
const logger = require('./logger');
const { metrics } = require('./metrics');

class ResourceManager {
  constructor() {
    this.heapStats = {};
    this.cpuUsage = {};
    this.memoryUsage = {};
    this.resourceLimits = {
      maxMemoryUsage: 0.9, // 90% of total memory
      maxCpuUsage: 0.8,    // 80% of CPU
      maxEventLoopLag: 1000 // 1 second
    };
  }

  // Initialize resource monitoring
  initialize() {
    this.startMonitoring();
    this.setupEventLoopMonitoring();
    this.setupMemoryMonitoring();
    this.setupCPUMonitoring();
  }

  // Start resource monitoring
  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.checkResourceUsage();
    }, 5000);
  }

  // Collect resource metrics
  collectMetrics() {
    try {
      // Memory metrics
      const memoryUsage = process.memoryUsage();
      this.memoryUsage = {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      };

      // CPU metrics
      const cpuUsage = process.cpuUsage();
      this.cpuUsage = {
        user: cpuUsage.user,
        system: cpuUsage.system
      };

      // Heap statistics
      this.heapStats = v8.getHeapStatistics();

      // Update Prometheus metrics
      metrics.memoryUsage.set(this.memoryUsage.heapUsed / 1024 / 1024);
      metrics.cpuUsage.set({
        type: 'user'
      }, this.cpuUsage.user / 1000000);
      metrics.cpuUsage.set({
        type: 'system'
      }, this.cpuUsage.system / 1000000);
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  // Monitor event loop lag
  setupEventLoopMonitoring() {
    let lastCheck = Date.now();

    setInterval(() => {
      const now = Date.now();
      const lag = now - lastCheck - 1000;
      lastCheck = now;

      metrics.eventLoopLag.set(lag);

      if (lag > this.resourceLimits.maxEventLoopLag) {
        logger.warn('High event loop lag detected:', { lag });
        this.handleHighEventLoopLag(lag);
      }
    }, 1000);
  }

  // Monitor memory usage
  setupMemoryMonitoring() {
    const totalMemory = os.totalmem();
    
    setInterval(() => {
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsageRatio = usedMemory / totalMemory;

      metrics.systemMemoryUsage.set(memoryUsageRatio * 100);

      if (memoryUsageRatio > this.resourceLimits.maxMemoryUsage) {
        logger.warn('High memory usage detected:', {
          usedMemory,
          totalMemory,
          ratio: memoryUsageRatio
        });
        this.handleHighMemoryUsage();
      }
    }, 5000);
  }

  // Monitor CPU usage
  setupCPUMonitoring() {
    let lastCpuInfo = os.cpus();

    setInterval(() => {
      const currentCpuInfo = os.cpus();
      const cpuUsage = this.calculateCPUUsage(lastCpuInfo, currentCpuInfo);
      lastCpuInfo = currentCpuInfo;

      metrics.systemCpuUsage.set(cpuUsage * 100);

      if (cpuUsage > this.resourceLimits.maxCpuUsage) {
        logger.warn('High CPU usage detected:', { cpuUsage });
        this.handleHighCPUUsage();
      }
    }, 5000);
  }

  // Calculate CPU usage
  calculateCPUUsage(lastCpuInfo, currentCpuInfo) {
    let totalUser = 0;
    let totalSystem = 0;
    let totalIdle = 0;

    for (let i = 0; i < currentCpuInfo.length; i++) {
      const lastTimes = lastCpuInfo[i].times;
      const currentTimes = currentCpuInfo[i].times;

      totalUser += currentTimes.user - lastTimes.user;
      totalSystem += currentTimes.sys - lastTimes.sys;
      totalIdle += currentTimes.idle - lastTimes.idle;
    }

    const totalTime = totalUser + totalSystem + totalIdle;
    return (totalUser + totalSystem) / totalTime;
  }

  // Handle high event loop lag
  handleHighEventLoopLag(lag) {
    // Implement mitigation strategies
    if (lag > 5000) {
      this.forcefulResourceRecovery();
    } else {
      this.gracefulResourceRecovery();
    }
  }

  // Handle high memory usage
  handleHighMemoryUsage() {
    if (global.gc) {
      global.gc();
      logger.info('Garbage collection triggered');
    }

    // Clear internal caches
    this.clearInternalCaches();
  }

  // Handle high CPU usage
  handleHighCPUUsage() {
    // Implement CPU usage reduction strategies
    this.throttleNonCriticalOperations();
  }

  // Clear internal caches
  clearInternalCaches() {
    try {
      // Clear V8 compilation cache
      v8.clearFunctionEntryPointsInBytecode();
      v8.clearFunctionFeedback();

      logger.info('Internal caches cleared');
    } catch (error) {
      logger.error('Error clearing internal caches:', error);
    }
  }

  // Throttle non-critical operations
  throttleNonCriticalOperations() {
    // Implement throttling logic
    this.resourceLimits.maxConcurrentOperations = Math.max(
      1,
      Math.floor(this.resourceLimits.maxConcurrentOperations * 0.8)
    );
  }

  // Graceful resource recovery
  gracefulResourceRecovery() {
    this.clearInternalCaches();
    this.throttleNonCriticalOperations();
  }

  // Forceful resource recovery
  forcefulResourceRecovery() {
    if (global.gc) {
      global.gc();
    }
    this.clearInternalCaches();
    this.throttleNonCriticalOperations();
  }

  // Get current resource usage
  getResourceUsage() {
    return {
      memory: this.memoryUsage,
      cpu: this.cpuUsage,
      heap: this.heapStats
    };
  }
}

module.exports = new ResourceManager();
