import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return String(error);
}

export interface TextProcessingResult {
  content: string;
  encoding: string;
  detectedEncoding: string;
  lines: number;
  characters: number;
  words: number;
  size: number;
  isLargeFile: boolean;
}

export interface TextProcessingOptions {
  targetEncoding?: string;
  maxSize?: number;
  streaming?: boolean;
  chunkSize?: number;
  preserveLineBreaks?: boolean;
}

export interface StreamProcessingResult {
  encoding: string;
  detectedEncoding: string;
  totalChunks: number;
  processedSize: number;
  lines: number;
}

@Injectable()
export class TextProcessingService {
  private readonly logger = new Logger(TextProcessingService.name);
  private readonly DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
  private readonly LARGE_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB

  async processTextFromPath(
    filePath: string,
    options: TextProcessingOptions = {}
  ): Promise<TextProcessingResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`Text file not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      const isLargeFile = stats.size > this.LARGE_FILE_THRESHOLD;

      if (isLargeFile && options.streaming !== false) {
        return this.processLargeTextFile(filePath, options);
      }

      const buffer = fs.readFileSync(filePath);
      return this.processTextFromBuffer(buffer, options);
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error processing text from path: ${message}`);
      throw new BadRequestException(`Failed to process text file: ${message}`);
    }
  }

  async processTextFromBuffer(
    buffer: Buffer,
    options: TextProcessingOptions = {}
  ): Promise<TextProcessingResult> {
    try {
      this.validateTextBuffer(buffer, options.maxSize);

      const detectedEncoding = this.detectEncoding(buffer);
      const targetEncoding = options.targetEncoding || 'utf8';

      this.logger.debug(
        `Detected encoding: ${detectedEncoding}, target: ${targetEncoding}`
      );

      let content: string;

      if (detectedEncoding === targetEncoding || detectedEncoding === 'utf8') {
        content = buffer.toString('utf8');
      } else {
        if (!iconv.encodingExists(detectedEncoding)) {
          this.logger.warn(
            `Unsupported encoding ${detectedEncoding}, falling back to utf8`
          );
          content = buffer.toString('utf8');
        } else {
          content = iconv.decode(buffer, detectedEncoding);
          if (targetEncoding !== 'utf8') {
            content = iconv.encode(content, targetEncoding).toString();
          }
        }
      }

      const result: TextProcessingResult = {
        content,
        encoding: targetEncoding,
        detectedEncoding,
        lines: this.countLines(content),
        characters: content.length,
        words: this.countWords(content),
        size: buffer.length,
        isLargeFile: buffer.length > this.LARGE_FILE_THRESHOLD,
      };

      this.logger.debug(
        `Text processed: ${result.characters} chars, ${result.lines} lines, ${result.words} words`
      );

      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error processing text buffer: ${message}`);
      throw new BadRequestException(`Failed to process text: ${message}`);
    }
  }

  async *processTextFileStream(
    filePath: string,
    options: TextProcessingOptions = {}
  ): AsyncGenerator<string, StreamProcessingResult> {
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const targetEncoding = options.targetEncoding || 'utf8';

    let totalChunks = 0;
    let processedSize = 0;
    let lines = 0;
    let detectedEncoding = 'utf8';

    try {
      const fileDescriptor = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(chunkSize);
      const bytesRead = fs.readSync(fileDescriptor, buffer, 0, chunkSize, 0);
      fs.closeSync(fileDescriptor);
      const actualBuffer = buffer.slice(0, bytesRead);
      detectedEncoding = this.detectEncoding(actualBuffer);
      this.logger.debug(
        `Stream processing with detected encoding: ${detectedEncoding}`
      );
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.warn(`Could not detect encoding, using utf8: ${message}`);
    }

    const readStream = createReadStream(filePath, {
      encoding: undefined,
      highWaterMark: chunkSize,
    });

    let remainder = Buffer.alloc(0);

    try {
      for await (const chunk of readStream) {
        const buffer = Buffer.concat([remainder, chunk as Buffer]);

        let content: string;
        if (
          detectedEncoding === targetEncoding ||
          detectedEncoding === 'utf8'
        ) {
          content = buffer.toString('utf8');
        } else {
          content = iconv.decode(buffer, detectedEncoding);
        }

        const lastNewlineIndex = content.lastIndexOf('\n');
        if (lastNewlineIndex > -1) {
          const completeLines = content.substring(0, lastNewlineIndex + 1);
          const incompleteLine = content.substring(lastNewlineIndex + 1);

          remainder = Buffer.from(incompleteLine, 'utf8');

          lines += this.countLines(completeLines);
          totalChunks++;
          processedSize += chunk.length;

          yield completeLines;
        } else {
          remainder = buffer;
        }
      }

      if (remainder.length > 0) {
        const content = remainder.toString('utf8');
        lines += this.countLines(content);
        totalChunks++;
        processedSize += remainder.length;
        yield content;
      }
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error in stream processing: ${message}`);
      throw new BadRequestException(
        `Failed to stream process text: ${message}`
      );
    }

    return {
      encoding: targetEncoding,
      detectedEncoding,
      totalChunks,
      processedSize,
      lines,
    };
  }

  async processLargeTextFile(
    filePath: string,
    options: TextProcessingOptions = {}
  ): Promise<TextProcessingResult> {
    this.logger.debug(`Processing large file: ${filePath}`);

    const stats = fs.statSync(filePath);
    let content = '';
    let lines = 0;
    let words = 0;
    let detectedEncoding = 'utf8';

    try {
      const streamResult = this.processTextFileStream(filePath, options);

      const generator = streamResult;
      let result = await generator.next();

      while (!result.done) {
        if (typeof result.value === 'string') {
          content += result.value;
          words += this.countWords(result.value);
        }
        result = await generator.next();
      }

      if (result.value) {
        detectedEncoding = result.value.detectedEncoding;
        lines = result.value.lines;
      }

      return {
        content,
        encoding: options.targetEncoding || 'utf8',
        detectedEncoding,
        lines,
        characters: content.length,
        words,
        size: stats.size,
        isLargeFile: true,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error processing large text file: ${message}`);
      throw new BadRequestException(
        `Failed to process large text file: ${message}`
      );
    }
  }

  detectEncoding(buffer: Buffer): string {
    try {
      const detected = chardet.detect(buffer);
      if (detected && typeof detected === 'string') {
        return detected.toLowerCase();
      }

      if (Array.isArray(detected) && detected.length > 0) {
        return detected[0].name.toLowerCase();
      }

      return 'utf8';
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.warn(`Encoding detection failed: ${message}, using utf8`);
      return 'utf8';
    }
  }

  async convertEncoding(
    filePath: string,
    fromEncoding: string,
    toEncoding: string,
    outputPath?: string
  ): Promise<string> {
    try {
      if (
        !iconv.encodingExists(fromEncoding) ||
        !iconv.encodingExists(toEncoding)
      ) {
        throw new BadRequestException('Unsupported encoding');
      }

      const buffer = fs.readFileSync(filePath);
      const content = iconv.decode(buffer, fromEncoding);
      const convertedBuffer = iconv.encode(content, toEncoding);

      const output =
        outputPath ||
        filePath.replace(
          path.extname(filePath),
          `_${toEncoding}${path.extname(filePath)}`
        );
      fs.writeFileSync(output, convertedBuffer);

      this.logger.debug(
        `File converted from ${fromEncoding} to ${toEncoding}: ${output}`
      );
      return output;
    } catch (error) {
      const message = getErrorMessage(error);
      this.logger.error(`Error converting encoding: ${message}`);
      throw new BadRequestException(`Failed to convert encoding: ${message}`);
    }
  }

  validateTextFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return false;
      }

      const ext = path.extname(filePath).toLowerCase();
      const allowedExtensions = [
        '.txt',
        '.text',
        '.log',
        '.csv',
        '.json',
        '.xml',
        '.md',
      ];

      return allowedExtensions.includes(ext) || this.isTextFile(filePath);
    } catch {
      return false;
    }
  }

  private isTextFile(filePath: string): boolean {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(1024);
      const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
      fs.closeSync(fd);
      const actualBuffer = buffer.slice(0, bytesRead);

      for (let i = 0; i < actualBuffer.length; i++) {
        const byte = actualBuffer[i];
        if (
          byte === 0 ||
          (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)
        ) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private validateTextBuffer(buffer: Buffer, maxSize?: number): void {
    const limit = maxSize || this.DEFAULT_MAX_SIZE;

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Empty text buffer');
    }

    if (buffer.length > limit) {
      throw new BadRequestException(
        `Text file too large: ${buffer.length} bytes (limit: ${limit})`
      );
    }
  }

  private countLines(text: string): number {
    if (!text) return 0;
    return text.split(/\r\n|\r|\n/).length;
  }

  private countWords(text: string): number {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}
