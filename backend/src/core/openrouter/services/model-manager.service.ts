import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OpenRouterApiModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality?: string;
  };
}

@Injectable()
export class ModelManager {
  private readonly logger = new Logger(ModelManager.name);
  private models: string[] = [];
  private modelsInitialized = false;
  private modelsInitializationPromise: Promise<void> | null = null;

  private readonly FALLBACK_MODELS = [
    'openai/gpt-3.5-turbo',
    'mistralai/mistral-7b-instruct',
    'google/gemma-7b-it',
    'meta-llama/llama-3-8b-instruct',
    'anthropic/claude-3-haiku',
  ];

  private readonly MAX_MODELS_TO_USE = 7;
  private readonly MIN_CONTEXT_LENGTH = 4096;

  constructor(private readonly configService: ConfigService) {}

  async ensureInitialized(): Promise<void> {
    if (this.modelsInitialized) {
      return;
    }

    if (!this.modelsInitializationPromise) {
      this.modelsInitializationPromise = this.initializeModels();
    }

    return this.modelsInitializationPromise;
  }

  private async initializeModels(): Promise<void> {
    try {
      this.logger.log('Initializing OpenRouter models...');
      await this.fetchAndSetModels();
      this.modelsInitialized = true;
      this.logger.log('Models initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize models', error);
      this.modelsInitializationPromise = null;
      throw error;
    }
  }

  private async fetchAndSetModels(): Promise<void> {
    const startTime = Date.now();
    const baseURL =
      this.configService.get('OPENROUTER_BASE_URL') ||
      'https://openrouter.ai/api/v1';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseURL}/models`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OpenRouter-Service/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: { data: OpenRouterApiModel[] } = await response.json();

      if (!data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      const freeModels = data.data
        .filter((model) => {
          try {
            const promptPrice = parseFloat(model.pricing?.prompt || '1');
            const completionPrice = parseFloat(
              model.pricing?.completion || '1'
            );
            const contextLength = model.context_length || 0;
            const isTextModel =
              model.architecture?.modality !== 'multimodal' &&
              model.architecture?.modality !== 'image';

            return (
              promptPrice === 0 &&
              completionPrice === 0 &&
              contextLength >= this.MIN_CONTEXT_LENGTH &&
              isTextModel
            );
          } catch (error) {
            this.logger.debug(
              `Skipping model ${model.id} due to parsing error:`,
              error
            );
            return false;
          }
        })
        .sort((a, b) => {
          if (b.context_length !== a.context_length) {
            return b.context_length - a.context_length;
          }
          return a.name.localeCompare(b.name);
        })
        .map((model) => model.id);

      if (freeModels.length === 0) {
        this.logger.warn(
          'No suitable free models found. Using fallback models.'
        );
        this.models = [...this.FALLBACK_MODELS];
      } else {
        this.models = freeModels.slice(0, this.MAX_MODELS_TO_USE);
        const elapsedTime = Date.now() - startTime;
        this.logger.log(
          `Found ${freeModels.length} free models in ${elapsedTime}ms. Using: ${this.models.join(', ')}`
        );
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to fetch models in ${elapsedTime}ms: ${errorMessage}. Using fallback models.`,
        error instanceof Error ? error.stack : undefined
      );
      this.models = [...this.FALLBACK_MODELS];
    }
  }

  getModels(): string[] {
    return [...this.models];
  }

  async refresh(): Promise<void> {
    this.logger.log('Refreshing models...');
    this.modelsInitialized = false;
    this.modelsInitializationPromise = null;
    await this.ensureInitialized();
  }

  isUsingFallback(): boolean {
    return JSON.stringify(this.models) === JSON.stringify(this.FALLBACK_MODELS);
  }
}
