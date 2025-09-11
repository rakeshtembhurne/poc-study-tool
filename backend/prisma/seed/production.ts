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

 // 2. SEED DECKS
 Logger.log('Creating decks...');
 const decksData = loadTemplateData<DeckData>('decks.json', 'production');
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
 const cards = loadTemplateData<CardData>('cards.json', 'production');
 const createdCards = new Map<string, number>();
 
 for (const cardData of cards) {
   const userId = createdUsers.get(cardData.userEmail);
   if (!userId) {
     Logger.warn(`User ${cardData.userEmail} not found for card, skipping...`);
     continue;
   }
 
   // Lookup deck by title instead of numeric id
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
     Logger.warn(`Card "${cardData.frontContent}" creation failed:`, error);
   }
 }
 
 logSeedingProgress('cards', cards.length);


  // 4. SEED OF MATRIX
  Logger.log('Creating OF Matrix entries...');
  const ofMatrixEntries = loadTemplateData<OFMatrixData>(
    'ofmatrix.json',
    'production'
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
      Logger.warn(`Production OF Matrix creation failed:`, error);
    }
  }
  logSeedingProgress('production OF Matrix entries', ofMatrixEntries.length);

  Logger.log('✅ Production data seeded successfully!');
}