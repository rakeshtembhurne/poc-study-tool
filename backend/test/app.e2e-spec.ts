import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import helmet from 'helmet';

import { AppModule } from './../src/app.module';
import { GlobalExceptionFilter } from '../src/core/common/filters/global-exception.filter';
import { TestHelpers } from './utils/test-helpers';
import { REDIS_CLIENT } from '../src/core/redis/redis.constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let mockRedisClient: ReturnType<typeof TestHelpers.mockRedisClient>;

  beforeAll(async () => {
    mockRedisClient = TestHelpers.mockRedisClient();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('PrismaService')
      .useValue(TestHelpers.mockPrismaService())
      .overrideProvider(REDIS_CLIENT)
      .useValue(mockRedisClient)
      .compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);

    // Apply the same configuration as in main.ts
    const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );

    app.enableCors({
      origin: configService.get<string[]>('app.corsOrigins') || ['*'],
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.setGlobalPrefix(apiPrefix);

    await app.init();
  });

  afterAll(async () => {
    // Ensure Redis mock is cleaned up
    if (mockRedisClient) {
      mockRedisClient.removeAllListeners();
    }
    await app.close();
  });

  describe('Root endpoint', () => {
    it('GET /api/v1', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get('/api/v1')
        .expect(200)
        .expect('Hello World!');
    });

    it('should return 404 for non-existent endpoint', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get('/api/v1/non-existent')
        .expect(404);
    });
  });

  describe('Security headers', () => {
    it('should include security headers', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/api/v1')
        .expect(200);

      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
