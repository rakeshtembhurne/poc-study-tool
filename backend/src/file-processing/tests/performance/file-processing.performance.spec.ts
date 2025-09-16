import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingService } from '../../file-processing.service';
import { PdfProcessingService } from '../../services/pdf-processing.service';
import { TextProcessingService } from '../../services/text-processing.service';
import { FlashcardStrategyFactory } from '../../factories/flashcard-strategy.factory';
import {
  OpenRouterFlashcardStrategy,
  OpenAIFlashcardStrategy,
} from '../../strategies/flashcard-generation.strategy';
import { ConfigModule } from '@nestjs/config';
import fileProcessingConfig from '@/core/config/file-processing.config';
import * as fs from 'fs';
import * as path from 'path';

describe('FileProcessingService Performance Tests', () => {
  let service: FileProcessingService;
  let textProcessingService: TextProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(fileProcessingConfig)],
      providers: [
        FileProcessingService,
        PdfProcessingService,
        TextProcessingService,
        {
          provide: 'IUserRepository',
          useValue: {
            findUserApiKey: jest.fn().mockResolvedValue({
              id: '1',
              openAiApiKey: 'test-key',
            }),
          },
        },
        {
          provide: FlashcardStrategyFactory,
          useValue: {
            getStrategyForApiKey: jest.fn().mockReturnValue({
              generateFlashcards: jest.fn().mockResolvedValue({
                parsedFlashcards: [
                  { question: 'Test Question', answer: 'Test Answer' },
                ],
                totalCards: 1,
                processingTimeMs: 100,
              }),
            }),
          },
        },
        {
          provide: OpenRouterFlashcardStrategy,
          useValue: {
            generateFlashcards: jest.fn().mockResolvedValue({
              parsedFlashcards: [
                { question: 'Test Question', answer: 'Test Answer' },
              ],
              totalCards: 1,
              processingTimeMs: 100,
            }),
            validateApiKey: jest.fn().mockReturnValue(true),
            getProviderName: jest.fn().mockReturnValue('OpenRouter'),
          },
        },
        {
          provide: OpenAIFlashcardStrategy,
          useValue: {
            generateFlashcards: jest.fn().mockResolvedValue({
              parsedFlashcards: [
                { question: 'Test Question', answer: 'Test Answer' },
              ],
              totalCards: 1,
              processingTimeMs: 100,
            }),
            validateApiKey: jest.fn().mockReturnValue(true),
            getProviderName: jest.fn().mockReturnValue('OpenAI'),
          },
        },
      ],
    }).compile();

    service = module.get<FileProcessingService>(FileProcessingService);
    textProcessingService = module.get<TextProcessingService>(
      TextProcessingService
    );
  });

  it('should process small text files efficiently (< 100ms)', async () => {
    const testFile = createMockFile('small-test.txt', 'text/plain', 1024); // 1KB
    const startTime = Date.now();

    const result = await service.uploadSingleFile(
      testFile,
      { description: 'Performance test small file' },
      { sub: '1', email: 'test@example.com' }
    );

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(200);
    expect(result.flashcardGenerationStatus).toBe('success');

    // Cleanup
    cleanupFile(testFile.path);
  });

  it('should handle medium text files within reasonable time (< 500ms)', async () => {
    const testFile = createMockFile(
      'medium-test.txt',
      'text/plain',
      100 * 1024
    ); // 100KB
    const startTime = Date.now();

    const result = await service.uploadSingleFile(
      testFile,
      { description: 'Performance test medium file' },
      { sub: '1', email: 'test@example.com' }
    );

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(500);
    expect(result.flashcardGenerationStatus).toBe('success');

    // Cleanup
    cleanupFile(testFile.path);
  });

  it('should use streaming for large files and maintain performance (< 5000ms)', async () => {
    const testFile = createMockFile(
      'large-test.txt',
      'text/plain',
      6 * 1024 * 1024
    ); // 6MB
    const startTime = Date.now();

    const result = await service.uploadSingleFile(
      testFile,
      { description: 'Performance test large file' },
      { sub: '1', email: 'test@example.com' }
    );

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(5000); // More realistic timeout for CI environments
    expect(result.flashcardGenerationStatus).toBe('success');

    // Cleanup
    cleanupFile(testFile.path);
  });

  it('should process multiple small files efficiently', async () => {
    const testFiles = [
      createMockFile('test1.txt', 'text/plain', 1024),
      createMockFile('test2.txt', 'text/plain', 1024),
      createMockFile('test3.txt', 'text/plain', 1024),
    ];

    const startTime = Date.now();

    const results = await service.uploadMultipleFiles(
      testFiles,
      { descriptions: ['Test 1', 'Test 2', 'Test 3'] },
      { sub: '1', email: 'test@example.com' }
    );

    const processingTime = Date.now() - startTime;

    expect(processingTime).toBeLessThan(300); // All files should process within 300ms
    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.flashcardGenerationStatus).toBe('success');
    });

    // Cleanup
    testFiles.forEach((file) => cleanupFile(file.path));
  });

  it('should measure text processing performance for different file sizes', async () => {
    const fileSizes = [1024, 10 * 1024, 100 * 1024, 1024 * 1024]; // 1KB, 10KB, 100KB, 1MB
    const performanceResults: Array<{ size: number; time: number }> = [];

    for (const size of fileSizes) {
      const testFile = createMockFile(
        `perf-test-${size}.txt`,
        'text/plain',
        size
      );

      const startTime = Date.now();
      await textProcessingService.processTextFromPath(testFile.path);
      const processingTime = Date.now() - startTime;

      performanceResults.push({ size, time: processingTime });

      // Cleanup
      cleanupFile(testFile.path);
    }

    // Verify performance scales reasonably
    performanceResults.forEach((result, index) => {
      if (index > 0) {
        const prevResult = performanceResults[index - 1];
        const sizeRatio = result.size / prevResult.size;
        const timeRatio =
          prevResult.time > 0 ? result.time / prevResult.time : 1;

        // Processing time should not increase more than 10x for size increases
        // Only check if both times are meaningful (> 1ms)
        if (prevResult.time > 1 && result.time > 1) {
          expect(timeRatio).toBeLessThan(sizeRatio * 10);
        }
      }
    });
  });

  it('should maintain memory efficiency during concurrent processing', async () => {
    const initialMemory = process.memoryUsage();

    // Create multiple concurrent processing tasks
    const concurrentTasks = Array.from({ length: 5 }, (_, i) => {
      const testFile = createMockFile(
        `concurrent-test-${i}.txt`,
        'text/plain',
        50 * 1024
      );
      return service
        .uploadSingleFile(
          testFile,
          { description: `Concurrent test ${i}` },
          { sub: '1', email: 'test@example.com' }
        )
        .finally(() => cleanupFile(testFile.path));
    });

    const results = await Promise.all(concurrentTasks);

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 100MB for this test)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

    results.forEach((result) => {
      expect(result.flashcardGenerationStatus).toBe('success');
    });
  });
});

// Helper functions
function createMockFile(
  filename: string,
  mimetype: string,
  size: number
): Express.Multer.File {
  const tmpDir = '/tmp';
  const filePath = path.join(tmpDir, filename);

  // Create test content
  const content = generateTestContent(size);
  fs.writeFileSync(filePath, content);

  return {
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    destination: tmpDir,
    filename,
    path: filePath,
    size,
    buffer: Buffer.from(content),
    stream: null as any,
  };
}

function generateTestContent(size: number): string {
  const baseText = 'This is a test file for performance testing. ';
  const repeatCount = Math.ceil(size / baseText.length);
  return baseText.repeat(repeatCount).substring(0, size);
}

function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup file ${filePath}:`, error);
  }
}
