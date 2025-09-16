import { Injectable } from '@nestjs/common';
import {
  IFlashcardStrategy,
  OpenRouterFlashcardStrategy,
  OpenAIFlashcardStrategy,
} from '../strategies/flashcard-generation.strategy';

export enum FlashcardProvider {
  OPEN_ROUTER = 'openrouter',
  OPENAI = 'openai',
}

@Injectable()
export class FlashcardStrategyFactory {
  constructor(
    private readonly openRouterStrategy: OpenRouterFlashcardStrategy,
    private readonly openAIStrategy: OpenAIFlashcardStrategy
  ) {}

  createStrategy(
    provider: FlashcardProvider = FlashcardProvider.OPEN_ROUTER
  ): IFlashcardStrategy {
    switch (provider) {
      case FlashcardProvider.OPEN_ROUTER:
        return this.openRouterStrategy;
      case FlashcardProvider.OPENAI:
        return this.openAIStrategy;
      default:
        return this.openRouterStrategy;
    }
  }

  getStrategyForApiKey(apiKey: string): IFlashcardStrategy {
    // Validate API key is provided
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    // For now, always use OpenRouter since OpenAI strategy is not implemented
    // TODO: Implement OpenAI strategy and enable auto-detection
    // Auto-detect provider based on API key format
    // if (apiKey.startsWith('sk-')) {
    //   return this.openAIStrategy;
    // }

    // Default to OpenRouter for all API keys until OpenAI strategy is implemented
    return this.openRouterStrategy;
  }
}
