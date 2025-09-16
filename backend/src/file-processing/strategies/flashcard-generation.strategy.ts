import { Injectable } from '@nestjs/common';
import { OpenRouterService } from '@/core/openrouter/openrouter.service';
import { Flashcard, TokenUsage } from '../types/file-processing.types';

export interface FlashcardResponse {
  parsedFlashcards: Flashcard[];
  totalCards: number;
  model?: string;
  usage?: TokenUsage;
  processingTimeMs?: number;
  confidence?: number;
}

export interface IFlashcardStrategy {
  generateFlashcards(text: string, apiKey: string): Promise<FlashcardResponse>;
  validateApiKey(apiKey: string): boolean;
  getProviderName(): string;
}

@Injectable()
export class OpenRouterFlashcardStrategy implements IFlashcardStrategy {
  constructor(private readonly openRouterService: OpenRouterService) {}

  async generateFlashcards(
    text: string,
    apiKey: string
  ): Promise<FlashcardResponse> {
    const startTime = Date.now();
    const result = await this.openRouterService.generateFlashcards(
      text,
      apiKey
    );
    const processingTimeMs = Date.now() - startTime;

    // Transform result to match our types
    const flashcards: Flashcard[] = (result.parsedFlashcards || []).map(
      (card: any) => ({
        question: card.question || '',
        answer: card.answer || '',
        difficulty: card.difficulty as 'easy' | 'medium' | 'hard' | undefined,
        category: card.category,
        tags: card.tags || [],
      })
    );

    return {
      parsedFlashcards: flashcards,
      totalCards: flashcards.length,
      model: result.model,
      usage: result.usage
        ? {
            promptTokens: result.usage.prompt_tokens || 0,
            completionTokens: result.usage.completion_tokens || 0,
            totalTokens: result.usage.total_tokens || 0,
            cost: undefined, // Cost field doesn't exist in current interface
          }
        : undefined,
      processingTimeMs,
      confidence: undefined, // Confidence field doesn't exist in current interface
    };
  }

  validateApiKey(apiKey: string): boolean {
    return !!(apiKey && apiKey.trim().length > 0);
  }

  getProviderName(): string {
    return 'OpenRouter';
  }
}

// Future strategy for other providers
@Injectable()
export class OpenAIFlashcardStrategy implements IFlashcardStrategy {
  async generateFlashcards(
    text: string,
    apiKey: string
  ): Promise<FlashcardResponse> {
    // Future implementation for direct OpenAI integration
    throw new Error(
      `OpenAI strategy not implemented yet for text: ${text.substring(0, 50)}... with key: ${apiKey.substring(0, 10)}...`
    );
  }

  validateApiKey(apiKey: string): boolean {
    return !!(apiKey && apiKey.startsWith('sk-'));
  }

  getProviderName(): string {
    return 'OpenAI';
  }
}
