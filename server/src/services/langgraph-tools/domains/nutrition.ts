import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import { logger } from '../../logger.service.js';
import { embeddingQueueService } from '../../embedding-queue.service.js';
import { JobPriorities } from '../../../config/queue.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetUserDietPlansSchema = z.object({
  status: z.string().optional().describe('Filter by status: active, completed, paused, archived'),
});

const GetUserMealLogsSchema = z.object({
  date: z.string().optional().describe('Specific date in ISO format (YYYY-MM-DD)'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
});

const GetUserRecipesSchema = z.object({
  category: z.string().optional().describe('Filter by category: breakfast, lunch, dinner, snack, dessert, other'),
  favorite: z.boolean().optional().describe('Filter by favorite status'),
  name: z.string().optional().describe('Filter by recipe name (partial match)'),
});

// Recipes
const CreateRecipeSchema = z.object({
  name: z.string().describe('Recipe name (required)'),
  description: z.string().optional(),
  category: z.string().optional().describe('Category: breakfast, lunch, dinner, snack, dessert, other'),
  cuisine: z.string().optional(),
  servings: z.number().optional(),
  caloriesPerServing: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  ingredients: z.array(z.any()).optional().describe('Ingredients array'),
  instructions: z.array(z.any()).optional().describe('Instructions array'),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  totalTimeMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
  dietaryFlags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  difficulty: z.string().optional().describe('Difficulty: easy, medium, hard'),
});

const UpdateRecipeSchema = z.object({
  recipeId: z.string().describe('Recipe ID (required)'),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  cuisine: z.string().optional(),
  servings: z.number().optional(),
  caloriesPerServing: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  ingredients: z.array(z.any()).optional(),
  instructions: z.array(z.any()).optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  totalTimeMinutes: z.number().optional(),
  tags: z.array(z.string()).optional(),
  dietaryFlags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  difficulty: z.string().optional(),
  rating: z.number().optional(),
  isFavorite: z.boolean().optional(),
});

const DeleteRecipeSchema = z.object({
  recipeId: z.string().describe('Recipe ID to delete (required)'),
});

// Meal Logs
const CreateMealLogSchema = z.object({
  mealType: z.string().describe('Meal type: breakfast, lunch, dinner, snack (required)'),
  mealName: z.string().optional(),
  description: z.string().optional(),
  calories: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  foods: z.array(z.any()).optional(),
  dietPlanId: z.string().optional(),
  eatenAt: z.string().optional().describe('Date/time in ISO format'),
  hungerBefore: z.number().optional(),
  satisfactionAfter: z.number().optional(),
  notes: z.string().optional(),
});

const UpdateMealLogSchema = z.object({
  mealId: z.string().describe('Meal log ID (required)'),
  mealType: z.string().optional(),
  mealName: z.string().optional(),
  description: z.string().optional(),
  calories: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  foods: z.array(z.any()).optional(),
  eatenAt: z.string().optional(),
  hungerBefore: z.number().optional(),
  satisfactionAfter: z.number().optional(),
  notes: z.string().optional(),
});

const DeleteMealLogSchema = z.object({
  mealId: z.string().describe('Meal log ID to delete (required)'),
});

// Diet Plans
const CreateDietPlanSchema = z.object({
  name: z.string().describe('Diet plan name (required)'),
  description: z.string().optional(),
  goalCategory: z.string().optional().describe('Goal category: weight_loss, muscle_building, etc.'),
  dailyCalories: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  excludedFoods: z.array(z.string()).optional(),
  mealsPerDay: z.number().optional(),
  snacksPerDay: z.number().optional(),
  mealTimes: z.record(z.string()).optional().describe('Meal times object'),
  weeklyMeals: z.record(z.any()).optional().describe('Weekly meals structure'),
  isActive: z.boolean().optional(),
});

const UpdateDietPlanSchema = z.object({
  planId: z.string().describe('Diet plan ID (required)'),
  name: z.string().optional(),
  description: z.string().optional(),
  goalCategory: z.string().optional(),
  dailyCalories: z.number().optional(),
  proteinGrams: z.number().optional(),
  carbsGrams: z.number().optional(),
  fatGrams: z.number().optional(),
  fiberGrams: z.number().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  excludedFoods: z.array(z.string()).optional(),
  mealsPerDay: z.number().optional(),
  snacksPerDay: z.number().optional(),
  mealTimes: z.record(z.string()).optional(),
  weeklyMeals: z.record(z.any()).optional(),
  status: z.string().optional(),
});

const DeleteDietPlanSchema = z.object({
  planId: z.string().describe('Diet plan ID to delete (required)'),
});

// Operations by Name Schemas
const GetMealByNameSchema = z.object({
  name: z.string().describe('Meal name to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const GetDietPlanByNameSchema = z.object({
  name: z.string().describe('Diet plan name to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const GetRecipeByNameSchema = z.object({
  name: z.string().describe('Recipe name to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const UpdateMealByNameSchema = UpdateMealLogSchema.omit({ mealId: true }).extend({
  name: z.string().describe('Meal name to find and update'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const UpdateDietPlanByNameSchema = UpdateDietPlanSchema.omit({ planId: true }).extend({
  name: z.string().describe('Diet plan name to find and update'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const UpdateRecipeByNameSchema = UpdateRecipeSchema.omit({ recipeId: true }).extend({
  name: z.string().describe('Recipe name to find and update'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const DeleteMealByNameSchema = z.object({
  name: z.string().describe('Meal name to delete'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const DeleteDietPlanByNameSchema = z.object({
  name: z.string().describe('Diet plan name to delete'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const DeleteRecipeByNameSchema = z.object({
  name: z.string().describe('Recipe name to delete'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

// Bulk Operation Schemas
const DeleteAllMealsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  dateRange: z.object({
    startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  }).optional(),
  mealType: z.string().optional().describe('Filter by meal type (breakfast, lunch, dinner, snack)'),
});

const UpdateAllMealsSchema = z.object({
  updates: z.object({
    mealType: z.string().optional(),
    mealName: z.string().optional(),
    description: z.string().optional(),
    calories: z.number().optional(),
    proteinGrams: z.number().optional(),
    carbsGrams: z.number().optional(),
    fatGrams: z.number().optional(),
    fiberGrams: z.number().optional(),
    notes: z.string().optional(),
  }),
  filter: z.object({
    dateRange: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional(),
    mealType: z.string().optional(),
  }).optional(),
});

const DeleteAllDietPlansSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  status: z.string().optional().describe('Filter by status (active, draft, completed, archived)'),
});

const UpdateAllDietPlansSchema = z.object({
  updates: z.object({
    status: z.string().optional(),
    description: z.string().optional(),
    dailyCalories: z.number().optional(),
    mealsPerDay: z.number().optional(),
    snacksPerDay: z.number().optional(),
  }),
  filter: z.object({
    status: z.string().optional(),
    goalCategory: z.string().optional(),
  }).optional(),
});

const DeleteAllRecipesSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  category: z.string().optional().describe('Filter by category'),
  favorite: z.boolean().optional().describe('Filter by favorite status'),
});

const UpdateAllRecipesSchema = z.object({
  updates: z.object({
    category: z.string().optional(),
    difficulty: z.string().optional(),
    isFavorite: z.boolean().optional(),
    rating: z.number().optional(),
  }),
  filter: z.object({
    category: z.string().optional(),
    favorite: z.boolean().optional(),
  }).optional(),
});

// --- Helper Functions ---

/**
 * Helper function to find meal by name
 */
async function findMealByName(userId: string, name: string, exactMatch: boolean = false): Promise<{ id: string; name: string }[]> {
  const searchPattern = exactMatch ? name : `%${name}%`;
  const result = await query(
    `SELECT id, meal_name as name FROM meal_logs
     WHERE user_id = $1 AND meal_name ILIKE $2
     ORDER BY eaten_at DESC`,
    [userId, searchPattern]
  );
  return result.rows.map((row: any) => ({ id: row.id, name: row.name }));
}

/**
 * Helper function to find diet plan by name
 */
async function findDietPlanByName(userId: string, name: string, exactMatch: boolean = false): Promise<{ id: string; name: string }[]> {
  const searchPattern = exactMatch ? name : `%${name}%`;
  const result = await query(
    `SELECT id, name FROM diet_plans
     WHERE user_id = $1 AND name ILIKE $2
     ORDER BY created_at DESC`,
    [userId, searchPattern]
  );
  return result.rows.map((row: any) => ({ id: row.id, name: row.name }));
}

/**
 * Helper function to find recipe by name
 */
async function findRecipeByName(userId: string, name: string, exactMatch: boolean = false): Promise<{ id: string; name: string }[]> {
  const searchPattern = exactMatch ? name : `%${name}%`;
  const result = await query(
    `SELECT id, name FROM user_recipes
     WHERE user_id = $1 AND name ILIKE $2
     ORDER BY created_at DESC`,
    [userId, searchPattern]
  );
  return result.rows.map((row: any) => ({ id: row.id, name: row.name }));
}

// --- Implementations ---

function buildNutritionCharts(
  meals: { mealType: string; mealName: string; eatenAt: string; calories: number; macros: { protein: number; carbs: number; fat: number; fiber: number } }[],
  totals: { calories: number; protein: number; carbs: number; fat: number },
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (meals.length === 0) return artifacts;

  const dailyMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const meal of meals) {
    const date = typeof meal.eatenAt === 'string' ? meal.eatenAt.slice(0, 10) : 'unknown';
    const existing = dailyMap.get(date) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    existing.calories += meal.calories || 0;
    existing.protein += meal.macros?.protein || 0;
    existing.carbs += meal.macros?.carbs || 0;
    existing.fat += meal.macros?.fat || 0;
    dailyMap.set(date, existing);
  }
  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  if (dailyData.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Daily Calorie Intake',
      data: dailyData.map((d) => ({ date: d.date, calories: Math.round(d.calories) })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'calories', label: 'Calories', color: '#f59e0b' }],
      yAxisLabel: 'Calories',
      insight: `Average: ${Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / dailyData.length)} cal/day.`,
    });
  }

  if (totals.protein > 0 || totals.carbs > 0 || totals.fat > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'pie',
      title: 'Macronutrient Split',
      data: [
        { name: 'Protein', value: Math.round(totals.protein) },
        { name: 'Carbs', value: Math.round(totals.carbs) },
        { name: 'Fat', value: Math.round(totals.fat) },
      ],
      xAxisKey: 'name',
      dataKeys: [
        { key: 'value', label: 'Protein', color: '#3b82f6' },
        { key: 'value', label: 'Carbs', color: '#f59e0b' },
        { key: 'value', label: 'Fat', color: '#ef4444' },
      ],
      insight: `${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat.`,
    });
  }

  if (dailyData.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Macro Trends',
      data: dailyData.map((d) => ({
        date: d.date,
        protein: Math.round(d.protein),
        carbs: Math.round(d.carbs),
        fat: Math.round(d.fat),
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'protein', label: 'Protein (g)', color: '#3b82f6' },
        { key: 'carbs', label: 'Carbs (g)', color: '#f59e0b' },
        { key: 'fat', label: 'Fat (g)', color: '#ef4444' },
      ],
      yAxisLabel: 'Grams',
    });
  }

  return artifacts;
}

/**
 * Get user's diet plans
 */
async function getUserDietPlans(userId: string, params?: { status?: string }): Promise<string> {
  let sqlQuery = `SELECT * FROM diet_plans WHERE user_id = $1`;
  const queryParams: (string | number)[] = [userId];

  if (params?.status) {
    sqlQuery += ` AND status = $2`;
    queryParams.push(params.status);
  }

  sqlQuery += ` ORDER BY created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No diet plans found', plans: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    goalCategory: row.goal_category,
    status: row.status,
    dailyCalories: row.daily_calories,
    macros: {
      protein: row.protein_grams,
      carbs: row.carbs_grams,
      fat: row.fat_grams,
      fiber: row.fiber_grams,
    },
    mealsPerDay: row.meals_per_day,
    snacksPerDay: row.snacks_per_day,
    adherenceRate: `${Math.round((row.adherence_rate || 0) * 100)}%`,
    createdAt: row.created_at,
  }));

  return JSON.stringify({ plans: formatted, count: formatted.length }, null, 2);
}

/**
 * Get user's meal logs
 */
async function getUserMealLogs(userId: string, params?: {
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<string> {
  let sqlQuery = `SELECT * FROM meal_logs WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];

  if (params?.date) {
    sqlQuery += ` AND DATE(eaten_at) = $2`;
    queryParams.push(params.date);
  } else if (params?.startDate && params?.endDate) {
    sqlQuery += ` AND DATE(eaten_at) >= $2 AND DATE(eaten_at) <= $3`;
    queryParams.push(params.startDate, params.endDate);
  } else if (!params?.date && !params?.startDate) {
    // Default to today
    sqlQuery += ` AND DATE(eaten_at) = CURRENT_DATE`;
  }

  sqlQuery += ` ORDER BY eaten_at ASC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No meal logs found', meals: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    mealType: row.meal_type,
    mealName: row.meal_name,
    eatenAt: row.eaten_at,
    calories: row.calories,
    macros: {
      protein: row.protein_grams,
      carbs: row.carbs_grams,
      fat: row.fat_grams,
      fiber: row.fiber_grams,
    },
    foods: row.foods || [],
  }));

  // Calculate totals
  const totals = formatted.reduce((acc: any, meal: any) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.macros?.protein || 0),
    carbs: acc.carbs + (meal.macros?.carbs || 0),
    fat: acc.fat + (meal.macros?.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const artifacts = buildNutritionCharts(formatted, totals);
  return JSON.stringify({ meals: formatted, totals, count: formatted.length, artifacts }, null, 2);
}

/**
 * Get user's recipes
 */
async function getUserRecipes(userId: string, params?: {
  category?: string;
  favorite?: boolean;
  name?: string;
}): Promise<string> {
  let sqlQuery = `SELECT * FROM user_recipes WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params?.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    queryParams.push(params.category);
    paramIndex++;
  }

  if (params?.favorite !== undefined) {
    sqlQuery += ` AND is_favorite = $${paramIndex}`;
    queryParams.push(params.favorite);
    paramIndex++;
  }

  if (params?.name) {
    sqlQuery += ` AND name ILIKE $${paramIndex}`;
    queryParams.push(`%${params.name}%`);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No recipes found', recipes: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    cuisine: row.cuisine,
    servings: row.servings,
    caloriesPerServing: row.calories_per_serving,
    macros: {
      protein: row.protein_grams,
      carbs: row.carbs_grams,
      fat: row.fat_grams,
      fiber: row.fiber_grams,
    },
    ingredients: row.ingredients || [],
    instructions: row.instructions || [],
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    totalTimeMinutes: row.total_time_minutes,
    tags: row.tags || [],
    dietaryFlags: row.dietary_flags || [],
    difficulty: row.difficulty,
    rating: row.rating,
    isFavorite: row.is_favorite,
    timesMade: row.times_made,
    createdAt: row.created_at,
  }));

  return JSON.stringify({ recipes: formatted, count: formatted.length }, null, 2);
}

/**
 * Create recipe
 */
async function createRecipe(userId: string, params: z.infer<typeof CreateRecipeSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.name?.trim()) {
    return JSON.stringify({ success: false, error: 'Recipe name is required' });
  }

  const category = params.category || 'other';
  const servings = params.servings || 1;
  const difficulty = params.difficulty || 'medium';
  const ingredients = params.ingredients || [];
  const instructions = params.instructions || [];
  const tags = params.tags || [];
  const dietaryFlags = params.dietaryFlags || [];

  // Validate category
  const validCategories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'other'];
  if (!validCategories.includes(category)) {
    warnings.push(`Invalid category '${category}', using 'other'`);
  }

  const result = await query<{ id: string }>(
    `INSERT INTO user_recipes (
      user_id, name, description, category, cuisine,
      servings, calories_per_serving, protein_grams, carbs_grams, fat_grams, fiber_grams,
      ingredients, instructions, prep_time_minutes, cook_time_minutes, total_time_minutes,
      tags, dietary_flags, difficulty, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING id`,
    [
      userId,
      params.name.trim(),
      params.description || null,
      category,
      params.cuisine || null,
      servings,
      params.caloriesPerServing || null,
      params.proteinGrams || null,
      params.carbsGrams || null,
      params.fatGrams || null,
      params.fiberGrams || null,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      params.prepTimeMinutes || null,
      params.cookTimeMinutes || null,
      params.totalTimeMinutes || null,
      JSON.stringify(tags),
      JSON.stringify(dietaryFlags),
      difficulty,
      'ai_generated',
    ]
  );

  const recipeId = result.rows[0].id;

  return JSON.stringify({
    success: true,
    message: 'Recipe created successfully',
    data: { id: recipeId, name: params.name },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Update recipe
 */
async function updateRecipe(userId: string, params: z.infer<typeof UpdateRecipeSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_recipes WHERE id = $1 AND user_id = $2`,
    [params.recipeId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Recipe not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    category: 'category',
    cuisine: 'cuisine',
    servings: 'servings',
    caloriesPerServing: 'calories_per_serving',
    proteinGrams: 'protein_grams',
    carbsGrams: 'carbs_grams',
    fatGrams: 'fat_grams',
    fiberGrams: 'fiber_grams',
    ingredients: 'ingredients',
    instructions: 'instructions',
    prepTimeMinutes: 'prep_time_minutes',
    cookTimeMinutes: 'cook_time_minutes',
    totalTimeMinutes: 'total_time_minutes',
    tags: 'tags',
    dietaryFlags: 'dietary_flags',
    imageUrl: 'image_url',
    difficulty: 'difficulty',
    rating: 'rating',
    isFavorite: 'is_favorite',
  };

  const jsonFields = ['ingredients', 'instructions', 'tags', 'dietary_flags'];

  const setClauses: string[] = [];
  const values: (string | number | boolean | null | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'recipeId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      if (jsonFields.includes(dbField)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value as string | number | boolean | null | object);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE user_recipes SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.recipeId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Recipe updated successfully',
    data: { id: params.recipeId },
  });
}

/**
 * Delete recipe
 */
async function deleteRecipe(userId: string, params: z.infer<typeof DeleteRecipeSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_recipes WHERE id = $1 AND user_id = $2`,
    [params.recipeId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Recipe not found or access denied' });
  }

  await query(
    `DELETE FROM user_recipes WHERE id = $1 AND user_id = $2`,
    [params.recipeId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Recipe deleted successfully',
  });
}

/**
 * Create meal log
 */
async function createMealLog(userId: string, params: z.infer<typeof CreateMealLogSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.mealType) {
    return JSON.stringify({ success: false, error: 'Meal type is required' });
  }

  // Validate diet plan if provided
  if (params.dietPlanId) {
    const planCheck = await query(
      `SELECT id FROM diet_plans WHERE id = $1 AND user_id = $2`,
      [params.dietPlanId, userId]
    );
    if (planCheck.rows.length === 0) {
      warnings.push(`Diet plan ${params.dietPlanId} not found, creating meal log without plan reference`);
    }
  }

  const eatenAt = params.eatenAt || new Date().toISOString();

  const result = await query<{ id: string }>(
    `INSERT INTO meal_logs (
      user_id, diet_plan_id, meal_type, meal_name, description,
      calories, protein_grams, carbs_grams, fat_grams, fiber_grams,
      foods, eaten_at, hunger_before, satisfaction_after, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      userId,
      params.dietPlanId || null,
      params.mealType,
      params.mealName || null,
      params.description || null,
      params.calories || null,
      params.proteinGrams || null,
      params.carbsGrams || null,
      params.fatGrams || null,
      params.fiberGrams || null,
      JSON.stringify(params.foods || []),
      eatenAt,
      params.hungerBefore || null,
      params.satisfactionAfter || null,
      params.notes || null,
    ]
  );

  const mealId = result.rows[0].id;

  // Enqueue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'meal_log',
    sourceId: mealId,
    operation: 'create',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Meal log created successfully',
    data: { id: mealId, mealType: params.mealType },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Update meal log
 */
async function updateMealLog(userId: string, params: z.infer<typeof UpdateMealLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM meal_logs WHERE id = $1 AND user_id = $2`,
    [params.mealId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Meal log not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    mealType: 'meal_type',
    mealName: 'meal_name',
    description: 'description',
    calories: 'calories',
    proteinGrams: 'protein_grams',
    carbsGrams: 'carbs_grams',
    fatGrams: 'fat_grams',
    fiberGrams: 'fiber_grams',
    foods: 'foods',
    eatenAt: 'eaten_at',
    hungerBefore: 'hunger_before',
    satisfactionAfter: 'satisfaction_after',
    notes: 'notes',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | null | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'mealId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      if (dbField === 'foods') {
        values.push(JSON.stringify(value));
      } else {
        values.push(value as string | number | boolean | null | object);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE meal_logs SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.mealId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'meal_log',
    sourceId: params.mealId,
    operation: 'update',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Meal log updated successfully',
    data: { id: params.mealId },
  });
}

/**
 * Delete meal log
 */
async function deleteMealLog(userId: string, params: z.infer<typeof DeleteMealLogSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM meal_logs WHERE id = $1 AND user_id = $2`,
    [params.mealId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Meal log not found or access denied' });
  }

  // Enqueue embedding deletion BEFORE actual deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'meal_log',
    sourceId: params.mealId,
    operation: 'delete',
    priority: JobPriorities.MEDIUM,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
  });

  await query(
    `DELETE FROM meal_logs WHERE id = $1 AND user_id = $2`,
    [params.mealId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Meal log deleted successfully',
  });
}

/**
 * Create diet plan
 */
async function createDietPlan(userId: string, params: z.infer<typeof CreateDietPlanSchema>): Promise<string> {
  const warnings: string[] = [];

  if (!params.name?.trim()) {
    return JSON.stringify({ success: false, error: 'Diet plan name is required' });
  }

  // Valid goal categories from enum
  const validCategories = ['weight_loss', 'muscle_building', 'sleep_improvement', 'stress_wellness', 'energy_productivity', 'event_training', 'health_condition', 'habit_building', 'overall_optimization', 'nutrition', 'fitness', 'custom'];

  let goalCategory = params.goalCategory || 'overall_optimization';
  // Validate and correct invalid goal category
  if (!validCategories.includes(goalCategory)) {
    warnings.push(`Invalid goal category '${goalCategory}', using 'overall_optimization'`);
    goalCategory = 'overall_optimization';
  }

  const mealsPerDay = params.mealsPerDay || 3;
  const snacksPerDay = params.snacksPerDay || 2;
  const mealTimes = params.mealTimes || {};
  const weeklyMeals = params.weeklyMeals || {};
  const dietaryPreferences = params.dietaryPreferences || [];
  const allergies = params.allergies || [];
  const excludedFoods = params.excludedFoods || [];

  // If setting as active, deactivate other plans
  if (params.isActive) {
    await query(
      `UPDATE diet_plans SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
  }

  const result = await query<{ id: string }>(
    `INSERT INTO diet_plans (
      user_id, name, description, goal_category,
      daily_calories, protein_grams, carbs_grams, fat_grams, fiber_grams,
      dietary_preferences, allergies, excluded_foods,
      meals_per_day, snacks_per_day, meal_times, weekly_meals,
      status, ai_generated
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING id`,
    [
      userId,
      params.name.trim(),
      params.description || null,
      goalCategory,
      params.dailyCalories || null,
      params.proteinGrams || null,
      params.carbsGrams || null,
      params.fatGrams || null,
      params.fiberGrams || null,
      JSON.stringify(dietaryPreferences),
      JSON.stringify(allergies),
      JSON.stringify(excludedFoods),
      mealsPerDay,
      snacksPerDay,
      JSON.stringify(mealTimes),
      JSON.stringify(weeklyMeals),
      params.isActive ? 'active' : 'draft',
      true,
    ]
  );

  const planId = result.rows[0].id;

  // Enqueue embedding
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'diet_plan',
    sourceId: planId,
    operation: 'create',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Diet plan created successfully',
    data: { id: planId, name: params.name },
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}

/**
 * Update diet plan
 */
async function updateDietPlan(userId: string, params: z.infer<typeof UpdateDietPlanSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM diet_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Diet plan not found or access denied' });
  }

  // Valid goal categories from enum
  const validCategories = ['weight_loss', 'muscle_building', 'sleep_improvement', 'stress_wellness', 'energy_productivity', 'event_training', 'health_condition', 'habit_building', 'overall_optimization', 'nutrition', 'fitness', 'custom'];

  // Map common invalid values to valid enum values
  const goalCategoryMapping: Record<string, string> = {
    balanced: 'overall_optimization',
    'general health': 'overall_optimization',
    'general_health': 'overall_optimization',
    wellness: 'stress_wellness',
  };

  const fieldMapping: Record<string, string> = {
    name: 'name',
    description: 'description',
    goalCategory: 'goal_category',
    dailyCalories: 'daily_calories',
    proteinGrams: 'protein_grams',
    carbsGrams: 'carbs_grams',
    fatGrams: 'fat_grams',
    fiberGrams: 'fiber_grams',
    dietaryPreferences: 'dietary_preferences',
    allergies: 'allergies',
    excludedFoods: 'excluded_foods',
    mealsPerDay: 'meals_per_day',
    snacksPerDay: 'snacks_per_day',
    mealTimes: 'meal_times',
    weeklyMeals: 'weekly_meals',
    status: 'status',
  };

  const jsonFields = ['dietary_preferences', 'allergies', 'excluded_foods', 'meal_times', 'weekly_meals'];

  const setClauses: string[] = [];
  const values: (string | number | boolean | null | object)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'planId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);

      // Validate and map goal_category
      if (dbField === 'goal_category') {
        let goalCategory = value as string;

        // Check if it's a valid enum value
        if (!validCategories.includes(goalCategory)) {
          // Try to map it
          const mapped = goalCategoryMapping[goalCategory.toLowerCase()];
          if (mapped) {
            goalCategory = mapped;
            logger.warn('[LangGraphTools] Mapped invalid goal_category in updateDietPlan', {
              userId,
              original: value,
              mapped: goalCategory,
            });
          } else {
            // Default to overall_optimization if no mapping found
            logger.warn('[LangGraphTools] Invalid goal_category in updateDietPlan, using default', {
              userId,
              original: value,
              default: 'overall_optimization',
            });
            goalCategory = 'overall_optimization';
          }
        }

        values.push(goalCategory);
      }
      // JSON fields need stringify
      else if (jsonFields.includes(dbField)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value as string | number | boolean | null | object);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  // If setting as active, deactivate other plans
  if (params.status === 'active') {
    await query(
      `UPDATE diet_plans SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2 AND status = 'active'`,
      [userId, params.planId]
    );
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE diet_plans SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.planId, userId]
  );

  // Enqueue embedding update
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'diet_plan',
    sourceId: params.planId,
    operation: 'update',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding', { error: err });
  });

  return JSON.stringify({
    success: true,
    message: 'Diet plan updated successfully',
    data: { id: params.planId },
  });
}

