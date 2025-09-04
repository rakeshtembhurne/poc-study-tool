# Database Field Explanations

Detailed explanations of every database field and its critical role in the SM-15 spaced repetition algorithm.

## 🧠 SM-15 Algorithm Critical Fields

These fields are the mathematical backbone of the spaced repetition system. Understanding their purpose is essential for implementation.

### Card Model - SM-15 Core Fields

#### `aFactor` (A-Factor / Absolute Difficulty)
**Type**: `Float` (DECIMAL 3,2) **Range**: 1.1 to 2.5 **Default**: 2.5

**Purpose**: Represents the intrinsic difficulty of a specific card for a specific user.
- **1.1**: Very easy card (user consistently recalls perfectly)
- **2.5**: Very hard card (user frequently struggles or fails)

**SM-15 Integration**:
```typescript
// A-Factor directly affects interval calculation
newInterval = previousInterval × OptimalFactor[repetitionCount, aFactor]

// Example: Easy card (aFactor = 1.3) gets longer intervals
// Hard card (aFactor = 2.4) gets shorter intervals
```

**Updates**: Recalculated after each review using weighted average:
```typescript
newAF = (oldAF × weightOld + estimatedAF × weightNew) / totalWeight
```

**Database Impact**: Indexed for OF Matrix lookups, critical for scheduling performance.

#### `repetitionCount` (Review Number)
**Type**: `Int` **Range**: 0 to ∞ **Default**: 0

**Purpose**: Tracks how many times this card has been reviewed (not including failures).

**SM-15 Integration**:
- **Row selector** for OF Matrix: `OptimalFactor[repetitionCount, difficultyCategory]`
- **Growth pattern controller**: New cards (0) vs mature cards (10+) have different intervals
- **Algorithm milestone**: Certain repetition numbers trigger different behaviors

**Real-World Impact**:
```typescript
// repetitionCount = 0: New card, use first interval formula
// repetitionCount = 1-3: Learning phase, conservative growth  
// repetitionCount = 4+: Mature card, exponential growth allowed
```

**Database Considerations**: Never decreases, only increments. Essential for OF Matrix queries.

#### `intervalDays` (Current Spacing)
**Type**: `Int` **Range**: 1 to 5475 (15 years) **Default**: 1

**Purpose**: Current number of days between reviews - the direct output of SM-15 calculations.

**SM-15 Integration**:
- **Input** to next calculation: `newInterval = currentInterval × optimalFactor`
- **Performance metric**: Tracks learning progress (growing intervals = mastery)
- **Algorithm validation**: Intervals should generally grow with successful reviews

**Behavioral Patterns**:
```typescript
// Successful learning: 1 → 3 → 7 → 15 → 35 → 80 days
// Struggling: 1 → 2 → 1 → 3 → 2 → 4 days (oscillating)
// Mastered: 30 → 60 → 120 → 240 days (stable growth)
```

**Database Impact**: Used for scheduling calculations, should be indexed with `nextReviewDate`.

#### `nextReviewDate` (Scheduling Engine)
**Type**: `DateTime` **Default**: now()

**Purpose**: When this card should next appear in the user's review queue.

**Critical Importance**:
- **Core scheduling field**: Drives the entire application's review system
- **User experience**: Determines what users see and when
- **Algorithm effectiveness**: Must be precisely calculated for optimal retention

**Calculation**:
```typescript
nextReviewDate = lastReviewDate + intervalDays
// Always in UTC to avoid timezone issues
```

**Database Performance**: 
- **Most queried field**: Every dashboard load queries due cards
- **Requires composite index**: `(userId, nextReviewDate)` for optimal performance
- **Date arithmetic**: Must handle time zones correctly

#### `lapsesCount` (Failure Tracking)  
**Type**: `Int` **Range**: 0 to ∞ **Default**: 0

**Purpose**: Counts how many times the user has failed this card (grades 1-2).

