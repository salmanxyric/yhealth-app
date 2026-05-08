"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Coffee, Sun, Sunset, Cookie } from "lucide-react";
import toast from "react-hot-toast";
import { aiCoachService } from "@/src/shared/services/ai-coach.service";
import { api } from "@/lib/api-client";
import {
  nutritionService,
  DietPlan,
  MealLog,
  MealFood,
  Recipe,
  RecipeIngredient,
  RecipeInstruction,
} from "@/src/shared/services";
import type {
  MacroTarget,
  WaterIntakeLog,
  ShoppingItem,
  ClientMeal,
  ClientDietPlan,
  FoodAnalysisResult,
  NutritionLabelData,
} from "../types";
import { PRESET_FOODS } from "../constants";

// ============================================
// INTERNAL CONSTANTS
// ============================================

const mealIconsList = [
  { id: "breakfast", icon: Coffee, label: "Breakfast" },
  { id: "lunch", icon: Sun, label: "Lunch" },
  { id: "dinner", icon: Sunset, label: "Dinner" },
  { id: "snack", icon: Cookie, label: "Snack" },
];

// ============================================
// TRANSFORM HELPERS
// ============================================

function transformApiPlanToClient(plan: DietPlan): ClientDietPlan {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.goalCategory || "balanced",
    targetCalories: plan.dailyCalories || 2000,
    targetProtein: plan.proteinGrams || 120,
    targetCarbs: plan.carbsGrams || 200,
    targetFat: plan.fatGrams || 65,
    mealsPerDay: plan.mealsPerDay || 3,
    createdAt: plan.createdAt.split("T")[0],
    isActive: plan.status === "active",
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
  const hours = eatenAt.getHours().toString().padStart(2, "0");
  const minutes = eatenAt.getMinutes().toString().padStart(2, "0");
  const time = `${hours}:${minutes}`;

  const foods: MealFood[] = (meal.foods || []).map((f: MealFood, idx: number) => ({
    ...f,
    id: f.id || `food-${meal.id}-${idx}`,
    name: f.name || "Unknown food",
    calories: f.calories || 0,
    protein: f.protein || 0,
    carbs: f.carbs || 0,
    fat: f.fat || 0,
    portion: f.portion || "1 serving",
    quantity: f.quantity || 1,
  }));

  let protein = meal.proteinGrams || 0;
  let carbs = meal.carbsGrams || 0;
  let fat = meal.fatGrams || 0;
  const calories = meal.calories || 0;

  if (protein === 0 && carbs === 0 && fat === 0 && foods.length > 0) {
    const itemTotals = foods.reduce(
      (acc, item) => ({
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );
    protein = itemTotals.protein;
    carbs = itemTotals.carbs;
    fat = itemTotals.fat;
  }

  if (protein === 0 && carbs === 0 && fat === 0 && calories > 0) {
    protein = Math.round((calories * 0.3) / 4);
    carbs = Math.round((calories * 0.4) / 4);
    fat = Math.round((calories * 0.3) / 9);
  }

  return {
    id: meal.id,
    name: meal.mealName || meal.mealType,
    time,
    calories,
    protein,
    carbs,
    fat,
    items: foods,
    completed: true,
    icon: mealTypeToIcon[meal.mealType] || "snack",
    mealType: meal.mealType,
  };
}

// ============================================
// FORM DATA TYPES (internal to hook)
// ============================================

export interface MealFormDataInternal {
  name: string;
  time: string;
  icon: "breakfast" | "lunch" | "dinner" | "snack";
  items: (MealFood & { eaten?: boolean })[];
  originalDate?: Date;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  manualMacros?: boolean;
}

export interface PlanFormDataInternal {
  name: string;
  type: string;
  description: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealsPerDay: number;
}

export interface ShoppingFormDataInternal {
  name: string;
  quantity: string;
  category: string;
  notes: string;
  calories: string;
}

export interface RecipeFormDataInternal {
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
  imageUrl: string | null;
}

// ============================================
// HOOK - time parsing helper
// ============================================

function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const trimmed = timeStr.trim();
  let hours: number;
  let minutes: number;
  if (trimmed.includes("AM") || trimmed.includes("PM")) {
    const [timePart, period] = trimmed.split(/\s*(AM|PM)/i);
    const [h, m] = timePart.split(":").map(Number);
    hours = period.toUpperCase() === "PM" ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    minutes = m || 0;
  } else {
    const [h, m] = trimmed.split(":").map(Number);
    hours = h || 0;
    minutes = m || 0;
  }
  hours = Math.max(0, Math.min(23, hours));
  minutes = Math.max(0, Math.min(59, minutes));
  return { hours, minutes };
}

// ============================================
// MAIN HOOK
// ============================================

export function useNutritionData() {
  // ── Active view ──
  const [activeView, setActiveView] = useState<"today" | "plan" | "recipes" | "analytics" | "history">("today");

  // ── Diet Plans ──
  const [dietPlans, setDietPlans] = useState<ClientDietPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansSaving, setPlansSaving] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

  // ── Meals ──
  const [meals, setMeals] = useState<ClientMeal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [mealsSaving, setMealsSaving] = useState(false);

  // ── Water ──
  const [waterLog, setWaterLog] = useState<WaterIntakeLog | null>(null);
  const [waterLoading, setWaterLoading] = useState(true);
  const [waterUpdating, setWaterUpdating] = useState(false);

  // ── Shopping ──
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [shoppingLoading, setShoppingLoading] = useState(true);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showViewAllShoppingModal, setShowViewAllShoppingModal] = useState(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState<ShoppingItem | null>(null);
  const [shoppingAiPrompt, setShoppingAiPrompt] = useState("");
  const [shoppingAiGenerating, setShoppingAiGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [shoppingFormData, setShoppingFormData] = useState<ShoppingFormDataInternal>({
    name: "",
    quantity: "",
    category: "other",
    notes: "",
    calories: "",
  });

  // ── Recipes ──
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipesSaving, setRecipesSaving] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [recipeFilterCategory, setRecipeFilterCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [recipeFormData, setRecipeFormData] = useState<RecipeFormDataInternal>({
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
    imageUrl: null,
  });
  const [isUploadingRecipeImage, setIsUploadingRecipeImage] = useState(false);
  const recipeImageInputRef = useRef<HTMLInputElement | null>(null);

  // ── Modals ──
  const [showCreateMealModal, setShowCreateMealModal] = useState(false);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [mealInputMode, setMealInputMode] = useState<"manual" | "ai" | "image">("manual");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [customFoodDraft, setCustomFoodDraft] = useState<{
    name: string; calories: string; protein: string; carbs: string; fat: string; portion: string;
  }>({ name: "", calories: "", protein: "", carbs: "", fat: "", portion: "1 serving" });
  const [editingMeal, setEditingMeal] = useState<ClientMeal | null>(null);
  const [editingPlan, setEditingPlan] = useState<ClientDietPlan | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // ── Meal form ──
  const [mealFormData, setMealFormData] = useState<MealFormDataInternal>({
    name: "",
    time: "12:00",
    icon: "lunch",
    items: [],
    manualMacros: false,
  });

  // ── Plan form ──
  const [planFormData, setPlanFormData] = useState<PlanFormDataInternal>({
    name: "",
    type: "balanced",
    description: "",
    targetCalories: 2000,
    targetProtein: 120,
    targetCarbs: 200,
    targetFat: 65,
    mealsPerDay: 4,
  });

  // ── Food search ──
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // ── AI ──
  const [, setAiTips] = useState<string | string[]>("");
  const [aiMealDescription, setAiMealDescription] = useState("");
  const [aiMealGenerating, setAiMealGenerating] = useState(false);
  const [aiMealError, setAiMealError] = useState<string | null>(null);

  // ── Image capture (meal) ──
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
  const [imageScanMode, setImageScanMode] = useState<"food" | "label">("food");
  const [nutritionLabelData, setNutritionLabelData] = useState<NutritionLabelData | null>(null);

  // ── Image capture (recipe) ──
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

  // ── AI plan ──
  const [aiPlanGenerating, setAiPlanGenerating] = useState(false);

  // ── Original meal data for editing ──
  const [originalMealData, setOriginalMealData] = useState<Map<string, MealLog>>(new Map());

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
          prev.map((p) => ({ ...p, isActive: p.id === planId }))
        );
      }
    } catch (error) {
      console.error("Failed to activate diet plan:", error);
    }
  };

  const generateAIDietPlan = async () => {
    setAiPlanGenerating(true);
    try {
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
      }>("/plans/generate-onboarding-plans", {});
      if (response.success && response.data?.dietPlan) {
        await fetchDietPlans();
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

  const fetchMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const response = await nutritionService.getMeals({ date: today });
      if (response.success && response.data?.meals) {
        const clientMeals = response.data.meals.map(transformApiMealToClient);
        setMeals(clientMeals);
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
    if (!mealFormData.manualMacros && mealFormData.items.length === 0) return;
    setMealsSaving(true);
    try {
      const eatenFoods = mealFormData.items.filter((item) => item.eaten !== false);
      const totals = eatenFoods.reduce(
        (acc, item) => {
          const qty = item.quantity || 1;
          return {
            calories: acc.calories + item.calories * qty,
            protein: acc.protein + item.protein * qty,
            carbs: acc.carbs + item.carbs * qty,
            fat: acc.fat + item.fat * qty,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const finalCalories = mealFormData.manualMacros && mealFormData.calories !== undefined ? mealFormData.calories : totals.calories;
      const finalProtein = mealFormData.manualMacros && mealFormData.proteinGrams !== undefined ? mealFormData.proteinGrams : totals.protein;
      const finalCarbs = mealFormData.manualMacros && mealFormData.carbsGrams !== undefined ? mealFormData.carbsGrams : totals.carbs;
      const finalFat = mealFormData.manualMacros && mealFormData.fatGrams !== undefined ? mealFormData.fatGrams : totals.fat;

      const now = new Date();
      const { hours, minutes } = parseTimeString(mealFormData.time);
      now.setHours(hours, minutes, 0, 0);
      const eatenAtISO = now.toISOString();

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
        toast.success("Meal logged successfully!");
      } else {
        toast.error("Failed to save meal. Server returned an error.");
      }
    } catch (error) {
      console.error("Failed to create meal:", error);
      toast.error("Failed to save meal. Please try again.");
    } finally {
      setMealsSaving(false);
    }
  };

  const updateMeal = async () => {
    if (!editingMeal || !mealFormData.name.trim()) return;
    setMealsSaving(true);
    try {
      const eatenFoods = mealFormData.items.filter((item) => item.eaten !== false);
      const totals = eatenFoods.length > 0
        ? eatenFoods.reduce(
            (acc, item) => {
              const qty = item.quantity || 1;
              return {
                calories: acc.calories + item.calories * qty,
                protein: acc.protein + item.protein * qty,
                carbs: acc.carbs + item.carbs * qty,
                fat: acc.fat + item.fat * qty,
              };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
        : { calories: 0, protein: 0, carbs: 0, fat: 0 };

      const baseDate = mealFormData.originalDate || new Date();
      const { hours, minutes } = parseTimeString(mealFormData.time);
      const eatenAtDate = new Date(baseDate);
      eatenAtDate.setHours(hours, minutes, 0, 0);
      const eatenAtISO = eatenAtDate.toISOString();

      const finalCalories = mealFormData.manualMacros && mealFormData.calories !== undefined ? mealFormData.calories : totals.calories;
      const finalProtein = mealFormData.manualMacros && mealFormData.proteinGrams !== undefined ? mealFormData.proteinGrams : totals.protein;
      const finalCarbs = mealFormData.manualMacros && mealFormData.carbsGrams !== undefined ? mealFormData.carbsGrams : totals.carbs;
      const finalFat = mealFormData.manualMacros && mealFormData.fatGrams !== undefined ? mealFormData.fatGrams : totals.fat;

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

      if (eatenFoods.length > 0) {
        const foodsToSend = eatenFoods.map(({ eaten: _eaten, ...food }) => food);
        updatePayload.foods = foodsToSend;
      }

      const response = await nutritionService.updateMeal(editingMeal.id, updatePayload);

      if (response.success && response.data?.meal) {
        const updatedMeal = transformApiMealToClient(response.data.meal);
        setMeals((prev) =>
          prev.map((m) => (m.id === editingMeal.id ? updatedMeal : m)).sort((a, b) => a.time.localeCompare(b.time))
        );
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

  const findFoodNutrition = (foodName: string): MealFood | null => {
    const normalizedName = foodName.toLowerCase().trim();
    for (const category of Object.values(PRESET_FOODS)) {
      for (const food of category) {
        const normalizedFoodName = food.name.toLowerCase();
        if (normalizedFoodName.includes(normalizedName) || normalizedName.includes(normalizedFoodName.split("(")[0].trim())) {
          return food;
        }
      }
    }
    return null;
  };

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
        const parsedItems = (meal.foods || []).map((food: unknown, idx: number) => {
          const f = (typeof food === "object" && food !== null ? food : { name: String(food) }) as Record<string, unknown>;
          const foodName = String(f.name || f.food || f.item || "Food item");
          const foodPortion = String(f.portion || f.serving || f.amount || "1 serving");
          let calories = Number(f.calories || f.kcal || 0);
          let protein = Number(f.protein || f.proteinGrams || f.proteinG || 0);
          let carbs = Number(f.carbs || f.carbohydrates || f.carbsGrams || f.carbG || 0);
          let fat = Number(f.fat || f.fatGrams || f.fatG || f.totalFat || 0);
          if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
            const presetFood = findFoodNutrition(foodName);
            if (presetFood) {
              calories = presetFood.calories || 0;
              protein = presetFood.protein || 0;
              carbs = presetFood.carbs || 0;
              fat = presetFood.fat || 0;
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
            eaten: true,
          };
        });
        setMealFormData((prev) => ({
          ...prev,
          name: meal.mealName || prev.name || "AI Generated Meal",
          items: parsedItems,
          calories: meal.calories || parsedItems.reduce((s: number, i: { calories: number }) => s + i.calories, 0) || undefined,
          proteinGrams: meal.proteinGrams || parsedItems.reduce((s: number, i: { protein: number }) => s + i.protein, 0) || undefined,
          carbsGrams: meal.carbsGrams || parsedItems.reduce((s: number, i: { carbs: number }) => s + i.carbs, 0) || undefined,
          fatGrams: meal.fatGrams || parsedItems.reduce((s: number, i: { fat: number }) => s + i.fat, 0) || undefined,
        }));
        setAiMealDescription("");
        if (response.data.preparationTips) {
          setAiTips(response.data.preparationTips);
        }
        toast.success(`Generated: ${meal.mealName || "AI Meal"} — Click Log Meal to save`);
      } else {
        setAiMealError("AI returned empty response. Please try again with more detail.");
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
        imageUrl: recipeFormData.imageUrl || undefined,
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
        imageUrl: recipeFormData.imageUrl ?? undefined,
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

  const resetMealForm = useCallback(() => {
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
    setAiMealDescription("");
    setAiMealError(null);
    setCapturedImage(null);
    setImageFile(null);
    setImageAnalysisResult(null);
    setImageAnalysisError(null);
    setMealImageDescription("");
    setImageScanMode("food");
    setNutritionLabelData(null);
    stopCamera();
  }, [stopCamera]);

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

  const resetRecipeForm = useCallback(() => {
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
      imageUrl: null,
    });
    setRecipeCapturedImage(null);
    setRecipeImageFile(null);
    setRecipeImageAnalysisResult(null);
    setRecipeImageAnalysisError(null);
    stopRecipeCamera();
  }, [stopRecipeCamera]);

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
      imageUrl: recipe.imageUrl ?? null,
    });
    setShowCreateRecipeModal(true);
  };

  const handleRecipeImageSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10 MB)");
      return;
    }
    setIsUploadingRecipeImage(true);
    try {
      const { imageUrl } = await nutritionService.uploadRecipeImage(file);
      setRecipeFormData((prev) => ({ ...prev, imageUrl }));
      toast.success("Image uploaded");
    } catch (err) {
      console.error("Failed to upload recipe image:", err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingRecipeImage(false);
      if (recipeImageInputRef.current) recipeImageInputRef.current.value = "";
    }
  };

  const openEditMeal = (meal: ClientMeal) => {
    setEditingMeal(meal);
    const originalMeal = originalMealData.get(meal.id);
    const originalDate = originalMeal ? new Date(originalMeal.eatenAt) : new Date();
    const calculatedTotals = meal.items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    const tolerance = 0.01;
    const hasManualMacros =
      meal.items.length === 0 ||
      Math.abs(meal.calories - calculatedTotals.calories) > tolerance ||
      Math.abs(meal.protein - calculatedTotals.protein) > tolerance ||
      Math.abs(meal.carbs - calculatedTotals.carbs) > tolerance ||
      Math.abs(meal.fat - calculatedTotals.fat) > tolerance;
    setMealFormData({
      name: meal.name,
      time: meal.time,
      icon: meal.icon,
      items: meal.items.map((item) => ({ ...item, eaten: true })),
      originalDate,
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

  const addFoodItem = (food: MealFood) => {
    const existingIndex = mealFormData.items.findIndex(
      (i) => i.name.trim().toLowerCase() === food.name.trim().toLowerCase()
    );
    if (existingIndex !== -1) {
      setMealFormData((prev) => ({
        ...prev,
        items: prev.items.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        ),
      }));
      const newQty = (mealFormData.items[existingIndex].quantity || 1) + 1;
      toast.success(`${food.name} × ${newQty}`);
      return;
    }
    setMealFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...food, id: Date.now().toString(), eaten: true, quantity: 1 }],
    }));
    toast.success(`${food.name} added`);
  };

  const addCustomFood = () => {
    const name = customFoodDraft.name.trim();
    if (!name) {
      toast.error("Please enter a food name");
      return;
    }
    const toNum = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    const food: MealFood = {
      id: `custom-${Date.now()}`,
      name,
      calories: Math.round(toNum(customFoodDraft.calories)),
      protein: toNum(customFoodDraft.protein),
      carbs: toNum(customFoodDraft.carbs),
      fat: toNum(customFoodDraft.fat),
      portion: customFoodDraft.portion.trim() || "1 serving",
    };
    addFoodItem(food);
    setCustomFoodDraft({ name: "", calories: "", protein: "", carbs: "", fat: "", portion: "1 serving" });
    setShowCustomFood(false);
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
  // IMAGE CAPTURE & ANALYSIS (stubbed - logic stays in NutritionTab for now since it touches refs)
  // ============================================
  // NOTE: The image capture/analysis logic (startCamera, capturePhoto, analyzeFoodImage,
  // parseRecipeAnalysis, analyzeRecipeImage, etc.) are left in NutritionTab.tsx because
  // they heavily reference DOM refs (videoRef, canvasRef) that must remain in the component.
  // They are exposed via the return object for the component to use.

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
      setImageCaptureMode("upload");
    }
  }, [isCameraActive]);

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
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setImageFile(file);
        setCapturedImage(url);
        stopCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [stopCamera]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

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

      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            result.foodsIdentified = parsed.items.map((item: { name?: string; food?: string; portion?: string; quantity?: string; calories?: number; protein?: number; carbs?: number; carbohydrates?: number; fat?: number; fats?: number }, idx: number) => ({
              name: (item.name || item.food || `Food ${idx + 1}`).replace(/\*\*/g, ""),
              portion: item.portion || item.quantity || "1 serving",
              calories: typeof item.calories === "number" ? item.calories : undefined,
              protein: typeof item.protein === "number" ? item.protein : undefined,
              carbs: typeof item.carbs === "number" ? item.carbs : (typeof item.carbohydrates === "number" ? item.carbohydrates : undefined),
              fat: typeof item.fat === "number" ? item.fat : (typeof item.fats === "number" ? item.fats : undefined),
            }));
            if (typeof parsed.totalCalories === "number") result.caloriesEstimate = `${parsed.totalCalories} kcal`;
            if (typeof parsed.totalProtein === "number") result.macronutrients.protein = parsed.totalProtein;
            if (typeof parsed.totalCarbs === "number") result.macronutrients.carbs = parsed.totalCarbs;
            if (typeof parsed.totalFat === "number") result.macronutrients.fats = parsed.totalFat;
            if (typeof parsed.totalFiber === "number") result.macronutrients.fiber = parsed.totalFiber;
            if (parsed.analysis) result.analysis = parsed.analysis;
            if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
              result.nutritionSuggestions = parsed.recommendations;
            }
            return result;
          }
        } catch {
          // JSON parse failed, fall through to text parsing
        }
      }

      // Fallback text parsing (simplified - full version kept for compatibility)
      const foodsMatch = analysis.match(/\*\*Foods Identified:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i)
        || analysis.match(/(?:Foods?|Items?)(?:\s+Identified)?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i);

      if (foodsMatch && result.foodsIdentified.length === 0) {
        const foodsText = foodsMatch[1] || foodsMatch[0];
        const foodLines = foodsText.split("\n").filter((line: string) => line.trim() && !line.match(/^[-*]\s*$/));
        result.foodsIdentified = foodLines.map((line: string, idx: number) => {
          const match = line.match(/(?:\d+\.\s*)?(.+?)\s*\(([^)]+)\)(?:\s*-\s*~?(\d+)\s*kcal)?/);
          if (match) {
            return { name: match[1].trim(), portion: match[2].trim(), calories: match[3] ? parseInt(match[3]) : undefined };
          }
          const nameMatch = line.match(/(?:\d+\.\s*)?(.+?)(?:\s*-\s*|$)/);
          return { name: nameMatch ? nameMatch[1].trim() : `Food ${idx + 1}`, portion: "1 serving" };
        }).filter((food: { name: string } | null): food is { name: string; portion: string } => food !== null);
      }

      const caloriesMatch = analysis.match(/\*\*Estimated Calories:\*\*\s*(.+?)(?=\n\n|\*\*|$)/);
      if (caloriesMatch) result.caloriesEstimate = caloriesMatch[1].trim();

      const macrosMatch = analysis.match(/\*\*Macronutrients:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/);
      if (macrosMatch) {
        const macrosText = macrosMatch[1];
        const proteinMatch = macrosText.match(/Protein:\s*(\d+(?:\.\d+)?)\s*g/i);
        const carbsMatch2 = macrosText.match(/Carbohydrates?:\s*(\d+(?:\.\d+)?)\s*g/i);
        const fatsMatch = macrosText.match(/Fats?:\s*(\d+(?:\.\d+)?)\s*g/i);
        if (proteinMatch) result.macronutrients.protein = parseFloat(proteinMatch[1]);
        if (carbsMatch2) result.macronutrients.carbs = parseFloat(carbsMatch2[1]);
        if (fatsMatch) result.macronutrients.fats = parseFloat(fatsMatch[1]);
      }

      return result;
    } catch (error) {
      console.error("Failed to parse food analysis:", error);
      return null;
    }
  }, []);

  const populateMealFromAnalysis = useCallback((analysis: FoodAnalysisResult) => {
    if (!analysis.foodsIdentified.length) return;
    const mealName = analysis.foodsIdentified[0]?.name
      ? `${analysis.foodsIdentified[0].name}${analysis.foodsIdentified.length > 1 ? ` + ${analysis.foodsIdentified.length - 1} more` : ""}`
      : "AI Analyzed Meal";

    const mealItems = analysis.foodsIdentified.map((food, idx) => {
      const presetFood = findFoodNutrition(food.name);
      const totalFoods = analysis.foodsIdentified.length;
      let calories = food.calories ?? undefined;
      let protein = food.protein ?? undefined;
      let carbs = food.carbs ?? undefined;
      let fat = food.fat ?? undefined;
      const hasMacros = (protein !== undefined && protein > 0) || (carbs !== undefined && carbs > 0) || (fat !== undefined && fat > 0);
      if (!hasMacros) {
        if (presetFood) {
          calories = calories ?? (presetFood.calories || 0);
          protein = presetFood.protein || 0;
          carbs = presetFood.carbs || 0;
          fat = presetFood.fat || 0;
        } else if (totalFoods > 0 && analysis.macronutrients && (analysis.macronutrients.protein > 0 || analysis.macronutrients.carbs > 0 || analysis.macronutrients.fats > 0)) {
          protein = Math.round(analysis.macronutrients.protein / totalFoods);
          carbs = Math.round(analysis.macronutrients.carbs / totalFoods);
          fat = Math.round(analysis.macronutrients.fats / totalFoods);
          if (!calories) calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
        } else if (calories && calories > 0) {
          protein = Math.round((calories * 0.3) / 4);
          carbs = Math.round((calories * 0.4) / 4);
          fat = Math.round((calories * 0.3) / 9);
        }
      }
      const item: MealFood & { eaten?: boolean } = {
        id: `ai-${Date.now()}-${idx}`,
        name: food.name,
        portion: food.portion || presetFood?.portion || "1 serving",
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

  const analyzeFoodImage = useCallback(async () => {
    if (!imageFile) return;
    setIsAnalyzingImage(true);
    setImageAnalysisError(null);
    setImageAnalysisResult(null);
    try {
      const result = await aiCoachService.analyzeImage(imageFile, undefined, mealImageDescription.trim() || undefined);
      if (result.imageType !== "food_photo") {
        toast.error("Image doesn't appear to be food. Please upload a food image.");
        setImageAnalysisError("Non-food image detected");
        return;
      }
      const analysisText = typeof result.analysis === "string" ? result.analysis : result.analysis?.analysis || "Analysis completed";
      const parsedResult = parseFoodAnalysis(analysisText);
      if (parsedResult) {
        setImageAnalysisResult(parsedResult);
        if (parsedResult.foodsIdentified && parsedResult.foodsIdentified.length > 0) {
          populateMealFromAnalysis(parsedResult);
          toast.success(`Food analyzed successfully! Added ${parsedResult.foodsIdentified.length} food item(s).`);
        } else {
          toast.success("Food analyzed successfully! Check the analysis details below.");
        }
      } else {
        setImageAnalysisError("Failed to parse analysis. Please try again.");
        toast.error("Failed to parse nutrition data");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image";
      setImageAnalysisError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [imageFile, mealImageDescription, parseFoodAnalysis, populateMealFromAnalysis]);

  const parseNutritionLabel = useCallback((text: string): NutritionLabelData | null => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.nutrients) return null;
      return {
        productName: parsed.productName || null,
        servingSize: parsed.servingSize || null,
        servingsPerContainer: typeof parsed.servingsPerContainer === "number" ? parsed.servingsPerContainer : null,
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

  const analyzeNutritionLabel = useCallback(async () => {
    if (!imageFile) return;
    setIsAnalyzingImage(true);
    setImageAnalysisError(null);
    setNutritionLabelData(null);
    try {
      const result = await aiCoachService.analyzeImage(imageFile, undefined, "scan nutrition label");
      if (result.imageType !== "nutrition_label" && result.imageType !== "food_photo") {
        toast.error("Image doesn't appear to be a nutrition label. Please try again.");
        setImageAnalysisError("Not a nutrition label image");
        return;
      }
      const analysisText = typeof result.analysis === "string" ? result.analysis : result.analysis?.analysis || "";
      const parsed = parseNutritionLabel(analysisText);
      if (parsed) {
        setNutritionLabelData(parsed);
        toast.success("Nutrition label scanned successfully!");
      } else {
        setImageAnalysisError("Could not extract nutrition data. Try a clearer photo.");
        toast.error("Failed to extract nutrition data");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scan label";
      setImageAnalysisError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [imageFile, parseNutritionLabel]);

  const populateMealFromLabel = useCallback((data: NutritionLabelData, servings: number) => {
    const cal = Math.round((data.nutrients.calories || 0) * servings);
    const pro = Math.round((data.nutrients.protein || 0) * servings * 10) / 10;
    const carb = Math.round((data.nutrients.totalCarbs || 0) * servings * 10) / 10;
    const fatVal = Math.round((data.nutrients.totalFat || 0) * servings * 10) / 10;
    setMealFormData((prev) => ({
      ...prev,
      name: data.productName || prev.name,
      calories: cal,
      proteinGrams: pro,
      carbsGrams: carb,
      fatGrams: fatVal,
      manualMacros: true,
    }));
    setNutritionLabelData(null);
    toast.success(`Added nutrition for ${servings} serving${servings !== 1 ? "s" : ""}`);
  }, []);

  // Recipe camera
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
      setRecipeImageCaptureMode("upload");
    }
  }, [isRecipeCameraActive]);

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
        const file = new File([blob], `recipe-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setRecipeImageFile(file);
        setRecipeCapturedImage(url);
        stopRecipeCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [stopRecipeCamera]);

  const handleRecipeFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  // ============================================
  // RECIPE IMAGE ANALYSIS
  // ============================================

  const parseRecipeAnalysis = useCallback((analysis: string) => {
    try {
      // Strip markdown code fences before any parsing
      const cleaned = analysis
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      console.log("[RecipeAnalysis] Parsing analysis text:", cleaned.substring(0, 1000));

      const recipeData: Partial<RecipeFormDataInternal> = {};

      // Detect if the content is primarily JSON (starts with { after cleanup)
      const isJsonContent = cleaned.trimStart().startsWith('{');

      // First, try to extract JSON if the response contains JSON
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Sanitize common AI JSON issues before parsing
          const sanitizedJson = jsonMatch[0]
            .replace(/,\s*([}\]])/g, '$1')  // trailing commas
            .replace(/'/g, '"')              // single quotes to double
            .replace(/(\w+)\s*:/g, (_, key: string) => `"${key}":`) // unquoted keys (rough)
            .replace(/""/g, '"');            // double-doubled quotes

          let jsonData: Record<string, unknown>;
          try {
            jsonData = JSON.parse(sanitizedJson);
          } catch {
            // If sanitized parse fails, try original
            jsonData = JSON.parse(jsonMatch[0]);
          }
          console.log("[RecipeAnalysis] Found JSON data:", JSON.stringify(jsonData).substring(0, 500));

          // Helper to find value by multiple possible keys (case-insensitive)
          const findVal = (...keys: string[]): unknown => {
            for (const key of keys) {
              const found = Object.entries(jsonData).find(([k]) => k.toLowerCase().replace(/[_\s]/g, '') === key.toLowerCase().replace(/[_\s]/g, ''));
              if (found && found[1] !== null && found[1] !== undefined && found[1] !== '') return found[1];
            }
            return undefined;
          };

          // Name
          const name = findVal('name', 'recipeName', 'recipe_name', 'title', 'dish', 'dishName', 'dish_name', 'recipe');
          if (name && typeof name === 'string') recipeData.name = name.trim();

          // Description
          const desc = findVal('description', 'about', 'summary', 'intro');
          if (desc && typeof desc === 'string') recipeData.description = desc.trim();

          // Category
          const cat = findVal('category', 'mealType', 'meal_type', 'type', 'course');
          if (cat && typeof cat === 'string') {
            const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other'];
            const lower = cat.toLowerCase();
            if (validCategories.includes(lower)) recipeData.category = lower;
          }

          // Cuisine
          const cuisine = findVal('cuisine', 'cuisineType', 'cuisine_type', 'origin');
          if (cuisine && typeof cuisine === 'string') recipeData.cuisine = cuisine.trim();

          // Ingredients
          const ings = findVal('ingredients', 'ingredientList', 'ingredient_list');
          if (Array.isArray(ings) && ings.length > 0) {
            recipeData.ingredients = ings.map((ing: unknown) => {
              if (typeof ing === 'string') {
                const m = ing.match(/^([\d./\s½¼¾⅓⅔]+)\s+(\w+)\s+(.+)$/) || ing.match(/^([\d./]+)\s+(.+)$/);
                return { quantity: m ? m[1].trim() : "", unit: m?.[3] ? m[2] : "", name: m ? (m[3] || m[2] || ing) : ing, notes: "" };
              }
              if (typeof ing === 'object' && ing !== null) {
                const obj = ing as Record<string, unknown>;
                return {
                  quantity: String(obj.quantity || obj.amount || obj.qty || ""),
                  unit: String(obj.unit || obj.measure || ""),
                  name: String(obj.name || obj.ingredient || obj.item || ""),
                  notes: String(obj.notes || obj.note || ""),
                };
              }
              return { quantity: "", unit: "", name: String(ing), notes: "" };
            }).filter((i: { name: string }) => i.name.length > 0);
          }

          // Instructions
          const insts = findVal('instructions', 'steps', 'directions', 'method', 'procedure');
          if (Array.isArray(insts) && insts.length > 0) {
            recipeData.instructions = insts.map((inst: unknown, idx: number) => {
              if (typeof inst === 'string') return { step: idx + 1, description: inst.replace(/^\d+[\.\)]\s*/, '').trim() };
              if (typeof inst === 'object' && inst !== null) {
                const obj = inst as Record<string, unknown>;
                return {
                  step: Number(obj.step || obj.number || idx + 1),
                  description: String(obj.description || obj.text || obj.instruction || obj.step_description || ""),
                };
              }
              return { step: idx + 1, description: String(inst) };
            }).filter((i: { description: string }) => i.description.length > 0);
          }

          // Nutrition
          const nutrition = findVal('nutrition', 'nutritionPerServing', 'nutrition_per_serving', 'nutritionalInfo', 'macros');
          if (nutrition && typeof nutrition === 'object' && !Array.isArray(nutrition)) {
            const n = nutrition as Record<string, unknown>;
            const cal = n.calories ?? n.caloriesPerServing ?? n.kcal;
            const protein = n.protein ?? n.proteinGrams ?? n.proteinG;
            const carbs = n.carbs ?? n.carbohydrates ?? n.carbsGrams ?? n.carbG;
            const fat = n.fat ?? n.fatGrams ?? n.fatG ?? n.totalFat;
            const fiber = n.fiber ?? n.fiberGrams ?? n.fiberG;
            if (cal !== undefined) recipeData.caloriesPerServing = parseInt(String(cal));
            if (protein !== undefined) recipeData.proteinGrams = parseFloat(String(protein));
            if (carbs !== undefined) recipeData.carbsGrams = parseFloat(String(carbs));
            if (fat !== undefined) recipeData.fatGrams = parseFloat(String(fat));
            if (fiber !== undefined) recipeData.fiberGrams = parseFloat(String(fiber));
          }
          // Also check flat nutrition fields
          const flatCal = findVal('calories', 'caloriesPerServing', 'kcal');
          if (flatCal !== undefined && !recipeData.caloriesPerServing) recipeData.caloriesPerServing = parseInt(String(flatCal));
          const flatProt = findVal('protein', 'proteinGrams');
          if (flatProt !== undefined && !recipeData.proteinGrams) recipeData.proteinGrams = parseFloat(String(flatProt));
          const flatCarbs = findVal('carbs', 'carbohydrates', 'carbsGrams');
          if (flatCarbs !== undefined && !recipeData.carbsGrams) recipeData.carbsGrams = parseFloat(String(flatCarbs));
          const flatFat = findVal('fat', 'fatGrams', 'totalFat');
          if (flatFat !== undefined && !recipeData.fatGrams) recipeData.fatGrams = parseFloat(String(flatFat));
          const flatFiber = findVal('fiber', 'fiberGrams');
          if (flatFiber !== undefined && !recipeData.fiberGrams) recipeData.fiberGrams = parseFloat(String(flatFiber));

          // Time
          const time = findVal('time', 'cookingTime', 'timing');
          if (time && typeof time === 'object' && !Array.isArray(time)) {
            const t = time as Record<string, unknown>;
            const prep = t.prep ?? t.prepTime ?? t.preparation;
            const cook = t.cook ?? t.cookTime ?? t.cooking;
            if (prep !== undefined) recipeData.prepTimeMinutes = parseInt(String(prep));
            if (cook !== undefined) recipeData.cookTimeMinutes = parseInt(String(cook));
          }
          const flatPrep = findVal('prepTime', 'prepTimeMinutes', 'prep_time', 'preparationTime');
          if (flatPrep !== undefined && !recipeData.prepTimeMinutes) recipeData.prepTimeMinutes = parseInt(String(flatPrep));
          const flatCook = findVal('cookTime', 'cookTimeMinutes', 'cook_time', 'cookingTime');
          if (flatCook !== undefined && !recipeData.cookTimeMinutes) recipeData.cookTimeMinutes = parseInt(String(flatCook));

          // Servings
          const servings = findVal('servings', 'serves', 'yield', 'portions');
          if (servings !== undefined) recipeData.servings = parseInt(String(servings));

          // Difficulty
          const diff = findVal('difficulty', 'level', 'difficultyLevel');
          if (diff && typeof diff === 'string') {
            const d = diff.toLowerCase();
            recipeData.difficulty = d === 'beginner' ? 'easy' : d === 'intermediate' ? 'medium' : d === 'advanced' ? 'hard' : d;
          }

          // Tags
          const tags = findVal('tags', 'labels', 'keywords');
          if (Array.isArray(tags)) recipeData.tags = tags.map((t: unknown) => String(t).trim()).filter(Boolean);

          // Dietary flags
          const flags = findVal('dietaryFlags', 'dietary_flags', 'dietaryInfo', 'dietary', 'dietaryRestrictions');
          if (Array.isArray(flags)) recipeData.dietaryFlags = flags.map((f: unknown) => String(f).toLowerCase().trim()).filter(Boolean);

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
        } catch (_jsonError) {
          // Attempt to repair truncated JSON before falling back
          console.warn("[RecipeAnalysis] JSON parse failed, attempting repair...");
          try {
            let repaired = jsonMatch[0];
            repaired = repaired.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
            repaired = repaired.replace(/,\s*"[^"]*":\s*$/, '');
            repaired = repaired.replace(/,\s*$/, '');
            if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
            const ob = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < ob; i++) repaired += ']';
            const oc = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
            for (let i = 0; i < oc; i++) repaired += '}';
            const repairedData = JSON.parse(repaired);
            console.log("[RecipeAnalysis] Repaired truncated JSON successfully");
            const rName = repairedData.name || repairedData.recipeName || repairedData.title;
            if (rName) recipeData.name = String(rName);
            if (repairedData.description) recipeData.description = String(repairedData.description);
            if (repairedData.category) recipeData.category = String(repairedData.category).toLowerCase();
            if (repairedData.cuisine) recipeData.cuisine = String(repairedData.cuisine);
            if (Array.isArray(repairedData.ingredients)) {
              recipeData.ingredients = repairedData.ingredients.filter((i: unknown) => i && typeof i === 'object').map((i: Record<string, unknown>) => ({
                quantity: String(i.quantity || ""), unit: String(i.unit || ""), name: String(i.name || ""), notes: "",
              })).filter((i: { name: string }) => i.name.length > 0);
            }
            if (Array.isArray(repairedData.instructions)) {
              recipeData.instructions = repairedData.instructions.filter((i: unknown) => i).map((i: unknown, idx: number) => ({
                step: idx + 1, description: typeof i === 'string' ? i : String((i as Record<string, unknown>).description || ""),
              })).filter((i: { description: string }) => i.description.length > 0);
            }
            if (repairedData.nutrition) {
              const n = repairedData.nutrition;
              if (n.calories) recipeData.caloriesPerServing = parseInt(String(n.calories));
              if (n.protein) recipeData.proteinGrams = parseFloat(String(n.protein));
              if (n.carbs) recipeData.carbsGrams = parseFloat(String(n.carbs));
              if (n.fat) recipeData.fatGrams = parseFloat(String(n.fat));
              if (n.fiber) recipeData.fiberGrams = parseFloat(String(n.fiber));
            }
            if (repairedData.time) {
              if (repairedData.time.prep) recipeData.prepTimeMinutes = parseInt(String(repairedData.time.prep));
              if (repairedData.time.cook) recipeData.cookTimeMinutes = parseInt(String(repairedData.time.cook));
            }
            if (repairedData.servings) recipeData.servings = parseInt(String(repairedData.servings));
            if (repairedData.difficulty) recipeData.difficulty = String(repairedData.difficulty).toLowerCase();
            if (recipeData.name) return recipeData;
          } catch (repairError) {
            console.warn("[RecipeAnalysis] Repair also failed, falling back to markdown:", repairError);
          }

          if (isJsonContent) {
            console.warn("[RecipeAnalysis] Content was JSON but could not be parsed. Returning partial data.");
            return Object.keys(recipeData).length > 0 ? recipeData : null;
          }
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
        /^(.+?)\n/i,
      ];
      for (const pattern of namePatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]?.trim()) {
          const name = match[1].trim().replace(/\*\*/g, '').replace(/^#+\s*/, '');
          if (name.length > 0 && name.length < 200) {
            recipeData.name = name;
            console.log("[RecipeAnalysis] Found name:", name);
            break;
          }
        }
      }

      if (!recipeData.name) {
        const lines = cleaned.split('\n').filter(line => line.trim());
        for (const line of lines.slice(0, 5)) {
          const cleanLine = line.trim().replace(/\*\*/g, '').replace(/^#+\s*/, '').replace(/```\w*/g, '').trim();
          if (cleanLine.length > 3 && cleanLine.length < 100 &&
              !cleanLine.startsWith('{') &&
              !cleanLine.startsWith('[') &&
              !cleanLine.startsWith('```') &&
              !cleanLine.toLowerCase().includes('json') &&
              !cleanLine.toLowerCase().includes('recipe name') &&
              !cleanLine.toLowerCase().includes('ingredient') &&
              !cleanLine.toLowerCase().includes('instruction')) {
            recipeData.name = cleanLine;
            console.log("[RecipeAnalysis] Found name from first line:", cleanLine);
            break;
          }
        }
      }

      // Extract Description
      const descPatterns = [
        /\*\*Description:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Description:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|Ingredients|Instructions|$)/i,
        /About.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|Ingredients|Instructions|$)/i,
      ];
      for (const pattern of descPatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]?.trim()) {
          recipeData.description = match[1].trim().substring(0, 500);
          break;
        }
      }

      // Extract Ingredients
      const ingredientsPatterns = [
        /\*\*Ingredients:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Instructions|\*\*Steps|\*\*Nutrition|\*\*Time|\*\*Description|$)/i,
        /Ingredients[:\s]+\*\*(.+?)\*\*/i,
        /Ingredients:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Instructions|\*\*Steps|\*\*Nutrition|\*\*Time|Instructions:|Steps:|$)/i,
        /Ingredients?.*?:\s*\n((?:.+\n?)+?)(?=\n\n|Instructions|Steps|Nutrition|$)/i,
      ];
      for (const pattern of ingredientsPatterns) {
        const match = cleaned.match(pattern);
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
              const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim().replace(/\*\*/g, '');
              let match = cleanLine.match(/^([\d./\s]+)\s+(\w+)\s+(.+)$/);
              if (!match) match = cleanLine.match(/^([\d./]+)\s+(.+)$/);
              if (!match) match = cleanLine.match(/^([\d./-]+)\s+(.+)$/);
              if (match && match.length >= 2) {
                return {
                  quantity: match[1]?.trim() || "",
                  unit: match[2] && match[2] !== match[match.length - 1] ? match[2].trim() : "",
                  name: (match[match.length - 1] || match[2] || cleanLine).trim(),
                  notes: "",
                };
              }
              return { quantity: "", unit: "", name: cleanLine, notes: "" };
            }).filter(ing => ing.name.length > 0);

            if (recipeData.ingredients.length > 0) {
              console.log("[RecipeAnalysis] Found ingredients:", recipeData.ingredients.length);
              break;
            }
          }
        }
      }

      // Extract Instructions
      const instructionsPatterns = [
        /\*\*Instructions:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|\*\*Servings|$)/i,
        /\*\*Steps:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|\*\*Servings|$)/i,
        /Instructions?[:\s]+\*\*(.+?)\*\*/i,
        /Instructions?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|Nutrition:|Time:|$)/i,
        /Steps?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*Nutrition|\*\*Time|\*\*Tags|Nutrition:|Time:|$)/i,
      ];
      for (const pattern of instructionsPatterns) {
        const match = cleaned.match(pattern);
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
              return { step: idx + 1, description: cleanLine };
            }).filter(inst => inst.description.length > 0);

            if (recipeData.instructions.length > 0) {
              console.log("[RecipeAnalysis] Found instructions:", recipeData.instructions.length);
              break;
            }
          }
        }
      }

      // Extract Nutrition
      const nutritionPatterns = [
        /\*\*Nutrition.*?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Nutrition.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Calories.*?Protein.*?Carbs.*?Fat/i,
      ];
      for (const pattern of nutritionPatterns) {
        const match = cleaned.match(pattern);
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

      // Extract Time
      const timePatterns = [
        /\*\*Time.*?:\*\*\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Time.*?:\s*\n((?:.+\n?)+?)(?=\n\n|\*\*|$)/i,
        /Prep.*?Cook/i,
      ];
      for (const pattern of timePatterns) {
        const match = cleaned.match(pattern);
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
      if (servingsMatch) recipeData.servings = parseInt(servingsMatch[1]);

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
        const match = cleaned.match(pattern);
        if (match && match[1]?.trim()) {
          const tagsText = match[1];
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
        const match = cleaned.match(pattern);
        if (match && match[1]?.trim()) {
          const flagsText = match[1];
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
        breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner', snack: 'snack', dessert: 'dessert',
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
      if (cuisineMatch) recipeData.cuisine = cuisineMatch[1];

      console.log("[RecipeAnalysis] Parsed recipe data:", recipeData);
      return Object.keys(recipeData).length > 0 ? recipeData : null;
    } catch (error) {
      console.error("[RecipeAnalysis] Failed to parse recipe analysis:", error);
      return null;
    }
  }, []);

  const analyzeRecipeImage = useCallback(async () => {
    if (!recipeImageFile) return;

    setIsAnalyzingRecipeImage(true);
    setRecipeImageAnalysisError(null);
    setRecipeImageAnalysisResult(null);

    try {
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
        undefined,
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

      if (result.imageUrl) {
        setRecipeFormData((prev) => ({ ...prev, imageUrl: result.imageUrl }));
      }

      const parsedRecipe = parseRecipeAnalysis(analysisText);
      console.log("[RecipeAnalysis] Parsed recipe:", parsedRecipe);

      if (parsedRecipe && Object.keys(parsedRecipe).length > 0) {
        setRecipeFormData((prev) => {
          const updated = {
            ...prev,
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

  const formTotals = useMemo(
    () =>
      mealFormData.items
        .filter((item) => item.eaten !== false)
        .reduce(
          (acc, item) => {
            const qty = item.quantity || 1;
            return {
              calories: acc.calories + item.calories * qty,
              protein: acc.protein + item.protein * qty,
              carbs: acc.carbs + item.carbs * qty,
              fat: acc.fat + item.fat * qty,
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        ),
    [mealFormData.items]
  );

  const isMealFormValid = useMemo(() => {
    const hasName = mealFormData.name.trim().length > 0;
    if (editingMeal) return hasName;
    const hasEatenFoods = mealFormData.items.filter((item) => item.eaten !== false).length > 0;
    const hasManualMacros =
      mealFormData.manualMacros &&
      mealFormData.calories !== undefined &&
      mealFormData.proteinGrams !== undefined &&
      mealFormData.carbsGrams !== undefined &&
      mealFormData.fatGrams !== undefined;
    return hasName && (hasEatenFoods || hasManualMacros);
  }, [mealFormData.name, mealFormData.items, mealFormData.manualMacros, mealFormData.calories, mealFormData.proteinGrams, mealFormData.carbsGrams, mealFormData.fatGrams, editingMeal]);

  const filteredFoods = useMemo(
    () =>
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
  const totalCalories = useMemo(() => pendingItems.reduce((total, item) => total + (item.calories || 0), 0), [pendingItems]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // View
    activeView,
    setActiveView,

    // Diet Plans
    dietPlans,
    plansLoading,
    plansSaving,
    selectedPlanIds,
    editingPlan,
    planFormData,
    setPlanFormData,
    aiPlanGenerating,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan,
    deleteSelectedPlans,
    activateDietPlan,
    generateAIDietPlan,
    togglePlanSelection,
    openEditPlan,
    resetPlanForm,
    showCreatePlanModal,
    setShowCreatePlanModal,
    setEditingPlan,

    // Meals
    meals,
    mealsLoading,
    mealsSaving,
    editingMeal,
    expandedMeal,
    setExpandedMeal,
    mealFormData,
    setMealFormData,
    mealInputMode,
    setMealInputMode,
    editingItemId,
    setEditingItemId,
    showCustomFood,
    setShowCustomFood,
    customFoodDraft,
    setCustomFoodDraft,
    formTotals,
    isMealFormValid,
    filteredFoods,
    foodSearch,
    setFoodSearch,
    selectedCategory,
    setSelectedCategory,
    createMeal,
    updateMeal,
    deleteMeal,
    openEditMeal,
    addFoodItem,
    addCustomFood,
    removeFoodItem,
    resetMealForm,
    showCreateMealModal,
    setShowCreateMealModal,
    setEditingMeal,
    generateMealWithAI,
    aiMealDescription,
    setAiMealDescription,
    aiMealGenerating,
    aiMealError,
    setAiMealError,

    // Water
    waterLog,
    waterLoading,
    waterUpdating,
    addWaterGlass,
    removeWaterGlass,

    // Shopping
    shoppingItems,
    shoppingLoading,
    showShoppingModal,
    setShowShoppingModal,
    showAIGenerateModal,
    setShowAIGenerateModal,
    showViewAllShoppingModal,
    setShowViewAllShoppingModal,
    editingShoppingItem,
    setEditingShoppingItem,
    shoppingFormData,
    setShoppingFormData,
    shoppingAiPrompt,
    setShoppingAiPrompt,
    shoppingAiGenerating,
    aiResponse,
    setAiResponse,
    pendingItems,
    purchasedItems,
    totalCalories,
    createShoppingItem,
    updateShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearPurchasedItems,
    generateShoppingWithAI,
    openEditShoppingItem,
    resetShoppingForm,

    // Recipes
    recipes,
    recipesLoading,
    recipesSaving,
    selectedRecipeIds,
    setSelectedRecipeIds,
    showCreateRecipeModal,
    setShowCreateRecipeModal,
    editingRecipe,
    setEditingRecipe,
    viewingRecipe,
    setViewingRecipe,
    recipeFilterCategory,
    setRecipeFilterCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    recipeFormData,
    setRecipeFormData,
    isUploadingRecipeImage,
    recipeImageInputRef,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    deleteSelectedRecipes,
    toggleRecipeFavorite,
    openEditRecipe,
    handleRecipeImageSelect,
    resetRecipeForm,

    // Delete
    showDeleteConfirm,
    setShowDeleteConfirm,

    // Computed
    activePlan,
    macros,

    // Image capture (meal)
    imageCaptureMode,
    setImageCaptureMode,
    capturedImage,
    setCapturedImage,
    imageFile,
    setImageFile,
    isAnalyzingImage,
    imageAnalysisResult,
    setImageAnalysisResult,
    imageAnalysisError,
    setImageAnalysisError,
    mealImageDescription,
    setMealImageDescription,
    isCameraActive,
    videoRef,
    canvasRef,
    fileInputRef,
    imageScanMode,
    setImageScanMode,
    nutritionLabelData,
    setNutritionLabelData,
    startCamera,
    stopCamera,
    capturePhoto,
    handleFileChange,
    analyzeFoodImage,
    analyzeNutritionLabel,
    populateMealFromLabel,
    populateMealFromAnalysis,

    // Image capture (recipe)
    recipeImageCaptureMode,
    setRecipeImageCaptureMode,
    recipeCapturedImage,
    setRecipeCapturedImage,
    recipeImageFile,
    setRecipeImageFile,
    isAnalyzingRecipeImage,
    setIsAnalyzingRecipeImage,
    recipeImageAnalysisResult,
    setRecipeImageAnalysisResult,
    recipeImageAnalysisError,
    setRecipeImageAnalysisError,
    isRecipeCameraActive,
    recipeVideoRef,
    recipeCanvasRef,
    recipeFileInputRef,
    startRecipeCamera,
    stopRecipeCamera,
    captureRecipePhoto,
    handleRecipeFileChange,
    analyzeRecipeImage,

    // Meal icons list (for the UI)
    mealIconsList,
  };
}