/**
 * Delete diet plan
 */
async function deleteDietPlan(userId: string, params: z.infer<typeof DeleteDietPlanSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM diet_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Diet plan not found or access denied' });
  }

  // Enqueue embedding deletion BEFORE actual deletion
  await embeddingQueueService.enqueueEmbedding({
    userId,
    sourceType: 'diet_plan',
    sourceId: params.planId,
    operation: 'delete',
    priority: JobPriorities.CRITICAL,
  }).catch((err) => {
    logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
  });

  await query(
    `DELETE FROM diet_plans WHERE id = $1 AND user_id = $2`,
    [params.planId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Diet plan deleted successfully',
  });
}

// ============================================
// OPERATIONS BY NAME
// ============================================

/**
 * Get meal by name
 */
async function getMealByName(userId: string, params: z.infer<typeof GetMealByNameSchema>): Promise<string> {
  const meals = await findMealByName(userId, params.name, params.exactMatch || false);

  if (meals.length === 0) {
    return JSON.stringify({ message: `No meal found with name "${params.name}"`, meals: [] });
  }

  if (meals.length > 1) {
    return JSON.stringify({
      message: `Multiple meals found with name "${params.name}". Please be more specific or use the meal ID.`,
      matches: meals.map(m => ({ id: m.id, name: m.name })),
      count: meals.length,
    });
  }

  // Get full meal details
  const result = await query(
    `SELECT * FROM meal_logs WHERE id = $1 AND user_id = $2`,
    [meals[0].id, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'Meal not found', meals: [] });
  }

  const meal = result.rows[0];
  const formatted = {
    id: meal.id,
    mealType: meal.meal_type,
    mealName: meal.meal_name,
    eatenAt: meal.eaten_at,
    calories: meal.calories,
    macros: {
      protein: meal.protein_grams,
      carbs: meal.carbs_grams,
      fat: meal.fat_grams,
      fiber: meal.fiber_grams,
    },
    foods: meal.foods || [],
    description: meal.description,
    notes: meal.notes,
  };

  return JSON.stringify({ meal: formatted }, null, 2);
}

