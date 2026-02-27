"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Utensils,
  Plus,
  Clock,
  Flame,
  Apple,
  Beef,
  Wheat,
  Sparkles,
  CheckCircle2,
  Circle,
  ShoppingCart,
  Salad,
  Cookie,
  Leaf,
  X,
  Trash2,
  Edit3,
  AlertCircle,
  Save,
  Search,
  Loader2,
  Wand2,
  Camera,
  Upload,
  Image as ImageIcon,
  VideoOff,
  BarChart3,
  Coffee,
  Sun,
  Sunset,
  Calendar,
  Tag,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { aiCoachService } from "@/src/shared/services/ai-coach.service";
import type { FoodAnalysisResult, NutritionLabelData } from "./nutrition/types";
import NutritionLabelResult from "./nutrition/NutritionLabelResult";
import { NutritionAnalytics } from "./nutrition/NutritionAnalytics";
import { api } from "@/lib/api-client";
import { nutritionService, DietPlan, MealLog, MealFood, Recipe, RecipeIngredient, RecipeInstruction } from "@/src/shared/services";
import { RecipeDetailsModal } from "./nutrition/RecipeDetailsModal";
import { TodayTab, PlansTab, RecipesTab } from "./nutrition/tabs";
import { MealHistoryTab } from "./nutrition/MealHistoryTab";
import { PRESET_FOODS, FOOD_CATEGORY_ICONS, getFoodIcon } from "./nutrition/constants";
import { CircularMetricCard } from "./overview/widgets/CircularMetricCard";
import type { HealthMetric } from "./overview/widgets/CircularHealthMetric";

// ============================================
// TYPES
// ============================================

interface MacroTarget {
  current: number;
  target: number;
  unit: string;
}

interface WaterIntakeLog {
  id: string;
  glassesConsumed: number;
  targetGlasses: number;
  mlConsumed: number;
  targetMl: number;
  goalAchieved: boolean;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  notes: string | null;
  source: "manual" | "ai_generated" | "diet_plan";
  isPurchased: boolean;
  priority: number;
  calories?: number | null; // Optional calories per item
}

// Client-side types for UI
interface ClientMeal {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: MealFood[];
  completed: boolean;
  icon: "breakfast" | "lunch" | "dinner" | "snack";
  mealType: string;
}

interface ClientDietPlan {
  id: string;
  name: string;
  type: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealsPerDay: number;
  createdAt: string;
  isActive: boolean;
  description?: string;
}

// ============================================
// CONSTANTS
// ============================================

const mealIconsList = [
  { id: "breakfast", icon: Coffee, label: "Breakfast" },
  { id: "lunch", icon: Sun, label: "Lunch" },
  { id: "dinner", icon: Sunset, label: "Dinner" },
  { id: "snack", icon: Cookie, label: "Snack" },
];

const dietTypes = [
  { id: "balanced", label: "Balanced", description: "Equal macros distribution" },
  { id: "high_protein", label: "High Protein", description: "For muscle building" },
  { id: "low_carb", label: "Low Carb", description: "Reduce carbohydrates" },
  { id: "keto", label: "Keto", description: "Very low carb, high fat" },
  { id: "vegan", label: "Vegan", description: "Plant-based only" },
  { id: "mediterranean", label: "Mediterranean", description: "Heart-healthy diet" },
];

const SHOPPING_CATEGORIES = [
  { id: "produce", label: "Produce", color: "text-green-400" },
  { id: "protein", label: "Protein", color: "text-red-400" },
  { id: "dairy", label: "Dairy", color: "text-blue-400" },
  { id: "grains", label: "Grains", color: "text-amber-400" },
  { id: "pantry", label: "Pantry", color: "text-orange-400" },
  { id: "beverages", label: "Beverages", color: "text-cyan-400" },
  { id: "frozen", label: "Frozen", color: "text-indigo-400" },
  { id: "other", label: "Other", color: "text-slate-400" },
];

// Skeleton components are in nutrition/Skeletons.tsx

// ============================================
// HELPER FUNCTIONS
// ============================================

function transformApiPlanToClient(plan: DietPlan): ClientDietPlan {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.goalCategory || 'balanced',
    targetCalories: plan.dailyCalories || 2000,
    targetProtein: plan.proteinGrams || 120,
    targetCarbs: plan.carbsGrams || 200,
    targetFat: plan.fatGrams || 65,
    mealsPerDay: plan.mealsPerDay || 3,
    createdAt: plan.createdAt.split('T')[0],
    isActive: plan.status === 'active',
    description: plan.description || undefined,
  };
}

