// logging.config.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');
const prometheusClient = require('prom-client');

// Initialize Prometheus metrics
const metrics = {
    httpRequestDuration: new prometheusClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5]
    }),
    serviceHealthStatus: new prometheusClient.Gauge({
        name: 'service_health_status',
        help: 'Health status of microservices',
        labelNames: ['service']
    })
};

// Winston logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: process.env.SERVICE_NAME },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        // Elasticsearch transport for production
        new ElasticsearchTransport({
            level: 'info',
            index: 'logs-' + process.env.NODE_ENV,
            clientOpts: {
                node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
            }
        })
    ]
});

// Monitoring middleware
const monitoringMiddleware = (req, res, next) => {
    const start = Date.now();

    // Record response time on request completion
    res.on('finish', () => {
        const duration = Date.now() - start;
        metrics.httpRequestDuration.labels(
            req.method,
            req.route?.path || req.path,
            res.statusCode
        ).observe(duration / 1000);
    });

    next();
};

module.exports = {
    logger,
    metrics,
    monitoringMiddleware
};