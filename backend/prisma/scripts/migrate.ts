  import { Logger } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

  const prisma = new PrismaClient();

  async function main() {
    console.log('Starting database migration...');

    try {
      // This will run any pending migrations
      await prisma.$connect();
      Logger.log('Database connected successfully');
      Logger.log('Migration completed successfully');
    } catch (error) {
      Logger.error('Migration failed:', error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }

  main();