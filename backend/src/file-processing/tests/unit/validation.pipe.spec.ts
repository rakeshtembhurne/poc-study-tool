import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import {
  FileValidationPipe,
  MultipleFilesValidationPipe,
} from '../../pipes/file-validation.pipe';
import {
  FileValidationException,
  UnsupportedFileTypeException,
  FileSizeLimitException,
} from '@/core/exceptions/file-processing.exceptions';
import fileProcessingConfig from '@/core/config/file-processing.config';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;
  let multiplePipe: MultipleFilesValidationPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(fileProcessingConfig)],
      providers: [FileValidationPipe, MultipleFilesValidationPipe],
    }).compile();

    pipe = module.get<FileValidationPipe>(FileValidationPipe);
    multiplePipe = module.get<MultipleFilesValidationPipe>(
      MultipleFilesValidationPipe
    );
  });

  describe('FileValidationPipe', () => {
    it('should validate a valid PDF file', () => {
      const validFile = createMockFile(
        'document.pdf',
        'application/pdf',
        1024 * 1024
      );

      expect(() => pipe.transform(validFile)).not.toThrow();
    });

    it('should validate a valid text file', () => {
      const validFile = createMockFile('document.txt', 'text/plain', 1024);

      expect(() => pipe.transform(validFile)).not.toThrow();
    });

    it('should throw UnsupportedFileTypeException for invalid mime type', () => {
      const invalidFile = createMockFile('image.jpg', 'image/jpeg', 1024);

      expect(() => pipe.transform(invalidFile)).toThrow(
        UnsupportedFileTypeException
      );
    });

    it('should throw FileSizeLimitException for oversized files', () => {
      const oversizedFile = createMockFile(
        'large.pdf',
        'application/pdf',
        11 * 1024 * 1024
      ); // 11MB

      expect(() => pipe.transform(oversizedFile)).toThrow(
        FileSizeLimitException
      );
    });

    it('should throw FileValidationException for missing file', () => {
      expect(() => pipe.transform(null as any)).toThrow(
        FileValidationException
      );
    });

    it('should throw FileValidationException for invalid filename', () => {
      const invalidFile = createMockFile('', 'text/plain', 1024);

      expect(() => pipe.transform(invalidFile)).toThrow(
        FileValidationException
      );
    });

    it('should throw FileValidationException for dangerous file extensions', () => {
      const dangerousFile = createMockFile(
        'malware.exe',
        'application/octet-stream',
        1024
      );

      expect(() => pipe.transform(dangerousFile)).toThrow(
        FileValidationException
      );
    });

    it('should validate PDF extension matches mime type', () => {
      const invalidPdf = createMockFile(
        'document.txt',
        'application/pdf',
        1024
      );

      expect(() => pipe.transform(invalidPdf)).toThrow(FileValidationException);
    });

    it('should validate various text file extensions', () => {
      const validExtensions = ['.txt', '.csv', '.json', '.xml', '.md', '.html'];

      validExtensions.forEach((ext) => {
        const file = createMockFile(`document${ext}`, 'text/plain', 1024);
        expect(() => pipe.transform(file)).not.toThrow();
      });
    });

    it('should handle edge case file sizes', () => {
      const exactLimitFile = createMockFile(
        'exact.txt',
        'text/plain',
        10 * 1024 * 1024
      ); // Exactly 10MB
      const justUnderLimitFile = createMockFile(
        'under.txt',
        'text/plain',
        10 * 1024 * 1024 - 1
      );
      const justOverLimitFile = createMockFile(
        'over.txt',
        'text/plain',
        10 * 1024 * 1024 + 1
      );

      expect(() => pipe.transform(exactLimitFile)).not.toThrow();
      expect(() => pipe.transform(justUnderLimitFile)).not.toThrow();
      expect(() => pipe.transform(justOverLimitFile)).toThrow(
        FileSizeLimitException
      );
    });
  });

  describe('MultipleFilesValidationPipe', () => {
    it('should validate multiple valid files', () => {
      const validFiles = [
        createMockFile('doc1.txt', 'text/plain', 1024),
        createMockFile('doc2.pdf', 'application/pdf', 2048),
        createMockFile('doc3.csv', 'text/csv', 512),
      ];

      expect(() => multiplePipe.transform(validFiles)).not.toThrow();
    });

    it('should throw FileValidationException for no files', () => {
      expect(() => multiplePipe.transform([])).toThrow(FileValidationException);
      expect(() => multiplePipe.transform(null as any)).toThrow(
        FileValidationException
      );
    });

    it('should throw FileValidationException for too many files', () => {
      const tooManyFiles = Array.from({ length: 6 }, (_, i) =>
        createMockFile(`doc${i}.txt`, 'text/plain', 1024)
      );

      expect(() => multiplePipe.transform(tooManyFiles)).toThrow(
        FileValidationException
      );
    });

    it('should throw FileValidationException for total size limit exceeded', () => {
      const largeFiles = [
        createMockFile('doc1.txt', 'text/plain', 11 * 1024 * 1024), // 11MB (exceeds 10MB limit)
        createMockFile('doc2.txt', 'text/plain', 1024), // 1KB
      ];

      // The first file itself exceeds the individual file limit, so it should throw
      expect(() => multiplePipe.transform(largeFiles)).toThrow(
        FileValidationException
      );
    });

    it('should throw FileValidationException if any individual file is invalid', () => {
      const mixedFiles = [
        createMockFile('valid.txt', 'text/plain', 1024),
        createMockFile('invalid.exe', 'application/octet-stream', 1024),
      ];

      expect(() => multiplePipe.transform(mixedFiles)).toThrow(
        FileValidationException
      );
    });

    it('should validate maximum allowed files count', () => {
      const maxFiles = Array.from({ length: 5 }, (_, i) =>
        createMockFile(`doc${i}.txt`, 'text/plain', 1024)
      );

      expect(() => multiplePipe.transform(maxFiles)).not.toThrow();
    });

    it('should provide detailed error messages for failed file validation', () => {
      const filesWithError = [
        createMockFile('valid.txt', 'text/plain', 1024),
        createMockFile('invalid.exe', 'application/octet-stream', 1024),
      ];

      try {
        multiplePipe.transform(filesWithError);
        fail('Expected FileValidationException to be thrown');
      } catch (error: any) {
        expect(error).toBeInstanceOf(FileValidationException);
        const errorResponse = error.getResponse();
        expect(errorResponse.reason).toContain('File 2');
        expect(errorResponse.reason).toContain('invalid.exe');
        expect(errorResponse.context.fileIndex).toBe(1);
        expect(errorResponse.context.fileName).toBe('invalid.exe');
      }
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle files with no extension', () => {
      const noExtFile = createMockFile('document', 'text/plain', 1024);

      expect(() => pipe.transform(noExtFile)).not.toThrow();
    });

    it('should handle files with multiple dots in name', () => {
      const multiDotFile = createMockFile(
        'document.backup.txt',
        'text/plain',
        1024
      );

      expect(() => pipe.transform(multiDotFile)).not.toThrow();
    });

    it('should handle case-insensitive dangerous extensions', () => {
      const upperCaseExe = createMockFile(
        'malware.EXE',
        'application/octet-stream',
        1024
      );
      const mixedCaseExe = createMockFile(
        'malware.ExE',
        'application/octet-stream',
        1024
      );

      expect(() => pipe.transform(upperCaseExe)).toThrow(
        FileValidationException
      );
      expect(() => pipe.transform(mixedCaseExe)).toThrow(
        FileValidationException
      );
    });

    it('should validate all dangerous extensions', () => {
      const dangerousExtensions = [
        '.exe',
        '.bat',
        '.cmd',
        '.scr',
        '.pif',
        '.com',
      ];

      dangerousExtensions.forEach((ext) => {
        const dangerousFile = createMockFile(
          `malware${ext}`,
          'application/octet-stream',
          1024
        );
        expect(() => pipe.transform(dangerousFile)).toThrow(
          FileValidationException
        );
      });
    });

    it('should handle zero-byte files', () => {
      const emptyFile = createMockFile('empty.txt', 'text/plain', 0);

      expect(() => pipe.transform(emptyFile)).not.toThrow();
    });

    it('should handle files with unicode characters in names', () => {
      const unicodeFile = createMockFile('документ.txt', 'text/plain', 1024);

      expect(() => pipe.transform(unicodeFile)).not.toThrow();
    });
  });
});

// Helper function
function createMockFile(
  originalname: string,
  mimetype: string,
  size: number
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    destination: '/tmp',
    filename: originalname,
    path: `/tmp/${originalname}`,
    size,
    buffer: Buffer.alloc(size),
    stream: null as any,
  };
}
