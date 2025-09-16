import { Module } from '@nestjs/common';
import { FileProcessingService } from './file-processing.service';
import { FileProcessingController } from './file-processing.controller';
import { PdfProcessingService } from './services/pdf-processing.service';
import { TextProcessingService } from './services/text-processing.service';
import { OpenRouterModule } from '@/core/openrouter/openrouter.module';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserRepository } from './repositories/user.repository';
import { FlashcardStrategyFactory } from './factories/flashcard-strategy.factory';
import {
  OpenRouterFlashcardStrategy,
  OpenAIFlashcardStrategy,
} from './strategies/flashcard-generation.strategy';
import {
  FileValidationPipe,
  MultipleFilesValidationPipe,
} from './pipes/file-validation.pipe';
import { FileProcessingQueueService } from './queues/file-processing.queue';

@Module({
  imports: [OpenRouterModule, AuthModule, PrismaModule],
  controllers: [FileProcessingController],
  providers: [
    FileProcessingService,
    PdfProcessingService,
    TextProcessingService,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    FlashcardStrategyFactory,
    OpenRouterFlashcardStrategy,
    OpenAIFlashcardStrategy,
    FileValidationPipe,
    MultipleFilesValidationPipe,
    FileProcessingQueueService,
  ],
  exports: [FileProcessingService, PdfProcessingService, TextProcessingService],
})
export class FileProcessingModule {}
