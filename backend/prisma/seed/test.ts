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
  deckTitle: String;
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

export async function seedTest(prisma: PrismaClient) {
  Logger.log('🧪 Seeding test data...');

  // 1. SEED TEST USERS
  const users = loadTemplateData<UserData>('users.json', 'test');
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
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      if (existingUser) {
        createdUsers.set(userData.email, existingUser.id);
      }
      Logger.warn(
        `Test user ${userData.email} already exists, using existing...`
      );
    }
  }
  logSeedingProgress('test users', users.length);

  // 2. SEED DECKS
  Logger.log('Creating decks...');
  const decksData = loadTemplateData<DeckData>('decks.json', 'test');
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
      Logger.warn(`Deck "${deckData.title}" creation failed`, error);
    }
  }

  logSeedingProgress('decks', decksData.length);

  // 3. SEED CARDS
  Logger.log('Creating flashcards...');
  const cards = loadTemplateData<CardData>('cards.json', 'test');
  const createdCards = new Map<string, number>();

  for (const cardData of cards) {
    const userId = createdUsers.get(cardData.userEmail);
    if (!userId) {
      Logger.warn(`User ${cardData.userEmail} not found for card, skipping...`);
      continue;
    }

    //  Lookup deck by title instead of numeric id
    const deckKey = `${cardData.userEmail}-${cardData.deckTitle}`;
    const deckId = createdDecks.get(deckKey);
    if (!deckId) {
      Logger.warn(
        `Deck "${cardData.deckTitle}" for user ${cardData.userEmail} not found, skipping card...`
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
      Logger.warn(`Test card creation failed:`, error);
    }
  }
  logSeedingProgress('test cards', cards.length);

  // 3. SEED TEST OF MATRIX
  const ofMatrixEntries = loadTemplateData<OFMatrixData>('ofmatrix.json', 'test');
  for (const ofData of ofMatrixEntries) {
    const userId = createdUsers.get(ofData.userEmail);
    if (!userId) continue;

    try {
      await prisma.oFMatrix.create({
        data: {
          userId,
          repetitionNumber: ofData.repetitionNumber,
          difficultyCategory: ofData.difficultyCategory,
          optimalFactor: ofData.optimalFactor,
          usageCount: ofData.usageCount,
        },
      });
    } catch (error) {
      Logger.warn(`Test OF Matrix creation failed:`, error);
    }
  }
  logSeedingProgress('test OF Matrix entries', ofMatrixEntries.length);

  // 4. SEED TEST REVIEWS
  const reviews = loadTemplateData<ReviewData>('reviews.json', 'test');
  for (const reviewData of reviews) {
    const userId = createdUsers.get(reviewData.userEmail);
    const cardId = createdCards.get(reviewData.cardFrontContent);
    if (!userId || !cardId) continue;

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
      Logger.warn(`Test review creation failed:`, error);
    }
  }
  logSeedingProgress('test reviews', reviews.length);

  // 5. SEED TEST USER STATISTICS
  const userStats = loadTemplateData<UserStatisticData>('userstatistics.json', 'test');
  for (const statData of userStats) {
    const userId = createdUsers.get(statData.userEmail);
    if (!userId) continue;

    try {
      await prisma.userStatistic.create({
        data: {
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
      Logger.warn(`Test user statistic creation failed:`, error);
    }
  }
  logSeedingProgress('test user statistics', userStats.length);

  Logger.log('✅ Test data seeded successfully!');
}