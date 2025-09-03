# Redis Caching and Session Management Strategy

## Overview

This document outlines the caching and session management strategy implemented in the Super Memo Study Tool backend using Redis for spaced repetition learning optimization.

## Architecture

### Redis Module Structure

```
src/core/redis/
├── redis.module.ts        # Global module configuration
├── redis.service.ts       # Core Redis operations service
├── redis.provider.ts      # Redis client factory
├── redis.constants.ts     # Constants and prefixes
└── __tests__/            # Unit tests
```

### Key Namespacing Strategy

To prevent key collisions and organize data efficiently, we use a hierarchical key naming convention:

- **Cache Keys**: `studytool:{env}:cache:{feature}:{identifier}`
- **Session Keys**: `studytool:{env}:session:{sessionId}`
- **User Session Sets**: `studytool:{env}:user:sessions:{userId}`
- **Study Session Keys**: `studytool:{env}:study:sessions:{userId}:{sessionId}`
- **Learning Progress**: `studytool:{env}:progress:{userId}:{cardId}`

Example:
```
studytool:production:cache:user:profile:12345
studytool:production:study:sessions:user123:session456
studytool:production:progress:user123:card789
studytool:production:session:abc-def-ghi
studytool:production:user:sessions:user123
```

## Caching Strategy

### 1. Cache Levels

#### Application-Level Cache
- **Purpose**: Store frequently accessed configuration and reference data
- **TTL**: 1 hour (production), 5 minutes (development)
- **Examples**: Module configurations, permission mappings, organization hierarchies

#### Feature-Level Cache
- **Purpose**: Cache specific feature data
- **TTL**: Varies by feature (5 minutes to 1 hour)
- **Examples**: User profiles, API responses, computed results

#### Request-Level Cache
- **Purpose**: Cache data within a single request lifecycle
- **TTL**: Request duration
- **Implementation**: In-memory cache, not Redis

### 2. Cache Invalidation

#### Time-Based Invalidation
- Default TTL values based on environment
- Configurable per cache entry

#### Event-Based Invalidation
```typescript
// Example: Invalidate user cache on profile update
await redisService.delete(`user:profile:${userId}`);
await redisService.delete(`user:permissions:${userId}`);
```

#### Pattern-Based Invalidation
```typescript
// Clear all user-related cache entries
await redisService.clear('user:*');
```

### 3. Cache Usage Examples

```typescript
// Get or set cache with automatic TTL
async getUserProfile(userId: string): Promise<UserProfile> {
  const cacheKey = `user:profile:${userId}`;
  
  // Try to get from cache
  const cached = await this.redisService.get<UserProfile>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from database
  const profile = await this.prisma.user.findUnique({ where: { id: userId } });
  
  // Cache the result
  await this.redisService.set(cacheKey, profile, { ttl: 300 }); // 5 minutes
  
  return profile;
}
```

## Session Management Strategy

### 1. Session Architecture

#### Session Storage
- Sessions stored in Redis with configurable TTL
- Default: 2 hours (production), 1 hour (development)
- Rolling sessions: TTL refreshed on activity

#### Session Limits
- Maximum sessions per user: 5 (production), 10 (development)
- Oldest session removed when limit exceeded

### 2. Session Data Structure

```typescript
interface SessionData {
  userId: string;
  organizationId: string;
  organizationType: 'PERP' | 'SERP' | 'REGISTRY' | 'ORG' | 'CU';
  permissions: string[];
  createdAt: Date;
  lastActivity: Date;
}
```

### 3. Session Operations

#### Create Session
```typescript
const sessionData: SessionData = {
  userId: user.id,
  organizationId: user.organizationId,
  organizationType: user.organizationType,
  permissions: user.permissions,
  createdAt: new Date(),
  lastActivity: new Date(),
};

await redisService.setSession(sessionId, sessionData, 7200); // 2 hours
```

#### Validate Session
```typescript
const session = await redisService.getSession(sessionId);
if (!session) {
  throw new UnauthorizedException('Invalid session');
}

// Refresh session TTL on activity
await redisService.touchSession(sessionId, 7200);
```

#### Destroy Session
```typescript
// Single session logout
await redisService.deleteSession(sessionId);

// Logout all devices
await redisService.deleteUserSessions(userId);
```

### 4. Session Security

- Session IDs generated using cryptographically secure random bytes
- Sessions bound to IP address and user agent (optional)
- Automatic cleanup of expired sessions
- Rate limiting on session creation

## Performance Considerations

### 1. Connection Pooling
- Redis connection pool configured based on expected load
- Retry strategy with exponential backoff
- Circuit breaker pattern for Redis failures

### 2. Serialization
- JSON serialization for complex objects
- Binary data stored as base64 encoded strings
- Compression for large cached objects (>1KB)

### 3. Monitoring
- Track cache hit/miss rates
- Monitor Redis memory usage
- Alert on high eviction rates
- Log slow Redis operations (>100ms)

## Configuration

### Environment Variables

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Configuration
REDIS_CACHE_TTL=300      # Default cache TTL in seconds
REDIS_KEY_PREFIX=pyramid:dev:

# Session Configuration
SESSION_TIMEOUT=3600     # Session timeout in seconds
MAX_SESSIONS_PER_USER=5  # Maximum concurrent sessions

# Performance
REDIS_MAX_RETRIES=3
REDIS_ENABLE_OFFLINE_QUEUE=true
```

### Environment-Specific Defaults

| Configuration | Development | Production | Test |
|--------------|-------------|------------|------|
| Cache TTL | 5 minutes | 1 hour | 1 minute |
| Session Timeout | 1 hour | 2 hours | 5 minutes |
| Max Sessions | 10 | 5 | 2 |
| Max Retries | 3 | 5 | 1 |

## Best Practices

### 1. Cache Key Design
- Use consistent, hierarchical key patterns
- Include version numbers for cache schema changes
- Avoid special characters in dynamic key parts

### 2. Error Handling
- Graceful degradation when Redis is unavailable
- Fallback to database queries on cache miss
- Log but don't fail on cache write errors

### 3. Testing
- Mock Redis in unit tests
- Use separate Redis database for integration tests
- Test cache invalidation scenarios
- Verify session limits and cleanup

### 4. Maintenance
- Regular monitoring of key patterns
- Periodic cleanup of orphaned keys
- Review and adjust TTL values based on usage patterns
- Document any custom caching strategies

## Migration and Deployment

### Rolling Updates
1. Deploy new code with backward-compatible cache keys
2. Gradually migrate to new cache schema
3. Clean up old cache keys after migration period

### Cache Warming
- Pre-populate critical cache entries on startup
- Use background jobs for cache warming
- Implement gradual cache warming to avoid thundering herd

### Disaster Recovery
- Redis persistence configured for session data
- Regular backups of critical cache data
- Documented procedure for cache rebuild