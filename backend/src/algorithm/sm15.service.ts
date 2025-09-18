import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OFMatrixService } from './services/of-matrix.service';
import { RecallMatrixService } from './services/recall-matrix.service';
import {
  ReviewSubmissionDto,
  AlgorithmResult,
  PerformanceMetrics,
  MemoryState,
} from './interfaces/card-review.interface';
import { CardWithHistory, Grade } from './types/sm15.types';
import { SM15_CONSTANTS } from './constants/sm15.constants';
import { aFactorToDifficultyCategory } from './constants/default-matrices';

@Injectable()
export class SM15Service {
  constructor(
    private prisma: PrismaService,
    private ofMatrixService: OFMatrixService,
    private recallMatrixService: RecallMatrixService
  ) {}

  async processReview(
    reviewData: ReviewSubmissionDto,
    userId: number
  ): Promise<AlgorithmResult> {
    // Enhanced SM-15 algorithm with Recall Matrix integration
    const { cardId, grade: rawGrade, responseTime } = reviewData;
    const grade = rawGrade as Grade;

    // 1. Validate input
    this.validateGrade(grade);

    // 2. Get current card state
    const card = await this.getCardWithHistory(cardId, userId);
    const actualInterval = this.calculateActualInterval(card.lastReviewedAt);
    const difficultyCategory = aFactorToDifficultyCategory(card.aFactor);

    // 3. Update Recall Matrix with actual performance
    await this.recallMatrixService.updateRecallData(
      userId,
      actualInterval,
      difficultyCategory,
      grade >= 3 // Successful if grade 3+
    );

    // 4. Check if OF Matrix needs adjustment based on retention rate
    const adjustment = await this.recallMatrixService.shouldAdjustOFMatrix(
      userId,
      actualInterval,
      difficultyCategory
    );

    if (adjustment.shouldAdjust) {
      await this.ofMatrixService.adjustOptimalFactor(
        userId,
        card.repetitionCount,
        difficultyCategory,
        adjustment.suggestedChange
      );
    }

    // 5. Calculate new A-Factor
    const newAFactor = this.calculateNewAFactor(card, grade);

    // 6. Get OF Matrix value
    const optimalFactor = await this.ofMatrixService.getOptimalFactor(
      card.repetitionCount + 1,
      aFactorToDifficultyCategory(newAFactor),
      userId
    );

    // 7. Calculate new interval
    const newInterval = this.calculateNewInterval(
      card.intervalDays,
      card.repetitionCount + 1,
      optimalFactor,
      grade
    );

    // 8. Update memory model
    const memoryState = this.updateMemoryModel(card, grade, newInterval);

    // 9. Calculate next review date
    const nextReviewDate = this.calculateNextReviewDate(newInterval);

    // 10. Update card in database
    await this.updateCard(cardId, {
      aFactor: newAFactor,
      repetitionCount: card.repetitionCount + 1,
      intervalDays: newInterval,
      nextReviewDate,
      lastReviewedAt: reviewData.reviewedAt || new Date(),
      lapsesCount: grade < 3 ? card.lapsesCount + 1 : card.lapsesCount,
    });

    // 11. Create review record
    await this.createReviewRecord({
      cardId,
      userId,
      grade,
      responseTimeMs: responseTime,
      previousInterval: card.intervalDays,
      newInterval,
      aFactorBefore: card.aFactor,
      aFactorAfter: newAFactor,
      optimalFactorUsed: optimalFactor,
    });

    // 12. Return enhanced algorithm result
    return {
      newAFactor,
      newInterval,
      nextReviewDate,
      optimalFactorUsed: optimalFactor,
      memoryState,
      performanceMetrics: this.calculatePerformanceMetrics(
        card,
        grade,
        newInterval
      ),
      retentionRate: await this.recallMatrixService.getRetentionRate(
        userId,
        actualInterval,
        difficultyCategory
      ),
    };
  }

  private validateGrade(grade: number): void {
    if (
      grade < SM15_CONSTANTS.GRADE_SCALE.MIN ||
      grade > SM15_CONSTANTS.GRADE_SCALE.MAX
    ) {
      throw new Error(
        `Grade must be between ${SM15_CONSTANTS.GRADE_SCALE.MIN} and ${SM15_CONSTANTS.GRADE_SCALE.MAX}`
      );
    }
  }

