'use client';

import { useState, useEffect } from 'react';

// Chart data type definitions
export interface WeeklyProgressData {
  day: string;
  cards: number;
  time: number;
}

export interface StudyPerformanceData {
  date: string;
  accuracy: number;
  retention: number;
}

export interface DeckDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyProgressData {
  month: string;
  cards: number;
  accuracy: number;
}

interface ChartDataState<T> {
  data: T[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseChartDataOptions {
  initialDelay?: number;
  mockData?: any[];
  simulateError?: boolean;
  errorMessage?: string;
}

export function useChartData<T>(
  fetchFunction?: () => Promise<T[]>,
  options: UseChartDataOptions = {}
): ChartDataState<T> {
  const {
    initialDelay = 1000,
    mockData = null,
    simulateError = false,
    errorMessage = 'Failed to load chart data',
  } = options;

  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, initialDelay));

      if (simulateError) {
        throw new Error(errorMessage);
      }

      if (fetchFunction) {
        const result = await fetchFunction();
        setData(result);
      } else if (mockData) {
        setData(mockData);
      } else {
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

// Specific hooks for each chart type
export function useWeeklyProgressData() {
  return useChartData<WeeklyProgressData>(undefined, {
    initialDelay: 1000,
    mockData: [
      { day: 'Mon', cards: 12, time: 45 },
      { day: 'Tue', cards: 19, time: 62 },
      { day: 'Wed', cards: 8, time: 28 },
      { day: 'Thu', cards: 15, time: 51 },
      { day: 'Fri', cards: 22, time: 73 },
      { day: 'Sat', cards: 18, time: 58 },
      { day: 'Sun', cards: 14, time: 42 },
    ],
  });
}

export function useStudyPerformanceData() {
  return useChartData<StudyPerformanceData>(undefined, {
    initialDelay: 1200,
    mockData: [
      { date: '12/5', accuracy: 78, retention: 85 },
      { date: '12/6', accuracy: 82, retention: 88 },
      { date: '12/7', accuracy: 75, retention: 82 },
      { date: '12/8', accuracy: 88, retention: 91 },
      { date: '12/9', accuracy: 85, retention: 89 },
      { date: '12/10', accuracy: 92, retention: 94 },
      { date: '12/11', accuracy: 89, retention: 92 },
    ],
  });
}

export function useDeckDistributionData() {
  return useChartData<DeckDistributionData>(undefined, {
    initialDelay: 800,
    mockData: [
      { name: 'Spanish Vocabulary', value: 45, color: '#3b82f6' },
      { name: 'Programming Concepts', value: 67, color: '#10b981' },
      { name: 'History Facts', value: 89, color: '#f59e0b' },
      { name: 'Science Terms', value: 34, color: '#ef4444' },
      { name: 'Math Formulas', value: 28, color: '#8b5cf6' },
    ],
  });
}

export function useMonthlyProgressData() {
  return useChartData<MonthlyProgressData>(undefined, {
    initialDelay: 1500,
    mockData: [
      { month: 'Aug', cards: 145, accuracy: 78 },
      { month: 'Sep', cards: 189, accuracy: 82 },
      { month: 'Oct', cards: 234, accuracy: 85 },
      { month: 'Nov', cards: 278, accuracy: 88 },
      { month: 'Dec', cards: 312, accuracy: 91 },
    ],
  });
}
