/**
 * @file Tool Router Service
 * @description Intent-based tool routing to reduce tool count per request
 *
 * Problem: Loading 163 tools causes 3.6s TTFT
 * Solution: Route to 15-25 tools per request based on user intent
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { logger } from './logger.service.js';
import type { ToolTurnContext } from '../types/tool-turn-context.js';

// ============================================
// MESSAGE COMPLEXITY (for fast-path routing)
// ============================================

export type MessageComplexity = 'TRIVIAL' | 'SIMPLE_ACTION' | 'CONVERSATIONAL' | 'ANALYTICAL';

export interface IntentClassification {
  primary: ToolIntent;
  secondary: ToolIntent[];
  complexity: MessageComplexity;
  confidence: number;
}

// ============================================
// INTENT TYPES
// ============================================

export type ToolIntent =
  | 'meals'        // Food logging, recipes, nutrition
  | 'workouts'     // Exercise plans, workout logs
  | 'goals'        // Goal setting and tracking
  | 'schedules'    // Daily schedules, calendar
  | 'wellbeing'    // Mood, stress, journal, energy, habits
  | 'progress'     // Weight, measurements, body tracking
  | 'water'        // Water intake tracking
  | 'shopping'     // Shopping lists
  | 'reminders'    // Scheduled reminders
  | 'notes'        // Quick notes and sticky notes
  | 'integrations' // Third-party integrations (Whoop, etc.)
  | 'competitions' // Competitions, challenges, leaderboards
  | 'emotional'    // Emotional check-ins, mental recovery
  | 'gamification' // XP, levels, streaks, achievements
  | 'personal'     // Personal life context (occupation, family, routine)
  | 'music'        // Music playback, playlists, Spotify/Pulse
  | 'status'       // Activity status (sick, traveling, injured, etc.)
  | 'finance'      // Budget, spending, income, savings, transactions
  | 'analytics'    // Correlations, trends, comparisons, anomalies, deep analysis
  | 'general';     // Profile, preferences, general queries

// ============================================
// TOOL GROUPS
// ============================================

/**
 * Maps intents to tool name prefixes/patterns
 * Used to filter tools based on detected intent
 */
