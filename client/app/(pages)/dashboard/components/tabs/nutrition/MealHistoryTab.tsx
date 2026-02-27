"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Utensils,
  Calendar,
  Search,
  Loader2,
  RefreshCw,
  Edit3,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Apple,
  Clock,
  X,
} from "lucide-react";
import { nutritionService, type MealLog } from "@/src/shared/services";
import { format, isToday, isYesterday, parseISO, subDays } from "date-fns";
import type { ClientMeal } from "./types";

interface MealHistoryTabProps {
  onEditMeal?: (meal: ClientMeal) => void;
  onDeleteMeal?: (mealId: string) => void;
}

function transformApiMealToClient(meal: MealLog): ClientMeal {
  const mealTypeToIcon: Record<string, "breakfast" | "lunch" | "dinner" | "snack"> = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
  };
  const eatenAt = new Date(meal.eatenAt);
  const hours = eatenAt.getHours().toString().padStart(2, '0');
  const minutes = eatenAt.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return {
    id: meal.id,
    name: meal.mealName || meal.mealType,
    time,
    calories: meal.calories || 0,
    protein: meal.proteinGrams || 0,
    carbs: meal.carbsGrams || 0,
    fat: meal.fatGrams || 0,
    items: meal.foods || [],
    completed: true,
    icon: mealTypeToIcon[meal.mealType] || "snack",
    mealType: meal.mealType,
  };
}

function formatSmartDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMMM d, yyyy");
}