  private async getCardWithHistory(
    cardId: number,
    userId: number
  ): Promise<CardWithHistory> {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
      include: {
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 10, // Last 10 reviews for analysis
        },
      },
    });

    if (!card) {
      throw new Error(`Card with id ${cardId} not found for user ${userId}`);
    }

    return card as CardWithHistory;
  }

  private calculateActualInterval(lastReviewedAt: Date | null): number {
    if (!lastReviewedAt) {
      return 0; // First review
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastReviewedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private calculateNewAFactor(card: CardWithHistory, grade: Grade): number {
    // SM-15 A-Factor update formula implementation
    const currentAF = card.aFactor;
    const estimatedAF = this.estimateAFactorFromGrade(grade);

    // Weighted average calculation
    const weightOld = Math.min(card.repetitionCount, 10);
    const weightNew = 1;

    const newAF =
      (currentAF * weightOld + estimatedAF * weightNew) /
      (weightOld + weightNew);

    return this.clampAFactor(newAF);
  }

  private estimateAFactorFromGrade(grade: Grade): number {
    // Map grade to estimated A-Factor (1.2-6.9 range)
    switch (grade) {
      case 5:
        return 6.9; // Perfect recall - easiest
      case 4:
        return 5.5; // Good recall - easy
      case 3:
        return 4.0; // Pass threshold - moderate
      case 2:
        return 2.5; // Poor recall - hard
      case 1:
        return 1.5; // Failed recall - harder
      case 0:
        return 1.2; // Complete blackout - hardest
      default:
        return 4.0; // Default to middle value
    }
  }

  private calculateNewInterval(
    previousInterval: number,
    repetitionNumber: number,
    optimalFactor: number,
    grade: Grade
  ): number {
    if (grade < 3) {
      // Reset to daily review for failed cards
      return 1;
    }

    if (repetitionNumber === 1) {
      return Math.max(1, Math.round(optimalFactor));
    }

    const newInterval = Math.round(previousInterval * optimalFactor);
    return this.clampInterval(newInterval);
  }

  private updateMemoryModel(
    card: CardWithHistory,
    grade: Grade,
    newInterval: number
  ): MemoryState {
    // Simple memory model implementation
    const baseStability = newInterval;
    const stabilityGrowthFactor = this.getStabilityGrowthFactor(grade);
    const stability = baseStability * stabilityGrowthFactor;

    const timeSinceReview = this.calculateActualInterval(card.lastReviewedAt);
    const retrievability = Math.exp(-timeSinceReview / stability);

    const forgettingCurve = this.calculateForgettingCurve(
      stability,
      newInterval
    );

    return {
      stability,
      retrievability,
      forgettingCurve,
    };
  }

  private getStabilityGrowthFactor(grade: Grade): number {
    switch (grade) {
      case 5:
        return 1.3;
      case 4:
        return 1.2;
      case 3:
        return 1.0;
      case 2:
        return 0.8;
      case 1:
        return 0.6;
      default:
        return 1.0;
    }
  }

  private calculateForgettingCurve(
    stability: number,
    timePoint: number
  ): number {
    // P(recall) = exp(-(t × ln(2)) / half_life)
    const halfLife = stability * 0.693; // ln(2)
    return Math.exp(-(timePoint * Math.log(2)) / halfLife);
  }

  private calculateNextReviewDate(intervalDays: number): Date {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }

  private calculatePerformanceMetrics(
    card: CardWithHistory,
    grade: Grade,
    newInterval: number
  ): PerformanceMetrics {
    const previousInterval = card.intervalDays;
    const intervalGrowthFactor =
      previousInterval > 0 ? newInterval / previousInterval : 1;
    const difficultyAdjustment = grade - 3; // How much easier/harder than expected

    return {
      previousAFactor: card.aFactor,
      previousInterval,
      intervalGrowthFactor,
      difficultyAdjustment,
      isCorrect: grade >= 3,
    };
  }

  private clampAFactor(value: number): number {
    return Math.max(
      SM15_CONSTANTS.A_FACTOR.MIN,
      Math.min(SM15_CONSTANTS.A_FACTOR.MAX, value)
    );
  }

  private clampInterval(value: number): number {
    return Math.max(
      SM15_CONSTANTS.INTERVALS.MIN_DAYS,
      Math.min(SM15_CONSTANTS.INTERVALS.MAX_DAYS, value)
    );
  }

  private async updateCard(
    cardId: number,
    updates: {
      aFactor: number;
      repetitionCount: number;
      intervalDays: number;
      nextReviewDate: Date;
      lastReviewedAt: Date;
      lapsesCount: number;
    }
  ): Promise<void> {
    await this.prisma.card.update({
      where: { id: cardId },
      data: updates,
    });
  }

  private async createReviewRecord(data: {
    cardId: number;
    userId: number;
    grade: number;
    responseTimeMs?: number;
    previousInterval: number;
    newInterval: number;
    aFactorBefore: number;
    aFactorAfter: number;
    optimalFactorUsed: number;
  }): Promise<void> {
    await this.prisma.review.create({
      data: {
        cardId: data.cardId,
        userId: data.userId,
        grade: data.grade,
        responseTimeMs: data.responseTimeMs,
        previousInterval: data.previousInterval,
        newInterval: data.newInterval,
        aFactorBefore: data.aFactorBefore,
        aFactorAfter: data.aFactorAfter,
        optimalFactorUsed: data.optimalFactorUsed,
      },
    });
  }

  // Utility method to get due cards
  async getDueCards(userId: number, limit: number = 20): Promise<any[]> {
    const now = new Date();

    return await this.prisma.card.findMany({
      where: {
        userId,
        nextReviewDate: {
          lte: now,
        },
      },
      orderBy: [
        { nextReviewDate: 'asc' }, // Overdue cards first
        { aFactor: 'desc' }, // Harder cards first within same due time
      ],
      take: limit,
      include: {
        deck: {
          select: { title: true },
        },
      },
    });
  }
}