export const TOOL_GROUPS: Record<ToolIntent, string[]> = {
  meals: [
    // Semantic managers
    'mealManager',
    'recipeManager',
    'dietPlanManager',
    // Read-only helpers
    'getUserMealLogs',
    'getUserRecipes',
    'getUserDietPlans',
    'getUserActivePlans',
  ],

  workouts: [
    'workoutManager',
    'scheduleManager', // Needed for rescheduling missed workouts
    'checkScheduleConflicts', // Conflict check for "schedule my workout at X"
    'getUserWorkoutPlans',
    'getUserWorkoutLogs',
    'getUserActivePlans',
    'checkWorkoutProgress',
  ],

  goals: [
    'goalManager',
    'getUserGoals',
    'getUserActivePlans',
    'getUserProgress',
  ],

  schedules: [
    'scheduleManager',
    'getUserSchedules',
    'getScheduleByDate',
    'getUserTasks',
    'checkScheduleConflicts',
  ],

  wellbeing: [
    'moodManager',
    'stressManager',
    'journalManager',
    'voiceJournalManager',
    'energyManager',
    'habitManager',
    'sleepManager',
    'scheduleManager',
    'getScheduleByDate',
    'checkScheduleConflicts',
    'getUserMoodTrends',
    'getUserActivityLogsWithMood',
    'createDailyCheckin',
    'getTodayCheckin',
    'getCheckinHistory',
    'getCheckinStreak',
    'getJournalInsights',
  ],

  progress: [
    'progressManager',
    'getUserProgress',
  ],

  water: [
    'waterIntakeManager',
    'getWaterIntakeLogs',
    'addWaterEntry',
  ],

  shopping: [
    'getShoppingListItems',
    'createShoppingListItem',
    'updateShoppingListItem',
    'deleteShoppingListItem',
    'getUserDietPlans',
  ],

  reminders: [
    'getScheduledReminders',
    'createScheduledReminder',
    'updateScheduledReminder',
    'deleteScheduledReminder',
    'scheduleManager',
    'getUserTasks',
  ],

  notes: [
    'getQuickNotes',
    'getQuickNoteById',
    'createQuickNote',
    'updateQuickNote',
    'deleteQuickNote',
  ],

  integrations: [
    'getUserIntegrations',
    'whoopAnalyticsManager',
  ],

  competitions: [
    'competitionManager',
    'getUserActivePlans',
  ],

  emotional: [
    'emotionalCheckinManager',
    'mentalRecoveryManager',
    'moodManager',
  ],

  gamification: [
    'gamificationManager',
    'getUserActivePlans',
    'getStreakStatus',
    'getStreakCalendar',
    'getStreakLeaderboard',
    'freezeStreak',
    'getStreakStats',
  ],

  personal: [
    'personalContextManager',
    'medicationManager',
    'getUserProfile',
    'getUserPreferences',
  ],

  status: [
    'getStatusHistory',
    'getUserActivePlans',
  ],

  general: [
    // Always available - core read tools
    'getUserActivePlans',
    'getUserProfile',
    'getUserPreferences',
    'getUserProgress',
    'getUserGoals',
    'getUserMoodTrends',
    'getUserTasks',
    'getQuickNotes',
    'getScheduleByDate',
    'getDashboardSummary',
    'scheduleManager', // Always available — system prompt references it for many scenarios
    'checkScheduleConflicts', // Always available — paired with scheduleManager for conflict detection
    'gamificationManager',
    'mentalRecoveryManager',
    'personalContextManager', // Always available — AI can save personal facts anytime
    'whoopAnalyticsManager', // Always available — WHOOP data queries for health coaching
    'activityTimeline', // Always available — cross-domain activity feed
    'aiDecisionHistory', // Always available — AI accountability ("what did you do?")
  ],

  finance: [
    'getFinancialSummary',
    'getMonthlySummary',
    'getSpendingByCategory',
    'getSpendingTrends',
    'getMonthComparison',
    'getFinancialForecast',
    'getFinancialReport',
    'getBudgets',
    'getBudgetAlerts',
    'getSavingGoals',
    'getRecentTransactions',
    'logTransaction',
    'updateTransaction',
    'deleteTransaction',
    'createBudget',
    'updateBudget',
    'deleteBudget',
    'createSavingGoal',
    'updateSavingGoal',
    'deleteSavingGoal',
  ],

  music: [
    'musicManager',
  ],

  analytics: [
    'analyzeCorrelation',
    'analyzeTrend',
    'compareTimePeriods',
    'detectAnomalies',
    'analyzeMultiFactor',
    'analyzeGoalProgress',
  ],
};

// ============================================
// INTENT CLASSIFICATION
// ============================================

/**
 * Intent keywords for fast classification
 * Maps common phrases to intents
 */
