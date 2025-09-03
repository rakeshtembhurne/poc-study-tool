import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  CACHE_PREFIX,
  SESSION_PREFIX,
  USER_SESSION_PREFIX,
  DEFAULT_CACHE_TTL,
} from './redis.constants';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface SessionData {
  userId: string;
  organizationId: string;
  organizationType: string;
  permissions: string[];
  createdAt: Date;
  lastActivity: Date;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // Cache operations
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(`${CACHE_PREFIX}${key}`);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      const ttl = options.ttl !== undefined ? options.ttl : DEFAULT_CACHE_TTL;
      const prefix = options.prefix || CACHE_PREFIX;
      const serialized = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(`${prefix}${key}`, ttl, serialized);
      } else {
        await this.redis.set(`${prefix}${key}`, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(`${CACHE_PREFIX}${key}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(`${CACHE_PREFIX}${key}`);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key existence ${key}:`, error);
      return false;
    }
  }

  async clear(pattern: string = '*'): Promise<number> {
    try {
      const keys = await this.redis.keys(`${CACHE_PREFIX}${pattern}`);
      if (keys.length === 0) return 0;

      const result = await this.redis.del(...keys);
      return result;
    } catch (error) {
      this.logger.error(`Error clearing cache with pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Session operations
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
      return data ? (JSON.parse(data) as SessionData) : null;
    } catch (error) {
      this.logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  async setSession(
    sessionId: string,
    data: SessionData,
    ttl: number,
  ): Promise<boolean> {
    try {
      const serialized = JSON.stringify(data);
      await this.redis.setex(`${SESSION_PREFIX}${sessionId}`, ttl, serialized);

      // Track user sessions
      await this.redis.sadd(`${USER_SESSION_PREFIX}${data.userId}`, sessionId);
      await this.redis.expire(`${USER_SESSION_PREFIX}${data.userId}`, ttl);

      return true;
    } catch (error) {
      this.logger.error(`Error setting session ${sessionId}:`, error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        await this.redis.srem(
          `${USER_SESSION_PREFIX}${session.userId}`,
          sessionId,
        );
      }

      const result = await this.redis.del(`${SESSION_PREFIX}${sessionId}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const sessions = await this.redis.smembers(
        `${USER_SESSION_PREFIX}${userId}`,
      );
      return sessions;
    } catch (error) {
      this.logger.error(`Error getting user sessions for ${userId}:`, error);
      return [];
    }
  }

  async deleteUserSessions(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      if (sessions.length === 0) return 0;

      const keys = sessions.map((id) => `${SESSION_PREFIX}${id}`);
      const deleted = await this.redis.del(...keys);
      await this.redis.del(`${USER_SESSION_PREFIX}${userId}`);

      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting user sessions for ${userId}:`, error);
      return 0;
    }
  }

  async touchSession(sessionId: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(
        `${SESSION_PREFIX}${sessionId}`,
        ttl,
      );
      return result === 1;
    } catch (error) {
      this.logger.error(`Error touching session ${sessionId}:`, error);
      return false;
    }
  }

  // Utility methods
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed:', error);
      return false;
    }
  }

  async info(): Promise<string> {
    try {
      return await this.redis.info();
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      return '';
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      return false;
    }
  }
}
