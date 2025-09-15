'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartEmptyStateProps {
  title: string;
  icon?: React.ReactNode;
  message?: string;
  onRetry?: () => void;
}

export default function ChartEmptyState({
  title,
  icon,
  message = 'No data available to display',
  onRetry,
}: ChartEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            Start studying to see your progress here
          </p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
