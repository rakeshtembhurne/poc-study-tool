// Default Optimal Factor Matrix for A-Factor range 1.1-2.5
// 15 difficulty categories (0-14) × 10 repetition levels (1-10)
export const DEFAULT_OF_MATRIX: Record<number, number[]> = {
  // First review - conservative start
  1: [
    1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95,
    2.0,
  ],

  // Second review - slightly more aggressive
  2: [
    1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05,
    2.1,
  ],

  // Third review - building confidence
  3: [
    1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15,
    2.2,
  ],

  // Fourth review - more aggressive
  4: [
    1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25,
    2.3,
  ],

  // Fifth review - near mature
  5: [
    1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35,
    2.4,
  ],

  // Mature cards (6-10) - stable intervals
  6: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45,
  ],
  7: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45,
  ],
  8: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45,
  ],
  9: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45,
  ],
  10: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45,
  ],
};

// Difficulty category mapping for A-Factor 1.1-2.5
export const DIFFICULTY_CATEGORY_MAP = {
  0: '1.1-1.2', // Very hard
  1: '1.2-1.3', // Hard
  2: '1.3-1.4', // Hard
  3: '1.4-1.5', // Moderate-hard
  4: '1.5-1.6', // Moderate-hard
  5: '1.6-1.7', // Moderate
  6: '1.7-1.8', // Moderate
  7: '1.8-1.9', // Moderate
  8: '1.9-2.0', // Moderate-easy
  9: '2.0-2.1', // Moderate-easy
  10: '2.1-2.2', // Easy
  11: '2.2-2.3', // Easy
  12: '2.3-2.4', // Very easy
  13: '2.4-2.5', // Very easy
  14: '2.5', // Maximum easy
};

// Expected retention rates for different interval/difficulty combinations
// Used to initialize Recall Matrix when no user data exists
// Conservative baseline values targeting 90% retention across A-Factor range 1.1-2.5
export const DEFAULT_RETENTION_TARGETS: Record<number, number[]> = {
  // Intervals in days → expected retention rates by A-Factor difficulty category (1.1-2.5)
  1: [
    0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86,
    0.85, 0.84,
  ], // 1 day
  2: [
    0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84, 0.83,
    0.82, 0.81,
  ], // 2 days
  3: [
    0.92, 0.91, 0.9, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81, 0.8,
    0.79, 0.78,
  ], // 3 days
  5: [
    0.88, 0.87, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81, 0.8, 0.79, 0.78, 0.77, 0.76,
    0.75, 0.74,
  ], // 5 days
  7: [
    0.85, 0.84, 0.83, 0.82, 0.81, 0.8, 0.79, 0.78, 0.77, 0.76, 0.75, 0.74, 0.73,
    0.72, 0.71,
  ], // 1 week
  14: [
    0.78, 0.77, 0.76, 0.75, 0.74, 0.73, 0.72, 0.71, 0.7, 0.69, 0.68, 0.67, 0.66,
    0.65, 0.64,
  ], // 2 weeks
  21: [
    0.72, 0.71, 0.7, 0.69, 0.68, 0.67, 0.66, 0.65, 0.64, 0.63, 0.62, 0.61, 0.6,
    0.59, 0.58,
  ], // 3 weeks
  30: [
    0.65, 0.64, 0.63, 0.62, 0.61, 0.6, 0.59, 0.58, 0.57, 0.56, 0.55, 0.54, 0.53,
    0.52, 0.51,
  ], // 1 month
  60: [
    0.5, 0.49, 0.48, 0.47, 0.46, 0.45, 0.44, 0.43, 0.42, 0.41, 0.4, 0.39, 0.38,
    0.37, 0.36,
  ], // 2 months
  90: [
    0.4, 0.39, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33, 0.32, 0.31, 0.3, 0.29, 0.28,
    0.27, 0.26,
  ], // 3 months
};

// A-Factor to difficulty category mapping (for 1.1-2.5 range)
export function aFactorToDifficultyCategory(aFactor: number): number {
  // Map A-Factor range 1.1-2.5 to categories 0-14
  const normalized = Math.max(1.1, Math.min(2.5, aFactor));
  return Math.floor(((normalized - 1.1) / 1.4) * 14);
}

// Helper function to get expected retention rate
export function getExpectedRetentionRate(
  intervalDays: number,
  difficultyCategory: number
): number {
  // Find closest interval in targets
  const intervals = Object.keys(DEFAULT_RETENTION_TARGETS)
    .map(Number)
    .sort((a, b) => a - b);
  const closestInterval = intervals.reduce((prev, curr) =>
    Math.abs(curr - intervalDays) < Math.abs(prev - intervalDays) ? curr : prev
  );

  const categoryIndex = Math.min(Math.max(0, difficultyCategory), 14);
  return DEFAULT_RETENTION_TARGETS[closestInterval][categoryIndex] || 0.9;
}
