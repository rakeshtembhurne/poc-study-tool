import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import {
  REDIS_CLIENT,
  CACHE_PREFIX,
  SESSION_PREFIX,
  USER_SESSION_PREFIX,
  DEFAULT_CACHE_TTL,
} from './redis.constants';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  compress?: boolean;
  compressionThreshold?: number;
}

export interface SessionData {
  userId: string;
  organizationId: string;
  organizationType: string;
  permissions: string[];
  createdAt: Date;
  lastActivity: Date;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

@Injectable()
export class OptimizedRedisService implements OnModuleDestroy {
  private readonly logger = new Logger(OptimizedRedisService.name);
  private readonly metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  // Pipeline for batch operations
  private pipeline: ReturnType<Redis['pipeline']> | null = null;
  private pipelineTimer: NodeJS.Timeout | null = null;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    // Enable auto-pipelining for better performance
    this.redis.options.enableAutoPipelining = true;
  }

  async onModuleDestroy() {
    if (this.pipelineTimer) {
      clearTimeout(this.pipelineTimer);
    }
    await this.flushPipeline();
    await this.redis.quit();
  }

  // Optimized cache operations with compression support
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const compressedKey = `${fullKey}:gz`;

      // Try compressed version first
      let value = await this.redis.get(compressedKey);
      let isCompressed = false;

      if (!value) {
        value = await this.redis.get(fullKey);
      } else {
        isCompressed = true;
      }

      if (!value) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;

      if (isCompressed) {
        const buffer = Buffer.from(value, 'base64');
        const decompressed = await gunzipAsync(buffer);
        return JSON.parse(decompressed.toString()) as T;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set<T = unknown>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      const ttl = options.ttl !== undefined ? options.ttl : DEFAULT_CACHE_TTL;
      const prefix = options.prefix || CACHE_PREFIX;
      const compressionThreshold = options.compressionThreshold || 1024; // 1KB default

      const serialized = JSON.stringify(value);
      let finalKey = `${prefix}${key}`;
      let finalValue = serialized;

      // Compress if enabled and value is large enough
      if (
        options.compress !== false &&
        serialized.length > compressionThreshold
      ) {
        const compressed = await gzipAsync(serialized);
        finalValue = compressed.toString('base64');
        finalKey = `${finalKey}:gz`;
      }

      if (ttl > 0) {
        await this.redis.setex(finalKey, ttl, finalValue);
      } else {
        await this.redis.set(finalKey, finalValue);
      }

      this.metrics.sets++;
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  // Batch operations for better performance
  async mget<T = unknown>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map((key) => `${CACHE_PREFIX}${key}`);
      const values = await this.redis.mget(...fullKeys);

      return values.map((value) => {
        if (!value) {
          this.metrics.misses++;
          return null;
        }

        this.metrics.hits++;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Error in mget operation:', error);
      return keys.map(() => null);
    }
  }

  async mset<T = unknown>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();

      for (const entry of entries) {
        const serialized = JSON.stringify(entry.value);
        const fullKey = `${CACHE_PREFIX}${entry.key}`;
        const ttl = entry.ttl !== undefined ? entry.ttl : DEFAULT_CACHE_TTL;

        if (ttl > 0) {
          pipeline.setex(fullKey, ttl, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }

      await pipeline.exec();
      this.metrics.sets += entries.length;
      return true;
    } catch (error) {
      this.logger.error('Error in mset operation:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const compressedKey = `${fullKey}:gz`;

      // Delete both compressed and uncompressed versions
      const result = await this.redis.del(fullKey, compressedKey);
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = `${CACHE_PREFIX}${key}`;
      const compressedKey = `${fullKey}:gz`;

      // Check both versions
      const result = await this.redis.exists(fullKey, compressedKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error checking cache key existence ${key}:`, error);
      return false;
    }
  }

  // Optimized clear using SCAN instead of KEYS
  async clear(pattern: string = '*'): Promise<number> {
    try {
      const stream = this.redis.scanStream({
        match: `${CACHE_PREFIX}${pattern}`,
        count: 100,
      });

      const keys: string[] = [];
      stream.on('data', (resultKeys: string[]) => {
        keys.push(...resultKeys);
      });

      await new Promise((resolve) => stream.on('end', resolve));

      if (keys.length === 0) return 0;

      // Delete in batches to avoid blocking
      const batchSize = 1000;
      let deleted = 0;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        deleted += await this.redis.del(...batch);
      }

      this.metrics.deletes += deleted;
      return deleted;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Error clearing cache with pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Session operations with better performance
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
      if (!data) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;
      return JSON.parse(data) as SessionData;
    } catch (error) {
      this.metrics.errors++;
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

      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      pipeline.setex(`${SESSION_PREFIX}${sessionId}`, ttl, serialized);
      pipeline.sadd(`${USER_SESSION_PREFIX}${data.userId}`, sessionId);
      pipeline.expire(`${USER_SESSION_PREFIX}${data.userId}`, ttl);

      const results = await pipeline.exec();
      const success = results?.every(([err]) => !err) ?? false;

      if (success) {
        this.metrics.sets++;
      } else {
        this.metrics.errors++;
      }

      return success;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Error setting session ${sessionId}:`, error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return false;

      const pipeline = this.redis.pipeline();
      pipeline.del(`${SESSION_PREFIX}${sessionId}`);
      pipeline.srem(`${USER_SESSION_PREFIX}${session.userId}`, sessionId);

      const results = await pipeline.exec();
      const success = results?.every(([err]) => !err) ?? false;

      if (success) {
        this.metrics.deletes++;
      }

      return success;
    } catch (error) {
      this.metrics.errors++;
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

      const pipeline = this.redis.pipeline();

      // Delete all session keys
      sessions.forEach((sessionId) => {
        pipeline.del(`${SESSION_PREFIX}${sessionId}`);
      });

      // Delete user session set
      pipeline.del(`${USER_SESSION_PREFIX}${userId}`);

      const results = await pipeline.exec();
      const deleted = results?.filter(([err]) => !err).length ?? 0;

      this.metrics.deletes += deleted;
      return deleted - 1; // Subtract 1 for the set deletion
    } catch (error) {
      this.metrics.errors++;
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
      // Reset metrics
      this.metrics.hits = 0;
      this.metrics.misses = 0;
      this.metrics.sets = 0;
      this.metrics.deletes = 0;
      this.metrics.errors = 0;
      return true;
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      return false;
    }
  }

  // Get cache metrics for monitoring
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Calculate hit rate
  getHitRate(): number {
    const total = this.metrics.hits + this.metrics.misses;
    return total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  // Pipeline management for batch operations
  private async flushPipeline(): Promise<void> {
    if (this.pipeline) {
      await this.pipeline.exec();
      this.pipeline = null;
    }
  }

  // Add to pipeline with auto-flush
  async addToPipeline(command: string, ...args: unknown[]): Promise<void> {
    if (!this.pipeline) {
      this.pipeline = this.redis.pipeline();
    }

    interface PipelineWithLength {
      [key: string]: ((...args: unknown[]) => void) | number | undefined;
      length?: number;
    }
    const pipelineTyped = this.pipeline as unknown as PipelineWithLength;
    const commandFn = pipelineTyped[command];
    if (typeof commandFn === 'function') {
      commandFn(...args);
    }

    // Auto-flush after 100ms or 100 commands
    if ((pipelineTyped.length ?? 0) >= 100) {
      await this.flushPipeline();
    } else if (!this.pipelineTimer) {
      this.pipelineTimer = setTimeout(() => {
        void this.flushPipeline().then(() => {
          this.pipelineTimer = null;
        });
      }, 100);
    }
  }
}
