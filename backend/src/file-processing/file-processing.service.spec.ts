import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingService } from './file-processing.service';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';
import { OpenRouterService } from '@/core/openrouter/openrouter.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('FileProcessingService', () => {
  let service: FileProcessingService;

  beforeEach(async () => {
    const mockPdfProcessingService = {
      extractTextOnly: jest.fn(),
    };

    const mockTextProcessingService = {
      processTextFromPath: jest.fn(),
    };

    const mockOpenRouterService = {
      generateFlashcards: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingService,
        { provide: PdfProcessingService, useValue: mockPdfProcessingService },
        { provide: TextProcessingService, useValue: mockTextProcessingService },
        { provide: OpenRouterService, useValue: mockOpenRouterService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
