import { registerAs } from '@nestjs/config';

export default registerAs('openrouter', () => ({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
}));
