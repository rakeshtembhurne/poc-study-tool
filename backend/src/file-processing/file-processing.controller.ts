import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
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
import { multerConfig } from '@/core/config/multer.config';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { User } from '@/auth/decorators/user.decorator';
import { AuthPayload } from '@/auth/types/auth.types';
import {
  FileValidationPipe,
  MultipleFilesValidationPipe,
} from './pipes/file-validation.pipe';

@ApiTags('File Processing')
@Controller('file-processing')
@UseGuards(JwtAuthGuard)
export class FileProcessingController {
  constructor(private readonly fileProcessingService: FileProcessingService) {}

  @Post('upload')
  @ApiOperation({
    summary:
      'Upload a single file with optional text parsing and flashcard generation',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully with optional flashcards',
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @User() user: AuthPayload
  ) {
    return this.fileProcessingService.uploadSingleFile(file, dto, user);
  }

  @Post('upload/multiple')
  @ApiOperation({
    summary:
      'Upload multiple files with optional text parsing and flashcard generation',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully with optional flashcards',
  })
  @UseInterceptors(FilesInterceptor('files', 5, multerConfig))
  async uploadMultipleFiles(
    @UploadedFiles(MultipleFilesValidationPipe) files: Express.Multer.File[],
    @Body() dto: UploadMultipleFilesDto,
    @User() user: AuthPayload
  ) {
    return this.fileProcessingService.uploadMultipleFiles(files, dto, user);
  }
}
