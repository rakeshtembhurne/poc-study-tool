import { Test, TestingModule } from '@nestjs/testing';
import { RedisService, SessionData } from '../redis.service';
import {
  REDIS_CLIENT,
  CACHE_PREFIX,
  SESSION_PREFIX,
  USER_SESSION_PREFIX,
} from '../redis.constants';
import { Logger } from '@nestjs/common';

interface MockRedisClient {
  get: jest.Mock;
  set: jest.Mock;
  setex: jest.Mock;
  del: jest.Mock;
  exists: jest.Mock;
  keys: jest.Mock;
  sadd: jest.Mock;
  srem: jest.Mock;
  smembers: jest.Mock;
  expire: jest.Mock;
  ping: jest.Mock;
  info: jest.Mock;
  flushdb: jest.Mock;
  quit: jest.Mock;
}

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: MockRedisClient;
  let errorSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      expire: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      flushdb: jest.fn(),
      quit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Silence logger during tests
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleDestroy', () => {
    it('should quit redis connection', async () => {
      await service.onModuleDestroy();
      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('Cache Operations', () => {
    describe('get', () => {
      it('should return parsed value when key exists', async () => {
        const testData = { foo: 'bar' };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(testData));

        const result = await service.get<typeof testData>('test-key');

        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
        );
        expect(result).toEqual(testData);
      });

      it('should return null when key does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.get<unknown>('non-existent-key');

        expect(result).toBeNull();
      });

      it('should return null and log error on exception', async () => {
        mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

        const result = await service.get<unknown>('error-key');

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalledWith(
          'Error getting cache key error-key:',
          expect.any(Error),
        );
      });
    });

    describe('set', () => {
      it('should set value with default TTL', async () => {
        const testData = { foo: 'bar' };

        const result = await service.set('test-key', testData);

        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
          300, // DEFAULT_CACHE_TTL
          JSON.stringify(testData),
        );
        expect(result).toBe(true);
      });

      it('should set value with custom TTL', async () => {
        const testData = { foo: 'bar' };

        const result = await service.set('test-key', testData, { ttl: 600 });

        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
          600,
          JSON.stringify(testData),
        );
        expect(result).toBe(true);
      });

      it('should set value without TTL when TTL is 0', async () => {
        const testData = { foo: 'bar' };

        const result = await service.set('test-key', testData, { ttl: 0 });

        expect(mockRedisClient.set).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
          JSON.stringify(testData),
        );
        expect(result).toBe(true);
      });

      it('should return false and log error on exception', async () => {
        mockRedisClient.setex.mockRejectedValue(new Error('Redis error'));

        const result = await service.set('error-key', { data: 'test' });

        expect(result).toBe(false);
        expect(errorSpy).toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should return true when key is deleted', async () => {
        mockRedisClient.del.mockResolvedValue(1);

        const result = await service.delete('test-key');

        expect(mockRedisClient.del).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
        );
        expect(result).toBe(true);
      });

      it('should return false when key does not exist', async () => {
        mockRedisClient.del.mockResolvedValue(0);

        const result = await service.delete('non-existent-key');

        expect(result).toBe(false);
      });
    });

    describe('exists', () => {
      it('should return true when key exists', async () => {
        mockRedisClient.exists.mockResolvedValue(1);

        const result = await service.exists('test-key');

        expect(mockRedisClient.exists).toHaveBeenCalledWith(
          `${CACHE_PREFIX}test-key`,
        );
        expect(result).toBe(true);
      });

      it('should return false when key does not exist', async () => {
        mockRedisClient.exists.mockResolvedValue(0);

        const result = await service.exists('non-existent-key');

        expect(result).toBe(false);
      });
    });

    describe('clear', () => {
      it('should delete all keys matching pattern', async () => {
        const mockKeys = ['cache:key1', 'cache:key2', 'cache:key3'];
        mockRedisClient.keys.mockResolvedValue(mockKeys);
        mockRedisClient.del.mockResolvedValue(3);

        const result = await service.clear('*');

        expect(mockRedisClient.keys).toHaveBeenCalledWith(`${CACHE_PREFIX}*`);
        expect(mockRedisClient.del).toHaveBeenCalledWith(...mockKeys);
        expect(result).toBe(3);
      });

      it('should return 0 when no keys match pattern', async () => {
        mockRedisClient.keys.mockResolvedValue([]);

        const result = await service.clear('non-existent*');

        expect(result).toBe(0);
      });
    });
  });

  describe('Session Operations', () => {
    const testDate = new Date('2025-08-05T13:02:56.884Z');
    const mockSessionData: SessionData = {
      userId: 'user123',
      organizationId: 'org123',
      organizationType: 'ORG',
      permissions: ['read', 'write'],
      createdAt: testDate,
      lastActivity: testDate,
    };

    describe('getSession', () => {
      it('should return session data when session exists', async () => {
        mockRedisClient.get.mockResolvedValue(JSON.stringify(mockSessionData));

        const result = await service.getSession('session123');

        expect(mockRedisClient.get).toHaveBeenCalledWith(
          `${SESSION_PREFIX}session123`,
        );
        // JSON.parse returns dates as strings
        expect(result).toEqual({
          ...mockSessionData,
          createdAt: testDate.toISOString(),
          lastActivity: testDate.toISOString(),
        });
      });

      it('should return null when session does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.getSession('non-existent-session');

        expect(result).toBeNull();
      });
    });

    describe('setSession', () => {
      it('should set session and track user session', async () => {
        const sessionId = 'session123';
        const ttl = 3600;

        const result = await service.setSession(
          sessionId,
          mockSessionData,
          ttl,
        );

        expect(mockRedisClient.setex).toHaveBeenCalledWith(
          `${SESSION_PREFIX}${sessionId}`,
          ttl,
          JSON.stringify(mockSessionData),
        );
        expect(mockRedisClient.sadd).toHaveBeenCalledWith(
          `${USER_SESSION_PREFIX}${mockSessionData.userId}`,
          sessionId,
        );
        expect(mockRedisClient.expire).toHaveBeenCalledWith(
          `${USER_SESSION_PREFIX}${mockSessionData.userId}`,
          ttl,
        );
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        mockRedisClient.setex.mockRejectedValue(new Error('Redis error'));

        const result = await service.setSession(
          'session123',
          mockSessionData,
          3600,
        );

        expect(result).toBe(false);
      });
    });

    describe('deleteSession', () => {
      it('should delete session and remove from user sessions', async () => {
        mockRedisClient.get.mockResolvedValue(JSON.stringify(mockSessionData));
        mockRedisClient.del.mockResolvedValue(1);

        const result = await service.deleteSession('session123');

        expect(mockRedisClient.srem).toHaveBeenCalledWith(
          `${USER_SESSION_PREFIX}${mockSessionData.userId}`,
          'session123',
        );
        expect(mockRedisClient.del).toHaveBeenCalledWith(
          `${SESSION_PREFIX}session123`,
        );
        expect(result).toBe(true);
      });

      it('should return false when session does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);
        mockRedisClient.del.mockResolvedValue(0);

        const result = await service.deleteSession('non-existent-session');

        expect(result).toBe(false);
      });
    });

    describe('getUserSessions', () => {
      it('should return user session IDs', async () => {
        const sessionIds = ['session1', 'session2', 'session3'];
        mockRedisClient.smembers.mockResolvedValue(sessionIds);

        const result = await service.getUserSessions('user123');

        expect(mockRedisClient.smembers).toHaveBeenCalledWith(
          `${USER_SESSION_PREFIX}user123`,
        );
        expect(result).toEqual(sessionIds);
      });

      it('should return empty array on error', async () => {
        mockRedisClient.smembers.mockRejectedValue(new Error('Redis error'));

        const result = await service.getUserSessions('user123');

        expect(result).toEqual([]);
      });
    });

    describe('deleteUserSessions', () => {
      it('should delete all user sessions', async () => {
        const sessionIds = ['session1', 'session2'];
        mockRedisClient.smembers.mockResolvedValue(sessionIds);
        mockRedisClient.del.mockResolvedValue(2);

        const result = await service.deleteUserSessions('user123');

        expect(mockRedisClient.del).toHaveBeenCalledWith(
          `${SESSION_PREFIX}session1`,
          `${SESSION_PREFIX}session2`,
        );
        expect(mockRedisClient.del).toHaveBeenCalledWith(
          `${USER_SESSION_PREFIX}user123`,
        );
        expect(result).toBe(2);
      });

      it('should return 0 when user has no sessions', async () => {
        mockRedisClient.smembers.mockResolvedValue([]);

        const result = await service.deleteUserSessions('user123');

        expect(result).toBe(0);
      });
    });

    describe('touchSession', () => {
      it('should extend session TTL', async () => {
        mockRedisClient.expire.mockResolvedValue(1);

        const result = await service.touchSession('session123', 3600);

        expect(mockRedisClient.expire).toHaveBeenCalledWith(
          `${SESSION_PREFIX}session123`,
          3600,
        );
        expect(result).toBe(true);
      });

      it('should return false when session does not exist', async () => {
        mockRedisClient.expire.mockResolvedValue(0);

        const result = await service.touchSession('non-existent-session', 3600);

        expect(result).toBe(false);
      });
    });
  });

  describe('Utility Methods', () => {
    describe('ping', () => {
      it('should return true when Redis responds with PONG', async () => {
        mockRedisClient.ping.mockResolvedValue('PONG');

        const result = await service.ping();

        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        mockRedisClient.ping.mockRejectedValue(new Error('Connection error'));

        const result = await service.ping();

        expect(result).toBe(false);
      });
    });

    describe('info', () => {
      it('should return Redis info', async () => {
        const mockInfo = 'redis_version:6.2.6\r\nconnected_clients:1';
        mockRedisClient.info.mockResolvedValue(mockInfo);

        const result = await service.info();

        expect(result).toBe(mockInfo);
      });

      it('should return empty string on error', async () => {
        mockRedisClient.info.mockRejectedValue(new Error('Connection error'));

        const result = await service.info();

        expect(result).toBe('');
      });
    });

    describe('flushdb', () => {
      it('should flush database successfully', async () => {
        mockRedisClient.flushdb.mockResolvedValue('OK');

        const result = await service.flushdb();

        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        mockRedisClient.flushdb.mockRejectedValue(
          new Error('Permission denied'),
        );

        const result = await service.flushdb();

        expect(result).toBe(false);
      });
    });
  });
});
