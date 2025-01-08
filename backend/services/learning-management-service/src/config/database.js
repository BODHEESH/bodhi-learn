const mongoose = require('mongoose');
const config = require('./config');
const logger = require('./logger');
const { createIndexes } = require('../models/indexes');

class Database {
    constructor() {
        this.mongoose = mongoose;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) {
            logger.info('Database already connected');
            return;
        }

        try {
            await this.mongoose.connect(config.database.url, config.database.options);
            this.isConnected = true;
            logger.info('Successfully connected to database');

            // Create indexes in development/staging environments
            if (config.app.environment !== 'production') {
                await createIndexes(this.mongoose);
                logger.info('Database indexes created successfully');
            }

            // Handle connection events
            this.mongoose.connection.on('error', (error) => {
                logger.error('Database connection error:', error);
                this.isConnected = false;
            });

            this.mongoose.connection.on('disconnected', () => {
                logger.warn('Database disconnected');
                this.isConnected = false;
            });

            // Graceful shutdown
            process.on('SIGINT', async () => {
                try {
                    await this.mongoose.connection.close();
                    logger.info('Database connection closed through app termination');
                    process.exit(0);
                } catch (error) {
                    logger.error('Error closing database connection:', error);
                    process.exit(1);
                }
            });

        } catch (error) {
            logger.error('Error connecting to database:', error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected) {
            logger.info('Database already disconnected');
            return;
        }

        try {
            await this.mongoose.connection.close();
            this.isConnected = false;
            logger.info('Database connection closed');
        } catch (error) {
            logger.error('Error disconnecting from database:', error);
            throw error;
        }
    }

    // Helper method to check connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            state: this.mongoose.connection.readyState
        };
    }

    // Method to clear database (useful for testing)
    async clearDatabase() {
        if (config.app.environment === 'production') {
            throw new Error('Cannot clear database in production environment');
        }

        try {
            const collections = await this.mongoose.connection.db.collections();
            for (let collection of collections) {
                await collection.deleteMany({});
            }
            logger.info('Database cleared successfully');
        } catch (error) {
            logger.error('Error clearing database:', error);
            throw error;
        }
    }
}

module.exports = new Database();