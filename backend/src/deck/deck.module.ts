// src/deck/deck.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DecksController } from '@/deck/deck.controller';
import { DecksService } from '@/deck/deck.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DecksController],
  providers: [DecksService],
})
export class DeckModule {}