/**
 * Update meal by name
 */
async function updateMealByName(userId: string, params: z.infer<typeof UpdateMealByNameSchema>): Promise<string> {
  const meals = await findMealByName(userId, params.name, params.exactMatch || false);

  if (meals.length === 0) {
    return JSON.stringify({ success: false, error: `No meal found with name "${params.name}"` });
  }

  if (meals.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple meals found with name "${params.name}". Please be more specific or use the meal ID.`,
      matches: meals.map(m => ({ id: m.id, name: m.name })),
    });
  }

  // Use the existing updateMealLog function with the found ID
  return await updateMealLog(userId, { ...params, mealId: meals[0].id } as any);
}

/**
 * Delete meal by name
 */
async function deleteMealByName(userId: string, params: z.infer<typeof DeleteMealByNameSchema>): Promise<string> {
  const meals = await findMealByName(userId, params.name, params.exactMatch || false);

  if (meals.length === 0) {
    return JSON.stringify({ success: false, error: `No meal found with name "${params.name}"` });
  }

  if (meals.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple meals found with name "${params.name}". Please be more specific or use the meal ID.`,
      matches: meals.map(m => ({ id: m.id, name: m.name })),
    });
  }

  // Use the existing deleteMealLog function with the found ID
  return await deleteMealLog(userId, { mealId: meals[0].id } as any);
}

