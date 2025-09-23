import { Module } from '@nestjs/common';
import { PromptProcessingController } from './prompt-processing.controller';
import { PromptProcessingService } from './prompt-processing.service';
import { FileProcessingModule } from '@/file-processing/file-processing.module';
import { FlashcardStrategyFactory } from '@/file-processing/factories/flashcard-strategy.factory';
import { OpenRouterModule } from '@/core/openrouter/openrouter.module';
import { AuthModule } from '@/auth/auth.module'; // ✅ import AuthModule
import {
  OpenRouterFlashcardStrategy,
  OpenAIFlashcardStrategy,
} from '@/file-processing/strategies/flashcard-generation.strategy';

@Module({
  imports: [
    FileProcessingModule,
    OpenRouterModule,
    AuthModule, // ✅ added here
  ],
  controllers: [PromptProcessingController],
  providers: [
    PromptProcessingService,
    FlashcardStrategyFactory,
    OpenRouterFlashcardStrategy,
    OpenAIFlashcardStrategy,
  ],
})
export class PromptProcessingModule {}
