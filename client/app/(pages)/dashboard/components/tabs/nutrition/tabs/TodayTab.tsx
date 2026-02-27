"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Utensils,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  Flame,
  Beef,
  Wheat,
  Apple,
  Coffee,
  Sun,
  Sunset,
  Cookie,
} from "lucide-react";
import type { ClientMeal, WaterIntakeLog, ShoppingItem, MacroTarget } from "../types";
import { getFoodIcon } from "../constants";
import { formatTime } from "../utils";
import { WaterTracker } from "../WaterTracker";
import { ShoppingListWidget } from "../ShoppingListWidget";
import { ActivePlanWidget } from "../ActivePlanWidget";
import { AITipWidget } from "../AITipWidget";
import { MealSkeleton } from "../Skeletons";
import { DailyNutritionInsights } from "../DailyNutritionInsights";

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Sunset,
  snack: Cookie,
};

interface TodayTabProps {
  meals: ClientMeal[];
  mealsLoading: boolean;
  macros: Record<string, MacroTarget>;
  activePlan: { name: string; targetCalories: number; targetProtein: number; mealsPerDay: number } | null | undefined;
  waterLog: WaterIntakeLog | null;
  waterLoading: boolean;
  waterUpdating: boolean;
  shoppingItems: ShoppingItem[];
  shoppingLoading: boolean;
  expandedMeal: string | null;
  onMealExpand: (mealId: string | null) => void;
  onAddMeal: () => void;
  onEditMeal: (meal: ClientMeal) => void;
  onDeleteMeal: (mealId: string) => void;
  onAddWater: () => void;
  onRemoveWater: () => void;
  onShoppingItemToggle: (itemId: string) => void;
  onShoppingItemEdit: (item: ShoppingItem) => void;
  onShoppingItemDelete: (itemId: string) => void;
  onShoppingAdd: () => void;
  onShoppingAIGenerate: () => void;
  onShoppingViewAll: () => void;
  onShoppingClearPurchased: () => void | Promise<void>;
}

export function TodayTab({
  meals,
  mealsLoading,
  macros,
  activePlan,
  waterLog,
  waterLoading,
  waterUpdating,
  shoppingItems,
  shoppingLoading,
  expandedMeal,
  onMealExpand,
  onAddMeal,
  onEditMeal,
  onDeleteMeal,
  onAddWater,
  onRemoveWater,
  onShoppingItemToggle,
  onShoppingItemEdit,
  onShoppingItemDelete,
  onShoppingAdd,
  onShoppingAIGenerate,
  onShoppingViewAll,
  onShoppingClearPurchased,
}: TodayTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid lg:grid-cols-3 gap-4 sm:gap-6"
    >
      {/* Meals List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Today&apos;s Meals</h3>
          <span className="text-sm text-slate-400">{meals.length} meals logged</span>
        </div>

        {mealsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <MealSkeleton key={i} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-8 text-center">
            <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h4 className="text-white font-medium mb-2">No meals logged today</h4>
            <p className="text-slate-400 text-sm mb-4">Start tracking your nutrition by adding meals</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddMeal}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
            >
              Add Your First Meal
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {meals.map((meal, index) => {
              const MealIcon = mealIcons[meal.icon];
              const isExpanded = expandedMeal === meal.id;
              return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-slate-800/50 border border-slate-700/50"
                >
                  <div
                    className="p-5 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl"
                    onClick={() => onMealExpand(isExpanded ? null : meal.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/20">
                        <MealIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{meal.name}</h4>
                          <span className="text-xs text-slate-500">{formatTime(meal.time)}</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-3 truncate">
                          {meal.items.map((i) => i.name).join(" • ")}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {meal.calories} kcal
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Beef className="w-3 h-3 text-red-400" />
                            {meal.protein}g protein
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Wheat className="w-3 h-3 text-amber-400" />
                            {meal.carbs}g carbs
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Apple className="w-3 h-3 text-purple-400" />
                            {meal.fat}g fat
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditMeal(meal);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMeal(meal.id);
                          }}
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-2 border-t border-slate-700/50">
                          <h5 className="text-sm font-medium text-slate-300 mb-3">Food Items</h5>
                          <div className="space-y-2">
                            {meal.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50"
                              >
                                <span className="text-xl shrink-0">{getFoodIcon(item.name)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">{item.name}</p>
                                  <p className="text-xs text-slate-500">{item.portion}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm text-orange-400">{item.calories} kcal</p>
                                  <p className="text-xs text-slate-500">
                                    P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Add Meal Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onAddMeal}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Log a Meal
        </motion.button>
      </div>

      {/* Side Panel */}
      <div className="space-y-4 min-w-0">
        <WaterTracker
          waterLog={waterLog}
          isLoading={waterLoading}
          isUpdating={waterUpdating}
          onAddGlass={onAddWater}
          onRemoveGlass={onRemoveWater}
        />

        <ShoppingListWidget
          items={shoppingItems}
          isLoading={shoppingLoading}
          onToggleItem={onShoppingItemToggle}
          onEditItem={onShoppingItemEdit}
          onDeleteItem={onShoppingItemDelete}
          onAddItem={onShoppingAdd}
          onGenerateWithAI={onShoppingAIGenerate}
          onViewAll={onShoppingViewAll}
          onClearPurchased={onShoppingClearPurchased}
        />

        {activePlan && (
          <ActivePlanWidget
            plan={activePlan}
          />
        )}

        <DailyNutritionInsights />

        <AITipWidget macros={macros} />
      </div>
    </motion.div>
  );
}

