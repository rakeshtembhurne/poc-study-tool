import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  OpenRouterConfig,
  OpenRouterResponse,
} from './interfaces/openrouter.interface';

// Define a more specific type for the model data from OpenRouter API
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
  top_provider?: {
    max_completion_tokens?: number;
  };
}

interface ModelError {
  model: string;
  error: string;
  timestamp: string;
  attempt: number;
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private models: string[] = [];
  private currentModelIndex = 0;
  private config: Omit<OpenRouterConfig, 'apiKey'>;

  // For lazy-loading the model list
  private modelsInitialized = false;
  private modelsInitializationPromise: Promise<void> | null = null;

  // Constants for better maintainability
  private readonly FALLBACK_MODELS = [
    'openai/gpt-3.5-turbo',
    'mistralai/mistral-7b-instruct',
    'google/gemma-7b-it',
    'meta-llama/llama-3-8b-instruct',
    'anthropic/claude-3-haiku',
  ];

  private readonly REQUEST_TIMEOUT_MS = 45000; // 45 seconds
  private readonly MAX_MODELS_TO_USE = 7;
  private readonly MIN_CONTEXT_LENGTH = 4096;
  private readonly RETRY_DELAY_MS = 1500;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      baseURL:
        this.configService.get('OPENROUTER_BASE_URL') ||
        'https://openrouter.ai/api/v1',
    };

    this.logger.log('OpenRouter service initialized with lazy loading');
  }

  private async ensureModelsInitialized(): Promise<void> {
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
      this.logger.log('Initializing OpenRouter models on-demand...');
      await this.fetchAndSetModels();
      this.modelsInitialized = true;
      this.logger.log('Models initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize models on-demand', error);
      this.modelsInitializationPromise = null; // Allow retry
      throw error;
    }
  }

  private async fetchAndSetModels(): Promise<void> {
    const startTime = Date.now();
    this.logger.debug('Fetching available models from OpenRouter API...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for model fetching

      const response = await fetch(`${this.config.baseURL}/models`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OpenRouter-Service/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response
          .text()
          .catch(() => 'Unable to read error body');
        throw new HttpException(
          `OpenRouter API returned ${response.status}: ${response.statusText}. Body: ${errorBody}`,
          response.status >= 500
            ? HttpStatus.SERVICE_UNAVAILABLE
            : HttpStatus.BAD_REQUEST
        );
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
          // Sort by context length descending, then by name
          if (b.context_length !== a.context_length) {
            return b.context_length - a.context_length;
          }
          return a.name.localeCompare(b.name);
        })
        .map((model) => model.id);

      if (freeModels.length === 0) {
        this.logger.warn(
          'No suitable free models found from API. Using fallback models.'
        );
        this.models = [...this.FALLBACK_MODELS];
      } else {
        this.models = freeModels.slice(0, this.MAX_MODELS_TO_USE);
        const elapsedTime = Date.now() - startTime;
        this.logger.log(
          `Found ${freeModels.length} free models in ${elapsedTime}ms. Using top ${this.models.length}: ${this.models.join(', ')}`
        );
      }
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Failed to fetch models from OpenRouter API in ${elapsedTime}ms: ${errorMessage}. Using fallback models.`,
        error instanceof Error ? error.stack : undefined
      );

      this.models = [...this.FALLBACK_MODELS];
    }
  }

  private getCurrentModel(): string {
    if (this.models.length === 0) {
      throw new InternalServerErrorException(
        'No models available for processing'
      );
    }
    return this.models[this.currentModelIndex];
  }

  private moveToNextModel(): string {
    if (this.models.length === 0) {
      throw new InternalServerErrorException(
        'No models available for processing'
      );
    }

    const previousModel = this.models[this.currentModelIndex];
    this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
    const nextModel = this.models[this.currentModelIndex];

    this.logger.debug(`Switching from model ${previousModel} to ${nextModel}`);
    return nextModel;
  }

  private createOpenAIClient(apiKey: string): OpenAI {
    return new OpenAI({
      baseURL: this.config.baseURL,
      apiKey: apiKey,
      timeout: this.REQUEST_TIMEOUT_MS,
      maxRetries: 0, // We handle retries manually
      defaultHeaders: {
        'User-Agent': 'OpenRouter-Service/1.0',
      },
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private validateFlashcardResponse(response: any): boolean {
    try {
      if (!response?.choices?.[0]?.message?.content) {
        return false;
      }

      const content = response.choices[0].message.content.trim();
      if (content.length < 10) {
        // Minimum reasonable response length
        return false;
      }

      // Check if response contains flashcard-like content
      const hasQuestionPattern = /Q\s*:/i.test(content);
      const hasAnswerPattern = /A\s*:/i.test(content);

      return hasQuestionPattern && hasAnswerPattern;
    } catch (error) {
      this.logger.debug('Response validation failed:', error);
      return false;
    }
  }

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
      await this.ensureModelsInitialized();
    } catch (error) {
      this.logger.error('Failed to initialize models:', error);
      throw new HttpException(
        'Service temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    if (this.models.length === 0) {
      throw new InternalServerErrorException('No AI models are available');
    }

    const openai = this.createOpenAIClient(openAiApiKey);
    const maxAttempts = Math.min(this.models.length, 5); // Cap attempts to prevent excessive retries
    const modelErrors: ModelError[] = [];
    const startTime = Date.now();

    const prompt = `Create concise flashcards from the following text. Format each flashcard as:
Q: [clear, specific question]
A: [brief, accurate answer]

Guidelines:
- Generate as many unique and relevant flashcards as possible
- Keep questions clear and specific
- Keep answers brief but complete
- Focus on key concepts, facts, and important details

Text to create flashcards from:
${text.trim()}`;

    this.logger.log(
      `Starting flashcard generation with ${maxAttempts} max attempts across ${this.models.length} models`
    );

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentModel = this.getCurrentModel();
      const attemptStartTime = Date.now();

      this.logger.log(
        `Attempt ${attempt + 1}/${maxAttempts}: Generating flashcards with model "${currentModel}"`
      );

      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`Request timeout after ${this.REQUEST_TIMEOUT_MS}ms`)
              ),
            this.REQUEST_TIMEOUT_MS
          )
        );

        // Race between the actual request and timeout
        const completionPromise = openai.chat.completions.create({
          model: currentModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.min(2048, 4000), // Reasonable limit for flashcards
          temperature: 0.3, // Lower temperature for more consistent output
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        });

        const completion = (await Promise.race([
          completionPromise,
          timeoutPromise,
        ])) as any;

        const attemptElapsedTime = Date.now() - attemptStartTime;

        // Validate the response
        if (!this.validateFlashcardResponse(completion)) {
          throw new Error(
            'Generated response does not contain valid flashcard content'
          );
        }

        // Log successful generation
        this.logger.log(
          `✅ Successfully generated flashcards with model "${currentModel}" in ${attemptElapsedTime}ms. ` +
            `Usage: ${completion.usage?.total_tokens || 'unknown'} tokens`
        );

        const totalElapsedTime = Date.now() - startTime;
        this.logger.log(`Total generation time: ${totalElapsedTime}ms`);

        return completion as unknown as OpenRouterResponse;
      } catch (error: any) {
        const attemptElapsedTime = Date.now() - attemptStartTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorCode = error?.code || error?.type || 'UNKNOWN';

        this.logger.warn(
          `❌ Attempt ${attempt + 1} failed for model "${currentModel}" in ${attemptElapsedTime}ms: [${errorCode}] ${errorMessage}`
        );

        // Store error details
        modelErrors.push({
          model: currentModel,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
        });

        // Check if we should continue trying
        const shouldContinue = attempt < maxAttempts - 1;

        if (shouldContinue) {
          this.moveToNextModel();

          // Add delay between attempts to avoid overwhelming the API
          if (attempt > 0) {
            await this.delay(this.RETRY_DELAY_MS);
          }
        }
      }
    }

    // All attempts failed
    const totalElapsedTime = Date.now() - startTime;

    this.logger.error(
      `Failed to generate flashcards after ${maxAttempts} attempts in ${totalElapsedTime}ms`,
      { modelErrors }
    );

    // Return structured error response
    throw new HttpException(
      {
        message:
          'Unable to generate flashcards. All available AI models failed to respond.',
        details:
          'This might be due to high API usage, model unavailability, or service issues.',
        attempts: maxAttempts,
        totalTimeMs: totalElapsedTime,
        modelErrors: modelErrors.map(({ model, error }) => ({ model, error })),
        suggestedActions: [
          'Try again in a few minutes',
          'Check if your API key is valid and has sufficient credits',
          'Try with a shorter text input',
        ],
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  // Utility methods for monitoring and debugging
  async refreshModels(): Promise<void> {
    this.logger.log('Manually refreshing models...');
    this.modelsInitialized = false;
    this.modelsInitializationPromise = null;
    await this.ensureModelsInitialized();
    this.logger.log('Models refreshed successfully');
  }

  getAvailableModels(): string[] {
    return [...this.models];
  }

  getCurrentModelIndex(): number {
    return this.currentModelIndex;
  }

  getServiceStatus(): {
    initialized: boolean;
    totalModels: number;
    currentModel: string | null;
    fallbackMode: boolean;
  } {
    return {
      initialized: this.modelsInitialized,
      totalModels: this.models.length,
      currentModel: this.models.length > 0 ? this.getCurrentModel() : null,
      fallbackMode:
        JSON.stringify(this.models) === JSON.stringify(this.FALLBACK_MODELS),
    };
  }
}
