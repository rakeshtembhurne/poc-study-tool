import { registerAs } from '@nestjs/config';

// Environment-specific defaults
const environmentDefaults = {
  development: {
    cacheTtl: 300, // 5 minutes for development
    sessionTimeout: 3600, // 1 hour
    maxRetries: 3,
    maxSessionsPerUser: 10, // More lenient in dev
  },
  production: {
    cacheTtl: 3600, // 1 hour for production
    sessionTimeout: 7200, // 2 hours
    maxRetries: 5,
    maxSessionsPerUser: 5, // Stricter in production
  },
  test: {
    cacheTtl: 60, // 1 minute for tests
    sessionTimeout: 300, // 5 minutes
    maxRetries: 1,
    maxSessionsPerUser: 2,
  },
};

interface RedisConfigDefaults {
  cacheTtl: number;
  sessionTimeout: number;
  maxRetries: number;
  maxSessionsPerUser: number;
}

export default registerAs('redis', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const defaults: RedisConfigDefaults =
    environmentDefaults[nodeEnv as keyof typeof environmentDefaults] ||
    environmentDefaults.development;

  // Parse and validate configuration values
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    cacheTtl: parseInt(
      process.env.REDIS_CACHE_TTL || String(defaults.cacheTtl),
      10,
    ),
    sessionTimeout: parseInt(
      process.env.SESSION_TIMEOUT || String(defaults.sessionTimeout),
      10,
    ),
    maxRetriesPerRequest: parseInt(
      process.env.REDIS_MAX_RETRIES || String(defaults.maxRetries),
      10,
    ),
    maxSessionsPerUser: parseInt(
      process.env.MAX_SESSIONS_PER_USER || String(defaults.maxSessionsPerUser),
      10,
    ),
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE !== 'false',
    keyPrefix: process.env.REDIS_KEY_PREFIX || `pyramid:${nodeEnv}:`,
  };

  // Validate configuration
  if (config.port < 1 || config.port > 65535) {
    throw new Error('REDIS_PORT must be between 1 and 65535');
  }

  if (config.db < 0 || config.db > 15) {
    throw new Error('REDIS_DB must be between 0 and 15');
  }

  if (config.cacheTtl < 0) {
    throw new Error('REDIS_CACHE_TTL must be non-negative');
  }

  if (config.sessionTimeout < 60) {
    throw new Error('SESSION_TIMEOUT must be at least 60 seconds');
  }

  if (config.maxSessionsPerUser < 1) {
    throw new Error('MAX_SESSIONS_PER_USER must be at least 1');
  }

  if (config.maxRetriesPerRequest < 0) {
    throw new Error('REDIS_MAX_RETRIES must be non-negative');
  }

  return config;
});
