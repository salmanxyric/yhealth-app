/**
 * Notification Service Unit Tests
 *
 * Tests for create, welcomeUser, goalProgressUpdated, streakMilestone,
 * dailyReminder, coachingTip, warning, goalCreated, goalCompleted.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  pool: { query: mockQuery, end: jest.fn() },
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

// ============================================
// IMPORTS
// ============================================

const { notificationService } = await import('../../../src/services/notification.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_ID = 'user-uuid-1';
const NOTIFICATION_ROW = { id: 'notif-1', user_id: USER_ID, type: 'celebration', title: 'Test', message: 'Test' };

// ============================================
// TESTS
// ============================================

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------
  // create
  // ------------------------------------------
  describe('create', () => {
    it('inserts notification and returns the row', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      const result = await notificationService.create({
        userId: USER_ID,
        type: 'celebration',
        title: 'Test',
        message: 'Test message',
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe('notif-1');
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('returns null on database error instead of throwing', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      const result = await notificationService.create({
        userId: USER_ID,
        type: 'system',
        title: 'Fail',
        message: 'Should fail gracefully',
      });

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns null and warns when the target user no longer exists', async () => {
      const fkError = Object.assign(new Error('violates foreign key constraint'), {
        code: '23503',
        constraint: 'notifications_user_id_fkey',
      });
      mockQuery.mockRejectedValueOnce(fkError);

      const result = await notificationService.create({
        userId: USER_ID,
        type: 'reminder',
        title: 'Stale alarm',
        message: 'This user was deleted',
      });

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Skipped notification for missing user',
        { userId: USER_ID, type: 'reminder' }
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('passes all optional fields correctly', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.create({
        userId: USER_ID,
        type: 'achievement',
        title: 'Badge',
        message: 'You earned a badge',
        icon: 'trophy',
        imageUrl: 'https://example.com/img.png',
        actionUrl: '/achievements',
        actionLabel: 'View',
        category: 'achievements',
        priority: 'high',
        relatedEntityType: 'achievement',
        relatedEntityId: 'ach-1',
        metadata: { level: 5 },
        expiresAt: new Date('2026-12-31'),
      });

      const callArgs = mockQuery.mock.calls[0][1] as unknown[];
      expect(callArgs[0]).toBe(USER_ID);
      expect(callArgs[1]).toBe('achievement');
      expect(callArgs[4]).toBe('trophy'); // icon
      expect(callArgs[9]).toBe('high'); // priority
    });
  });

  // ------------------------------------------
  // welcomeUser
  // ------------------------------------------
  describe('welcomeUser', () => {
    it('creates welcome + tip notifications (2 inserts)', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([NOTIFICATION_ROW])) // welcome
        .mockResolvedValueOnce(pgResult([NOTIFICATION_ROW])); // tip

      await notificationService.welcomeUser(USER_ID, 'Alice');

      expect(mockQuery).toHaveBeenCalledTimes(2);
      // First call is welcome notification
      const firstCall = mockQuery.mock.calls[0][1] as unknown[];
      expect(firstCall[2]).toContain('Welcome'); // title
      expect(firstCall[3]).toContain('Alice'); // message
    });

    it('sends generic message when no userName provided', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]))
        .mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.welcomeUser(USER_ID);

      const firstCall = mockQuery.mock.calls[0][1] as unknown[];
      expect(firstCall[3]).not.toContain('Hey ');
      expect(firstCall[3]).toContain('health journey');
    });
  });

  // ------------------------------------------
  // goalProgressUpdated
  // ------------------------------------------
  describe('goalProgressUpdated', () => {
    it('creates notification at 25% milestone', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalProgressUpdated(USER_ID, 'goal-1', 'Lose Weight', 25, 20);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[2]).toContain('25%');
    });

    it('creates notification at 50% milestone', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalProgressUpdated(USER_ID, 'goal-1', 'Lose Weight', 55, 45);

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[2]).toContain('50%');
    });

    it('creates goal_completed notification at 100% milestone', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalProgressUpdated(USER_ID, 'goal-1', 'Lose Weight', 100, 95);

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[1]).toBe('goal_completed'); // type
      expect(args[2]).toContain('Completed');
    });

    it('does NOT create notification below 25% threshold', async () => {
      await notificationService.goalProgressUpdated(USER_ID, 'goal-1', 'Lose Weight', 20, 15);

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('does NOT create notification when milestone was already crossed', async () => {
      // Progress from 26 to 30 — 25% milestone already passed
      await notificationService.goalProgressUpdated(USER_ID, 'goal-1', 'Lose Weight', 30, 26);

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // streakMilestone
  // ------------------------------------------
  describe('streakMilestone', () => {
    it('creates notification for 7-day streak', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.streakMilestone(USER_ID, 7, 'workout');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[2]).toContain('Week Streak');
      expect(args[1]).toBe('streak');
    });

    it('creates notification for 30-day streak with high priority', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.streakMilestone(USER_ID, 30, 'activity');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[9]).toBe('high'); // priority
    });

    it('does NOT create notification for non-milestone day (e.g. 5)', async () => {
      await notificationService.streakMilestone(USER_ID, 5, 'workout');

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('includes streak metadata', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.streakMilestone(USER_ID, 14, 'workout');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      const metadata = JSON.parse(args[12] as string);
      expect(metadata.streakDays).toBe(14);
      expect(metadata.streakType).toBe('workout');
    });
  });

  // ------------------------------------------
  // dailyReminder
  // ------------------------------------------
  describe('dailyReminder', () => {
    it('creates workout reminder with 24h expiry', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.dailyReminder(USER_ID, 'workout');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[1]).toBe('reminder');
      expect(args[2]).toContain('Move');
      // expiresAt should be a Date roughly 24h from now
      const expiry = args[13] as Date;
      expect(expiry).toBeInstanceOf(Date);
      const diff = expiry.getTime() - Date.now();
      expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('does not create notification for unknown reminder type', async () => {
      await notificationService.dailyReminder(USER_ID, 'unknown' as any);

      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------
  // coachingTip
  // ------------------------------------------
  describe('coachingTip', () => {
    it('creates coaching tip with 7-day expiry', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.coachingTip(USER_ID, 'Drink water before meals');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[1]).toBe('coaching');
      expect(args[3]).toBe('Drink water before meals');
      const expiry = args[13] as Date;
      const diff = expiry.getTime() - Date.now();
      expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
    });
  });

  // ------------------------------------------
  // warning
  // ------------------------------------------
  describe('warning', () => {
    it('creates warning with high priority', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.warning(USER_ID, 'Streak at risk!', 'Log activity before midnight');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[1]).toBe('warning');
      expect(args[9]).toBe('high');
      expect(args[2]).toBe('Streak at risk!');
    });
  });

  // ------------------------------------------
  // goalCreated
  // ------------------------------------------
  describe('goalCreated', () => {
    it('creates notification for primary goal with high priority', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalCreated(USER_ID, 'goal-1', 'Run 5K', true);

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[2]).toContain('Primary Goal');
      expect(args[9]).toBe('high');
    });

    it('creates notification for non-primary goal with normal priority', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalCreated(USER_ID, 'goal-2', 'Drink Water', false);

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[2]).toContain('New Goal');
      expect(args[9]).toBe('normal');
    });
  });

  // ------------------------------------------
  // goalCompleted
  // ------------------------------------------
  describe('goalCompleted', () => {
    it('creates celebration notification with goal title', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([NOTIFICATION_ROW]));

      await notificationService.goalCompleted(USER_ID, 'goal-1', 'Lose 5kg');

      const args = mockQuery.mock.calls[0][1] as unknown[];
      expect(args[1]).toBe('goal_completed');
      expect(args[3]).toContain('Lose 5kg');
      expect(args[9]).toBe('high');
    });
  });
});
