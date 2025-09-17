import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  FileProcessingException,
  FlashcardGenerationException,
  FileValidationException,
  ErrorDetails,
} from '../exceptions/file-processing.exceptions';

@Catch(
  FileProcessingException,
  FlashcardGenerationException,
  FileValidationException
)
export class FileProcessingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FileProcessingExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ErrorDetails;

    // Log the error for monitoring
    this.logger.error(`File processing error: ${exceptionResponse.reason}`, {
      code: exceptionResponse.code,
      context: exceptionResponse.context,
      url: request.url,
      method: request.method,
      userId: request.user?.id,
    });

    // Send consistent error response
    response.status(status).json({
      statusCode: status,
      message: exceptionResponse.message,
      reason: exceptionResponse.reason,
      code: exceptionResponse.code,
      timestamp: exceptionResponse.timestamp,
      path: request.url,
      ...(exceptionResponse.context && { context: exceptionResponse.context }),
    });
  }
}
