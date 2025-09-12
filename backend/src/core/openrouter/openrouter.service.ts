import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelManager } from './services/model-manager.service';
import { ConnectionManager } from './services/connection-manager.service';
import { FlashcardGenerator } from './services/flashcard-generator.service';
import { OpenRouterResponse } from './interfaces/openrouter.interface';

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private currentModelIndex = 0;

  constructor(
    private readonly modelManager: ModelManager,
    private readonly connectionManager: ConnectionManager,
    private readonly flashcardGenerator: FlashcardGenerator,
    private readonly configService: ConfigService
  ) {}

  async generateFlashcards(
    text: string,
    openAiApiKey: string
  ): Promise<OpenRouterResponse> {
    // Input validation
    if (!openAiApiKey?.trim()) {
      throw new HttpException(
        'OpenAI API key is required. Please add it in your profile settings.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!text?.trim()) {
      throw new HttpException(
        'Input text cannot be empty',
        HttpStatus.BAD_REQUEST
      );
    }

    if (text.trim().length > 50000) {
      throw new HttpException(
        'Input text is too long. Please provide text under 50,000 characters.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Ensure models are initialized
    try {
      await this.modelManager.ensureInitialized();
    } catch (error) {
      this.logger.error('Failed to initialize models:', error);
      throw new HttpException(
        'Service temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    const models = this.modelManager.getModels();
    if (models.length === 0) {
      throw new InternalServerErrorException('No AI models are available');
    }

    // Generate flashcards
    try {
      const result = await this.flashcardGenerator.generate(
        text,
        openAiApiKey,
        models
      );
      return result as unknown as OpenRouterResponse;
    } catch (error) {
      // Re-throw HTTP exceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Convert other errors to HTTP exceptions
      throw new HttpException(
        'An unexpected error occurred during flashcard generation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Utility methods for monitoring and debugging
  async refreshModels(): Promise<void> {
    this.logger.log('Manually refreshing models...');
    try {
      await this.modelManager.refresh();
      this.logger.log('Models refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh models:', error);
      throw new HttpException(
        'Failed to refresh models from OpenRouter API',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  getAvailableModels(): string[] {
    return this.modelManager.getModels();
  }

  getCurrentModelIndex(): number {
    return this.currentModelIndex;
  }

  getServiceStatus(): {
    initialized: boolean;
    totalModels: number;
    currentModel: string | null;
    fallbackMode: boolean;
    connectionStats: { totalClients: number; clientKeys: string[] };
  } {
    const models = this.modelManager.getModels();
    const connectionStats = this.connectionManager.getStats();

    return {
      initialized: models.length > 0,
      totalModels: models.length,
      currentModel: models.length > 0 ? models[this.currentModelIndex] : null,
      fallbackMode: this.modelManager.isUsingFallback(),
      connectionStats,
    };
  }

  // Clear connection for a specific API key (for memory management)
  clearConnection(apiKey: string): void {
    this.connectionManager.clearClient(apiKey);
    this.logger.debug('Cleared connection for API key');
  }
}
