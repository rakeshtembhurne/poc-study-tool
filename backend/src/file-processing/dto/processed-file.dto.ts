import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsObject,
} from 'class-validator';

export class FileProcessingOptionsDto {
  @IsOptional()
  @IsString()
  targetEncoding?: string;

  @IsOptional()
  @IsNumber()
  maxSize?: number;

  @IsOptional()
  @IsNumber()
  maxPages?: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  extractImages?: boolean;

  @IsOptional()
  @IsBoolean()
  streaming?: boolean;

  @IsOptional()
  @IsNumber()
  chunkSize?: number;

  @IsOptional()
  @IsBoolean()
  preserveLineBreaks?: boolean;
}

export class PdfMetadataDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsString()
  producer?: string;

  @IsOptional()
  @IsDate()
  creationDate?: Date;

  @IsOptional()
  @IsDate()
  modificationDate?: Date;
}

export class PdfInfoDto {
  @IsString()
  version: string;

  @IsBoolean()
  isEncrypted: boolean;

  @IsBoolean()
  isLinearized: boolean;
}

export class ProcessedFileResponseDto {
  @IsString()
  id: string;

  @IsString()
  filename: string;

  @IsString()
  originalname: string;

  @IsString()
  mimetype: string;

  @IsNumber()
  size: number;

  @IsString()
  path: string;

  @IsDate()
  uploadedAt: Date;

  @IsDate()
  processedAt: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  processingStatus: 'success' | 'partial' | 'failed';

  @IsOptional()
  @IsString()
  processingError?: string;

  @IsString()
  extractedText: string;

  @IsOptional()
  @IsString()
  detectedEncoding?: string;

  @IsOptional()
  @IsString()
  encoding?: string;

  @IsOptional()
  @IsNumber()
  numPages?: number;

  @IsOptional()
  @IsNumber()
  lines?: number;

  @IsOptional()
  @IsNumber()
  characters?: number;

  @IsOptional()
  @IsNumber()
  words?: number;

  @IsOptional()
  @IsBoolean()
  isLargeFile?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: PdfMetadataDto;

  @IsOptional()
  @IsObject()
  pdfInfo?: PdfInfoDto;

  @IsOptional()
  @IsObject()
  processingOptions?: FileProcessingOptionsDto;
}

export class ProcessFileDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  options?: FileProcessingOptionsDto;
}

export class StreamProcessingStatusDto {
  @IsString()
  fileId: string;

  @IsString()
  status: 'processing' | 'completed' | 'failed';

  @IsNumber()
  progress: number;

  @IsOptional()
  @IsString()
  encoding?: string;

  @IsOptional()
  @IsString()
  detectedEncoding?: string;

  @IsOptional()
  @IsNumber()
  totalChunks?: number;

  @IsOptional()
  @IsNumber()
  processedSize?: number;

  @IsOptional()
  @IsNumber()
  lines?: number;

  @IsOptional()
  @IsString()
  error?: string;
}
