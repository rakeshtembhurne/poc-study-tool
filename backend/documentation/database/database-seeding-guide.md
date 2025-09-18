# Database Seeding Guide

## Overview

This guide explains how to use the database seeding system to populate your Space Rep database with test data. Perfect for new developers, this system automatically creates realistic flashcards, user reviews, and analytics data to help you develop and test features.

## What is Database Seeding?

Database seeding is the process of filling your database with sample data. Think of it like setting up a demo account with realistic content - you get users, flashcards, review history, and statistics without manually creating everything.

### Why Do We Need Seeding?

- **Development**: Test your code with realistic data
- **Testing**: Run automated tests with predictable data
- **Demos**: Show the app working with meaningful content
- **Onboarding**: New developers can quickly see how the app works

## Quick Start

### 1. Prerequisites

Before you start, make sure you have:

```bash
# Check if Node.js is installed
node --version  # Should be v22+

# Check if Docker is running (for database)
docker --version
```

### 2. Start Your Database

```bash
# Start PostgreSQL in Docker
docker compose up -d

# Wait a few seconds for database to start
sleep 5
```

### 3. Run Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Apply database migrations (creates tables)
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

🎉 **That's it!** Your database now has sample users, flashcards, reviews, and statistics.

## What Gets Created?

### Development Environment (Default)

When you run `npm run db:seed`, you get:

#### 👥 **4 Sample Users**

- `admin@example.com` - Admin user with varied content
- `user1@example.com` - Active learner with Spanish and Math cards
- `user2@example.com` - Literature enthusiast
- `demo@example.com` - Programming learner

#### 📚 **8 Flashcards** with Different Subjects

- **Geography**: "What is the capital of France?"
- **Math**: "What is 15 × 7?", "Area of a circle formula"
- **Spanish**: "How to say 'hello'", "Conjugate 'ser'"
- **Literature**: "Who wrote Romeo and Juliet?"
- **Biology**: "What is photosynthesis?"
- **Programming**: "What does HTML stand for?"

#### 📊 **Learning Progress Data**

- **18 Review Sessions** showing learning progression
- **14 Algorithm Optimization** entries (OF Matrix)
- **12 Retention Tracking** entries (SM-15 Recall Matrix)
- **17 Daily Statistics** with performance metrics

#### 🧠 **SM-15 Algorithm Data**

- **OF Matrix**: Personalized optimal factors for different difficulty/repetition combinations
- **Recall Matrix**: Tracks actual retention rates to validate algorithm performance
- **A-Factor Range**: Cards with difficulty factors from 1.1 (hardest) to 2.5 (easiest)
- **Retention Tracking**: Real performance data used to optimize scheduling

## Understanding the Data Structure

### How Tables Connect

```
👤 Users
    ↓
📚 Cards (flashcards belonging to users)
    ↓
📝 Reviews (performance history for each card)
    ↓
📈 Statistics (daily learning analytics)

🧮 OF Matrix (SM-15 optimal factors)
    ↓
📊 Recall Matrix (SM-15 retention tracking)
```

### Sample Learning Journey

Here's how the data tells a story:

1. **New Card**: User creates "What is 15 × 7?" (A-Factor 2.5, easy difficulty)
2. **First Review**: User struggles (Grade 2), A-Factor drops to 2.1, interval = 1 day
3. **Second Review**: Improves (Grade 4), A-Factor rises to 2.2, interval = 3 days
4. **SM-15 Learning**: OF Matrix tracks optimal factors for this difficulty/repetition
5. **Retention Tracking**: Recall Matrix records actual vs expected retention rates
6. **Algorithm Optimization**: System adjusts OF Matrix based on real performance data

## Different Environments

### Development (Rich Data)

```bash
npm run db:seed  # Default
```

- Multiple users with varied learning histories
- Different subjects and difficulty levels
- Realistic review patterns and statistics

### Test (Minimal, Predictable)

```bash
NODE_ENV=test npm run db:seed
```

- Single test user
- Simple, predictable flashcards
- Perfect for automated testing

### Production (Welcome Content Only)

```bash
NODE_ENV=production npm run db:seed
```

- System admin account
- Welcome flashcard explaining spaced repetition
- Baseline algorithm data

## Available Commands

### Core Commands

```bash
# Seed with sample data
npm run db:seed

# Apply database changes
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Reset everything (DANGER: deletes all data)
npm run db:reset
```

### Advanced Commands

```bash
# Seed specific environment
NODE_ENV=test npm run db:seed
NODE_ENV=production npm run db:seed

# Check database status
npx prisma studio  # Visual database browser
```

## Troubleshooting

### Common Issues

#### 1. "Can't reach database server"

```bash
# Solution: Start your database
docker compose up -d
sleep 5  # Wait for startup
npm run db:migrate
```

#### 2. "User already exists" warnings

```bash
# This is normal! The system detects existing users
# and reuses them instead of creating duplicates
```

#### 3. "Migration failed"

```bash
# Solution: Reset and start fresh
npm run db:reset --force
npm run db:migrate
npm run db:seed
```

