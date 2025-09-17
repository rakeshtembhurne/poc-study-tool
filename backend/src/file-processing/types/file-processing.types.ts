// Core file processing types
export interface ProcessedFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  description?: string;
}

// Text extraction types
export interface TextExtractionResult {
  content: string;
  wordCount: number;
  characterCount: number;
  encoding: string;
  isLargeFile: boolean;
  processingTimeMs: number;
}

// Flashcard types
export interface Flashcard {
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
}

export interface FlashcardGenerationResult {
  flashcards: Flashcard[];
  totalCards: number;
  model?: string;
  usage?: TokenUsage;
  processingTimeMs: number;
  confidence?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number;
}

// Processing status types
export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'skipped';

export interface ProcessingMetadata {
  startTime: Date;
  endTime?: Date;
  processingTimeMs?: number;
  status: ProcessingStatus;
  errorMessage?: string;
  retryCount?: number;
}

// File upload result
export interface FileUploadResult extends ProcessedFile {
  textExtraction?: TextExtractionResult;
  flashcardGeneration?: FlashcardGenerationResult;
  processingMetadata: ProcessingMetadata;
}

// Batch processing types
export interface BatchProcessingResult {
  files: FileUploadResult[];
  summary: {
    totalFiles: number;
    successfulFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalProcessingTimeMs: number;
  };
}

// Error types for better error handling
export interface ProcessingError {
  code: string;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  recoverable: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ProcessingError;
  timestamp: string;
  requestId?: string;
}

// Configuration types
export interface FileProcessingConfig {
  maxFileSize: number;
  largeFileThreshold: number;
  allowedMimeTypes: string[];
  maxFiles: number;
  enableStreaming: boolean;
  chunkSize: number;
}

export interface FlashcardConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  minCardsPerRequest: number;
  maxCardsPerRequest: number;
  requestTimeoutMs: number;
}
