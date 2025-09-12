'use client';

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

const weeklyProgressData = [
  { day: 'Mon', cards: 12, time: 45 },
  { day: 'Tue', cards: 19, time: 62 },
  { day: 'Wed', cards: 8, time: 28 },
  { day: 'Thu', cards: 15, time: 51 },
  { day: 'Fri', cards: 22, time: 73 },
  { day: 'Sat', cards: 18, time: 58 },
  { day: 'Sun', cards: 14, time: 42 },
];

export default function WeeklyProgressChart() {
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
          <AreaChart data={weeklyProgressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#6b7280' }}
            />
            <YAxis
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
