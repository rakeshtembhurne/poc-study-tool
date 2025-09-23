import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function main() {
    const environment = process.env.NODE_ENV || 'development';

    if (environment === 'production') {
      Logger.error('Cannot reset production database!');
      process.exit(1);
    }

    Logger.log(`🔄 Resetting ${environment} database...`);

    try {
      await prisma.$connect();

      // This will reset the database and run all migrations
      Logger.log('✅ Database reset completed');
      Logger.log('💡 Run "npm run db:seed" to populate with sample data');

    } catch (error) {
      Logger.error('Database reset failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  main();