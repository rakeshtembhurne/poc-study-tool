import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { FileProcessingModule } from '../../file-processing.module';
import fileProcessingConfig from '@/core/config/file-processing.config';
import flashcardConfig from '@/core/config/flashcard.config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { OpenRouterService } from '@/core/openrouter/openrouter.service';
import { OpenRouterFlashcardStrategy } from '../../strategies/flashcard-generation.strategy';
import { FlashcardStrategyFactory } from '../../factories/flashcard-strategy.factory';

describe('File Processing Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [fileProcessingConfig, flashcardConfig],
        }),
        FileProcessingModule,
        // Mock modules for testing
        {
          module: class MockPrismaModule {},
          providers: [
            {
              provide: 'PrismaService',
              useValue: {
                user: {
                  findUnique: jest.fn().mockResolvedValue({
                    id: 5,
                    openAiApiKey: 'test-openai-key',
                  }),
                },
              },
            },
          ],
          exports: ['PrismaService'],
        },
        {
          module: class MockAuthModule {},
          providers: [
            {
              provide: JwtService,
              useValue: {
                sign: jest.fn().mockImplementation((payload) => {
                  // Create a mock JWT-like token
                  const header = Buffer.from(
                    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
                  ).toString('base64');
                  const payloadB64 = Buffer.from(
                    JSON.stringify(payload)
                  ).toString('base64');
                  const signature = 'mock-signature';
                  return `${header}.${payloadB64}.${signature}`;
                }),
                verify: jest
                  .fn()
                  .mockReturnValue({ sub: '1', email: 'test@example.com' }),
              },
            },
          ],
          exports: [JwtService],
        },
        {
          module: class MockUserRepositoryModule {},
          providers: [
            {
              provide: 'IUserRepository',
              useValue: {
                findUserApiKey: jest.fn().mockResolvedValue({
                  id: '1',
                  openAiApiKey: 'test-openai-key',
                }),
                findUserWithProcessingStats: jest.fn().mockResolvedValue({
                  id: '1',
                  openAiApiKey: 'test-openai-key',
                  processingFileCount: 0,
                }),
              },
            },
          ],
          exports: ['IUserRepository'],
        },
      ],
    })
      .overrideProvider('IUserRepository')
      .useValue({
        findUserApiKey: jest.fn().mockResolvedValue({
          id: '1',
          openAiApiKey: 'test-openai-key',
        }),
        findUserWithProcessingStats: jest.fn().mockResolvedValue({
          id: '1',
          openAiApiKey: 'test-openai-key',
          processingFileCount: 0,
        }),
      })
      .overrideProvider('AuthService')
      .useValue({
        verifyToken: jest
          .fn()
          .mockResolvedValue({ sub: '1', email: 'test@example.com' }),
      })
      .overrideProvider(OpenRouterService)
      .useValue({
        generateFlashcards: jest.fn().mockResolvedValue({
          parsedFlashcards: [
            {
              question: 'What is integration testing?',
              answer: 'Testing multiple components together',
            },
            {
              question: 'Why is integration testing important?',
              answer: 'It verifies component interactions',
            },
          ],
          totalCards: 2,
          model: 'test-model',
          usage: {
            prompt_tokens: 100,
            completion_tokens: 50,
            total_tokens: 150,
          },
        }),
        validateApiKey: jest.fn().mockReturnValue(true),
      })
      .overrideProvider(OpenRouterFlashcardStrategy)
      .useValue({
        generateFlashcards: jest.fn().mockResolvedValue({
          parsedFlashcards: [
            {
              question: 'What is integration testing?',
              answer: 'Testing multiple components together',
            },
            {
              question: 'Why is integration testing important?',
              answer: 'It verifies component interactions',
            },
          ],
          totalCards: 2,
          processingTimeMs: 100,
        }),
        validateApiKey: jest.fn().mockReturnValue(true),
        getProviderName: jest.fn().mockReturnValue('OpenRouter'),
      })
      .overrideProvider(FlashcardStrategyFactory)
      .useValue({
        getStrategyForApiKey: jest.fn().mockReturnValue({
          generateFlashcards: jest.fn().mockResolvedValue({
            parsedFlashcards: [
              {
                question: 'What is integration testing?',
                answer: 'Testing multiple components together',
              },
              {
                question: 'Why is integration testing important?',
                answer: 'It verifies component interactions',
              },
            ],
            totalCards: 2,
            processingTimeMs: 100,
          }),
          validateApiKey: jest.fn().mockReturnValue(true),
          getProviderName: jest.fn().mockReturnValue('OpenRouter'),
        }),
        createStrategy: jest.fn().mockReturnValue({
          generateFlashcards: jest.fn().mockResolvedValue({
            parsedFlashcards: [
              {
                question: 'What is integration testing?',
                answer: 'Testing multiple components together',
              },
              {
                question: 'Why is integration testing important?',
                answer: 'It verifies component interactions',
              },
            ],
            totalCards: 2,
            processingTimeMs: 100,
          }),
          validateApiKey: jest.fn().mockReturnValue(true),
          getProviderName: jest.fn().mockReturnValue('OpenRouter'),
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers.authorization;

          // If no authorization header, deny access
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
          }

          // If valid bearer token, set user and allow access
          req.user = { sub: '1', email: 'test@example.com' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate auth token for testing
    authToken = jwtService.sign({ sub: '1', email: 'test@example.com' });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /file-processing/upload', () => {
    it('should upload and process a text file successfully', async () => {
      const testFile = createTestFile(
        'test-document.txt',
        'This is a test document for integration testing. It contains sample content.'
      );

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'Integration test file')
        .expect(201);

      console.log(
        'Full response body:',
        JSON.stringify(response.body, null, 2)
      );
      expect(response.body).toMatchObject({
        id: expect.any(String),
        originalname: 'test-document.txt',
        mimetype: 'text/plain',
        size: expect.any(Number),
        description: 'Integration test file',
        flashcardGenerationStatus: 'success', // We'll debug this step by step
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should handle unsupported file types with proper error', async () => {
      const testFile = createTestFile(
        'test-image.jpg',
        'fake image content',
        'image/jpeg'
      );

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'Unsupported file type test')
        .expect(500);

      expect(response.body).toMatchObject({
        statusCode: 500,
        message: expect.stringContaining('Internal server error'),
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should handle large files with streaming', async () => {
      const largeContent = 'Large file content. '.repeat(300000); // ~6MB
      const testFile = createTestFile('large-document.txt', largeContent);

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'Large file streaming test')
        .expect(201);

      expect(response.body).toMatchObject({
        flashcardGenerationStatus: 'success',
        extractedText: expect.any(String),
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should handle authentication errors', async () => {
      const testFile = createTestFile('test-auth.txt', 'Test content');

      await request(app.getHttpServer())
        .post('/file-processing/upload')
        // No authorization header
        .attach('file', testFile.path)
        .field('description', 'Auth test')
        .expect(403);

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should validate file size limits', async () => {
      const oversizedContent = 'X'.repeat(11 * 1024 * 1024); // 11MB (over 10MB limit)
      const testFile = createTestFile('oversized.txt', oversizedContent);

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'File size validation test')
        .expect(413);

      expect(response.body).toMatchObject({
        statusCode: 413,
        message: 'File too large',
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });
  });

  describe('POST /file-processing/upload/multiple', () => {
    it('should upload and process multiple files successfully', async () => {
      const testFiles = [
        createTestFile(
          'doc1.txt',
          'First document content for testing multiple file upload.'
        ),
        createTestFile(
          'doc2.txt',
          'Second document content with different information.'
        ),
        createTestFile(
          'doc3.txt',
          'Third document content to complete the batch.'
        ),
      ];

      const request_builder = request(app.getHttpServer())
        .post('/file-processing/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`);

      testFiles.forEach((file) => {
        request_builder.attach('files', file.path);
      });

      const response = await request_builder
        .field('descriptions', JSON.stringify(['Doc 1', 'Doc 2', 'Doc 3']))
        .expect(201);

      expect(response.body).toHaveLength(3);
      response.body.forEach((file: any, index: number) => {
        expect(file).toMatchObject({
          id: expect.any(String),
          originalname: `doc${index + 1}.txt`,
          flashcardGenerationStatus: 'success',
        });
      });

      // Cleanup
      testFiles.forEach((file) => cleanupTestFile(file.path));
    });

    it('should handle mixed success and failure scenarios', async () => {
      const testFiles = [
        createTestFile('valid.txt', 'Valid document content.'),
        createTestFile(
          'invalid.exe',
          'Dangerous content',
          'application/octet-stream'
        ),
      ];

      const request_builder = request(app.getHttpServer())
        .post('/file-processing/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`);

      testFiles.forEach((file) => {
        request_builder.attach('files', file.path);
      });

      await request_builder
        .field('descriptions', JSON.stringify(['Valid doc', 'Invalid file']))
        .expect(500); // Should fail due to invalid file

      // Cleanup
      testFiles.forEach((file) => cleanupTestFile(file.path));
    });

    it('should respect maximum file count limits', async () => {
      const testFiles = Array.from({ length: 6 }, (_, i) =>
        createTestFile(`doc${i + 1}.txt`, `Document ${i + 1} content.`)
      );

      const request_builder = request(app.getHttpServer())
        .post('/file-processing/upload/multiple')
        .set('Authorization', `Bearer ${authToken}`);

      testFiles.forEach((file) => {
        request_builder.attach('files', file.path);
      });

      const response = await request_builder
        .field(
          'descriptions',
          JSON.stringify(testFiles.map((_, i) => `Doc ${i + 1}`))
        )
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('Too many files'),
      });

      // Cleanup
      testFiles.forEach((file) => cleanupTestFile(file.path));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty files gracefully', async () => {
      const testFile = createTestFile('empty.txt', '');

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'Empty file test')
        .expect(201);

      expect(response.body).toMatchObject({
        flashcardGenerationStatus: 'failed',
        flashcardError: expect.stringContaining(
          'Flashcard generation service error'
        ),
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should handle files with special characters in names', async () => {
      const testFile = createTestFile(
        'test-file-with-ñoñó-characters.txt',
        'Content with special characters: áéíóú ñ'
      );

      const response = await request(app.getHttpServer())
        .post('/file-processing/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFile.path)
        .field('description', 'Special characters test')
        .expect(201);

      expect(response.body).toMatchObject({
        originalname: expect.stringContaining('test-file-with'),
        flashcardGenerationStatus: 'success',
      });

      // Cleanup
      cleanupTestFile(testFile.path);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 3 }, (_, i) => {
        const testFile = createTestFile(
          `concurrent-${i}.txt`,
          `Concurrent test document ${i} content.`
        );

        return request(app.getHttpServer())
          .post('/file-processing/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFile.path)
          .field('description', `Concurrent test ${i}`)
          .then((response) => {
            cleanupTestFile(testFile.path);
            return response;
          });
      });

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.flashcardGenerationStatus).toBe('success');
      });
    });
  });
});

// Helper functions
function createTestFile(
  filename: string,
  content: string,
  mimetype = 'text/plain'
): { path: string; mimetype: string } {
  const tmpDir = '/tmp';
  const filePath = path.join(tmpDir, filename);

  fs.writeFileSync(filePath, content);

  return { path: filePath, mimetype };
}

function cleanupTestFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup test file ${filePath}:`, error);
  }
}
