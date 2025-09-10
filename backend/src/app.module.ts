import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { AuthModule } from './auth/auth.module';
import { CardModule } from './card/card.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, CardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
