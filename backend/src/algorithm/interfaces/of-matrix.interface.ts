export interface OFMatrixEntry {
  userId: number;
  repetitionNumber: number;
  difficultyCategory: number;
  optimalFactor: number;
  usageCount: number;
  lastUpdated: Date;
}

export interface OFMatrixAdjustment {
  shouldAdjust: boolean;
  suggestedChange: number;
  reason: string;
}

export interface PerformanceData {
  actualInterval: number;
  grade: number;
  responseTime: number;
  retentionRate: number;
}
