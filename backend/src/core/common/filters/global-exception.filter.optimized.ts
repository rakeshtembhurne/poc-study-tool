import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

interface ErrorMetrics {
  total: number;
  byStatus: Map<number, number>;
  byPath: Map<string, number>;
  lastReset: number;
}

@Injectable()
@Catch()
export class OptimizedGlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OptimizedGlobalExceptionFilter.name);
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  // Error tracking for rate limiting and monitoring
  private readonly metrics: ErrorMetrics = {
    total: 0,
    byStatus: new Map(),
    byPath: new Map(),
    lastReset: Date.now(),
  };

  // Cache for common error responses
  private readonly responseCache = new Map<string, ErrorResponse>();
  private readonly cacheMaxSize = 100;

  // Rate limiting for logging
  private readonly logRateLimit = 100; // Max logs per minute
  private logCount = 0;
  private lastLogReset = Date.now();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Extract error details
    const { status, message, error } = this.extractErrorDetails(exception);

    // Update metrics
    this.updateMetrics(status, request.path);

    // Generate response
    const errorResponse = this.generateErrorResponse(
      status,
      message,
      error,
      request,
    );

    // Log error conditionally
    this.logError(exception, status, request);

    // Send response
    response.status(status).json(errorResponse);
  }

  private extractErrorDetails(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // Map common errors to appropriate status codes
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
      } else if (exception.name === 'UnauthorizedError') {
        status = HttpStatus.UNAUTHORIZED;
        error = 'Unauthorized';
      }
    }

    return { status, message, error };
  }

  private generateErrorResponse(
    status: number,
    message: string | string[],
    error: string,
    request: Request,
  ): ErrorResponse {
    // Check cache for common errors
    const cacheKey = `${status}-${error}-${request.method}-${request.path}`;
    const cached = this.responseCache.get(cacheKey);

    if (cached && this.isProduction) {
      // Return cached response with updated timestamp and request ID
      return {
        ...cached,
        timestamp: new Date().toISOString(),
        requestId: request.headers['x-request-id'] as string,
      };
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
    };

    // Cache the response structure (without timestamp/requestId)
    if (this.responseCache.size < this.cacheMaxSize) {
      this.responseCache.set(cacheKey, {
        ...errorResponse,
        timestamp: '',
        requestId: undefined,
      });
    }

    return errorResponse;
  }

  private logError(exception: unknown, status: number, request: Request) {
    // Rate limit logging
    if (!this.shouldLog()) return;

    // Only log stack traces in development or for 5xx errors
    const shouldLogStack = this.isDevelopment || status >= 500;

    // Build log message
    const logMessage = `${request.method} ${request.url} - Status: ${status}`;

    if (exception instanceof Error) {
      if (status >= 500) {
        // Always log 5xx errors
        this.logger.error(
          logMessage,
          shouldLogStack ? exception.stack : undefined,
        );
      } else if (status >= 400 && this.isDevelopment) {
        // Log 4xx errors in development
        this.logger.warn(logMessage);
      }
    } else if (status >= 500) {
      this.logger.error(`${logMessage} - Unknown error type`, exception);
    }
  }

  private shouldLog(): boolean {
    // Reset counter every minute
    if (Date.now() - this.lastLogReset > 60000) {
      this.logCount = 0;
      this.lastLogReset = Date.now();
    }

    this.logCount++;

    // Always log first 10 errors
    if (this.logCount <= 10) return true;

    // Then apply rate limiting
    return this.logCount <= this.logRateLimit;
  }

  private updateMetrics(status: number, path: string) {
    // Reset metrics every hour
    if (Date.now() - this.metrics.lastReset > 3600000) {
      this.metrics.total = 0;
      this.metrics.byStatus.clear();
      this.metrics.byPath.clear();
      this.metrics.lastReset = Date.now();
    }

    // Update counters
    this.metrics.total++;
    this.metrics.byStatus.set(
      status,
      (this.metrics.byStatus.get(status) || 0) + 1,
    );

    // Only track top paths to avoid memory issues
    if (this.metrics.byPath.size < 100) {
      this.metrics.byPath.set(path, (this.metrics.byPath.get(path) || 0) + 1);
    }
  }

  // Public methods for monitoring
  getMetrics(): {
    total: number;
    byStatus: Record<number, number>;
    topPaths: Array<{ path: string; count: number }>;
  } {
    const byStatus: Record<number, number> = {};
    this.metrics.byStatus.forEach((count, status) => {
      byStatus[status] = count;
    });

    const topPaths = Array.from(this.metrics.byPath.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: this.metrics.total,
      byStatus,
      topPaths,
    };
  }

  clearCache() {
    this.responseCache.clear();
  }

  resetMetrics() {
    this.metrics.total = 0;
    this.metrics.byStatus.clear();
    this.metrics.byPath.clear();
    this.metrics.lastReset = Date.now();
  }
}
