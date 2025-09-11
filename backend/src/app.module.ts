import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { AuthModule } from './auth/auth.module';
import { OpenRouterModule } from './core/openrouter/openrouter.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, OpenRouterModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
