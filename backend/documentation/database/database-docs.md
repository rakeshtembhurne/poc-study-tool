# Database Documentation

## Overview

The database is designed to support the SM-15 spaced repetition algorithm with PostgreSQL as the database system and Prisma as the ORM. 

### Data Types and Constraints
```sql
-- Example of PostgreSQL-specific column definitions
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    front_content TEXT NOT NULL,
    back_content TEXT NOT NULL,
    a_factor DECIMAL(3,2) NOT NULL 
        CHECK (a_factor >= 1.1 AND a_factor <= 2.5),
    interval_days INTEGER NOT NULL 
        CHECK (interval_days >= 0),
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    review_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Example of composite unique constraint
CREATE UNIQUE INDEX unique_user_date_stats 
ON user_statistics(user_id, date);

-- Example of partial index for due cards
CREATE INDEX idx_due_cards 
ON cards(user_id, next_review_date) 
WHERE next_review_date <= CURRENT_TIMESTAMP;
```

### Foreign Key Constraints
```sql
-- All relationships with CASCADE rules
ALTER TABLE cards
    ADD CONSTRAINT fk_user_cards
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;

ALTER TABLE reviews
    ADD CONSTRAINT fk_card_reviews
    FOREIGN KEY (card_id) 
    REFERENCES cards(id) 
    ON DELETE CASCADE;

ALTER TABLE of_matrix
    ADD CONSTRAINT fk_user_ofmatrix
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE CASCADE;
```

### PostgreSQL-Specific Optimizations

#### JSONB Indexing
```sql
-- GIN index for JSON search on review history
CREATE INDEX idx_review_history 
ON cards USING GIN (review_history);

-- JSONB path operations for analytics
SELECT user_id, 
       review_history->>'grade' as grade,
       review_history->>'date' as review_date
FROM cards
WHERE review_history @> '[{"grade": 5}]';
```

#### Materialized Views for Analytics
```sql
-- Refresh periodically for performance
CREATE MATERIALIZED VIEW user_performance_summary AS
SELECT u.id as user_id,
       COUNT(c.id) as total_cards,
       AVG(r.grade) as average_grade,
       COUNT(CASE WHEN c.next_review_date <= NOW() THEN 1 END) as due_cards
FROM users u
LEFT JOIN cards c ON u.id = c.user_id
LEFT JOIN reviews r ON c.id = r.card_id
GROUP BY u.id
WITH NO DATA;
```provides comprehensive information about the database structure, relationships, and field explanations.

### PostgreSQL Features Utilized
- **JSONB Storage**: `sm15Parameters` and `preferences` use JSONB for flexible schema
- **Check Constraints**: Grade validation (1-5) and A-Factor range (1.1-2.5)
- **Composite Indexes**: Optimized multi-column queries for performance
- **Foreign Key Cascades**: Automatic cleanup of related records
- **Partial Indexes**: Targeted indexing for common query patterns
- **Materialized Views**: For heavy analytics queries (optional)
- **Table Partitioning**: Ready for high-volume review history

### Design Principles
1. **SM-15 First**: Every field serves the spaced repetition algorithm or user analytics
2. **Performance Optimized**: Indexes and queries designed for real-world usage patterns
3. **Analytics Ready**: Comprehensive tracking enables learning insights
4. **Data Integrity**: Strong constraints ensure data consistency
5. **Scalable Architecture**: Support for high-volume learning scenarios

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│     User    │──────▶│    Card     │──────▶│   Review    │
│             │ 1:N   │             │ 1:N   │             │
│ - id        │       │ - userId    │       │ - cardId    │
│ - email     │       │ - aFactor   │       │ - grade     │
│ - streak    │       │ - interval  │       │ - newInterval│
└─────────────┘       └─────────────┘       └─────────────┘
       │                                            │
       │ 1:N                                    N:1 │
       ▼                                            ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ UserStatistic│       │  OFMatrix   │       │   Review    │
