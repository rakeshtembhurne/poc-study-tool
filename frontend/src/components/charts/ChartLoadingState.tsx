'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ChartLoadingStateProps {
  title: string;
  icon?: React.ReactNode;
}

export default function ChartLoadingState({
  title,
  icon,
}: ChartLoadingStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading chart data...</p>

        {/* Skeleton chart area */}
        <div className="w-full h-[300px] bg-muted/20 rounded-lg animate-pulse flex items-center justify-center">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
