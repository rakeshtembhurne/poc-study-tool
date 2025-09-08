import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  isObject,
  isString,
  isArray,
  hasProperty,
  ensureError,
} from '../types/type-guards';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  stack?: string;
}

interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Request interface with custom headers
 */
interface CustomRequest extends Request {
  headers: Request['headers'] & {
    'x-request-id'?: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<CustomRequest>();

    const errorResponse = this.createErrorResponse(exception, request);

    // Log the error
    this.logError(exception, errorResponse, request);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private createErrorResponse(
    exception: unknown,
    request: CustomRequest
  ): ErrorResponse {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const parsed = this.parseHttpExceptionResponse(exceptionResponse);

      message = parsed.message || exception.message;
      error = parsed.error || exception.name;
      stack = this.isDevelopment ? exception.stack : undefined;
    } else {
      const errorObj = ensureError(exception);
      message = errorObj.message;
      error = errorObj.name;
      stack = this.isDevelopment ? errorObj.stack : undefined;
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'],
    };

    if (stack) {
      errorResponse.stack = stack;
    }

    return errorResponse;
  }

  private parseHttpExceptionResponse(
    response: string | object
  ): HttpExceptionResponse {
    if (isString(response)) {
      return { message: response };
    }

    if (isObject(response)) {
      const result: HttpExceptionResponse = {};

      if (hasProperty(response, 'message')) {
        const message = response.message;
        if (
          isString(message) ||
          (isArray(message) && message.every(isString))
        ) {
          result.message = message;
        }
      }

      if (hasProperty(response, 'error') && isString(response.error)) {
        result.error = response.error;
      }

      if (
        hasProperty(response, 'statusCode') &&
        typeof response.statusCode === 'number'
      ) {
        result.statusCode = response.statusCode;
      }

      return result;
    }

    return {};
  }

  private logError(
    exception: unknown,
    errorResponse: ErrorResponse,
    request: CustomRequest
  ): void {
    const logContext = {
      statusCode: errorResponse.statusCode,
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'],
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    if (errorResponse.statusCode >= 500) {
      const messageStr = Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ')
        : errorResponse.message;
      this.logger.error(
        `[${errorResponse.statusCode}] ${errorResponse.error}: ${messageStr}`,
        exception instanceof Error ? exception.stack : undefined,
        JSON.stringify(logContext)
      );
    } else if (errorResponse.statusCode >= 400) {
      const messageStr = Array.isArray(errorResponse.message)
        ? errorResponse.message.join(', ')
        : errorResponse.message;
      this.logger.warn(
        `[${errorResponse.statusCode}] ${errorResponse.error}: ${messageStr}`,
        JSON.stringify(logContext)
      );
    }
  }
}