│             │       │             │◀──────│             │
│ - userId    │       │ - userId    │       │ - userId    │
│ - date      │       │ - repNumber │       │ - reviewDate│
│ - accuracy  │       │ - optimal   │       │ - grade     │
└─────────────┘       └─────────────┘       └─────────────┘
```

## Table Structure and Critical Fields

### User
- Core user account information and performance metrics
- **Critical Fields**:
  - `sm15Parameters`: JSON field for personalized algorithm settings
  - `totalReviews`, `currentStreak`, `longestStreak`: Quick access performance metrics
  - `preferences`: JSON field for UI and study preferences

### Card
- Individual flashcards with SM-15 algorithm data
- **Critical Fields**:
  - `aFactor` (1.1-2.5): Represents card difficulty, higher means harder
  - `intervalDays`: Current spacing between reviews
  - `nextReviewDate`: When to show card next
  - `repetitionCount`: Number of reviews, used for OF Matrix lookups
  - `lapsesCount`: Failure tracking for interval calculations

### Review
- Individual review sessions and algorithm decisions
- **Critical Fields**:
  - `grade` (1-5): User performance rating
  - `responseTimeMs`: Time taken to recall
  - `previousInterval`, `newInterval`: Interval tracking
  - `aFactorBefore`, `aFactorAfter`: Difficulty adjustments

### OFMatrix
- Optimal factors matrix for interval calculations
- **Critical Fields**:
  - `repetitionNumber`: Matrix row (review number)
  - `difficultyCategory`: Matrix column (A-Factor range)
  - `optimalFactor`: Multiplier for interval calculation
  - `usageCount`: Times this entry was used

### UserStatistic
- Daily performance metrics and analytics
- **Critical Fields**:
  - `accuracyRate`: Percentage of grades 3+
  - `retentionRate`: Schedule adherence
  - `grade1Count` to `grade5Count`: Grade distribution
  - `studyTimeMinutes`: Daily engagement tracking

## Key Relationships

### User (1) → Cards (Many)
- Each user owns their private collection of flashcards
- Cascade delete: removing user removes all their cards
- No card sharing between users

### Card (1) → Reviews (Many)
- Each card has a complete review history
- Used for:
  - Learning progression tracking
  - Card difficulty analysis
  - SM-15 algorithm refinement

### User (1) → OFMatrix (Many)
- Personalized optimal factors matrix
- Unique constraint: (userId, repetitionNumber, difficultyCategory)
- Critical for interval calculations

## Performance Optimization

### Critical Indexes
```sql
-- Cards table
@@index([userId, nextReviewDate]) -- Due cards queries
@@index([userId, label])         -- Label filtering

-- Reviews table
@@index([cardId, reviewDate])    -- Card performance
@@index([userId, reviewDate])    -- User timeline

-- OFMatrix table
@@index([userId, repetitionNumber, difficultyCategory]) -- OF lookups

-- UserStatistic table
@@index([userId, date])          -- Performance charts
```

### Common Queries

```sql
-- Due cards for review
SELECT * FROM cards
WHERE user_id = ? AND next_review_date <= NOW()
ORDER BY next_review_date ASC;

-- User performance overview
SELECT accuracy_rate, retention_rate, cards_mastered
FROM user_statistics
WHERE user_id = ? AND date >= CURRENT_DATE - INTERVAL '30 days';

-- OF Matrix lookup for interval calculation
SELECT optimal_factor FROM of_matrix
WHERE user_id = ? 
  AND repetition_number = ? 
  AND difficulty_category = ?;
```

## Data Flow

### Review Process
1. User grades card (1-5)
2. SM-15 algorithm calculates new interval
3. Card schedule updated
4. Performance statistics aggregated
5. OF Matrix refined based on performance

### Transaction Example
```sql
BEGIN;
-- Create review record
INSERT INTO reviews (
  card_id, user_id, grade, response_time_ms,
  previous_interval, new_interval
) VALUES (...);

-- Update card scheduling
UPDATE cards SET
  a_factor = new_a_factor,
  interval_days = new_interval,
  next_review_date = CURRENT_DATE + INTERVAL 'new_interval days';

-- Update OF Matrix
INSERT INTO of_matrix ... 
ON CONFLICT DO UPDATE ...;

