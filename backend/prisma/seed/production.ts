import { Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';
import { loadTemplateData, logSeedingProgress } from './data-loader';

interface UserData {
  email: string;
  password: string;
}

interface CardData {
  userEmail: string;
  frontContent: string;
  backContent: string;
  deck: string;
  aFactor: number;
  repetitionCount: number;
  intervalDays: number;
  lapsesCount: number;
  sourceType: string;
  reviewHistory: string;
}

interface OFMatrixData {
  userEmail: string;
  repetitionNumber: number;
  difficultyCategory: number;
  optimalFactor: number;
  usageCount: number;
}

export async function seedProduction(prisma: PrismaClient) {
  Logger.log('🌅 Seeding production data...');

  // 1. SEED PRODUCTION USERS (minimal)
  const users = loadTemplateData<UserData>('users.json', 'production');
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
        where: { email: userData.email }
      });
      if (existingUser) {
        createdUsers.set(userData.email, existingUser.id);
      }
      Logger.warn(`Production user ${userData.email} already exists, using existing...`);
    }
  }
  logSeedingProgress('production users', users.length);

  // 2. SEED WELCOME CARDS (minimal)
  const cards = loadTemplateData<CardData>('cards.json', 'production');
  for (const cardData of cards) {
    const userId = createdUsers.get(cardData.userEmail);
    if (!userId) continue;

    try {
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + cardData.intervalDays);

      await prisma.card.create({
        data: {
          userId,
          frontContent: cardData.frontContent,
          backContent: cardData.backContent,
          deck: cardData.deck,
          aFactor: cardData.aFactor,
          repetitionCount: cardData.repetitionCount,
          intervalDays: cardData.intervalDays,
          lapsesCount: cardData.lapsesCount,
          sourceType: cardData.sourceType,
          reviewHistory: JSON.parse(cardData.reviewHistory),
          nextReviewDate,
        },
      });
    } catch (error) {
      Logger.warn(`Production card creation failed:`, error);
    }
  }
  logSeedingProgress('production cards', cards.length);

  // 3. SEED BASELINE OF MATRIX (for algorithm)
  const ofMatrixEntries = loadTemplateData<OFMatrixData>('ofmatrix.json', 'production');
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
      Logger.warn(`Production OF Matrix creation failed:`, error);
    }
  }
  logSeedingProgress('production OF Matrix entries', ofMatrixEntries.length);

  Logger.log('✅ Production data seeded successfully!');
}