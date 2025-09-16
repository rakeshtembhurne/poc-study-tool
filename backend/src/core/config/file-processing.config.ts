import { registerAs } from '@nestjs/config';

export default registerAs('fileProcessing', () => ({
  // File size limits
  maxFileSize:
    parseInt(process.env.MAX_FILE_SIZE || '10485760') || 10 * 1024 * 1024, // 10MB
  largeFileThreshold:
    parseInt(process.env.LARGE_FILE_THRESHOLD || '5242880') || 5 * 1024 * 1024, // 5MB

  // Streaming configuration
  chunkSize: parseInt(process.env.STREAM_CHUNK_SIZE || '65536') || 64 * 1024, // 64KB
  enableStreaming: process.env.ENABLE_STREAMING !== 'false',

  // File upload limits
  maxFiles: parseInt(process.env.MAX_FILES_PER_UPLOAD || '5') || 5,
  allowedMimeTypes: (
    process.env.ALLOWED_MIME_TYPES ||
    'application/pdf,text/plain,text/csv,text/html,application/json'
  ).split(','),

  // Text processing
  maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH || '1000000') || 1000000, // 1MB of text
  textEncoding: process.env.TEXT_ENCODING || 'utf8',

  // Processing timeouts
  extractionTimeoutMs:
    parseInt(process.env.EXTRACTION_TIMEOUT_MS || '30000') || 30000, // 30 seconds
  flashcardTimeoutMs:
    parseInt(process.env.FLASHCARD_TIMEOUT_MS || '60000') || 60000, // 60 seconds

  // Retry configuration
  maxRetries: parseInt(process.env.MAX_RETRIES || '3') || 3,
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1500') || 1500,

  // Cleanup
  deleteAfterProcessing: process.env.DELETE_AFTER_PROCESSING !== 'false',
  tempFileRetentionHours:
    parseInt(process.env.TEMP_FILE_RETENTION_HOURS || '24') || 24,
}));