#### 4. Port conflicts (5432 vs 5434)

Check your `.env` file matches `docker-compose.yml`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/study_tool
```

### Getting Help

1. Check the logs for specific error messages
2. Verify your `.env` file has correct database URLs
3. Ensure Docker container is running: `docker ps`
4. Look at the generated data: `npx prisma studio`

## How the Seeding System Works

### File Structure

```
prisma/
├── data/                     # JSON data files
│   ├── users.json           # User accounts
│   ├── cards.json           # Flashcard content
│   ├── reviews.json         # Review history
│   ├── ofmatrix.json        # Algorithm data
│   └── userstatistics.json  # Daily analytics
├── seed/                     # Seeding logic
│   ├── index.ts            # Main entry point
│   ├── development.ts      # Development seeding
│   ├── test.ts             # Test seeding
│   ├── production.ts       # Production seeding
│   └── data-loader.ts      # Helper functions
└── scripts/                  # Database scripts
    ├── migrate.ts
    ├── reset.ts
    └── rollback.ts
```

### Seeding Process

1. **Load Environment**: Detects development/test/production
2. **Create Users**: Sets up user accounts with passwords
3. **Create Cards**: Builds flashcards linked to users
4. **Generate OF Matrix**: Creates algorithm optimization data
5. **Add Reviews**: Populates learning history
6. **Calculate Statistics**: Builds daily analytics from reviews

### Data Relationships

All data is carefully linked:

- Cards belong to specific users
- Reviews reference both cards and users
- Statistics are calculated from review performance
- OF Matrix optimizes scheduling based on user behavior

## Customizing Seed Data

### Adding New Users

Edit `prisma/data/users.json`:

```json
{
  "development": [
    {
      "email": "newuser@example.com",
      "password": "Pass@1234"
    }
  ]
}
```

### Adding New Cards

Edit `prisma/data/cards.json`:

```json
{
  "development": [
    {
      "userEmail": "newuser@example.com",
      "frontContent": "Your question here",
      "backContent": "Your answer here",
      "deck": "Subject",
      "aFactor": 2.5,
      "repetitionCount": 0,
      "intervalDays": 1,
      "lapsesCount": 0,
      "sourceType": "manual",
      "reviewHistory": "[]"
    }
  ]
}
```

### Important Notes

- Always link cards to existing users via `userEmail`
- Reviews must reference existing cards via `cardFrontContent`
- Keep `aFactor` between 1.1-2.5 (difficulty rating)
- Use realistic `responseTimeMs` (1000-15000 milliseconds)

## Best Practices for Developers

### When to Reseed

1. **After schema changes**: `npm run db:reset && npm run db:migrate && npm run db:seed`
2. **Before feature development**: Fresh data helps catch edge cases
3. **Before testing**: Ensure consistent test environment
4. **When onboarding**: New developers get working data immediately

### Seeding Strategies

**Development**: Rich, diverse data

- Multiple user types
- Various subjects and difficulties
- Long learning histories
- Edge cases and corner cases

**Testing**: Minimal, predictable data

- Single user for consistency
- Simple, known flashcards
- Predictable review patterns
- Easy to verify in tests

**Production**: Essential data only

- System accounts
- Welcome content
- Baseline algorithm settings
- No personal information

### Working with Seeded Data

```typescript
// In your tests, reference seeded data
const testUser = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});

const testCard = await prisma.card.findFirst({
  where: {
    frontContent: 'Test question: 2 + 2 = ?',
  },
});
```

## Advanced Topics

### Performance Considerations

The seeding system is optimized for:

- **Fast Development**: Seeds quickly for rapid iteration
- **Relationship Integrity**: All foreign keys properly linked
- **Realistic Data**: Actual learning progression patterns
- **Error Handling**: Graceful handling of duplicate data

### Data Patterns

The seeded data follows realistic patterns:

- **Learning Curves**: Cards get easier over time
- **Forgetting Curves**: Some cards need more repetition
- **Individual Differences**: Users have different learning speeds
- **Subject Variety**: Math, languages, sciences represented

### Algorithm Testing

Seeded data includes:

- **Various A-Factors**: Different card difficulties
- **Review Histories**: Realistic grade progressions
- **OF Matrix Entries**: Algorithm optimization data
- **Statistical Trends**: Performance improvements over time

## Next Steps

After seeding your database:

1. **Explore the data**: Open `npx prisma studio` to see what was created
2. **Test features**: Use the sample users to test authentication
3. **Review cards**: See how the spaced repetition system works
4. **Check analytics**: Examine the statistics and progress tracking
5. **Start developing**: Build features with realistic data

## Summary

The database seeding system provides:

- ✅ **Quick Setup**: One command gets you realistic data
- ✅ **Multiple Environments**: Development, testing, production
- ✅ **Realistic Data**: Actual learning progression patterns
- ✅ **Proper Relationships**: All data properly linked
- ✅ **Error Handling**: Graceful handling of edge cases
- ✅ **Beginner Friendly**: Clear commands and documentation

Now you're ready to develop and test Space Rep features with confidence! 🚀
