// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\__tests__\load\tenant.load.test.js

const autocannon = require('autocannon');
const { promisify } = require('util');
const logger = require('../../utils/logger');

const runBenchmark = promisify(autocannon);

const defaultConfig = {
  url: 'http://localhost:3000',
  connections: 10,
  duration: 10,
  headers: {
    'Content-Type': 'application/json'
  }
};

const scenarios = {
  getTenant: {
    ...defaultConfig,
    title: 'Get Tenant Details',
    method: 'GET',
    path: '/api/v1/tenants/:tenantId'
  },
  listTenants: {
    ...defaultConfig,
    title: 'List Tenants',
    method: 'GET',
    path: '/api/v1/tenants'
  },
  createTenant: {
    ...defaultConfig,
    title: 'Create Tenant',
    method: 'POST',
    path: '/api/v1/tenants',
    body: JSON.stringify({
      name: 'Load Test Tenant',
      type: 'BASIC'
    })
  },
  updateTenant: {
    ...defaultConfig,
    title: 'Update Tenant',
    method: 'PUT',
    path: '/api/v1/tenants/:tenantId',
    body: JSON.stringify({
      name: 'Updated Load Test Tenant'
    })
  }
};

class LoadTest {
  constructor(config = {}) {
    this.config = {
      ...defaultConfig,
      ...config
    };
    this.results = [];
  }

  // Run a single scenario
  async runScenario(scenario) {
    try {
      logger.info(`Starting load test scenario: ${scenario.title}`);
      
      const result = await runBenchmark({
        ...this.config,
        ...scenario
      });

      this.results.push({
        scenario: scenario.title,
        stats: {
          latency: {
            min: result.latency.min,
            max: result.latency.max,
            average: result.latency.average,
            p99: result.latency.p99
          },
          throughput: {
            average: result.throughput.average,
            max: result.throughput.max
          },
          errors: result.errors,
          timeouts: result.timeouts,
          duration: result.duration,
          connections: result.connections
        }
      });

      logger.info(`Completed load test scenario: ${scenario.title}`, {
        latencyAvg: result.latency.average,
        throughputAvg: result.throughput.average
      });

      return result;
    } catch (error) {
      logger.error(`Load test scenario failed: ${scenario.title}`, error);
      throw error;
    }
  }

  // Run all scenarios
  async runAll() {
    for (const [name, scenario] of Object.entries(scenarios)) {
      await this.runScenario(scenario);
    }
    return this.results;
  }

  // Generate report
  generateReport() {
    const report = {
      summary: {
        totalScenarios: this.results.length,
        timestamp: new Date().toISOString(),
        overallStatus: 'PASS'
      },
      scenarios: this.results.map(result => ({
        ...result,
        status: this._evaluateScenarioStatus(result.stats)
      }))
    };

    // Determine overall status
    if (report.scenarios.some(s => s.status === 'FAIL')) {
      report.summary.overallStatus = 'FAIL';
    }

    return report;
  }

  // Evaluate scenario status based on thresholds
  _evaluateScenarioStatus(stats) {
    const thresholds = {
      latency: {
        p99: 1000, // 1 second
        average: 500 // 500ms
      },
      errorRate: 0.01 // 1%
    };

    if (
      stats.latency.p99 > thresholds.latency.p99 ||
      stats.latency.average > thresholds.latency.average ||
      (stats.errors / stats.throughput.average) > thresholds.errorRate
    ) {
      return 'FAIL';
    }

    return 'PASS';
  }

  // Save report to file
  async saveReport(report, filename) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const reportPath = path.join(__dirname, '..', '..', 'reports', 'load-tests');
    await fs.mkdir(reportPath, { recursive: true });
    
    const reportFile = path.join(
      reportPath,
      `${filename || 'load-test-report'}-${Date.now()}.json`
    );
    
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    logger.info(`Load test report saved to: ${reportFile}`);
  }
}

// Example usage in Jest test suite
describe('Tenant Service Load Tests', () => {
  let loadTest;

  beforeAll(() => {
    loadTest = new LoadTest({
      duration: 30, // 30 seconds per scenario
      connections: 50 // 50 concurrent connections
    });
  });

  it('should handle high load for all scenarios', async () => {
    const results = await loadTest.runAll();
    const report = loadTest.generateReport();
    await loadTest.saveReport(report);

    // Assertions
    expect(report.summary.overallStatus).toBe('PASS');
    expect(report.scenarios).toHaveLength(Object.keys(scenarios).length);

    // Check each scenario
    report.scenarios.forEach(scenario => {
      expect(scenario.status).toBe('PASS');
      expect(scenario.stats.latency.p99).toBeLessThan(1000);
      expect(scenario.stats.latency.average).toBeLessThan(500);
      expect(scenario.stats.errors).toBe(0);
    });
  }, 120000); // 2 minutes timeout
});
