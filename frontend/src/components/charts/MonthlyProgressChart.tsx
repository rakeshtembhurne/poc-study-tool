'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import ChartLoadingState from './ChartLoadingState';
import ChartEmptyState from './ChartEmptyState';
import { BarChart3 } from 'lucide-react';
import { MonthlyProgressData } from '@/hooks/useChartData';

const mockMonthlyProgressData: MonthlyProgressData[] = [
  { month: 'Aug', cards: 145, accuracy: 78 },
  { month: 'Sep', cards: 189, accuracy: 82 },
  { month: 'Oct', cards: 234, accuracy: 85 },
  { month: 'Nov', cards: 278, accuracy: 88 },
  { month: 'Dec', cards: 312, accuracy: 91 },
];

interface MonthlyProgressChartProps {
  data?: MonthlyProgressData[];
  isLoading?: boolean;
  error?: string | null;
}

function MonthlyProgressChartContent({
  data = mockMonthlyProgressData,
  isLoading = false,
  error = null,
}: MonthlyProgressChartProps) {
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading = isLoading || internalLoading;

  // Validate data
  const isValidData = (data: MonthlyProgressData[]): boolean => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) =>
          typeof item.month === 'string' &&
          typeof item.cards === 'number' &&
          typeof item.accuracy === 'number' &&
          !isNaN(item.cards) &&
          !isNaN(item.accuracy) &&
          item.cards >= 0 &&
          item.accuracy >= 0 &&
          item.accuracy <= 100 &&
          item.month.trim().length > 0
      )
    );
  };

  const handleRetry = () => {
    setInternalLoading(true);
    setTimeout(() => setInternalLoading(false), 1500);
  };

  if (isActuallyLoading) {
    return (
      <ChartLoadingState
        title="Monthly Progress"
        icon={<BarChart3 className="h-5 w-5" />}
      />
    );
  }

  if (error) {
    return (
      <ChartEmptyState
        title="Monthly Progress"
        icon={<BarChart3 className="h-5 w-5" />}
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  if (!isValidData(data)) {
    return (
      <ChartEmptyState
        title="Monthly Progress"
        icon={<BarChart3 className="h-5 w-5" />}
        message="No monthly progress data available"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
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
            <Bar
              dataKey="cards"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Cards Studied"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-2">
          Total cards studied each month
        </p>
      </CardContent>
    </Card>
  );
}

export default function MonthlyProgressChart(props: MonthlyProgressChartProps) {
  return (
    <ChartErrorBoundary fallbackTitle="Monthly Progress">
      <MonthlyProgressChartContent {...props} />
    </ChartErrorBoundary>
  );
}
