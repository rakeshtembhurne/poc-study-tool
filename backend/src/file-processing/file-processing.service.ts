import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  UploadFileDto,
  FileResponseDto,
} from './dto/create-file-processing.dto';
import { UploadMultipleFilesDto } from './dto/upload-multiple.dto';
import {
  ProcessedFileResponseDto,
  ProcessFileDto,
} from './dto/processed-file.dto';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  constructor(
    private readonly pdfProcessingService: PdfProcessingService,
    private readonly textProcessingService: TextProcessingService
  ) {}

  async uploadSingleFile(
    file: Express.Multer.File,
    dto: UploadFileDto
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.debug(
      `Single file uploaded: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`
    );

    const fileResponse: FileResponseDto = {
      id: this.generateFileId(),
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
      description: dto.description,
    };

    return fileResponse;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: UploadMultipleFilesDto
  ): Promise<FileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileNames = files.map((file) => file.originalname).join(', ');
    this.logger.debug(
      `Multiple files uploaded: ${files.length} files (${fileNames}), total size: ${totalSize} bytes`
    );

    const responses = files.map((file, index) => {
      const description = dto.descriptions?.[index] || undefined;

      return {
        id: this.generateFileId(),
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
        description,
      };
    });

    return responses;
  }

  async processFile(
    file: Express.Multer.File,
    dto: ProcessFileDto
  ): Promise<ProcessedFileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const startTime = new Date();
    const fileId = this.generateFileId();

    this.logger.debug(
      `Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size}`
    );

    let processingResult: ProcessedFileResponseDto;

    try {
      if (file.mimetype === 'application/pdf') {
        processingResult = await this.processPdfFile(
          file,
          dto,
          fileId,
          startTime
        );
      } else if (file.mimetype === 'text/plain' || this.isTextFile(file)) {
        processingResult = await this.processTextFile(
          file,
          dto,
          fileId,
          startTime
        );
      } else {
        throw new BadRequestException(
          `Unsupported file type: ${file.mimetype}`
        );
      }

      this.logger.debug(`File processed successfully: ${fileId}`);
      return processingResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Error processing file ${fileId}: ${errorMessage}`);

      return {
        id: fileId,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: startTime,
        processedAt: new Date(),
        description: dto.description,
        processingStatus: 'failed',
        processingError: errorMessage,
        extractedText: '',
        processingOptions: dto.options,
      };
    }
  }

  async processMultipleFiles(
    files: Express.Multer.File[],
    dto: ProcessFileDto
  ): Promise<ProcessedFileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    this.logger.debug(`Processing ${files.length} files`);

    const results = await Promise.allSettled(
      files.map((file) => this.processFile(file, dto))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const file = files[index];
        return {
          id: this.generateFileId(),
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: new Date(),
          processedAt: new Date(),
          description: dto.description,
          processingStatus: 'failed',
          processingError: result.reason.message,
          extractedText: '',
          processingOptions: dto.options,
        } as ProcessedFileResponseDto;
      }
    });
  }

  private async processPdfFile(
    file: Express.Multer.File,
    dto: ProcessFileDto,
    fileId: string,
    startTime: Date
  ): Promise<ProcessedFileResponseDto> {
    try {
      const options = dto.options || {};
      const pdfResult = await this.pdfProcessingService.processPdfFromPath(
        file.path,
        {
          maxPages: options.maxPages,
          password: options.password,
          extractImages: options.extractImages,
        }
      );

      return {
        id: fileId,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: startTime,
        processedAt: new Date(),
        description: dto.description,
        processingStatus: 'success',
        extractedText: pdfResult.text,
        numPages: pdfResult.numPages,
        characters: pdfResult.text.length,
        words: this.countWords(pdfResult.text),
        metadata: pdfResult.metadata,
        pdfInfo: pdfResult.info,
        processingOptions: dto.options,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`PDF processing failed: ${errorMessage}`);
    }
  }

  private async processTextFile(
    file: Express.Multer.File,
    dto: ProcessFileDto,
    fileId: string,
    startTime: Date
  ): Promise<ProcessedFileResponseDto> {
    try {
      const options = dto.options || {};
      const textResult = await this.textProcessingService.processTextFromPath(
        file.path,
        {
          targetEncoding: options.targetEncoding,
          maxSize: options.maxSize,
          streaming: options.streaming,
          chunkSize: options.chunkSize,
          preserveLineBreaks: options.preserveLineBreaks,
        }
      );

      return {
        id: fileId,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: startTime,
        processedAt: new Date(),
        description: dto.description,
        processingStatus: 'success',
        extractedText: textResult.content,
        detectedEncoding: textResult.detectedEncoding,
        encoding: textResult.encoding,
        lines: textResult.lines,
        characters: textResult.characters,
        words: textResult.words,
        isLargeFile: textResult.isLargeFile,
        processingOptions: dto.options,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new BadRequestException(`Text processing failed: ${errorMessage}`);
    }
  }

  async extractTextOnly(
    file: Express.Multer.File
  ): Promise<{ text: string; type: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.mimetype === 'application/pdf') {
      const text = await this.pdfProcessingService.extractTextOnly(file.path);
      return { text, type: 'pdf' };
    } else if (file.mimetype === 'text/plain' || this.isTextFile(file)) {
      const result = await this.textProcessingService.processTextFromPath(
        file.path
      );
      return { text: result.content, type: 'text' };
    } else {
      throw new BadRequestException(
        `Unsupported file type for text extraction: ${file.mimetype}`
      );
    }
  }

  async validateFile(
    file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (file.mimetype === 'application/pdf') {
        const isValid = this.pdfProcessingService.validatePdfFile(file.path);
        return { isValid, error: isValid ? undefined : 'Invalid PDF file' };
      } else if (file.mimetype === 'text/plain' || this.isTextFile(file)) {
        const isValid = this.textProcessingService.validateTextFile(file.path);
        return { isValid, error: isValid ? undefined : 'Invalid text file' };
      } else {
        return {
          isValid: false,
          error: `Unsupported file type: ${file.mimetype}`,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      return { isValid: false, error: errorMessage };
    }
  }

  private isTextFile(file: Express.Multer.File): boolean {
    const textMimeTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'text/xml',
      'application/json',
      'application/xml',
    ];

    return (
      textMimeTypes.includes(file.mimetype) ||
      file.originalname.match(/\.(txt|text|log|csv|json|xml|md)$/i) !== null
    );
  }

  private countWords(text: string): number {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
