// src/deck/deck.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FlashcardsController } from '@/flashCard/flashcards.controller';
import { FlashcardsService } from '@/flashCard/flashcards.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
})
export class FlashcardsModule {}
