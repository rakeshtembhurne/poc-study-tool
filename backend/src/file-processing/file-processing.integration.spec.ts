import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { FileProcessingModule } from './file-processing.module';
import * as path from 'path';
import * as fs from 'fs';

describe('File Processing Integration Tests', () => {
  let app: INestApplication;
  let testFilesDir: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [FileProcessingModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
          expect(res.body.message).toContain('No file provided');
        });
    });

    it('should reject unsupported file types', () => {
      // Create a fake image file
      const fakeImageFile = path.join(testFilesDir, 'test.jpg');
      fs.writeFileSync(fakeImageFile, 'fake image content');

      return request(app.getHttpServer())
        .post('/file-processing/upload')
        .attach('file', fakeImageFile)
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('not allowed');
        });
    });
  });

  describe('POST /file-processing/process', () => {
    it('should process a text file successfully', () => {
      const testFile = path.join(testFilesDir, 'test.txt');

      return request(app.getHttpServer())
        .post('/file-processing/process')
        .attach('file', testFile)
        .field('description', 'Process text file')
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('originalname', 'test.txt');
          expect(res.body).toHaveProperty('processingStatus', 'success');
          expect(res.body).toHaveProperty('extractedText');
          expect(res.body.extractedText).toContain('Hello World!');
          expect(res.body).toHaveProperty('lines', 3);
          expect(res.body).toHaveProperty('words');
          expect(res.body).toHaveProperty('characters');
          expect(res.body).toHaveProperty('detectedEncoding');
          expect(res.body).toHaveProperty('encoding');
          expect(res.body).toHaveProperty('processedAt');
        });
    });

    it('should process text file with custom encoding options', () => {
      const testFile = path.join(testFilesDir, 'test.txt');

      return request(app.getHttpServer())
        .post('/file-processing/process')
        .attach('file', testFile)
        .field('options[targetEncoding]', 'utf8')
        .field('options[maxSize]', '5242880') // 5MB
        .expect(201)
        .expect((res: any) => {
          expect(res.body.processingStatus).toBe('success');
          expect(res.body.encoding).toBe('utf8');
        });
    });

    it('should handle file processing failure gracefully', () => {
      // Create a corrupted "PDF" file
      const corruptedPdfFile = path.join(testFilesDir, 'corrupted.pdf');
      fs.writeFileSync(corruptedPdfFile, 'This is not a real PDF file content');

      return request(app.getHttpServer())
        .post('/file-processing/process')
        .attach('file', corruptedPdfFile)
        .expect(201)
        .expect((res: any) => {
          expect(res.body.processingStatus).toBe('failed');
          expect(res.body).toHaveProperty('processingError');
          expect(res.body.extractedText).toBe('');
        });
    });
  });

  describe('POST /file-processing/extract-text', () => {
    it('should extract text from text file', () => {
      const testFile = path.join(testFilesDir, 'test.txt');

      return request(app.getHttpServer())
        .post('/file-processing/extract-text')
        .attach('file', testFile)
        .expect(201)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('text');
          expect(res.body).toHaveProperty('type', 'text');
          expect(res.body.text).toContain('Hello World!');
        });
    });

    it('should reject unsupported file for text extraction', () => {
      const unsupportedFile = path.join(testFilesDir, 'test.unknown');
      fs.writeFileSync(unsupportedFile, 'Unknown file type content');

      return request(app.getHttpServer())
        .post('/file-processing/extract-text')
        .attach('file', unsupportedFile)
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('Unsupported file type');
        });
    });
  });

  describe('POST /file-processing/validate', () => {
    it('should validate a valid text file', () => {
      const testFile = path.join(testFilesDir, 'test.txt');

      return request(app.getHttpServer())
        .post('/file-processing/validate')
        .attach('file', testFile)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('isValid', true);
          expect(res.body).not.toHaveProperty('error');
        });
    });

    it('should detect invalid file format', () => {
      const invalidFile = path.join(testFilesDir, 'invalid.pdf');
      fs.writeFileSync(invalidFile, 'Not a real PDF content');

      return request(app.getHttpServer())
        .post('/file-processing/validate')
        .attach('file', invalidFile)
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('isValid', false);
          expect(res.body).toHaveProperty('error');
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
          expect(res.body.message).toContain('No files provided');
        });
    });
  });

  describe('POST /file-processing/process/multiple', () => {
    it('should process multiple text files successfully', () => {
      const testFile1 = path.join(testFilesDir, 'test.txt');
      const testFile2 = path.join(testFilesDir, 'test2.txt');

      return request(app.getHttpServer())
        .post('/file-processing/process/multiple')
        .attach('files', testFile1)
        .attach('files', testFile2)
        .field('description', 'Process multiple files')
        .expect(201)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);

          res.body.forEach((file: any) => {
            expect(file).toHaveProperty('processingStatus', 'success');
            expect(file).toHaveProperty('extractedText');
            expect(file).toHaveProperty('lines');
            expect(file).toHaveProperty('words');
            expect(file).toHaveProperty('characters');
            expect(file).toHaveProperty('processedAt');
          });
        });
    });

    it('should handle mixed success and failure in multiple file processing', () => {
      const validFile = path.join(testFilesDir, 'test.txt');
      const invalidFile = path.join(testFilesDir, 'invalid.pdf');

      // Create invalid PDF file
      fs.writeFileSync(invalidFile, 'Invalid PDF content');

      return request(app.getHttpServer())
        .post('/file-processing/process/multiple')
        .attach('files', validFile)
        .attach('files', invalidFile)
        .expect(201)
        .expect((res: any) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);

          // First file should succeed
          expect(res.body[0].processingStatus).toBe('success');
          expect(res.body[0].originalname).toBe('test.txt');

          // Second file should fail
          expect(res.body[1].processingStatus).toBe('failed');
          expect(res.body[1].originalname).toBe('invalid.pdf');
          expect(res.body[1]).toHaveProperty('processingError');
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

    it('should handle file processing timeout gracefully', async () => {
      // This test would require mocking or creating a scenario that causes timeout
      // For now, we'll test that the endpoint exists and handles errors
      const testFile = path.join(testFilesDir, 'test.txt');

      const response = await request(app.getHttpServer())
        .post('/file-processing/process')
        .attach('file', testFile)
        .timeout(1000); // Set a short timeout

      // Even with timeout, the endpoint should respond appropriately
      expect(response.status).toBeLessThan(500);
    });
  });
});
