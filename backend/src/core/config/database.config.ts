import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const config = {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'pyramid',
      password: process.env.POSTGRES_PASSWORD || 'pyramid123',
      database: process.env.POSTGRES_DB || 'pyramid_db',
      synchronize:
        nodeEnv === 'development' && process.env.DB_SYNCHRONIZE !== 'false',
      logging: nodeEnv === 'development' && process.env.DB_LOGGING !== 'false',
      maxConnections: parseInt(
        process.env.POSTGRES_MAX_CONNECTIONS || '100',
        10,
      ),
      ssl: process.env.POSTGRES_SSL === 'true',
    },
    clickhouse: {
      host: process.env.CLICKHOUSE_HOST || 'localhost',
      port: parseInt(process.env.CLICKHOUSE_PORT || '8123', 10),
      database: process.env.CLICKHOUSE_DB || 'pyramid_analytics',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
    },
  };

  // Validate PostgreSQL configuration
  if (config.postgres.port < 1 || config.postgres.port > 65535) {
    throw new Error('POSTGRES_PORT must be between 1 and 65535');
  }

  if (
    config.postgres.maxConnections < 1 ||
    config.postgres.maxConnections > 1000
  ) {
    throw new Error('POSTGRES_MAX_CONNECTIONS must be between 1 and 1000');
  }

  // Validate ClickHouse configuration
  if (config.clickhouse.port < 1 || config.clickhouse.port > 65535) {
    throw new Error('CLICKHOUSE_PORT must be between 1 and 65535');
  }

  // Warn about dangerous production settings
  if (nodeEnv === 'production') {
    if (config.postgres.synchronize) {
      console.warn(
        'WARNING: Database synchronization is enabled in production! This can cause data loss.',
      );
    }
    if (config.postgres.logging) {
      console.warn(
        'WARNING: Database logging is enabled in production! This may impact performance.',
      );
    }
  }

  return config;
});