const INTENT_KEYWORDS: Record<ToolIntent, string[]> = {
  meals: [
    'meal', 'food', 'eat', 'ate', 'eating', 'breakfast', 'lunch', 'dinner',
    'snack', 'recipe', 'cook', 'cooking', 'nutrition', 'calories', 'calorie',
    'macro', 'protein', 'carb', 'fat', 'diet plan', 'meal plan', 'hungry',
  ],

  workouts: [
    'workout', 'exercise', 'gym', 'training', 'train', 'lift', 'lifting',
    'cardio', 'run', 'running', 'fitness', 'strength', 'muscle', 'reps',
    'sets', 'weight training', 'hiit', 'yoga', 'stretch', 'warm up',
  ],

  goals: [
    'goal', 'target', 'objective', 'aim', 'achieve', 'progress toward',
    'milestone', 'deadline', 'reach', 'accomplish',
  ],

  schedules: [
    'schedule', 'calendar', 'plan my day', 'daily plan', 'agenda',
    'appointment', 'time', 'when', 'today', 'tomorrow', 'routine',
    'prayer', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morning routine', 'evening routine', 'daily routine',
  ],

  wellbeing: [
    'mood', 'feeling', 'feel', 'emotion', 'stress', 'stressed', 'anxious',
    'anxiety', 'journal', 'journaling', 'journling', 'journl', 'diary', 'energy', 'tired', 'exhausted', 'habit',
    'mental', 'wellbeing', 'wellness', 'happy', 'sad', 'angry', 'calm',
    'check-in', 'checkin', 'check in', 'daily checkin', 'daily check-in',
    'reflection', 'reflections', 'insights', 'constellation', 'stars',
    'voice journal', 'voice entry', 'speak', 'record', 'voice reflection',
    'sleep', 'slept', 'bedtime', 'wake up', 'woke up', 'insomnia', 'nap', 'rest',
  ],

  progress: [
    'weight', 'weigh', 'measurement', 'body', 'bmi', 'body fat', 'progress',
    'track', 'tracking', 'photo', 'picture', 'before after',
  ],

  water: [
    'water', 'hydration', 'hydrate', 'drink', 'drinking', 'thirsty', 'fluid',
    'glass', 'bottle', 'ml', 'oz', 'ounce', 'liter',
  ],

  shopping: [
    'shopping', 'shop', 'grocery', 'groceries', 'buy', 'purchase', 'list',
    'ingredients', 'store',
  ],

  reminders: [
    'reminder', 'remind', 'alert', 'notification', 'notify', 'alarm',
  ],

  notes: [
    'note', 'notes', 'sticky note', 'quick note', 'remember this',
    'save this', 'jot down', 'write this down', 'capture this',
    'pin this', 'archive note',
  ],

  integrations: [
    'whoop', 'fitbit', 'apple health', 'garmin', 'strava', 'integration',
    'connect', 'sync', 'import', 'device', 'wearable', 'watch',
    'hrv', 'recovery score', 'strain score', 'sleep stages', 'spo2',
    'resting heart rate', 'biometrics', 'recovery trend', 'sleep trend',
    'sleep quality', 'skin temp', 'heart rate variability',
  ],

  competitions: [
    'competition', 'compete', 'challenge', 'leaderboard', 'rank', 'ranking',
    'tournament', 'contest', 'versus', 'vs',
  ],

  emotional: [
    'emotional', 'checkin', 'check-in', 'recovery score', 'mental recovery',
    'screening', 'emotional health', 'mental health score',
  ],

  gamification: [
    'xp', 'level', 'achievement', 'badge', 'streak', 'points',
    'gamification', 'level up', 'experience', 'reward',
  ],

  personal: [
    'personal', 'family', 'married', 'wife', 'husband', 'kids', 'children',
    'job', 'work', 'office', 'occupation', 'career', 'schedule',
    'cook', 'cooking', 'kitchen',
    'live', 'living', 'apartment', 'house', 'home',
    'hobby', 'hobbies', 'interests', 'relationship',
    'medication', 'medicine', 'pill', 'pills', 'prescription', 'drug', 'supplement', 'vitamin',
  ],

  music: [
    'music', 'song', 'songs', 'play music', 'playing', 'playlist', 'track',
    'listen', 'spotify', 'pause music', 'stop music', 'next song',
    'skip', 'volume', 'turn up', 'turn down', 'louder', 'quieter', 'mute',
    'beats', 'tune', 'tunes', 'audio', 'soundscape', 'pulse',
  ],

  status: [
    'status', 'sick', 'injured', 'traveling', 'vacation', 'rest day',
    'activity status', 'feeling sick', 'hurt', 'recovery day', 'on leave',
    'under the weather', 'not feeling well',
  ],

  finance: [
    'finance', 'financial', 'money', 'income', 'expense', 'expenses', 'budget',
    'savings', 'saving', 'spending', 'transaction', 'transactions', 'salary',
    'financial report', 'finance report', 'previous financial report', 'prev financial report',
    'cash flow', 'net worth', 'forecast', 'category breakdown',
  ],

  analytics: [
    'correlation', 'correlate', 'relationship between',
    'trend', 'trending', 'over time',
    'anomaly', 'anomalies', 'unusual', 'outlier',
    'compare', 'comparison',
    'what affects', 'what drives', 'what influences',
    'analyze', 'analysis', 'deep analysis',
    'chart', 'graph', 'visualize', 'visualization',
    'pattern', 'patterns',
    'goal progress', 'on track',
    'factor', 'factors',
    'scatter', 'histogram',
  ],

  general: [], // Fallback - no specific keywords
};

// Trivial messages that need no RAG/context enrichment
const TRIVIAL_PATTERNS = [
  /^(hi|hey|hello|yo|sup|hola|salaam|assalam\s*u?\s*alaikum|wassalam|salam)[\s!.,?]*$/i,
  /^(thanks|thank you|thank u|thx|ty|ok|okay|sure|yes|yep|yeah|no|nope|nah|got it|understood|cool|great|nice|awesome|perfect|alright|right|fine|good|done|bye|goodbye|see you|later|cheers|lol|haha|hmm|ah|oh|wow)[\s!.,?]*$/i,
  /^(good morning|good afternoon|good evening|good night|gm|gn)[\s!.,?]*$/i,
  /^(how are you|what's up|whats up|how's it going|how r u)[\s!.,?]*$/i,
];

