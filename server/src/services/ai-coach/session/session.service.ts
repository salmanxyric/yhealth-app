import { query } from '../../../config/database.config.js';
import { logger } from '../../logger.service.js';
import { ApiError } from '../../../utils/ApiError.js';
import type { ChatMessage, ExtractedInsight, GoalCategory, ConversationPhase, AICoachSession } from '../types/index.js';
import type { DietPlanRequest, GeneratedDietPlan } from '../types/index.js';

export class SessionService {
  /**
   * Get previous sessions for a user
   */
  async getPreviousSessions(userId: string, limit: number = 20): Promise<AICoachSession[]> {
    try {
      const result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[];
        extracted_insights: ExtractedInsight[];
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT * FROM ai_coach_sessions
         WHERE user_id = $1 AND status != 'active'
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => this.mapSessionRow(row));
    } catch (error) {
      logger.error('[AICoach] Error getting previous sessions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to retrieve chat history');
    }
  }

  /**
   * Get active session for a user
   */
  async getActiveSession(userId: string, goal?: GoalCategory, sessionType?: string): Promise<AICoachSession | null> {
    let result: { rows: Array<{
      id: string;
      user_id: string;
      goal_category: string;
      session_type: string;
      messages: ChatMessage[] | unknown;
      extracted_insights: ExtractedInsight[] | unknown;
      conversation_phase: string;
      message_count: number;
      user_message_count: number;
      is_complete: boolean;
      session_summary: string | null;
      key_takeaways: string[] | null;
      completed_at: Date | null;
      created_at: Date | null;
      updated_at: Date | null;
    }> } | null = null;

    try {
      let queryText = `SELECT * FROM ai_coach_sessions
                       WHERE user_id = $1 AND status = 'active'`;
      const params: (string | number | boolean | null | Date | object)[] = [userId];

      if (goal) {
        queryText += ` AND goal_category = $${params.length + 1}`;
        params.push(goal);
      }

      if (sessionType) {
        queryText += ` AND session_type = $${params.length + 1}`;
        params.push(sessionType);
      }

      queryText += ` ORDER BY created_at DESC LIMIT 1`;

      result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[] | unknown;
        extracted_insights: ExtractedInsight[] | unknown;
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>(queryText, params);

      if (result.rows.length === 0) {
        return null;
      }

      const session = this.mapSessionRow(result.rows[0]);
      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.name : 'UnknownError';

      logger.error('[AICoach] Error getting active session', {
        userId,
        goal,
        error: errorMessage,
        errorName,
        stack: errorStack,
        // Include more context for debugging
        hasResult: result?.rows ? result.rows.length > 0 : false,
        resultRowCount: result?.rows ? result.rows.length : 0,
      });

      // Provide more specific error messages based on error type
      if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
        throw ApiError.internal('Failed to parse session data. The session may be corrupted.');
      } else if (errorMessage.includes('toISOString') || errorMessage.includes('Invalid Date')) {
        throw ApiError.internal('Failed to process session dates. The session may have invalid date data.');
      } else if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
        throw ApiError.internal('Database connection error. Please try again.');
      }

      throw ApiError.internal('Failed to retrieve active session');
    }
  }

  /**
   * Get a specific session owned by a user.
   */
  async getSessionById(userId: string, sessionId: string): Promise<AICoachSession | null> {
    try {
      const result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[] | unknown;
        extracted_insights: ExtractedInsight[] | unknown;
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>(
        `SELECT * FROM ai_coach_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [sessionId, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSessionRow(result.rows[0]);
    } catch (error) {
      logger.error('[AICoach] Error getting session by id', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to retrieve session');
    }
  }

  /**
   * Create a new AI coach session in the database
   */
  async createSession(
    userId: string,
    goal: GoalCategory,
    sessionType: string
  ): Promise<AICoachSession> {
    try {
      const result = await query<{
        id: string;
        user_id: string;
        goal_category: string;
        session_type: string;
        messages: ChatMessage[];
        extracted_insights: ExtractedInsight[];
        conversation_phase: string;
        message_count: number;
        user_message_count: number;
        is_complete: boolean;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date | null;
        created_at: Date;
        updated_at: Date;
      }>(
        `INSERT INTO ai_coach_sessions (user_id, goal_category, session_type)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, goal, sessionType]
      );

      return this.mapSessionRow(result.rows[0]);
    } catch (error) {
      logger.error('[AICoach] Error creating session', {
        userId,
        goal,
        sessionType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to create AI coach session');
    }
  }

  /**
   * Delete an AI coach session
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    try {
      const result = await query(
        `DELETE FROM ai_coach_sessions WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
      );

      if (result.rowCount === 0) {
        throw ApiError.notFound('Session not found');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('[AICoach] Error deleting session', {
        userId,
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to delete session');
    }
  }

  /**
   * Generate a personalized diet plan from coach assessment inputs.
   */
  async generateDietPlan(request: DietPlanRequest): Promise<GeneratedDietPlan> {
    const goal = request.goalCategory || request.goal || 'general_wellness';
    const preferences = request.preferences || {};
    const dietaryRestrictions = this.getStringArrayPreference(preferences, 'dietaryRestrictions');
    const allergies = this.getStringArrayPreference(preferences, 'allergies');
    const cuisinePreferences = this.getStringArrayPreference(preferences, 'cuisinePreferences');
    const mealsPerDay = this.clampNumberPreference(preferences, 'mealsPerDay', 3, 1, 6);
    const targets = this.buildNutritionTargets(goal);
    const mealTimes = this.buildMealTimes(mealsPerDay);
    const weeklyMeals = this.buildWeeklyMeals(mealsPerDay, dietaryRestrictions, allergies, cuisinePreferences, goal);
    const insightTips = (request.insights || [])
      .filter((insight) => insight.confidence >= 0.5)
      .slice(0, 3)
      .map((insight) => `Account for this coaching insight: ${insight.text}`);

    return {
      source: 'rule_based',
      plan: {
        name: `${this.toTitle(goal)} Nutrition Plan`,
        description: `A practical ${this.toTitle(goal).toLowerCase()} plan generated from AI Coach assessment context.`,
        dailyCalories: targets.dailyCalories,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        fiberGrams: targets.fiberGrams,
        mealsPerDay,
        snacksPerDay: mealsPerDay >= 4 ? 1 : 2,
        mealTimes,
        weeklyMeals,
        tips: [
          'Prioritize protein at each main meal.',
          'Keep hydration visible with water near each meal.',
          'Review adherence weekly and adjust portions before changing foods.',
          ...insightTips,
        ],
        shoppingList: this.buildShoppingList(dietaryRestrictions, allergies),
      },
    };
  }

  /**
   * Save a generated diet plan to the database
   */
  async saveDietPlan(userId: string, plan: GeneratedDietPlan, goal: GoalCategory): Promise<string> {
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO diet_plans (
          user_id, name, description, goal_category,
          daily_calories, protein_grams, carbs_grams, fat_grams, fiber_grams,
          dietary_preferences, allergies,
          meals_per_day, snacks_per_day, meal_times, weekly_meals,
          shopping_list, ai_generated, ai_model, generation_params
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, 'rule-based-coach-v1', $17)
         RETURNING id`,
        [
          userId,
          plan.plan.name,
          plan.plan.description,
          goal,
          plan.plan.dailyCalories,
          plan.plan.proteinGrams,
          plan.plan.carbsGrams,
          plan.plan.fatGrams,
          plan.plan.fiberGrams,
          JSON.stringify([]),
          JSON.stringify([]),
          plan.plan.mealsPerDay,
          plan.plan.snacksPerDay,
          JSON.stringify(plan.plan.mealTimes),
          JSON.stringify(plan.plan.weeklyMeals),
          JSON.stringify(plan.plan.shoppingList),
          JSON.stringify({ goal, source: plan.source }),
        ]
      );

      return result.rows[0].id;
    } catch (error) {
      logger.error('[AICoach] Error saving diet plan', {
        userId,
        goal,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to save diet plan');
    }
  }

  private getStringArrayPreference(preferences: Record<string, unknown>, key: string): string[] {
    const value = preferences[key];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  private clampNumberPreference(
    preferences: Record<string, unknown>,
    key: string,
    fallback: number,
    min: number,
    max: number
  ): number {
    const value = preferences[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  private buildNutritionTargets(goal: GoalCategory): {
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  } {
    switch (goal) {
      case 'weight_loss':
        return { dailyCalories: 1900, proteinGrams: 140, carbsGrams: 170, fatGrams: 60, fiberGrams: 32 };
      case 'muscle_gain':
        return { dailyCalories: 2700, proteinGrams: 180, carbsGrams: 310, fatGrams: 80, fiberGrams: 35 };
      case 'endurance':
        return { dailyCalories: 2500, proteinGrams: 150, carbsGrams: 320, fatGrams: 70, fiberGrams: 34 };
      case 'nutrition':
        return { dailyCalories: 2200, proteinGrams: 150, carbsGrams: 230, fatGrams: 70, fiberGrams: 35 };
      default:
        return { dailyCalories: 2200, proteinGrams: 145, carbsGrams: 235, fatGrams: 70, fiberGrams: 30 };
    }
  }

  private buildMealTimes(mealsPerDay: number): Record<string, string> {
    const mealTimes: Record<string, string> = {
      breakfast: '07:30',
      lunch: '12:30',
      dinner: '19:00',
    };
    if (mealsPerDay >= 4) mealTimes.snack = '16:00';
    if (mealsPerDay >= 5) mealTimes.eveningSnack = '21:00';
    if (mealsPerDay >= 6) mealTimes.preWorkout = '10:00';
    return mealTimes;
  }

  private buildWeeklyMeals(
    mealsPerDay: number,
    dietaryRestrictions: string[],
    allergies: string[],
    cuisinePreferences: string[],
    goal: GoalCategory
  ): Record<string, Record<string, string>> {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const protein = dietaryRestrictions.some((item) => ['vegetarian', 'vegan'].includes(item.toLowerCase()))
      ? 'lentils, tofu, Greek yogurt, beans, and eggs where appropriate'
      : 'chicken, fish, eggs, lean beef, Greek yogurt, and legumes';
    const cuisine = cuisinePreferences.length > 0 ? cuisinePreferences.slice(0, 2).join(' or ') : 'balanced whole-food';
    const allergyNote = allergies.length > 0 ? ` Avoid ${allergies.join(', ')}.` : '';
    const focus = goal === 'weight_loss' ? 'controlled portions' : goal === 'muscle_gain' ? 'larger protein portions' : 'steady energy';

    return Object.fromEntries(days.map((day, index) => {
      const meals: Record<string, string> = {
        breakfast: `${cuisine} breakfast with high-fiber carbs and ${protein}.${allergyNote}`,
        lunch: `Lean protein bowl with vegetables, slow carbs, and ${focus}.`,
        dinner: `Simple dinner built around ${protein}, vegetables, and healthy fats.`,
      };
      if (mealsPerDay >= 4) meals.snack = index % 2 === 0 ? 'Fruit with yogurt or nuts.' : 'Protein smoothie or hummus with vegetables.';
      if (mealsPerDay >= 5) meals.eveningSnack = 'Light recovery snack with protein and fiber.';
      if (mealsPerDay >= 6) meals.preWorkout = 'Small carb-forward pre-workout snack.';
      return [day, meals];
    }));
  }

  private buildShoppingList(dietaryRestrictions: string[], allergies: string[]): string[] {
    const vegetarian = dietaryRestrictions.some((item) => ['vegetarian', 'vegan'].includes(item.toLowerCase()));
    const base = vegetarian
      ? ['tofu', 'lentils', 'beans', 'Greek yogurt', 'eggs']
      : ['chicken breast', 'salmon', 'eggs', 'Greek yogurt', 'lentils'];
    return [
      ...base,
      'oats',
      'brown rice',
      'leafy greens',
      'berries',
      'olive oil',
      'mixed vegetables',
    ].filter((item) => !allergies.some((allergy) => item.toLowerCase().includes(allergy.toLowerCase())));
  }

  private toTitle(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Get the active diet plan for a user
   */
  async getActiveDietPlan(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const result = await query<Record<string, unknown>>(
        `SELECT * FROM diet_plans
         WHERE user_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      logger.error('[AICoach] Error getting active diet plan', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw ApiError.internal('Failed to retrieve diet plan');
    }
  }

  /**
   * Build historical context string from previous sessions for a user
   */
  async buildHistoricalContext(userId: string): Promise<string> {
    try {
      // Get recent completed sessions
      const result = await query<{
        goal_category: string;
        session_summary: string | null;
        key_takeaways: string[] | null;
        completed_at: Date;
      }>(
        `SELECT goal_category, session_summary, key_takeaways, completed_at
         FROM ai_coach_sessions
         WHERE user_id = $1 AND is_complete = true
         ORDER BY completed_at DESC
         LIMIT 5`,
        [userId]
      );

      if (result.rows.length === 0) {
        return '';
      }

      const contextParts: string[] = [];
      contextParts.push('Previous AI Coach Sessions:');

      for (const session of result.rows) {
        const date = new Date(session.completed_at).toLocaleDateString();
        contextParts.push(`\n- ${session.goal_category} (${date})`);
        if (session.session_summary) {
          contextParts.push(`  Summary: ${session.session_summary}`);
        }
        if (session.key_takeaways && session.key_takeaways.length > 0) {
          contextParts.push(`  Key Takeaways: ${session.key_takeaways.join(', ')}`);
        }
      }

      return contextParts.join('\n');
    } catch (error) {
      logger.error('[AICoach] Error building historical context', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return '';
    }
  }

  /**
   * Add a message to an existing session and update metadata
   */
  async addMessageToSession(
    sessionId: string,
    message: ChatMessage,
    insights?: ExtractedInsight[],
    phase?: ConversationPhase,
    isComplete?: boolean
  ): Promise<void> {
    try {
      // Build SET clauses dynamically
      let setClause = `messages = messages || $2::jsonb,
                        message_count = message_count + 1,
                        updated_at = NOW()`;
      const params: (string | number | boolean | null | Date | object)[] = [
        sessionId,
        JSON.stringify([message]),
      ];
      let paramIndex = 3;

      if (message.role === 'user') {
        setClause += `, user_message_count = user_message_count + 1`;
      }

      if (insights !== undefined) {
        setClause += `, extracted_insights = $${paramIndex}::jsonb`;
        params.push(JSON.stringify(insights));
        paramIndex++;
      }

      if (phase !== undefined) {
        setClause += `, conversation_phase = $${paramIndex}`;
        params.push(phase);
        paramIndex++;
      }

      if (isComplete !== undefined) {
        setClause += `, is_complete = $${paramIndex}`;
        params.push(isComplete);
        paramIndex++;

        if (isComplete) {
          setClause += `, status = 'completed', completed_at = NOW()`;
        }
      }

      await query(
        `UPDATE ai_coach_sessions SET ${setClause} WHERE id = $1`,
        params
      );
    } catch (error) {
      logger.error('[AICoach] Error adding message to session', {
        sessionId,
        role: message.role,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw ApiError.internal('Failed to update session');
    }
  }

  /**
   * Map database row to AICoachSession
   */
  private mapSessionRow(row: {
    id: string;
    user_id: string;
    goal_category: string;
    session_type: string;
    messages: ChatMessage[] | unknown;
    extracted_insights: ExtractedInsight[] | unknown;
    conversation_phase: string;
    message_count: number;
    user_message_count: number;
    is_complete: boolean;
    session_summary: string | null;
    key_takeaways: string[] | null;
    completed_at: Date | null;
    created_at: Date | null;
    updated_at: Date | null;
  }): AICoachSession {
    // Safely parse JSONB fields with error handling
    let messages: ChatMessage[] = [];
    try {
      if (Array.isArray(row.messages)) {
        messages = row.messages as ChatMessage[];
      } else if (typeof row.messages === 'string' && row.messages.trim()) {
        messages = JSON.parse(row.messages) as ChatMessage[];
        if (!Array.isArray(messages)) {
          logger.warn('[AICoach] messages is not an array after parsing', {
            sessionId: row.id,
            messagesType: typeof messages,
          });
          messages = [];
        }
      }
    } catch (error) {
      logger.error('[AICoach] Failed to parse messages JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        messagesValue: typeof row.messages === 'string' ? row.messages.substring(0, 100) : row.messages,
      });
      messages = [];
    }

    let extractedInsights: ExtractedInsight[] = [];
    try {
      if (Array.isArray(row.extracted_insights)) {
        extractedInsights = row.extracted_insights as ExtractedInsight[];
      } else if (typeof row.extracted_insights === 'string' && row.extracted_insights.trim()) {
        extractedInsights = JSON.parse(row.extracted_insights) as ExtractedInsight[];
        if (!Array.isArray(extractedInsights)) {
          logger.warn('[AICoach] extracted_insights is not an array after parsing', {
            sessionId: row.id,
            extractedInsightsType: typeof extractedInsights,
          });
          extractedInsights = [];
        }
      }
    } catch (error) {
      const insightsValue = typeof row.extracted_insights === 'string'
        ? row.extracted_insights.substring(0, 100)
        : String(row.extracted_insights).substring(0, 100);
      logger.error('[AICoach] Failed to parse extracted_insights JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        extractedInsightsValue: insightsValue,
      });
      extractedInsights = [];
    }

    let keyTakeaways: string[] | null = null;
    const keyTakeawaysRaw: string | string[] | null = row.key_takeaways as string | string[] | null; // Store raw value for error logging
    try {
      if (Array.isArray(keyTakeawaysRaw)) {
        keyTakeaways = keyTakeawaysRaw;
      } else if (keyTakeawaysRaw !== null && typeof keyTakeawaysRaw === 'string') {
        const trimmed = keyTakeawaysRaw.trim();
        if (trimmed) {
          const parsed = JSON.parse(trimmed);
          keyTakeaways = Array.isArray(parsed) ? parsed : null;
          if (keyTakeaways && !keyTakeaways.every(item => typeof item === 'string')) {
            logger.warn('[AICoach] key_takeaways contains non-string items', {
              sessionId: row.id,
            });
            keyTakeaways = null;
          }
        }
      }
    } catch (error) {
      const takeawaysValue = keyTakeawaysRaw !== null && typeof keyTakeawaysRaw === 'string'
        ? keyTakeawaysRaw.substring(0, 100)
        : keyTakeawaysRaw !== null && keyTakeawaysRaw !== undefined
          ? String(keyTakeawaysRaw).substring(0, 100)
          : 'null';
      logger.error('[AICoach] Failed to parse key_takeaways JSON', {
        sessionId: row.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        keyTakeawaysValue: takeawaysValue,
      });
      keyTakeaways = null;
    }

    // Safely handle date fields with null checks
    const createdAt = row.created_at instanceof Date
      ? row.created_at.toISOString()
      : (row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString());

    const updatedAt = row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : (row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString());

    const completedAt = row.completed_at instanceof Date
      ? row.completed_at.toISOString()
      : (row.completed_at ? new Date(row.completed_at).toISOString() : undefined);

    return {
      id: row.id,
      userId: row.user_id,
      goalCategory: row.goal_category,
      sessionType: row.session_type,
      messages,
      extractedInsights,
      conversationPhase: row.conversation_phase,
      messageCount: row.message_count,
      userMessageCount: row.user_message_count ?? 0,
      isComplete: row.is_complete,
      sessionSummary: row.session_summary || undefined,
      keyTakeaways: keyTakeaways || undefined,
      completedAt,
      createdAt,
      updatedAt,
    };
  }
}
