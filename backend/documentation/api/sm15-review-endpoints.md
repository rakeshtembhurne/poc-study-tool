# SM-15 Review API Endpoints

## Overview

The SM-15 Review API provides endpoints for implementing the SuperMemo 15 spaced repetition algorithm with advanced features like Recall Matrix tracking and personalized OF Matrix optimization.

## Base URL

```
http://localhost:3000/api/review
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### GET /due

Get cards due for review using SM-15 scheduling algorithm.

**Query Parameters:**

- `limit` (optional): Number of cards to return (default: 20, max: 100)
- `deckId` (optional): Filter by specific deck ID

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "cards": [
      {
        "id": 1,
        "frontContent": "What is the capital of France?",
        "backContent": "Paris",
        "aFactor": 1.8,
        "repetitionCount": 3,
        "intervalDays": 7,
        "nextReviewDate": "2024-01-15T10:00:00Z",
        "isOverdue": false,
        "overdueHours": 0,
        "deck": {
          "title": "Geography"
        }
      }
    ],
    "totalDue": 25,
    "hasMore": true,
    "algorithm": "SM-15"
  }
}
```

### POST /submit

Submit a review and trigger the SM-15 algorithm to calculate the next review date.

**Request Body:**

```json
{
  "cardId": 1,
  "grade": 4,
  "responseTimeMs": 3500,
  "reviewedAt": "2024-01-15T10:30:00Z"
}
```

**Grade Scale:**

- `0`: Complete blackout (total failure)
- `1`: Complete failure
- `2`: Poor recall (hard)
- `3`: Moderate recall (pass threshold)
- `4`: Good recall (easy)
- `5`: Perfect recall

**Response:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Request successful",
  "data": {
    "success": true,
    "algorithmResult": {
      "previousAFactor": 1.8,
      "newAFactor": 1.9,
      "previousInterval": 7,
      "newInterval": 12,
      "nextReviewDate": "2024-01-27T10:30:00Z",
      "wasCorrect": true,
      "qualityResponse": 4,
      "ofMatrixUsed": {
        "repetition": 4,
        "difficulty": 8,
        "factor": 1.85
      },
      "memoryState": {
        "stability": 15.6,
        "retrievability": 0.89,
        "forgettingCurve": 0.92
      },
      "performanceMetrics": {
        "intervalGrowthFactor": 1.71,
        "difficultyAdjustment": 1.0
      }
    },
    "recallMatrixUpdate": {
      "totalReviews": 145,
      "successfulReviews": 127,
      "newRetentionRate": 0.876
    }
  }
}
```

### GET /stats

Get comprehensive review statistics and SM-15 metrics for the authenticated user.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "totalReviews": 1247,
    "todayReviews": 23,
    "averageGrade": 3.8,
    "cardsLearning": 45,
    "sm15Metrics": {
      "averageAFactor": 4.2,
      "retentionRate": 0.87,
      "matrixOptimizations": 67,
      "personalizedFactors": 78.5,
      "currentStreak": 15,
      "avgIntervalGrowth": 1.85
    },
    "learningProgress": {
      "newCards": 12,
      "learningCards": 33,
      "matureCards": 156,
      "dueToday": 18,
      "overdueCards": 3
    }
  }
}
```

### GET /history/:cardId

Get the review history for a specific card.

**Path Parameters:**

- `cardId`: ID of the card to get history for

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": [
    {
      "id": 123,
      "grade": 4,
      "reviewDate": "2024-01-15T10:30:00Z",
      "previousInterval": 7,
      "newInterval": 12,
      "aFactorBefore": 1.8,
      "aFactorAfter": 1.9,
      "optimalFactorUsed": 1.85,
      "responseTimeMs": 3500
    }
  ]
}
```

## SM-15 Algorithm Features

### A-Factor System

- **Range**: 1.2 (hardest) to 6.9 (easiest)
- **Updates**: Based on review performance using weighted averages
- **Personalization**: Each card develops its own difficulty rating

### OF Matrix (Optimal Factors)

- **Dimensions**: 20 repetition levels × 20 difficulty categories (400 entries per user)
- **Personalization**: User-specific optimization over time
- **Fallback**: Conservative default values for new combinations

### Recall Matrix

- **Purpose**: Tracks actual retention rates vs. predictions
- **Feedback Loop**: Adjusts OF Matrix when retention deviates from 90% target
- **Validation**: Ensures algorithm accuracy over time

### Multi-User Support

Each user gets:

- ✅ **Isolated card due dates**
- ✅ **Personal OF Matrix development**
- ✅ **Individual Recall Matrix tracking**
- ✅ **Concurrent study sessions**

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "grade",
      "message": "Grade must be between 1 and 5"
    }
  ]
}
```

Common HTTP status codes:

- `200`: Success
- `201`: Created (for review submissions)
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (card not found)
- `500`: Internal Server Error

## Integration Examples

### Frontend Review Session

```typescript
// Get due cards
const dueCards = await fetch('/api/review/due?limit=20', {
  headers: { Authorization: `Bearer ${token}` },
});

// Submit review
const result = await fetch('/api/review/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    cardId: 1,
    grade: 4,
    responseTimeMs: 3500,
  }),
});

// Check algorithm result
const { algorithmResult } = await result.json();
console.log(`Next review in ${algorithmResult.newInterval} days`);
```

### Performance Monitoring

```typescript
// Get user statistics
const stats = await fetch('/api/review/stats', {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await stats.json();
console.log(`Retention rate: ${data.data.sm15Metrics.retentionRate * 100}%`);
console.log(`Study streak: ${data.data.sm15Metrics.currentStreak} days`);

// Monitor algorithm performance
const history = await fetch('/api/review/history/123', {
  headers: { Authorization: `Bearer ${token}` },
});
const historyData = await history.json();
const intervals = historyData.data.map((review) => review.newInterval);
console.log('Interval progression:', intervals);
```

## Performance Considerations

- **Response Time**: < 200ms for review submissions
- **Concurrency**: Supports multiple users simultaneously
- **Caching**: OF Matrix entries cached for performance
- **Database**: Optimized indexes for due card queries

## Testing

Use the provided seed data to test the endpoints:

```bash
# Seed development data (includes SM-15 matrices)
npm run db:seed

# Test due cards endpoint
curl "http://localhost:3000/api/review/due?limit=5" \
  -H "Authorization: Bearer <your-jwt-token>"

# Test review submission
curl -X POST "http://localhost:3000/api/review/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"cardId": 1, "grade": 4, "responseTimeMs": 3500}'
```

## Related Documentation

- 🧮 [SM-15 Algorithm Implementation](../algorithm/SM15_IMPLEMENTATION.md) - Complete algorithm documentation with examples
- 📖 [Database Schema Documentation](../database/database-docs.md) - SM-15 database structure and relationships
- 🌱 [Database Seeding Guide](../database/database-seeding-guide.md) - Test data setup for API testing
- 🏠 [Backend Overview](../../README.md) - Main backend documentation and setup
- 🎨 [Frontend Integration](../../../frontend/README.md) - Frontend API integration guide

```

```