export function MealHistoryTab({ onEditMeal, onDeleteMeal }: MealHistoryTabProps) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

  const fetchMeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await nutritionService.getMeals({
        startDate,
        endDate,
      });
      if (response.success && response.data) {
        setMeals(response.data.meals);
      }
    } catch (err) {
      console.error("Failed to fetch meal history:", err);
      setError("Failed to load meal history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  // Initialize completed meals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('completedMeals');
    if (stored) {
      try {
        setCompletedMeals(new Set(JSON.parse(stored)));
      } catch (_e) {
        // If parsing fails, default to empty set
        setCompletedMeals(new Set());
      }
    }
  }, []);

  // Sync completed meals when meals change - add new meals as completed by default
  useEffect(() => {
    if (meals.length > 0) {
      setCompletedMeals((_prev) => {
        const stored = localStorage.getItem('completedMeals');
        let storedIds = new Set<string>();
        if (stored) {
          try {
            storedIds = new Set(JSON.parse(stored));
          } catch (_e) {
            // If parsing fails, use empty set
          }
        }
        // Merge stored IDs with all current meal IDs (new meals default to completed)
        const allMealIds = new Set(meals.map(m => m.id));
        const updated = new Set([...storedIds, ...allMealIds]);
        localStorage.setItem('completedMeals', JSON.stringify(Array.from(updated)));
        return updated;
      });
    }
  }, [meals]);

  const toggleMealCompletion = (mealId: string) => {
    setCompletedMeals((prev) => {
      const next = new Set(prev);
      if (next.has(mealId)) {
        next.delete(mealId);
      } else {
        next.add(mealId);
      }
      localStorage.setItem('completedMeals', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Group meals by date
  const groupedMeals = useMemo(() => {
    const groups: Record<string, MealLog[]> = {};
    meals.forEach((meal) => {
      const date = format(parseISO(meal.eatenAt), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meal);
    });
    return groups;
  }, [meals]);

  // Filter meals by search query
  const filteredGroupedMeals = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedMeals;
    }
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, MealLog[]> = {};
    Object.entries(groupedMeals).forEach(([date, dateMeals]) => {
      const matching = dateMeals.filter(
        (meal) =>
          meal.mealName?.toLowerCase().includes(query) ||
          meal.mealType.toLowerCase().includes(query) ||
          meal.foods?.some((food) => food.name?.toLowerCase().includes(query))
      );
      if (matching.length > 0) {
        filtered[date] = matching;
      }
    });
    return filtered;
  }, [groupedMeals, searchQuery]);

  // Calculate daily totals
  const getDailyTotals = (dateMeals: MealLog[]) => {
    return dateMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.proteinGrams || 0),
        carbs: acc.carbs + (meal.carbsGrams || 0),
        fat: acc.fat + (meal.fatGrams || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  if (isLoading && meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400">Loading meal history...</p>
      </div>
    );
  }

  if (error && meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading History</h3>
        <p className="text-slate-400 text-center max-w-md mb-6">{error}</p>
        <motion.button
          onClick={fetchMeals}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      </div>
    );
  }

  const sortedDates = Object.keys(filteredGroupedMeals).sort((a, b) => b.localeCompare(a));

  if (sortedDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
          <Utensils className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Meal History Found</h3>
        <p className="text-slate-400 text-center max-w-md mb-6">
          {searchQuery
            ? "No meals match your search. Try adjusting your search or date range."
            : "No meals logged in the selected date range. Start logging meals to see your history here."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Meal History</h2>
          <p className="text-slate-400 text-sm">View and manage your nutrition meal logs</p>
        </div>
        <motion.button
          onClick={fetchMeals}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Range */}
        <div className="flex gap-2 flex-1">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={format(new Date(), "yyyy-MM-dd")}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by meal name, type, or food..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Meals List */}
      <div className="space-y-6">
        {sortedDates.map((date) => {
          const dateMeals = filteredGroupedMeals[date];
          const totals = getDailyTotals(dateMeals);
          const dateObj = parseISO(date);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
            >
              {/* Date Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">{formatSmartDate(dateObj)}</h3>
                  <span className="text-xs text-slate-500">
                    {format(dateObj, "EEEE")} • {dateMeals.length} meal{dateMeals.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span className="text-white font-medium">{Math.round(totals.calories)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Beef className="w-3 h-3 text-red-400" />
                    <span className="text-white font-medium">{Math.round(totals.protein)}g</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Wheat className="w-3 h-3 text-amber-400" />
                    <span className="text-white font-medium">{Math.round(totals.carbs)}g</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Apple className="w-3 h-3 text-purple-400" />
                    <span className="text-white font-medium">{Math.round(totals.fat)}g</span>
                  </div>
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-2">
                {dateMeals
                  .sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime())
                  .map((meal) => {
                    const clientMeal = transformApiMealToClient(meal);
                    const mealTime = format(parseISO(meal.eatenAt), "h:mm a");

                    return (
                      <motion.div
                        key={meal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start justify-between p-3 rounded-lg border transition-colors ${
                          completedMeals.has(meal.id)
                            ? "bg-slate-800/50 border-slate-700/30 hover:border-slate-600/50"
                            : "bg-slate-800/30 border-slate-700/20 hover:border-slate-600/30 opacity-75"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <label className="flex items-center pt-0.5 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={completedMeals.has(meal.id)}
                              onChange={() => toggleMealCompletion(meal.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Utensils className={`w-4 h-4 shrink-0 ${completedMeals.has(meal.id) ? "text-emerald-400" : "text-slate-500"}`} />
                              <h4 className={`text-sm font-medium truncate ${completedMeals.has(meal.id) ? "text-white" : "text-slate-400 line-through"}`}>
                                {meal.mealName || meal.mealType}
                              </h4>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {mealTime}
                              </span>
                            </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 ml-6">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-400" />
                              {meal.calories || 0} kcal
                            </span>
                            <span className="flex items-center gap-1">
                              <Beef className="w-3 h-3 text-red-400" />
                              P: {Math.round(meal.proteinGrams || 0)}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Wheat className="w-3 h-3 text-amber-400" />
                              C: {Math.round(meal.carbsGrams || 0)}g
                            </span>
                            <span className="flex items-center gap-1">
                              <Apple className="w-3 h-3 text-purple-400" />
                              F: {Math.round(meal.fatGrams || 0)}g
                            </span>
                          </div>
                            {meal.foods && meal.foods.length > 0 && (
                              <p className={`text-xs mt-1 ml-6 truncate ${completedMeals.has(meal.id) ? "text-slate-500" : "text-slate-600"}`}>
                                {meal.foods.slice(0, 3).map((f) => f.name).join(", ")}
                                {meal.foods.length > 3 && ` +${meal.foods.length - 3} more`}
                              </p>
                            )}
                          </div>
                        </div>
                        {(onEditMeal || onDeleteMeal) && (
                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            {onEditMeal && (
                              <button
                                onClick={() => onEditMeal(clientMeal)}
                                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Edit meal"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {onDeleteMeal && (
                              <button
                                onClick={() => onDeleteMeal(meal.id)}
                                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

