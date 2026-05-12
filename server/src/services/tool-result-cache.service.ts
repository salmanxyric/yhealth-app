/**
 * @file Tool Result Cache Service
 * @description Per-user LRU cache for read-only tool results.
 * Read-only tools (get_*, list_*, search_*, getUserXxx) are cached for 60s.
 * Write tools (create/update/delete) invalidate relevant cache entries.
 *
 * Saves 500-2000ms for repeated queries within a conversation session.
 */

import { logger } from './logger.service.js';

// ============================================
// TYPES
// ============================================

interface CacheEntry {
  result: string;
  cachedAt: number;
  toolName: string;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_TTL_MS = 60_000; // 60s for read-only tools
const MAX_ENTRIES_PER_USER = 50;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Purge expired every 5 min

// Tool name prefixes that indicate read-only operations (safe to cache)
const READ_ONLY_PREFIXES = [
  'get', 'list', 'search', 'check', 'analyze', 'detect',
];

// Tool names that are always read-only (even without prefix match)
const READ_ONLY_TOOLS = new Set([
  'getDashboardSummary',
  'activityTimeline',
  'aiDecisionHistory',
  'getStreakStatus',
  'getStreakCalendar',
  'getStreakLeaderboard',
  'getStreakStats',
  'getTodayCheckin',
  'getCheckinHistory',
  'getCheckinStreak',
  'getJournalInsights',
]);

// Tool name patterns indicating write operations — invalidate related cache entries
const WRITE_TOOL_DOMAINS: Record<string, string[]> = {
  water: ['waterIntakeManager', 'addWaterEntry'],
  meals: ['mealManager', 'recipeManager', 'dietPlanManager'],
  workouts: ['workoutManager'],
  goals: ['goalManager'],
  schedules: ['scheduleManager'],
  wellbeing: ['moodManager', 'stressManager', 'journalManager', 'energyManager', 'habitManager', 'sleepManager'],
  progress: ['progressManager'],
  finance: ['logTransaction', 'updateTransaction', 'deleteTransaction', 'createBudget', 'updateBudget', 'deleteBudget', 'createSavingGoal', 'updateSavingGoal', 'deleteSavingGoal'],
  notes: ['createQuickNote', 'updateQuickNote', 'deleteQuickNote'],
  shopping: ['createShoppingListItem', 'updateShoppingListItem', 'deleteShoppingListItem'],
  reminders: ['createScheduledReminder', 'updateScheduledReminder', 'deleteScheduledReminder'],
  gamification: ['gamificationManager', 'freezeStreak'],
  competitions: ['competitionManager'],
  personal: ['personalContextManager', 'medicationManager'],
};

// Reverse map: write tool name → domain
const WRITE_TOOL_TO_DOMAIN = new Map<string, string>();
for (const [domain, tools] of Object.entries(WRITE_TOOL_DOMAINS)) {
  for (const tool of tools) {
    WRITE_TOOL_TO_DOMAIN.set(tool, domain);
  }
}

// Domain → related read tool prefixes (for targeted invalidation)
const DOMAIN_READ_PREFIXES: Record<string, string[]> = {
  water: ['getWaterIntake', 'waterIntake'],
  meals: ['getUserMealLogs', 'getUserRecipes', 'getUserDietPlans', 'getUserActivePlans', 'meal'],
  workouts: ['getUserWorkoutLogs', 'getUserWorkoutPlans', 'getUserActivePlans', 'checkWorkoutProgress', 'workout'],
  goals: ['getUserGoals', 'getUserActivePlans', 'goal'],
  schedules: ['getUserSchedules', 'getScheduleByDate', 'getUserTasks', 'checkScheduleConflicts', 'schedule'],
  wellbeing: ['getUserMoodTrends', 'getUserActivityLogsWithMood', 'getTodayCheckin', 'getCheckinHistory', 'getCheckinStreak', 'getJournalInsights', 'mood', 'stress', 'journal', 'energy', 'habit', 'sleep'],
  progress: ['getUserProgress', 'progress'],
  finance: ['getFinancialSummary', 'getMonthlySummary', 'getSpendingByCategory', 'getSpendingTrends', 'getMonthComparison', 'getFinancialForecast', 'getFinancialReport', 'getBudgets', 'getBudgetAlerts', 'getSavingGoals', 'getRecentTransactions', 'financial', 'spending', 'budget', 'saving'],
  notes: ['getQuickNotes', 'getQuickNoteById', 'note'],
  shopping: ['getShoppingListItems', 'shopping'],
  reminders: ['getScheduledReminders', 'reminder'],
  gamification: ['getStreakStatus', 'getStreakCalendar', 'getStreakLeaderboard', 'getStreakStats', 'gamification', 'streak'],
  competitions: ['competition'],
  personal: ['getUserProfile', 'getUserPreferences', 'personal'],
};

// ============================================
// SERVICE
// ============================================

class ToolResultCacheService {
  // userId → (cacheKey → CacheEntry)
  private cache = new Map<string, Map<string, CacheEntry>>();

