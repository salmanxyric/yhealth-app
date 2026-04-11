"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Loader2,
  LineChart as LineChartIcon,
  BarChart2,
  Layers,
  Flame,
  Beef,
  Wheat,
  Apple,
} from "lucide-react";
import { nutritionService, type MealLog } from "@/src/shared/services";

interface DailyNutritionData {
  date: string;           // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealsCount: number;
}

interface NutritionAnalyticsData {
  dailyData: DailyNutritionData[];
  totals: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
  };
}

type ChartMode = 'line' | 'bar' | 'area';

export function NutritionAnalytics() {
  const [data, setData] = useState<NutritionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch meals for the date range
      const response = await nutritionService.getMeals({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (!response.success || !response.data?.meals) {
        setError('Failed to fetch nutrition data');
        setIsLoading(false);
        return;
      }

      const meals: MealLog[] = response.data.meals;

      // Group meals by date
      const mealsByDate = new Map<string, MealLog[]>();
      meals.forEach((meal) => {
        const mealDate = new Date(meal.eatenAt);
        const dateKey = mealDate.toISOString().split('T')[0];
        if (!mealsByDate.has(dateKey)) {
          mealsByDate.set(dateKey, []);
        }
        mealsByDate.get(dateKey)!.push(meal);
      });

      // Process daily data
      const dailyData: DailyNutritionData[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayMeals = mealsByDate.get(dateKey) || [];
        
        const dayTotals = dayMeals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.proteinGrams || 0),
            carbs: acc.carbs + (meal.carbsGrams || 0),
            fat: acc.fat + (meal.fatGrams || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        dailyData.push({
          date: dateKey,
          calories: Math.round(dayTotals.calories),
          protein: Math.round(dayTotals.protein),
          carbs: Math.round(dayTotals.carbs),
          fat: Math.round(dayTotals.fat),
          mealsCount: dayMeals.length,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate totals and averages
      const totals = dailyData.reduce(
        (acc, day) => ({
          totalCalories: acc.totalCalories + day.calories,
          totalProtein: acc.totalProtein + day.protein,
          totalCarbs: acc.totalCarbs + day.carbs,
          totalFat: acc.totalFat + day.fat,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
      );

      const daysWithData = dailyData.filter(d => d.mealsCount > 0).length || 1;
      const totalsData: NutritionAnalyticsData['totals'] = {
        ...totals,
        averageCalories: Math.round(totals.totalCalories / daysWithData),
        averageProtein: Math.round(totals.totalProtein / daysWithData),
        averageCarbs: Math.round(totals.totalCarbs / daysWithData),
        averageFat: Math.round(totals.totalFat / daysWithData),
      };

      setData({
        dailyData,
        totals: totalsData,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      console.error('[NutritionAnalytics] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const ChartComponent = ({ mode }: { mode: ChartMode }) => {
    if (!data) return null;

    const chartData = data.dailyData.map(day => ({
      ...day,
      dateLabel: formatDate(day.date),
    }));

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (mode) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="calories" 
              stroke="#F97316" 
              strokeWidth={2}
              name="Calories"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="protein" 
              stroke="#EF4444" 
              strokeWidth={2}
              name="Protein (g)"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="carbs" 
              stroke="#F59E0B" 
              strokeWidth={2}
              name="Carbs (g)"
              dot={{ r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="fat" 
              stroke="#A855F7" 
              strokeWidth={2}
              name="Fat (g)"
              dot={{ r: 3 }}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="calories" fill="#F97316" name="Calories" />
            <Bar dataKey="protein" fill="#EF4444" name="Protein (g)" />
            <Bar dataKey="carbs" fill="#F59E0B" name="Carbs (g)" />
            <Bar dataKey="fat" fill="#A855F7" name="Fat (g)" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="calories" 
              stackId="1"
              stroke="#F97316" 
              fill="#F97316" 
              fillOpacity={0.6}
              name="Calories"
            />
            <Area 
              type="monotone" 
              dataKey="protein" 
              stackId="2"
              stroke="#EF4444" 
              fill="#EF4444" 
              fillOpacity={0.6}
              name="Protein (g)"
            />
            <Area 
              type="monotone" 
              dataKey="carbs" 
              stackId="3"
              stroke="#F59E0B" 
              fill="#F59E0B" 
              fillOpacity={0.6}
              name="Carbs (g)"
            />
            <Area 
              type="monotone" 
              dataKey="fat" 
              stackId="4"
              stroke="#A855F7" 
              fill="#A855F7" 
              fillOpacity={0.6}
              name="Fat (g)"
            />
          </AreaChart>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.dailyData.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h4 className="text-white font-medium mb-2">No nutrition data available</h4>
        <p className="text-slate-400 text-sm">Start logging meals to see your nutrition analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-[16px] sm:text-[18px] font-semibold text-white">Nutrition Analytics</h3>
        <div className="flex gap-1.5 sm:gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                timeRange === range
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
            <span className="text-[11px] sm:text-xs text-slate-400">Avg Calories</span>
          </div>
          <p className="text-[15px] sm:text-lg font-semibold text-orange-400">{data.totals.averageCalories}</p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">kcal/day</p>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Beef className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
            <span className="text-[11px] sm:text-xs text-slate-400">Avg Protein</span>
          </div>
          <p className="text-[15px] sm:text-lg font-semibold text-red-400">{data.totals.averageProtein}g</p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">per day</p>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Wheat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-[11px] sm:text-xs text-slate-400">Avg Carbs</span>
          </div>
          <p className="text-[15px] sm:text-lg font-semibold text-amber-400">{data.totals.averageCarbs}g</p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">per day</p>
        </div>
        <div className="p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-[11px] sm:text-xs text-slate-400">Avg Fat</span>
          </div>
          <p className="text-[15px] sm:text-lg font-semibold text-purple-400">{data.totals.averageFat}g</p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">per day</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h4 className="text-[14px] sm:text-[15px] text-white font-semibold">Daily Nutrition Trends</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setChartMode('line')}
              className={`p-2 rounded-lg transition-colors ${
                chartMode === 'line'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartMode('bar')}
              className={`p-2 rounded-lg transition-colors ${
                chartMode === 'bar'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartMode('area')}
              className={`p-2 rounded-lg transition-colors ${
                chartMode === 'area'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Area Chart"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[400px]">
          <ChartComponent mode={chartMode} />
        </ResponsiveContainer>
      </div>
    </div>
  );
}

