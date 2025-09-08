import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/common/filters/global-exception.filter';
import { LoggerService } from './core/common/services/logger.service';

async function bootstrap() {
  const logger = new LoggerService();
  logger.setContext('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger,
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port') || 3000;
    const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
    const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['*'];

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy:
          process.env.NODE_ENV === 'production' ? undefined : false,
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-api-key',
        'x-request-id',
      ],
      exposedHeaders: ['x-request-id'],
    });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        validationError: {
          target: false,
          value: false,
        },
      })
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // API versioning
    app.setGlobalPrefix(apiPrefix);

    // Graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port);
    logger.log(
      `Application is running on: http://localhost:${port}/${apiPrefix}`
    );
  } catch (error) {
    logger.error(
      'Failed to start the application',
      error instanceof Error ? error.stack : String(error)
    );
    process.exit(1);
  }
}

void bootstrap();
