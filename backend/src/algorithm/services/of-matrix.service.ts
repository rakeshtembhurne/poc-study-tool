import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_OF_MATRIX } from '../constants/default-matrices';
import { PerformanceData } from '../interfaces/of-matrix.interface';

@Injectable()
export class OFMatrixService {
  constructor(private prisma: PrismaService) {}

  async getOptimalFactor(
    repetitionNumber: number,
    difficultyCategory: number,
    userId: number
  ): Promise<number> {
    // Try to get user-specific OF value
    const userOF = await this.prisma.oFMatrix.findUnique({
      where: {
        userId_repetitionNumber_difficultyCategory: {
          userId,
          repetitionNumber,
          difficultyCategory,
        },
      },
    });

    if (userOF) {
      // Update usage count
      await this.incrementUsageCount(userOF.id);
      return userOF.optimalFactor;
    }

    // Fall back to conservative default values
    return this.getDefaultOptimalFactor(repetitionNumber, difficultyCategory);
  }

  private async incrementUsageCount(ofMatrixId: number): Promise<void> {
    await this.prisma.oFMatrix.update({
      where: { id: ofMatrixId },
      data: { usageCount: { increment: 1 } },
    });
  }

  async updateOptimalFactor(
    userId: number,
    repetitionNumber: number,
    difficultyCategory: number,
    performanceData: PerformanceData
  ): Promise<void> {
    // Calculate new optimal factor based on performance
    const newOF = this.calculateOptimalFactorFromPerformance(performanceData);

    await this.prisma.oFMatrix.upsert({
      where: {
        userId_repetitionNumber_difficultyCategory: {
          userId,
          repetitionNumber,
          difficultyCategory,
        },
      },
      update: {
        optimalFactor: newOF,
        lastUpdated: new Date(),
        usageCount: { increment: 1 },
      },
      create: {
        userId,
        repetitionNumber,
        difficultyCategory,
        optimalFactor: newOF,
        usageCount: 1,
      },
    });
  }

  private calculateOptimalFactorFromPerformance(
    performanceData: PerformanceData
  ): number {
    const { grade, retentionRate } = performanceData;

    // Base factor from grade
    let baseFactor = 1.0;
    switch (grade) {
      case 5:
        baseFactor = 2.5;
        break; // Perfect recall - very aggressive
      case 4:
        baseFactor = 2.0;
        break; // Easy recall - aggressive
      case 3:
        baseFactor = 1.6;
        break; // Good recall - moderate
      case 2:
        baseFactor = 1.2;
        break; // Hard recall - conservative
      case 1:
        baseFactor = 1.0;
        break; // Failed recall - reset
      default:
        baseFactor = 1.6;
        break;
    }

    // Adjust based on retention rate
    if (retentionRate > 0.95) {
      baseFactor *= 1.1; // Too easy, increase intervals
    } else if (retentionRate < 0.85) {
      baseFactor *= 0.9; // Too hard, decrease intervals
    }

    // Clamp to reasonable bounds
    return Math.max(1.0, Math.min(3.0, baseFactor));
  }

  private getDefaultOptimalFactor(
    repetitionNumber: number,
    difficultyCategory: number
  ): number {
    // Default OF matrix values for A-Factor range 1.1-2.5 (15 categories)
    const clampedRepetition = Math.min(Math.max(1, repetitionNumber), 10);
    const clampedCategory = Math.min(Math.max(0, difficultyCategory), 14);

    return DEFAULT_OF_MATRIX[clampedRepetition]?.[clampedCategory] || 2.0;
  }

  async adjustOptimalFactor(
    userId: number,
    repetitionNumber: number,
    difficultyCategory: number,
    adjustment: number
  ): Promise<void> {
    const currentOF = await this.getOptimalFactor(
      repetitionNumber,
      difficultyCategory,
      userId
    );
    const newOF = Math.max(1.0, Math.min(5.0, currentOF + adjustment));

    await this.prisma.oFMatrix.upsert({
      where: {
        userId_repetitionNumber_difficultyCategory: {
          userId,
          repetitionNumber,
          difficultyCategory,
        },
      },
      update: {
        optimalFactor: newOF,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        repetitionNumber,
        difficultyCategory,
        optimalFactor: newOF,
        usageCount: 0,
      },
    });
  }

  async getUserOFMatrixStats(userId: number): Promise<{
    totalEntries: number;
    averageOptimalFactor: number;
    personalizedEntries: number;
    defaultEntries: number;
  }> {
    const entries = await this.prisma.oFMatrix.findMany({
      where: { userId },
    });

    const totalEntries = entries.length;
    const averageOptimalFactor =
      entries.length > 0
        ? entries.reduce((sum, entry) => sum + entry.optimalFactor, 0) /
          entries.length
        : 2.0;

    const personalizedEntries = entries.filter(
      (entry) => entry.usageCount > 0
    ).length;
    const defaultEntries = totalEntries - personalizedEntries;

    return {
      totalEntries,
      averageOptimalFactor,
      personalizedEntries,
      defaultEntries,
    };
  }

  async initializeDefaultOFMatrix(userId: number): Promise<void> {
    const existingEntries = await this.prisma.oFMatrix.count({
      where: { userId },
    });

    // Only initialize if no entries exist
    if (existingEntries === 0) {
      const entriesToCreate = [];

      for (let rep = 1; rep <= 10; rep++) {
        for (let diff = 0; diff < 15; diff++) {
          entriesToCreate.push({
            userId,
            repetitionNumber: rep,
            difficultyCategory: diff,
            optimalFactor: this.getDefaultOptimalFactor(rep, diff),
            usageCount: 0,
          });
        }
      }

      await this.prisma.oFMatrix.createMany({
        data: entriesToCreate,
        skipDuplicates: true,
      });
    }
  }
}
