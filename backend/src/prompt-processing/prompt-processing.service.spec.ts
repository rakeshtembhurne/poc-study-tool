import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PromptProcessingService } from './prompt-processing.service';
import { FlashcardStrategyFactory } from '@/file-processing/factories/flashcard-strategy.factory';
import { UserRepository } from '@/file-processing/repositories/user.repository';
describe('PromptProcessingService', () => {
  let service: PromptProcessingService;
  let userRepo: { findUserApiKey: jest.Mock };
  let factory: { getStrategyForApiKey: jest.Mock };

  beforeEach(async () => {
    userRepo = { findUserApiKey: jest.fn() };
    factory = { getStrategyForApiKey: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptProcessingService,
        { provide: 'IUserRepository', useValue: userRepo },
        { provide: FlashcardStrategyFactory, useValue: factory },
      ],
    }).compile();

    service = module.get<PromptProcessingService>(PromptProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw UnauthorizedException if user has no API key', async () => {
    userRepo.findUserApiKey.mockResolvedValue({});
    await expect(
      service.processPrompt({ text: 'hi', deckName: 'test' }, 'user1')
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should call strategy and return result', async () => {
    const mockStrategy = {
      generateFlashcards: jest.fn().mockResolvedValue({ parsedFlashcards: [1, 2], totalCards: 2 }),
    };
    userRepo.findUserApiKey.mockResolvedValue({ openAiApiKey: 'key123' });
    factory.getStrategyForApiKey.mockReturnValue(mockStrategy);

    const result = await service.processPrompt({ text: 'hi', deckName: 'Deck 1' }, 'user1');

    expect(mockStrategy.generateFlashcards).toHaveBeenCalledWith('hi', 'key123');
    expect(result.parsedFlashcards).toEqual([1, 2]);
    expect(result.totalCards).toBe(2);
  });
});
