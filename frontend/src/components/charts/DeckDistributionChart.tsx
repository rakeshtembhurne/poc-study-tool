'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import ChartLoadingState from './ChartLoadingState';
import ChartEmptyState from './ChartEmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';
import { DeckDistributionData } from '@/hooks/useChartData';

const mockDeckDistributionData: DeckDistributionData[] = [
  { name: 'Spanish Vocabulary', value: 45, color: '#3b82f6' },
  { name: 'Programming Concepts', value: 67, color: '#10b981' },
  { name: 'History Facts', value: 89, color: '#f59e0b' },
  { name: 'Science Terms', value: 34, color: '#ef4444' },
  { name: 'Math Formulas', value: 28, color: '#8b5cf6' },
];

interface DeckDistributionChartProps {
  data?: DeckDistributionData[];
  isLoading?: boolean;
  error?: string | null;
}

function DeckDistributionChartContent({
  data = mockDeckDistributionData,
  isLoading = false,
  error = null,
}: DeckDistributionChartProps) {
  const [internalLoading, setInternalLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const isActuallyLoading = isLoading || internalLoading;

  // Validate data
  const isValidData = (data: DeckDistributionData[]): boolean => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      data.every(
        (item) =>
          typeof item.name === 'string' &&
          typeof item.value === 'number' &&
          typeof item.color === 'string' &&
          !isNaN(item.value) &&
          item.value >= 0 &&
          item.name.trim().length > 0 &&
          /^#[0-9A-F]{6}$/i.test(item.color)
      )
    );
  };

  const handleRetry = () => {
    setInternalLoading(true);
    setTimeout(() => setInternalLoading(false), 800);
  };

  if (isActuallyLoading) {
    return (
      <ChartLoadingState
        title="Deck Distribution"
        icon={<PieChartIcon className="h-5 w-5" />}
      />
    );
  }

  if (error) {
    return (
      <ChartEmptyState
        title="Deck Distribution"
        icon={<PieChartIcon className="h-5 w-5" />}
        message={error}
        onRetry={handleRetry}
      />
    );
  }

  if (!isValidData(data)) {
    return (
      <ChartEmptyState
        title="Deck Distribution"
        icon={<PieChartIcon className="h-5 w-5" />}
        message="No deck data available"
        onRetry={handleRetry}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground mt-2">
          Distribution of cards across your decks
        </p>
      </CardContent>
    </Card>
  );
}

export default function DeckDistributionChart(
  props: DeckDistributionChartProps
) {
  return (
    <ChartErrorBoundary fallbackTitle="Deck Distribution">
      <DeckDistributionChartContent {...props} />
    </ChartErrorBoundary>
  );
}
