import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import { ModelManager } from './services/model-manager.service';
import { ConnectionManager } from './services/connection-manager.service';
import { FlashcardGenerator } from './services/flashcard-generator.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ModelManager,
    ConnectionManager,
    FlashcardGenerator,
    OpenRouterService,
  ],
  exports: [OpenRouterService],
})
export class OpenRouterModule {}
