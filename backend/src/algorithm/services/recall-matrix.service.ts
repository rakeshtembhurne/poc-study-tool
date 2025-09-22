import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecallMatrixService {
  constructor(private prisma: PrismaService) {}

  async updateRecallData(
    userId: number,
    actualInterval: number,
    difficultyCategory: number,
    wasSuccessful: boolean
  ): Promise<void> {
    await this.prisma.recallMatrix.upsert({
      where: {
        userId_intervalDays_difficultyCategory: {
          userId,
          intervalDays: actualInterval,
          difficultyCategory,
        },
      },
      update: {
        totalReviews: { increment: 1 },
        successfulReviews: { increment: wasSuccessful ? 1 : 0 },
        lastUpdated: new Date(),
      },
      create: {
        userId,
        intervalDays: actualInterval,
        difficultyCategory,
        totalReviews: 1,
        successfulReviews: wasSuccessful ? 1 : 0,
        retentionRate: wasSuccessful ? 1.0 : 0.0,
      },
    });

    // Update retention rate after upsert
    await this.updateRetentionRate(userId, actualInterval, difficultyCategory);
  }

  private async updateRetentionRate(
    userId: number,
    intervalDays: number,
    difficultyCategory: number
  ): Promise<void> {
    const entry = await this.prisma.recallMatrix.findUnique({
      where: {
        userId_intervalDays_difficultyCategory: {
          userId,
          intervalDays,
          difficultyCategory,
        },
      },
    });

    if (entry && entry.totalReviews > 0) {
      const newRetentionRate = entry.successfulReviews / entry.totalReviews;
      await this.prisma.recallMatrix.update({
        where: { id: entry.id },
        data: { retentionRate: newRetentionRate },
      });
    }
  }

  async getRetentionRate(
    userId: number,
    intervalDays: number,
    difficultyCategory: number
  ): Promise<number> {
    const entry = await this.prisma.recallMatrix.findUnique({
      where: {
        userId_intervalDays_difficultyCategory: {
          userId,
          intervalDays,
          difficultyCategory,
        },
      },
    });

    // Return actual retention rate or default target (90%)
    return entry?.retentionRate || 0.9;
  }

  async shouldAdjustOFMatrix(
    userId: number,
    intervalDays: number,
    difficultyCategory: number
  ): Promise<{ shouldAdjust: boolean; suggestedChange: number }> {
    const retentionRate = await this.getRetentionRate(
      userId,
      intervalDays,
      difficultyCategory
    );
    const targetRate = 0.9; // 90% target
    const tolerance = 0.05; // ±5% tolerance

    if (retentionRate < targetRate - tolerance) {
      // Too aggressive - reduce intervals
      return { shouldAdjust: true, suggestedChange: -0.1 };
    } else if (retentionRate > targetRate + tolerance) {
      // Too conservative - increase intervals
      return { shouldAdjust: true, suggestedChange: +0.1 };
    }

    return { shouldAdjust: false, suggestedChange: 0 };
  }

  async getRetentionStats(userId: number): Promise<{
    overallRetentionRate: number;
    totalDataPoints: number;
    bestPerformingIntervals: Array<{
      intervalDays: number;
      retentionRate: number;
    }>;
    worstPerformingIntervals: Array<{
      intervalDays: number;
      retentionRate: number;
    }>;
  }> {
    const entries = await this.prisma.recallMatrix.findMany({
      where: { userId },
      orderBy: { retentionRate: 'desc' },
    });

    if (entries.length === 0) {
      return {
        overallRetentionRate: 0.9,
        totalDataPoints: 0,
        bestPerformingIntervals: [],
        worstPerformingIntervals: [],
      };
    }

    const totalSuccessful = entries.reduce(
      (sum: number, entry) => sum + entry.successfulReviews,
      0
    );
    const totalReviews = entries.reduce(
      (sum: number, entry) => sum + entry.totalReviews,
      0
    );
    const overallRetentionRate =
      totalReviews > 0 ? totalSuccessful / totalReviews : 0.9;

    const bestPerforming = entries
      .filter((entry) => entry.totalReviews >= 5) // Only include intervals with enough data
      .slice(0, 5)
      .map((entry) => ({
        intervalDays: entry.intervalDays,
        retentionRate: entry.retentionRate,
      }));

    const worstPerforming = entries
      .filter((entry) => entry.totalReviews >= 5)
      .slice(-5)
      .reverse()
      .map((entry) => ({
        intervalDays: entry.intervalDays,
        retentionRate: entry.retentionRate,
      }));

    return {
      overallRetentionRate,
      totalDataPoints: entries.length,
      bestPerformingIntervals: bestPerforming,
      worstPerformingIntervals: worstPerforming,
    };
  }
}
