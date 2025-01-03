// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./api/middleware/error-handler');
const authRoutes = require('./api/routes/auth.routes');
const config = require('./config/app.config');
const { RedisService } = require('./services/redis.service');
const { MessageQueue } = require('./utils/message-queue');

class App {
  constructor() {
    this.app = express();
    this.redis = new RedisService();
    this.messageQueue = new MessageQueue();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Compression
    this.app.use(compression());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        service: config.service.name,
        version: config.service.version,
        status: 'healthy'
      });
    });
  }

  setupRoutes() {
    this.app.use('/api/v1/auth', authRoutes);
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  getRedisService() {
    return this.redis;
  }

  getMessageQueue() {
    return this.messageQueue;
  }

  start() {
    const port = config.service.port;
    
    const server = this.app.listen(port, () => {
      console.log(`${config.service.name} listening on port ${port}`);
    });

    return server;
  }
}

module.exports = new App();
