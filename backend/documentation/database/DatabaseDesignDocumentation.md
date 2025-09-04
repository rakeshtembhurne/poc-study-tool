# Database Design Documentation

Complete database architecture for the SM-15 spaced repetition application, including Prisma schema, field explanations, relationships, and performance optimization.

## 📊 Database Overview

The database is designed to support the SM-15 algorithm with:

- **PostgreSQL**: Robust relational database with JSON support
- **Prisma ORM**: Type-safe database client with migrations
- **Performance Optimization**: Strategic indexes for critical queries
- **Data Integrity**: Foreign keys, constraints, and validation
- **Analytics Support**: Comprehensive performance tracking

## 📁 Documentation Files

### Core Database Files

- [**Prisma Schema**](./prisma-schema.prisma) - Complete Prisma schema file ready to use
- [**Field Explanations**](./field-explanations.md) - Detailed field importance to SM-15 algorithm
- [**Relationships**](./relationships.md) - Table relationships and data flow diagrams

### Performance & Operations

- [**Performance Optimization**](./performance-optimization.md) - Indexes, queries, and optimization strategies
- [**Sample Queries**](./sample-queries.md) - Common database queries and patterns

## 🗃️ Table Structure

### Core Tables

| Table             | Purpose                         | Key Fields                                                |
| ----------------- | ------------------------------- | --------------------------------------------------------- |
| **User**          | User accounts and summary stats | `id`, `email`, `currentStreak`, `totalReviews`            |
| **Card**          | Flashcards with SM-15 data      | `aFactor`, `intervalDays`, `nextReviewDate`               |
| **Review**        | Individual review sessions      | `grade`, `responseTimeMs`, `newInterval`                  |
| **OFMatrix**      | Optimal factors matrix          | `repetitionNumber`, `difficultyCategory`, `optimalFactor` |
| **UserStatistic** | Daily performance metrics       | `date`, `accuracyRate`, `gradeDistribution`               |

## 🧠 SM-15 Critical Fields

### A-Factor System

- **Range**: 1.1 to 2.5 (stored as DECIMAL(3,2))
- **Purpose**: Represents intrinsic card difficulty
- **Updates**: Weighted average after each review
- **Impact**: Directly drives interval calculations

### Interval Management

- **intervalDays**: Current spacing between reviews
- **nextReviewDate**: When to show card next (core scheduling)
- **repetitionCount**: Number of times reviewed (OF Matrix row)
- **lapsesCount**: Failure tracking for first interval calculation

### Performance Analytics

- **responseTimeMs**: Cognitive load measurement
- **accuracyRate**: Algorithm effectiveness validation
- **gradeDistribution**: Learning pattern analysis (grades 1-5)
- **retentionRate**: User adherence to schedule

## 🔄 Data Flow Overview

### Review Process

```
1. User grades card (1-5) →
2. Algorithm calculates new interval →
3. Card schedule updated →
4. Performance statistics aggregated →
5. OF Matrix refined based on actual performance
```

### Key Relationships

```
User (1:Many) Cards → Reviews → Statistics
                ↓
           OFMatrix (personalized for each user)
```

## 🚀 Getting Started

### 1. **Start with Schema**

Review the [Prisma Schema](../../prisma/schema.prisma) to understand the complete data structure.

### 2. **Understand Field Purpose**

Read [Field Explanations](./FieldExplanation.md) to see how each field supports the SM-15 algorithm.

### 3. **Study Relationships**

Check [Relationships](./Relationships.md) for data flow and foreign key relationships.

## 🔍 Quick Reference

### Essential Queries

```sql
-- Due cards for review
SELECT * FROM cards
WHERE user_id = ? AND next_review_date <= NOW()
ORDER BY next_review_date ASC;

-- User performance overview
SELECT accuracy_rate, retention_rate, cards_mastered
FROM user_statistics
WHERE user_id = ? AND date >= CURRENT_DATE - INTERVAL '30 days';

-- OF Matrix lookup
SELECT optimal_factor FROM of_matrix
WHERE user_id = ? AND repetition_number = ? AND difficulty_category = ?;
```

### Critical Indexes

- `cards(user_id, next_review_date)` - Due cards dashboard
- `reviews(user_id, review_date DESC)` - User activity timeline
- `of_matrix(user_id, repetition_number, difficulty_category)` - Algorithm lookups

## 💡 Design Principles

### 1. **SM-15 First**

Every field serves the spaced repetition algorithm or user analytics.

### 2. **Performance Optimized**

Indexes designed for real-world query patterns and dashboard needs.

### 3. **Analytics Ready**

Comprehensive tracking enables learning insights and algorithm improvement.

### 4. **Data Integrity**

Foreign keys, constraints, and validation ensure data consistency.

### 5. **Scalable Architecture**

Design supports growth from hundreds to millions of cards per user.

## 🔗 Integration Points

### Backend Integration

- [Backend Implementation](../../README.md) - How services use these tables
- [SM-15 Algorithm](../sm15-algorithm/README.md) - Mathematical foundation

### Frontend Integration

- [Frontend Implementation](../../../frontend/README.md) - How UI displays this data
- [Performance Analytics](../../../frontend/README.md#analytics) - Dashboard queries

---

**📘 Ready to explore?** Start with the [Prisma Schema](./prisma-schema.prisma) to see the complete database structure, then dive into [Field Explanations](./field-explanations.md) to understand how each field supports the SM-15 algorithm.
