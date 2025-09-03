import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '../../config/config.module';
import { RedisModule } from '../redis.module';
import { RedisService } from '../redis.service';
import { REDIS_CLIENT } from '../redis.constants';

describe('RedisModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule,
        RedisModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide RedisService', () => {
    const redisService = module.get<RedisService>(RedisService);
    expect(redisService).toBeDefined();
    expect(redisService).toBeInstanceOf(RedisService);
  });

  it('should provide REDIS_CLIENT', () => {
    const redisClient = module.get<unknown>(REDIS_CLIENT);
    expect(redisClient).toBeDefined();
  });

  it('should be a global module', () => {
    const globalMetadata = Reflect.getMetadata(
      '__module:global__',
      RedisModule,
    ) as boolean;
    expect(globalMetadata).toBe(true);
  });

  it('should export RedisService and REDIS_CLIENT', () => {
    const exportsMetadata = Reflect.getMetadata(
      'exports',
      RedisModule,
    ) as unknown[];
    expect(exportsMetadata).toContain(RedisService);
    expect(exportsMetadata).toContain(REDIS_CLIENT);
  });
});
