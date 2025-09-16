import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { loadTemplateData, logSeedingProgress } from './data-loader';

interface UserData {
  email: string;
  password: string;
}

interface CardData {
  userEmail: string;
  frontContent: string;
  backContent: string;
  deckTitle: string;
  aFactor: number;
  repetitionCount: number;
  intervalDays: number;
  lapsesCount: number;
  sourceType: string;
  reviewHistory: string;
}
interface DeckData {
  title: string;
  description: string;
  isPublic: boolean;
  userEmail: string; // Add this field to match other interfaces
}

interface ReviewData {
  cardFrontContent: string;
  userEmail: string;
  reviewDate: string;
  grade: number;
  responseTimeMs: number;
  previousInterval: number | null;
  newInterval: number;
  aFactorBefore: number;
  aFactorAfter: number;
  optimalFactorUsed: number;
}

interface OFMatrixData {
  userEmail: string;
  repetitionNumber: number;
  difficultyCategory: number;
  optimalFactor: number;
  usageCount: number;
}

interface UserStatisticData {
  userEmail: string;
  date: string;
  reviewsCompleted: number;
  newCardsLearned: number;
  studyTimeMinutes: number;
  averageResponseTimeMs: number;
  accuracyRate: number;
  retentionRate: number;
  cardsMastered: number;
  cardsStruggling: number;
  grade1Count: number;
  grade2Count: number;
  grade3Count: number;
  grade4Count: number;
  grade5Count: number;
}