-- Update daily statistics
INSERT INTO user_statistics ...
ON CONFLICT DO UPDATE ...;
COMMIT;
```

## Data Integrity

### Foreign Key Constraints
- All child tables cascade on user deletion
- Reviews cascade on card deletion
- Unique constraints prevent duplicate statistics/matrix entries

### Validation
- Grade validation (1-5) handled at application level
- A-Factor range (1.1-2.5) enforced by application
- Date formats standardized (YYYY-MM-DD)

## Best Practices

1. **Atomic Operations**: All SM-15 updates must be in transactions
2. **Performance First**: Use provided indexes for critical queries
3. **Data Consistency**: Maintain referential integrity
4. **Analytics Ready**: Track all metrics for algorithm improvement
5. **Scalability**: Design supports growth to millions of cards

## PostgreSQL Performance Optimization

### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_card_schedule ON cards(user_id, next_review_date);
CREATE INDEX idx_review_analytics ON reviews(user_id, review_date);
CREATE INDEX idx_matrix_lookup ON of_matrix(user_id, repetition_number, difficulty_category);

-- Partial indexes for active cards
CREATE INDEX idx_active_cards 
ON cards(user_id, next_review_date) 
WHERE next_review_date <= CURRENT_TIMESTAMP;

-- Expression indexes for date operations
CREATE INDEX idx_review_date_trunc 
ON reviews((date_trunc('day', review_date)));
```

### Query Optimization

#### Using CTE for Complex Analytics
```sql
WITH user_daily_stats AS (
    SELECT 
        date_trunc('day', review_date) as review_day,
        COUNT(*) as reviews,
        AVG(grade::float) as avg_grade
    FROM reviews
    WHERE user_id = $1
    GROUP BY 1
)
SELECT 
    review_day,
    reviews,
    avg_grade,
    SUM(reviews) OVER (ORDER BY review_day) as cumulative_reviews
FROM user_daily_stats
ORDER BY review_day DESC;
```

#### Efficient Batch Operations
```sql
-- Batch update for card rescheduling
UPDATE cards 
SET next_review_date = next_review_date + 
    (interval_days || ' days')::interval
WHERE id = ANY($1::int[]);
```

## Dashboard Analytics Support

### Key Performance Metrics
```sql
-- User's learning progress overview
SELECT 
  u.current_streak,
  u.total_reviews,
  COUNT(c.id) as total_cards,
  COUNT(CASE WHEN c.next_review_date <= NOW() THEN 1 END) as due_cards,
  COALESCE(s.reviews_completed, 0) as today_reviews,
  COALESCE(s.accuracy_rate, 0) as recent_accuracy
FROM users u
LEFT JOIN cards c ON u.id = c.user_id
LEFT JOIN user_statistics s ON u.id = s.user_id 
  AND s.date = CURRENT_DATE
WHERE u.id = ?
GROUP BY u.id, s.reviews_completed, s.accuracy_rate;
```

### Retention Analysis
```sql
-- Learning streak calculation
SELECT date, reviews_completed 
FROM user_statistics 
WHERE user_id = ? AND reviews_completed > 0
ORDER BY date DESC;

-- Card mastery tracking
SELECT card_id, AVG(grade) as avg_grade, 
       COUNT(*) as review_count
FROM reviews 
GROUP BY card_id 
HAVING COUNT(*) > 5;
```

## Integration Points

### Backend Integration
- Services handle field validation and data consistency
- Transactions ensure atomic SM-15 updates
- Performance metrics collected automatically

### Frontend Integration
- Real-time dashboard updates
- Progress visualization
- Learning analytics

## PostgreSQL Management

### Database Maintenance
```sql
-- Regular VACUUM for performance
VACUUM ANALYZE cards;
VACUUM ANALYZE reviews;

-- Update statistics for query planner
ANALYZE cards;
ANALYZE reviews;

-- Monitor table bloat
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_all_tables
WHERE schemaname = 'public';
```

### Backup Strategy

#### Physical Backup (pg_basebackup)
```bash
pg_basebackup -D backup -Ft -z -P -U postgres
```

#### Logical Backup (pg_dump)
```bash
# Full database backup
pg_dump -Fc study_tool > backup.dump

# Schema-only backup
pg_dump -s study_tool > schema.sql

# Custom format with compression
pg_dump -Fc -Z9 study_tool > backup.fc
```

### Monitoring Queries
```sql
-- Active queries
SELECT pid, age(clock_timestamp(), query_start), usename, query
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%';

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_all_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table statistics
SELECT relname, n_live_tup, n_dead_tup, 
       last_vacuum, last_analyze
FROM pg_stat_all_tables
WHERE schemaname = 'public';
```

### High Availability Setup
- Primary/Standby replication using WAL
- Connection pooling with PgBouncer
- Regular VACUUM and maintenance windows
- Monitoring with pg_stat_statements
