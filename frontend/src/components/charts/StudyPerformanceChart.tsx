'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import ChartLoadingState from './ChartLoadingState';
import ChartEmptyState from './ChartEmptyState';
import { StudyPerformanceData } from '@/hooks/useChartData';

const mockStudyPerformanceData: StudyPerformanceData[] = [
  { date: '12/5', accuracy: 78, retention: 85 },
  { date: '12/6', accuracy: 82, retention: 88 },
  { date: '12/7', accuracy: 75, retention: 82 },
  { date: '12/8', accuracy: 88, retention: 91 },
  { date: '12/9', accuracy: 85, retention: 89 },
  { date: '12/10', accuracy: 92, retention: 94 },
  { date: '12/11', accuracy: 89, retention: 92 },
];

interface StudyPerformanceChartProps {
  data?: StudyPerformanceData[];
  isLoading?: boolean;
  error?: string | null;
}

function StudyPerformanceChartContent({
  data = mockStudyPerformanceData,
  isLoading = false,
  error = null,
}: StudyPerformanceChartProps) {
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading = isLoading || internalLoading;

  // Validate data
  const isValidData = (data: StudyPerformanceData[]): boolean => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) =>
          typeof item.date === 'string' &&
          typeof item.accuracy === 'number' &&
          typeof item.retention === 'number' &&
          !isNaN(item.accuracy) &&
          !isNaN(item.retention) &&
          item.accuracy >= 0 &&
          item.accuracy <= 100 &&
          item.retention >= 0 &&
          item.retention <= 100
      )
    );
  };

  const handleRetry = () => {
    setInternalLoading(true);
    setTimeout(() => setInternalLoading(false), 1200);
  };

  if (isActuallyLoading) {
    return (
      <ChartLoadingState
        title="Study Performance"
        icon={<Target className="h-5 w-5" />}
      />
    );
  }

  if (error) {
    return (
      <ChartEmptyState
        title="Study Performance"
        icon={<Target className="h-5 w-5" />}
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  if (!isValidData(data)) {
    return (
      <ChartEmptyState
        title="Study Performance"
        icon={<Target className="h-5 w-5" />}
        message="No performance data available"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Study Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Accuracy %"
            />
            <Line
              type="monotone"
              dataKey="retention"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name="Retention %"
            />
            <Legend />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-2">
          Accuracy and retention rates over time
        </p>
      </CardContent>
    </Card>
  );
}

export default function StudyPerformanceChart(
  props: StudyPerformanceChartProps
) {
  return (
    <ChartErrorBoundary fallbackTitle="Study Performance">
      <StudyPerformanceChartContent {...props} />
    </ChartErrorBoundary>
  );
}