// Action verbs indicating a clear, direct tool call
const SIMPLE_ACTION_PATTERNS = [
  /\b(log|add|record|track|create|set|delete|remove|update|change|edit|cancel|schedule|plan|play|stop|pause|skip)\b/i,
];

// Analytical keywords indicating deep analysis/reasoning
const ANALYTICAL_KEYWORDS = [
  'correlation', 'correlate', 'trend', 'analyze', 'analysis', 'compare', 'comparison',
  'anomaly', 'pattern', 'what affects', 'what drives', 'relationship between',
  'over time', 'deep analysis', 'factor', 'factors', 'multi-factor', 'how does',
  'why does', 'explain the connection', 'breakdown', 'insights', 'data',
];

/**
 * Classify user message intent using keyword matching
 * Returns primary intent, secondary intents, message complexity, and confidence
 */
export function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase();
  const trimmedMessage = message.trim();
  const intentScores: Record<ToolIntent, number> = {
    meals: 0,
    workouts: 0,
    goals: 0,
    schedules: 0,
    wellbeing: 0,
    progress: 0,
    water: 0,
    shopping: 0,
    reminders: 0,
    notes: 0,
    integrations: 0,
    competitions: 0,
    emotional: 0,
    gamification: 0,
    personal: 0,
    music: 0,
    status: 0,
    finance: 0,
    analytics: 0,
    general: 0,
  };

  // Score each intent based on keyword matches
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        intentScores[intent as ToolIntent] += keyword.length;
      }
    }
  }

  // Fuzzy fallback: if no strong match, check for partial keyword matches (min 4 chars)
  const hasStrongMatch = Object.values(intentScores).some(s => s >= 4);
  if (!hasStrongMatch) {
    const words = lowerMessage.split(/\s+/);
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (keyword.length < 4) continue;
        const prefix = keyword.substring(0, Math.max(4, Math.floor(keyword.length * 0.7)));
        if (words.some(w => w.startsWith(prefix) || prefix.startsWith(w.substring(0, 4)))) {
          intentScores[intent as ToolIntent] += Math.floor(keyword.length * 0.5);
        }
      }
    }
  }

  // Sort intents by score
  const sortedIntents = Object.entries(intentScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([intent, score]) => ({ intent: intent as ToolIntent, score }));

  const primary = sortedIntents[0]?.intent || 'general';
  const primaryScore = sortedIntents[0]?.score || 0;
  const secondaryScore = sortedIntents[1]?.score || 0;
  const secondary = sortedIntents.slice(1, 3).map(s => s.intent);

  // Confidence: how dominant the primary intent is (0-1)
  const totalScore = sortedIntents.reduce((sum, s) => sum + s.score, 0);
  const confidence = totalScore > 0 ? primaryScore / totalScore : 0;

  // Classify message complexity
  let complexity: MessageComplexity = 'CONVERSATIONAL';

  if (TRIVIAL_PATTERNS.some(p => p.test(trimmedMessage))) {
    complexity = 'TRIVIAL';
  } else if (
    trimmedMessage.length <= 60 &&
    primaryScore >= 4 &&
    confidence >= 0.6 &&
    SIMPLE_ACTION_PATTERNS.some(p => p.test(trimmedMessage))
  ) {
    complexity = 'SIMPLE_ACTION';
  } else if (
    primary === 'analytics' ||
    ANALYTICAL_KEYWORDS.some(k => lowerMessage.includes(k)) ||
    (sortedIntents.length >= 3 && secondaryScore >= primaryScore * 0.7)
  ) {
    complexity = 'ANALYTICAL';
  }

  logger.debug('[ToolRouter] Intent classified', {
    message: message.substring(0, 100),
    primary,
    secondary,
    complexity,
    confidence: Math.round(confidence * 100),
  });

  return { primary, secondary, complexity, confidence };
}

// ============================================
// TOOL FILTERING
// ============================================

/**
 * Filter tools based on detected intent
 * Returns tools relevant to primary + secondary intents + general tools
 */
