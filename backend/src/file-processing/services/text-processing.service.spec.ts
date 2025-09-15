import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TextProcessingService } from './text-processing.service';
import * as fs from 'fs';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

jest.mock('fs');
jest.mock('chardet');
jest.mock('iconv-lite');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockChardet = chardet as jest.Mocked<typeof chardet>;
const mockIconv = iconv as jest.Mocked<typeof iconv>;

describe('TextProcessingService', () => {
  let service: TextProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TextProcessingService],
    }).compile();

    service = module.get<TextProcessingService>(TextProcessingService);
    jest.clearAllMocks();
  });

  describe('processTextFromPath', () => {
    it('should successfully process a small text file', async () => {
      const mockStats = { size: 1024, isFile: () => true };
      const mockBuffer = Buffer.from('Hello world!\nThis is a test file.');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockChardet.detect.mockReturnValue('utf8');

      const result = await service.processTextFromPath('/test/file.txt');

      expect(result).toEqual({
        content: 'Hello world!\nThis is a test file.',
        encoding: 'utf8',
        detectedEncoding: 'utf8',
        lines: 2,
        characters: 33,
        words: 7,
        size: 1024,
        isLargeFile: false,
      });

      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.txt');
      expect(mockFs.statSync).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should throw BadRequestException if file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(
        service.processTextFromPath('/nonexistent/file.txt')
      ).rejects.toThrow(BadRequestException);

      expect(mockFs.existsSync).toHaveBeenCalledWith('/nonexistent/file.txt');
    });

    it('should use large file processing for files over threshold', async () => {
      const mockStats = { size: 10 * 1024 * 1024 }; // 10MB

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      // Mock the processLargeTextFile method
      const mockResult = {
        content: 'Large file content',
        encoding: 'utf8',
        detectedEncoding: 'utf8',
        lines: 1000,
        characters: 1000000,
        words: 200000,
        size: 10 * 1024 * 1024,
        isLargeFile: true,
      };

      jest.spyOn(service, 'processLargeTextFile').mockResolvedValue(mockResult);

      const result = await service.processTextFromPath('/test/largefile.txt');

      expect(result.isLargeFile).toBe(true);
      expect(service.processLargeTextFile).toHaveBeenCalled();
    });
  });

  describe('processTextFromBuffer', () => {
    it('should process text from buffer with UTF-8 encoding', async () => {
      const mockBuffer = Buffer.from('Test content\nSecond line');
      mockChardet.detect.mockReturnValue('utf8');

      const result = await service.processTextFromBuffer(mockBuffer);

      expect(result).toEqual({
        content: 'Test content\nSecond line',
        encoding: 'utf8',
        detectedEncoding: 'utf8',
        lines: 2,
        characters: 24,
        words: 4,
        size: mockBuffer.length,
        isLargeFile: false,
      });
    });

    it('should handle encoding conversion', async () => {
      const mockBuffer = Buffer.from('Encoded content');
      mockChardet.detect.mockReturnValue('iso-8859-1');
      mockIconv.encodingExists.mockReturnValue(true);
      mockIconv.decode.mockReturnValue('Decoded content');

      const result = await service.processTextFromBuffer(mockBuffer, {
        targetEncoding: 'utf8',
      });

      expect(result.detectedEncoding).toBe('iso-8859-1');
      expect(result.encoding).toBe('utf8');
      expect(mockIconv.decode).toHaveBeenCalledWith(mockBuffer, 'iso-8859-1');
    });

    it('should throw BadRequestException for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      await expect(service.processTextFromBuffer(emptyBuffer)).rejects.toThrow(
        'Empty text buffer'
      );
    });

    it('should throw BadRequestException for buffer exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB

      await expect(
        service.processTextFromBuffer(largeBuffer, {
          maxSize: 10 * 1024 * 1024,
        })
      ).rejects.toThrow('Text file too large');
    });

    it('should handle unsupported encoding gracefully', async () => {
      const mockBuffer = Buffer.from('Content with unknown encoding');
      mockChardet.detect.mockReturnValue('unknown-encoding');
      mockIconv.encodingExists.mockReturnValue(false);

      const result = await service.processTextFromBuffer(mockBuffer);

      expect(result.content).toBe('Content with unknown encoding');
      expect(result.detectedEncoding).toBe('unknown-encoding');
    });
  });

  describe('detectEncoding', () => {
    it('should detect encoding successfully', () => {
      const mockBuffer = Buffer.from('Test content');
      mockChardet.detect.mockReturnValue('utf8');

      const result = service.detectEncoding(mockBuffer);

      expect(result).toBe('utf8');
      expect(mockChardet.detect).toHaveBeenCalledWith(mockBuffer);
    });

    it('should handle array result from chardet', () => {
      const mockBuffer = Buffer.from('Test content');
      mockChardet.detect.mockReturnValue([
        { name: 'UTF-8', confidence: 0.99 },
      ] as any);

      const result = service.detectEncoding(mockBuffer);

      expect(result).toBe('utf-8');
    });

    it('should fallback to utf8 on detection failure', () => {
      const mockBuffer = Buffer.from('Test content');
      mockChardet.detect.mockImplementation(() => {
        throw new Error('Detection failed');
      });

      const result = service.detectEncoding(mockBuffer);

      expect(result).toBe('utf8');
    });

    it('should fallback to utf8 for null detection result', () => {
      const mockBuffer = Buffer.from('Test content');
      mockChardet.detect.mockReturnValue(null);

      const result = service.detectEncoding(mockBuffer);

      expect(result).toBe('utf8');
    });
  });

  describe('convertEncoding', () => {
    it('should convert encoding successfully', async () => {
      const mockBuffer = Buffer.from('Original content');
      const convertedBuffer = Buffer.from('Converted content');

      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockIconv.encodingExists.mockReturnValue(true);
      mockIconv.decode.mockReturnValue('Decoded content');
      mockIconv.encode.mockReturnValue(convertedBuffer);
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await service.convertEncoding(
        '/test/input.txt',
        'iso-8859-1',
        'utf8',
        '/test/output.txt'
      );

      expect(result).toBe('/test/output.txt');
      expect(mockIconv.decode).toHaveBeenCalledWith(mockBuffer, 'iso-8859-1');
      expect(mockIconv.encode).toHaveBeenCalledWith('Decoded content', 'utf8');
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/output.txt',
        convertedBuffer
      );
    });

    it('should throw BadRequestException for unsupported encoding', async () => {
      mockIconv.encodingExists.mockReturnValue(false);

      await expect(
        service.convertEncoding('/test/input.txt', 'unknown', 'utf8')
      ).rejects.toThrow('Unsupported encoding');
    });

    it('should generate output filename when not provided', async () => {
      const mockBuffer = Buffer.from('Content');
      const convertedBuffer = Buffer.from('Converted');

      mockFs.readFileSync.mockReturnValue(mockBuffer);
      mockIconv.encodingExists.mockReturnValue(true);
      mockIconv.decode.mockReturnValue('Content');
      mockIconv.encode.mockReturnValue(convertedBuffer);
      mockFs.writeFileSync.mockImplementation(() => {});

      const result = await service.convertEncoding(
        '/test/file.txt',
        'iso-8859-1',
        'utf8'
      );

      expect(result).toBe('/test/file_utf8.txt');
    });
  });

  describe('validateTextFile', () => {
    it('should return true for valid text file with .txt extension', () => {
      const mockStats = { isFile: () => true };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = service.validateTextFile('/test/file.txt');

      expect(result).toBe(true);
    });

    it('should return false for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = service.validateTextFile('/nonexistent/file.txt');

      expect(result).toBe(false);
    });

    it('should return false for directory', () => {
      const mockStats = { isFile: () => false };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);

      const result = service.validateTextFile('/test/directory');

      expect(result).toBe(false);
    });

    it('should validate file content for unknown extension', () => {
      const mockStats = { isFile: () => true };
      const mockBuffer = Buffer.from('Valid text content');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue(mockStats as any);
      mockFs.readFileSync.mockReturnValue(mockBuffer);

      jest.spyOn(service as any, 'isTextFile').mockReturnValue(true);

      const result = service.validateTextFile('/test/file.unknown');

      expect(result).toBe(true);
    });

    it('should handle exceptions and return false', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = service.validateTextFile('/test/file.txt');

      expect(result).toBe(false);
    });
  });

  describe('private helper methods', () => {
    describe('isTextFile', () => {
      it('should return true for text file with valid content', () => {
        const validBuffer = Buffer.from(
          'This is valid text content\nSecond line'
        );
        mockFs.readFileSync.mockReturnValue(validBuffer);

        const result = service['isTextFile']('/test/file.txt');

        expect(result).toBe(true);
      });

      it('should return false for binary file with null bytes', () => {
        const binaryBuffer = Buffer.from([
          72, 101, 108, 108, 111, 0, 87, 111, 114, 108, 100,
        ]); // "Hello\0World"
        mockFs.readFileSync.mockReturnValue(binaryBuffer);

        const result = service['isTextFile']('/test/file.bin');

        expect(result).toBe(false);
      });

      it('should handle file read errors', () => {
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('Read error');
        });

        const result = service['isTextFile']('/test/file.txt');

        expect(result).toBe(false);
      });
    });

    describe('countLines', () => {
      it('should count lines correctly', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const result = service['countLines'](text);
        expect(result).toBe(3);
      });

      it('should handle different line endings', () => {
        const text = 'Line 1\r\nLine 2\rLine 3\n';
        const result = service['countLines'](text);
        expect(result).toBe(4);
      });

      it('should return 0 for empty text', () => {
        const result = service['countLines']('');
        expect(result).toBe(0);
      });

      it('should return 0 for null text', () => {
        const result = service['countLines'](null as any);
        expect(result).toBe(0);
      });
    });

    describe('countWords', () => {
      it('should count words correctly', () => {
        const text = 'Hello world this is a test';
        const result = service['countWords'](text);
        expect(result).toBe(6);
      });

      it('should handle multiple spaces', () => {
        const text = 'Hello    world   test';
        const result = service['countWords'](text);
        expect(result).toBe(3);
      });

      it('should return 0 for empty text', () => {
        const result = service['countWords']('');
        expect(result).toBe(0);
      });

      it('should return 0 for null text', () => {
        const result = service['countWords'](null as any);
        expect(result).toBe(0);
      });
    });
  });
});
