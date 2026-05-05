/**
 * Streak Service Unit Tests
 *
 * Tests for recordActivity, getStreakStatus, purchaseFreeze, applyFreeze,
 * initializeUserStreak, getCalendar, getStreakLeaderboard, getStats,
 * compareWithFriend.
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
const mockAwardXP = jest.fn<any>().mockResolvedValue({ xpEarned: 100 });
const mockCalculateLevel = jest.fn<any>().mockReturnValue(1);
const mockRedisGet = jest.fn<any>().mockResolvedValue(null);
const mockRedisSet = jest.fn<any>().mockResolvedValue(undefined);
const mockRedisDelete = jest.fn<any>().mockResolvedValue(undefined);
const mockEmitToUser = jest.fn();

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

jest.unstable_mockModule('../../../src/services/gamification.service.js', () => ({
  gamificationService: {
    awardXP: mockAwardXP,
    calculateLevel: mockCalculateLevel,
  },
}));

jest.unstable_mockModule('../../../src/services/redis-cache.service.js', () => ({
  redisCacheService: {
    get: mockRedisGet,
    set: mockRedisSet,
    delete: mockRedisDelete,
  },
}));

jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: mockEmitToUser,
  },
}));

// ============================================
// IMPORTS
// ============================================

const { streakService } = await import('../../../src/services/streak.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_ID = 'user-uuid-1';
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'UTC' });

function makeStreakRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'streak-row-1',
    user_id: USER_ID,
    current_streak: 5,
    longest_streak: 10,
    freezes_available: 1,
    freezes_used_total: 0,
    last_activity_date: null,
    streak_started_at: '2026-04-20',
    total_active_days: 5,
    timezone: 'UTC',
    last_freeze_date: null,
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('StreakService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish default implementations after resetMocks clears them
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockClientRelease,
    });
    mockRedisGet.mockResolvedValue(null);
    mockRedisSet.mockResolvedValue(undefined);
    mockRedisDelete.mockResolvedValue(undefined);
    mockAwardXP.mockResolvedValue({ xpEarned: 100 });
    mockCalculateLevel.mockReturnValue(1);
  });

  // ------------------------------------------
  // recordActivity
  // ------------------------------------------
  describe('recordActivity', () => {
    it('creates activity log, increments streak on first daily activity (consecutive day)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'UTC' });

      const row = makeStreakRow({ last_activity_date: yesterdayStr, current_streak: 5, longest_streak: 10 });

      // Setup client query responses in order:
      // 1. BEGIN
      // 2. SELECT user_streaks FOR UPDATE
      // 3. INSERT activity log (succeeds)
      // 4. COUNT activities today
      // 5. UPDATE user_streaks
      // 6. UPDATE streak_activity_log streak_day
      // 7. SELECT streak_rewards (no milestone)
      // 8. UPDATE users
      // 9. COMMIT
      // 10+ buildStreakStatus queries (tiers, today activities)
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks
        .mockResolvedValueOnce(pgResult([])) // INSERT activity log
        .mockResolvedValueOnce(pgResult([{ count: '1' }])) // COUNT today
        .mockResolvedValueOnce(pgResult([])) // UPDATE user_streaks
        .mockResolvedValueOnce(pgResult([])) // UPDATE streak_activity_log
        .mockResolvedValueOnce(pgResult([])) // SELECT streak_rewards (no milestone)
        .mockResolvedValueOnce(pgResult([])) // UPDATE users
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      // buildStreakStatus calls pool.query (not client) for tiers + today activities
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // tiers
        .mockResolvedValueOnce(pgResult([{ activity_type: 'workout' }])); // today activities

      const result = await streakService.recordActivity(USER_ID, 'workout');

      expect(result.isFirstActivityToday).toBe(true);
      expect(result.streakIncremented).toBe(true);
      expect(result.streak.currentStreak).toBe(6);
      expect(mockEmitToUser).toHaveBeenCalledWith(USER_ID, 'streak:updated', expect.any(Object));
    });

    it('handles duplicate same-day activity (unique constraint violation)', async () => {
      const row = makeStreakRow({ last_activity_date: TODAY, current_streak: 5 });

      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks
        .mockRejectedValueOnce({ code: '23505' }) // INSERT duplicate → unique violation
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      // buildStreakStatus inside duplicate path uses client
      // tiers query + today activities
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // computeTierInfo
        .mockResolvedValueOnce(pgResult([])); // today activities

      const result = await streakService.recordActivity(USER_ID, 'workout');

      expect(result.isFirstActivityToday).toBe(false);
      expect(result.streakIncremented).toBe(false);
      expect(result.xpEarned).toBe(0);
    });

    it('resets streak to 1 when last activity was more than one day ago', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
      const twoDaysAgoStr = twoDaysAgo.toLocaleDateString('en-CA', { timeZone: 'UTC' });

      const row = makeStreakRow({ last_activity_date: twoDaysAgoStr, current_streak: 5 });

      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([row])) // SELECT
        .mockResolvedValueOnce(pgResult([])) // INSERT
        .mockResolvedValueOnce(pgResult([{ count: '1' }])) // COUNT
        .mockResolvedValueOnce(pgResult([])) // UPDATE user_streaks
        .mockResolvedValueOnce(pgResult([])) // UPDATE streak_activity_log
        .mockResolvedValueOnce(pgResult([])) // SELECT streak_rewards
        .mockResolvedValueOnce(pgResult([])) // UPDATE users
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // tiers
        .mockResolvedValueOnce(pgResult([])); // today activities

      const result = await streakService.recordActivity(USER_ID, 'workout');

      expect(result.streak.currentStreak).toBe(1);
      expect(result.streakIncremented).toBe(true);
    });

    it('auto-initializes streak row when none exists', async () => {
      const row = makeStreakRow({ current_streak: 0, last_activity_date: null });

      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([])) // SELECT user_streaks (empty)
        // initializeUserStreakWithClient calls
        .mockResolvedValueOnce(pgResult([])) // INSERT user_streaks
        .mockResolvedValueOnce(pgResult([])) // SELECT users for backfill
        // Re-select after init
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks again
        .mockResolvedValueOnce(pgResult([])) // INSERT activity log
        .mockResolvedValueOnce(pgResult([{ count: '1' }])) // COUNT
        .mockResolvedValueOnce(pgResult([])) // UPDATE user_streaks
        .mockResolvedValueOnce(pgResult([])) // UPDATE streak_activity_log
        .mockResolvedValueOnce(pgResult([])) // SELECT streak_rewards
        .mockResolvedValueOnce(pgResult([])) // UPDATE users
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // tiers
        .mockResolvedValueOnce(pgResult([])); // today activities

      const result = await streakService.recordActivity(USER_ID, 'workout');

      expect(result.streak.currentStreak).toBe(1);
    });
  });

  // ------------------------------------------
  // getStreakStatus
  // ------------------------------------------
  describe('getStreakStatus', () => {
    it('returns cached streak from Redis when available', async () => {
      const cached = {
        currentStreak: 7,
        longestStreak: 14,
        freezesAvailable: 2,
        lastActivityDate: TODAY,
        streakStartedAt: '2026-04-01',
        totalActiveDays: 30,
        tier: null,
        nextTier: null,
        tierProgress: 0,
        atRisk: false,
        todayActivities: ['workout'],
        timezone: 'UTC',
      };
      mockRedisGet.mockResolvedValueOnce(cached);

      const result = await streakService.getStreakStatus(USER_ID);

      expect(result.currentStreak).toBe(7);
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it('falls back to DB when Redis cache is empty', async () => {
      mockRedisGet.mockResolvedValueOnce(null);

      const row = makeStreakRow({ current_streak: 3, timezone: 'UTC' });
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks
        .mockResolvedValueOnce(pgResult([])) // tiers
        .mockResolvedValueOnce(pgResult([])); // today activities

      const result = await streakService.getStreakStatus(USER_ID);

      expect(result.currentStreak).toBe(3);
      expect(mockRedisSet).toHaveBeenCalled();
    });

    it('auto-initializes when no streak row exists in DB', async () => {
      mockRedisGet.mockResolvedValueOnce(null);

      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // SELECT (empty)
        // initializeUserStreak
        .mockResolvedValueOnce(pgResult([])) // INSERT user_streaks
        .mockResolvedValueOnce(pgResult([{ current_streak: 0, longest_streak: 0, last_activity_date: null }])) // SELECT users
        // re-fetch
        .mockResolvedValueOnce(pgResult([makeStreakRow({ current_streak: 0 })])) // SELECT after init
        .mockResolvedValueOnce(pgResult([])) // tiers
        .mockResolvedValueOnce(pgResult([])); // today activities

      const result = await streakService.getStreakStatus(USER_ID);

      expect(result.currentStreak).toBe(0);
    });
  });

  // ------------------------------------------
  // purchaseFreeze
  // ------------------------------------------
  describe('purchaseFreeze', () => {
    it('deducts XP and increments freeze count on success', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 500 }])) // SELECT users
        .mockResolvedValueOnce(pgResult([{ freezes_available: 1 }])) // SELECT user_streaks
        .mockResolvedValueOnce(pgResult([])) // UPDATE users (xp deduction)
        .mockResolvedValueOnce(pgResult([])) // UPDATE user_streaks (freeze++)
        .mockResolvedValueOnce(pgResult([])) // INSERT streak_freeze_log
        .mockResolvedValueOnce(pgResult([])) // INSERT user_xp_transactions
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await streakService.purchaseFreeze(USER_ID);

      expect(result.success).toBe(true);
      expect(result.freezesAvailable).toBe(2);
      expect(result.xpDeducted).toBe(200);
      expect(mockRedisDelete).toHaveBeenCalled();
    });

    it('rejects purchase when XP is insufficient', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 50 }])) // SELECT users (low XP)
        .mockResolvedValueOnce(pgResult([])); // ROLLBACK

      const result = await streakService.purchaseFreeze(USER_ID);

      expect(result.success).toBe(false);
      expect(result.xpDeducted).toBe(0);
    });

    it('rejects purchase when already at max freezes (3)', async () => {
      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([{ total_xp: 1000 }])) // SELECT users
        .mockResolvedValueOnce(pgResult([{ freezes_available: 3 }])) // SELECT user_streaks (max)
        .mockResolvedValueOnce(pgResult([])); // ROLLBACK

      const result = await streakService.purchaseFreeze(USER_ID);

      expect(result.success).toBe(false);
      expect(result.freezesAvailable).toBe(3);
    });
  });

  // ------------------------------------------
  // applyFreeze
  // ------------------------------------------
  describe('applyFreeze', () => {
    it('applies freeze and decrements freeze count', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const lastAct = yesterday.toLocaleDateString('en-CA', { timeZone: 'UTC' });

      const row = makeStreakRow({
        freezes_available: 2,
        current_streak: 0,
        last_activity_date: lastAct,
      });

      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks
        .mockResolvedValueOnce(pgResult([])) // SELECT existing freeze (none)
        .mockResolvedValueOnce(pgResult([{ streak_day: 5 }])) // SELECT last streak_day
        .mockResolvedValueOnce(pgResult([])) // UPDATE user_streaks
        .mockResolvedValueOnce(pgResult([])) // INSERT streak_freeze_log
        .mockResolvedValueOnce(pgResult([])) // UPDATE users
        .mockResolvedValueOnce(pgResult([])); // COMMIT

      const result = await streakService.applyFreeze(USER_ID);

      expect(result.success).toBe(true);
      expect(result.freezesRemaining).toBe(1);
    });

    it('rejects freeze when no freezes available', async () => {
      const row = makeStreakRow({ freezes_available: 0 });

      mockClientQuery
        .mockResolvedValueOnce(pgResult([])) // BEGIN
        .mockResolvedValueOnce(pgResult([row])) // SELECT user_streaks
        .mockResolvedValueOnce(pgResult([])); // ROLLBACK

      const result = await streakService.applyFreeze(USER_ID);

      expect(result.success).toBe(false);
      expect(result.freezesRemaining).toBe(0);
    });
  });

  // ------------------------------------------
  // initializeUserStreak
  // ------------------------------------------
  describe('initializeUserStreak', () => {
    it('creates streak record with ON CONFLICT DO NOTHING (idempotent)', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // INSERT user_streaks
        .mockResolvedValueOnce(pgResult([{ current_streak: 0, longest_streak: 0, last_activity_date: null }])); // SELECT users

      await streakService.initializeUserStreak(USER_ID, 'Africa/Nairobi');

      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
      expect(mockPoolQuery.mock.calls[0][1]).toEqual([USER_ID, 'Africa/Nairobi']);
    });

    it('backfills from users table when existing streak data exists', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // INSERT user_streaks
        .mockResolvedValueOnce(pgResult([{ current_streak: 10, longest_streak: 15, last_activity_date: '2026-04-20' }])) // SELECT users
        .mockResolvedValueOnce(pgResult([])); // UPDATE user_streaks (backfill)

      await streakService.initializeUserStreak(USER_ID);

      expect(mockPoolQuery).toHaveBeenCalledTimes(3);
    });
  });

  // ------------------------------------------
  // getCalendar
  // ------------------------------------------
  describe('getCalendar', () => {
    it('returns day-by-day data for month with activities and freezes', async () => {
      const activities = [
        { activity_date: new Date('2026-04-01'), activity_type: 'workout', streak_day: 1 },
        { activity_date: new Date('2026-04-02'), activity_type: 'workout', streak_day: 2 },
      ];
      const freezes = [
        { freeze_date: new Date('2026-04-03'), source: 'auto_applied' },
      ];

      mockPoolQuery
        .mockResolvedValueOnce(pgResult(activities)) // activities
        .mockResolvedValueOnce(pgResult(freezes)) // freezes
        .mockResolvedValueOnce(pgResult([{ current_streak: 5 }])); // current streak

      const result = await streakService.getCalendar(USER_ID, '2026-04');

      expect(result.month).toBe('2026-04');
      expect(result.days).toHaveLength(30); // April has 30 days
      expect(result.summary.activeDays).toBe(2);
      expect(result.summary.frozenDays).toBe(1);
      expect(result.summary.currentStreak).toBe(5);
    });

    it('returns all none status when no activities or freezes exist', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // activities
        .mockResolvedValueOnce(pgResult([])) // freezes
        .mockResolvedValueOnce(pgResult([{ current_streak: 0 }])); // current streak

      const result = await streakService.getCalendar(USER_ID, '2026-01');

      expect(result.days).toHaveLength(31); // January
      expect(result.summary.activeDays).toBe(0);
      expect(result.summary.currentStreak).toBe(0);
    });
  });

  // ------------------------------------------
  // getStreakLeaderboard
  // ------------------------------------------
  describe('getStreakLeaderboard', () => {
    it('returns ranked users ordered by current streak', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([{ count: '2' }])) // COUNT
        .mockResolvedValueOnce(pgResult([
          { user_id: 'u1', current_streak: 30, longest_streak: 50, name: 'Alice', email: 'a@test.com', avatar_url: null, rank: '1' },
          { user_id: 'u2', current_streak: 20, longest_streak: 25, name: null, email: 'b@test.com', avatar_url: null, rank: '2' },
        ]));

      const result = await streakService.getStreakLeaderboard(20, 0);

      expect(result.total).toBe(2);
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].displayName).toBe('Alice');
      expect(result.entries[0].tier).toBe('Inferno'); // 30 days
      expect(result.entries[1].displayName).toBe('b'); // from email split
    });
  });

  // ------------------------------------------
  // getStats
  // ------------------------------------------
  describe('getStats', () => {
    it('returns aggregate stats with activity breakdown', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([{ total_active_days: 45 }])) // total active days
        .mockResolvedValueOnce(pgResult([
          { activity_type: 'workout', count: '30' },
          { activity_type: 'meal', count: '15' },
        ])) // breakdown
        .mockResolvedValueOnce(pgResult([{ month: '2026-03', active_days: '25' }])) // best month
        .mockResolvedValueOnce(pgResult([{ resets: '3' }])); // reset count

      const result = await streakService.getStats(USER_ID);

      expect(result.totalActiveDays).toBe(45);
      expect(result.activityBreakdown).toEqual({ workout: 30, meal: 15 });
      expect(result.bestMonth).toEqual({ month: '2026-03', activeDays: 25 });
      expect(result.averageStreak).toBe(15); // 45 / 3
    });

    it('handles user with no activity data', async () => {
      mockPoolQuery
        .mockResolvedValueOnce(pgResult([])) // total active days (none)
        .mockResolvedValueOnce(pgResult([])) // breakdown
        .mockResolvedValueOnce(pgResult([])) // best month
        .mockResolvedValueOnce(pgResult([])); // reset count

      const result = await streakService.getStats(USER_ID);

      expect(result.totalActiveDays).toBe(0);
      expect(result.activityBreakdown).toEqual({});
      expect(result.bestMonth).toEqual({ month: '', activeDays: 0 });
    });
  });

  // ------------------------------------------
  // compareWithFriend
  // ------------------------------------------
  describe('compareWithFriend', () => {
    it('returns comparison with streak difference and suggestion', async () => {
      mockPoolQuery.mockResolvedValueOnce(pgResult([
        { user_id: USER_ID, current_streak: 10, longest_streak: 20, total_active_days: 30, name: 'Me', email: 'me@test.com' },
        { user_id: 'friend-1', current_streak: 15, longest_streak: 25, total_active_days: 40, name: 'Friend', email: 'f@test.com' },
      ]));

      const result = await streakService.compareWithFriend(USER_ID, 'friend-1');

      expect(result.you.currentStreak).toBe(10);
      expect(result.friend.currentStreak).toBe(15);
      expect(result.delta.streakDiff).toBe(-5);
      expect(result.delta.suggestion).toContain('ahead by 5 days');
    });
  });
});
