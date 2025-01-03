// \d\DREAM\bodhi-learn\backend\services\identity-management\user-service\src\utils\message-queue.js

const amqp = require('amqplib');
const config = require('../config/app.config');
const logger = require('./logger');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connected = false;
    this.reconnectTimeout = null;
    this.consumers = new Map();
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      this.connected = true;

      // Set up error handlers
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        logger.error('RabbitMQ connection closed');
        this.handleDisconnect();
      });

      // Set up exchanges
      await this.setupExchanges();

      logger.info('Connected to RabbitMQ');
      return true;
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
      return false;
    }
  }

  async setupExchanges() {
    const { exchanges } = config.rabbitmq;
    for (const [name, type] of Object.entries(exchanges)) {
      await this.channel.assertExchange(name, 'topic', {
        durable: true
      });
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.channel = null;
    this.connection = null;

    // Clear existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Attempt to reconnect
    this.reconnectTimeout = setTimeout(async () => {
      logger.info('Attempting to reconnect to RabbitMQ...');
      await this.connect();

      // Resubscribe all consumers
      if (this.connected) {
        for (const [queue, handler] of this.consumers.entries()) {
          await this.subscribe(queue, handler);
        }
      }
    }, 5000);
  }

  async publish(exchange, routingKey, message) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json'
        }
      );

      logger.debug('Published message:', { exchange, routingKey, message });
      return true;
    } catch (error) {
      logger.error('Failed to publish message:', error);
      return false;
    }
  }

  async subscribe(queue, handler) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      // Assert queue
      await this.channel.assertQueue(queue, {
        durable: true
      });

      // Bind queue to exchange with routing pattern
      const { exchanges } = config.rabbitmq;
      for (const exchange of Object.keys(exchanges)) {
        await this.channel.bindQueue(queue, exchange, '#');
      }

      // Set up consumer
      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg);
            this.channel.ack(msg);
          } catch (error) {
            logger.error('Error processing message:', error);
            // Reject and requeue if it's a temporary error
            this.channel.reject(msg, error.temporary === true);
          }
        }
      });

      // Store consumer handler for reconnection
      this.consumers.set(queue, handler);
      logger.info(`Subscribed to queue: ${queue}`);
      return true;
    } catch (error) {
      logger.error('Failed to subscribe:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.connected = false;
      this.consumers.clear();
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}

module.exports = {
  MessageQueue,
  messageQueue: new MessageQueue() // Export singleton instance
};
