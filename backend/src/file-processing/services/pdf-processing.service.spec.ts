import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PdfProcessingService } from './pdf-processing.service';
import * as fs from 'fs';
import pdfParse from 'pdf-parse';

jest.mock('fs');
jest.mock('pdf-parse');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPdfParse = pdfParse as jest.MockedFunction<typeof pdfParse>;

describe('PdfProcessingService', () => {
  let service: PdfProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfProcessingService],
    }).compile();

    service = module.get<PdfProcessingService>(PdfProcessingService);
    jest.clearAllMocks();
  });

  describe('processPdfFromPath', () => {
    it('should successfully process a PDF file', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');
      const mockPdfData = {
        text: 'Extracted text content',
        numpages: 2,
        info: {
          Title: 'Test PDF',
          Author: 'Test Author',
          Creator: 'Test Creator',
          Producer: 'Test Producer',
          CreationDate: new Date('2023-01-01'),
          ModDate: new Date('2023-01-02'),
        },
        version: '1.4',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData as any);

      const result = await service.processPdfFromPath('/test/file.pdf');

      expect(result).toEqual({
        text: 'Extracted text content',
        numPages: 2,
        metadata: {
          title: 'Test PDF',
          author: 'Test Author',
          creator: 'Test Creator',
          producer: 'Test Producer',
          creationDate: new Date('2023-01-01'),
          modificationDate: new Date('2023-01-02'),
        },
        info: {
          version: '1.4',
          isEncrypted: false,
          isLinearized: false,
        },
      });

      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.pdf');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/test/file.pdf');
      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer, {});
    });

    it('should throw BadRequestException if file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        service.processPdfFromPath('/nonexistent/file.pdf')
      ).rejects.toThrow(BadRequestException);

      expect(mockFs.existsSync).toHaveBeenCalledWith('/nonexistent/file.pdf');
    });

    it('should process PDF with options', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');
      const mockPdfData = {
        text: 'Extracted text',
        numpages: 1,
        info: {},
        version: '1.4',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData as any);

      const options = {
        maxPages: 1,
        password: 'test123',
      };

      await service.processPdfFromPath('/test/file.pdf', options);

      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer, {
        max: 1,
        password: 'test123',
      });
    });
  });

  describe('processPdfFromBuffer', () => {
    it('should process PDF from buffer successfully', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');
      const mockPdfData = {
        text: 'Buffer text content',
        numpages: 1,
        info: {
          Title: 'Buffer PDF',
        },
        version: '1.4',
      };

      mockPdfParse.mockResolvedValue(mockPdfData as any);

      const result = await service.processPdfFromBuffer(mockBuffer);

      expect(result.text).toBe('Buffer text content');
      expect(result.numPages).toBe(1);
      expect(result.metadata.title).toBe('Buffer PDF');
    });

    it('should throw BadRequestException for invalid PDF buffer', async () => {
      const invalidBuffer = Buffer.from('not a pdf');

      await expect(service.processPdfFromBuffer(invalidBuffer)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle password-protected PDF error', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');

      mockPdfParse.mockRejectedValue(new Error('password required'));

      await expect(service.processPdfFromBuffer(mockBuffer)).rejects.toThrow(
        'PDF is password protected and requires authentication'
      );
    });

    it('should handle invalid PDF error', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');

      mockPdfParse.mockRejectedValue(new Error('Invalid PDF structure'));

      await expect(service.processPdfFromBuffer(mockBuffer)).rejects.toThrow(
        'Invalid or corrupted PDF file'
      );
    });

    it('should handle unsupported PDF error', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');

      mockPdfParse.mockRejectedValue(new Error('Unsupported PDF version'));

      await expect(service.processPdfFromBuffer(mockBuffer)).rejects.toThrow(
        'Unsupported PDF version or format'
      );
    });
  });

  describe('extractTextOnly', () => {
    it('should extract text only from PDF', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');
      const mockPdfData = {
        text: 'Only text content',
        numpages: 1,
        info: {},
        version: '1.4',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData as any);

      const result = await service.extractTextOnly('/test/file.pdf');

      expect(result).toBe('Only text content');
    });
  });

  describe('extractMetadataOnly', () => {
    it('should extract metadata only from PDF', async () => {
      const mockBuffer = Buffer.from('%PDF-1.4 test content');
      const mockPdfData = {
        text: 'Some text',
        numpages: 5,
        info: {
          Title: 'Metadata Test',
          Author: 'Test Author',
        },
        version: '1.4',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockPdfParse.mockResolvedValue(mockPdfData as any);

      const result = await service.extractMetadataOnly('/test/file.pdf');

      expect(result).toEqual({
        title: 'Metadata Test',
        author: 'Test Author',
        subject: undefined,
        creator: undefined,
        producer: undefined,
        creationDate: undefined,
        modificationDate: undefined,
      });

      expect(mockPdfParse).toHaveBeenCalledWith(mockBuffer, { max: 1 });
    });
  });

  describe('validatePdfFile', () => {
    it('should return true for valid PDF file', () => {
      const mockStats = { isFile: () => true };
      const mockBuffer = Buffer.from('%PDF-1.4');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      const result = service.validatePdfFile('/test/file.pdf');

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = service.validatePdfFile('/nonexistent/file.pdf');

      expect(result).toBe(false);
    });

    it('should return false for non-PDF extension', () => {
      const mockStats = { isFile: () => true };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = service.validatePdfFile('/test/file.txt');

      expect(result).toBe(false);
    });

    it('should return false for directory', () => {
      const mockStats = { isFile: () => false };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = service.validatePdfFile('/test/directory');

      expect(result).toBe(false);
    });

    it('should handle exceptions and return false', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = service.validatePdfFile('/test/file.pdf');

      expect(result).toBe(false);
    });
  });

  describe('validatePdfBuffer', () => {
    it('should validate PDF buffer with correct header', () => {
      const validBuffer = Buffer.from('%PDF-1.4 content');

      expect(() => service['validatePdfBuffer'](validBuffer)).not.toThrow();
    });

    it('should throw error for buffer too small', () => {
      const smallBuffer = Buffer.from('tiny');

      expect(() => service['validatePdfBuffer'](smallBuffer)).toThrow(
        'Invalid PDF buffer: too small'
      );
    });

    it('should throw error for buffer without PDF header', () => {
      const invalidBuffer = Buffer.from('not a pdf header');

      expect(() => service['validatePdfBuffer'](invalidBuffer)).toThrow(
        'Invalid PDF buffer: missing PDF header'
      );
    });

    it('should throw error for null buffer', () => {
      expect(() => service['validatePdfBuffer'](null as any)).toThrow(
        'Invalid PDF buffer: too small'
      );
    });
  });
});
