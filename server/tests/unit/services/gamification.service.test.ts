/**
 * Gamification Service Unit Tests
 *
 * Tests for calculateLevel, calculateStreakMultiplier, awardXP, getUserStats,
 * getXPHistory, awardWorkoutXP, checkDailyCompletion, getLeaderboard, getUserRank.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockPoolQuery = jest.fn<any>();
const mockClientQuery = jest.fn<any>();
const mockClientRelease = jest.fn();
const mockConnect = jest.fn<any>().mockResolvedValue({
  query: mockClientQuery,
  release: mockClientRelease,
});

const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  pool: { query: mockPoolQuery, connect: mockConnect, end: jest.fn() },
  query: mockPoolQuery,
  transaction: jest.fn(),
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockPoolQuery,
  transaction: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// Mock streak.service to prevent dynamic import side effects
jest.unstable_mockModule('../../../src/services/streak.service.js', () => ({
  streakService: {
    recordActivity: jest.fn().mockResolvedValue({}),
  },
}));

// ============================================
// IMPORTS
// ============================================

const { gamificationService, XP_VALUES } = await import('../../../src/services/gamification.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_ID = 'user-uuid-1';

// ============================================
// TESTS
// ============================================

describe('GamificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish default implementations after resetMocks clears them
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
  });

  // ------------------------------------------
  // calculateLevel (pure function)
  // ------------------------------------------
  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      expect(gamificationService.calculateLevel(0)).toBe(1);
    });

    it('returns level 1 for 499 XP', () => {
      expect(gamificationService.calculateLevel(499)).toBe(1);
    });

    it('returns level 2 for 500 XP', () => {
      expect(gamificationService.calculateLevel(500)).toBe(2);
    });

    it('returns level 3 for 1000 XP', () => {
      expect(gamificationService.calculateLevel(1000)).toBe(3);
    });

    it('returns level 11 for 5000 XP', () => {
      expect(gamificationService.calculateLevel(5000)).toBe(11);
    });
  });

  // ------------------------------------------
  // calculateStreakMultiplier (pure function)
  // ------------------------------------------
  describe('calculateStreakMultiplier', () => {
    it('returns 1.0 at 0 streak days', () => {
      expect(gamificationService.calculateStreakMultiplier(0)).toBe(1.0);
    });

    it('returns 1.02 at 1 streak day', () => {
      expect(gamificationService.calculateStreakMultiplier(1)).toBeCloseTo(1.02);
    });

    it('returns 1.1 at 5 streak days', () => {
      expect(gamificationService.calculateStreakMultiplier(5)).toBeCloseTo(1.10);
    });

    it('returns 1.6 at 30 streak days (max)', () => {
      expect(gamificationService.calculateStreakMultiplier(30)).toBeCloseTo(1.60);
    });

    it('caps at 1.6 for streak days beyond 30', () => {
      expect(gamificationService.calculateStreakMultiplier(100)).toBeCloseTo(1.60);
    });
  });

  // ------------------------------------------
  // getLevelProgress (pure function)
  // ------------------------------------------
  describe('getLevelProgress', () => {
    it('returns correct progress for mid-level XP', () => {
      const progress = gamificationService.getLevelProgress(750);

      expect(progress.currentLevel).toBe(2);
      expect(progress.currentXP).toBe(750);
      expect(progress.xpForCurrentLevel).toBe(500);
      expect(progress.xpForNextLevel).toBe(1000);
      expect(progress.progressPercent).toBe(50);
    });
  });

  // ------------------------------------------
  // awardXP
  // ------------------------------------------
  describe('awardXP', () => {
    it('inserts XP transaction and updates user total_xp', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 100, current_level: 1, current_streak: 5 }])) // SELECT user
        .mockResolvedValueOnce(pgResult([])) // UPDATE users
        .mockResolvedValueOnce(pgResult([])) // INSERT xp_transaction
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardXP(USER_ID, 'workout', 25);

      expect(result.baseXP).toBe(25);
      expect(result.newTotal).toBeGreaterThan(100);
      expect(result.leveledUp).toBe(false);
    });

    it('applies streak multiplier for eligible action types', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 0, current_level: 1, current_streak: 10 }])) // user with 10-day streak
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardXP(USER_ID, 'workout', 25);

      // 10 days streak = 1.2 multiplier, 25 * 1.2 = 30
      expect(result.multiplier).toBeCloseTo(1.20);
      expect(result.xpEarned).toBe(30);
    });

    it('does NOT apply multiplier for streak_bonus source type', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 0, current_level: 1, current_streak: 10 }]))
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardXP(USER_ID, 'streak_bonus', 100);

      expect(result.multiplier).toBe(1.0);
      expect(result.xpEarned).toBe(100);
    });

    it('detects level up correctly', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 480, current_level: 1, current_streak: 0 }]))
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardXP(USER_ID, 'daily_complete', 50);

      // 480 + 50 = 530, level = floor(530/500) + 1 = 2
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.previousLevel).toBe(1);
    });

    it('throws when user not found', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([])); // SELECT (empty)

      await expect(
        gamificationService.awardXP('nonexistent', 'workout', 25)
      ).rejects.toThrow('User not found');
    });
  });

  // ------------------------------------------
  // getUserStats
  // ------------------------------------------
  describe('getUserStats', () => {
    it('returns stats from DB', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([{
        total_xp: 1500,
        current_level: 4,
        current_streak: 7,
        longest_streak: 14,
        last_activity_date: new Date('2026-04-20'),
      }]));

      const stats = await gamificationService.getUserStats(USER_ID);

      expect(stats.totalXP).toBe(1500);
      expect(stats.currentLevel).toBe(4);
      expect(stats.currentStreak).toBe(7);
      expect(stats.longestStreak).toBe(14);
      expect(stats.levelProgress.currentLevel).toBe(4);
    });

    it('returns default stats when user not found', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([]));

      const stats = await gamificationService.getUserStats('nonexistent');

      expect(stats.totalXP).toBe(0);
      expect(stats.currentLevel).toBe(1);
      expect(stats.currentStreak).toBe(0);
    });
  });

  // ------------------------------------------
  // awardWorkoutXP
  // ------------------------------------------
  describe('awardWorkoutXP', () => {
    it('applies completion rate multiplier to base workout XP', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 100, current_level: 1, current_streak: 0 }]))
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardWorkoutXP(USER_ID, 'workout-1', 0.5);

      // XP_VALUES.workout = 25, 25 * 0.5 = 13 (rounded)
      expect(result.baseXP).toBe(13);
    });

    it('uses full XP when completion rate is 1.0 (default)', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 100, current_level: 1, current_streak: 0 }]))
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.awardWorkoutXP(USER_ID, 'workout-1');

      expect(result.baseXP).toBe(XP_VALUES.workout);
    });
  });

  // ------------------------------------------
  // checkDailyCompletion
  // ------------------------------------------
  describe('checkDailyCompletion', () => {
    it('returns allComplete true when all workouts done and water goal achieved', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([{ workouts_done: '3', workouts_total: '3', water_done: true }]))
        // Check if bonus already awarded
        .mockResolvedValueOnce(pgResult([]));

      // awardDailyCompleteXP triggers awardXP → pool.connect
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 200, current_level: 1, current_streak: 0 }]))
        .mockResolvedValueOnce(pgResult([])) // UPDATE
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await gamificationService.checkDailyCompletion(USER_ID);

      expect(result.allComplete).toBe(true);
      expect(result.bonusAwarded).toBe(true);
    });

    it('returns allComplete false when workouts are partial', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([{
        workouts_done: '1',
        workouts_total: '3',
        water_done: true,
      }]));

      const result = await gamificationService.checkDailyCompletion(USER_ID);

      expect(result.allComplete).toBe(false);
      expect(result.bonusAwarded).toBe(false);
    });

    it('does not award bonus if already awarded today', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([{ workouts_done: '2', workouts_total: '2', water_done: true }]))
        .mockResolvedValueOnce(pgResult([{ id: 'existing-bonus' }])); // Already awarded

      const result = await gamificationService.checkDailyCompletion(USER_ID);

      expect(result.allComplete).toBe(true);
      expect(result.bonusAwarded).toBe(false);
    });
  });

  // ------------------------------------------
  // getLeaderboard
  // ------------------------------------------
  describe('getLeaderboard', () => {
    it('returns ranked list of users by XP', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([
        { id: 'u1', name: 'Alice', email: 'a@test.com', total_xp: 2000, current_level: 5, current_streak: 10, rank: '1' },
        { id: 'u2', name: null, email: 'b@test.com', total_xp: 1500, current_level: 4, current_streak: 3, rank: '2' },
      ]));

      const result = await gamificationService.getLeaderboard(10);

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('Alice');
      expect(result[0].rank).toBe(1);
      expect(result[1].displayName).toBe('b'); // email prefix fallback
    });
  });

  // ------------------------------------------
  // getUserRank
  // ------------------------------------------
  describe('getUserRank', () => {
    it('returns rank number for user with XP', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([{ rank: '5' }]));

      const rank = await gamificationService.getUserRank(USER_ID);

      expect(rank).toBe(5);
    });

    it('returns last rank when user has no XP', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // no rank
        .mockResolvedValueOnce(pgResult([{ rank: '42' }])); // total users + 1

      const rank = await gamificationService.getUserRank(USER_ID);

      expect(rank).toBe(42);
    });
  });

  // ------------------------------------------
  // getXPHistory
  // ------------------------------------------
  describe('getXPHistory', () => {
    it('returns paginated transaction history', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([{ count: '50' }])) // total count
        .mockResolvedValueOnce(pgResult([
          {
            id: 'tx1',
            xp_amount: 25,
            source_type: 'workout',
            description: 'Workout completed',
            multiplier: 1.1,
            total_after: 125,
            created_at: new Date('2026-04-20'),
          },
        ]));

      const result = await gamificationService.getXPHistory(USER_ID, 20, 0);

      expect(result.total).toBe(50);
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].xpAmount).toBe(25);
    });
  });
});
