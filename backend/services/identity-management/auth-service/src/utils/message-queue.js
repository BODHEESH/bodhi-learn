// \d\DREAM\bodhi-learn\backend\services\identity-management\auth-service\src\utils\message-queue.js

const amqp = require('amqplib');
const config = require('../config/app.config');
const logger = require('./logger');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connected = false;
    this.reconnectTimeout = null;
  }

  async connect() {
    if (this.connected) return;

    try {
      const { url, username, password, vhost } = config.rabbitmq;
      const connectionUrl = `amqp://${username}:${password}@${url.split('://')[1]}${vhost}`;
      
      this.connection = await amqp.connect(connectionUrl);
      this.channel = await this.connection.createChannel();
      this.connected = true;

      // Setup exchange
      await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', {
        durable: true
      });

      // Setup queue
      await this.channel.assertQueue(config.rabbitmq.queue, {
        durable: true
      });

      logger.info('Connected to RabbitMQ');

      // Handle connection events
      this.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        this.handleDisconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleDisconnect();
      });

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.channel = null;
    this.connection = null;

    // Clear any existing reconnection timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Attempt to reconnect after 5 seconds
    this.reconnectTimeout = setTimeout(() => {
      logger.info('Attempting to reconnect to RabbitMQ...');
      this.connect();
    }, 5000);
  }

  async publish(routingKey, message, options = {}) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const success = this.channel.publish(
        config.rabbitmq.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          ...options
        }
      );

      if (!success) {
        throw new Error('Message was not published successfully');
      }

      logger.debug(`Published message to ${routingKey}:`, message);
    } catch (error) {
      logger.error(`Error publishing message to ${routingKey}:`, error);
      throw error;
    }
  }

  async subscribe(routingKey, handler) {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // Bind queue to exchange with routing key
      await this.channel.bindQueue(config.rabbitmq.queue, config.rabbitmq.exchange, routingKey);

      // Start consuming messages
      await this.channel.consume(config.rabbitmq.queue, async (msg) => {
        if (msg === null) {
          logger.warn('Consumer cancelled by server');
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          this.channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          // Reject the message and requeue if it's not a parsing error
          this.channel.reject(msg, !error instanceof SyntaxError);
        }
      });

      logger.info(`Subscribed to ${routingKey} messages`);
    } catch (error) {
      logger.error(`Error subscribing to ${routingKey}:`, error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.connected = false;
      logger.info('Closed RabbitMQ connection');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection:', error);
      throw error;
    }
  }
}

module.exports = { MessageQueue };
