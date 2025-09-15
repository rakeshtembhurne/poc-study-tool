import { Module } from '@nestjs/common';
import { FileProcessingService } from './file-processing.service';
import { FileProcessingController } from './file-processing.controller';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';
import { OpenRouterModule } from '@/core/openrouter/openrouter.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [OpenRouterModule, AuthModule, PrismaModule],
  controllers: [FileProcessingController],
  providers: [
    FileProcessingService,
    PdfProcessingService,
    TextProcessingService,
  ],
  exports: [FileProcessingService, PdfProcessingService, TextProcessingService],
})
export class FileProcessingModule {}
