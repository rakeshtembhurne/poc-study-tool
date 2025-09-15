import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  description?: string;
}

export class FileResponseDto {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  description?: string;
  extractedText?: string;
  flashcards?: {
    parsedFlashcards: Array<{ question: string; answer: string }>;
    totalCards: number;
    rawResponse?: any; // Original OpenRouter response
  };
  flashcardGenerationStatus?: 'success' | 'failed' | 'skipped';
  flashcardError?: string;
}