/**
 * Get diet plan by name
 */
async function getDietPlanByName(userId: string, params: z.infer<typeof GetDietPlanByNameSchema>): Promise<string> {
  const plans = await findDietPlanByName(userId, params.name, params.exactMatch || false);

  if (plans.length === 0) {
    return JSON.stringify({ message: `No diet plan found with name "${params.name}"`, plans: [] });
  }

  if (plans.length > 1) {
    return JSON.stringify({
      message: `Multiple diet plans found with name "${params.name}". Please be more specific or use the plan ID.`,
      matches: plans.map(p => ({ id: p.id, name: p.name })),
      count: plans.length,
    });
  }

  // Get full plan details
  const result = await query(
    `SELECT * FROM diet_plans WHERE id = $1 AND user_id = $2`,
    [plans[0].id, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'Diet plan not found', plans: [] });
  }

  const plan = result.rows[0];
  const formatted = {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    goalCategory: plan.goal_category,
    status: plan.status,
    dailyCalories: plan.daily_calories,
    macros: {
      protein: plan.protein_grams,
      carbs: plan.carbs_grams,
      fat: plan.fat_grams,
      fiber: plan.fiber_grams,
    },
    mealsPerDay: plan.meals_per_day,
    snacksPerDay: plan.snacks_per_day,
    adherenceRate: `${Math.round((plan.adherence_rate || 0) * 100)}%`,
    createdAt: plan.created_at,
  };

  return JSON.stringify({ plan: formatted }, null, 2);
}

