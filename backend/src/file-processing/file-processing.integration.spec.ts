import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FileProcessingModule } from './file-processing.module';
import { OpenRouterService } from '@/core/openrouter/openrouter.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PrismaService } from '@/prisma/prisma.service';
import { GlobalExceptionFilter } from '@/core/common/filters/global-exception.filter';
import * as path from 'path';
import * as fs from 'fs';

describe('File Processing Integration Tests', () => {
  let app: INestApplication;
  let testFilesDir: string;

  beforeAll(async () => {
    const mockOpenRouterService = {
      generateFlashcards: jest.fn(),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          openAiApiKey: 'test-openai-key',
        }),
      },
      processedFile: {
        create: jest.fn().mockResolvedValue({
          id: 'test-file-id',
          filename: 'test.txt',
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: 33,
          uploadedAt: new Date(),
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FileProcessingModule],
    })
      .overrideProvider(OpenRouterService)
      .useValue(mockOpenRouterService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider('IUserRepository')
      .useValue({
        findUserApiKey: jest.fn().mockResolvedValue({
          id: '1',
          openAiApiKey: 'test-key',
        }),
      })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: '1', email: 'test@example.com' }; // Mock user
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    // Setup test files directory
    testFilesDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test text file
    const testTextFile = path.join(testFilesDir, 'test.txt');
    fs.writeFileSync(
      testTextFile,
      'Hello World!\nThis is a test file.\nLine 3 content.'
    );

    // Create test uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Cleanup test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }

    await app.close();
  });

  describe('POST /file-processing/upload', () => {
    it('should upload a single text file successfully', () => {
      const testFile = path.join(testFilesDir, 'test.txt');

      return request(app.getHttpServer())
        .post('/file-processing/upload')
        .attach('file', testFile)
        .field('description', 'Test file upload')
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('originalname', 'test.txt');
          expect(res.body).toHaveProperty('mimetype', 'text/plain');
          expect(res.body).toHaveProperty('description', 'Test file upload');
          expect(res.body).toHaveProperty('uploadedAt');
        });
    });

    it('should reject file upload without file', () => {
      return request(app.getHttpServer())
        .post('/file-processing/upload')
        .field('description', 'No file test')
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('File validation failed');
          expect(res.body.error.details.reason).toContain('No file provided');
        });
    });

    it('should reject unsupported file types', () => {
      // Create a fake image file
      const fakeImageFile = path.join(testFilesDir, 'test.jpg');
      fs.writeFileSync(fakeImageFile, 'fake image content');

      return request(app.getHttpServer())
        .post('/file-processing/upload')
        .attach('file', fakeImageFile)
        .expect(500)
        .expect((res: any) => {
          expect(res.body.message).toContain('not allowed');
        });
    });
  });

  describe('POST /file-processing/upload/multiple', () => {
    it('should upload multiple text files successfully', () => {
      const testFile1 = path.join(testFilesDir, 'test.txt');
      const testFile2 = path.join(testFilesDir, 'test2.txt');

      // Create second test file
      fs.writeFileSync(
        testFile2,
        'Second test file content\nWith multiple lines.'
      );

      return request(app.getHttpServer())
        .post('/file-processing/upload/multiple')
        .attach('files', testFile1)
        .attach('files', testFile2)
        .field('descriptions', 'First file')
        .field('descriptions', 'Second file')
        .expect(201)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);

          expect(res.body[0]).toHaveProperty('originalname', 'test.txt');
          expect(res.body[1]).toHaveProperty('originalname', 'test2.txt');

          res.body.forEach((file: any) => {
            expect(file).toHaveProperty('id');
            expect(file).toHaveProperty('uploadedAt');
            expect(file).toHaveProperty('mimetype', 'text/plain');
          });
        });
    });

    it('should reject multiple file upload when no files provided', () => {
      return request(app.getHttpServer())
        .post('/file-processing/upload/multiple')
        .field('descriptions', 'No files test')
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('File validation failed');
          expect(res.body.error.details.reason).toContain('No files provided');
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle large file size limits', () => {
      // Create a file larger than the configured limit
      const largeFile = path.join(testFilesDir, 'large.txt');
      const largeContent = 'x'.repeat(15 * 1024 * 1024); // 15MB
      fs.writeFileSync(largeFile, largeContent);

      return request(app.getHttpServer())
        .post('/file-processing/upload')
        .attach('file', largeFile)
        .expect(413) // Payload too large
        .then(() => {
          // Clean up large file
          if (fs.existsSync(largeFile)) {
            fs.unlinkSync(largeFile);
          }
        });
    });
  });
});
