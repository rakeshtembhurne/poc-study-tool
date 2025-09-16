import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

export interface PdfProcessingResult {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  info: {
    version: string;
    isEncrypted: boolean;
    isLinearized: boolean;
  };
}

export interface PdfProcessingOptions {
  extractImages?: boolean;
  maxPages?: number;
  password?: string;
}

@Injectable()
export class PdfProcessingService {
  private readonly logger = new Logger(PdfProcessingService.name);

  async processPdfFromPath(
    filePath: string,
    options: PdfProcessingOptions = {}
  ): Promise<PdfProcessingResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`PDF file not found: ${filePath}`);
      }

      const buffer = fs.readFileSync(filePath);
      return this.processPdfFromBuffer(buffer, options);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error processing PDF from path: ${message}`);
      throw new BadRequestException(`Failed to process PDF: ${message}`);
    }
  }

  async processPdfFromBuffer(
    buffer: Buffer,
    options: PdfProcessingOptions = {}
  ): Promise<PdfProcessingResult> {
    try {
      this.validatePdfBuffer(buffer);

      const parseOptions: any = {};

      if (options.maxPages) {
        parseOptions.max = options.maxPages;
      }

      if (options.password) {
        parseOptions.password = options.password;
      }

      this.logger.debug('Starting PDF parsing...');
      const data = await pdfParse(buffer, parseOptions);

      const result: PdfProcessingResult = {
        text: data.text?.trim() || '',
        numPages: data.numpages || 0,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          subject: data.info?.Subject,
          creator: data.info?.Creator,
          producer: data.info?.Producer,
          creationDate: data.info?.CreationDate
            ? new Date(data.info.CreationDate)
            : undefined,
          modificationDate: data.info?.ModDate
            ? new Date(data.info.ModDate)
            : undefined,
        },
        info: {
          version: data.version || 'unknown',
          isEncrypted: data.info?.IsAcroFormPresent === 'true' || false,
          isLinearized: data.info?.IsLinearized === 'true' || false,
        },
      };

      this.logger.debug(
        `PDF processed successfully: ${result.numPages} pages, ${result.text.length} characters extracted`
      );

      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error processing PDF buffer: ${message}`);

      if (message.includes('Invalid PDF')) {
        throw new BadRequestException('Invalid or corrupted PDF file');
      }

      if (message.includes('password')) {
        throw new BadRequestException(
          'PDF is password protected and requires authentication'
        );
      }

      if (message.includes('Unsupported')) {
        throw new BadRequestException('Unsupported PDF version or format');
      }

      throw new BadRequestException(`Failed to process PDF: ${message}`);
    }
  }

  async extractTextOnly(filePath: string): Promise<string> {
    const result = await this.processPdfFromPath(filePath);
    return result.text;
  }

  async extractMetadataOnly(
    filePath: string
  ): Promise<PdfProcessingResult['metadata']> {
    const result = await this.processPdfFromPath(filePath, { maxPages: 1 });
    return result.metadata;
  }

  validatePdfFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return false;
      }

      const ext = path.extname(filePath).toLowerCase();
      if (ext !== '.pdf') {
        return false;
      }

      const fileDescriptor = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(8);
      fs.readSync(fileDescriptor, buffer, 0, 8, 0);
      fs.closeSync(fileDescriptor);
      return this.validatePdfBuffer(buffer);
    } catch {
      return false;
    }
  }

  private validatePdfBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 8) {
      throw new BadRequestException('Invalid PDF buffer: too small');
    }

    const header = buffer.toString('utf8', 0, 8);
    if (!header.startsWith('%PDF-')) {
      throw new BadRequestException('Invalid PDF buffer: missing PDF header');
    }

    return true;
  }
}
