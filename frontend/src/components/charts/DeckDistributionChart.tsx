'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const deckDistributionData = [
  { name: 'Spanish Vocabulary', value: 45, color: '#3b82f6' },
  { name: 'Programming Concepts', value: 67, color: '#10b981' },
  { name: 'History Facts', value: 89, color: '#f59e0b' },
  { name: 'Science Terms', value: 34, color: '#ef4444' },
  { name: 'Math Formulas', value: 28, color: '#8b5cf6' },
];

export default function DeckDistributionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deck Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deckDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {deckDistributionData.map((entry, index) => (
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
