import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  name: process.env.APP_NAME || 'Space Rep',
  version: process.env.APP_VERSION || '0.1.0',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3001',
  ],

  // Module feature flags  
  modules: {
    ai: false,
    fileProcessing: false,
    analytics: false,
  },
}));
