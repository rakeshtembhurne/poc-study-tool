'use client';

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

const monthlyProgressData = [
  { month: 'Aug', cards: 145, accuracy: 78 },
  { month: 'Sep', cards: 189, accuracy: 82 },
  { month: 'Oct', cards: 234, accuracy: 85 },
  { month: 'Nov', cards: 278, accuracy: 88 },
  { month: 'Dec', cards: 312, accuracy: 91 },
];

export default function MonthlyProgressChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyProgressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
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
