/**
 * Achievement Check Job Unit Tests
 *
 * Tests for runAchievementCheckJob — runs every 15 minutes, checks
 * goal-linked dynamic achievements for progress updates, awards XP,
 * and emits Socket.IO notifications for unlocks.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock, setupRedisCacheMock } from '../../helpers/mock-services.js';

// ============================================
// MOCKS
// ============================================

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();
setupRedisCacheMock();

const mockCheckGoalProgress = jest.fn<any>().mockResolvedValue([]);

jest.unstable_mockModule('../../../src/services/dynamic-achievements.service.js', () => ({
  dynamicAchievementsService: {
    checkGoalProgress: mockCheckGoalProgress,
  },
}));

const mockAwardXP = jest.fn<any>().mockResolvedValue({ xpEarned: 50 });

jest.unstable_mockModule('../../../src/services/gamification.service.js', () => ({
  gamificationService: {
    awardXP: mockAwardXP,
  },
}));

const mockEmitToUser = jest.fn();

jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: mockEmitToUser,
  },
}));

// Dynamic imports AFTER mocks
const achievementModule = await import('../../../src/jobs/achievement-check.job.js');
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ============================================
// HELPERS
// ============================================

function buildUnlockedAchievement(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ach-1',
    title: 'First Steps',
    description: 'Complete your first goal',
    emotionalContext: 'Great start on your journey!',
    icon: 'trophy',
    category: 'goals',
    rarity: 'common',
    xpReward: 50,
    currentProgress: 1,
    maxProgress: 1,
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckGoalProgress.mockResolvedValue([]);
  mockAwardXP.mockResolvedValue({ xpEarned: 50 });
  // Reset notification insert query default
  mockQuery.mockResolvedValue(pgEmpty());
});

afterEach(() => {
  achievementModule.stopAchievementCheckJob();
  jest.useRealTimers();
});

describe('runAchievementCheckJob (via start + fake timers)', () => {
  it('checks goal progress for users with pending achievements', async () => {
    jest.useFakeTimers();

    // Users with pending achievements
    mockQuery.mockResolvedValueOnce(
      pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]),
    );
    mockCheckGoalProgress.mockResolvedValueOnce([]); // u1: no unlocks
    mockCheckGoalProgress.mockResolvedValueOnce([]); // u2: no unlocks

    achievementModule.startAchievementCheckJob();

    // Advance past startup delay (12 minutes)
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    expect(mockQuery).toHaveBeenCalled();
    expect(mockCheckGoalProgress).toHaveBeenCalledWith('u1');
    expect(mockCheckGoalProgress).toHaveBeenCalledWith('u2');
  });

  it('awards XP and emits socket event when achievement unlocked', async () => {
    jest.useFakeTimers();

    const achievement = buildUnlockedAchievement();

    mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
    mockCheckGoalProgress.mockResolvedValueOnce([achievement]);
    // Notification insert
    mockQuery.mockResolvedValueOnce(pgEmpty());

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    expect(mockAwardXP).toHaveBeenCalledWith(
      'u1',
      'achievement',
      50,
      undefined,
      expect.stringContaining('First Steps'),
    );

    expect(mockEmitToUser).toHaveBeenCalledWith(
      'u1',
      'achievement:unlocked',
      expect.objectContaining({
        achievement: expect.objectContaining({
          id: 'ach-1',
          title: 'First Steps',
          unlocked: true,
          progressPercentage: 100,
        }),
      }),
    );
  });

  it('does nothing when no users have pending achievements', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValueOnce(pgEmpty());

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    expect(mockCheckGoalProgress).not.toHaveBeenCalled();
  });

  it('continues processing when one user fails', async () => {
    jest.useFakeTimers();

    mockQuery.mockResolvedValueOnce(
      pgResult([{ user_id: 'u1' }, { user_id: 'u2' }]),
    );
    mockCheckGoalProgress.mockRejectedValueOnce(new Error('Goal service down'));
    mockCheckGoalProgress.mockResolvedValueOnce([]);

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    // u2 should still be checked
    expect(mockCheckGoalProgress).toHaveBeenCalledWith('u2');
  });

  it('handles XP award failure without stopping achievement processing', async () => {
    jest.useFakeTimers();

    const ach1 = buildUnlockedAchievement({ id: 'ach-1', title: 'A' });
    const ach2 = buildUnlockedAchievement({ id: 'ach-2', title: 'B' });

    mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
    mockCheckGoalProgress.mockResolvedValueOnce([ach1, ach2]);
    // XP award fails for ach1
    mockAwardXP.mockRejectedValueOnce(new Error('XP service error'));
    // Notification inserts
    mockQuery.mockResolvedValue(pgEmpty());

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    // Both achievements should emit socket events
    expect(mockEmitToUser).toHaveBeenCalledTimes(2);
  });

  it('handles fatal DB error gracefully', async () => {
    jest.useFakeTimers();

    mockQuery.mockRejectedValueOnce(new Error('Connection pool exhausted'));

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    // Should not throw — error is caught and logged
    expect(mockCheckGoalProgress).not.toHaveBeenCalled();
  });

  it('persists in-app notification on unlock', async () => {
    jest.useFakeTimers();

    const achievement = buildUnlockedAchievement({ xpReward: 100, rarity: 'rare' });

    mockQuery.mockResolvedValueOnce(pgResult([{ user_id: 'u1' }]));
    mockCheckGoalProgress.mockResolvedValueOnce([achievement]);
    // Notification insert
    mockQuery.mockResolvedValueOnce(pgEmpty());

    achievementModule.startAchievementCheckJob();
    jest.advanceTimersByTime(720_000);
    await jest.advanceTimersByTimeAsync(0);

    // The second mockQuery call should be the notification INSERT
    const notifCall = mockQuery.mock.calls.find((call) =>
      typeof call[0] === 'string' && (call[0] as string).includes('INSERT INTO notifications'),
    );
    expect(notifCall).toBeDefined();
    expect(notifCall![1]).toEqual(
      expect.arrayContaining(['u1']),
    );
  });
});
