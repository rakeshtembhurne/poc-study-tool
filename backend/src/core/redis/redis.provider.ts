import Redis from 'ioredis';
import { Logger } from '@nestjs/common';
import { RedisConfig } from '../config/interfaces/config.interface';

export function createRedisClient(config: RedisConfig): Redis {
  const logger = new Logger('RedisProvider');

  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    retryStrategy: (times) => {
      if (times > config.maxRetriesPerRequest) {
        logger.error('Redis connection failed after maximum retries');
        return null;
      }
      const delay = Math.min(times * 1000, 3000);
      logger.warn(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    enableOfflineQueue: true,
    lazyConnect: false,
  });

  client.on('connect', () => {
    logger.log('Connected to Redis');
  });

  client.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    logger.log(`Reconnecting to Redis in ${delay}ms`);
  });

  return client;
}