/**
 * Update diet plan by name
 */
async function updateDietPlanByName(userId: string, params: z.infer<typeof UpdateDietPlanByNameSchema>): Promise<string> {
  const plans = await findDietPlanByName(userId, params.name, params.exactMatch || false);

  if (plans.length === 0) {
    return JSON.stringify({ success: false, error: `No diet plan found with name "${params.name}"` });
  }

  if (plans.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple diet plans found with name "${params.name}". Please be more specific or use the plan ID.`,
      matches: plans.map(p => ({ id: p.id, name: p.name })),
    });
  }

  // Use the existing updateDietPlan function with the found ID
  return await updateDietPlan(userId, { ...params, planId: plans[0].id } as any);
}

/**
 * Delete diet plan by name
 */
async function deleteDietPlanByName(userId: string, params: z.infer<typeof DeleteDietPlanByNameSchema>): Promise<string> {
  const plans = await findDietPlanByName(userId, params.name, params.exactMatch || false);

  if (plans.length === 0) {
    return JSON.stringify({ success: false, error: `No diet plan found with name "${params.name}"` });
  }

  if (plans.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple diet plans found with name "${params.name}". Please be more specific or use the plan ID.`,
      matches: plans.map(p => ({ id: p.id, name: p.name })),
    });
  }

  // Use the existing deleteDietPlan function with the found ID
  return await deleteDietPlan(userId, { planId: plans[0].id } as any);
}

/**
 * Get recipe by name
 */
async function getRecipeByName(userId: string, params: z.infer<typeof GetRecipeByNameSchema>): Promise<string> {
  const recipes = await findRecipeByName(userId, params.name, params.exactMatch || false);

  if (recipes.length === 0) {
    return JSON.stringify({ message: `No recipe found with name "${params.name}"`, recipes: [] });
  }

  if (recipes.length > 1) {
    return JSON.stringify({
      message: `Multiple recipes found with name "${params.name}". Please be more specific or use the recipe ID.`,
      matches: recipes.map(r => ({ id: r.id, name: r.name })),
      count: recipes.length,
    });
  }

  // Get full recipe details
  const result = await query(
    `SELECT * FROM user_recipes WHERE id = $1 AND user_id = $2`,
    [recipes[0].id, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'Recipe not found', recipes: [] });
  }

  const recipe = result.rows[0];
  const formatted = {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    category: recipe.category,
    cuisine: recipe.cuisine,
    servings: recipe.servings,
    caloriesPerServing: recipe.calories_per_serving,
    macros: {
      protein: recipe.protein_grams,
      carbs: recipe.carbs_grams,
      fat: recipe.fat_grams,
      fiber: recipe.fiber_grams,
    },
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    prepTimeMinutes: recipe.prep_time_minutes,
    cookTimeMinutes: recipe.cook_time_minutes,
    totalTimeMinutes: recipe.total_time_minutes,
    tags: recipe.tags || [],
    dietaryFlags: recipe.dietary_flags || [],
    difficulty: recipe.difficulty,
    rating: recipe.rating,
    isFavorite: recipe.is_favorite,
    timesMade: recipe.times_made,
    createdAt: recipe.created_at,
  };

  return JSON.stringify({ recipe: formatted }, null, 2);
}

