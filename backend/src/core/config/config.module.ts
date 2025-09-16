import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import databaseConfig from './database.config';
import authConfig from './auth.config';
import appConfig from './app.config';
import openrouterConfig from './openrouter.config';
import fileProcessingConfig from './file-processing.config';
import flashcardConfig from './flashcard.config';
import { validate } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        openrouterConfig,
        fileProcessingConfig,
        flashcardConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
      cache: true,
      validate,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
