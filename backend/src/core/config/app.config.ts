import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  name: process.env.APP_NAME || 'Pyramid 2.0 Backend',
  version: process.env.APP_VERSION || '0.1.0',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3001',
  ],

  // Module feature flags
  modules: {
    sms: process.env.MODULES_SMS_ENABLED === 'true',
    whatsapp: process.env.MODULES_WHATSAPP_ENABLED === 'true',
    email: process.env.MODULES_EMAIL_ENABLED === 'true',
    voice: process.env.MODULES_VOICE_ENABLED === 'true',
    rcs: process.env.MODULES_RCS_ENABLED === 'true',
    campaigns: process.env.MODULES_CAMPAIGNS_ENABLED === 'true',
    analytics: process.env.MODULES_ANALYTICS_ENABLED === 'true',
  },
}));
