'use client';

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

const studyPerformanceData = [
  { date: '12/5', accuracy: 78, retention: 85 },
  { date: '12/6', accuracy: 82, retention: 88 },
  { date: '12/7', accuracy: 75, retention: 82 },
  { date: '12/8', accuracy: 88, retention: 91 },
  { date: '12/9', accuracy: 85, retention: 89 },
  { date: '12/10', accuracy: 92, retention: 94 },
  { date: '12/11', accuracy: 89, retention: 92 },
];

export default function StudyPerformanceChart() {
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
          <LineChart data={studyPerformanceData}>
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
