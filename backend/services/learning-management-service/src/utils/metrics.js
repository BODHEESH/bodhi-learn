const promClient = require('prom-client');
const logger = require('../config/logger');

class MetricsManager {
    constructor() {
        // Initialize Prometheus registry
        this.registry = new promClient.Registry();
        
        // Add default metrics
        promClient.collectDefaultMetrics({ register: this.registry });

        // Initialize custom metrics
        this.initializeMetrics();
    }

    initializeMetrics() {
        // Content metrics
        this.contentCreated = new promClient.Counter({
            name: 'content_created_total',
            help: 'Total number of content items created',
            labelNames: ['type', 'organization', 'tenant']
        });

        this.contentViewed = new promClient.Counter({
            name: 'content_viewed_total',
            help: 'Total number of content views',
            labelNames: ['type', 'organization', 'tenant']
        });

        // Media metrics
        this.mediaUploaded = new promClient.Counter({
            name: 'media_uploaded_total',
            help: 'Total number of media files uploaded',
            labelNames: ['type', 'organization', 'tenant']
        });

        this.mediaProcessingTime = new promClient.Histogram({
            name: 'media_processing_duration_seconds',
            help: 'Media processing duration in seconds',
            labelNames: ['type', 'operation']
        });

        // Storage metrics
        this.storageUsage = new promClient.Gauge({
            name: 'storage_usage_bytes',
            help: 'Storage usage in bytes',
            labelNames: ['provider', 'organization', 'tenant']
        });

        // API metrics
        this.apiLatency = new promClient.Histogram({
            name: 'api_request_duration_seconds',
            help: 'API request duration in seconds',
            labelNames: ['method', 'route', 'status']
        });

        this.apiErrors = new promClient.Counter({
            name: 'api_errors_total',
            help: 'Total number of API errors',
            labelNames: ['method', 'route', 'status']
        });

        // Cache metrics
        this.cacheHits = new promClient.Counter({
            name: 'cache_hits_total',
            help: 'Total number of cache hits',
            labelNames: ['cache']
        });

        this.cacheMisses = new promClient.Counter({
            name: 'cache_misses_total',
            help: 'Total number of cache misses',
            labelNames: ['cache']
        });

        // Register all metrics
        [
            this.contentCreated,
            this.contentViewed,
            this.mediaUploaded,
            this.mediaProcessingTime,
            this.storageUsage,
            this.apiLatency,
            this.apiErrors,
            this.cacheHits,
            this.cacheMisses
        ].forEach(metric => this.registry.registerMetric(metric));
    }

    // Content metrics methods
    recordContentCreation(type, organization, tenant) {
        this.contentCreated.labels(type, organization, tenant).inc();
    }

    recordContentView(type, organization, tenant) {
        this.contentViewed.labels(type, organization, tenant).inc();
    }

    // Media metrics methods
    recordMediaUpload(type, organization, tenant) {
        this.mediaUploaded.labels(type, organization, tenant).inc();
    }

    recordMediaProcessing(type, operation, duration) {
        this.mediaProcessingTime.labels(type, operation).observe(duration);
    }

    // Storage metrics methods
    updateStorageUsage(provider, organization, tenant, bytes) {
        this.storageUsage.labels(provider, organization, tenant).set(bytes);
    }

    // API metrics methods
    recordApiLatency(method, route, status, duration) {
        this.apiLatency.labels(method, route, status).observe(duration);
    }

    recordApiError(method, route, status) {
        this.apiErrors.labels(method, route, status).inc();
    }

    // Cache metrics methods
    recordCacheHit(cache) {
        this.cacheHits.labels(cache).inc();
    }

    recordCacheMiss(cache) {
        this.cacheMisses.labels(cache).inc();
    }

    // Get metrics
    async getMetrics() {
        try {
            return await this.registry.metrics();
        } catch (error) {
            logger.error('Error collecting metrics:', error);
            throw error;
        }
    }
}

module.exports = new MetricsManager();
