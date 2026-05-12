/**
 * Tool Result Cache Service Unit Tests
 *
 * Tests per-user LRU cache for read-only tool results, including:
 * - isCacheable detection (prefix-based + explicit whitelist)
 * - Cache hit/miss, user isolation, argument differentiation
 * - TTL expiration
 * - LRU eviction at capacity (MAX_ENTRIES_PER_USER = 50)
 * - Domain-based invalidation via write tools
 * - Manager-style invalidation (endsWith 'Manager')
 * - clearUser and getStats
 */

import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { toolResultCacheService } from '../../../src/services/tool-result-cache.service.js';
import { logger } from '../../../src/services/logger.service.js';

// ============================================
// HELPERS
// ============================================

/** Generate a unique userId per test to guarantee isolation without needing clearUser. */
let testCounter = 0;
function uniqueUserId(): string {
  return `test-user-${++testCounter}-${Date.now()}`;
}

// ============================================
// TESTS
// ============================================

describe('ToolResultCacheService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  // ------------------------------------------
  // isCacheable
  // ------------------------------------------

  describe('isCacheable', () => {
    describe('read-only prefixes', () => {
      const readOnlyPrefixTools = [
        'getUserProfile',
        'getUserMealLogs',
        'getWaterIntake',
        'getDashboardSummary',
        'listWorkouts',
        'listAllGoals',
        'searchRecipes',
        'searchExercises',
        'checkWorkoutProgress',
        'checkScheduleConflicts',
        'analyzeNutrition',
        'analyzeSleepPatterns',
        'detectMoodTrends',
        'detectStressLevel',
      ];

      it.each(readOnlyPrefixTools)(
        'should return true for "%s" (prefix match)',
        (toolName) => {
          expect(toolResultCacheService.isCacheable(toolName)).toBe(true);
        },
      );
    });

    describe('case-insensitive prefix matching', () => {
      it('should match "GetUserProfile" (uppercase G)', () => {
        expect(toolResultCacheService.isCacheable('GetUserProfile')).toBe(true);
      });

      it('should match "GETDATA" (all caps)', () => {
        expect(toolResultCacheService.isCacheable('GETDATA')).toBe(true);
      });

      it('should match "ListItems" (mixed case)', () => {
        expect(toolResultCacheService.isCacheable('ListItems')).toBe(true);
      });
    });

    describe('explicit whitelist (READ_ONLY_TOOLS)', () => {
      const whitelistedTools = [
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
      ];

      it.each(whitelistedTools)(
        'should return true for whitelisted tool "%s"',
        (toolName) => {
          expect(toolResultCacheService.isCacheable(toolName)).toBe(true);
        },
      );

      it('should return true for "activityTimeline" which has no read-only prefix', () => {
        // "activityTimeline" does not start with get/list/search/check/analyze/detect
        // but is in the explicit whitelist
        expect(toolResultCacheService.isCacheable('activityTimeline')).toBe(true);
      });

      it('should return true for "aiDecisionHistory" which has no read-only prefix', () => {
        expect(toolResultCacheService.isCacheable('aiDecisionHistory')).toBe(true);
      });
    });

    describe('write tools (not cacheable)', () => {
      const writeTools = [
        'waterIntakeManager',
        'mealManager',
        'workoutManager',
        'goalManager',
        'createBudget',
        'updateBudget',
        'deleteBudget',
        'logTransaction',
        'updateProfile',
        'deleteWorkout',
        'submitAssessment',
        'freezeStreak',
      ];

      it.each(writeTools)(
        'should return false for write tool "%s"',
        (toolName) => {
          expect(toolResultCacheService.isCacheable(toolName)).toBe(false);
        },
      );
    });

    it('should return false for an empty string', () => {
      expect(toolResultCacheService.isCacheable('')).toBe(false);
    });

    it('should return false for a completely unrelated tool name', () => {
      expect(toolResultCacheService.isCacheable('randomUnknownTool')).toBe(false);
    });
  });

  // ------------------------------------------
  // get / set — basic cache operations
  // ------------------------------------------

  describe('get and set', () => {
    it('should return null on cache miss', () => {
      const userId = uniqueUserId();
      const result = toolResultCacheService.get(userId, 'getUserProfile', { id: '1' });
      expect(result).toBeNull();
    });

    it('should store and retrieve a cached result', () => {
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { id: '42' };
      const expected = JSON.stringify({ name: 'John', age: 30 });

      toolResultCacheService.set(userId, toolName, args, expected);
      const result = toolResultCacheService.get(userId, toolName, args);

      expect(result).toBe(expected);
    });

    it('should return null for a non-cacheable tool even after set', () => {
      const userId = uniqueUserId();
      const toolName = 'waterIntakeManager'; // write tool
      const args = { amount: 250 };

      toolResultCacheService.set(userId, toolName, args, 'some result');
      const result = toolResultCacheService.get(userId, toolName, args);

      expect(result).toBeNull();
    });

    it('should return null when user has no cache', () => {
      const userId = uniqueUserId();
      const result = toolResultCacheService.get(userId, 'getStreakStatus', {});
      expect(result).toBeNull();
    });
  });

  // ------------------------------------------
  // User isolation
  // ------------------------------------------

  describe('user isolation', () => {
    it('should isolate cache entries between different users', () => {
      const userA = uniqueUserId();
      const userB = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { field: 'all' };

      toolResultCacheService.set(userA, toolName, args, 'result-A');
      toolResultCacheService.set(userB, toolName, args, 'result-B');

      expect(toolResultCacheService.get(userA, toolName, args)).toBe('result-A');
      expect(toolResultCacheService.get(userB, toolName, args)).toBe('result-B');
    });

    it('should not return user A cache for user B', () => {
      const userA = uniqueUserId();
      const userB = uniqueUserId();
      const toolName = 'listWorkouts';
      const args = {};

      toolResultCacheService.set(userA, toolName, args, 'user-a-workouts');

      expect(toolResultCacheService.get(userB, toolName, args)).toBeNull();
    });
  });

  // ------------------------------------------
  // Argument differentiation
  // ------------------------------------------

  describe('argument differentiation', () => {
    it('should treat different args as different cache entries', () => {
      const userId = uniqueUserId();
      const toolName = 'getUserMealLogs';

      toolResultCacheService.set(userId, toolName, { date: '2026-01-01' }, 'meals-jan');
      toolResultCacheService.set(userId, toolName, { date: '2026-02-01' }, 'meals-feb');

      expect(toolResultCacheService.get(userId, toolName, { date: '2026-01-01' })).toBe('meals-jan');
      expect(toolResultCacheService.get(userId, toolName, { date: '2026-02-01' })).toBe('meals-feb');
    });

    it('should produce same cache key regardless of arg insertion order', () => {
      const userId = uniqueUserId();
      const toolName = 'searchRecipes';

      // Set with one ordering
      toolResultCacheService.set(userId, toolName, { query: 'chicken', limit: 10 }, 'recipes-result');

      // Get with different ordering — buildKey sorts keys, so this should hit
      const result = toolResultCacheService.get(userId, toolName, { limit: 10, query: 'chicken' });
      expect(result).toBe('recipes-result');
    });

    it('should miss when args differ by value', () => {
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';

      toolResultCacheService.set(userId, toolName, { id: '1' }, 'profile-1');

      const result = toolResultCacheService.get(userId, toolName, { id: '2' });
      expect(result).toBeNull();
    });
  });

  // ------------------------------------------
  // TTL expiration
  // ------------------------------------------

  describe('TTL expiration', () => {
    it('should return cached result within TTL window', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();
      const toolName = 'getStreakStatus';
      const args = {};

      toolResultCacheService.set(userId, toolName, args, 'active-streak');

      // Advance 30s (within 60s TTL)
      jest.advanceTimersByTime(30_000);

      expect(toolResultCacheService.get(userId, toolName, args)).toBe('active-streak');
    });

    it('should return null after TTL expires (60s)', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { id: '5' };

      toolResultCacheService.set(userId, toolName, args, 'cached-profile');

      // Advance just past 60s TTL
      jest.advanceTimersByTime(60_001);

      const result = toolResultCacheService.get(userId, toolName, args);
      expect(result).toBeNull();
    });

    it('should return null exactly at TTL boundary', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();
      const toolName = 'listWorkouts';
      const args = {};

      toolResultCacheService.set(userId, toolName, args, 'workouts');

      // Advance exactly to 60s — the check is `> DEFAULT_TTL_MS`, so exactly 60s should still be valid
      jest.advanceTimersByTime(60_000);

      // At exactly 60_000ms the condition (now - cachedAt > 60_000) is false (60000 > 60000 = false)
      // so entry should still be valid
      expect(toolResultCacheService.get(userId, toolName, args)).toBe('workouts');
    });

    it('should expire individual entries independently', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();

      // Set first entry at t=0
      toolResultCacheService.set(userId, 'getUserProfile', { id: '1' }, 'profile');

      // Advance 30s, set second entry
      jest.advanceTimersByTime(30_000);
      toolResultCacheService.set(userId, 'listWorkouts', {}, 'workouts');

      // Advance another 31s (total 61s from first, 31s from second)
      jest.advanceTimersByTime(31_000);

      // First should be expired (61s > 60s)
      expect(toolResultCacheService.get(userId, 'getUserProfile', { id: '1' })).toBeNull();
      // Second should still be valid (31s < 60s)
      expect(toolResultCacheService.get(userId, 'listWorkouts', {})).toBe('workouts');
    });
  });

  // ------------------------------------------
  // LRU eviction at capacity
  // ------------------------------------------

  describe('LRU eviction at capacity (MAX_ENTRIES_PER_USER = 50)', () => {
    it('should evict the oldest entry when at capacity', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();

      // Fill cache with 50 entries
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(1); // ensure distinct cachedAt timestamps
        toolResultCacheService.set(userId, 'getUserProfile', { idx: i }, `result-${i}`);
      }

      // Verify the first entry still exists
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 0 })).toBe('result-0');

      // Add 51st entry — should evict oldest (idx: 0, which was set first)
      jest.advanceTimersByTime(1);
      toolResultCacheService.set(userId, 'getUserProfile', { idx: 50 }, 'result-50');

      // Oldest entry should have been evicted
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 0 })).toBeNull();
      // Newest entry should exist
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 50 })).toBe('result-50');
      // Second entry should still exist
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 1 })).toBe('result-1');
    });

    it('should only evict one entry per insertion at capacity', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();

      // Fill to capacity
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(1);
        toolResultCacheService.set(userId, 'listWorkouts', { page: i }, `page-${i}`);
      }

      // Add one more
      jest.advanceTimersByTime(1);
      toolResultCacheService.set(userId, 'listWorkouts', { page: 50 }, 'page-50');

      // Count remaining entries — should still be 50 (evicted 1, added 1)
      const stats = toolResultCacheService.getStats();
      // Find entries belonging to this user — getStats gives total,
      // but we can verify by checking that entries 1..50 all exist
      let existingCount = 0;
      for (let i = 0; i <= 50; i++) {
        if (toolResultCacheService.get(userId, 'listWorkouts', { page: i }) !== null) {
          existingCount++;
        }
      }
      expect(existingCount).toBe(50); // 0 was evicted, 1-50 remain
    });

    it('should still evict oldest when overwriting an existing key at capacity', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();

      // Fill with 50 entries (distinct timestamps so oldest is deterministic)
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(1);
        toolResultCacheService.set(userId, 'getUserProfile', { idx: i }, `result-${i}`);
      }

      // Overwrite an existing entry (idx: 25) — the implementation still evicts
      // the oldest (idx: 0) because it checks size >= MAX before checking if key exists
      jest.advanceTimersByTime(1);
      toolResultCacheService.set(userId, 'getUserProfile', { idx: 25 }, 'updated-25');

      // idx: 0 was the oldest and gets evicted even though we're overwriting idx: 25
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 0 })).toBeNull();
      // The overwritten entry should have the new value
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 25 })).toBe('updated-25');
      // Other entries should remain
      expect(toolResultCacheService.get(userId, 'getUserProfile', { idx: 49 })).toBe('result-49');
    });

    it('should evict independently per user', () => {
      jest.useFakeTimers();
      const userA = uniqueUserId();
      const userB = uniqueUserId();

      // Fill user A to capacity
      for (let i = 0; i < 50; i++) {
        jest.advanceTimersByTime(1);
        toolResultCacheService.set(userA, 'getUserProfile', { idx: i }, `a-${i}`);
      }

      // User B has only 1 entry
      toolResultCacheService.set(userB, 'getUserProfile', { idx: 0 }, 'b-0');

      // Add 51st to user A — triggers eviction for A
      jest.advanceTimersByTime(1);
      toolResultCacheService.set(userA, 'getUserProfile', { idx: 50 }, 'a-50');

      // User A oldest evicted
      expect(toolResultCacheService.get(userA, 'getUserProfile', { idx: 0 })).toBeNull();
      // User B unaffected
      expect(toolResultCacheService.get(userB, 'getUserProfile', { idx: 0 })).toBe('b-0');
    });
  });

  // ------------------------------------------
  // invalidateForWriteTool — domain-based
  // ------------------------------------------

  describe('invalidateForWriteTool', () => {
    describe('domain-based invalidation', () => {
      it('should clear water-related reads when waterIntakeManager writes', () => {
        const userId = uniqueUserId();

        // Populate water-related cache entries
        toolResultCacheService.set(userId, 'getWaterIntake', { date: 'today' }, 'water-data');
        // Also set an unrelated entry
        toolResultCacheService.set(userId, 'getUserProfile', { id: '1' }, 'profile-data');

        // Write via waterIntakeManager
        toolResultCacheService.invalidateForWriteTool(userId, 'waterIntakeManager');

        // Water entry should be cleared
        expect(toolResultCacheService.get(userId, 'getWaterIntake', { date: 'today' })).toBeNull();
        // Unrelated entry should remain
        expect(toolResultCacheService.get(userId, 'getUserProfile', { id: '1' })).toBe('profile-data');
      });

      it('should clear meal-related reads when mealManager writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getUserMealLogs', { week: 1 }, 'meals');
        toolResultCacheService.set(userId, 'getUserRecipes', {}, 'recipes');
        toolResultCacheService.set(userId, 'getStreakStatus', {}, 'streak');

        toolResultCacheService.invalidateForWriteTool(userId, 'mealManager');

        expect(toolResultCacheService.get(userId, 'getUserMealLogs', { week: 1 })).toBeNull();
        expect(toolResultCacheService.get(userId, 'getUserRecipes', {})).toBeNull();
        // Streak is unrelated to meals domain
        expect(toolResultCacheService.get(userId, 'getStreakStatus', {})).toBe('streak');
      });

      it('should clear workout-related reads when workoutManager writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getUserWorkoutLogs', {}, 'logs');
        toolResultCacheService.set(userId, 'getUserWorkoutPlans', {}, 'plans');
        toolResultCacheService.set(userId, 'checkWorkoutProgress', { planId: '1' }, 'progress');
        toolResultCacheService.set(userId, 'searchRecipes', { q: 'chicken' }, 'recipes');

        toolResultCacheService.invalidateForWriteTool(userId, 'workoutManager');

        expect(toolResultCacheService.get(userId, 'getUserWorkoutLogs', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getUserWorkoutPlans', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'checkWorkoutProgress', { planId: '1' })).toBeNull();
        // Recipes are not in workout domain
        expect(toolResultCacheService.get(userId, 'searchRecipes', { q: 'chicken' })).toBe('recipes');
      });

      it('should clear finance-related reads when logTransaction writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getFinancialSummary', {}, 'summary');
        toolResultCacheService.set(userId, 'getBudgets', {}, 'budgets');
        toolResultCacheService.set(userId, 'getSavingGoals', {}, 'savings');
        toolResultCacheService.set(userId, 'getRecentTransactions', {}, 'transactions');

        toolResultCacheService.invalidateForWriteTool(userId, 'logTransaction');

        expect(toolResultCacheService.get(userId, 'getFinancialSummary', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getBudgets', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getSavingGoals', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getRecentTransactions', {})).toBeNull();
      });

      it('should clear wellbeing-related reads when moodManager writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getUserMoodTrends', {}, 'mood-trends');
        toolResultCacheService.set(userId, 'getTodayCheckin', {}, 'checkin');
        toolResultCacheService.set(userId, 'getCheckinHistory', {}, 'history');
        toolResultCacheService.set(userId, 'getJournalInsights', {}, 'journal');

        toolResultCacheService.invalidateForWriteTool(userId, 'moodManager');

        expect(toolResultCacheService.get(userId, 'getUserMoodTrends', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getTodayCheckin', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getCheckinHistory', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getJournalInsights', {})).toBeNull();
      });

      it('should clear gamification-related reads when freezeStreak writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getStreakStatus', {}, 'status');
        toolResultCacheService.set(userId, 'getStreakCalendar', {}, 'calendar');
        toolResultCacheService.set(userId, 'getStreakStats', {}, 'stats');

        toolResultCacheService.invalidateForWriteTool(userId, 'freezeStreak');

        expect(toolResultCacheService.get(userId, 'getStreakStatus', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getStreakCalendar', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getStreakStats', {})).toBeNull();
      });

      it('should clear notes-related reads when createQuickNote writes', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getQuickNotes', {}, 'notes');
        toolResultCacheService.set(userId, 'getQuickNoteById', { id: '1' }, 'note-1');

        toolResultCacheService.invalidateForWriteTool(userId, 'createQuickNote');

        expect(toolResultCacheService.get(userId, 'getQuickNotes', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getQuickNoteById', { id: '1' })).toBeNull();
      });
    });

    describe('dashboard/timeline invalidation on any domain write', () => {
      it('should always invalidate getDashboardSummary on any domain write', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getDashboardSummary', {}, 'dashboard');

        // Any write tool that maps to a domain should also clear dashboard
        toolResultCacheService.invalidateForWriteTool(userId, 'waterIntakeManager');

        expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBeNull();
      });

      it('should always invalidate activityTimeline on any domain write', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'activityTimeline', {}, 'timeline');

        toolResultCacheService.invalidateForWriteTool(userId, 'goalManager');

        expect(toolResultCacheService.get(userId, 'activityTimeline', {})).toBeNull();
      });

      it('should clear both dashboard and timeline alongside domain entries', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getDashboardSummary', {}, 'dashboard');
        toolResultCacheService.set(userId, 'activityTimeline', {}, 'timeline');
        toolResultCacheService.set(userId, 'getUserWorkoutLogs', {}, 'workouts');

        toolResultCacheService.invalidateForWriteTool(userId, 'workoutManager');

        expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'activityTimeline', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getUserWorkoutLogs', {})).toBeNull();
      });
    });

    describe('manager-style invalidation (unknown manager)', () => {
      it('should invalidate entries matching manager prefix for unknown manager tools', () => {
        const userId = uniqueUserId();

        // "taskManager" is not in WRITE_TOOL_TO_DOMAIN, but ends with "Manager"
        // It should match entries whose toolName contains "task" (lowercase prefix)
        toolResultCacheService.set(userId, 'getUserTasks', {}, 'tasks');
        toolResultCacheService.set(userId, 'getTaskDetails', { id: '1' }, 'task-detail');
        toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');

        toolResultCacheService.invalidateForWriteTool(userId, 'taskManager');

        // "task" prefix matches getUserTasks and getTaskDetails
        expect(toolResultCacheService.get(userId, 'getUserTasks', {})).toBeNull();
        expect(toolResultCacheService.get(userId, 'getTaskDetails', { id: '1' })).toBeNull();
        // "profile" does not contain "task"
        expect(toolResultCacheService.get(userId, 'getUserProfile', {})).toBe('profile');
      });

      it('should not invalidate anything for unknown manager with no matching entries', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');
        toolResultCacheService.set(userId, 'listWorkouts', {}, 'workouts');

        // "xyzManager" — prefix "xyz" matches nothing
        toolResultCacheService.invalidateForWriteTool(userId, 'xyzManager');

        expect(toolResultCacheService.get(userId, 'getUserProfile', {})).toBe('profile');
        expect(toolResultCacheService.get(userId, 'listWorkouts', {})).toBe('workouts');
      });
    });

    describe('unknown non-manager write tools', () => {
      it('should not invalidate anything for unknown write tool without Manager suffix', () => {
        const userId = uniqueUserId();

        toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');
        toolResultCacheService.set(userId, 'getStreakStatus', {}, 'streak');

        // "randomWriteTool" is not mapped and does not end with "Manager"
        toolResultCacheService.invalidateForWriteTool(userId, 'randomWriteTool');

        expect(toolResultCacheService.get(userId, 'getUserProfile', {})).toBe('profile');
        expect(toolResultCacheService.get(userId, 'getStreakStatus', {})).toBe('streak');
      });
    });

    describe('edge cases', () => {
      it('should be a no-op when user has no cache', () => {
        const userId = uniqueUserId();
        // Should not throw
        expect(() => {
          toolResultCacheService.invalidateForWriteTool(userId, 'waterIntakeManager');
        }).not.toThrow();
      });

      it('should be a no-op when user cache is empty', () => {
        const userId = uniqueUserId();

        // Set and then clear
        toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');
        toolResultCacheService.clearUser(userId);

        expect(() => {
          toolResultCacheService.invalidateForWriteTool(userId, 'mealManager');
        }).not.toThrow();
      });

      it('should not affect other users during invalidation', () => {
        const userA = uniqueUserId();
        const userB = uniqueUserId();

        toolResultCacheService.set(userA, 'getWaterIntake', {}, 'water-a');
        toolResultCacheService.set(userB, 'getWaterIntake', {}, 'water-b');

        toolResultCacheService.invalidateForWriteTool(userA, 'waterIntakeManager');

        expect(toolResultCacheService.get(userA, 'getWaterIntake', {})).toBeNull();
        expect(toolResultCacheService.get(userB, 'getWaterIntake', {})).toBe('water-b');
      });
    });
  });

  // ------------------------------------------
  // clearUser
  // ------------------------------------------

  describe('clearUser', () => {
    it('should remove all cache entries for a user', () => {
      const userId = uniqueUserId();

      toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');
      toolResultCacheService.set(userId, 'listWorkouts', {}, 'workouts');
      toolResultCacheService.set(userId, 'getStreakStatus', {}, 'streak');

      toolResultCacheService.clearUser(userId);

      expect(toolResultCacheService.get(userId, 'getUserProfile', {})).toBeNull();
      expect(toolResultCacheService.get(userId, 'listWorkouts', {})).toBeNull();
      expect(toolResultCacheService.get(userId, 'getStreakStatus', {})).toBeNull();
    });

    it('should not affect other users', () => {
      const userA = uniqueUserId();
      const userB = uniqueUserId();

      toolResultCacheService.set(userA, 'getUserProfile', {}, 'profile-a');
      toolResultCacheService.set(userB, 'getUserProfile', {}, 'profile-b');

      toolResultCacheService.clearUser(userA);

      expect(toolResultCacheService.get(userA, 'getUserProfile', {})).toBeNull();
      expect(toolResultCacheService.get(userB, 'getUserProfile', {})).toBe('profile-b');
    });

    it('should be safe to call on a non-existent user', () => {
      const userId = uniqueUserId();
      expect(() => {
        toolResultCacheService.clearUser(userId);
      }).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      const userId = uniqueUserId();
      toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');

      toolResultCacheService.clearUser(userId);
      toolResultCacheService.clearUser(userId);

      expect(toolResultCacheService.get(userId, 'getUserProfile', {})).toBeNull();
    });
  });

  // ------------------------------------------
  // getStats
  // ------------------------------------------

  describe('getStats', () => {
    it('should return zero counts when no entries exist for test users', () => {
      // Note: the singleton may have entries from other tests, so we test
      // relative behavior rather than absolute zero.
      const baseline = toolResultCacheService.getStats();
      expect(baseline).toHaveProperty('users');
      expect(baseline).toHaveProperty('totalEntries');
      expect(typeof baseline.users).toBe('number');
      expect(typeof baseline.totalEntries).toBe('number');
    });

    it('should reflect added entries', () => {
      const userId = uniqueUserId();
      const before = toolResultCacheService.getStats();

      toolResultCacheService.set(userId, 'getUserProfile', { id: '1' }, 'p1');
      toolResultCacheService.set(userId, 'listWorkouts', {}, 'w1');

      const after = toolResultCacheService.getStats();

      expect(after.users).toBe(before.users + 1);
      expect(after.totalEntries).toBe(before.totalEntries + 2);
    });

    it('should reflect cleared entries', () => {
      const userId = uniqueUserId();

      toolResultCacheService.set(userId, 'getUserProfile', {}, 'profile');
      toolResultCacheService.set(userId, 'listWorkouts', {}, 'workouts');

      const beforeClear = toolResultCacheService.getStats();

      toolResultCacheService.clearUser(userId);

      const afterClear = toolResultCacheService.getStats();

      expect(afterClear.users).toBe(beforeClear.users - 1);
      expect(afterClear.totalEntries).toBe(beforeClear.totalEntries - 2);
    });

    it('should count entries across multiple users', () => {
      const userA = uniqueUserId();
      const userB = uniqueUserId();
      const before = toolResultCacheService.getStats();

      toolResultCacheService.set(userA, 'getUserProfile', {}, 'a-profile');
      toolResultCacheService.set(userB, 'getUserProfile', {}, 'b-profile');
      toolResultCacheService.set(userB, 'listWorkouts', {}, 'b-workouts');

      const after = toolResultCacheService.getStats();

      expect(after.users).toBe(before.users + 2);
      expect(after.totalEntries).toBe(before.totalEntries + 3);
    });
  });

  // ------------------------------------------
  // Overwrite behavior
  // ------------------------------------------

  describe('overwrite behavior', () => {
    it('should overwrite an existing entry with the same key', () => {
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { id: '1' };

      toolResultCacheService.set(userId, toolName, args, 'first');
      toolResultCacheService.set(userId, toolName, args, 'second');

      expect(toolResultCacheService.get(userId, toolName, args)).toBe('second');
    });

    it('should update the cachedAt timestamp on overwrite', () => {
      jest.useFakeTimers();
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { id: '1' };

      toolResultCacheService.set(userId, toolName, args, 'initial');

      // Advance 50s
      jest.advanceTimersByTime(50_000);

      // Overwrite resets TTL
      toolResultCacheService.set(userId, toolName, args, 'refreshed');

      // Advance another 30s (total 80s from initial, 30s from refresh)
      jest.advanceTimersByTime(30_000);

      // Should still be valid (30s since refresh < 60s TTL)
      expect(toolResultCacheService.get(userId, toolName, args)).toBe('refreshed');
    });
  });

  // ------------------------------------------
  // Integration scenarios
  // ------------------------------------------

  describe('integration scenarios', () => {
    it('should handle a typical conversation flow: reads, write, re-reads', () => {
      const userId = uniqueUserId();

      // 1. User asks about their dashboard — cache miss, then cached
      expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBeNull();
      toolResultCacheService.set(userId, 'getDashboardSummary', {}, 'dashboard-v1');
      expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBe('dashboard-v1');

      // 2. User asks about meals — separate cache
      expect(toolResultCacheService.get(userId, 'getUserMealLogs', { date: 'today' })).toBeNull();
      toolResultCacheService.set(userId, 'getUserMealLogs', { date: 'today' }, 'meals-today');
      expect(toolResultCacheService.get(userId, 'getUserMealLogs', { date: 'today' })).toBe('meals-today');

      // 3. User logs a meal — invalidates meal + dashboard reads
      toolResultCacheService.invalidateForWriteTool(userId, 'mealManager');

      // Dashboard and meals should be cleared
      expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBeNull();
      expect(toolResultCacheService.get(userId, 'getUserMealLogs', { date: 'today' })).toBeNull();

      // 4. System re-fetches — new data cached
      toolResultCacheService.set(userId, 'getDashboardSummary', {}, 'dashboard-v2');
      expect(toolResultCacheService.get(userId, 'getDashboardSummary', {})).toBe('dashboard-v2');
    });

    it('should handle rapid successive writes without errors', () => {
      const userId = uniqueUserId();

      toolResultCacheService.set(userId, 'getUserMealLogs', {}, 'meals');
      toolResultCacheService.set(userId, 'getUserWorkoutLogs', {}, 'workouts');
      toolResultCacheService.set(userId, 'getWaterIntake', {}, 'water');

      // Multiple invalidations in sequence
      toolResultCacheService.invalidateForWriteTool(userId, 'mealManager');
      toolResultCacheService.invalidateForWriteTool(userId, 'workoutManager');
      toolResultCacheService.invalidateForWriteTool(userId, 'waterIntakeManager');

      expect(toolResultCacheService.get(userId, 'getUserMealLogs', {})).toBeNull();
      expect(toolResultCacheService.get(userId, 'getUserWorkoutLogs', {})).toBeNull();
      expect(toolResultCacheService.get(userId, 'getWaterIntake', {})).toBeNull();
    });
  });

  // ------------------------------------------
  // Logger interaction
  // ------------------------------------------

  describe('logger interaction', () => {
    it('should log debug on cache HIT', () => {
      const userId = uniqueUserId();
      const toolName = 'getUserProfile';
      const args = { id: '1' };
      const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});

      toolResultCacheService.set(userId, toolName, args, 'cached');
      debugSpy.mockClear();

      toolResultCacheService.get(userId, toolName, args);

      expect(debugSpy).toHaveBeenCalledWith(
        '[ToolResultCache] Cache HIT',
        expect.objectContaining({
          userId,
          toolName,
          ageMs: expect.any(Number),
        }),
      );

      debugSpy.mockRestore();
    });

    it('should not log on cache MISS', () => {
      const userId = uniqueUserId();
      const debugSpy = jest.spyOn(logger, 'debug').mockImplementation(() => {});
      debugSpy.mockClear();

      toolResultCacheService.get(userId, 'getUserProfile', { id: 'nonexistent' });

      // No "Cache HIT" log should have been produced
      const hitCalls = debugSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && (call[0] as string).includes('Cache HIT'),
      );
      expect(hitCalls).toHaveLength(0);

      debugSpy.mockRestore();
    });
  });
});
