import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const config = {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/study_tool',
    directUrl: process.env.DIRECT_DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100', 10),
    ssl: process.env.DB_SSL === 'true',
  };

  // Validate configuration
  if (!config.url) {
    throw new Error('DATABASE_URL is required');
  }

  if (config.maxConnections < 1 || config.maxConnections > 1000) {
    throw new Error('DB_MAX_CONNECTIONS must be between 1 and 1000');
  }

  return config;
});
