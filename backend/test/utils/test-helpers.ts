import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { PrismaService } from '../../src/prisma/prisma.service';

export class TestHelpers {
  static async createTestingModule(
    metadata: ModuleMetadata,
  ): Promise<TestingModule> {
    const testMetadata: ModuleMetadata = {
      ...metadata,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ...(metadata.imports || []),
      ],
    };

    return Test.createTestingModule(testMetadata).compile();
  }

  static mockPrismaService() {
    return {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    };
  }

  static mockConfigService() {
    return {
      get: jest.fn(<T = any>(key: string): T => {
        const config: Record<string, any> = {
          'app.env': 'test',
          'app.port': 3000,
          'app.apiPrefix': 'api/v1',
          'app.corsOrigins': ['http://localhost:3001'],
        };
        return config[key] as T;
      }),
      getOrThrow: jest.fn(<T = any>(key: string): T => {
        const config: Record<string, any> = {
          'app.env': 'test',
          'app.port': 3000,
          'app.apiPrefix': 'api/v1',
          'app.corsOrigins': ['http://localhost:3001'],
        };
        return config[key] as T;
      }),
    };
  }

  static createMockResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  }

  static createMockRequest(overrides = {}) {
    return {
      url: '/test',
      method: 'GET',
      headers: {},
      ...overrides,
    };
  }

  static mockRedisClient() {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      exists: jest.fn().mockResolvedValue(0),
      keys: jest.fn().mockResolvedValue([]),
      ttl: jest.fn().mockResolvedValue(-2),
      expire: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      srem: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      pipeline: jest.fn().mockReturnValue({
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      on: jest.fn(),
      removeAllListeners: jest.fn(),
    };
  }
}
