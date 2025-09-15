import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileProcessingService } from './file-processing.service';
import { UploadFileDto } from './dto/create-file-processing.dto';
import { UploadMultipleFilesDto } from './dto/upload-multiple.dto';
import {
  ProcessFileDto,
  ProcessedFileResponseDto,
} from './dto/processed-file.dto';
import { multerConfig } from '@/core/config/multer.config';

@ApiTags('File Processing')
@Controller('file-processing')
export class FileProcessingController {
  constructor(private readonly fileProcessingService: FileProcessingService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a single file without processing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto
  ) {
    return this.fileProcessingService.uploadSingleFile(file, dto);
  }

  @Post('upload/multiple')
  @ApiOperation({ summary: 'Upload multiple files without processing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 5, multerConfig))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: UploadMultipleFilesDto
  ) {
    return this.fileProcessingService.uploadMultipleFiles(files, dto);
  }

  @Post('process')
  @ApiOperation({ summary: 'Upload and process a single file (PDF or text)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    type: ProcessedFileResponseDto,
    description: 'File processed successfully',
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async processFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ProcessFileDto
  ): Promise<ProcessedFileResponseDto> {
    return this.fileProcessingService.processFile(file, dto);
  }

  @Post('process/multiple')
  @ApiOperation({ summary: 'Upload and process multiple files (PDF or text)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    type: [ProcessedFileResponseDto],
    description: 'Files processed successfully',
  })
  @UseInterceptors(FilesInterceptor('files', 5, multerConfig))
  async processMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: ProcessFileDto
  ): Promise<ProcessedFileResponseDto[]> {
    return this.fileProcessingService.processMultipleFiles(files, dto);
  }

  @Post('extract-text')
  @ApiOperation({ summary: 'Upload a file and extract text only' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Text extracted successfully' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async extractText(
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ text: string; type: string }> {
    return this.fileProcessingService.extractTextOnly(file);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a file format and structure' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'File validation result' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async validateFile(
    @UploadedFile() file: Express.Multer.File
  ): Promise<{ isValid: boolean; error?: string }> {
    return this.fileProcessingService.validateFile(file);
  }
}
