import { HttpException, HttpStatus, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './global-exception.filter';
import { TestHelpers } from '../../../../test/utils/test-helpers';

// Type definitions for mocked functions
type MockedFunction = jest.Mock & {
  mock: {
    calls: Array<unknown[]>;
  };
};

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockHost: ArgumentsHost;
  let mockResponse: Response;
  let mockRequest: Request;
  let statusMock: MockedFunction;
  let jsonMock: MockedFunction;

  beforeEach(() => {
    // Mock the Logger to suppress output during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    
    filter = new GlobalExceptionFilter();
    mockResponse = TestHelpers.createMockResponse() as unknown as Response;
    mockRequest = TestHelpers.createMockRequest() as unknown as Request;

    // Properly type the mocked functions
    statusMock = mockResponse.status as MockedFunction;
    jsonMock = mockResponse.json as MockedFunction;

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    const statusCall = statusMock.mock.calls[0];
    const jsonCall = jsonMock.mock.calls[0];

    expect(statusCall[0]).toBe(HttpStatus.BAD_REQUEST);
    expect(jsonCall[0]).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Test error',
      path: '/test',
      method: 'GET',
    });
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      { message: ['Field is required'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    const statusCall = statusMock.mock.calls[0];
    const jsonCall = jsonMock.mock.calls[0];

    expect(statusCall[0]).toBe(HttpStatus.BAD_REQUEST);
    expect(jsonCall[0]).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['Field is required'],
      error: 'Bad Request',
    });
  });

  it('should handle generic Error', () => {
    const exception = new Error('Generic error');

    filter.catch(exception, mockHost);

    const statusCall = statusMock.mock.calls[0];
    const jsonCall = jsonMock.mock.calls[0];

    expect(statusCall[0]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonCall[0]).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Generic error',
      error: 'Error',
    });
  });

  it('should handle unknown exception types', () => {
    const exception = 'String error';

    filter.catch(exception, mockHost);

    const statusCall = statusMock.mock.calls[0];
    const jsonCall = jsonMock.mock.calls[0];

    expect(statusCall[0]).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(jsonCall[0]).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'String error', // ensureError converts string to Error with string as message
      error: 'Error',
      path: '/test',
      method: 'GET',
    });
  });

  it('should include request ID if present', () => {
    const reqWithHeaders = mockRequest as Request & {
      headers: Record<string, string>;
    };
    reqWithHeaders.headers['x-request-id'] = 'test-request-id';
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    const jsonCall = jsonMock.mock.calls[0];
    expect(jsonCall[0]).toMatchObject({
      requestId: 'test-request-id',
    });
  });
});
