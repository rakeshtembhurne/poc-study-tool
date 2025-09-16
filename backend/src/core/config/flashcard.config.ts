import { registerAs } from '@nestjs/config';

export default registerAs('flashcard', () => ({
  // Generation parameters
  maxTokens: parseInt(process.env.FLASHCARD_MAX_TOKENS || '2048') || 2048,
  temperature: parseFloat(process.env.FLASHCARD_TEMPERATURE || '0.3') || 0.3,
  topP: parseFloat(process.env.FLASHCARD_TOP_P || '0.9') || 0.9,

  // Request configuration
  requestTimeoutMs:
    parseInt(process.env.FLASHCARD_REQUEST_TIMEOUT_MS || '45000') || 45000, // 45 seconds
  maxRetries: parseInt(process.env.FLASHCARD_MAX_RETRIES || '3') || 3,
  retryDelayMs:
    parseInt(process.env.FLASHCARD_RETRY_DELAY_MS || '2000') || 2000,

  // Quality constraints
  minCardsPerRequest: parseInt(process.env.MIN_CARDS_PER_REQUEST || '3') || 3,
  maxCardsPerRequest: parseInt(process.env.MAX_CARDS_PER_REQUEST || '20') || 20,
  minTextLength:
    parseInt(process.env.MIN_TEXT_LENGTH_FOR_FLASHCARDS || '100') || 100,

  // Provider configuration
  defaultProvider: process.env.FLASHCARD_DEFAULT_PROVIDER || 'openrouter',
  fallbackProvider: process.env.FLASHCARD_FALLBACK_PROVIDER || 'openrouter',

  // Model preferences
  defaultModel:
    process.env.FLASHCARD_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet',
  fallbackModel: process.env.FLASHCARD_FALLBACK_MODEL || 'openai/gpt-4o-mini',

  // Rate limiting
  rateLimitPerMinute:
    parseInt(process.env.FLASHCARD_RATE_LIMIT_PER_MINUTE || '60') || 60,
  rateLimitPerHour:
    parseInt(process.env.FLASHCARD_RATE_LIMIT_PER_HOUR || '500') || 500,

  // Caching
  enableCaching: process.env.FLASHCARD_ENABLE_CACHING !== 'false',
  cacheExpiryHours:
    parseInt(process.env.FLASHCARD_CACHE_EXPIRY_HOURS || '24') || 24,
}));
