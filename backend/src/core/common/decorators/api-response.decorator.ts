import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * API Response decorators for Swagger documentation with type safety
 */

export interface ApiResponseOptions<T> {
  type?: Type<T>;
  isArray?: boolean;
  description?: string;
  example?: T | T[];
}

/**
 * Standard API response wrapper
 */
export class ApiResponseWrapper<T> {
  success!: boolean;
  data!: T;
  message?: string;
  timestamp!: string;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseWrapper<T> {
  success!: boolean;
  data!: T[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp!: string;
}

/**
 * Error response wrapper
 */
export class ErrorResponseWrapper {
  success!: false;
  error!: {
    statusCode: number;
    message: string | string[];
    error?: string;
  };
  timestamp!: string;
}

// Type-safe decorator return type
type DecoratorFunction = <TFunction extends (...args: unknown[]) => unknown, Y>(
  target: TFunction | object,
  propertyKey?: string | symbol,
  descriptor?: TypedPropertyDescriptor<Y>
) => void;

/**
 * Success response decorator
 */
export function ApiSuccessResponse<T>(
  statusCode: number,
  options: ApiResponseOptions<T>
): DecoratorFunction {
  return applyDecorators(
    ApiResponse({
      status: statusCode,
      description: options.description || 'Successful response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseWrapper) },
          {
            properties: {
              data: options.isArray
                ? {
                    type: 'array',
                    items: options.type
                      ? { $ref: getSchemaPath(options.type) }
                      : {},
                  }
                : options.type
                  ? { $ref: getSchemaPath(options.type) }
                  : {},
            },
          },
        ],
        example: {
          success: true,
          data: options.example,
          timestamp: new Date().toISOString(),
        },
      },
    }),
    ...(options.type ? [ApiExtraModels(ApiResponseWrapper, options.type)] : [])
  ) as DecoratorFunction;
}

/**
 * Paginated response decorator
 */
export function ApiPaginatedResponse<T>(
  options: ApiResponseOptions<T> & {
    page?: number;
    limit?: number;
    total?: number;
  }
): DecoratorFunction {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: options.description || 'Paginated response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseWrapper) },
          {
            properties: {
              data: {
                type: 'array',
                items: options.type
                  ? { $ref: getSchemaPath(options.type) }
                  : {},
              },
            },
          },
        ],
        example: {
          success: true,
          data: options.example || [],
          pagination: {
            page: options.page || 1,
            limit: options.limit || 10,
            total: options.total || 0,
            totalPages: Math.ceil((options.total || 0) / (options.limit || 10)),
          },
          timestamp: new Date().toISOString(),
        },
      },
    }),
    ...(options.type
      ? [ApiExtraModels(PaginatedResponseWrapper, options.type)]
      : [])
  ) as DecoratorFunction;
}

/**
 * Error response decorator
 */
export function ApiErrorResponse(
  statusCode: number,
  description: string,
  message?: string | string[]
): DecoratorFunction {
  return applyDecorators(
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        $ref: getSchemaPath(ErrorResponseWrapper),
        example: {
          success: false,
          error: {
            statusCode,
            message: message || description,
            error: description,
          },
          timestamp: new Date().toISOString(),
        },
      },
    }),
    ApiExtraModels(ErrorResponseWrapper)
  ) as DecoratorFunction;
}

/**
 * Common error responses
 */
export function ApiCommonResponses(): DecoratorFunction {
  return applyDecorators(
    ApiErrorResponse(400, 'Bad Request', 'Invalid request parameters'),
    ApiErrorResponse(401, 'Unauthorized', 'Authentication required'),
    ApiErrorResponse(403, 'Forbidden', 'Insufficient permissions'),
    ApiErrorResponse(404, 'Not Found', 'Resource not found'),
    ApiErrorResponse(
      500,
      'Internal Server Error',
      'An unexpected error occurred'
    )
  ) as DecoratorFunction;
}

/**
 * Create custom response decorator
 */
export function createApiResponse<T>(
  statusCode: number,
  type: Type<T>,
  options?: {
    description?: string;
    isArray?: boolean;
    example?: T | T[];
  }
): DecoratorFunction {
  return ApiSuccessResponse(statusCode, {
    type,
    description: options?.description,
    isArray: options?.isArray,
    example: options?.example,
  });
}
