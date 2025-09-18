import { ApiProperty } from '@nestjs/swagger';

export class AlgorithmResultDto {
  @ApiProperty({ description: 'Previous A-Factor value' })
  previousAFactor: number;

  @ApiProperty({ description: 'New A-Factor value' })
  newAFactor: number;

  @ApiProperty({ description: 'Previous interval in days' })
  previousInterval: number;

  @ApiProperty({ description: 'New interval in days' })
  newInterval: number;

  @ApiProperty({ description: 'Next review date' })
  nextReviewDate: Date;

  @ApiProperty({ description: 'Whether the review was correct (grade >= 3)' })
  wasCorrect: boolean;

  @ApiProperty({ description: 'Quality of response (same as grade)' })
  qualityResponse: number;

  @ApiProperty({ description: 'OF Matrix entry used' })
  ofMatrixUsed: {
    repetition: number;
    difficulty: number;
    factor: number;
  };

  @ApiProperty({ description: 'Memory model state' })
  memoryState?: {
    stability: number;
    retrievability: number;
    forgettingCurve: number;
  };

  @ApiProperty({ description: 'Performance metrics' })
  performanceMetrics: {
    intervalGrowthFactor: number;
    difficultyAdjustment: number;
  };
}

export class RecallMatrixUpdateDto {
  @ApiProperty({
    description: 'Total reviews for this interval/difficulty combination',
  })
  totalReviews: number;

  @ApiProperty({ description: 'Successful reviews (grade >= 3)' })
  successfulReviews: number;

  @ApiProperty({ description: 'New retention rate (0.0-1.0)' })
  newRetentionRate: number;
}

export class ReviewResultDto {
  @ApiProperty({ description: 'Whether the review was processed successfully' })
  success: boolean;

  @ApiProperty({ description: 'Results from the SM-15 algorithm' })
  algorithmResult: AlgorithmResultDto;

  @ApiProperty({ description: 'Recall matrix update information' })
  recallMatrixUpdate: RecallMatrixUpdateDto;
}

export class SM15MetricsDto {
  @ApiProperty({ description: 'Average A-Factor across all cards' })
  averageAFactor: number;

  @ApiProperty({
    description: 'Overall retention rate (successful reviews / total reviews)',
  })
  retentionRate: number;

  @ApiProperty({ description: 'Number of OF Matrix personalizations made' })
  matrixOptimizations: number;

  @ApiProperty({
    description: 'Percentage of cards using personalized factors',
  })
  personalizedFactors: number;

  @ApiProperty({ description: 'Current study streak (consecutive days)' })
  currentStreak: number;

  @ApiProperty({ description: 'Average interval growth rate' })
  avgIntervalGrowth: number;
}

export class LearningProgressDto {
  @ApiProperty({ description: 'New cards (repetition count 0)' })
  newCards: number;

  @ApiProperty({ description: 'Learning cards (repetition count 1-4)' })
  learningCards: number;

  @ApiProperty({ description: 'Mature cards (repetition count 5+)' })
  matureCards: number;

  @ApiProperty({ description: 'Cards due for review today' })
  dueToday: number;

  @ApiProperty({ description: 'Overdue cards' })
  overdueCards: number;
}

export class BasicStatsDto {
  @ApiProperty({ description: 'Total number of reviews completed' })
  totalReviews: number;

  @ApiProperty({ description: 'Reviews completed today' })
  todayReviews: number;

  @ApiProperty({ description: 'Average grade across all reviews' })
  averageGrade: number;

  @ApiProperty({ description: 'Number of cards currently being learned' })
  cardsLearning: number;

  @ApiProperty({ description: 'SM-15 algorithm specific metrics' })
  sm15Metrics: SM15MetricsDto;

  @ApiProperty({ description: 'Learning progress breakdown' })
  learningProgress: LearningProgressDto;
}
