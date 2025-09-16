import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import { ModelManager } from './services/model-manager.service';
import { ConnectionManager } from './services/connection-manager.service';
import { FlashcardGenerator } from './services/flashcard-generator.service';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(async () => {
    const mockModelManager = {
      ensureInitialized: jest.fn().mockResolvedValue(undefined),
      getModels: jest.fn().mockReturnValue(['openai/gpt-3.5-turbo']),
      isUsingFallback: jest.fn().mockReturnValue(false),
      refresh: jest.fn().mockResolvedValue(undefined),
    };

    const mockConnectionManager = {
      getStats: jest.fn().mockReturnValue({ totalClients: 0, clientKeys: [] }),
      clearClient: jest.fn(),
    };

    const mockFlashcardGenerator = {
      generate: jest.fn().mockResolvedValue({
        id: 'test-id',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Q: Test Question\nA: Test Answer',
            },
            index: 0,
            finish_reason: 'stop',
          },
        ],
        created: Date.now(),
        model: 'openai/gpt-3.5-turbo',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterService,
        { provide: ModelManager, useValue: mockModelManager },
        { provide: ConnectionManager, useValue: mockConnectionManager },
        { provide: FlashcardGenerator, useValue: mockFlashcardGenerator },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'OPENROUTER_API_KEY':
                  return 'test-api-key';
                case 'SITE_URL':
                  return 'http://test.com';
                case 'SITE_NAME':
                  return 'Test Site';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenRouterService>(OpenRouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFlashcards', () => {
    it('should generate flashcards successfully', async () => {
      const result = await service.generateFlashcards(
        'test text',
        'test-api-key'
      );

      expect(result).toEqual({
        id: 'test-id',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Q: Test Question\nA: Test Answer',
            },
            index: 0,
            finish_reason: 'stop',
          },
        ],
        created: expect.any(Number),
        model: 'openai/gpt-3.5-turbo',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      });
    });
  });
});
