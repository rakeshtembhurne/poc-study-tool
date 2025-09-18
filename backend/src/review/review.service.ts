import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SM15Service } from '../algorithm/sm15.service';
import { RecallMatrixService } from '../algorithm/services/recall-matrix.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import {
  DueCardsQueryDto,
  DueCardsResponseDto,
  DueCardDto,
} from './dto/due-cards.dto';
import { ReviewResultDto, BasicStatsDto } from './dto/review-result.dto';

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private sm15Service: SM15Service,
    private recallMatrixService: RecallMatrixService
  ) {}

  async getDueCards(
    userId: number,
    query: DueCardsQueryDto
  ): Promise<DueCardsResponseDto> {
    const { limit = 20, deckId } = query;
    const now = new Date();

    // Build where clause
    const whereClause: any = {
      userId,
      nextReviewDate: {
        lte: now,
      },
    };

    if (deckId) {
      whereClause.deckId = deckId;
    }

    // Get total count for pagination
    const totalDue = await this.prisma.card.count({
      where: whereClause,
    });

    // Get cards
    const cards = await this.prisma.card.findMany({
      where: whereClause,
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

    // Transform cards to DTOs
    const dueCards: DueCardDto[] = cards.map((card) => {
      const overdueMs = now.getTime() - card.nextReviewDate.getTime();
      const overdueHours = Math.max(
        0,
        Math.floor(overdueMs / (1000 * 60 * 60))
      );

      return {
        id: card.id,
        frontContent: card.frontContent,
        backContent: card.backContent,
        aFactor: card.aFactor,
        repetitionCount: card.repetitionCount,
        intervalDays: card.intervalDays,
        nextReviewDate: card.nextReviewDate,
        isOverdue: overdueMs > 0,
        overdueHours,
        deck: card.deck,
      };
    });

    return {
      cards: dueCards,
      totalDue,
      hasMore: totalDue > limit,
      algorithm: 'SM-15',
    };
  }

  async submitReview(
    userId: number,
    reviewData: SubmitReviewDto
  ): Promise<ReviewResultDto> {
    // Process review with SM-15 algorithm
    const algorithmResult = await this.sm15Service.processReview(
      {
        cardId: reviewData.cardId,
        grade: reviewData.grade,
        responseTime: reviewData.responseTimeMs,
        reviewedAt: reviewData.reviewedAt,
      },
      userId
    );

    // Get recall matrix update info
    const recallStats =
      await this.recallMatrixService.getRetentionStats(userId);

    return {
      success: true,
      algorithmResult: {
        previousAFactor: algorithmResult.performanceMetrics.previousAFactor,
        newAFactor: algorithmResult.newAFactor,
        previousInterval: algorithmResult.performanceMetrics.previousInterval,
        newInterval: algorithmResult.newInterval,
        nextReviewDate: algorithmResult.nextReviewDate,
        wasCorrect: algorithmResult.performanceMetrics.isCorrect,
        qualityResponse: reviewData.grade,
        ofMatrixUsed: {
          repetition: algorithmResult.performanceMetrics.previousInterval + 1,
          difficulty: Math.floor(
            ((algorithmResult.newAFactor - 1.1) / 1.4) * 14
          ),
          factor: algorithmResult.optimalFactorUsed,
        },
        memoryState: algorithmResult.memoryState,
        performanceMetrics: {
          intervalGrowthFactor:
            algorithmResult.performanceMetrics.intervalGrowthFactor,
          difficultyAdjustment:
            algorithmResult.performanceMetrics.difficultyAdjustment,
        },
      },
      recallMatrixUpdate: {
        totalReviews: recallStats.totalDataPoints,
        successfulReviews: Math.round(
          recallStats.overallRetentionRate * recallStats.totalDataPoints
        ),
        newRetentionRate: recallStats.overallRetentionRate,
      },
    };
  }

  async getBasicStats(userId: number): Promise<BasicStatsDto> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalReviews, todayReviews, averageGrade, cardsLearning] =
      await Promise.all([
        this.prisma.review.count({ where: { userId } }),
        this.prisma.review.count({
          where: {
            userId,
            reviewDate: { gte: startOfToday },
          },
        }),
        this.prisma.review.aggregate({
          where: { userId },
          _avg: { grade: true },
        }),
        this.getCardsInLearning(userId),
      ]);

    return {
      totalReviews,
      todayReviews,
      averageGrade: averageGrade._avg.grade || 0,
      cardsLearning,
    };
  }

  async getCardHistory(userId: number, cardId: number): Promise<any[]> {
    // Verify card ownership
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new Error(`Card with id ${cardId} not found for user ${userId}`);
    }

    return await this.prisma.review.findMany({
      where: { cardId, userId },
      orderBy: { reviewDate: 'desc' },
      take: 50, // Last 50 reviews
    });
  }

  private async getCardsInLearning(userId: number): Promise<number> {
    // Cards with repetition count < 5 are considered "learning"
    return await this.prisma.card.count({
      where: {
        userId,
        repetitionCount: { lt: 5 },
      },
    });
  }
}
