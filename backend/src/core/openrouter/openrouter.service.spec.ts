import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterService,
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
      const mockResponse = {
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
      };

      jest.spyOn(service as any, 'tryNextModel').mockImplementation();
      const openaiInstance = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      };
      (service as any).openAIInstances.set(
        'openai/gpt-3.5-turbo',
        openaiInstance
      );

      const result = await service.generateFlashcards('test text');
      expect(result).toEqual(mockResponse);
    });

    it('should try next model on error', async () => {
      const error = new Error('Rate limit exceeded');
      const openaiInstance = {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(error),
          },
        },
      };
      (service as any).openAIInstances.set(
        'openai/gpt-3.5-turbo',
        openaiInstance
      );

      const tryNextModelSpy = jest.spyOn(service as any, 'tryNextModel');

      try {
        await service.generateFlashcards('test text');
        // Should not reach here as we expect an error
        expect(true).toBe(false);
      } catch (e: unknown) {
        expect(tryNextModelSpy).toHaveBeenCalled();
        if (e instanceof Error) {
          expect(e.message).toContain(
            'Failed to generate flashcards after trying all models'
          );
        }
      }
    });
  });
});
