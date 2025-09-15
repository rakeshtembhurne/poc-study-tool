import { Module } from '@nestjs/common';
import { FileProcessingService } from './file-processing.service';
import { FileProcessingController } from './file-processing.controller';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';

@Module({
  controllers: [FileProcessingController],
  providers: [
    FileProcessingService,
    PdfProcessingService,
    TextProcessingService,
  ],
  exports: [FileProcessingService, PdfProcessingService, TextProcessingService],
})
export class FileProcessingModule {}
