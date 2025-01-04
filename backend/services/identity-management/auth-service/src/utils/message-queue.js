const amqp = require('amqplib');
const config = require('../config/app.config');
const logger = require('./logger');
const { MessageQueueError } = require('./errors');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connected = false;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.consumers = new Map();
  }

  async connect() {
    if (this.connected) return;

    try {
      const { url, username, password, vhost } = config.rabbitmq;
      const connectionUrl = `amqp://${username}:${password}@${url.split('://')[1]}${vhost}`;
      
      this.connection = await amqp.connect(connectionUrl, {
        heartbeat: 60,
        timeout: 5000
      });
      
      this.channel = await this.connection.createChannel();
      this.connected = true;
      this.reconnectAttempts = 0;

      // Configure channel
      await this.channel.prefetch(1);

      // Setup exchange
      await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', {
        durable: true,
        autoDelete: false
      });

      // Setup queues
      const queues = [
        { name: 'auth_events', pattern: 'auth.#' },
        { name: 'user_events', pattern: 'user.#' },
        { name: 'notification_events', pattern: 'notification.#' }
      ];

      for (const queue of queues) {
        await this.channel.assertQueue(queue.name, {
          durable: true,
          autoDelete: false
        });
        await this.channel.bindQueue(queue.name, config.rabbitmq.exchange, queue.pattern);
      }

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

      this.channel.on('error', (error) => {
        logger.error('RabbitMQ channel error:', error);
      });

      this.channel.on('close', () => {
        logger.warn('RabbitMQ channel closed');
      });

    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.handleDisconnect();
      throw new MessageQueueError('Failed to connect to message queue');
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.channel = null;
    this.connection = null;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    logger.info('Scheduling reconnection attempt', {
      attempt: this.reconnectAttempts,
      delay
    });

    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        logger.error('Reconnection attempt failed:', error);
      });
    }, delay);
  }

  async publish(routingKey, data, options = {}) {
    if (!this.connected) {
      throw new MessageQueueError('Message queue is not connected');
    }

    try {
      const message = {
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          correlationId: options.correlationId || crypto.randomUUID()
        }
      };

      const success = this.channel.publish(
        config.rabbitmq.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          ...options,
          headers: {
            'x-retry-count': 0,
            ...options.headers
          }
        }
      );

      if (!success) {
        throw new MessageQueueError('Failed to publish message');
      }

      logger.debug('Message published', {
        routingKey,
        correlationId: message.metadata.correlationId
      });

    } catch (error) {
      logger.error('Error publishing message:', error);
      throw new MessageQueueError('Failed to publish message');
    }
  }

  async subscribe(queue, handler) {
    if (!this.connected) {
      throw new MessageQueueError('Message queue is not connected');
    }

    try {
      const consumer = await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          const message = JSON.parse(msg.content.toString());
          const retryCount = msg.properties.headers['x-retry-count'] || 0;

          logger.debug('Message received', {
            queue,
            correlationId: message.metadata.correlationId
          });

          await handler(message.data, message.metadata);
          this.channel.ack(msg);

        } catch (error) {
          logger.error('Error processing message:', error);

          // Handle retries
          const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
          const maxRetries = 3;

          if (retryCount <= maxRetries) {
            this.channel.publish(
              config.rabbitmq.exchange,
              msg.fields.routingKey,
              msg.content,
              {
                ...msg.properties,
                headers: {
                  ...msg.properties.headers,
                  'x-retry-count': retryCount
                }
              }
            );
            this.channel.ack(msg);
          } else {
            // Send to dead letter queue
            this.channel.reject(msg, false);
          }
        }
      });

      this.consumers.set(queue, consumer);
      logger.info('Subscribed to queue', { queue });

    } catch (error) {
      logger.error('Error subscribing to queue:', error);
      throw new MessageQueueError('Failed to subscribe to queue');
    }
  }

  async unsubscribe(queue) {
    if (!this.connected) return;

    try {
      const consumer = this.consumers.get(queue);
      if (consumer) {
        await this.channel.cancel(consumer.consumerTag);
        this.consumers.delete(queue);
        logger.info('Unsubscribed from queue', { queue });
      }
    } catch (error) {
      logger.error('Error unsubscribing from queue:', error);
    }
  }

  async shutdown() {
    try {
      // Unsubscribe from all queues
      for (const [queue] of this.consumers) {
        await this.unsubscribe(queue);
      }

      // Close channel and connection
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }

      clearTimeout(this.reconnectTimeout);
      this.connected = false;
      logger.info('Message queue shutdown complete');
    } catch (error) {
      logger.error('Error during message queue shutdown:', error);
      throw new MessageQueueError('Failed to shutdown message queue');
    }
  }
}

// Create a singleton instance
const messageQueue = new MessageQueue();

module.exports = { messageQueue };
