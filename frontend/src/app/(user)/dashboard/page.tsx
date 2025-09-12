'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  BookOpen,
  Plus,
  Calendar,
  Flame,
  Clock,
  BookMarked,
} from 'lucide-react';
import WeeklyProgressChart from '@/components/charts/WeeklyProgressChart';
import StudyPerformanceChart from '@/components/charts/StudyPerformanceChart';
import DeckDistributionChart from '@/components/charts/DeckDistributionChart';
import MonthlyProgressChart from '@/components/charts/MonthlyProgressChart';
import {
  useWeeklyProgressData,
  useStudyPerformanceData,
  useDeckDistributionData,
  useMonthlyProgressData,
} from '@/hooks/useChartData';

export default function DashboardPage() {
  // Use custom hooks to manage chart data states
  const weeklyProgress = useWeeklyProgressData();
  const studyPerformance = useStudyPerformanceData();
  const deckDistribution = useDeckDistributionData();
  const monthlyProgress = useMonthlyProgressData();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[80vw] mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-md text-muted-foreground">
            Ready to continue your learning journey?
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                <BookMarked className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">234</p>
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-sm text-muted-foreground">Due Today</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg mr-4">
                <Flame className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">7 days</p>
                <p className="text-sm text-muted-foreground">Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">2.5h</p>
                <p className="text-sm text-muted-foreground">Study Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start !cursor-pointer"
                variant={'outline'}
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Study Session
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start !cursor-pointer"
                size="lg"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Decks
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start !cursor-pointer"
                size="lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Card
              </Button>
            </CardContent>
          </Card>

          {/* Recent Decks */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Decks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    Spanish Vocabulary
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      45 cards
                    </span>
                    <Badge variant="secondary">8 due</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    last studied: 2 hours ago
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={'default'}
                  className="!text-primary-foreground !cursor-pointer"
                >
                  Study
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    Programming Concepts
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      67 cards
                    </span>
                    <Badge variant="secondary">3 due</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    last studied: 1 day ago
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={'default'}
                  className="!text-primary-foreground !cursor-pointer"
                >
                  Study
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    History Facts
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      89 cards
                    </span>
                    <Badge variant="secondary">15 due</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    last studied: 3 days ago
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={'default'}
                  className="!text-primary-foreground !cursor-pointer"
                >
                  Study
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section with Enhanced Error Handling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <WeeklyProgressChart
            data={weeklyProgress.data || undefined}
            isLoading={weeklyProgress.isLoading}
            error={weeklyProgress.error}
          />
          <StudyPerformanceChart
            data={studyPerformance.data || undefined}
            isLoading={studyPerformance.isLoading}
            error={studyPerformance.error}
          />
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DeckDistributionChart
            data={deckDistribution.data || undefined}
            isLoading={deckDistribution.isLoading}
            error={deckDistribution.error}
          />
          <MonthlyProgressChart
            data={monthlyProgress.data || undefined}
            isLoading={monthlyProgress.isLoading}
            error={monthlyProgress.error}
          />
        </div>
      </div>
    </div>
  );
}