export function filterToolsByIntent(
  allTools: DynamicStructuredTool[],
  intent: { primary: ToolIntent; secondary: ToolIntent[] }
): DynamicStructuredTool[] {
  // Collect tool names for all relevant intents
  const relevantToolNames = new Set<string>();

  // Add primary intent tools
  TOOL_GROUPS[intent.primary].forEach(name => relevantToolNames.add(name));

  // Add secondary intent tools
  intent.secondary.forEach(secondaryIntent => {
    TOOL_GROUPS[secondaryIntent].forEach(name => relevantToolNames.add(name));
  });

  // Always include general + status tools
  TOOL_GROUPS.general.forEach(name => relevantToolNames.add(name));
  TOOL_GROUPS.status.forEach(name => relevantToolNames.add(name));

  // Filter tools
  const filteredTools = allTools.filter(tool => relevantToolNames.has(tool.name));

  logger.debug('[ToolRouter] Tools filtered', {
    totalTools: allTools.length,
    filteredCount: filteredTools.length,
    primaryIntent: intent.primary,
    secondaryIntents: intent.secondary,
    toolNames: filteredTools.map(t => t.name),
  });

  return filteredTools;
}

// ============================================
// TOOL CACHE
// ============================================

// Cache tools per user to avoid rebuilding on every request
const toolCache = new Map<string, { tools: DynamicStructuredTool[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function toolCacheKey(userId: string, contextSuffix?: string): string {
  return contextSuffix ? `${userId}|ctx:${contextSuffix}` : userId;
}

/**
 * Get cached tools for a user, or create new ones
 * @param contextSuffix When set (e.g. active life area id), bypasses sharing the default per-user cache so tool closures keep correct link targets.
 */
export function getCachedTools(
  userId: string,
  createFn: () => DynamicStructuredTool[],
  contextSuffix?: string
): DynamicStructuredTool[] {
  const key = toolCacheKey(userId, contextSuffix);
  const cached = toolCache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    logger.debug('[ToolRouter] Using cached tools', { userId, key, toolCount: cached.tools.length });
    return cached.tools;
  }

  try {
    const tools = createFn();
    toolCache.set(key, { tools, timestamp: now });
    logger.debug('[ToolRouter] Created and cached tools', { userId, key, toolCount: tools.length });
    return tools;
  } catch (error) {
    logger.error('[ToolRouter] CRITICAL: Failed to create tools', {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 500) : undefined,
    });
    // Return stale cache if available, otherwise empty array (chat still works, just no tools)
    return cached?.tools || [];
  }
}

/**
 * Clear cache for a specific user (e.g., after preference changes)
 * Removes default key and any `userId|ctx:*` variants.
 */
export function clearToolCache(userId?: string): void {
  if (userId) {
    for (const k of toolCache.keys()) {
      if (k === userId || k.startsWith(`${userId}|ctx:`)) {
        toolCache.delete(k);
      }
    }
  } else {
    toolCache.clear();
  }
}

// ============================================
// MAIN ROUTING FUNCTION
// ============================================

/**
 * Get tools for a user message
 * Uses intent classification + caching for optimal performance
 */
export function getToolsForMessage(
  userId: string,
  message: string,
  createAllTools: () => DynamicStructuredTool[],
  toolTurnContext?: ToolTurnContext
): DynamicStructuredTool[] {
  const cacheSuffix = toolTurnContext?.activeLifeAreaId
    ? `la:${toolTurnContext.activeLifeAreaId}`
    : undefined;
  const allTools = getCachedTools(userId, createAllTools, cacheSuffix);

  // Classify intent
  const intent = classifyIntent(message);

  // Filter tools by intent
  const tools = filterToolsByIntent(allTools, intent);

  logger.info('[ToolRouter] Tools selected for message', {
    userId,
    messagePreview: message.substring(0, 50),
    intent: intent.primary,
    toolCount: tools.length,
    reduction: `${allTools.length} → ${tools.length}`,
  });

  return tools;
}

// ============================================
// GRAPH ALERTS (per-user runtime alerts from reasoning graph)
// ============================================

const userGraphAlerts = new Map<string, Array<{ type: string; severity: string; message: string; relatedNodeId?: string }>>();

export function setGraphAlertsForUser(userId: string, alerts: Array<{ type: string; severity: string; message: string; relatedNodeId?: string }>): void {
  userGraphAlerts.set(userId, alerts);
}

export function getGraphAlertsForUser(userId: string): Array<{ type: string; severity: string; message: string; relatedNodeId?: string }> {
  return userGraphAlerts.get(userId) || [];
}

// ============================================
// SERVICE EXPORT
// ============================================

export const toolRouterService = {
  classifyIntent,
  filterToolsByIntent,
  getCachedTools,
  clearToolCache,
  getToolsForMessage,
  setGraphAlertsForUser,
  getGraphAlertsForUser,
  TOOL_GROUPS,
};