export async function seedDevelopment(prisma: PrismaClient) {
  Logger.log('🌱 Seeding development data...');

  // VALIDATION: Load and validate all data first
  Logger.log('🔍 Validating seed data integrity...');
  const users = loadTemplateData<UserData>('users.json', 'development');
  const decksData = loadTemplateData<DeckData>('decks.json', 'development');
  const cards = loadTemplateData<CardData>('cards.json', 'development');

  // Validate user emails exist in users data
  const userEmails = new Set(users.map((u) => u.email));
  const deckUserEmails = decksData.map((d) => d.userEmail);
  const cardUserEmails = cards.map((c) => c.userEmail);

  // Check for missing users in deck data
  const missingDeckUsers = deckUserEmails.filter(
    (email) => !userEmails.has(email)
  );
  if (missingDeckUsers.length > 0) {
    throw new Error(
      `❌ Deck data references non-existent users: ${missingDeckUsers.join(', ')}`
    );
  }

  // Check for missing users in card data
  const missingCardUsers = cardUserEmails.filter(
    (email) => !userEmails.has(email)
  );
  if (missingCardUsers.length > 0) {
    throw new Error(
      `❌ Card data references non-existent users: ${missingCardUsers.join(', ')}`
    );
  }

  // Validate deck associations for cards
  const deckKeys = new Set(decksData.map((d) => `${d.userEmail}-${d.title}`));
  const cardDeckKeys = cards.map((c) => `${c.userEmail}-${c.deckTitle}`);
  const missingDecks = cardDeckKeys.filter((key) => !deckKeys.has(key));
  if (missingDecks.length > 0) {
    throw new Error(
      `❌ Card data references non-existent decks: ${missingDecks.join(', ')}`
    );
  }

  Logger.log('✅ Data validation passed');

  // 1. SEED USERS
  Logger.log('Creating users...');
  const createdUsers = new Map<string, number>();

  for (const userData of users) {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: userData.password,
        },
      });
      createdUsers.set(userData.email, user.id);
    } catch (error) {
      // User already exists, fetch ID
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (existingUser) {
        createdUsers.set(userData.email, existingUser.id);
      }
      Logger.warn(
        `User ${userData.email} already exists, using existing...`,
        error
      );
    }
  }
  logSeedingProgress('users', users.length);

  // 2. SEED DECKS
  Logger.log('Creating decks...');
  const createdDecks = new Map<string, number>();

  // Process decks in batches for better performance
  const validDecks = decksData.filter((deckData) => {
    const userId = createdUsers.get(deckData.userEmail);
    if (!userId) {
      Logger.warn(`User ${deckData.userEmail} not found for deck, skipping...`);
      return false;
    }
    return true;
  });

  // Use transaction for batch deck operations
  try {
    const createdDecksList = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const deckData of validDecks) {
        const userId = createdUsers.get(deckData.userEmail)!;

        const deck = await tx.deck.upsert({
          where: { userId_title: { userId, title: deckData.title } },
          update: {
            description: deckData.description,
            isPublic: deckData.isPublic,
          },
          create: {
            userId,
            title: deckData.title,
            description: deckData.description,
            isPublic: deckData.isPublic,
          },
        });

        results.push({ deckData, deck });
      }
      return results;
    });

    // Build deck lookup map from batch results
    for (const { deckData, deck } of createdDecksList) {
      const deckKey = `${deckData.userEmail}-${deckData.title}`;
      createdDecks.set(deckKey, deck.id);
    }
  } catch (error) {
    Logger.error(`❌ Batch deck creation failed`, error);
    throw error;
  }

  logSeedingProgress('decks', decksData.length);

  // 3. SEED CARDS
  Logger.log('Creating flashcards...');
  const createdCards = new Map<string, number>();

  // Process cards in batches with transaction safety
  for (const cardData of cards) {
    // Check if user exists
    const userId = createdUsers.get(cardData.userEmail);
    if (!userId) {
      Logger.warn(`Skipping card for missing user: ${cardData.userEmail}`);
      continue;
    }

    // Validate deck exists using proper relational lookup
    const deckKey = `${cardData.userEmail}-${cardData.deckTitle}`;
    const deckId = createdDecks.get(deckKey);

    if (!deckId) {
      Logger.error(
        `❌ Deck "${cardData.deckTitle}" not found for user ${cardData.userEmail}. Card creation failed: "${cardData.frontContent}"`
      );
      continue;
    }

    // Insert card with transaction safety
    try {
      await prisma.$transaction(async (tx) => {
        const nextReviewDate = new Date();
        nextReviewDate.setDate(
          nextReviewDate.getDate() + cardData.intervalDays
        );

        // Verify deck still exists in transaction
        const deckExists = await tx.deck.findUnique({
          where: { id: deckId },
          select: { id: true },
        });

        if (!deckExists) {
          throw new Error(`Deck with ID ${deckId} no longer exists`);
        }

        const card = await tx.card.create({
          data: {
            userId,
            deckId,
            frontContent: cardData.frontContent,
            backContent: cardData.backContent,
            aFactor: cardData.aFactor,
            repetitionCount: cardData.repetitionCount,
            intervalDays: cardData.intervalDays,
            lapsesCount: cardData.lapsesCount,
            sourceType: cardData.sourceType,
            reviewHistory: JSON.parse(cardData.reviewHistory),
            nextReviewDate,
          },
        });

        createdCards.set(cardData.frontContent, card.id);
      });
    } catch (error) {
      Logger.error(
        `❌ Card creation failed for user ${cardData.userEmail} in deck "${cardData.deckTitle}": "${cardData.frontContent}"`,
        error
      );
    }
  }

  logSeedingProgress('cards', cards.length);

  // 4. SEED OF MATRIX
  Logger.log('Creating OF Matrix entries...');
  const ofMatrixEntries = loadTemplateData<OFMatrixData>(
    'ofmatrix.json',
    'development'
  );

  for (const ofData of ofMatrixEntries) {
    const userId = createdUsers.get(ofData.userEmail);
    if (!userId) {
      Logger.warn(
        `User ${ofData.userEmail} not found for OF Matrix, skipping...`
      );
      continue;
    }

    try {
      await prisma.oFMatrix.upsert({
        where: {
          userId_repetitionNumber_difficultyCategory: {
            userId,
            repetitionNumber: ofData.repetitionNumber,
            difficultyCategory: ofData.difficultyCategory,
          },
        },
        update: {
          optimalFactor: ofData.optimalFactor,
          usageCount: ofData.usageCount,
        },
        create: {
          userId,
          repetitionNumber: ofData.repetitionNumber,
          difficultyCategory: ofData.difficultyCategory,
          optimalFactor: ofData.optimalFactor,
          usageCount: ofData.usageCount,
        },
      });
    } catch (error) {
      Logger.error(
        `❌ OF Matrix entry creation failed for user ${ofData.userEmail}: repetition ${ofData.repetitionNumber}, difficulty ${ofData.difficultyCategory}`,
        error
      );
    }
  }
  logSeedingProgress('OF Matrix entries', ofMatrixEntries.length);

  // 5. SEED REVIEWS
  Logger.log('Creating review history...');
  const reviews = loadTemplateData<ReviewData>('reviews.json', 'development');

  for (const reviewData of reviews) {
    const userId = createdUsers.get(reviewData.userEmail);
    const cardId = createdCards.get(reviewData.cardFrontContent);

    if (!userId || !cardId) {
      Logger.warn(`User or card not found for review, skipping...`);
      continue;
    }

    try {
      await prisma.review.create({
        data: {
          cardId,
          userId,
          reviewDate: new Date(reviewData.reviewDate),
          grade: reviewData.grade,
          responseTimeMs: reviewData.responseTimeMs,
          previousInterval: reviewData.previousInterval,
          newInterval: reviewData.newInterval,
          aFactorBefore: reviewData.aFactorBefore,
          aFactorAfter: reviewData.aFactorAfter,
          optimalFactorUsed: reviewData.optimalFactorUsed,
        },
      });
    } catch (error) {
      Logger.error(
        `❌ Review creation failed for user ${reviewData.userEmail}, card "${reviewData.cardFrontContent}" on ${reviewData.reviewDate}`,
        error
      );
    }
  }
  logSeedingProgress('reviews', reviews.length);

  // 6. SEED USER STATISTICS
  Logger.log('Creating user statistics...');
  const userStats = loadTemplateData<UserStatisticData>(
    'userstatistics.json',
    'development'
  );

  for (const statData of userStats) {
    const userId = createdUsers.get(statData.userEmail);
    if (!userId) {
      Logger.warn(
        `User ${statData.userEmail} not found for statistics, skipping...`
      );
      continue;
    }

    try {
      await prisma.userStatistic.upsert({
        where: {
          userId_date: {
            userId,
            date: new Date(statData.date),
          },
        },
        update: {
          reviewsCompleted: statData.reviewsCompleted,
          newCardsLearned: statData.newCardsLearned,
          studyTimeMinutes: statData.studyTimeMinutes,
          averageResponseTimeMs: statData.averageResponseTimeMs,
          accuracyRate: statData.accuracyRate,
          retentionRate: statData.retentionRate,
          cardsMastered: statData.cardsMastered,
          cardsStruggling: statData.cardsStruggling,
          grade1Count: statData.grade1Count,
          grade2Count: statData.grade2Count,
          grade3Count: statData.grade3Count,
          grade4Count: statData.grade4Count,
          grade5Count: statData.grade5Count,
        },
        create: {
          userId,
          date: new Date(statData.date),
          reviewsCompleted: statData.reviewsCompleted,
          newCardsLearned: statData.newCardsLearned,
          studyTimeMinutes: statData.studyTimeMinutes,
          averageResponseTimeMs: statData.averageResponseTimeMs,
          accuracyRate: statData.accuracyRate,
          retentionRate: statData.retentionRate,
          cardsMastered: statData.cardsMastered,
          cardsStruggling: statData.cardsStruggling,
          grade1Count: statData.grade1Count,
          grade2Count: statData.grade2Count,
          grade3Count: statData.grade3Count,
          grade4Count: statData.grade4Count,
          grade5Count: statData.grade5Count,
        },
      });
    } catch (error) {
      Logger.error(
        `❌ User statistic creation failed for user ${statData.userEmail} on date ${statData.date}`,
        error
      );
    }
  }
  logSeedingProgress('user statistics', userStats.length);

  Logger.log('✅ Development data seeded successfully!');
}
