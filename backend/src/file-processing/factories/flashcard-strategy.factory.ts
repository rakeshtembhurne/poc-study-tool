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
    // Auto-detect provider based on API key format
    if (apiKey.startsWith('sk-')) {
      return this.openAIStrategy;
    }

    // Default to OpenRouter for other key formats
    return this.openRouterStrategy;
  }
}
