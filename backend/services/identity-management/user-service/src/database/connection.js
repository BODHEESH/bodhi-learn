// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\database\connection.js

const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const config = require('../config/app.config');
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

// PostgreSQL connection with optimized pooling
const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    statement_timeout: 5000,
    idle_in_transaction_session_timeout: 5000
  },
  define: {
    timestamps: true,
    paranoid: true
  }
});

// MongoDB connection with optimized settings
const mongoConnect = async () => {
  try {
    await mongoose.connect(config.mongodb.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      minPoolSize: 5,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    // Add connection monitoring
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      metrics.errorCounter.inc({ type: 'mongodb_error' });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Add performance hooks
    mongoose.connection.on('open', () => {
      mongoose.connection.db.admin().serverStatus((err, stats) => {
        if (!err) {
          metrics.mongodbConnections.set(stats.connections.current);
        }
      });
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    metrics.errorCounter.inc({ type: 'mongodb_connection_error' });
    throw error;
  }
};

// Connection health check
const healthCheck = async () => {
  try {
    // Check PostgreSQL
    await sequelize.authenticate();
    
    // Check MongoDB
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }

    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  mongoConnect,
  healthCheck
};
