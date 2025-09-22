export type Grade = 0 | 1 | 2 | 3 | 4 | 5;

export type AFactor = number; // 1.2 - 6.9

export type DifficultyCategory = number; // 0 - 19

export type IntervalDays = number; // 1 - 5475

export interface CardWithHistory {
  id: number;
  userId: number;
  aFactor: number;
  repetitionCount: number;
  intervalDays: number;
  lastReviewedAt: Date | null;
  nextReviewDate: Date;
  lapsesCount: number;
  reviews: ReviewHistory[];
}

export interface ReviewHistory {
  id: number;
  grade: Grade;
  reviewDate: Date;
  previousInterval: number | null;
  newInterval: number;
  aFactorBefore: number | null;
  aFactorAfter: number;
  optimalFactorUsed: number | null;
  responseTimeMs: number | null;
}
