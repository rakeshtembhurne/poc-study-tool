import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  UploadFileDto,
  FileResponseDto,
} from './dto/create-file-processing.dto';
import { UploadMultipleFilesDto } from './dto/upload-multiple.dto';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';
import { AuthPayload } from '@/auth/types/auth.types';
import { unlink } from 'fs/promises';
import {
  ApiKeyMissingException,
  TextExtractionException,
  FlashcardServiceException,
  UnsupportedFileTypeException,
} from '@/core/exceptions/file-processing.exceptions';
import { IUserRepository } from './repositories/user.repository';
import { FlashcardStrategyFactory } from './factories/flashcard-strategy.factory';
import fileProcessingConfig from '@/core/config/file-processing.config';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);

  constructor(
    private readonly pdfProcessingService: PdfProcessingService,
    private readonly textProcessingService: TextProcessingService,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly flashcardStrategyFactory: FlashcardStrategyFactory,
    @Inject(fileProcessingConfig.KEY)
    private readonly config: ConfigType<typeof fileProcessingConfig>
  ) {}

  async uploadSingleFile(
    file: Express.Multer.File,
    dto: UploadFileDto,
    user: AuthPayload
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
      flashcardGenerationStatus: 'skipped',
    };

    // Auto-parse file and generate flashcards
    // Fetch user's API key using repository pattern
    const userRecord = await this.userRepository.findUserApiKey(user.id);

    if (!userRecord?.openAiApiKey) {
      fileResponse.flashcardGenerationStatus = 'failed';
      const error = new ApiKeyMissingException();
      const errorResponse = error.getResponse() as any;
      fileResponse.flashcardError = errorResponse.reason;
      return fileResponse;
    }

    try {
      const extractedText = await this.extractTextFromFile(file);

      if (extractedText.trim()) {
        fileResponse.extractedText = extractedText;

        this.logger.debug(
          `Generating flashcards for file: ${file.originalname}`
        );

        // Use strategy pattern for flashcard generation
        const strategy = this.flashcardStrategyFactory.getStrategyForApiKey(
          userRecord.openAiApiKey
        );
        const flashcards = await strategy.generateFlashcards(
          extractedText,
          userRecord.openAiApiKey
        );

        fileResponse.flashcards = {
          parsedFlashcards: flashcards.parsedFlashcards,
          totalCards: flashcards.totalCards,
        };
        fileResponse.flashcardGenerationStatus = 'success';

        this.logger.debug(
          `Successfully generated flashcards for: ${file.originalname}`
        );

        // Delete the uploaded file after successful flashcard generation
        await this.deleteUploadedFile(file.path);
      } else {
        fileResponse.flashcardGenerationStatus = 'failed';
        const error = new TextExtractionException(
          file.originalname,
          'No text could be extracted from file'
        );
        const errorResponse = error.getResponse() as any;
        fileResponse.flashcardError = errorResponse.reason;
        // Still delete the file even if no text was extracted
        await this.deleteUploadedFile(file.path);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate flashcards for ${file.originalname}: ${errorMessage}`
      );
      fileResponse.flashcardGenerationStatus = 'failed';

      const flashcardError = new FlashcardServiceException(errorMessage, {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
      const errorResponse = flashcardError.getResponse() as any;
      fileResponse.flashcardError = errorResponse.reason;

      // Delete the file even if flashcard generation failed
      await this.deleteUploadedFile(file.path);
    }

    return fileResponse;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: UploadMultipleFilesDto,
    user: AuthPayload
  ): Promise<FileResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileNames = files.map((file) => file.originalname).join(', ');
    this.logger.debug(
      `Multiple files uploaded: ${files.length} files (${fileNames}), total size: ${totalSize} bytes`
    );

    // Fetch user data once for all files
    const userRecord = await this.userRepository.findUserApiKey(user.id);

    const responses = await Promise.allSettled(
      files.map(async (file, index) => {
        const description = dto.descriptions?.[index] || undefined;

        const fileResponse: FileResponseDto = {
          id: this.generateFileId(),
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: new Date(),
          description,
          flashcardGenerationStatus: 'skipped',
        };

        // Auto-parse file and generate flashcards
        if (!userRecord?.openAiApiKey) {
          fileResponse.flashcardGenerationStatus = 'failed';
          const error = new ApiKeyMissingException();
          const errorResponse = error.getResponse() as any;
          fileResponse.flashcardError = errorResponse.reason;
          return fileResponse;
        }

        try {
          const extractedText = await this.extractTextFromFile(file);

          if (extractedText.trim()) {
            fileResponse.extractedText = extractedText;

            this.logger.debug(
              `Generating flashcards for file: ${file.originalname}`
            );

            // Use strategy pattern for flashcard generation
            const strategy = this.flashcardStrategyFactory.getStrategyForApiKey(
              userRecord.openAiApiKey
            );
            const flashcards = await strategy.generateFlashcards(
              extractedText,
              userRecord.openAiApiKey
            );

            fileResponse.flashcards = {
              parsedFlashcards: flashcards.parsedFlashcards,
              totalCards: flashcards.totalCards,
            };
            fileResponse.flashcardGenerationStatus = 'success';

            this.logger.debug(
              `Successfully generated flashcards for: ${file.originalname}`
            );

            // Delete the uploaded file after successful flashcard generation
            await this.deleteUploadedFile(file.path);
          } else {
            fileResponse.flashcardGenerationStatus = 'failed';
            fileResponse.flashcardError =
              'No text could be extracted from file';
            // Still delete the file even if no text was extracted
            await this.deleteUploadedFile(file.path);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to generate flashcards for ${file.originalname}: ${errorMessage}`
          );
          fileResponse.flashcardGenerationStatus = 'failed';
          fileResponse.flashcardError = errorMessage;
          // Delete the file even if flashcard generation failed
          await this.deleteUploadedFile(file.path);
        }

        return fileResponse;
      })
    );

    // Return all results, including failed ones
    return responses.map((result, index) => {
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
          description: dto.descriptions?.[index],
          flashcardGenerationStatus: 'failed',
          flashcardError: result.reason.message,
        } as FileResponseDto;
      }
    });
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

  private async extractTextFromFile(
    file: Express.Multer.File
  ): Promise<string> {
    try {
      if (file.mimetype === 'application/pdf') {
        return await this.pdfProcessingService.extractTextOnly(file.path);
      } else if (file.mimetype === 'text/plain' || this.isTextFile(file)) {
        // Use streaming for large files to optimize memory usage
        const stats = await import('fs').then((fs) =>
          fs.promises.stat(file.path)
        );

        if (stats.size > this.config.largeFileThreshold) {
          this.logger.debug(
            `Using streaming processing for large file: ${file.originalname} (${stats.size} bytes)`
          );

          const result = await this.textProcessingService.processLargeTextFile(
            file.path,
            {
              streaming: this.config.enableStreaming,
              chunkSize: this.config.chunkSize,
            }
          );
          return result.content;
        } else {
          const result = await this.textProcessingService.processTextFromPath(
            file.path
          );
          return result.content;
        }
      } else {
        throw new UnsupportedFileTypeException(
          file.mimetype,
          this.config.allowedMimeTypes
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to extract text from ${file.originalname}: ${errorMessage}`
      );
      throw error;
    }
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async deleteUploadedFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
      this.logger.debug(`Deleted uploaded file: ${filePath}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to delete uploaded file ${filePath}: ${errorMessage}`
      );
      // Don't throw the error - file deletion failure shouldn't break the response
    }
  }
}
