export interface ReviewSubmissionDto {
  cardId: number;
  grade: number; // 1-5 scale
  responseTime?: number; // milliseconds
  reviewedAt?: Date;
}

export interface AlgorithmResult {
  newAFactor: number;
  newInterval: number;
  nextReviewDate: Date;
  optimalFactorUsed: number;
  memoryState?: MemoryState;
  performanceMetrics: PerformanceMetrics;
  retentionRate: number;
}

export interface MemoryState {
  stability: number;
  retrievability: number;
  forgettingCurve: number;
}

export interface PerformanceMetrics {
  previousAFactor: number;
  previousInterval: number;
  intervalGrowthFactor: number;
  difficultyAdjustment: number;
  isCorrect: boolean;
}
