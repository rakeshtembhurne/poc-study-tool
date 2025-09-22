// Default Optimal Factor Matrix for A-Factor range 1.2-6.9
// 20 difficulty categories (0-19) × 20 repetition levels (1-20)
export const DEFAULT_OF_MATRIX: Record<number, number[]> = {
  // First review - conservative start
  1: [
    1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85,
    1.9, 1.95, 2.0, 2.05, 2.1, 2.15,
  ],

  // Second review - slightly more aggressive
  2: [
    1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95,
    2.0, 2.05, 2.1, 2.15, 2.2, 2.25,
  ],

  // Third review - building confidence
  3: [
    1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05,
    2.1, 2.15, 2.2, 2.25, 2.3, 2.35,
  ],

  // Fourth review - more aggressive
  4: [
    1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15,
    2.2, 2.25, 2.3, 2.35, 2.4, 2.45,
  ],

  // Fifth review - near mature
  5: [
    1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25,
    2.3, 2.35, 2.4, 2.45, 2.5, 2.55,
  ],

  // Mature cards (6-20) - stable intervals with gradual increase
  6: [
    1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3,
    2.35, 2.4, 2.45, 2.5, 2.55, 2.6,
  ],
  7: [
    1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35,
    2.4, 2.45, 2.5, 2.55, 2.6, 2.65,
  ],
  8: [
    1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4,
    2.45, 2.5, 2.55, 2.6, 2.65, 2.7,
  ],
  9: [
    1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45,
    2.5, 2.55, 2.6, 2.65, 2.7, 2.75,
  ],
  10: [
    1.85, 1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5,
    2.55, 2.6, 2.65, 2.7, 2.75, 2.8,
  ],
  11: [
    1.9, 1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55,
    2.6, 2.65, 2.7, 2.75, 2.8, 2.85,
  ],
  12: [
    1.95, 2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6,
    2.65, 2.7, 2.75, 2.8, 2.85, 2.9,
  ],
  13: [
    2.0, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65,
    2.7, 2.75, 2.8, 2.85, 2.9, 2.95,
  ],
  14: [
    2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7,
    2.75, 2.8, 2.85, 2.9, 2.95, 3.0,
  ],
  15: [
    2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75,
    2.8, 2.85, 2.9, 2.95, 3.0, 3.05,
  ],
  16: [
    2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8,
    2.85, 2.9, 2.95, 3.0, 3.05, 3.1,
  ],
  17: [
    2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85,
    2.9, 2.95, 3.0, 3.05, 3.1, 3.15,
  ],
  18: [
    2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9,
    2.95, 3.0, 3.05, 3.1, 3.15, 3.2,
  ],
  19: [
    2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9, 2.95,
    3.0, 3.05, 3.1, 3.15, 3.2, 3.25,
  ],
  20: [
    2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7, 2.75, 2.8, 2.85, 2.9, 2.95, 3.0,
    3.05, 3.1, 3.15, 3.2, 3.25, 3.3,
  ],
};

// Difficulty category mapping for A-Factor 1.2-6.9 (20 categories)
export const DIFFICULTY_CATEGORY_MAP = {
  0: '1.2-1.5', // Hardest
  1: '1.5-1.8', // Very hard
  2: '1.8-2.1', // Hard
  3: '2.1-2.4', // Moderately hard
  4: '2.4-2.7', // Somewhat hard
  5: '2.7-3.0', // Below average
  6: '3.0-3.3', // Slightly below average
  7: '3.3-3.6', // Below average
  8: '3.6-3.9', // Approaching average
  9: '3.9-4.2', // Average
  10: '4.2-4.5', // Slightly above average
  11: '4.5-4.8', // Above average
  12: '4.8-5.1', // Moderately easy
  13: '5.1-5.4', // Somewhat easy
  14: '5.4-5.7', // Easy
  15: '5.7-6.0', // Very easy
  16: '6.0-6.3', // Extremely easy
  17: '6.3-6.6', // Nearly effortless
  18: '6.6-6.9', // Effortless
  19: '6.9', // Maximum easiness
};

// Expected retention rates for different interval/difficulty combinations
// Used to initialize Recall Matrix when no user data exists
// Conservative baseline values targeting 90% retention across A-Factor range 1.2-6.9
export const DEFAULT_RETENTION_TARGETS: Record<number, number[]> = {
  // Intervals in days → expected retention rates by A-Factor difficulty category (1.2-6.9)
  1: [
    0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 0.99, 0.99, 0.99, 0.99,
    0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99,
  ], // 1 day
  2: [
    0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.98, 0.98,
    0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98,
  ], // 2 days
  3: [
    0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96,
    0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.97,
  ], // 3 days
  5: [
    0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84, 0.85, 0.86, 0.87, 0.88, 0.89, 0.9,
    0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.96,
  ], // 5 days
  7: [
    0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83, 0.84,
    0.85, 0.86, 0.87, 0.88, 0.89, 0.9, 0.91,
  ], // 1 week
  14: [
    0.64, 0.65, 0.66, 0.67, 0.68, 0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75, 0.76,
    0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.83,
  ], // 2 weeks
  21: [
    0.56, 0.57, 0.58, 0.59, 0.6, 0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67, 0.68,
    0.69, 0.7, 0.71, 0.72, 0.73, 0.74, 0.75,
  ], // 3 weeks
  30: [
    0.48, 0.49, 0.5, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6,
    0.61, 0.62, 0.63, 0.64, 0.65, 0.66, 0.67,
  ], // 1 month
  60: [
    0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43, 0.44,
    0.45, 0.46, 0.47, 0.48, 0.49, 0.5, 0.51,
  ], // 2 months
  90: [
    0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.3, 0.31, 0.32, 0.33, 0.34, 0.35, 0.36,
    0.37, 0.38, 0.39, 0.4, 0.41, 0.42, 0.43,
  ], // 3 months
};

// A-Factor to difficulty category mapping (for 1.2-6.9 range)
export function aFactorToDifficultyCategory(aFactor: number): number {
  // Map A-Factor range 1.2-6.9 to categories 0-19
  const normalized = Math.max(1.2, Math.min(6.9, aFactor));
  return Math.floor(((normalized - 1.2) / 5.7) * 19);
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

  const categoryIndex = Math.min(Math.max(0, difficultyCategory), 19);
  return DEFAULT_RETENTION_TARGETS[closestInterval][categoryIndex] || 0.9;
}
