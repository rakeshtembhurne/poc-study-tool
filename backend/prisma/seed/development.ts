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
  deckId: number;
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

  // 1. SEED USERS
  Logger.log('Creating users...');
  const users = loadTemplateData<UserData>('users.json', 'development');
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
      Logger.warn(`User ${userData.email} already exists, using existing...`);
    }
  }
  logSeedingProgress('users', users.length);

  // 2. SEED DECKS
  Logger.log('Creating decks...');
  const decksData = loadTemplateData<DeckData>('decks.json', 'development');
  const createdDecks = new Map<string, number>(); // Map "userEmail-deckTitle" to deckId

  for (const deckData of decksData) {
    const userId = createdUsers.get(deckData.userEmail);
    if (!userId) {
      Logger.warn(`User ${deckData.userEmail} not found for deck, skipping...`);
      continue;
    }

    try {
      const deck = await prisma.deck.upsert({
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
      const deckKey = `${deckData.userEmail}-${deckData.title}`;
      createdDecks.set(deckKey, deck.id);
    } catch (error) {
      Logger.warn(`Deck "${deckData.title}" creation failed`);
    }
  }
  logSeedingProgress('decks', decksData.length);

  // 3. SEED CARDS
  Logger.log('Creating flashcards...');
  const cards = loadTemplateData<CardData>('cards.json', 'development');
  const createdCards = new Map<string, number>();

  for (const cardData of cards) {
    const userId = createdUsers.get(cardData.userEmail);
    if (!userId) {
      Logger.warn(`User ${cardData.userEmail} not found for card, skipping...`);
      continue;
    }

    const deckKey = `${cardData.userEmail}-${cardData.deckId}`;
    const deckId = createdDecks.get(deckKey);
    if (!deckId) {
      Logger.warn(
        `Deck "${cardData.deckId}" for user ${cardData.userEmail} not found, skipping card...`
      );
      continue;
    }

    try {
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + cardData.intervalDays);

      const card = await prisma.card.create({
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
    } catch (error) {
      Logger.warn(`Card "${cardData.frontContent}" creation failed:`, error);
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
      Logger.warn(`OF Matrix entry creation failed:`, error);
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
      Logger.warn(`Review creation failed:`, error);
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
    } catch {
      Logger.warn(`User statistic creation failed:`);
    }
  }
  logSeedingProgress('user statistics', userStats.length);

  Logger.log('✅ Development data seeded successfully!');
}