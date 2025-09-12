'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import ChartLoadingState from './ChartLoadingState';
import ChartEmptyState from './ChartEmptyState';
import { WeeklyProgressData } from '@/hooks/useChartData';

const mockWeeklyProgressData: WeeklyProgressData[] = [
  { day: 'Mon', cards: 12, time: 45 },
  { day: 'Tue', cards: 19, time: 62 },
  { day: 'Wed', cards: 8, time: 28 },
  { day: 'Thu', cards: 15, time: 51 },
  { day: 'Fri', cards: 22, time: 73 },
  { day: 'Sat', cards: 18, time: 58 },
  { day: 'Sun', cards: 14, time: 42 },
];

interface WeeklyProgressChartProps {
  data?: WeeklyProgressData[];
  isLoading?: boolean;
  error?: string | null;
}

function WeeklyProgressChartContent({
  data = mockWeeklyProgressData,
  isLoading = false,
  error = null,
}: WeeklyProgressChartProps) {
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading = isLoading || internalLoading;

  // Validate data
  const isValidData = (data: WeeklyProgressData[]): boolean => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) =>
          typeof item.day === 'string' &&
          typeof item.cards === 'number' &&
          typeof item.time === 'number' &&
          !isNaN(item.cards) &&
          !isNaN(item.time)
      )
    );
  };

  const handleRetry = () => {
    setInternalLoading(true);
    setTimeout(() => setInternalLoading(false), 1000);
  };

  if (isActuallyLoading) {
    return (
      <ChartLoadingState
        title="Weekly Progress"
        icon={<TrendingUp className="h-5 w-5" />}
      />
    );
  }

  if (error) {
    return (
      <ChartEmptyState
        title="Weekly Progress"
        icon={<TrendingUp className="h-5 w-5" />}
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  if (!isValidData(data)) {
    return (
      <ChartEmptyState
        title="Weekly Progress"
        icon={<TrendingUp className="h-5 w-5" />}
        message="No weekly progress data available"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="cards"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-2">
          Cards studied per day this week
        </p>
      </CardContent>
    </Card>
  );
}

export default function WeeklyProgressChart(props: WeeklyProgressChartProps) {
  return (
    <ChartErrorBoundary fallbackTitle="Weekly Progress">
      <WeeklyProgressChartContent {...props} />
    </ChartErrorBoundary>
  );
}
