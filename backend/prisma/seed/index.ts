  import { PrismaClient } from '../../generated/prisma';
  import { seedDevelopment } from './development';
  import { seedTest } from './test';
  import { seedProduction } from './production';
import { Logger } from '@nestjs/common';

  const prisma = new PrismaClient();

  async function main() {
    const environment = process.env.NODE_ENV || 'development';

    Logger.log(`🌱 Starting seed process for ${environment} 
  environment...`);

    try {
      await prisma.$connect();

      switch (environment) {
        case 'production':
          await seedProduction(prisma);
          break;
        case 'test':
          await seedTest(prisma);
          break;
        default:
          await seedDevelopment(prisma);
          break;
      }

      Logger.log('Seeding completed successfully');
    } catch (error) {
      Logger.error('Seeding failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  main();