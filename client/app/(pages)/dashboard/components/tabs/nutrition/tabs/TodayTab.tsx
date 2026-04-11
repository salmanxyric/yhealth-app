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
      <div className="lg:col-span-2 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] sm:text-[17px] font-bold text-white tracking-tight">Today&apos;s Meals</h3>
          <span className="text-[12px] text-slate-500 font-medium">{meals.length} logged</span>
        </div>

        {mealsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <MealSkeleton key={i} />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] p-6 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' }}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-4 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-emerald-400/60" />
            </div>
            <h4 className="text-white font-semibold text-[15px] mb-1.5">No meals logged today</h4>
            <p className="text-slate-400 text-[13px] mb-5">Start tracking your nutrition by adding meals</p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onAddMeal}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-[13px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
            >
              Add Your First Meal
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((meal, index) => {
              const MealIcon = mealIcons[meal.icon];
              const isExpanded = expandedMeal === meal.id;
              return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group rounded-xl border border-white/[0.06] overflow-hidden transition-colors hover:border-white/[0.1]"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div
                    className="p-3 sm:p-4 cursor-pointer transition-colors hover:bg-white/[0.02]"
                    onClick={() => onMealExpand(isExpanded ? null : meal.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                        <MealIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[13px] sm:text-[14px] text-white truncate">{meal.name}</h4>
                          <span className="text-[10px] sm:text-[11px] text-slate-500 shrink-0 font-medium">{formatTime(meal.time)}</span>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-orange-300/80 font-medium">
                            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {meal.calories}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-pink-300/80 font-medium">
                            <Beef className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {meal.protein}g
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-300/80 font-medium">
                            <Wheat className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {meal.carbs}g
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-purple-300/80 font-medium">
                            <Apple className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {meal.fat}g
                          </span>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-white/[0.04]">
                          <div className="flex items-center justify-between mb-2.5">
                            <h5 className="text-[12px] sm:text-[13px] font-medium text-slate-400 uppercase tracking-wider">Food Items</h5>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMeal(meal);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteMeal(meal.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {meal.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                              >
                                <span className="text-base sm:text-lg shrink-0">{getFoodIcon(item.name)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-white truncate font-medium">{item.name}</p>
                                  <p className="text-[10px] sm:text-[11px] text-slate-500">{item.portion}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[12px] sm:text-[13px] text-orange-400 font-semibold">{item.calories} kcal</p>
                                  <p className="text-[10px] text-slate-500">
                                    P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g
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
          whileHover={{ scale: 1.005, borderColor: 'rgba(16, 185, 129, 0.3)' }}
          whileTap={{ scale: 0.995 }}
          onClick={onAddMeal}
          className="w-full p-3.5 rounded-xl border border-dashed border-white/[0.08] hover:border-emerald-500/30 text-slate-500 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-[13px] font-medium"
        >
          <Plus className="w-4 h-4" />
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

