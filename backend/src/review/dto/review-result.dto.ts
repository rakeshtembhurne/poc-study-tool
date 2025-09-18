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

export class BasicStatsDto {
  @ApiProperty({ description: 'Total number of reviews completed' })
  totalReviews: number;

  @ApiProperty({ description: 'Reviews completed today' })
  todayReviews: number;

  @ApiProperty({ description: 'Average grade across all reviews' })
  averageGrade: number;

  @ApiProperty({ description: 'Number of cards currently being learned' })
  cardsLearning: number;
}