/**
 * Update recipe by name
 */
async function updateRecipeByName(userId: string, params: z.infer<typeof UpdateRecipeByNameSchema>): Promise<string> {
  const recipes = await findRecipeByName(userId, params.name, params.exactMatch || false);

  if (recipes.length === 0) {
    return JSON.stringify({ success: false, error: `No recipe found with name "${params.name}"` });
  }

  if (recipes.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple recipes found with name "${params.name}". Please be more specific or use the recipe ID.`,
      matches: recipes.map(r => ({ id: r.id, name: r.name })),
    });
  }

  // Use the existing updateRecipe function with the found ID
  return await updateRecipe(userId, { ...params, recipeId: recipes[0].id } as any);
}

/**
 * Delete recipe by name
 */
async function deleteRecipeByName(userId: string, params: z.infer<typeof DeleteRecipeByNameSchema>): Promise<string> {
  const recipes = await findRecipeByName(userId, params.name, params.exactMatch || false);

  if (recipes.length === 0) {
    return JSON.stringify({ success: false, error: `No recipe found with name "${params.name}"` });
  }

  if (recipes.length > 1) {
    return JSON.stringify({
      success: false,
      error: `Multiple recipes found with name "${params.name}". Please be more specific or use the recipe ID.`,
      matches: recipes.map(r => ({ id: r.id, name: r.name })),
    });
  }

  // Use the existing deleteRecipe function with the found ID
  return await deleteRecipe(userId, { recipeId: recipes[0].id } as any);
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Delete all meals
 */
async function deleteAllMeals(userId: string, params: z.infer<typeof DeleteAllMealsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all meals.',
    });
  }

  let sqlQuery = `DELETE FROM meal_logs WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.dateRange?.startDate) {
    sqlQuery += ` AND DATE(eaten_at) >= $${paramIndex}`;
    queryParams.push(params.dateRange.startDate);
    paramIndex++;
  }

  if (params.dateRange?.endDate) {
    sqlQuery += ` AND DATE(eaten_at) <= $${paramIndex}`;
    queryParams.push(params.dateRange.endDate);
    paramIndex++;
  }

  if (params.mealType) {
    sqlQuery += ` AND meal_type = $${paramIndex}`;
    queryParams.push(params.mealType);
    paramIndex++;
  }

  // Get IDs before deletion for embedding cleanup
  const idsResult = await query(
    sqlQuery.replace('DELETE FROM', 'SELECT id FROM'),
    queryParams
  );
  const ids = idsResult.rows.map((row: any) => row.id);

  // Enqueue embedding deletions
  for (const id of ids) {
    await embeddingQueueService.enqueueEmbedding({
      userId,
      sourceType: 'meal_log',
      sourceId: id,
      operation: 'delete',
      priority: JobPriorities.MEDIUM,
    }).catch((err) => {
      logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
    });
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} meal(s) deleted successfully`,
    deletedCount: result.rowCount || 0,
  });
}

/**
 * Update all meals
 */
async function updateAllMeals(userId: string, params: z.infer<typeof UpdateAllMealsSchema>): Promise<string> {
  let sqlQuery = `UPDATE meal_logs SET `;
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  const fieldMapping: Record<string, string> = {
    mealType: 'meal_type',
    mealName: 'meal_name',
    description: 'description',
    calories: 'calories',
    proteinGrams: 'protein_grams',
    carbsGrams: 'carbs_grams',
    fatGrams: 'fat_grams',
    fiberGrams: 'fiber_grams',
    notes: 'notes',
  };

  for (const [key, value] of Object.entries(params.updates)) {
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value as string | number | null);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  sqlQuery += setClauses.join(', ') + ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter?.dateRange?.startDate) {
    sqlQuery += ` AND DATE(eaten_at) >= $${paramIndex}`;
    values.push(params.filter.dateRange.startDate);
    paramIndex++;
  }

  if (params.filter?.dateRange?.endDate) {
    sqlQuery += ` AND DATE(eaten_at) <= $${paramIndex}`;
    values.push(params.filter.dateRange.endDate);
    paramIndex++;
  }

  if (params.filter?.mealType) {
    sqlQuery += ` AND meal_type = $${paramIndex}`;
    values.push(params.filter.mealType);
    paramIndex++;
  }

  // Get IDs before update for embedding updates
  let idsQuery = `SELECT id FROM meal_logs WHERE user_id = $1`;
  const idsParams: (string | number | null)[] = [userId];
  let idsParamIndex = 2;

  if (params.filter?.dateRange?.startDate) {
    idsQuery += ` AND DATE(eaten_at) >= $${idsParamIndex}`;
    idsParams.push(params.filter.dateRange.startDate);
    idsParamIndex++;
  }

  if (params.filter?.dateRange?.endDate) {
    idsQuery += ` AND DATE(eaten_at) <= $${idsParamIndex}`;
    idsParams.push(params.filter.dateRange.endDate);
    idsParamIndex++;
  }

  if (params.filter?.mealType) {
    idsQuery += ` AND meal_type = $${idsParamIndex}`;
    idsParams.push(params.filter.mealType);
    idsParamIndex++;
  }

  const idsResult = await query(idsQuery, idsParams);
  const ids = idsResult.rows.map((row: any) => row.id);

  const result = await query(sqlQuery, values);

  // Enqueue embedding updates
  for (const id of ids) {
    await embeddingQueueService.enqueueEmbedding({
      userId,
      sourceType: 'meal_log',
      sourceId: id,
      operation: 'update',
      priority: JobPriorities.MEDIUM,
    }).catch((err) => {
      logger.warn('[LangGraphTools] Failed to enqueue embedding update', { error: err });
    });
  }

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} meal(s) updated successfully`,
    updatedCount: result.rowCount || 0,
  });
}

/**
 * Delete all diet plans
 */
async function deleteAllDietPlans(userId: string, params: z.infer<typeof DeleteAllDietPlansSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all diet plans.',
    });
  }

  let sqlQuery = `DELETE FROM diet_plans WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  // Get IDs before deletion for embedding cleanup
  const idsResult = await query(
    sqlQuery.replace('DELETE FROM', 'SELECT id FROM'),
    queryParams
  );
  const ids = idsResult.rows.map((row: any) => row.id);

  // Enqueue embedding deletions
  for (const id of ids) {
    await embeddingQueueService.enqueueEmbedding({
      userId,
      sourceType: 'diet_plan',
      sourceId: id,
      operation: 'delete',
      priority: JobPriorities.CRITICAL,
    }).catch((err) => {
      logger.warn('[LangGraphTools] Failed to enqueue embedding deletion', { error: err });
    });
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} diet plan(s) deleted successfully`,
    deletedCount: result.rowCount || 0,
  });
}