**SM-15 Integration**:
- **First interval formula**: `I(1) = OptimalFactor[1, lapsesCount + 1]`
- **Difficulty indicator**: Cards with many lapses are inherently harder
- **Learning insights**: Identifies cards needing different study approaches

**Behavioral Impact**:
```typescript
// No lapses (lapsesCount = 0): Standard difficulty progression
// Few lapses (lapsesCount = 1-2): Slightly more cautious intervals
// Many lapses (lapsesCount = 5+): Very conservative, frequent review
```

**Never Resets**: Accumulated over the card's entire lifetime for difficulty assessment.

#### `lastReviewedAt` (Timing Analysis)
**Type**: `DateTime?` **Default**: null

**Purpose**: Timestamp of the most recent review - enables forgetting curve analysis.

**SM-15 Integration**:
- **Forgetting curve**: `R = exp(-timeSinceReview/stability)`
- **Timing deviations**: Early/late reviews affect algorithm confidence
- **Performance analysis**: Actual vs predicted memory decay

**Analytics Uses**:
```typescript
// Calculate actual memory decay
timeSinceReview = now - lastReviewedAt
expectedRecall = Math.exp(-timeSinceReview / memoryStability)

// Adjust future intervals based on timing accuracy
```

### Card Model - Metadata Fields

#### `reviewHistory` (Learning Analytics)
**Type**: `Json` **Default**: [] (empty array)

**Purpose**: Complete timeline of this card's performance for analysis.

**Structure**:
```typescript
interface ReviewHistoryEntry {
  date: string;
  grade: number;
  interval: number;
  responseTime: number;
  aFactorBefore: number;
  aFactorAfter: number;
}
```

**Uses**:
- **Progress visualization**: Show learning curve over time
- **Algorithm debugging**: Identify why certain cards aren't progressing  
- **User insights**: Help users understand their learning patterns

#### `sourceType` (Performance Analysis)
**Type**: `String` **Default**: "manual"

**Values**: "manual", "ai_generated", "imported"

**Purpose**: Enables analysis of learning effectiveness by content source.

**Analytics Applications**:
- AI-generated cards vs manually created performance comparison
- Import source effectiveness (textbook, website, etc.)
- Content recommendation engine inputs

#### `ofMatrixUpdates` (Algorithm Debugging)
**Type**: `Json` **Default**: {} (empty object)

**Purpose**: Tracks how this specific card influenced the OF Matrix optimization.

**Structure**:
```typescript
interface OFMatrixUpdate {
  date: string;
  repetitionNumber: number;
  difficultyCategory: number;
  oldOptimalFactor: number;
  newOptimalFactor: number;
  performanceImpact: number;
}
```

**Uses**:
- **Algorithm debugging**: Why did certain OF values change?
- **Performance analysis**: Which cards drive matrix evolution?
- **Research**: Understanding algorithm learning patterns

## 📊 Performance Tracking Fields

### Review Model - Algorithm Tracking

#### `previousInterval` / `newInterval`
**Type**: `Int?` / `Int`

**Purpose**: Captures the algorithm's interval decision-making process.

**Analysis Applications**:
```typescript
// Interval effectiveness analysis
if (grade >= 3 && newInterval > previousInterval) {
  // Successful interval growth
} else if (grade <= 2 && newInterval < previousInterval) {
  // Appropriate interval reduction
}
```

#### `aFactorBefore` / `aFactorAfter`  
**Type**: `Float?` / `Float`

**Purpose**: Shows how user performance influenced difficulty perception.

**Learning Insights**:
```typescript
const difficultyChange = aFactorAfter - aFactorBefore;
if (difficultyChange > 0.1) {
  // Card became much harder - user struggling
} else if (difficultyChange < -0.1) {
  // Card became much easier - user improving
}
```

#### `optimalFactorUsed`
**Type**: `Float?`

**Purpose**: Links each review to the specific OF Matrix value used.

**Algorithm Validation**:
- **Matrix evolution tracking**: How OF values change over time
- **Performance correlation**: Which optimal factors produce best results
- **Debugging tool**: Identify problematic matrix entries

