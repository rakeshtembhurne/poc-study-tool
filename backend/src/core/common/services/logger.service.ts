import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${context || this.context || 'Application'}] ${message}`
    );
  }

  error(message: any, trace?: string, context?: string) {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [${context || this.context || 'Application'}] ERROR: ${message}`
    );
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [${context || this.context || 'Application'}] WARN: ${message}`
    );
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.debug(
        `[${timestamp}] [${context || this.context || 'Application'}] DEBUG: ${message}`
      );
    }
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(
        `[${timestamp}] [${context || this.context || 'Application'}] VERBOSE: ${message}`
      );
    }
  }
}
