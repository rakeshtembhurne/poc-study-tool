import { BadRequestException } from '@nestjs/common';

export interface ErrorDetails {
  message: string;
  reason: string;
  code: string;
  timestamp: string;
  context?: Record<string, any>;
}

export class FileProcessingException extends BadRequestException {
  constructor(reason: string, code: string, context?: Record<string, any>) {
    const errorDetails: ErrorDetails = {
      message: 'File processing failed',
      reason,
      code,
      timestamp: new Date().toISOString(),
      context,
    };

    super(errorDetails);
  }
}

export class FlashcardGenerationException extends BadRequestException {
  constructor(reason: string, code: string, context?: Record<string, any>) {
    const errorDetails: ErrorDetails = {
      message: 'Flashcard generation failed',
      reason,
      code,
      timestamp: new Date().toISOString(),
      context,
    };

    super(errorDetails);
  }
}

export class FileValidationException extends BadRequestException {
  constructor(reason: string, code: string, context?: Record<string, any>) {
    const errorDetails: ErrorDetails = {
      message: 'File validation failed',
      reason,
      code,
      timestamp: new Date().toISOString(),
      context,
    };

    super(errorDetails);
  }
}

export class UnsupportedFileTypeException extends FileValidationException {
  constructor(mimeType: string, allowedTypes?: string[]) {
    super(`Unsupported file type: ${mimeType}`, 'UNSUPPORTED_FILE_TYPE', {
      mimeType,
      allowedTypes,
    });
  }
}

export class FileSizeLimitException extends FileValidationException {
  constructor(actualSize: number, maxSize: number) {
    super(
      `File size ${actualSize} bytes exceeds limit of ${maxSize} bytes`,
      'FILE_SIZE_LIMIT_EXCEEDED',
      { actualSize, maxSize }
    );
  }
}

export class TextExtractionException extends FileProcessingException {
  constructor(fileName: string, originalError: string) {
    super(
      `Failed to extract text from file: ${fileName}`,
      'TEXT_EXTRACTION_FAILED',
      { fileName, originalError }
    );
  }
}

export class ApiKeyMissingException extends FlashcardGenerationException {
  constructor() {
    super(
      'OpenAI API key not found in user profile. Please add your API key in settings.',
      'API_KEY_MISSING'
    );
  }
}

export class FlashcardServiceException extends FlashcardGenerationException {
  constructor(originalError: string, context?: Record<string, any>) {
    super(
      `Flashcard generation failed: ${originalError}`,
      'FLASHCARD_SERVICE_ERROR',
      {
        originalError,
        ...context,
      }
    );
  }
}