/**
 * Update all diet plans
 */
async function updateAllDietPlans(userId: string, params: z.infer<typeof UpdateAllDietPlansSchema>): Promise<string> {
  let sqlQuery = `UPDATE diet_plans SET `;
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  const fieldMapping: Record<string, string> = {
    status: 'status',
    description: 'description',
    dailyCalories: 'daily_calories',
    mealsPerDay: 'meals_per_day',
    snacksPerDay: 'snacks_per_day',
  };

  for (const [key, value] of Object.entries(params.updates)) {
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value as string | number | null);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  sqlQuery += setClauses.join(', ') + ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter?.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    values.push(params.filter.status);
    paramIndex++;
  }

  if (params.filter?.goalCategory) {
    sqlQuery += ` AND goal_category = $${paramIndex}`;
    values.push(params.filter.goalCategory);
    paramIndex++;
  }

  // Get IDs before update for embedding updates
  let idsQuery = `SELECT id FROM diet_plans WHERE user_id = $1`;
  const idsParams: (string | number | null)[] = [userId];
  let idsParamIndex = 2;

  if (params.filter?.status) {
    idsQuery += ` AND status = $${idsParamIndex}`;
    idsParams.push(params.filter.status);
    idsParamIndex++;
  }

  if (params.filter?.goalCategory) {
    idsQuery += ` AND goal_category = $${idsParamIndex}`;
    idsParams.push(params.filter.goalCategory);
    idsParamIndex++;
  }

  const idsResult = await query(idsQuery, idsParams);
  const ids = idsResult.rows.map((row: any) => row.id);

  const result = await query(sqlQuery, values);

  // Enqueue embedding updates
  for (const id of ids) {
    await embeddingQueueService.enqueueEmbedding({
      userId,
      sourceType: 'diet_plan',
      sourceId: id,
      operation: 'update',
      priority: JobPriorities.CRITICAL,
    }).catch((err) => {
      logger.warn('[LangGraphTools] Failed to enqueue embedding update', { error: err });
    });
  }

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} diet plan(s) updated successfully`,
    updatedCount: result.rowCount || 0,
  });
}

/**
 * Delete all recipes
 */
async function deleteAllRecipes(userId: string, params: z.infer<typeof DeleteAllRecipesSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all recipes.',
    });
  }

  let sqlQuery = `DELETE FROM user_recipes WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    queryParams.push(params.category);
    paramIndex++;
  }

  if (params.favorite !== undefined) {
    sqlQuery += ` AND is_favorite = $${paramIndex}`;
    queryParams.push(params.favorite);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} recipe(s) deleted successfully`,
    deletedCount: result.rowCount || 0,
  });
}

/**
 * Update all recipes
 */
async function updateAllRecipes(userId: string, params: z.infer<typeof UpdateAllRecipesSchema>): Promise<string> {
  let sqlQuery = `UPDATE user_recipes SET `;
  const setClauses: string[] = [];
  const values: (string | number | boolean | null)[] = [];
  let paramIndex = 1;

  const fieldMapping: Record<string, string> = {
    category: 'category',
    difficulty: 'difficulty',
    isFavorite: 'is_favorite',
    rating: 'rating',
  };

  for (const [key, value] of Object.entries(params.updates)) {
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value as string | number | boolean | null);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  sqlQuery += setClauses.join(', ') + ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter?.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    values.push(params.filter.category);
    paramIndex++;
  }

  if (params.filter?.favorite !== undefined) {
    sqlQuery += ` AND is_favorite = $${paramIndex}`;
    values.push(params.filter.favorite);
    paramIndex++;
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `${result.rowCount || 0} recipe(s) updated successfully`,
    updatedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerNutritionTools(_userId: string): ToolDefinition[] {
  return [
    // Read tools
    {
      name: 'getUserDietPlans',
      description: 'Get the user\'s diet plans. Use when user asks about their nutrition plans, meal plans, or dietary goals. Returns plan details including calories, macros, meal structure, and adherence.',
      schema: GetUserDietPlansSchema,
      handler: withErrorHandling('getUserDietPlans', async (uid, params) =>
        getUserDietPlans(uid, params),
      ),
    },
    {
      name: 'getUserMealLogs',
      description: 'Get the user\'s meal logs (what they ate). Use when user asks about what they ate, their meals today, nutrition intake, or meal history. Returns meals with calories, macros, and food details.',
      schema: GetUserMealLogsSchema,
      handler: withErrorHandling('getUserMealLogs', async (uid, params) =>
        getUserMealLogs(uid, params),
      ),
    },
    {
      name: 'getUserRecipes',
      description: 'Get the user\'s recipes. Use when user asks about their recipes, saved recipes, favorite recipes, or recipe collection. Returns recipe details including ingredients, instructions, nutrition info, and cooking times.',
      schema: GetUserRecipesSchema,
      handler: withErrorHandling('getUserRecipes', async (uid, params) =>
        getUserRecipes(uid, params),
      ),
    },
    // Recipe CRUD
    {
      name: 'createRecipe',
      description: 'Create a new recipe. Use when user asks to create, add, or save a recipe. Requires recipe name.',
      schema: CreateRecipeSchema,
      handler: withErrorHandling('createRecipe', async (uid, params) =>
        createRecipe(uid, params),
      ),
    },
    {
      name: 'updateRecipe',
      description: 'Update an existing recipe. Use when user asks to modify, change, or update a recipe. Requires the recipe ID.',
      schema: UpdateRecipeSchema,
      handler: withErrorHandling('updateRecipe', async (uid, params) =>
        updateRecipe(uid, params),
      ),
    },
    {
      name: 'deleteRecipe',
      description: 'Delete a recipe. Use when user asks to remove, delete, or remove a recipe. Requires the recipe ID.',
      schema: DeleteRecipeSchema,
      handler: withErrorHandling('deleteRecipe', async (uid, params) =>
        deleteRecipe(uid, params),
      ),
    },
    // Meal Log CRUD
    {
      name: 'createMealLog',
      description: 'Log a meal. Use when user asks to log, record, or add a meal they ate. Requires meal type (breakfast, lunch, dinner, snack).',
      schema: CreateMealLogSchema,
      handler: withErrorHandling('createMealLog', async (uid, params) =>
        createMealLog(uid, params),
      ),
    },
    {
      name: 'updateMealLog',
      description: 'Update a meal log. Use when user asks to modify, change, or update a logged meal. Requires the meal log ID.',
      schema: UpdateMealLogSchema,
      handler: withErrorHandling('updateMealLog', async (uid, params) =>
        updateMealLog(uid, params),
      ),
    },
    {
      name: 'deleteMealLog',
      description: 'Delete a meal log. Use when user asks to remove, delete, or remove a logged meal. Requires the meal log ID.',
      schema: DeleteMealLogSchema,
      handler: withErrorHandling('deleteMealLog', async (uid, params) =>
        deleteMealLog(uid, params),
      ),
    },
    // Diet Plan CRUD
    {
      name: 'createDietPlan',
      description: 'Create a new diet plan or meal plan. Use when user asks to create, add, make, or generate a new diet plan, meal plan, nutrition plan, eating plan, or food plan. This tool creates a complete meal plan with meals and snacks. Always call this tool when user requests meal plans, diet plans, or nutrition plans. Requires plan name. You can optionally include weeklyMeals with meal descriptions for each day.',
      schema: CreateDietPlanSchema,
      handler: withErrorHandling('createDietPlan', async (uid, params) =>
        createDietPlan(uid, params),
      ),
    },
    {
      name: 'updateDietPlan',
      description: 'Update an existing diet plan. Use when user asks to modify, change, or update a diet plan. Requires the plan ID.',
      schema: UpdateDietPlanSchema,
      handler: withErrorHandling('updateDietPlan', async (uid, params) =>
        updateDietPlan(uid, params),
      ),
    },
    {
      name: 'deleteDietPlan',
      description: 'Delete a diet plan. Use when user asks to remove, delete, or cancel a diet plan. Requires the plan ID.',
      schema: DeleteDietPlanSchema,
      handler: withErrorHandling('deleteDietPlan', async (uid, params) =>
        deleteDietPlan(uid, params),
      ),
    },
    // By-name operations
    {
      name: 'getMealByName',
      description: 'Get a meal log by its name. Use when user asks to find, get, or retrieve a specific meal by name. Supports exact or partial name matching.',
      schema: GetMealByNameSchema,
      handler: withErrorHandling('getMealByName', async (uid, params) =>
        getMealByName(uid, params),
      ),
    },
    {
      name: 'updateMealByName',
      description: 'Update a meal log by its name. Use when user asks to modify, change, or update a specific meal by name. Supports exact or partial name matching.',
      schema: UpdateMealByNameSchema,
      handler: withErrorHandling('updateMealByName', async (uid, params) =>
        updateMealByName(uid, params),
      ),
    },
    {
      name: 'deleteMealByName',
      description: 'Delete a meal log by its name. Use when user asks to remove, delete, or remove a specific meal by name. Supports exact or partial name matching.',
      schema: DeleteMealByNameSchema,
      handler: withErrorHandling('deleteMealByName', async (uid, params) =>
        deleteMealByName(uid, params),
      ),
    },
    {
      name: 'getDietPlanByName',
      description: 'Get a diet plan by its name. Use when user asks to find, get, or retrieve a specific diet plan by name. Supports exact or partial name matching.',
      schema: GetDietPlanByNameSchema,
      handler: withErrorHandling('getDietPlanByName', async (uid, params) =>
        getDietPlanByName(uid, params),
      ),
    },
    {
      name: 'updateDietPlanByName',
      description: 'Update a diet plan by its name. Use when user asks to modify, change, or update a specific diet plan by name. Supports exact or partial name matching.',
      schema: UpdateDietPlanByNameSchema,
      handler: withErrorHandling('updateDietPlanByName', async (uid, params) =>
        updateDietPlanByName(uid, params),
      ),
    },
    {
      name: 'deleteDietPlanByName',
      description: 'Delete a diet plan by its name. Use when user asks to remove, delete, or cancel a specific diet plan by name. Supports exact or partial name matching.',
      schema: DeleteDietPlanByNameSchema,
      handler: withErrorHandling('deleteDietPlanByName', async (uid, params) =>
        deleteDietPlanByName(uid, params),
      ),
    },
    {
      name: 'getRecipeByName',
      description: 'Get a recipe by its name. Use when user asks to find, get, or retrieve a specific recipe by name. Supports exact or partial name matching.',
      schema: GetRecipeByNameSchema,
      handler: withErrorHandling('getRecipeByName', async (uid, params) =>
        getRecipeByName(uid, params),
      ),
    },
    {
      name: 'updateRecipeByName',
      description: 'Update a recipe by its name. Use when user asks to modify, change, or update a specific recipe by name. Supports exact or partial name matching.',
      schema: UpdateRecipeByNameSchema,
      handler: withErrorHandling('updateRecipeByName', async (uid, params) =>
        updateRecipeByName(uid, params),
      ),
    },
    {
      name: 'deleteRecipeByName',
      description: 'Delete a recipe by its name. Use when user asks to remove, delete, or remove a specific recipe by name. Supports exact or partial name matching.',
      schema: DeleteRecipeByNameSchema,
      handler: withErrorHandling('deleteRecipeByName', async (uid, params) =>
        deleteRecipeByName(uid, params),
      ),
    },
    // Bulk operations
    {
      name: 'deleteAllMeals',
      description: 'Delete all meal logs. Use when user asks to delete all meals, remove all meal logs, or clear all meal history. Requires confirmation. Can filter by date range or meal type.',
      schema: DeleteAllMealsSchema,
      handler: withErrorHandling('deleteAllMeals', async (uid, params) =>
        deleteAllMeals(uid, params),
      ),
    },
    {
      name: 'updateAllMeals',
      description: 'Update multiple meal logs at once. Use when user asks to update all meals, bulk update meals, or modify multiple meals. Can filter by date range or meal type.',
      schema: UpdateAllMealsSchema,
      handler: withErrorHandling('updateAllMeals', async (uid, params) =>
        updateAllMeals(uid, params),
      ),
    },
    {
      name: 'deleteAllDietPlans',
      description: 'Delete all diet plans. Use when user asks to delete all diet plans, remove all plans, or clear all diet plans. Requires confirmation. Can filter by status.',
      schema: DeleteAllDietPlansSchema,
      handler: withErrorHandling('deleteAllDietPlans', async (uid, params) =>
        deleteAllDietPlans(uid, params),
      ),
    },
    {
      name: 'updateAllDietPlans',
      description: 'Update multiple diet plans at once. Use when user asks to update all diet plans, bulk update plans, or modify multiple plans. Can filter by status or goal category.',
      schema: UpdateAllDietPlansSchema,
      handler: withErrorHandling('updateAllDietPlans', async (uid, params) =>
        updateAllDietPlans(uid, params),
      ),
    },
    {
      name: 'deleteAllRecipes',
      description: 'Delete all recipes. Use when user asks to delete all recipes, remove all recipes, or clear all recipes. Requires confirmation. Can filter by category or favorite status.',
      schema: DeleteAllRecipesSchema,
      handler: withErrorHandling('deleteAllRecipes', async (uid, params) =>
        deleteAllRecipes(uid, params),
      ),
    },
    {
      name: 'updateAllRecipes',
      description: 'Update multiple recipes at once. Use when user asks to update all recipes, bulk update recipes, or modify multiple recipes. Can filter by category or favorite status.',
      schema: UpdateAllRecipesSchema,
      handler: withErrorHandling('updateAllRecipes', async (uid, params) =>
        updateAllRecipes(uid, params),
      ),
    },
  ];
}
