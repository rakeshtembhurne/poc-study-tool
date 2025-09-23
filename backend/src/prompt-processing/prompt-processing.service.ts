import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PromptInputDto } from './dto/prompt-input.dto';
import { FlashcardStrategyFactory } from '@/file-processing/factories/flashcard-strategy.factory';
import { UserRepository } from '@/file-processing/repositories/user.repository';

@Injectable()
export class PromptProcessingService {
  constructor(
    private readonly strategyFactory: FlashcardStrategyFactory, // ✅ factory
    @Inject('IUserRepository') private readonly userRepo: UserRepository // ✅ token match
  ) {}

  async processPrompt(dto: PromptInputDto, userId: string) {
    const { text, deckName } = dto;

    // Fetch user's API key from DB
    const user = await this.userRepo.findUserApiKey(userId);
    if (!user?.openAiApiKey) {
      throw new UnauthorizedException('User API key missing');
    }

    const apiKey = user.openAiApiKey;

    // Pick strategy based on API key
    const strategy = this.strategyFactory.getStrategyForApiKey(apiKey);

    // Generate flashcards
    const result = await strategy.generateFlashcards(text, apiKey);

    return {
      deckName,
      ...result,
    };
  }
}