  constructor() {
    setInterval(() => this.purgeExpired(), CLEANUP_INTERVAL_MS);
  }

  /**
   * Check if a tool is cacheable (read-only).
   */
  isCacheable(toolName: string): boolean {
    if (READ_ONLY_TOOLS.has(toolName)) return true;
    const lowerName = toolName.toLowerCase();
    return READ_ONLY_PREFIXES.some(prefix => lowerName.startsWith(prefix));
  }

  /**
   * Build a cache key from tool name and args.
   */
  private buildKey(toolName: string, args: Record<string, unknown>): string {
    const sortedArgs = JSON.stringify(args, Object.keys(args).sort());
    return `${toolName}:${sortedArgs}`;
  }

  /**
   * Get a cached result for a tool call.
   * Returns null on miss or expired entry.
   */
  get(userId: string, toolName: string, args: Record<string, unknown>): string | null {
    if (!this.isCacheable(toolName)) return null;

    const userCache = this.cache.get(userId);
    if (!userCache) return null;

    const key = this.buildKey(toolName, args);
    const entry = userCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > DEFAULT_TTL_MS) {
      userCache.delete(key);
      return null;
    }

    logger.debug('[ToolResultCache] Cache HIT', { userId, toolName, ageMs: Date.now() - entry.cachedAt });
    return entry.result;
  }

  /**
   * Store a tool result in the cache.
   */
  set(userId: string, toolName: string, args: Record<string, unknown>, result: string): void {
    if (!this.isCacheable(toolName)) return;

    let userCache = this.cache.get(userId);
    if (!userCache) {
      userCache = new Map();
      this.cache.set(userId, userCache);
    }

    // Evict oldest if at capacity
    if (userCache.size >= MAX_ENTRIES_PER_USER) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of userCache) {
        if (v.cachedAt < oldestTime) {
          oldestTime = v.cachedAt;
          oldestKey = k;
        }
      }
      if (oldestKey) userCache.delete(oldestKey);
    }

    const key = this.buildKey(toolName, args);
    userCache.set(key, { result, cachedAt: Date.now(), toolName });
  }

  /**
   * Invalidate cache entries when a write tool executes.
   * Uses domain mapping to only clear related read tools.
   */
  invalidateForWriteTool(userId: string, writeToolName: string): void {
    const userCache = this.cache.get(userId);
    if (!userCache || userCache.size === 0) return;

    const domain = WRITE_TOOL_TO_DOMAIN.get(writeToolName);
    if (!domain) {
      // Unknown write tool — invalidate everything for safety (manager-style tools)
      if (writeToolName.endsWith('Manager')) {
        const managerPrefix = writeToolName.replace('Manager', '').toLowerCase();
        let cleared = 0;
        for (const [key, entry] of userCache) {
          if (entry.toolName.toLowerCase().includes(managerPrefix)) {
            userCache.delete(key);
            cleared++;
          }
        }
        if (cleared > 0) {
          logger.debug('[ToolResultCache] Invalidated by manager tool', { userId, writeToolName, cleared });
        }
      }
      return;
    }

    const readPrefixes = DOMAIN_READ_PREFIXES[domain] || [];
    let cleared = 0;
    for (const [key, entry] of userCache) {
      const entryLower = entry.toolName.toLowerCase();
      if (readPrefixes.some(prefix => entry.toolName.startsWith(prefix) || entryLower.includes(prefix.toLowerCase()))) {
        userCache.delete(key);
        cleared++;
      }
    }

    // Also invalidate dashboard/timeline summaries on any write
    for (const [key, entry] of userCache) {
      if (entry.toolName === 'getDashboardSummary' || entry.toolName === 'activityTimeline') {
        userCache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.debug('[ToolResultCache] Invalidated by write', { userId, writeToolName, domain, cleared });
    }
  }

  /**
   * Clear all cache for a user.
   */
  clearUser(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Purge expired entries across all users.
   */
  private purgeExpired(): void {
    const now = Date.now();
    let purged = 0;
    for (const [userId, userCache] of this.cache) {
      for (const [key, entry] of userCache) {
        if (now - entry.cachedAt > DEFAULT_TTL_MS) {
          userCache.delete(key);
          purged++;
        }
      }
      if (userCache.size === 0) this.cache.delete(userId);
    }
    if (purged > 0) {
      logger.debug('[ToolResultCache] Purged expired entries', { purged, usersRemaining: this.cache.size });
    }
  }

  /**
   * Get cache stats for monitoring.
   */
  getStats(): { users: number; totalEntries: number } {
    let totalEntries = 0;
    for (const userCache of this.cache.values()) {
      totalEntries += userCache.size;
    }
    return { users: this.cache.size, totalEntries };
  }
}

export const toolResultCacheService = new ToolResultCacheService();
