import { Injectable, PipeTransform, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  FileValidationException,
  UnsupportedFileTypeException,
  FileSizeLimitException,
} from '@/core/exceptions/file-processing.exceptions';
import fileProcessingConfig from '@/core/config/file-processing.config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    @Inject(fileProcessingConfig.KEY)
    private readonly config: ConfigType<typeof fileProcessingConfig>
  ) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    this.validateFile(file);
    return file;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new FileValidationException('No file provided', 'NO_FILE_PROVIDED');
    }

    // Validate file size
    if (file.size > this.config.maxFileSize) {
      throw new FileSizeLimitException(file.size, this.config.maxFileSize);
    }

    // Validate file type
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedFileTypeException(
        file.mimetype,
        this.config.allowedMimeTypes
      );
    }

    // Validate file name
    if (!file.originalname || file.originalname.trim().length === 0) {
      throw new FileValidationException(
        'Invalid file name',
        'INVALID_FILE_NAME',
        { originalname: file.originalname }
      );
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.scr',
      '.pif',
      '.com',
    ];
    const fileExtension = this.getFileExtension(
      file.originalname
    ).toLowerCase();

    if (dangerousExtensions.includes(fileExtension)) {
      throw new FileValidationException(
        `Dangerous file extension not allowed: ${fileExtension}`,
        'DANGEROUS_FILE_EXTENSION',
        { extension: fileExtension }
      );
    }

    // Additional validation for PDF files
    if (file.mimetype === 'application/pdf') {
      this.validatePdfFile(file);
    }

    // Additional validation for text files
    if (this.isTextFile(file.mimetype)) {
      this.validateTextFile(file);
    }
  }

  private validatePdfFile(file: Express.Multer.File): void {
    const extension = this.getFileExtension(file.originalname).toLowerCase();
    if (extension !== '.pdf') {
      throw new FileValidationException(
        'PDF file must have .pdf extension',
        'INVALID_PDF_EXTENSION',
        { originalname: file.originalname, extension }
      );
    }
  }

  private validateTextFile(file: Express.Multer.File): void {
    const validTextExtensions = [
      '.txt',
      '.text',
      '.log',
      '.csv',
      '.json',
      '.xml',
      '.md',
      '.html',
    ];
    const extension = this.getFileExtension(file.originalname).toLowerCase();

    if (
      !validTextExtensions.includes(extension) &&
      !this.isTextMimeType(file.mimetype)
    ) {
      throw new FileValidationException(
        `Invalid text file extension: ${extension}`,
        'INVALID_TEXT_EXTENSION',
        { originalname: file.originalname, extension, mimetype: file.mimetype }
      );
    }
  }

  private isTextFile(mimetype: string): boolean {
    return this.isTextMimeType(mimetype);
  }

  private isTextMimeType(mimetype: string): boolean {
    const textMimeTypes = [
      'text/plain',
      'text/csv',
      'text/html',
      'text/xml',
      'application/json',
      'application/xml',
      'text/markdown',
    ];

    return textMimeTypes.includes(mimetype) || mimetype.startsWith('text/');
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
  }
}

@Injectable()
export class MultipleFilesValidationPipe implements PipeTransform {
  constructor(
    @Inject(fileProcessingConfig.KEY)
    private readonly config: ConfigType<typeof fileProcessingConfig>,
    private readonly fileValidationPipe: FileValidationPipe
  ) {}

  transform(files: Express.Multer.File[]): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new FileValidationException(
        'No files provided',
        'NO_FILES_PROVIDED'
      );
    }

    if (files.length > this.config.maxFiles) {
      throw new FileValidationException(
        `Too many files. Maximum allowed: ${this.config.maxFiles}`,
        'TOO_MANY_FILES',
        { fileCount: files.length, maxFiles: this.config.maxFiles }
      );
    }

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = this.config.maxFileSize * files.length;

    if (totalSize > maxTotalSize) {
      throw new FileValidationException(
        `Total file size too large: ${totalSize} bytes (max: ${maxTotalSize} bytes)`,
        'TOTAL_SIZE_EXCEEDED',
        { totalSize, maxTotalSize }
      );
    }

    // Validate each file individually
    files.forEach((file, index) => {
      try {
        this.fileValidationPipe.transform(file);
      } catch (error) {
        throw new FileValidationException(
          `File ${index + 1} (${file.originalname}): ${error instanceof Error ? error.message : 'Validation failed'}`,
          'FILE_VALIDATION_FAILED',
          {
            fileIndex: index,
            fileName: file.originalname,
            originalError: error,
          }
        );
      }
    });

    return files;
  }
}
