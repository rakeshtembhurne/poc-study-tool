import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';
import { format } from 'util';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  LOG = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

interface LogEntry {
  timestamp: number;
  level: string;
  context: string;
  message: string;
  trace?: string;
}

@Injectable()
export class OptimizedLoggerService implements NestLoggerService {
  private context?: string;
  private buffer: LogEntry[] = [];
  private writeStream?: WriteStream;
  private flushInterval?: NodeJS.Timeout;
  private readonly maxBufferSize = 100;
  private readonly flushIntervalMs = 1000;
  private readonly logLevel: LogLevel;
  private errorCount = 0;
  private lastErrorReset = Date.now();
  private readonly ERROR_SAMPLE_RATE = 0.1; // Sample 10% of errors in production

  constructor() {
    // Set log level based on environment
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    this.logLevel =
      LogLevel[envLogLevel as keyof typeof LogLevel] ??
      (process.env.NODE_ENV === 'production' ? LogLevel.LOG : LogLevel.DEBUG);

    // Initialize file stream for production
    if (process.env.NODE_ENV === 'production') {
      const logDir = process.env.LOG_DIR || 'logs';
      const logFile = join(
        logDir,
        `app-${new Date().toISOString().split('T')[0]}.log`
      );

      this.writeStream = createWriteStream(logFile, { flags: 'a' });
      this.writeStream.on('error', (error) => {
        console.error('Failed to write to log file:', error);
      });

      // Set up periodic flush
      this.flushInterval = setInterval(
        () => this.flush(),
        this.flushIntervalMs
      );
    }
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, context?: string) {
    if (this.logLevel >= LogLevel.LOG) {
      this.addToBuffer('LOG', message, context);
    }
  }

  error(message: unknown, trace?: string, context?: string) {
    // Always log errors, but sample in production if rate is high
    if (this.shouldLogError()) {
      this.addToBuffer('ERROR', message, context, trace);
    }
  }

  warn(message: unknown, context?: string) {
    if (this.logLevel >= LogLevel.WARN) {
      this.addToBuffer('WARN', message, context);
    }
  }

  debug(message: unknown, context?: string) {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.addToBuffer('DEBUG', message, context);
    }
  }

  verbose(message: unknown, context?: string) {
    if (this.logLevel >= LogLevel.VERBOSE) {
      this.addToBuffer('VERBOSE', message, context);
    }
  }

  private shouldLogError(): boolean {
    // Reset counter every minute
    if (Date.now() - this.lastErrorReset > 60000) {
      this.errorCount = 0;
      this.lastErrorReset = Date.now();
    }

    this.errorCount++;

    // Always log first 10 errors, then sample
    if (this.errorCount <= 10) {
      return true;
    }

    // In production, sample errors if rate is high
    if (process.env.NODE_ENV === 'production') {
      return Math.random() < this.ERROR_SAMPLE_RATE;
    }

    return true;
  }

  private addToBuffer(
    level: string,
    message: unknown,
    context?: string,
    trace?: string
  ) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      context: context || this.context || 'Application',
      message: typeof message === 'string' ? message : format(message),
      trace,
    };

    this.buffer.push(entry);

    // Flush if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // In development, also write to console immediately
    if (process.env.NODE_ENV !== 'production') {
      this.writeToConsole(entry);
    }
  }

  private writeToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.context}] ${entry.level}:`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'ERROR':
        console.error(message);
        if (entry.trace) console.error(entry.trace);
        break;
      case 'WARN':
        console.warn(message);
        break;
      case 'DEBUG':
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  }

  private flush() {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0, this.buffer.length);

    if (this.writeStream && !this.writeStream.destroyed) {
      // Format entries for file output
      const lines = entries.map((entry) => {
        const timestamp = new Date(entry.timestamp).toISOString();
        let line = `[${timestamp}] [${entry.context}] ${entry.level}: ${entry.message}`;
        if (entry.trace) {
          line += `\n${entry.trace}`;
        }
        return line;
      });

      // Write as a single operation
      this.writeStream.write(lines.join('\n') + '\n', (err) => {
        if (err) {
          // Fallback to console on write error
          entries.forEach((entry) => this.writeToConsole(entry));
        }
      });
    } else if (process.env.NODE_ENV === 'production') {
      // Fallback to console if no write stream
      entries.forEach((entry) => this.writeToConsole(entry));
    }
  }

  // Cleanup on module destroy
  async onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Final flush
    this.flush();

    // Close write stream
    if (this.writeStream) {
      await new Promise<void>((resolve) => {
        this.writeStream!.end(() => resolve());
      });
    }
  }

  // Get current buffer size for monitoring
  getBufferSize(): number {
    return this.buffer.length;
  }

  // Get error rate for monitoring
  getErrorRate(): number {
    const duration = Date.now() - this.lastErrorReset;
    return (this.errorCount / duration) * 60000; // Errors per minute
  }
}

// Factory function for creating logger with custom configuration
export function createOptimizedLogger(options?: {
  maxBufferSize?: number;
  flushIntervalMs?: number;
  logDir?: string;
  errorSampleRate?: number;
}): OptimizedLoggerService {
  const logger = new OptimizedLoggerService();

  if (options) {
    // Apply custom configuration
    Object.assign(logger, {
      maxBufferSize: options.maxBufferSize ?? 100,
      flushIntervalMs: options.flushIntervalMs ?? 1000,
      ERROR_SAMPLE_RATE: options.errorSampleRate ?? 0.1,
    });
  }

  return logger;
}
