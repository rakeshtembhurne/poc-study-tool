import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { OpenRouterModule } from './core/openrouter/openrouter.module';
import { CardModule } from './card/card.module';
import { FileProcessingModule } from '@/file-processing/file-processing.module';
import { DeckModule } from '@/deck/deck.module';
import { AlgorithmModule } from './algorithm/algorithm.module';
import { ReviewModule } from './review/review.module';
import { FlashcardsModule } from '@/flashCard/flashcards.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    OpenRouterModule,
    UserModule,
    CardModule,
    FileProcessingModule,
    DeckModule,
    AlgorithmModule,
    ReviewModule,
    FlashcardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
