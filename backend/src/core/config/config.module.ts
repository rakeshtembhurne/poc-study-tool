import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import databaseConfig from './database.config';
import kafkaConfig from './kafka.config';
import redisConfig from './redis.config';
import authConfig from './auth.config';
import appConfig from './app.config';
import { validate } from './env.validation';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, kafkaConfig, redisConfig, authConfig],
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
