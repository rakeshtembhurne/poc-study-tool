import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  maxRetriesPerRequest: number;
  keyPrefix?: string;
  connectionName?: string;
  maxSessionsPerUser?: number;
  enableOfflineQueue?: boolean;
}

export function createOptimizedRedisClient(config: RedisConfig): Redis {
  const logger = new Logger('RedisProvider');

  const client = new Redis({
    // Connection settings
    host: config.host,
    port: config.port,
    password: config.password,
    db: config.db,
    connectionName: config.connectionName || 'pyramid-api',

    // Performance optimizations
    enableAutoPipelining: true, // Auto-pipeline commands
    enableOfflineQueue: config.enableOfflineQueue !== false,
    lazyConnect: false, // Connect immediately

    // Connection pool and timeouts
    keepAlive: 30000, // 30 seconds keep-alive
    connectTimeout: 10000, // 10 seconds connection timeout
    commandTimeout: 5000, // 5 seconds command timeout

    // Retry configuration
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    retryStrategy: (times) => {
      if (times > config.maxRetriesPerRequest) {
        logger.error('Redis connection failed after maximum retries');
        return null;
      }
      // Exponential backoff with jitter
      const delay = Math.min(times * 1000 + Math.random() * 100, 3000);
      logger.warn(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
      return delay;
    },

    // Reconnection configuration
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Reconnect when Redis is in readonly mode
        logger.warn('Reconnecting due to READONLY error');
        return true;
      }
      return false;
    },

    // Performance settings
    enableReadyCheck: true,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,

    // Optional key prefix for multi-tenant scenarios
    keyPrefix: config.keyPrefix,

    // Monitoring
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
  });

  // Connection event handlers with performance monitoring
  let connectionTime: number;

  client.on('connect', () => {
    connectionTime = Date.now();
    logger.log('Connecting to Redis...');
  });

  client.on('ready', () => {
    const duration = Date.now() - connectionTime;
    logger.log(`Connected to Redis (took ${duration}ms)`);

    // Log connection details in development
    if (process.env.NODE_ENV === 'development') {
      void client.info('server').then((info) => {
        const version = info.match(/redis_version:(.+)/)?.[1];
        const mode = info.match(/redis_mode:(.+)/)?.[1];
        logger.debug(`Redis server: v${version} (${mode} mode)`);
      });
    }
  });

  client.on('error', (error) => {
    logger.error('Redis connection error:', error.message);
    // Don't log full stack trace in production
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(error.stack);
    }
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', (delay: number) => {
    logger.log(`Reconnecting to Redis in ${delay}ms`);
  });

  // Monitor slow commands in development
  if (process.env.NODE_ENV === 'development') {
    client.on('warning', (warning) => {
      logger.warn('Redis warning:', warning);
    });
  }

  // Add custom methods for monitoring
  interface ExtendedRedisClient extends Redis {
    getConnectionStats: () => {
      status: string;
      commandQueue: number;
      offlineQueue: number;
    };
  }

  (client as ExtendedRedisClient).getConnectionStats = () => {
    interface RedisInternals {
      commandQueue?: { length?: number };
      offlineQueue?: { length?: number };
    }
    const redisClient = client as unknown as RedisInternals;
    return {
      status: client.status,
      commandQueue: redisClient.commandQueue?.length ?? 0,
      offlineQueue: redisClient.offlineQueue?.length ?? 0,
    };
  };

  return client;
}

// Factory function with connection pooling support
export function createRedisClientPool(
  config: RedisConfig,
  poolSize: number = 5,
): Redis[] {
  const logger = new Logger('RedisPool');
  const clients: Redis[] = [];

  for (let i = 0; i < poolSize; i++) {
    const poolConfig = {
      ...config,
      connectionName: `${config.connectionName || 'pyramid-api'}-pool-${i}`,
    };

    const client = createOptimizedRedisClient(poolConfig);
    clients.push(client);
  }

  logger.log(`Created Redis connection pool with ${poolSize} clients`);
  return clients;
}

// Load balancer for connection pool
export class RedisLoadBalancer {
  private currentIndex = 0;

  constructor(private readonly clients: Redis[]) {}

  getClient(): Redis {
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.clients.length;
    return client;
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.clients.map((client) => client.quit()));
  }
}
