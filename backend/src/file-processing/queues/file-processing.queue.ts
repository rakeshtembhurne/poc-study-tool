import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { MemoryQueue } from './implementations/memory.queue';
import { IQueue, QueueJob } from './interfaces/queue.interface';
import { FlashcardStrategyFactory } from '../factories/flashcard-strategy.factory';
import { IUserRepository } from '../repositories/user.repository';
import { PdfProcessingService } from '../services/pdf-processing.service';
import { TextProcessingService } from '../services/text-processing.service';
import {
  TextExtractionException,
  ApiKeyMissingException,
} from '@/core/exceptions/file-processing.exceptions';

export interface FileProcessingJobData {
  fileId: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  userId: string;
  description?: string;
}

export interface FileProcessingResult {
  fileId: string;
  success: boolean;
  extractedText?: string;
  flashcards?: any;
  error?: string;
  processingTimeMs: number;
}

@Injectable()
export class FileProcessingQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(FileProcessingQueueService.name);
  private flashcardQueue: IQueue<FileProcessingJobData>;
  private textExtractionQueue: IQueue<FileProcessingJobData>;

  constructor(
    private readonly flashcardStrategyFactory: FlashcardStrategyFactory,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly pdfProcessingService: PdfProcessingService,
    private readonly textProcessingService: TextProcessingService
  ) {
    // Initialize queues
    this.flashcardQueue = new MemoryQueue<FileProcessingJobData>(
      'flashcard-generation',
      {
        maxConcurrency: 3, // Process up to 3 flashcard jobs concurrently
        jobTimeoutMs: 120000, // 2 minutes timeout for flashcard generation
        retryDelayMs: 5000,
      }
    );

    this.textExtractionQueue = new MemoryQueue<FileProcessingJobData>(
      'text-extraction',
      {
        maxConcurrency: 5, // Process up to 5 text extraction jobs concurrently
        jobTimeoutMs: 60000, // 1 minute timeout for text extraction
        retryDelayMs: 2000,
      }
    );
  }

  onModuleInit() {
    // Set up queue processors
    this.textExtractionQueue.process(this.processTextExtractionJob.bind(this));
    this.flashcardQueue.process(this.processFlashcardJob.bind(this));

    this.logger.log('File processing queues initialized');
  }

  onModuleDestroy() {
    // Cleanup queues
    void this.textExtractionQueue.pause();
    void this.flashcardQueue.pause();

    this.logger.log('File processing queues destroyed');
  }

  async addFileForProcessing(
    jobData: FileProcessingJobData,
    priority = 0
  ): Promise<{ textJobId: string; flashcardJobId?: string }> {
    // Add text extraction job
    const textJob = await this.textExtractionQueue.add(jobData, { priority });

    // Add flashcard generation job with slight delay to ensure text extraction happens first
    const flashcardJob = await this.flashcardQueue.add(jobData, {
      priority,
      delay: 1000, // 1 second delay
    });

    this.logger.debug(
      `Added file processing jobs for ${jobData.originalName}: text=${textJob.id}, flashcard=${flashcardJob.id}`
    );

    return {
      textJobId: textJob.id,
      flashcardJobId: flashcardJob.id,
    };
  }

  async getJobStatus(jobId: string): Promise<QueueJob | null> {
    // Check both queues for the job
    let job = await this.textExtractionQueue.getJob(jobId);
    if (!job) {
      job = await this.flashcardQueue.getJob(jobId);
    }
    return job;
  }

  async getQueueStats() {
    const [textStats, flashcardStats] = await Promise.all([
      this.textExtractionQueue.getQueueStats(),
      this.flashcardQueue.getQueueStats(),
    ]);

    return {
      textExtraction: textStats,
      flashcardGeneration: flashcardStats,
    };
  }

  private async processTextExtractionJob(
    job: QueueJob<FileProcessingJobData>
  ): Promise<void> {
    const { filePath, originalName, mimeType } = job.data;
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting text extraction for ${originalName}`);

      let extractedText: string;

      if (mimeType === 'application/pdf') {
        extractedText =
          await this.pdfProcessingService.extractTextOnly(filePath);
      } else if (this.isTextFile(mimeType)) {
        const result =
          await this.textProcessingService.processTextFromPath(filePath);
        extractedText = result.content;
      } else {
        throw new TextExtractionException(
          originalName,
          `Unsupported file type: ${mimeType}`
        );
      }

      const processingTimeMs = Date.now() - startTime;

      this.logger.debug(
        `Text extraction completed for ${originalName} in ${processingTimeMs}ms`
      );

      // Store the extracted text somewhere accessible for the flashcard job
      // For now, we'll just log it. In a real implementation, you'd store it in a cache or database
      this.logger.debug(
        `Extracted ${extractedText.length} characters from ${originalName}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Text extraction failed for ${originalName}: ${errorMessage}`
      );
      throw error;
    }
  }

  private async processFlashcardJob(
    job: QueueJob<FileProcessingJobData>
  ): Promise<void> {
    const { filePath, originalName, mimeType, userId } = job.data;
    const startTime = Date.now();

    try {
      this.logger.debug(`Starting flashcard generation for ${originalName}`);

      // Get user API key
      const userRecord = await this.userRepository.findUserApiKey(userId);
      if (!userRecord?.openAiApiKey) {
        throw new ApiKeyMissingException();
      }

      // Extract text (in a real implementation, this would be cached from the text extraction job)
      let extractedText: string;
      if (mimeType === 'application/pdf') {
        extractedText =
          await this.pdfProcessingService.extractTextOnly(filePath);
      } else if (this.isTextFile(mimeType)) {
        const result =
          await this.textProcessingService.processTextFromPath(filePath);
        extractedText = result.content;
      } else {
        throw new TextExtractionException(
          originalName,
          `Unsupported file type: ${mimeType}`
        );
      }

      if (!extractedText.trim()) {
        throw new TextExtractionException(
          originalName,
          'No text could be extracted from file'
        );
      }

      // Generate flashcards
      const strategy = this.flashcardStrategyFactory.getStrategyForApiKey(
        userRecord.openAiApiKey
      );
      const flashcards = await strategy.generateFlashcards(
        extractedText,
        userRecord.openAiApiKey
      );

      const processingTimeMs = Date.now() - startTime;

      this.logger.debug(
        `Flashcard generation completed for ${originalName} in ${processingTimeMs}ms - generated ${flashcards.totalCards} cards`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Flashcard generation failed for ${originalName}: ${errorMessage}`
      );
      throw error;
    }
  }

  private isTextFile(mimetype: string): boolean {
    const textMimeTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'text/xml',
      'application/json',
      'application/xml',
    ];

    return textMimeTypes.includes(mimetype) || mimetype.startsWith('text/');
  }
}
