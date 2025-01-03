// \d\DREAM\bodhi-learn\backend\services\identity-management\tenant-service\src\utils\queue.js

const amqp = require('amqplib');
const config = require('../config');
const logger = require('./logger');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      this.connected = true;
      logger.info('Successfully connected to RabbitMQ');
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async publishMessage(exchange, routingKey, message, options = {}) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        ...options
      });

      logger.debug(`Published message to ${exchange}:${routingKey}`, { message });
    } catch (error) {
      logger.error('Error publishing message:', error);
      throw error;
    }
  }

  async consumeMessage(exchange, queue, routingKey, handler) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);

      this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const message = JSON.parse(msg.content.toString());
            await handler(message);
            this.channel.ack(msg);
          } catch (error) {
            logger.error('Error processing message:', error);
            this.channel.nack(msg);
          }
        }
      });

      logger.info(`Started consuming messages from ${queue}`);
    } catch (error) {
      logger.error('Error setting up message consumer:', error);
      throw error;
    }
  }

  async closeConnection() {
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

module.exports = new MessageQueue();