function transformApiMealToClient(meal: MealLog): ClientMeal {
  const mealTypeToIcon: Record<string, "breakfast" | "lunch" | "dinner" | "snack"> = {
    breakfast: "breakfast",
    lunch: "lunch",
    dinner: "dinner",
    snack: "snack",
  };
  const eatenAt = new Date(meal.eatenAt);
  // Use local time (hours and minutes) for display
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

// formatTime moved to nutrition/utils.ts

// ============================================
// MAIN COMPONENT
// ============================================

export function NutritionTab() {
  const [activeView, setActiveView] = useState<"today" | "plan" | "recipes" | "analytics" | "history">("today");

  // Diet Plans State
  const [dietPlans, setDietPlans] = useState<ClientDietPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansSaving, setPlansSaving] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  // Meals State
  const [meals, setMeals] = useState<ClientMeal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [mealsSaving, setMealsSaving] = useState(false);

  // Water intake state
  const [waterLog, setWaterLog] = useState<WaterIntakeLog | null>(null);
  const [waterLoading, setWaterLoading] = useState(true);
  const [waterUpdating, setWaterUpdating] = useState(false);

  // Shopping list state
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [shoppingLoading, setShoppingLoading] = useState(true);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showViewAllShoppingModal, setShowViewAllShoppingModal] = useState(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingItem | null>(null);
  const [shoppingAiPrompt, setShoppingAiPrompt] = useState("");
  const [shoppingAiGenerating, setShoppingAiGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // Shopping form state
  const [shoppingFormData, setShoppingFormData] = useState({
    name: "",
    quantity: "",
    category: "other",
    notes: "",
    calories: "",
  });

  // Recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesSaving, setRecipesSaving] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [recipeFilterCategory, setRecipeFilterCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Recipe form state
  const [recipeFormData, setRecipeFormData] = useState<{
    name: string;
    description: string;
    category: string;
    cuisine: string;
    servings: number;
    caloriesPerServing: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: string;
    ingredients: RecipeIngredient[];
    instructions: RecipeInstruction[];
    tags: string[];
    dietaryFlags: string[];
  }>({
    name: "",
    description: "",
    category: "other",
    cuisine: "",
    servings: 2,
    caloriesPerServing: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    fiberGrams: 0,
    prepTimeMinutes: 0,
    cookTimeMinutes: 0,
    difficulty: "medium",
    ingredients: [],
    instructions: [],
    tags: [],
    dietaryFlags: [],
  });

  // Modal states
  const [showCreateMealModal, setShowCreateMealModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<ClientMeal | null>(null);
  const [editingPlan, setEditingPlan] = useState<ClientDietPlan | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // Form states for meal
  const [mealFormData, setMealFormData] = useState<{
    name: string;
    time: string;
    icon: "breakfast" | "lunch" | "dinner" | "snack";
    items: (MealFood & { eaten?: boolean })[];
    originalDate?: Date; // Store original meal date for time updates
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    manualMacros?: boolean; // Flag to indicate manual override
  }>({
    name: "",
    time: "12:00",
    icon: "lunch",
    items: [],
    manualMacros: false,
  });

  // Form states for diet plan
  const [planFormData, setPlanFormData] = useState({
    name: "",
    type: "balanced",
    description: "",
    targetCalories: 2000,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 65,
    mealsPerDay: 4,
  });

  // Food search
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // AI Generation states
  const [, setAiTips] = useState<string | string[]>("");

  // AI Meal generation in modal
  const [aiMealDescription, setAiMealDescription] = useState("");
  const [aiMealGenerating, setAiMealGenerating] = useState(false);
  const [aiMealError, setAiMealError] = useState<string | null>(null);

  // Image capture/analysis states (for meals)
  const [imageCaptureMode, setImageCaptureMode] = useState<"camera" | "upload">("upload");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [imageAnalysisError, setImageAnalysisError] = useState<string | null>(null);
  const [mealImageDescription, setMealImageDescription] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Nutrition label scan states
  const [imageScanMode, setImageScanMode] = useState<'food' | 'label'>('food');
  const [nutritionLabelData, setNutritionLabelData] = useState<NutritionLabelData | null>(null);

  // Image capture/analysis states (for recipes)
  const [recipeImageCaptureMode, setRecipeImageCaptureMode] = useState<"camera" | "upload">("upload");
  const [recipeCapturedImage, setRecipeCapturedImage] = useState<string | null>(null);
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [isAnalyzingRecipeImage, setIsAnalyzingRecipeImage] = useState(false);
  const [recipeImageAnalysisResult, setRecipeImageAnalysisResult] = useState<string | null>(null);
  const [recipeImageAnalysisError, setRecipeImageAnalysisError] = useState<string | null>(null);
  const [isRecipeCameraActive, setIsRecipeCameraActive] = useState(false);
  const recipeVideoRef = useRef<HTMLVideoElement>(null);
  const recipeCanvasRef = useRef<HTMLCanvasElement>(null);
  const recipeFileInputRef = useRef<HTMLInputElement>(null);
  const recipeStreamRef = useRef<MediaStream | null>(null);

  // ============================================
  // API CALLS - DIET PLANS
  // ============================================

  const fetchDietPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const response = await nutritionService.getPlans();
      if (response.success && response.data?.plans) {
        setDietPlans(response.data.plans.map(transformApiPlanToClient));
      }
    } catch (error) {
      console.error("Failed to fetch diet plans:", error);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const createDietPlan = async () => {
    if (!planFormData.name.trim()) return;
    setPlansSaving(true);
    try {
      const response = await nutritionService.createPlan({
        name: planFormData.name.trim(),
        description: planFormData.description || undefined,
        goalCategory: planFormData.type,
        dailyCalories: planFormData.targetCalories,
        proteinGrams: planFormData.targetProtein,
        carbsGrams: planFormData.targetCarbs,
        fatGrams: planFormData.targetFat,
        mealsPerDay: planFormData.mealsPerDay,
        isActive: dietPlans.length === 0,
      });
      if (response.success && response.data?.plan) {
        setDietPlans((prev) => [transformApiPlanToClient(response.data!.plan), ...prev]);
        setShowCreatePlanModal(false);
        resetPlanForm();
      }
    } catch (error) {
      console.error("Failed to create diet plan:", error);
    } finally {
      setPlansSaving(false);
    }
  };

  const updateDietPlan = async () => {
    if (!editingPlan || !planFormData.name.trim()) return;
    setPlansSaving(true);
    try {
      const response = await nutritionService.updatePlan(editingPlan.id, {
        name: planFormData.name.trim(),
        description: planFormData.description || undefined,
        goalCategory: planFormData.type,
        dailyCalories: planFormData.targetCalories,
        proteinGrams: planFormData.targetProtein,
        carbsGrams: planFormData.targetCarbs,
        fatGrams: planFormData.targetFat,
        mealsPerDay: planFormData.mealsPerDay,
      });
      if (response.success && response.data?.plan) {
        setDietPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? transformApiPlanToClient(response.data!.plan) : p))
        );
        setShowCreatePlanModal(false);
        setEditingPlan(null);
        resetPlanForm();
      }
    } catch (error) {
      console.error("Failed to update diet plan:", error);
    } finally {
      setPlansSaving(false);
    }
  };

  const deleteDietPlan = async (planId: string) => {
    try {
      const response = await nutritionService.deletePlan(planId);
      if (response.success) {
        setDietPlans((prev) => prev.filter((p) => p.id !== planId));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete diet plan:", error);
    }
  };

  const deleteSelectedPlans = async () => {
    if (selectedPlanIds.size === 0) return;
    try {
      const response = await nutritionService.deletePlans(Array.from(selectedPlanIds));
      if (response.success) {
        setDietPlans((prev) => prev.filter((p) => !selectedPlanIds.has(p.id)));
        setSelectedPlanIds(new Set());
      }
    } catch (error) {
      console.error("Failed to delete selected plans:", error);
    }
  };

  const activateDietPlan = async (planId: string) => {
    try {
      const response = await nutritionService.activatePlan(planId);
      if (response.success && response.data?.plan) {
        setDietPlans((prev) =>
          prev.map((p) => ({
            ...p,
            isActive: p.id === planId,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to activate diet plan:", error);
    }
  };

  // Generate AI-powered diet plan from onboarding data
  const [aiPlanGenerating, setAiPlanGenerating] = useState(false);
  const generateAIDietPlan = async () => {
    setAiPlanGenerating(true);
    try {
      // Call the generate-onboarding-plans API which will use stored onboarding data
      const response = await api.post<{
        dietPlan: {
          id: string;
          name: string;
          description: string;
          dailyCalories: number;
          proteinGrams: number;
          carbsGrams: number;
          fatGrams: number;
          mealsPerDay: number;
          goalCategory: string;
        };
        workoutPlan: unknown;
        overallAnalysis: unknown;
      }>('/plans/generate-onboarding-plans', {});

      if (response.success && response.data?.dietPlan) {
        // Refresh the diet plans list
        await fetchDietPlans();
        console.log('[NutritionTab] AI diet plan generated:', response.data.dietPlan);
      }
    } catch (error) {
      console.error("Failed to generate AI diet plan:", error);
    } finally {
      setAiPlanGenerating(false);
    }
  };

  // ============================================
  // API CALLS - MEALS
  // ============================================

  // Store original meal data for editing
  const [originalMealData, setOriginalMealData] = useState<Map<string, MealLog>>(new Map());

  const fetchMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await nutritionService.getMeals({ date: today });
      if (response.success && response.data?.meals) {
        const clientMeals = response.data.meals.map(transformApiMealToClient);
        setMeals(clientMeals);
        // Store original meal data for editing
        const mealMap = new Map<string, MealLog>();
        response.data.meals.forEach((meal: MealLog) => {
          mealMap.set(meal.id, meal);
        });
        setOriginalMealData(mealMap);
      }
    } catch (error) {
      console.error("Failed to fetch meals:", error);
    } finally {
      setMealsLoading(false);
    }
  }, []);

  const createMeal = async () => {
    if (!mealFormData.name.trim()) return;
    // Allow meals with no foods if manual macros are set
    if (!mealFormData.manualMacros && mealFormData.items.length === 0) return;
    
    setMealsSaving(true);
    try {
      // Only include eaten foods
      const eatenFoods = mealFormData.items.filter((item) => item.eaten !== false);
      
      // Calculate totals from foods (for fallback or when not using manual macros)
      const totals = eatenFoods.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Use manual macros if enabled, otherwise use calculated totals
      const finalCalories = mealFormData.manualMacros && mealFormData.calories !== undefined 
        ? mealFormData.calories 
        : totals.calories;
      const finalProtein = mealFormData.manualMacros && mealFormData.proteinGrams !== undefined 
        ? mealFormData.proteinGrams 
        : totals.protein;
      const finalCarbs = mealFormData.manualMacros && mealFormData.carbsGrams !== undefined 
        ? mealFormData.carbsGrams 
        : totals.carbs;
      const finalFat = mealFormData.manualMacros && mealFormData.fatGrams !== undefined 
        ? mealFormData.fatGrams 
        : totals.fat;

      // Create a proper time for eatenAt - use today's date for new meals
      const now = new Date();
      const timeStr = mealFormData.time.trim();
      
      // Parse time (HTML5 time input returns HH:MM format)
      let hours: number, minutes: number;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // Handle 12-hour format
        const [timePart, period] = timeStr.split(/\s*(AM|PM)/i);
        const [h, m] = timePart.split(':').map(Number);
        hours = period.toUpperCase() === 'PM' 
          ? (h === 12 ? 12 : h + 12)
          : (h === 12 ? 0 : h);
        minutes = m || 0;
      } else {
        // Handle 24-hour format (HH:MM)
        const [h, m] = timeStr.split(':').map(Number);
        hours = h || 0;
        minutes = m || 0;
      }
      
      // Ensure valid hours and minutes
      hours = Math.max(0, Math.min(23, hours));
      minutes = Math.max(0, Math.min(59, minutes));
      
      // Set the time in local timezone
      now.setHours(hours, minutes, 0, 0);
      
      // Convert to ISO string (UTC) - this preserves the exact moment in time
      // The server will parse this correctly and store it, and when we read it back,
      // it will be converted to local time for display
      const eatenAtISO = now.toISOString();

      // Remove the 'eaten' field before sending to API (eaten is intentionally destructured to remove it)
      const foodsToSend = eatenFoods.map(({ eaten: _eaten, ...food }) => food);

      const response = await nutritionService.logMeal({
        mealType: mealFormData.icon,
        mealName: mealFormData.name.trim(),
        calories: finalCalories,
        proteinGrams: finalProtein,
        carbsGrams: finalCarbs,
        fatGrams: finalFat,
        foods: foodsToSend,
        eatenAt: eatenAtISO,
      });

      if (response.success && response.data?.meal) {
        const newMeal = transformApiMealToClient(response.data.meal);
        setMeals((prev) => [...prev, newMeal].sort((a, b) => a.time.localeCompare(b.time)));
        setShowCreateMealModal(false);
        resetMealForm();
      }
    } catch (error) {
      console.error("Failed to create meal:", error);
    } finally {
      setMealsSaving(false);
    }
  };

  const updateMeal = async () => {
    if (!editingMeal || !mealFormData.name.trim()) return;
    
    setMealsSaving(true);
    try {
      // Only include eaten foods (if any)
      const eatenFoods = mealFormData.items.filter((item) => item.eaten !== false);
      
      // Calculate totals only if there are foods
      const totals = eatenFoods.length > 0
        ? eatenFoods.reduce(
            (acc, item) => ({
              calories: acc.calories + item.calories,
              protein: acc.protein + item.protein,
              carbs: acc.carbs + item.carbs,
              fat: acc.fat + item.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      // Create a proper time for eatenAt - preserve original date if editing, otherwise use today
      const baseDate = mealFormData.originalDate || new Date();
      
      // Parse time string (format: HH:MM or HH:MM AM/PM)
      let hours: number, minutes: number;
      const timeStr = mealFormData.time.trim();
      
      // Check if time includes AM/PM
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // Handle 12-hour format
        const [timePart, period] = timeStr.split(/\s*(AM|PM)/i);
        const [h, m] = timePart.split(':').map(Number);
        hours = period.toUpperCase() === 'PM' 
          ? (h === 12 ? 12 : h + 12)
          : (h === 12 ? 0 : h);
        minutes = m || 0;
      } else {
        // Handle 24-hour format (HH:MM) - HTML5 time input returns this format
        const [h, m] = timeStr.split(':').map(Number);
        hours = h || 0;
        minutes = m || 0;
      }
      
      // Ensure valid hours and minutes
      hours = Math.max(0, Math.min(23, hours));
      minutes = Math.max(0, Math.min(59, minutes));
      
      // Create date in local timezone with the selected time
      // Use UTC methods to avoid timezone conversion issues
      const eatenAtDate = new Date(baseDate);
      // Set hours and minutes in local timezone
      eatenAtDate.setHours(hours, minutes, 0, 0);
      
      // Convert to ISO string (UTC) - this preserves the exact moment in time
      // The server will parse this correctly and store it, and when we read it back,
      // it will be converted to local time for display
      const eatenAtISO = eatenAtDate.toISOString();
      
      // Debug logging
      if (process.env.NODE_ENV === "development") {
        console.log("[updateMeal] Time conversion:", {
          selectedTime: mealFormData.time,
          parsedHours: hours,
          parsedMinutes: minutes,
          baseDate: baseDate.toISOString(),
          localDate: eatenAtDate.toString(),
          isoString: eatenAtISO,
          localHours: eatenAtDate.getHours(),
          utcHours: eatenAtDate.getUTCHours(),
          timezoneOffset: eatenAtDate.getTimezoneOffset(),
        });
      }

      // Use manual macros if enabled, otherwise use calculated totals
      const finalCalories = mealFormData.manualMacros && mealFormData.calories !== undefined 
        ? mealFormData.calories 
        : totals.calories;
      const finalProtein = mealFormData.manualMacros && mealFormData.proteinGrams !== undefined 
        ? mealFormData.proteinGrams 
        : totals.protein;
      const finalCarbs = mealFormData.manualMacros && mealFormData.carbsGrams !== undefined 
        ? mealFormData.carbsGrams 
        : totals.carbs;
      const finalFat = mealFormData.manualMacros && mealFormData.fatGrams !== undefined 
        ? mealFormData.fatGrams 
        : totals.fat;

      // Build update payload - only include fields that should be updated
      const updatePayload: {
        mealType: string;
        mealName: string;
        eatenAt: string;
        calories?: number;
        proteinGrams?: number;
        carbsGrams?: number;
        fatGrams?: number;
        foods?: MealFood[];
      } = {
        mealType: mealFormData.icon,
        mealName: mealFormData.name.trim(),
        eatenAt: eatenAtISO,
        calories: finalCalories,
        proteinGrams: finalProtein,
        carbsGrams: finalCarbs,
        fatGrams: finalFat,
      };

      // Include foods if there are any
      if (eatenFoods.length > 0) {
        // Remove the 'eaten' field before sending to API
        const foodsToSend = eatenFoods.map(({ eaten: _eaten, ...food }) => food);
        updatePayload.foods = foodsToSend;
      }

      const response = await nutritionService.updateMeal(editingMeal.id, updatePayload);

      if (response.success && response.data?.meal) {
        const updatedMeal = transformApiMealToClient(response.data.meal);
        setMeals((prev) =>
          prev.map((m) => (m.id === editingMeal.id ? updatedMeal : m))
            .sort((a, b) => a.time.localeCompare(b.time))
        );
        // Update originalMealData
        setOriginalMealData((prev) => {
          const next = new Map(prev);
          next.set(response.data!.meal.id, response.data!.meal);
          return next;
        });
        setShowCreateMealModal(false);
        setEditingMeal(null);
        resetMealForm();
      }
    } catch (error) {
      console.error("Failed to update meal:", error);
    } finally {
      setMealsSaving(false);
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      const response = await nutritionService.deleteMeal(mealId);
      if (response.success) {
        setMeals((prev) => prev.filter((m) => m.id !== mealId));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete meal:", error);
    }
  };

  // Generate meal with AI based on description
  const generateMealWithAI = async () => {
    if (!aiMealDescription.trim()) {
      setAiMealError("Please enter a meal description");
      return;
    }

    setAiMealGenerating(true);
    setAiMealError(null);

    try {
      const response = await nutritionService.generateMealWithAI({
        description: aiMealDescription.trim(),
        mealType: mealFormData.icon,
        dietaryPreferences: [],
      });

      if (response.success && response.data?.meal) {
        const meal = response.data.meal;
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 9);

        // Auto-fill the form with AI-generated data
        setMealFormData((prev) => ({
          ...prev,
          name: meal.mealName || prev.name || "AI Generated Meal",
          items: (meal.foods || []).map((food, idx) => {
            const foodObj = typeof food === 'object' && food !== null ? food : { name: String(food) };
            const foodName = (foodObj as { name?: string }).name || 'Food item';
            const foodPortion = (foodObj as { portion?: string }).portion || '1 serving';
            
            // Get nutrition values from food object or try to find in preset foods
            let calories = (foodObj as { calories?: number }).calories || 0;
            let protein = (foodObj as { protein?: number }).protein || 0;
            let carbs = (foodObj as { carbs?: number }).carbs || 0;
            let fat = (foodObj as { fat?: number }).fat || 0;
            
            // If nutrition values are missing, try to find them in preset foods
            if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
              const presetFood = findFoodNutrition(foodName);
              if (presetFood) {
                calories = presetFood.calories || 0;
                protein = presetFood.protein || 0;
                carbs = presetFood.carbs || 0;
                fat = presetFood.fat || 0;
                // Use preset portion if available
                if (!foodPortion || foodPortion === '1 serving') {
                  // Keep the original portion or use preset
                }
              }
            }
            
            return {
              id: `ai-${timestamp}-${randomId}-${idx}`,
              name: foodName,
              calories,
              protein,
              carbs,
              fat,
              portion: foodPortion,
              eaten: true, // Mark AI-generated items as eaten by default
            };
          }),
        }));

        // Clear the AI description after successful generation
        setAiMealDescription("");

        // Show preparation tips if available
        if (response.data.preparationTips) {
          setAiTips(response.data.preparationTips);
        }
      }
    } catch (error) {
      console.error("Failed to generate meal with AI:", error);
      setAiMealError("Failed to generate meal. Please try again.");
    } finally {
      setAiMealGenerating(false);
    }
  };

  // ============================================
  // API CALLS - WATER
  // ============================================

  const fetchWaterLog = useCallback(async () => {
    try {
      const response = await api.get<{ log: WaterIntakeLog }>("/water/today");
      if (response.success && response.data) {
        setWaterLog(response.data.log);
      }
    } catch (error) {
      console.error("Failed to fetch water log:", error);
    } finally {
      setWaterLoading(false);
    }
  }, []);

  const addWaterGlass = async () => {
    if (waterUpdating) return;
    setWaterUpdating(true);
    try {
      const response = await api.post<{ log: WaterIntakeLog }>("/water/add-glass");
      if (response.success && response.data) {
        setWaterLog(response.data.log);
      }
    } catch (error) {
      console.error("Failed to add water:", error);
    } finally {
      setWaterUpdating(false);
    }
  };

  const removeWaterGlass = async () => {
    if (waterUpdating || !waterLog || waterLog.glassesConsumed <= 0) return;
    setWaterUpdating(true);
    try {
      const response = await api.post<{ log: WaterIntakeLog }>("/water/remove", { amountMl: 250 });
      if (response.success && response.data) {
        setWaterLog(response.data.log);
      }
    } catch (error) {
      console.error("Failed to remove water:", error);
    } finally {
      setWaterUpdating(false);
    }
  };

  // ============================================
  // API CALLS - SHOPPING
  // ============================================

  const fetchShoppingList = useCallback(async () => {
    try {
      const response = await api.get<{ items: ShoppingItem[]; total: number }>("/shopping-list");
      if (response.success && response.data) {
        setShoppingItems(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch shopping list:", error);
    } finally {
      setShoppingLoading(false);
    }
  }, []);

  const createShoppingItem = async () => {
    if (!shoppingFormData.name.trim()) return;
    try {
      const response = await api.post<{ item: ShoppingItem }>("/shopping-list", {
        name: shoppingFormData.name.trim(),
        quantity: shoppingFormData.quantity || null,
        category: shoppingFormData.category,
        notes: shoppingFormData.notes || null,
        calories: shoppingFormData.calories ? parseInt(shoppingFormData.calories) || null : null,
      });
      if (response.success && response.data) {
        setShoppingItems((prev) => [response.data!.item, ...prev]);
        resetShoppingForm();
        setShowShoppingModal(false);
      }
    } catch (error) {
      console.error("Failed to create shopping item:", error);
    }
  };

  const updateShoppingItem = async () => {
    if (!editingShoppingItem || !shoppingFormData.name.trim()) return;
    try {
      const response = await api.patch<{ item: ShoppingItem }>(
        `/shopping-list/${editingShoppingItem.id}`,
        {
          name: shoppingFormData.name.trim(),
          quantity: shoppingFormData.quantity || null,
          category: shoppingFormData.category,
          notes: shoppingFormData.notes || null,
          calories: shoppingFormData.calories ? parseInt(shoppingFormData.calories) || null : null,
        }
      );
      if (response.success && response.data) {
        setShoppingItems((prev) =>
          prev.map((item) => (item.id === editingShoppingItem.id ? response.data!.item : item))
        );
        resetShoppingForm();
        setEditingShoppingItem(null);
        setShowShoppingModal(false);
      }
    } catch (error) {
      console.error("Failed to update shopping item:", error);
    }
  };

  const toggleShoppingItem = async (itemId: string) => {
    try {
      const response = await api.patch<{ item: ShoppingItem }>(`/shopping-list/${itemId}/toggle`);
      if (response.success && response.data) {
        setShoppingItems((prev) =>
          prev.map((item) => (item.id === itemId ? response.data!.item : item))
        );
      }
    } catch (error) {
      console.error("Failed to toggle shopping item:", error);
    }
  };

  const deleteShoppingItem = async (itemId: string) => {
    try {
      const response = await api.delete(`/shopping-list/${itemId}`);
      if (response.success) {
        setShoppingItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete shopping item:", error);
    }
  };

  const clearPurchasedItems = async () => {
    try {
      const response = await api.delete<{ deletedCount: number }>("/shopping-list/clear/purchased");
      if (response.success) {
        setShoppingItems((prev) => prev.filter((item) => !item.isPurchased));
      }
    } catch (error) {
      console.error("Failed to clear purchased items:", error);
    }
  };

  const generateShoppingWithAI = async () => {
    if (!shoppingAiPrompt.trim() || shoppingAiGenerating) return;
    setShoppingAiGenerating(true);
    setAiResponse("");
    try {
      const response = await api.post<{ items: ShoppingItem[]; aiResponse: string }>(
        "/shopping-list/generate",
        { description: shoppingAiPrompt.trim() }
      );
      if (response.success && response.data) {
        setShoppingItems((prev) => [...response.data!.items, ...prev]);
        setAiResponse(response.data.aiResponse || `Added ${response.data.items.length} items!`);
        setShoppingAiPrompt("");
      }
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      setAiResponse("Failed to generate. Please try again.");
    } finally {
      setShoppingAiGenerating(false);
    }
  };

  // ============================================
  // API CALLS - RECIPES
  // ============================================

  const fetchRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const response = await nutritionService.getRecipes({
        category: recipeFilterCategory || undefined,
        favorite: showFavoritesOnly || undefined,
      });
      if (response.success && response.data?.recipes) {
        setRecipes(response.data.recipes);
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
    } finally {
      setRecipesLoading(false);
    }
  }, [recipeFilterCategory, showFavoritesOnly]);

  const createRecipe = async () => {
    if (!recipeFormData.name.trim()) return;
    setRecipesSaving(true);
    try {
      const response = await nutritionService.createRecipe({
        name: recipeFormData.name.trim(),
        description: recipeFormData.description || undefined,
        category: recipeFormData.category,
        cuisine: recipeFormData.cuisine || undefined,
        servings: recipeFormData.servings,
        caloriesPerServing: recipeFormData.caloriesPerServing || undefined,
        proteinGrams: recipeFormData.proteinGrams || undefined,
        carbsGrams: recipeFormData.carbsGrams || undefined,
        fatGrams: recipeFormData.fatGrams || undefined,
        fiberGrams: recipeFormData.fiberGrams || undefined,
        prepTimeMinutes: recipeFormData.prepTimeMinutes || undefined,
        cookTimeMinutes: recipeFormData.cookTimeMinutes || undefined,
        totalTimeMinutes: (recipeFormData.prepTimeMinutes || 0) + (recipeFormData.cookTimeMinutes || 0) || undefined,
        difficulty: recipeFormData.difficulty,
        ingredients: recipeFormData.ingredients,
        instructions: recipeFormData.instructions,
        tags: recipeFormData.tags,
        dietaryFlags: recipeFormData.dietaryFlags,
      });
      if (response.success && response.data?.recipe) {
        setRecipes((prev) => [response.data!.recipe, ...prev]);
        setShowCreateRecipeModal(false);
        resetRecipeForm();
      }
    } catch (error) {
      console.error("Failed to create recipe:", error);
    } finally {
      setRecipesSaving(false);
    }
  };

  const updateRecipe = async () => {
    if (!editingRecipe || !recipeFormData.name.trim()) return;
    setRecipesSaving(true);
    try {
      const response = await nutritionService.updateRecipe(editingRecipe.id, {
        name: recipeFormData.name.trim(),
        description: recipeFormData.description || undefined,
        category: recipeFormData.category,
        cuisine: recipeFormData.cuisine || undefined,
        servings: recipeFormData.servings,
        caloriesPerServing: recipeFormData.caloriesPerServing || undefined,
        proteinGrams: recipeFormData.proteinGrams || undefined,
        carbsGrams: recipeFormData.carbsGrams || undefined,
        fatGrams: recipeFormData.fatGrams || undefined,
        fiberGrams: recipeFormData.fiberGrams || undefined,
        prepTimeMinutes: recipeFormData.prepTimeMinutes || undefined,
        cookTimeMinutes: recipeFormData.cookTimeMinutes || undefined,
        totalTimeMinutes: (recipeFormData.prepTimeMinutes || 0) + (recipeFormData.cookTimeMinutes || 0) || undefined,
        difficulty: recipeFormData.difficulty,
        ingredients: recipeFormData.ingredients,
        instructions: recipeFormData.instructions,
        tags: recipeFormData.tags,
        dietaryFlags: recipeFormData.dietaryFlags,
      });
      if (response.success && response.data?.recipe) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === editingRecipe.id ? response.data!.recipe : r))
        );
        setShowCreateRecipeModal(false);
        setEditingRecipe(null);
        resetRecipeForm();
      }
    } catch (error) {
      console.error("Failed to update recipe:", error);
    } finally {
      setRecipesSaving(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const response = await nutritionService.deleteRecipe(recipeId);
      if (response.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };

  const deleteSelectedRecipes = async () => {
    if (selectedRecipeIds.size === 0) return;
    try {
      const response = await nutritionService.deleteRecipes(Array.from(selectedRecipeIds));
      if (response.success) {
        setRecipes((prev) => prev.filter((r) => !selectedRecipeIds.has(r.id)));
        setSelectedRecipeIds(new Set());
      }
    } catch (error) {
      console.error("Failed to delete selected recipes:", error);
    }
  };

  const toggleRecipeFavorite = async (recipeId: string) => {
    try {
      const response = await nutritionService.toggleRecipeFavorite(recipeId);
      if (response.success && response.data?.recipe) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === recipeId ? response.data!.recipe : r))
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // ============================================
  // FORM HELPERS
  // ============================================

  const resetMealForm = () => {
    setMealFormData({
      name: "",
      time: "12:00",
      icon: "lunch",
      items: [],
      originalDate: undefined,
      calories: undefined,
      proteinGrams: undefined,
      carbsGrams: undefined,
      fatGrams: undefined,
      manualMacros: false,
    });
    setFoodSearch("");
    setSelectedCategory(null);
    // Reset AI meal generation states
    setAiMealDescription("");
    setAiMealError(null);
    // Reset image capture states
    setCapturedImage(null);
    setImageFile(null);
    setImageAnalysisResult(null);
    setImageAnalysisError(null);
    setMealImageDescription("");
    setImageScanMode('food');
    setNutritionLabelData(null);
    stopCamera();
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      type: "balanced",
      description: "",
      targetCalories: 2000,
      targetProtein: 120,
      targetCarbs: 200,
      targetFat: 65,
      mealsPerDay: 4,
    });
  };

  const resetShoppingForm = () => {
    setShoppingFormData({
      name: "",
      quantity: "",
      category: "other",
      notes: "",
      calories: "",
    });
  };

  const resetRecipeForm = () => {
    setRecipeFormData({
      name: "",
      description: "",
      category: "other",
      cuisine: "",
      servings: 2,
      caloriesPerServing: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      difficulty: "medium",
      ingredients: [],
      instructions: [],
      tags: [],
      dietaryFlags: [],
    });
    // Reset recipe image capture states
    setRecipeCapturedImage(null);
    setRecipeImageFile(null);
    setRecipeImageAnalysisResult(null);
    setRecipeImageAnalysisError(null);
    stopRecipeCamera();
  };

  const openEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeFormData({
      name: recipe.name,
      description: recipe.description || "",
      category: recipe.category,
      cuisine: recipe.cuisine || "",
      servings: recipe.servings,
      caloriesPerServing: recipe.caloriesPerServing || 0,
      proteinGrams: recipe.proteinGrams || 0,
      carbsGrams: recipe.carbsGrams || 0,
      fatGrams: recipe.fatGrams || 0,
      fiberGrams: recipe.fiberGrams || 0,
      prepTimeMinutes: recipe.prepTimeMinutes || 0,
      cookTimeMinutes: recipe.cookTimeMinutes || 0,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags,
      dietaryFlags: recipe.dietaryFlags,
    });
    setShowCreateRecipeModal(true);
  };

  const openEditMeal = (meal: ClientMeal) => {
    setEditingMeal(meal);
    // Get original meal data to preserve the eatenAt date
    const originalMeal = originalMealData.get(meal.id);
    const originalDate = originalMeal ? new Date(originalMeal.eatenAt) : new Date();
    
    // Calculate totals from food items to detect if macros were manually set
    const calculatedTotals = meal.items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    // Check if stored values differ significantly from calculated (within 1% tolerance for floating point)
    const tolerance = 0.01;
    const hasManualMacros = 
      meal.items.length === 0 || // No foods means manual macros
      Math.abs(meal.calories - calculatedTotals.calories) > tolerance ||
      Math.abs(meal.protein - calculatedTotals.protein) > tolerance ||
      Math.abs(meal.carbs - calculatedTotals.carbs) > tolerance ||
      Math.abs(meal.fat - calculatedTotals.fat) > tolerance;
    
    setMealFormData({
      name: meal.name,
      time: meal.time, // Already in HH:MM format
      icon: meal.icon,
      items: meal.items.map((item) => ({ ...item, eaten: true })), // All items are eaten by default when editing
      originalDate, // Store original date to preserve it when updating time
      calories: meal.calories || undefined,
      proteinGrams: meal.protein || undefined,
      carbsGrams: meal.carbs || undefined,
      fatGrams: meal.fat || undefined,
      manualMacros: hasManualMacros,
    });
    setShowCreateMealModal(true);
  };

  const openEditPlan = (plan: ClientDietPlan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      type: plan.type,
      description: plan.description || "",
      targetCalories: plan.targetCalories,
      targetProtein: plan.targetProtein,
      targetCarbs: plan.targetCarbs,
      targetFat: plan.targetFat,
      mealsPerDay: plan.mealsPerDay,
    });
    setShowCreatePlanModal(true);
  };

  const openEditShoppingItem = (item: ShoppingItem) => {
    setEditingShoppingItem(item);
    setShoppingFormData({
      name: item.name,
      quantity: item.quantity || "",
      category: item.category || "other",
      notes: item.notes || "",
      calories: item.calories ? item.calories.toString() : "",
    });
    setShowShoppingModal(true);
  };

  // Helper function to find nutrition values for a food by name
  const findFoodNutrition = (foodName: string): MealFood | null => {
    const normalizedName = foodName.toLowerCase().trim();
    // Search through all preset foods
    for (const category of Object.values(PRESET_FOODS)) {
      for (const food of category) {
        const normalizedFoodName = food.name.toLowerCase();
        // Check if the food name contains the search term or vice versa
        if (normalizedFoodName.includes(normalizedName) || normalizedName.includes(normalizedFoodName.split('(')[0].trim())) {
          return food;
        }
      }
    }
    return null;
  };

  const addFoodItem = (food: MealFood) => {
    setMealFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...food, id: Date.now().toString(), eaten: true }],
    }));
  };

  const removeFoodItem = (itemId: string) => {
    setMealFormData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
    }));
  };

  const togglePlanSelection = (planId: string) => {
    setSelectedPlanIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  // ============================================
  // IMAGE CAPTURE & ANALYSIS
  // ============================================

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (recipeStreamRef.current) {
        recipeStreamRef.current.getTracks().forEach((track) => track.stop());
        recipeStreamRef.current = null;
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    if (streamRef.current || isCameraActive) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = mediaStream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const error = err as Error;
      console.error("[NutritionTab] Camera error:", error);
      toast.error("Could not access camera. Please check permissions.");
      setImageAnalysisError(error.message || "Camera access denied");
      setImageCaptureMode("upload"); // Fallback to upload mode
    }
  }, [isCameraActive]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);

        setImageFile(file);
        setCapturedImage(url);
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [stopCamera]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Image too large. Maximum size is 10MB");
          return;
        }

        setImageFile(file);
        const url = URL.createObjectURL(file);
        setCapturedImage(url);
        setImageAnalysisError(null);
      }
      if (e.target) {
        e.target.value = "";
      }
    },
    []
  );

  // Parse AI analysis response to extract structured nutrition data
  const parseFoodAnalysis = useCallback((analysis: string): FoodAnalysisResult | null => {
    try {
      const result: FoodAnalysisResult = {
        foodsIdentified: [],
        caloriesEstimate: "",
        macronutrients: { protein: 0, carbs: 0, fats: 0 },
        micronutrients: [],
        nutritionSuggestions: [],
        analysis,
      };

      // Try multiple patterns to extract foods
      // Pattern 1: **Foods Identified:** section
      let foodsMatch = analysis.match(/\*\*Foods Identified:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i);
      
      // Pattern 2: "Food items:" or "Items:" or "Foods:"
      if (!foodsMatch) {
        foodsMatch = analysis.match(/(?:Foods?|Items?)(?:\s+Identified)?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i);
      }
      
      // Pattern 3: Look for numbered list of foods
      if (!foodsMatch) {
        const numberedListMatch = analysis.match(/(?:\d+\.\s*.+\n?)+/);
        if (numberedListMatch) {
          foodsMatch = numberedListMatch;
        }
      }
      
      // Pattern 4: Look for JSON in the response
      if (!foodsMatch) {
        const jsonMatch = analysis.match(/\{[\s\S]*"items?"?[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.items && Array.isArray(parsed.items)) {
              result.foodsIdentified = parsed.items.map((item: { name?: string; food?: string; portion?: string; quantity?: string; calories?: number; protein?: number; carbs?: number; carbohydrates?: number; fat?: number; fats?: number }, idx: number) => ({
                name: item.name || item.food || `Food ${idx + 1}`,
                portion: item.portion || item.quantity || "1 serving",
                calories: item.calories || undefined,
                protein: item.protein || undefined,
                carbs: item.carbs || item.carbohydrates || undefined,
                fat: item.fat || item.fats || undefined,
              }));
            }
          } catch (e) {
            console.warn("Failed to parse JSON from analysis:", e);
          }
        }
      }

      if (foodsMatch && result.foodsIdentified.length === 0) {
        const foodsText = foodsMatch[1] || foodsMatch[0];
        const foodLines = foodsText.split('\n').filter(line => line.trim() && !line.match(/^[-*]\s*$/));
        result.foodsIdentified = foodLines.map((line, idx) => {
          // Parse format: "1. Food Name (portion) - ~calories kcal"
          let match = line.match(/(?:\d+\.\s*)?(.+?)\s*\(([^)]+)\)(?:\s*-\s*~?(\d+)\s*kcal)?/);
          if (match) {
            return {
              name: match[1].trim(),
              portion: match[2].trim(),
              calories: match[3] ? parseInt(match[3]) : undefined,
            };
          }
          
          // Parse format: "Food Name - calories kcal"
          match = line.match(/(?:\d+\.\s*)?(.+?)\s*-\s*~?(\d+)\s*kcal/i);
          if (match) {
            return {
              name: match[1].trim(),
              portion: "1 serving",
              calories: parseInt(match[2]),
            };
          }
          
          // Parse format: "Food Name (portion)"
          match = line.match(/(?:\d+\.\s*)?(.+?)\s*\(([^)]+)\)/);
          if (match) {
            return {
              name: match[1].trim(),
              portion: match[2].trim(),
            };
          }
          
          // Fallback: extract any food-like text
          const nameMatch = line.match(/(?:\d+\.\s*)?(.+?)(?:\s*-\s*|$)/);
          const foodName = nameMatch ? nameMatch[1].trim() : line.trim();
          
          // Skip if it looks like a header or section title
          if (foodName.match(/^(foods?|items?|identified|analysis|calories|macronutrients|protein|carbs|fats?)/i)) {
            return null;
          }
          
          return {
            name: foodName || `Food ${idx + 1}`,
            portion: "1 serving",
          };
        }).filter((food): food is { name: string; portion: string; calories?: number } => food !== null);
      }
      
      // If still no foods found, try to extract from the entire analysis text
      if (result.foodsIdentified.length === 0) {
        // Look for common food names in the text
        const commonFoods = ['burger', 'salad', 'chicken', 'rice', 'pasta', 'bread', 'egg', 'cheese', 'tomato', 'lettuce', 'onion', 'beef', 'fish', 'salmon', 'broccoli', 'carrot', 'potato'];
        const foundFoods: string[] = [];
        commonFoods.forEach(food => {
          const regex = new RegExp(`\\b${food}\\w*\\b`, 'gi');
          if (regex.test(analysis) && !foundFoods.includes(food)) {
            foundFoods.push(food);
          }
        });
        
        if (foundFoods.length > 0) {
          result.foodsIdentified = foundFoods.map((food) => ({
            name: food.charAt(0).toUpperCase() + food.slice(1),
            portion: "1 serving",
          }));
        }
      }

      // Extract Calorie Estimate
      const caloriesMatch = analysis.match(/\*\*Estimated Calories:\*\*\s*(.+?)(?=\n\n|\*\*|$)/);
      if (caloriesMatch) {
        result.caloriesEstimate = caloriesMatch[1].trim();
      }

      // Extract Macronutrients
      const macrosMatch = analysis.match(/\*\*Macronutrients:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/);
      if (macrosMatch) {
        const macrosText = macrosMatch[1];
        const proteinMatch = macrosText.match(/Protein:\s*(\d+(?:\.\d+)?)\s*g/i);
        const carbsMatch = macrosText.match(/Carbohydrates?:\s*(\d+(?:\.\d+)?)\s*g/i);
        const fatsMatch = macrosText.match(/Fats?:\s*(\d+(?:\.\d+)?)\s*g/i);
        const fiberMatch = macrosText.match(/Fiber:\s*(\d+(?:\.\d+)?)\s*g/i);

        if (proteinMatch) result.macronutrients.protein = parseFloat(proteinMatch[1]);
        if (carbsMatch) result.macronutrients.carbs = parseFloat(carbsMatch[1]);
        if (fatsMatch) result.macronutrients.fats = parseFloat(fatsMatch[1]);
        if (fiberMatch) result.macronutrients.fiber = parseFloat(fiberMatch[1]);
      }

      // Extract Micronutrients
      const microsMatch = analysis.match(/\*\*Key Micronutrients:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/);
      if (microsMatch) {
        const microsText = microsMatch[1];
        result.micronutrients = microsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean);
      }

      // Extract Nutrition Suggestions
      const suggestionsMatch = analysis.match(/\*\*Nutrition & Diet Recommendations:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/);
      if (suggestionsMatch) {
        const suggestionsText = suggestionsMatch[1];
        result.nutritionSuggestions = suggestionsText
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(Boolean);
      }

      return result;
    } catch (error) {
      console.error("Failed to parse food analysis:", error);
      return null;
    }
  }, []);

  // Auto-populate meal form from analysis
  const populateMealFromAnalysis = useCallback((analysis: FoodAnalysisResult) => {
    if (!analysis.foodsIdentified.length) return;

    // Set meal name from first food or default
    const mealName = analysis.foodsIdentified[0]?.name 
      ? `${analysis.foodsIdentified[0].name}${analysis.foodsIdentified.length > 1 ? ` + ${analysis.foodsIdentified.length - 1} more` : ''}`
      : "AI Analyzed Meal";

    // Convert foods to meal items
    const mealItems = analysis.foodsIdentified.map((food, idx) => {
      // Try to find nutrition from preset foods first
      const presetFood = findFoodNutrition(food.name);
      
      // Calculate individual food macros if we have totals
      const totalFoods = analysis.foodsIdentified.length;
      
      // Use preset values if available, otherwise calculate from totals, otherwise use 0
      let calories = food.calories;
      let protein = food.protein;
      let carbs = food.carbs;
      let fat = food.fat;
      
      if (!calories && !protein && !carbs && !fat) {
        // Try preset food first
        if (presetFood) {
          calories = presetFood.calories || 0;
          protein = presetFood.protein || 0;
          carbs = presetFood.carbs || 0;
          fat = presetFood.fat || 0;
        } else if (totalFoods > 0 && analysis.macronutrients) {
          // Fallback to dividing totals
          calories = Math.round((analysis.macronutrients.protein * 4 + analysis.macronutrients.carbs * 4 + analysis.macronutrients.fats * 9) / totalFoods);
          protein = Math.round(analysis.macronutrients.protein / totalFoods);
          carbs = Math.round(analysis.macronutrients.carbs / totalFoods);
          fat = Math.round(analysis.macronutrients.fats / totalFoods);
        }
      }
      
      const item: MealFood & { eaten?: boolean } = {
        id: `ai-${Date.now()}-${idx}`,
        name: food.name,
        portion: food.portion || presetFood?.portion || '1 serving',
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        eaten: true,
      };
      return item;
    });

    setMealFormData((prev) => ({
      ...prev,
      name: mealName,
      items: [...prev.items, ...mealItems],
    }));

    toast.success(`Added ${mealItems.length} food item(s) from analysis`);
  }, []);

  // Analyze food image
  const analyzeFoodImage = useCallback(async () => {
    if (!imageFile) return;

    setIsAnalyzingImage(true);
    setImageAnalysisError(null);
    setImageAnalysisResult(null);

    try {
      const result = await aiCoachService.analyzeImage(
        imageFile,
        undefined,
        mealImageDescription.trim() || undefined
      );
      
      if (result.imageType !== 'food_photo') {
        toast.error("Image doesn't appear to be food. Please upload a food image.");
        setImageAnalysisError("Non-food image detected");
        return;
      }

      const analysisText = typeof result.analysis === 'string' 
        ? result.analysis 
        : result.analysis?.analysis || "Analysis completed";

      const parsedResult = parseFoodAnalysis(analysisText);
      
      if (parsedResult) {
        setImageAnalysisResult(parsedResult);
        
        // Auto-populate meal form if foods were identified
        if (parsedResult.foodsIdentified && parsedResult.foodsIdentified.length > 0) {
          populateMealFromAnalysis(parsedResult);
          toast.success(`Food analyzed successfully! Added ${parsedResult.foodsIdentified.length} food item(s).`);
        } else {
          // Even if no foods parsed, show the analysis result
          toast.success("Food analyzed successfully! Check the analysis details below.");
          console.warn("Food analysis completed but no foods were identified in the response:", analysisText.substring(0, 500));
        }
      } else {
        setImageAnalysisError("Failed to parse analysis. Please try again.");
        toast.error("Failed to parse nutrition data");
        console.error("Failed to parse food analysis. Analysis text:", analysisText.substring(0, 500));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setImageAnalysisError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [imageFile, mealImageDescription, parseFoodAnalysis, populateMealFromAnalysis]);

  // Parse nutrition label JSON from AI response
  const parseNutritionLabel = useCallback((text: string): NutritionLabelData | null => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.nutrients) return null;
      return {
        productName: parsed.productName || null,
        servingSize: parsed.servingSize || null,
        servingsPerContainer: typeof parsed.servingsPerContainer === 'number' ? parsed.servingsPerContainer : null,
        nutrients: {
          calories: parsed.nutrients.calories ?? null,
          totalFat: parsed.nutrients.totalFat ?? null,
          saturatedFat: parsed.nutrients.saturatedFat ?? null,
          transFat: parsed.nutrients.transFat ?? null,
          cholesterol: parsed.nutrients.cholesterol ?? null,
          sodium: parsed.nutrients.sodium ?? null,
          totalCarbs: parsed.nutrients.totalCarbs ?? null,
          dietaryFiber: parsed.nutrients.dietaryFiber ?? null,
          totalSugars: parsed.nutrients.totalSugars ?? null,
          protein: parsed.nutrients.protein ?? null,
        },
      };
    } catch {
      return null;
    }
  }, []);

  // Analyze nutrition label image
  const analyzeNutritionLabel = useCallback(async () => {
    if (!imageFile) return;

    setIsAnalyzingImage(true);
    setImageAnalysisError(null);
    setNutritionLabelData(null);

    try {
      const result = await aiCoachService.analyzeImage(imageFile, undefined, 'scan nutrition label');

      if (result.imageType !== 'nutrition_label' && result.imageType !== 'food_photo') {
        toast.error("Image doesn't appear to be a nutrition label. Please try again.");
        setImageAnalysisError("Not a nutrition label image");
        return;
      }

      const analysisText = typeof result.analysis === 'string'
        ? result.analysis
        : result.analysis?.analysis || '';

      const parsed = parseNutritionLabel(analysisText);
      if (parsed) {
        setNutritionLabelData(parsed);
        toast.success('Nutrition label scanned successfully!');
      } else {
        setImageAnalysisError('Could not extract nutrition data. Try a clearer photo.');
        toast.error('Failed to extract nutrition data');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan label';
      setImageAnalysisError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [imageFile, parseNutritionLabel]);

  // Populate meal form from scanned nutrition label
  const populateMealFromLabel = useCallback((data: NutritionLabelData, servings: number) => {
    const cal = Math.round((data.nutrients.calories || 0) * servings);
    const pro = Math.round((data.nutrients.protein || 0) * servings * 10) / 10;
    const carb = Math.round((data.nutrients.totalCarbs || 0) * servings * 10) / 10;
    const fat = Math.round((data.nutrients.totalFat || 0) * servings * 10) / 10;

    setMealFormData(prev => ({
      ...prev,
      name: data.productName || prev.name,
      calories: cal,
      proteinGrams: pro,
      carbsGrams: carb,
      fatGrams: fat,
      manualMacros: true,
    }));
    setNutritionLabelData(null);
    toast.success(`Added nutrition for ${servings} serving${servings !== 1 ? 's' : ''}`);
  }, []);

  // ============================================
  // RECIPE IMAGE CAPTURE & ANALYSIS
  // ============================================

  const startRecipeCamera = useCallback(async () => {
    if (recipeStreamRef.current || isRecipeCameraActive) return;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      recipeStreamRef.current = mediaStream;
      setIsRecipeCameraActive(true);
      if (recipeVideoRef.current) {
        recipeVideoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const error = err as Error;
      console.error("[NutritionTab] Recipe camera error:", error);
      toast.error("Could not access camera. Please check permissions.");
      setRecipeImageAnalysisError(error.message || "Camera access denied");
      setRecipeImageCaptureMode("upload"); // Fallback to upload mode
    }
  }, [isRecipeCameraActive]);

  const stopRecipeCamera = useCallback(() => {
    if (recipeStreamRef.current) {
      recipeStreamRef.current.getTracks().forEach((track) => track.stop());
      recipeStreamRef.current = null;
      setIsRecipeCameraActive(false);
      if (recipeVideoRef.current) {
        recipeVideoRef.current.srcObject = null;
      }
    }
  }, []);

  const captureRecipePhoto = useCallback(() => {
    if (!recipeVideoRef.current || !recipeCanvasRef.current) return;

    const video = recipeVideoRef.current;
    const canvas = recipeCanvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `recipe-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);

        setRecipeImageFile(file);
        setRecipeCapturedImage(url);
        stopRecipeCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [stopRecipeCamera]);

  const handleRecipeFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Image too large. Maximum size is 10MB");
          return;
        }

        setRecipeImageFile(file);
        const url = URL.createObjectURL(file);
        setRecipeCapturedImage(url);
        setRecipeImageAnalysisError(null);
      }
      if (e.target) {
        e.target.value = "";
      }
    },
    []
  );

  // Parse recipe analysis to extract structured recipe data
  const parseRecipeAnalysis = useCallback((analysis: string) => {
    try {
      console.log("[RecipeAnalysis] Parsing analysis text:", analysis.substring(0, 1000));
      
      const recipeData: Partial<typeof recipeFormData> = {};

      // First, try to extract JSON if the response contains JSON
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          console.log("[RecipeAnalysis] Found JSON data:", jsonData);

          // Map JSON fields to recipe data
          if (jsonData.name || jsonData.recipeName) {
            recipeData.name = jsonData.name || jsonData.recipeName;
          }
          if (jsonData.description) {
            recipeData.description = jsonData.description;
          }
          // Handle category (from new JSON format)
          if (jsonData.category) {
            const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other'];
            const category = jsonData.category.toLowerCase();
            if (validCategories.includes(category)) {
              recipeData.category = category;
            }
          }
          // Handle cuisine (from new JSON format)
          if (jsonData.cuisine) {
            recipeData.cuisine = jsonData.cuisine;
          }
          if (jsonData.ingredients && Array.isArray(jsonData.ingredients)) {
            recipeData.ingredients = jsonData.ingredients.map((ing: string | { quantity?: string | number; unit?: string; name: string; notes?: string }) => {
              if (typeof ing === 'string') {
                const match = ing.match(/^([\d./]+)\s+(\w+)\s+(.+)$/) || ing.match(/^([\d./]+)\s+(.+)$/);
                return {
                  quantity: match ? match[1] : "",
                  unit: match && match[2] ? match[2] : "",
                  name: match ? (match[3] || match[2] || ing) : ing,
                  notes: "",
                };
              }
              return {
                quantity: String(ing.quantity || ""),
                unit: ing.unit || "",
                name: ing.name || "",
                notes: ing.notes || "",
              };
            }).filter((ing: { name: string }) => ing.name.length > 0);
          }
          if (jsonData.instructions && Array.isArray(jsonData.instructions)) {
            recipeData.instructions = jsonData.instructions.map((inst: string | { description?: string; step?: number; text?: string }, idx: number) => ({
              step: typeof inst === 'object' && inst.step ? inst.step : idx + 1,
              description: typeof inst === 'string' ? inst : (inst.description || inst.text || ""),
            })).filter((inst: { description: string }) => inst.description.length > 0);
          }
          // Handle nutrition (both nested and flat formats)
          if (jsonData.nutrition) {
            const nutrition = jsonData.nutrition;
            if (nutrition.calories !== undefined) recipeData.caloriesPerServing = parseInt(String(nutrition.calories));
            if (nutrition.protein !== undefined) recipeData.proteinGrams = parseFloat(String(nutrition.protein));
            if (nutrition.carbs !== undefined || nutrition.carbohydrates !== undefined) {
              recipeData.carbsGrams = parseFloat(String(nutrition.carbs || nutrition.carbohydrates));
            }
            if (nutrition.fat !== undefined) recipeData.fatGrams = parseFloat(String(nutrition.fat));
            if (nutrition.fiber !== undefined) recipeData.fiberGrams = parseFloat(String(nutrition.fiber));
          }
          // Handle time (both nested and flat formats)
          if (jsonData.time) {
            const time = jsonData.time;
            if (time.prep !== undefined || time.prepTime !== undefined) {
              recipeData.prepTimeMinutes = parseInt(String(time.prep || time.prepTime));
            }
            if (time.cook !== undefined || time.cookTime !== undefined) {
              recipeData.cookTimeMinutes = parseInt(String(time.cook || time.cookTime));
            }
          }
          // Also check for flat time fields
          if (jsonData.prepTime !== undefined) recipeData.prepTimeMinutes = parseInt(String(jsonData.prepTime));
          if (jsonData.cookTime !== undefined) recipeData.cookTimeMinutes = parseInt(String(jsonData.cookTime));
          if (jsonData.prepTimeMinutes !== undefined) recipeData.prepTimeMinutes = parseInt(String(jsonData.prepTimeMinutes));
          if (jsonData.cookTimeMinutes !== undefined) recipeData.cookTimeMinutes = parseInt(String(jsonData.cookTimeMinutes));

          if (jsonData.servings !== undefined) recipeData.servings = parseInt(String(jsonData.servings));
          if (jsonData.difficulty) {
            const diff = jsonData.difficulty.toLowerCase();
            recipeData.difficulty = diff === 'beginner' ? 'easy' : diff === 'intermediate' ? 'medium' : diff === 'advanced' ? 'hard' : diff;
          }
          if (jsonData.tags && Array.isArray(jsonData.tags)) {
            recipeData.tags = jsonData.tags.map((tag: string) => tag.trim()).filter(Boolean);
          }
          if (jsonData.dietaryFlags && Array.isArray(jsonData.dietaryFlags)) {
            recipeData.dietaryFlags = jsonData.dietaryFlags.map((flag: string) => flag.toLowerCase().trim()).filter(Boolean);
          }

          // Log what was parsed
          const parsedFields = Object.keys(recipeData).filter(key => {
            const value = recipeData[key as keyof typeof recipeData];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'string') return value.length > 0;
            if (typeof value === 'number') return !isNaN(value);
            return value !== null && value !== undefined;
          });
          console.log("[RecipeAnalysis] Successfully parsed from JSON, fields:", parsedFields);

          // If we got good data from JSON, return it
          if (recipeData.name || (recipeData.ingredients && recipeData.ingredients.length > 0)) {
            return recipeData;
          }
        } catch (jsonError) {
          console.warn("[RecipeAnalysis] JSON parsing failed, falling back to markdown:", jsonError);
        }
      }

      // Extract Recipe Name - try multiple patterns (more robust)
      const namePatterns = [
        /\*\*Recipe Name:\*\*\s*(.+?)(?=\n\n|\*\*|$)/i,
        /\*\*Name:\*\*\s*(.+?)(?=\n\n|\*\*|$)/i,
        /Recipe Name[:\s]+\*\*(.+?)\*\*/i,
        /Recipe Name[:\s]+(.+?)(?=\n|$)/i,
        /^#\s*(.+?)$/m,
        /^##\s*(.+?)$/m,
        /Recipe:\s*(.+?)(?=\n|$)/i,
        /^(.+?)\s*Recipe/i,
        /^(.+?)\n/i, // First line if it's short and doesn't contain special chars
      ];
      for (const pattern of namePatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          const name = match[1].trim().replace(/\*\*/g, '').replace(/^#+\s*/, '');
          if (name.length > 0 && name.length < 200) {
            recipeData.name = name;
            console.log("[RecipeAnalysis] Found name:", name);
            break;
          }
        }
      }
      
      // If no name found, try to extract from first line or title
      if (!recipeData.name) {
        const lines = analysis.split('\n').filter(line => line.trim());
        for (const line of lines.slice(0, 3)) {
          const cleanLine = line.trim().replace(/\*\*/g, '').replace(/^#+\s*/, '');
          if (cleanLine.length > 3 && cleanLine.length < 100 && 
              !cleanLine.toLowerCase().includes('recipe') &&
              !cleanLine.toLowerCase().includes('ingredient') &&
              !cleanLine.toLowerCase().includes('instruction')) {
            recipeData.name = cleanLine;
            console.log("[RecipeAnalysis] Found name from first line:", cleanLine);
            break;
          }
        }
      }

      // Extract Description - try multiple patterns
      const descPatterns = [
        /\*\*Description:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Description:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|Ingredients|Instructions|$)/i,
        /About.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|Ingredients|Instructions|$)/i,
      ];
      for (const pattern of descPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          recipeData.description = match[1].trim().substring(0, 500); // Limit length
          break;
        }
      }

      // Extract Ingredients - try multiple patterns (more robust)
      const ingredientsPatterns = [
        /\*\*Ingredients:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Instructions|\*\*Steps|\*\*Nutrition|\*\*Time|\*\*Description|$)/i,
        /Ingredients[:\s]+\*\*(.+?)\*\*/i,
        /Ingredients:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Instructions|\*\*Steps|\*\*Nutrition|\*\*Time|Instructions:|Steps:|$)/i,
        /Ingredients?.*?:\s*\n((?:.+\n?)+?)(?=\n\n|Instructions|Steps|Nutrition|$)/i,
      ];
      for (const pattern of ingredientsPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          const ingredientsText = match[1];
          const ingredientLines = ingredientsText.split('\n')
            .filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 0 && 
                     !trimmed.match(/^[-=*]+$/) &&
                     !trimmed.match(/^#{1,6}\s/) &&
                     !trimmed.toLowerCase().includes('instruction') &&
                     !trimmed.toLowerCase().includes('nutrition');
            });
          
          if (ingredientLines.length > 0) {
            recipeData.ingredients = ingredientLines.map((line) => {
              // Parse format: "2 cups flour" or "1. 2 cups flour" or "- 2 cups flour" or "• 2 cups flour"
              const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim().replace(/\*\*/g, '');
              
              // Try multiple patterns for quantity/unit/name
              let match = cleanLine.match(/^([\d./\s]+)\s+(\w+)\s+(.+)$/);
              if (!match) {
                match = cleanLine.match(/^([\d./]+)\s+(.+)$/);
              }
              if (!match) {
                // Try "2-3" or "1/2" at start
                match = cleanLine.match(/^([\d./-]+)\s+(.+)$/);
              }
              
              if (match && match.length >= 2) {
                return {
                  quantity: match[1]?.trim() || "",
                  unit: match[2] && match[2] !== match[match.length - 1] ? match[2].trim() : "",
                  name: (match[match.length - 1] || match[2] || cleanLine).trim(),
                  notes: "",
                };
              }
              
              // Fallback: just use the line as name
              return {
                quantity: "",
                unit: "",
                name: cleanLine,
                notes: "",
              };
            }).filter(ing => ing.name.length > 0);
            
            if (recipeData.ingredients.length > 0) {
              console.log("[RecipeAnalysis] Found ingredients:", recipeData.ingredients.length);
              break;
            }
          }
        }
      }

      // Extract Instructions - try multiple patterns (more robust)
      const instructionsPatterns = [
        /\*\*Instructions:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|\*\*Servings|$)/i,
        /\*\*Steps:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|\*\*Servings|$)/i,
        /Instructions?[:\s]+\*\*(.+?)\*\*/i,
        /Instructions?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|Nutrition:|Time:|$)/i,
        /Steps?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|Nutrition:|Time:|$)/i,
      ];
      for (const pattern of instructionsPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          const instructionsText = match[1];
          const instructionLines = instructionsText.split('\n')
            .filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 0 && 
                     !trimmed.match(/^[-=*]+$/) &&
                     !trimmed.match(/^#{1,6}\s/) &&
                     !trimmed.toLowerCase().includes('nutrition') &&
                     !trimmed.toLowerCase().includes('serving');
            });
          
          if (instructionLines.length > 0) {
            recipeData.instructions = instructionLines.map((line, idx) => {
              const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim().replace(/\*\*/g, '');
              return {
                step: idx + 1,
                description: cleanLine,
              };
            }).filter(inst => inst.description.length > 0);
            
            if (recipeData.instructions.length > 0) {
              console.log("[RecipeAnalysis] Found instructions:", recipeData.instructions.length);
              break;
            }
          }
        }
      }

      // Extract Nutrition - try multiple patterns
      const nutritionPatterns = [
        /\*\*Nutrition.*?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Nutrition.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Calories.*?Protein.*?Carbs.*?Fat/i,
      ];
      for (const pattern of nutritionPatterns) {
        const match = analysis.match(pattern);
        if (match) {
          const nutritionText = match[1] || analysis;
          const caloriesMatch = nutritionText.match(/Calories?[:\s]+(\d+)/i) || 
                               nutritionText.match(/(\d+)\s*kcal/i) ||
                               nutritionText.match(/(\d+)\s*calories/i);
          const proteinMatch = nutritionText.match(/Protein[:\s]+(\d+(?:\.\d+)?)\s*g/i);
          const carbsMatch = nutritionText.match(/Carbohydrates?[:\s]+(\d+(?:\.\d+)?)\s*g/i) ||
                            nutritionText.match(/Carbs?[:\s]+(\d+(?:\.\d+)?)\s*g/i);
          const fatMatch = nutritionText.match(/Fat[:\s]+(\d+(?:\.\d+)?)\s*g/i) ||
                          nutritionText.match(/Fats?[:\s]+(\d+(?:\.\d+)?)\s*g/i);

          if (caloriesMatch) recipeData.caloriesPerServing = parseInt(caloriesMatch[1]);
          if (proteinMatch) recipeData.proteinGrams = parseFloat(proteinMatch[1]);
          if (carbsMatch) recipeData.carbsGrams = parseFloat(carbsMatch[1]);
          if (fatMatch) recipeData.fatGrams = parseFloat(fatMatch[1]);
          break;
        }
      }

      // Extract Time - try multiple patterns
      const timePatterns = [
        /\*\*Time.*?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Time.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Prep.*?Cook/i,
      ];
      for (const pattern of timePatterns) {
        const match = analysis.match(pattern);
        if (match) {
          const timeText = match[1] || analysis;
          const prepMatch = timeText.match(/Prep.*?(\d+)/i) || analysis.match(/Prep.*?(\d+)/i);
          const cookMatch = timeText.match(/Cook.*?(\d+)/i) || analysis.match(/Cook.*?(\d+)/i);
          if (prepMatch) recipeData.prepTimeMinutes = parseInt(prepMatch[1]);
          if (cookMatch) recipeData.cookTimeMinutes = parseInt(cookMatch[1]);
          break;
        }
      }

      // Extract Servings
      const servingsMatch = analysis.match(/Servings?[:\s]+(\d+)/i);
      if (servingsMatch) {
        recipeData.servings = parseInt(servingsMatch[1]);
      }

      // Extract Difficulty
      const difficultyMatch = analysis.match(/Difficulty[:\s]+(easy|medium|hard|beginner|intermediate|advanced)/i);
      if (difficultyMatch) {
        const diff = difficultyMatch[1].toLowerCase();
        recipeData.difficulty = diff === 'beginner' ? 'easy' : diff === 'intermediate' ? 'medium' : diff === 'advanced' ? 'hard' : diff;
      }

      // Extract Tags
      const tagsPatterns = [
        /\*\*Tags?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /\*\*Tags?:\*\*\s*([^\n]+)/i,
        /Tags?[:\s]+\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Tags?[:\s]+([^\n]+)/i,
      ];
      for (const pattern of tagsPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          const tagsText = match[1];
          // Handle both comma-separated and line-separated tags
          if (tagsText.includes(',')) {
            recipeData.tags = tagsText.split(',').map(tag => tag.trim()).filter(Boolean);
          } else {
            recipeData.tags = tagsText.split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^[-*•\d.]\s*/, '').trim())
              .filter(tag => tag.length > 0);
          }
          break;
        }
      }
      
      // Extract Dietary Flags
      const dietaryFlagsPatterns = [
        /\*\*Dietary Flags?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /\*\*Dietary Flags?:\*\*\s*([^\n]+)/i,
        /Dietary Flags?[:\s]+\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Dietary Flags?[:\s]+([^\n]+)/i,
      ];
      for (const pattern of dietaryFlagsPatterns) {
        const match = analysis.match(pattern);
        if (match && match[1]?.trim()) {
          const flagsText = match[1];
          // Handle both comma-separated and line-separated flags
          if (flagsText.includes(',')) {
            recipeData.dietaryFlags = flagsText.split(',').map(flag => flag.trim()).filter(Boolean);
          } else {
            recipeData.dietaryFlags = flagsText.split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^[-*•\d.]\s*/, '').trim())
              .filter(flag => flag.length > 0);
          }
          break;
        }
      }

      // Extract Category from analysis if possible
      const categoryKeywords: Record<string, string> = {
        breakfast: 'breakfast',
        lunch: 'lunch',
        dinner: 'dinner',
        snack: 'snack',
        dessert: 'dessert',
      };
      const lowerAnalysis = analysis.toLowerCase();
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        if (lowerAnalysis.includes(keyword) && !recipeData.category) {
          recipeData.category = category;
          break;
        }
      }

      // Extract Cuisine
      const cuisineMatch = analysis.match(/(Italian|Mexican|Asian|Chinese|Japanese|Indian|French|Mediterranean|American|Thai|Korean|Greek)/i);
      if (cuisineMatch) {
        recipeData.cuisine = cuisineMatch[1];
      }

      console.log("[RecipeAnalysis] Parsed recipe data:", recipeData);
      
      // Return data even if only partially parsed
      return Object.keys(recipeData).length > 0 ? recipeData : null;
    } catch (error) {
      console.error("[RecipeAnalysis] Failed to parse recipe analysis:", error);
      return null;
    }
  }, []);

  // Analyze recipe image
  const analyzeRecipeImage = useCallback(async () => {
    if (!recipeImageFile) return;

    setIsAnalyzingRecipeImage(true);
    setRecipeImageAnalysisError(null);
    setRecipeImageAnalysisResult(null);

    try {
      // Request recipe generation - create a recipe to make this dish
      const recipePrompt = `Generate a complete recipe to make this dish shown in the image. Create a detailed, step-by-step recipe that someone can follow to recreate this dish.

IMPORTANT: Provide ALL of the following information in a clear, structured format:

**Recipe Name:** [A descriptive, specific name for this dish]

**Description:** [A brief 2-3 sentence overview describing the dish, its flavors, and what makes it special]

**Ingredients:**
[List each ingredient with exact quantities and units, one per line, format: "Quantity Unit Ingredient Name"]
Example:
- 2 lbs salmon fillet
- 1 lb asparagus spears
- 2 tbsp olive oil
- 1 tsp salt
- 1/2 tsp black pepper

**Instructions:**
[Numbered, detailed step-by-step cooking instructions. Be specific about temperatures, times, and techniques]
Example:
1. Preheat oven to 400°F (200°C)
2. Season salmon with salt and pepper
3. Place salmon on baking sheet and bake for 15 minutes
...

**Nutrition (per serving):**
Calories: [number] kcal
Protein: [number] g
Carbohydrates: [number] g
Fat: [number] g

**Time:**
Prep Time: [number] minutes
Cook Time: [number] minutes

**Servings:** [number]

**Difficulty:** [Easy OR Medium OR Hard]

**Tags:** [comma-separated tags like: High-Protein, Quick, Healthy, Gluten-Free]

**Dietary Flags:** [comma-separated dietary information like: Keto, Low-Carb, High-Protein, Gluten-Free, Dairy-Free]

Format your response EXACTLY as shown above with **bold** markdown headers. Be precise with measurements, cooking times, and temperatures.`;

      const result = await aiCoachService.analyzeImage(
        recipeImageFile,
        undefined, // goal
        recipePrompt
      );
      
      if (result.imageType !== 'food_photo') {
        toast.error("Image doesn't appear to be food. Please upload a food/recipe image.");
        setRecipeImageAnalysisError("Non-food image detected");
        return;
      }

      const analysisText = typeof result.analysis === 'string' 
        ? result.analysis 
        : result.analysis?.analysis || "Analysis completed";

      console.log("[RecipeAnalysis] Full analysis result:", result);
      console.log("[RecipeAnalysis] Analysis text (first 1000 chars):", analysisText.substring(0, 1000));
      
      setRecipeImageAnalysisResult(analysisText);
      
      // Parse and populate recipe form
      const parsedRecipe = parseRecipeAnalysis(analysisText);
      console.log("[RecipeAnalysis] Parsed recipe:", parsedRecipe);
      
      if (parsedRecipe && Object.keys(parsedRecipe).length > 0) {
        setRecipeFormData((prev) => {
          const updated = {
            ...prev,
            // Only update fields that were actually parsed (not empty defaults)
            ...(parsedRecipe.name && { name: parsedRecipe.name }),
            ...(parsedRecipe.description && { description: parsedRecipe.description }),
            ...(parsedRecipe.category && { category: parsedRecipe.category }),
            ...(parsedRecipe.cuisine && { cuisine: parsedRecipe.cuisine }),
            ...(parsedRecipe.servings && parsedRecipe.servings > 0 && { servings: parsedRecipe.servings }),
            ...(parsedRecipe.caloriesPerServing && parsedRecipe.caloriesPerServing > 0 && { caloriesPerServing: parsedRecipe.caloriesPerServing }),
            ...(parsedRecipe.proteinGrams && parsedRecipe.proteinGrams > 0 && { proteinGrams: parsedRecipe.proteinGrams }),
            ...(parsedRecipe.carbsGrams && parsedRecipe.carbsGrams > 0 && { carbsGrams: parsedRecipe.carbsGrams }),
            ...(parsedRecipe.fatGrams && parsedRecipe.fatGrams > 0 && { fatGrams: parsedRecipe.fatGrams }),
            ...(parsedRecipe.fiberGrams && parsedRecipe.fiberGrams > 0 && { fiberGrams: parsedRecipe.fiberGrams }),
            ...(parsedRecipe.prepTimeMinutes && parsedRecipe.prepTimeMinutes > 0 && { prepTimeMinutes: parsedRecipe.prepTimeMinutes }),
            ...(parsedRecipe.cookTimeMinutes && parsedRecipe.cookTimeMinutes > 0 && { cookTimeMinutes: parsedRecipe.cookTimeMinutes }),
            ...(parsedRecipe.difficulty && { difficulty: parsedRecipe.difficulty }),
            // Arrays - only update if they have items
            ...(parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0 && { ingredients: parsedRecipe.ingredients }),
            ...(parsedRecipe.instructions && parsedRecipe.instructions.length > 0 && { instructions: parsedRecipe.instructions }),
            ...(parsedRecipe.tags && parsedRecipe.tags.length > 0 && { tags: parsedRecipe.tags }),
            ...(parsedRecipe.dietaryFlags && parsedRecipe.dietaryFlags.length > 0 && { dietaryFlags: parsedRecipe.dietaryFlags }),
          };
          console.log("[RecipeAnalysis] Updated form data:", updated);
          return updated;
        });
        
        const populatedFields = Object.keys(parsedRecipe).filter(key => {
          const value = parsedRecipe[key as keyof typeof parsedRecipe];
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === 'string') return value.length > 0;
          if (typeof value === 'number') return value > 0;
          return value !== null && value !== undefined;
        });
        
        if (populatedFields.length > 0) {
          toast.success(`Recipe analyzed! Populated ${populatedFields.length} field(s): ${populatedFields.join(', ')}`);
        } else {
          toast("Analysis completed but no data could be extracted. Please fill the form manually.", {
            icon: "⚠️",
            duration: 4000,
          });
        }
      } else {
        console.warn("[RecipeAnalysis] No data extracted from analysis");
        toast.error("Could not extract recipe data. Please review the analysis and fill the form manually.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setRecipeImageAnalysisError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzingRecipeImage(false);
    }
  }, [recipeImageFile, parseRecipeAnalysis]);

  // Handle camera mode changes
  useEffect(() => {
    if (imageCaptureMode === "camera" && !capturedImage && !isCameraActive && showCreateMealModal) {
      startCamera();
    } else if (imageCaptureMode === "upload" && isCameraActive) {
      stopCamera();
    }
  }, [imageCaptureMode, capturedImage, isCameraActive, showCreateMealModal, startCamera, stopCamera]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    fetchDietPlans();
    fetchMeals();
    fetchWaterLog();
    fetchShoppingList();
    fetchRecipes();
  }, [fetchDietPlans, fetchMeals, fetchWaterLog, fetchShoppingList, fetchRecipes]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activePlan = useMemo(() => dietPlans.find((p) => p.isActive), [dietPlans]);

  const macros = useMemo((): Record<string, MacroTarget> => {
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: { current: totals.calories, target: activePlan?.targetCalories || 2200, unit: "kcal" },
      protein: { current: totals.protein, target: activePlan?.targetProtein || 150, unit: "g" },
      carbs: { current: totals.carbs, target: activePlan?.targetCarbs || 250, unit: "g" },
      fat: { current: totals.fat, target: activePlan?.targetFat || 70, unit: "g" },
    };
  }, [meals, activePlan]);

  const formTotals = useMemo(() =>
    mealFormData.items
      .filter((item) => item.eaten !== false) // Only count eaten foods (default to true if not set)
      .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ),
    [mealFormData.items]
  );

  // Check if form is valid for saving (for both create and update)
  const isMealFormValid = useMemo(() => {
    const hasName = mealFormData.name.trim().length > 0;
    
    // For editing: only require name (can update time/type without foods)
    // For creating: require name and either foods or manual macros
    if (editingMeal) {
      return hasName;
    }
    
    // For new meals, require at least one eaten food OR manual macros with values
    const hasEatenFoods = mealFormData.items.filter((item) => item.eaten !== false).length > 0;
    const hasManualMacros = mealFormData.manualMacros && 
      mealFormData.calories !== undefined && 
      mealFormData.proteinGrams !== undefined && 
      mealFormData.carbsGrams !== undefined && 
      mealFormData.fatGrams !== undefined;
    
    return hasName && (hasEatenFoods || hasManualMacros);
  }, [mealFormData.name, mealFormData.items, mealFormData.manualMacros, mealFormData.calories, mealFormData.proteinGrams, mealFormData.carbsGrams, mealFormData.fatGrams, editingMeal]);

  const filteredFoods = useMemo(() =>
    Object.entries(PRESET_FOODS).reduce(
      (acc, [category, foods]) => {
        if (selectedCategory && category !== selectedCategory) return acc;
        const filtered = foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase()));
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      },
      {} as Record<string, MealFood[]>
    ),
    [foodSearch, selectedCategory]
  );

  const pendingItems = useMemo(() => shoppingItems.filter((item) => !item.isPurchased), [shoppingItems]);
  const purchasedItems = useMemo(() => shoppingItems.filter((item) => item.isPurchased), [shoppingItems]);
  
  // Calculate total calories for pending items
  const totalCalories = useMemo(() => {
    return pendingItems.reduce((total, item) => {
      return total + (item.calories || 0);
    }, 0);
  }, [pendingItems]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header with Macro Overview */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent border border-emerald-500/20 p-4 sm:p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 shrink-0">
                  <Utensils className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-emerald-400 text-sm font-medium">AI Nutrition Plan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Today&apos;s Nutrition</h2>
              <p className="text-slate-400 text-sm truncate">
                {activePlan ? activePlan.name : "No active plan - create one to track macros"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  resetMealForm();
                  setEditingMeal(null);
                  setShowCreateMealModal(true);
                }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xs:inline">Add</span> Meal
              </motion.button>
            </div>
          </div>

          {/* Macro Progress Rings - Circular Charts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Object.entries(macros).map(([key, value]) => {
              // Map macro keys to HealthMetric types with specific colors
              const metricTypeMap: Record<string, 'calories' | 'protein' | 'carbs' | 'fat'> = {
                calories: 'calories',
                protein: 'protein',
                carbs: 'carbs',
                fat: 'fat',
              };
              
              const metricType = metricTypeMap[key] || 'nutrition';
              
              // Create HealthMetric object
              const metric: HealthMetric = {
                type: metricType,
                value: value.current,
                max: value.target,
                unit: value.unit,
                label: key.charAt(0).toUpperCase() + key.slice(1),
                subtitle: `${Math.round(value.current)} / ${value.target} ${value.unit}`,
              };
              
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: Object.keys(macros).indexOf(key) * 0.1 }}
                  className="flex justify-center"
                >
                  <CircularMetricCard metric={metric} size="md" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50 w-fit">
        {[
          { id: "today", label: "Today", icon: Utensils },
          { id: "plan", label: "Plans", icon: Clock },
          { id: "recipes", label: "Recipes", icon: Salad },
          { id: "history", label: "History", icon: Calendar },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id as typeof activeView)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === view.id
                ? "bg-emerald-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <view.icon className="w-4 h-4" />
            {view.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* TODAY VIEW */}
        {activeView === "today" && (
          <TodayTab
            key="today"
            meals={meals}
            mealsLoading={mealsLoading}
            macros={macros}
            activePlan={activePlan || null}
            waterLog={waterLog}
            waterLoading={waterLoading}
            waterUpdating={waterUpdating}
            shoppingItems={shoppingItems}
            shoppingLoading={shoppingLoading}
            expandedMeal={expandedMeal}
            onMealExpand={setExpandedMeal}
            onAddMeal={() => {
                  resetMealForm();
                  setEditingMeal(null);
                  setShowCreateMealModal(true);
                }}
            onEditMeal={openEditMeal}
            onDeleteMeal={(mealId) => setShowDeleteConfirm(`meal-${mealId}`)}
            onAddWater={addWaterGlass}
            onRemoveWater={removeWaterGlass}
            onShoppingItemToggle={toggleShoppingItem}
            onShoppingItemEdit={openEditShoppingItem}
            onShoppingItemDelete={deleteShoppingItem}
            onShoppingAdd={() => {
                        resetShoppingForm();
                        setEditingShoppingItem(null);
                        setShowShoppingModal(true);
                      }}
            onShoppingAIGenerate={() => setShowAIGenerateModal(true)}
            onShoppingViewAll={() => setShowViewAllShoppingModal(true)}
            onShoppingClearPurchased={clearPurchasedItems}
          />
        )}

        {/* PLANS VIEW */}
        {activeView === "plan" && (
          <PlansTab
            key="plan"
            plans={dietPlans}
            plansLoading={plansLoading}
            selectedPlanIds={selectedPlanIds}
            onPlanSelect={togglePlanSelection}
            onPlanDelete={(planId) => setShowDeleteConfirm(`plan-${planId}`)}
            onPlansDelete={deleteSelectedPlans}
            onPlanActivate={activateDietPlan}
            onPlanEdit={openEditPlan}
            onPlanCreate={() => {
                    resetPlanForm();
                    setEditingPlan(null);
                    setShowCreatePlanModal(true);
                  }}
            onAIGenerate={generateAIDietPlan}
            aiGenerating={aiPlanGenerating}
          />
        )}

        {/* RECIPES VIEW */}
        {activeView === "recipes" && (
          <RecipesTab
            key="recipes"
            recipes={recipes}
            recipesLoading={recipesLoading}
            selectedRecipeIds={selectedRecipeIds}
            recipeFilterCategory={recipeFilterCategory}
            showFavoritesOnly={showFavoritesOnly}
            onRecipeSelect={(recipeId) => {
                            setSelectedRecipeIds((prev) => {
                              const next = new Set(prev);
                if (next.has(recipeId)) {
                  next.delete(recipeId);
                              } else {
                  next.add(recipeId);
                              }
                              return next;
                            });
                          }}
            onRecipesDelete={deleteSelectedRecipes}
            onRecipeFavorite={toggleRecipeFavorite}
            onRecipeEdit={openEditRecipe}
            onRecipeDelete={(recipeId) => setShowDeleteConfirm(`recipe-${recipeId}`)}
            onRecipeView={setViewingRecipe}
            onRecipeCreate={() => {
              resetRecipeForm();
              setEditingRecipe(null);
              setShowCreateRecipeModal(true);
            }}
            onFilterCategoryChange={setRecipeFilterCategory}
            onFavoritesToggle={() => setShowFavoritesOnly(!showFavoritesOnly)}
          />
        )}

        {/* HISTORY VIEW */}
        {activeView === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <MealHistoryTab
              onEditMeal={openEditMeal}
              onDeleteMeal={(mealId) => setShowDeleteConfirm(`meal-${mealId}`)}
            />
          </motion.div>
        )}

        {/* ANALYTICS VIEW */}
        {activeView === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <NutritionAnalytics />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Create/Edit Meal Modal */}
      <AnimatePresence>
        {showCreateMealModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateMealModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{editingMeal ? "Edit Meal" : "Log New Meal"}</h2>
                  <button
                    onClick={() => setShowCreateMealModal(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Meal Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Meal Name</label>
                  <input
                    type="text"
                    value={mealFormData.name}
                    onChange={(e) => setMealFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Breakfast, Post-workout Shake"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Time & Icon */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="time"
                      value={mealFormData.time}
                      onChange={(e) => setMealFormData((prev) => ({ ...prev, time: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Meal Type</label>
                    <div className="flex gap-2">
                      {mealIconsList.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setMealFormData((prev) => ({ ...prev, icon: item.id as typeof mealFormData.icon }))}
                          className={`flex-1 p-3 rounded-xl border transition-colors ${
                            mealFormData.icon === item.id
                              ? "border-emerald-500 bg-emerald-500/20"
                              : "border-slate-700 bg-slate-800 hover:border-slate-600"
                          }`}
                          title={item.label}
                        >
                          <item.icon
                            className={`w-5 h-5 mx-auto ${
                              mealFormData.icon === item.id ? "text-emerald-400" : "text-slate-400"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Image Capture/Upload for Meal Analysis */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {imageScanMode === 'label' ? (
                      <Tag className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Camera className="w-5 h-5 text-emerald-400" />
                    )}
                    <label className={`text-sm font-medium ${imageScanMode === 'label' ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {imageScanMode === 'label' ? 'Scan Nutrition Label' : 'Capture or Upload Food Image'}
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {imageScanMode === 'label'
                      ? 'Upload a photo of a product nutrition facts panel to extract exact values'
                      : 'Take a photo or upload an image of your meal to automatically analyze nutrition'}
                  </p>

                  {/* Mode Toggle */}
                  <div className="flex gap-1.5 p-1 bg-slate-800/50 rounded-lg mb-3">
                    <button
                      onClick={() => {
                        setImageCaptureMode("upload");
                        setImageScanMode("food");
                        stopCamera();
                        if (capturedImage) {
                          setCapturedImage(null);
                          setImageFile(null);
                        }
                        setNutritionLabelData(null);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        imageCaptureMode === "upload" && imageScanMode === "food"
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setImageCaptureMode("camera");
                        setImageScanMode("food");
                        setNutritionLabelData(null);
                        if (!capturedImage) {
                          startCamera();
                        }
                      }}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        imageCaptureMode === "camera" && imageScanMode === "food"
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 inline mr-1" />
                      Camera
                    </button>
                    <button
                      onClick={() => {
                        setImageCaptureMode("upload");
                        setImageScanMode("label");
                        stopCamera();
                        if (capturedImage) {
                          setCapturedImage(null);
                          setImageFile(null);
                        }
                        setImageAnalysisResult(null);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        imageScanMode === "label"
                          ? "bg-amber-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 inline mr-1" />
                      Scan Label
                    </button>
                  </div>

                  {/* Camera View */}
                  {imageCaptureMode === "camera" && (
                    <div className="space-y-3">
                      {!capturedImage ? (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          {isCameraActive ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              <canvas ref={canvasRef} className="hidden" />
                              <div className="absolute inset-0 flex items-end justify-center p-4">
                                <button
                                  onClick={capturePhoto}
                                  disabled={!isCameraActive}
                                  className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 shadow-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  <Camera className="w-6 h-6 text-slate-800" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <VideoOff className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                <p className="text-slate-400 mb-4">Camera not active</p>
                                <button
                                  onClick={startCamera}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                                >
                                  Start Camera
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          <Image
                            src={capturedImage}
                            alt="Captured food"
                            fill
                            className="object-contain"
                          />
                          <button
                            onClick={() => {
                              setCapturedImage(null);
                              setImageFile(null);
                              setImageAnalysisResult(null);
                              setImageAnalysisError(null);
                              if (imageCaptureMode === "camera") {
                                startCamera();
                              }
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload View */}
                  {imageCaptureMode === "upload" && (
                    <div className="space-y-3">
                      {!capturedImage ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative aspect-[4/3] bg-slate-800/50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors ${
                            imageScanMode === 'label'
                              ? 'border-amber-500/40 hover:border-amber-500/60'
                              : 'border-slate-600 hover:border-emerald-500/50'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          {imageScanMode === 'label' ? (
                            <Tag className="w-12 h-12 mb-4 text-amber-400" />
                          ) : (
                            <Upload className="w-12 h-12 mb-4 text-slate-400" />
                          )}
                          <p className="text-slate-400 mb-1">
                            {imageScanMode === 'label'
                              ? 'Upload a nutrition label photo'
                              : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-slate-500 text-xs">
                            JPEG, PNG, WebP, or HEIC (max 10MB)
                          </p>
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          <Image
                            src={capturedImage}
                            alt="Uploaded food"
                            fill
                            className="object-contain"
                          />
                          <button
                            onClick={() => {
                              setCapturedImage(null);
                              setImageFile(null);
                              setImageAnalysisResult(null);
                              setImageAnalysisError(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {imageAnalysisError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300 text-xs">{imageAnalysisError}</p>
                    </div>
                  )}

                  {/* Analysis Result Preview */}
                  {imageAnalysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-emerald-400 font-medium text-xs mb-1">Analysis Complete</p>
                          {imageAnalysisResult.caloriesEstimate && (
                            <p className="text-slate-300 text-xs mb-1">
                              Calories: {imageAnalysisResult.caloriesEstimate}
                            </p>
                          )}
                          {imageAnalysisResult.foodsIdentified.length > 0 && (
                            <p className="text-slate-400 text-xs">
                              {imageAnalysisResult.foodsIdentified.length} food(s) identified
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Optional Meal Description (food mode only) */}
                  {capturedImage && !imageAnalysisResult && !nutritionLabelData && imageScanMode === 'food' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={mealImageDescription}
                        onChange={(e) => setMealImageDescription(e.target.value)}
                        placeholder="Describe your meal (optional) e.g. full plate of salad"
                        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                  )}

                  {/* Nutrition Label Result */}
                  {nutritionLabelData && (
                    <div className="mt-3">
                      <NutritionLabelResult
                        data={nutritionLabelData}
                        onAddToMeal={populateMealFromLabel}
                        onDismiss={() => setNutritionLabelData(null)}
                      />
                    </div>
                  )}

                  {/* Analyze Button */}
                  {capturedImage && !imageAnalysisResult && !nutritionLabelData && (
                    <button
                      onClick={imageScanMode === 'label' ? analyzeNutritionLabel : analyzeFoodImage}
                      disabled={isAnalyzingImage}
                      className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${
                        imageScanMode === 'label'
                          ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : 'from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                      } text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isAnalyzingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {imageScanMode === 'label' ? 'Scanning Label...' : 'Analyzing...'}
                        </>
                      ) : (
                        <>
                          {imageScanMode === 'label' ? (
                            <><Tag className="w-4 h-4" /> Scan Label</>
                          ) : (
                            <><ImageIcon className="w-4 h-4" /> Analyze Image</>
                          )}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* AI Meal Generation */}
                <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <label className="text-sm font-medium text-purple-300">Generate with AI</label>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Describe what you want to eat and AI will create the meal for you
                  </p>
                  <textarea
                    value={aiMealDescription}
                    onChange={(e) => {
                      setAiMealDescription(e.target.value);
                      setAiMealError(null);
                    }}
                    placeholder="e.g., High protein breakfast with eggs and avocado, or a healthy lunch with grilled chicken salad..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                  />
                  {aiMealError && (
                    <p className="text-xs text-red-400 mt-2">{aiMealError}</p>
                  )}
                  <button
                    onClick={generateMealWithAI}
                    disabled={aiMealGenerating || !aiMealDescription.trim()}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiMealGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Generate Meal
                      </>
                    )}
                  </button>
                </div>

                {/* Food Items Added */}
                {mealFormData.items.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Added Foods</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {mealFormData.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            item.eaten === false
                              ? 'bg-slate-800/30 border-slate-700/30 opacity-60'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={item.eaten !== false}
                              onChange={(e) => {
                                setMealFormData((prev) => ({
                                  ...prev,
                                  items: prev.items.map((i) =>
                                    i.id === item.id ? { ...i, eaten: e.target.checked } : i
                                  ),
                                }));
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-lg shrink-0">{getFoodIcon(item.name)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm ${item.eaten === false ? 'text-slate-500 line-through' : 'text-white'}`}>
                                  {item.name}
                                </p>
                                {item.id.startsWith('ai-') && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                                    AI
                                  </span>
                                )}
                              </div>
                            <p className="text-xs text-slate-500">
                              {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                            </p>
                              <p className="text-xs text-slate-600 mt-0.5">{item.portion}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFoodItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Totals - Separated Micro and Macro */}
                    <div className="mt-3 space-y-3">
                      {/* Macronutrients Section */}
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-xs font-medium text-emerald-400">Macronutrients</h5>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={mealFormData.manualMacros || false}
                              onChange={(e) => {
                                setMealFormData((prev) => ({
                                  ...prev,
                                  manualMacros: e.target.checked,
                                  // When enabling manual mode, initialize with calculated values if not set
                                  calories: prev.calories ?? (e.target.checked ? formTotals.calories : undefined),
                                  proteinGrams: prev.proteinGrams ?? (e.target.checked ? formTotals.protein : undefined),
                                  carbsGrams: prev.carbsGrams ?? (e.target.checked ? formTotals.carbs : undefined),
                                  fatGrams: prev.fatGrams ?? (e.target.checked ? formTotals.fat : undefined),
                                }));
                              }}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="text-xs text-slate-400">Manually set macros</span>
                          </label>
                        </div>
                        {mealFormData.manualMacros ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Calories (kcal)</label>
                              <div className="relative">
                                <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-orange-400" />
                                <input
                                  type="number"
                                  value={mealFormData.calories ?? ""}
                                  onChange={(e) => setMealFormData((prev) => ({ ...prev, calories: e.target.value ? parseInt(e.target.value) : undefined }))}
                                  placeholder={formTotals.calories.toString()}
                                  min="0"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Protein (g)</label>
                              <div className="relative">
                                <Beef className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-red-400" />
                                <input
                                  type="number"
                                  value={mealFormData.proteinGrams ?? ""}
                                  onChange={(e) => setMealFormData((prev) => ({ ...prev, proteinGrams: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                  placeholder={Math.round(formTotals.protein).toString()}
                                  min="0"
                                  step="0.1"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Carbs (g)</label>
                              <div className="relative">
                                <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-400" />
                                <input
                                  type="number"
                                  value={mealFormData.carbsGrams ?? ""}
                                  onChange={(e) => setMealFormData((prev) => ({ ...prev, carbsGrams: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                  placeholder={Math.round(formTotals.carbs).toString()}
                                  min="0"
                                  step="0.1"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Fat (g)</label>
                              <div className="relative">
                                <Apple className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400" />
                                <input
                                  type="number"
                                  value={mealFormData.fatGrams ?? ""}
                                  onChange={(e) => setMealFormData((prev) => ({ ...prev, fatGrams: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                  placeholder={Math.round(formTotals.fat).toString()}
                                  min="0"
                                  step="0.1"
                                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`grid ${imageAnalysisResult?.macronutrients.fiber ? 'grid-cols-2' : 'grid-cols-2'} gap-2 text-xs`}>
                            <div className="flex items-center gap-2">
                              <Flame className="w-3 h-3 text-orange-400" />
                              <span className="text-slate-300">Calories:</span>
                              <span className="text-white font-medium">{formTotals.calories} kcal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Beef className="w-3 h-3 text-red-400" />
                              <span className="text-slate-300">Protein:</span>
                              <span className="text-white font-medium">{Math.round(formTotals.protein)}g</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Wheat className="w-3 h-3 text-amber-400" />
                              <span className="text-slate-300">Carbs:</span>
                              <span className="text-white font-medium">{Math.round(formTotals.carbs)}g</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Apple className="w-3 h-3 text-purple-400" />
                              <span className="text-slate-300">Fat:</span>
                              <span className="text-white font-medium">{Math.round(formTotals.fat)}g</span>
                            </div>
                            {imageAnalysisResult?.macronutrients.fiber && (
                              <div className="flex items-center gap-2 col-span-2">
                                <Leaf className="w-3 h-3 text-green-400" />
                                <span className="text-slate-300">Fiber:</span>
                                <span className="text-white font-medium">{Math.round(imageAnalysisResult.macronutrients.fiber)}g</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Micronutrients Section - Only show if available from analysis */}
                      {imageAnalysisResult && imageAnalysisResult.micronutrients.length > 0 && (
                        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                          <h5 className="text-xs font-medium text-cyan-400 mb-2">Micronutrients</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {imageAnalysisResult.micronutrients.map((nutrient, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-medium"
                              >
                                {nutrient}
                        </span>
                            ))}
                      </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Food Search */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Add Foods</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                      placeholder="Search foods..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        !selectedCategory
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    {Object.keys(PRESET_FOODS).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedCategory === category
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <span>{FOOD_CATEGORY_ICONS[category] || "🍽️"}</span>
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Food List */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(filteredFoods).map(([category, foods]) => (
                      <div key={category}>
                        <h5 className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1.5">
                          <span>{FOOD_CATEGORY_ICONS[category] || "🍽️"}</span>
                          {category}
                        </h5>
                        <div className="space-y-1">
                          {foods.map((food) => (
                            <button
                              key={food.id}
                              onClick={() => addFoodItem(food)}
                              className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-left"
                            >
                              <span className="text-2xl flex-shrink-0">{getFoodIcon(food.name, category)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{food.name}</p>
                                <p className="text-xs text-slate-500">{food.portion}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-orange-400">{food.calories} kcal</p>
                                <Plus className="w-4 h-4 text-emerald-400 ml-auto" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateMealModal(false);
                      setEditingMeal(null);
                      resetMealForm();
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingMeal ? updateMeal : createMeal}
                    disabled={!isMealFormValid || mealsSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mealsSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingMeal ? "Update Meal" : "Log Meal"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Plan Modal */}
      <AnimatePresence>
        {showCreatePlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreatePlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{editingPlan ? "Edit Diet Plan" : "Create Diet Plan"}</h2>
                  <button
                    onClick={() => setShowCreatePlanModal(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Plan Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Plan Name</label>
                  <input
                    type="text"
                    value={planFormData.name}
                    onChange={(e) => setPlanFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High Protein Muscle Building"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
                  <textarea
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your diet plan..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Diet Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Diet Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {dietTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPlanFormData((prev) => ({ ...prev, type: type.id }))}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          planFormData.type === type.id
                            ? "border-emerald-500 bg-emerald-500/20"
                            : "border-slate-700 bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <p className={`text-sm font-medium ${planFormData.type === type.id ? "text-emerald-400" : "text-white"}`}>
                          {type.label}
                        </p>
                        <p className="text-xs text-slate-500">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Macros */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">Daily Targets</label>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Calories</span>
                      <span className="text-xs text-orange-400 font-medium">{planFormData.targetCalories} kcal</span>
                    </div>
                    <input
                      type="range"
                      min="1200"
                      max="4000"
                      step="50"
                      value={planFormData.targetCalories}
                      onChange={(e) => setPlanFormData((prev) => ({ ...prev, targetCalories: parseInt(e.target.value) }))}
                      className="w-full accent-orange-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Protein</span>
                      <span className="text-xs text-red-400 font-medium">{planFormData.targetProtein}g</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="5"
                      value={planFormData.targetProtein}
                      onChange={(e) => setPlanFormData((prev) => ({ ...prev, targetProtein: parseInt(e.target.value) }))}
                      className="w-full accent-red-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Carbs</span>
                      <span className="text-xs text-amber-400 font-medium">{planFormData.targetCarbs}g</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="5"
                      value={planFormData.targetCarbs}
                      onChange={(e) => setPlanFormData((prev) => ({ ...prev, targetCarbs: parseInt(e.target.value) }))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Fat</span>
                      <span className="text-xs text-purple-400 font-medium">{planFormData.targetFat}g</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="200"
                      step="5"
                      value={planFormData.targetFat}
                      onChange={(e) => setPlanFormData((prev) => ({ ...prev, targetFat: parseInt(e.target.value) }))}
                      className="w-full accent-purple-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Meals per Day</span>
                      <span className="text-xs text-emerald-400 font-medium">{planFormData.mealsPerDay}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="6"
                      step="1"
                      value={planFormData.mealsPerDay}
                      onChange={(e) => setPlanFormData((prev) => ({ ...prev, mealsPerDay: parseInt(e.target.value) }))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreatePlanModal(false);
                      setEditingPlan(null);
                      resetPlanForm();
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingPlan ? updateDietPlan : createDietPlan}
                    disabled={!planFormData.name.trim() || plansSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {plansSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingPlan ? "Update Plan" : "Create Plan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shopping Item Modal */}
      <AnimatePresence>
        {showShoppingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShoppingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">
                {editingShoppingItem ? "Edit Item" : "Add Shopping Item"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Item Name</label>
                  <input
                    type="text"
                    value={shoppingFormData.name}
                    onChange={(e) => setShoppingFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken breast"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quantity (optional)</label>
                  <input
                    type="text"
                    value={shoppingFormData.quantity}
                    onChange={(e) => setShoppingFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g., 500g, 2 packs"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    value={shoppingFormData.category}
                    onChange={(e) => setShoppingFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SHOPPING_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Calories (optional)</label>
                  <input
                    type="number"
                    value={shoppingFormData.calories}
                    onChange={(e) => setShoppingFormData((prev) => ({ ...prev, calories: e.target.value }))}
                    placeholder="e.g., 150"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Calories per item/portion</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                  <input
                    type="text"
                    value={shoppingFormData.notes}
                    onChange={(e) => setShoppingFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowShoppingModal(false);
                    setEditingShoppingItem(null);
                    resetShoppingForm();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingShoppingItem ? updateShoppingItem : createShoppingItem}
                  disabled={!shoppingFormData.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {editingShoppingItem ? "Update" : "Add"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generate Modal */}
      <AnimatePresence>
        {showAIGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAIGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <Wand2 className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Generate with AI</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What do you need to buy?
                  </label>
                  <textarea
                    value={shoppingAiPrompt}
                    onChange={(e) => setShoppingAiPrompt(e.target.value)}
                    placeholder="e.g., Ingredients for a healthy chicken salad for 4 people"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                </div>

                {aiResponse && (
                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <p className="text-sm text-violet-300">{aiResponse}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAIGenerateModal(false);
                    setShoppingAiPrompt("");
                    setAiResponse("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateShoppingWithAI}
                  disabled={!shoppingAiPrompt.trim() || shoppingAiGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shoppingAiGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Generate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View All Shopping List Modal */}
      <AnimatePresence>
        {showViewAllShoppingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowViewAllShoppingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Shopping List</h2>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-slate-400">{shoppingItems.length} items total</p>
                      {totalCalories > 0 && (
                        <p className="text-sm text-orange-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {totalCalories} kcal
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewAllShoppingModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Pending Items */}
                {pendingItems.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">To Buy ({pendingItems.length})</h3>
                      {totalCalories > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame className="w-3 h-3" />
                          <span className="font-medium">Total: {totalCalories} kcal</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {pendingItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 group hover:border-emerald-500/30 transition-colors"
                        >
                          <button
                            onClick={() => toggleShoppingItem(item.id)}
                            className="text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            <Circle className="w-5 h-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-white block truncate">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.quantity && <span className="text-xs text-slate-500">{item.quantity}</span>}
                              {item.category && (
                                <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                                  SHOPPING_CATEGORIES.find(c => c.id === item.category)?.color || 'text-slate-400'
                                } bg-white/5`}>
                                  {SHOPPING_CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                                </span>
                              )}
                              {item.calories && item.calories > 0 && (
                                <span className="text-xs text-orange-400 flex items-center gap-0.5">
                                  <Flame className="w-3 h-3" />
                                  {item.calories} kcal
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                            <button
                              onClick={() => {
                                openEditShoppingItem(item);
                                setShowViewAllShoppingModal(false);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteShoppingItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchased Items */}
                {purchasedItems.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-slate-400">Purchased ({purchasedItems.length})</h3>
                      <button
                        onClick={clearPurchasedItems}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {purchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 opacity-60"
                        >
                          <button
                            onClick={() => toggleShoppingItem(item.id)}
                            className="text-emerald-400"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-400 line-through block truncate">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.quantity && <span className="text-xs text-slate-600">{item.quantity}</span>}
                              {item.calories && item.calories > 0 && (
                                <span className="text-xs text-orange-400/70 flex items-center gap-0.5">
                                  <Flame className="w-3 h-3" />
                                  {item.calories} kcal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {shoppingItems.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Your shopping list is empty</p>
                    <button
                      onClick={() => {
                        setShowViewAllShoppingModal(false);
                        resetShoppingForm();
                        setShowShoppingModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={() => {
                    setShowViewAllShoppingModal(false);
                    setShowAIGenerateModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-500/20 text-violet-400 font-medium hover:bg-violet-500/30 transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate with AI
                </button>
                <button
                  onClick={() => {
                    setShowViewAllShoppingModal(false);
                    resetShoppingForm();
                    setEditingShoppingItem(null);
                    setShowShoppingModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Recipe Modal */}
      <AnimatePresence>
        {showCreateRecipeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCreateRecipeModal(false);
              setEditingRecipe(null);
              resetRecipeForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {editingRecipe ? "Edit Recipe" : "Create New Recipe"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateRecipeModal(false);
                      setEditingRecipe(null);
                      resetRecipeForm();
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Image Capture/Upload for Recipe Analysis */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <label className="text-sm font-medium text-emerald-300">Capture or Upload Recipe Image</label>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Take a photo or upload an image of your recipe to automatically analyze and populate the form
                  </p>

                  {/* Mode Toggle */}
                  <div className="flex gap-2 p-1 bg-slate-800/50 rounded-lg mb-3">
                    <button
                      onClick={() => {
                        setRecipeImageCaptureMode("upload");
                        stopRecipeCamera();
                        if (recipeCapturedImage) {
                          setRecipeCapturedImage(null);
                          setRecipeImageFile(null);
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        recipeImageCaptureMode === "upload"
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                      Upload
                    </button>
                    <button
                      onClick={() => {
                        setRecipeImageCaptureMode("camera");
                        if (!recipeCapturedImage) {
                          startRecipeCamera();
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        recipeImageCaptureMode === "camera"
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 inline mr-1.5" />
                      Camera
                    </button>
                  </div>

                  {/* Camera View */}
                  {recipeImageCaptureMode === "camera" && (
                    <div className="space-y-3">
                      {!recipeCapturedImage ? (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          {isRecipeCameraActive ? (
                            <>
                              <video
                                ref={recipeVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              <canvas ref={recipeCanvasRef} className="hidden" />
                              <div className="absolute inset-0 flex items-end justify-center p-4">
                                <button
                                  onClick={captureRecipePhoto}
                                  disabled={!isRecipeCameraActive}
                                  className="w-14 h-14 rounded-full bg-white border-4 border-slate-300 shadow-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                  <Camera className="w-6 h-6 text-slate-800" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <VideoOff className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                                <p className="text-slate-400 mb-4">Camera not active</p>
                                <button
                                  onClick={startRecipeCamera}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm"
                                >
                                  Start Camera
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          <Image
                            src={recipeCapturedImage}
                            alt="Captured recipe"
                            fill
                            className="object-contain"
                          />
                          <button
                            onClick={() => {
                              setRecipeCapturedImage(null);
                              setRecipeImageFile(null);
                              setRecipeImageAnalysisResult(null);
                              setRecipeImageAnalysisError(null);
                              if (recipeImageCaptureMode === "camera") {
                                startRecipeCamera();
                              }
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload View */}
                  {recipeImageCaptureMode === "upload" && (
                    <div className="space-y-3">
                      {!recipeCapturedImage ? (
                        <div
                          onClick={() => recipeFileInputRef.current?.click()}
                          className="relative aspect-[4/3] bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800 transition-colors"
                        >
                          <input
                            ref={recipeFileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                            onChange={handleRecipeFileChange}
                            className="hidden"
                          />
                          <Upload className="w-12 h-12 mb-4 text-slate-400" />
                          <p className="text-slate-400 mb-1">Click to upload or drag and drop</p>
                          <p className="text-slate-500 text-xs">
                            JPEG, PNG, WebP, or HEIC (max 10MB)
                          </p>
                        </div>
                      ) : (
                        <div className="relative aspect-[4/3] bg-slate-800 rounded-xl overflow-hidden">
                          <Image
                            src={recipeCapturedImage}
                            alt="Uploaded recipe"
                            fill
                            className="object-contain"
                          />
                          <button
                            onClick={() => {
                              setRecipeCapturedImage(null);
                              setRecipeImageFile(null);
                              setRecipeImageAnalysisResult(null);
                              setRecipeImageAnalysisError(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Display */}
                  {recipeImageAnalysisError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-300 text-xs">{recipeImageAnalysisError}</p>
                    </div>
                  )}

                  {/* Analysis Result Preview */}
                  {recipeImageAnalysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-emerald-400 font-medium text-xs mb-1">Analysis Complete</p>
                          <p className="text-slate-300 text-xs line-clamp-2">
                            Recipe data extracted and form populated
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Analyze Button */}
                  {recipeCapturedImage && !recipeImageAnalysisResult && (
                    <button
                      onClick={analyzeRecipeImage}
                      disabled={isAnalyzingRecipeImage}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzingRecipeImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4" />
                          Analyze Recipe Image
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Recipe Name *</label>
                    <input
                      type="text"
                      value={recipeFormData.name}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Grilled Chicken Salad"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                      value={recipeFormData.description}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your recipe..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                      value={recipeFormData.category}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                      <option value="dessert">Dessert</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cuisine</label>
                    <input
                      type="text"
                      value={recipeFormData.cuisine}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, cuisine: e.target.value }))}
                      placeholder="e.g., Italian, Mexican, Asian"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Time & Servings */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Prep Time (min)</label>
                    <input
                      type="number"
                      value={recipeFormData.prepTimeMinutes || ""}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, prepTimeMinutes: parseInt(e.target.value) || 0 }))}
                      placeholder="15"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cook Time (min)</label>
                    <input
                      type="number"
                      value={recipeFormData.cookTimeMinutes || ""}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, cookTimeMinutes: parseInt(e.target.value) || 0 }))}
                      placeholder="30"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Servings</label>
                    <input
                      type="number"
                      value={recipeFormData.servings}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="50"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                    <select
                      value={recipeFormData.difficulty}
                      onChange={(e) => setRecipeFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Nutrition per Serving */}
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Nutrition per Serving</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Calories</label>
                      <input
                        type="number"
                        value={recipeFormData.caloriesPerServing || ""}
                        onChange={(e) => setRecipeFormData((prev) => ({ ...prev, caloriesPerServing: parseInt(e.target.value) || 0 }))}
                        placeholder="350"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={recipeFormData.proteinGrams || ""}
                        onChange={(e) => setRecipeFormData((prev) => ({ ...prev, proteinGrams: parseInt(e.target.value) || 0 }))}
                        placeholder="25"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={recipeFormData.carbsGrams || ""}
                        onChange={(e) => setRecipeFormData((prev) => ({ ...prev, carbsGrams: parseInt(e.target.value) || 0 }))}
                        placeholder="30"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={recipeFormData.fatGrams || ""}
                        onChange={(e) => setRecipeFormData((prev) => ({ ...prev, fatGrams: parseInt(e.target.value) || 0 }))}
                        placeholder="15"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={recipeFormData.fiberGrams || ""}
                        onChange={(e) => setRecipeFormData((prev) => ({ ...prev, fiberGrams: parseInt(e.target.value) || 0 }))}
                        placeholder="5"
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">Ingredients</h4>
                    <button
                      type="button"
                      onClick={() => setRecipeFormData((prev) => ({
                        ...prev,
                        ingredients: [...prev.ingredients, { name: "", quantity: "", unit: "", notes: "" }]
                      }))}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Ingredient
                    </button>
                  </div>
                  {recipeFormData.ingredients.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                      No ingredients added yet. Click &quot;Add Ingredient&quot; to start.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recipeFormData.ingredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={ing.quantity}
                            onChange={(e) => {
                              const newIngredients = [...recipeFormData.ingredients];
                              newIngredients[idx] = { ...newIngredients[idx], quantity: e.target.value };
                              setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                            }}
                            placeholder="2"
                            className="w-16 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={ing.unit}
                            onChange={(e) => {
                              const newIngredients = [...recipeFormData.ingredients];
                              newIngredients[idx] = { ...newIngredients[idx], unit: e.target.value };
                              setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                            }}
                            placeholder="cups"
                            className="w-20 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input
                            type="text"
                            value={ing.name}
                            onChange={(e) => {
                              const newIngredients = [...recipeFormData.ingredients];
                              newIngredients[idx] = { ...newIngredients[idx], name: e.target.value };
                              setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                            }}
                            placeholder="Ingredient name"
                            className="flex-1 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newIngredients = recipeFormData.ingredients.filter((_, i) => i !== idx);
                              setRecipeFormData((prev) => ({ ...prev, ingredients: newIngredients }));
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">Instructions</h4>
                    <button
                      type="button"
                      onClick={() => setRecipeFormData((prev) => ({
                        ...prev,
                        instructions: [...prev.instructions, { step: prev.instructions.length + 1, description: "" }]
                      }))}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Step
                    </button>
                  </div>
                  {recipeFormData.instructions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                      No instructions added yet. Click &quot;Add Step&quot; to start.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {recipeFormData.instructions.map((inst, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-medium shrink-0">
                            {idx + 1}
                          </div>
                          <textarea
                            value={inst.description}
                            onChange={(e) => {
                              const newInstructions = [...recipeFormData.instructions];
                              newInstructions[idx] = { ...newInstructions[idx], description: e.target.value };
                              setRecipeFormData((prev) => ({ ...prev, instructions: newInstructions }));
                            }}
                            placeholder="Describe this step..."
                            rows={2}
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newInstructions = recipeFormData.instructions
                                .filter((_, i) => i !== idx)
                                .map((inst, i) => ({ ...inst, step: i + 1 }));
                              setRecipeFormData((prev) => ({ ...prev, instructions: newInstructions }));
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {recipeFormData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setRecipeFormData((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== idx)
                          }))}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="tag-input"
                      placeholder="Add a tag (e.g., high-protein, quick)"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const value = input.value.trim();
                          if (value && !recipeFormData.tags.includes(value)) {
                            setRecipeFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('tag-input') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value && !recipeFormData.tags.includes(value)) {
                          setRecipeFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Dietary Flags */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Dietary Flags</label>
                  <div className="flex flex-wrap gap-2">
                    {["vegetarian", "vegan", "gluten-free", "dairy-free", "keto", "paleo", "low-carb", "high-protein"].map((flag) => (
                      <button
                        key={flag}
                        type="button"
                        onClick={() => setRecipeFormData((prev) => ({
                          ...prev,
                          dietaryFlags: prev.dietaryFlags.includes(flag)
                            ? prev.dietaryFlags.filter((f) => f !== flag)
                            : [...prev.dietaryFlags, flag]
                        }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          recipeFormData.dietaryFlags.includes(flag)
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
                        }`}
                      >
                        {flag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateRecipeModal(false);
                    setEditingRecipe(null);
                    resetRecipeForm();
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRecipe ? updateRecipe : createRecipe}
                  disabled={!recipeFormData.name.trim() || recipesSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {recipesSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingRecipe ? "Update Recipe" : "Create Recipe"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Delete Item?</h3>
              <p className="text-slate-400 text-center text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.startsWith("meal-")) {
                      deleteMeal(showDeleteConfirm.replace("meal-", ""));
                    } else if (showDeleteConfirm.startsWith("plan-")) {
                      deleteDietPlan(showDeleteConfirm.replace("plan-", ""));
                    } else if (showDeleteConfirm.startsWith("recipe-")) {
                      deleteRecipe(showDeleteConfirm.replace("recipe-", ""));
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        recipe={viewingRecipe}
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        onEdit={openEditRecipe}
        onToggleFavorite={toggleRecipeFavorite}
      />
    </div>
  );
}