#### `responseTimeMs` (Cognitive Load)
**Type**: `Int?` **Units**: Milliseconds

**Purpose**: Measures cognitive effort required for recall.

**SM-15 Integration**:
```typescript
// Response time influences difficulty perception
if (responseTimeMs > 5000 && grade >= 3) {
  // Correct but slow = increase difficulty slightly
} else if (responseTimeMs < 1000 && grade === 5) {
  // Perfect and fast = decrease difficulty more
}
```

**Performance Insights**:
- **< 2000ms**: Automatic recall (well-learned)
- **2-5000ms**: Effortful but successful recall  
- **> 5000ms**: Struggling, even if ultimately correct

### UserStatistic Model - Daily Analytics

#### `accuracyRate` (Algorithm Effectiveness)
**Type**: `Float` **Range**: 0.0 to 1.0

**Purpose**: Percentage of reviews graded 3+ (successful recalls).

**Target Range**: 0.85-0.95 (85-95% accuracy)

**Algorithm Feedback**:
```typescript
if (accuracyRate < 0.8) {
  // Intervals too long - algorithm too aggressive
} else if (accuracyRate > 0.95) {
  // Intervals too short - algorithm too conservative  
}
```

#### `retentionRate` (Schedule Adherence)
**Type**: `Float` **Range**: 0.0 to 1.0

**Purpose**: Percentage of due cards actually reviewed.

**Behavioral Insights**:
- **> 0.9**: Excellent adherence to schedule
- **0.7-0.9**: Good consistency with occasional missed days
- **< 0.7**: Poor schedule adherence, affects algorithm accuracy

#### `cardsMastered` / `cardsStruggling`
**Type**: `Int`

**Purpose**: Learning progress indicators.

**Definitions**:
- **Mastered**: Cards with intervals >30 days (long-term retention)
- **Struggling**: Cards with multiple recent lapses (need attention)

**Progress Tracking**:
```typescript
const masteryRate = cardsMastered / totalCards;
const strugglingRate = cardsStruggling / totalCards;

// Healthy learning: masteryRate increasing, strugglingRate stable/decreasing
```

#### `grade1Count` through `grade5Count`
**Type**: `Int`

**Purpose**: Daily distribution of review grades.

**Algorithm Calibration**:
```typescript
// Optimal grade distribution (bell curve centered on grade 3-4)
const idealDistribution = {
  grade1: 0.05,  // 5% failures
  grade2: 0.15,  // 15% hard recalls  
  grade3: 0.30,  // 30% good recalls
  grade4: 0.35,  // 35% easy recalls
  grade5: 0.15   // 15% perfect recalls
};
```

**Performance Indicators**:
- **Too many grade 1s**: Intervals too long
- **Too many grade 5s**: Intervals too short  
- **Balanced distribution**: Algorithm well-tuned

## 🏗️ System Architecture Fields

### User Model - Performance Summary

#### `totalReviews` / `currentStreak` / `longestStreak`
**Purpose**: Gamification and motivation metrics.

**User Engagement**:
- **totalReviews**: Lifetime learning achievement
- **currentStreak**: Daily study consistency  
- **longestStreak**: Peak performance record

#### `sm15Parameters` / `preferences`
**Type**: `Json`

**Purpose**: User-specific customization and algorithm tuning.

**SM-15 Parameters**:
```typescript
interface SM15Parameters {
  requestedForgettingIndex: number;  // Target retention rate
  matrixAdaptationRate: number;      // How quickly OF Matrix evolves
  responseTimeWeighting: number;     // Response time impact on difficulty
}
```

**UI Preferences**:
```typescript
interface Preferences {
  cardDisplaySettings: object;
  studyReminders: object;
  difficultyPreferences: object;
}
```

---

**🔗 Related Documentation**:
- [Prisma Schema](./prisma-schema.prisma) - Complete database structure
- [Relationships](./relationships.md) - How tables connect and data flows
- [Performance Optimization](./performance-optimization.md) - Indexing and query strategies