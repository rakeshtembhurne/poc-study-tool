export const SM15_CONSTANTS = {
  GRADE_SCALE: {
    MIN: 0, // Complete blackout
    MAX: 5,
  },
  A_FACTOR: {
    MIN: 1.2, // Hardest items
    MAX: 6.9, // Easiest items
    DEFAULT: 4.0, // Middle value for unknown difficulty
  },
  INTERVALS: {
    MIN_DAYS: 1,
    MAX_DAYS: 5475, // 15 years
    GRACE_PERIOD: 0.2, // ±20%
    OVERDUE_THRESHOLD: 1.5, // 150%
  },
  GRADE_PERFORMANCE_MAP: {
    0: 0.0, // Complete blackout
    1: 0.1, // Complete failure
    2: 0.3, // Poor recall
    3: 0.6, // Moderate recall (Pass threshold)
    4: 0.8, // Good recall
    5: 1.0, // Perfect recall
  },
  FORGETTING_INDEX_TARGET: 0.1, // 10% target
  RETENTION_WARNING_THRESHOLD: 0.8,
  RETENTION_CRITICAL_THRESHOLD: 0.7,
} as const;
