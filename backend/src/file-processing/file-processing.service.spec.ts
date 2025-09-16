import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { FileProcessingService } from './file-processing.service';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';
import { FlashcardStrategyFactory } from './factories/flashcard-strategy.factory';
import fileProcessingConfig from '@/core/config/file-processing.config';

describe('FileProcessingService', () => {
  let service: FileProcessingService;

  beforeEach(async () => {
    const mockPdfProcessingService = {
      extractTextOnly: jest.fn(),
    };

    const mockTextProcessingService = {
      processTextFromPath: jest.fn(),
      processLargeTextFile: jest.fn(),
    };

    const mockUserRepository = {
      findUserApiKey: jest.fn().mockResolvedValue({
        id: '1',
        openAiApiKey: 'test-key',
      }),
    };

    const mockFlashcardStrategyFactory = {
      getStrategyForApiKey: jest.fn().mockReturnValue({
        generateFlashcards: jest.fn().mockResolvedValue({
          parsedFlashcards: [{ question: 'Test?', answer: 'Test.' }],
          totalCards: 1,
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(fileProcessingConfig)],
      providers: [
        FileProcessingService,
        { provide: PdfProcessingService, useValue: mockPdfProcessingService },
        { provide: TextProcessingService, useValue: mockTextProcessingService },
        { provide: 'IUserRepository', useValue: mockUserRepository },
        {
          provide: FlashcardStrategyFactory,
          useValue: mockFlashcardStrategyFactory,
        },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
