import { IsOptional, IsString, IsEnum } from 'class-validator';
import {
  ProcessedFile,
  TextExtractionResult,
  ProcessingStatus,
  Flashcard,
} from '../types/file-processing.types';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  description?: string;
}

// Enhanced response DTO with proper typing
export class FileResponseDto implements ProcessedFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  description?: string;

  // Enhanced extraction result
  extractedText?: string;
  textExtractionMeta?: Omit<TextExtractionResult, 'content'>;

  // Enhanced flashcard result
  flashcards?: {
    parsedFlashcards: Flashcard[];
    totalCards: number;
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      cost?: number;
    };
    processingTimeMs?: number;
    confidence?: number;
  };

  @IsEnum(['success', 'failed', 'skipped', 'processing', 'pending'])
  flashcardGenerationStatus: ProcessingStatus;

  flashcardError?: string;

  // Processing metadata
  processingMeta?: {
    startTime: Date;
    endTime?: Date;
    processingTimeMs?: number;
    retryCount?: number;
  };
}

// Batch response DTO
export class BatchFileResponseDto {
  files: FileResponseDto[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalProcessingTimeMs: number;
  };
}
