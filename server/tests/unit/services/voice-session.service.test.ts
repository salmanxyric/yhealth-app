/**
 * Voice Session Service — Unit Tests
 *
 * Tests for session lifecycle: creation, phase updates, timing checks,
 * upgrades/downgrades, retrieval, completion, and abandonment.
 *
 * Note: This project uses resetMocks: true globally, so mock implementations
 * set in beforeAll are stripped before each test. We use beforeEach to
 * re-import a fresh singleton for each test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();

let voiceSessionService: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockQuery.mockReset();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.resetModules();

  const mod = await import('../../../src/services/voice-session.service.js');
  voiceSessionService = mod.voiceSessionService;
});

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount?: number) {
  return {
    rows,
    rowCount: rowCount ?? rows.length,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
}

function makeSessionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    user_id: 'user-1',
    session_type: 'quick_checkin',
    session_phase: 'opening',
    session_duration: null,
    target_duration: 300,
    emergency_triggered: false,
    goal_id: null,
    upgraded_from: null,
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// ============================================
// createSession
// ============================================

describe('voiceSessionService', () => {
  describe('createSession', () => {
    it('should create a quick_checkin session with 5-minute duration', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-abc' }]));

      const session = await voiceSessionService.createSession('user-1', 'quick_checkin');

      expect(session.id).toBe('session-abc');
      expect(session.userId).toBe('user-1');
      expect(session.sessionType).toBe('quick_checkin');
      expect(session.targetDuration).toBe(300); // 5 * 60
      expect(session.sessionPhase).toBe('opening');
      expect(session.sessionDuration).toBe(0);
      expect(session.status).toBe('active');
      expect(session.emergencyTriggered).toBe(false);
    });

    it('should create a coaching_session with 25-minute duration and opening_reflection phase', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-coach' }]));

      const session = await voiceSessionService.createSession('user-2', 'coaching_session');

      expect(session.targetDuration).toBe(1500); // 25 * 60
      expect(session.sessionPhase).toBe('opening_reflection');
      expect(session.sessionType).toBe('coaching_session');
    });

    it('should create an emergency_support session with 12-minute duration and immediate_acknowledgment phase', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-emer' }]));

      const session = await voiceSessionService.createSession('user-3', 'emergency_support', {
        userId: 'user-3',
        emergencyTriggered: true,
      });

      expect(session.targetDuration).toBe(720); // 12 * 60
      expect(session.sessionPhase).toBe('immediate_acknowledgment');
      expect(session.emergencyTriggered).toBe(true);
    });

    it('should create a goal_review session with 15-minute duration and goal_selection phase', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-goal' }]));

      const session = await voiceSessionService.createSession('user-4', 'goal_review', {
        userId: 'user-4',
        goalId: 'goal-42',
      });

      expect(session.targetDuration).toBe(900); // 15 * 60
      expect(session.sessionPhase).toBe('goal_selection');
      expect(session.goalId).toBe('goal-42');
    });

    it('should pass correct parameters to the INSERT query', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-ins' }]));

      await voiceSessionService.createSession('user-5', 'quick_checkin', {
        userId: 'user-5',
        goalId: 'goal-99',
        upgradedFrom: 'prev-session',
        emergencyTriggered: true,
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('INSERT INTO rag_conversations');
      expect(params[0]).toBe('user-5');          // userId
      expect(params[1]).toBe('quick_checkin');    // type
      expect(params[2]).toBe('opening');          // initial phase
      expect(params[3]).toBe(300);                // target duration
      expect(params[4]).toBe(true);               // emergencyTriggered
      expect(params[5]).toBe('goal-99');          // goalId
      expect(params[6]).toBe('prev-session');     // upgradedFrom
    });

    it('should default context values when no context is provided', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-def' }]));

      const session = await voiceSessionService.createSession('user-6', 'quick_checkin');

      const [, params] = mockQuery.mock.calls[0];
      expect(params[4]).toBe(false); // emergencyTriggered defaults to false
      expect(params[5]).toBeNull();  // goalId defaults to null
      expect(params[6]).toBeNull();  // upgradedFrom defaults to null
      expect(session.emergencyTriggered).toBe(false);
      expect(session.goalId).toBeUndefined();
      expect(session.upgradedFrom).toBeUndefined();
    });

    it('should fall back to quick_checkin duration for unknown session type', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'session-unk' }]));

      const session = await voiceSessionService.createSession('user-7', 'nonexistent_type' as any);

      // SESSION_DURATIONS[type] is undefined => falls back to quick_checkin (300)
      expect(session.targetDuration).toBe(300);
    });

    it('should create sessions for all domain-specific types with correct durations', async () => {
      const typeDurations: Array<[string, number]> = [
        ['health_coach', 1200],
        ['nutrition', 1200],
        ['fitness', 1200],
        ['wellness', 1200],
        ['workout', 900],
        ['meal', 600],
        ['emotion', 900],
        ['sleep', 600],
        ['stress', 900],
        ['recovery', 900],
        ['general_health', 900],
      ];

      for (const [type, expectedDuration] of typeDurations) {
        mockQuery.mockReset();
        mockQuery.mockResolvedValueOnce(pgResult([{ id: `session-${type}` }]));

        const session = await voiceSessionService.createSession('user-8', type);

        expect(session.targetDuration).toBe(expectedDuration);
        expect(session.sessionPhase).toBe('opening'); // all domain types default to 'opening'
      }
    });

    it('should throw and log error when DB insert fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        voiceSessionService.createSession('user-9', 'quick_checkin')
      ).rejects.toThrow('Connection refused');
    });
  });

  // ============================================
  // updateSessionPhase
  // ============================================

  describe('updateSessionPhase', () => {
    it('should update the phase of a session', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([], 1));

      await voiceSessionService.updateSessionPhase('session-1', 'metric_review');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain('UPDATE rag_conversations');
      expect(sql).toContain('session_phase');
      expect(params[0]).toBe('metric_review');
      expect(params[1]).toBe('session-1');
    });

    it('should update to closing phase', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([], 1));

      await voiceSessionService.updateSessionPhase('session-2', 'closing');

      const [, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe('closing');
    });

    it('should throw when DB update fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB timeout'));

      await expect(
        voiceSessionService.updateSessionPhase('session-fail', 'opening')
      ).rejects.toThrow('DB timeout');
    });
  });

  // ============================================
  // checkSessionTiming
  // ============================================

  describe('checkSessionTiming', () => {
    it('should return on-track status when within time limit', async () => {
      // session_duration is set, so it uses that directly
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: 300,
          session_duration: 120,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      const timing = await voiceSessionService.checkSessionTiming('session-1');

      expect(timing.isOnTrack).toBe(true);
      expect(timing.isOvertime).toBe(false);
      expect(timing.totalDuration).toBe(120);
      expect(timing.targetDuration).toBe(300);
      expect(timing.remainingTime).toBe(180); // 300 - 120
      expect(timing.overTimeBy).toBeUndefined();
    });

    it('should return overtime status when exceeding time limit', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: 300,
          session_duration: 400,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      const timing = await voiceSessionService.checkSessionTiming('session-1');

      expect(timing.isOnTrack).toBe(false);
      expect(timing.isOvertime).toBe(true);
      expect(timing.totalDuration).toBe(400);
      expect(timing.overTimeBy).toBe(100); // 400 - 300
      expect(timing.remainingTime).toBeUndefined();
    });

    it('should return on-track at exact boundary (duration == target)', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: 300,
          session_duration: 300,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      const timing = await voiceSessionService.checkSessionTiming('session-1');

      // At exact boundary: currentDuration <= targetDuration is true
      expect(timing.isOnTrack).toBe(true);
      expect(timing.isOvertime).toBe(false);
      expect(timing.remainingTime).toBe(0);
    });

    it('should calculate duration from created_at when session_duration is null', async () => {
      const createdAt = new Date(Date.now() - 60_000); // 60 seconds ago
      mockQuery
        // First call: SELECT
        .mockResolvedValueOnce(
          pgResult([{
            target_duration: 300,
            session_duration: null,
            created_at: createdAt,
          }])
        )
        // Second call: UPDATE for session_duration
        .mockResolvedValueOnce(pgResult([], 1));

      const timing = await voiceSessionService.checkSessionTiming('session-1');

      expect(timing.isOnTrack).toBe(true);
      expect(timing.totalDuration).toBeGreaterThanOrEqual(59); // ~60s, allow for timing tolerance
      expect(timing.totalDuration).toBeLessThan(65);

      // Should have issued an UPDATE to persist the computed duration
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const [updateSql] = mockQuery.mock.calls[1];
      expect(updateSql).toContain('UPDATE rag_conversations');
      expect(updateSql).toContain('session_duration');
    });

    it('should NOT issue update when session_duration is already set', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: 300,
          session_duration: 120,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      await voiceSessionService.checkSessionTiming('session-1');

      // Only the SELECT, no UPDATE
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should fall back to quick_checkin duration when target_duration is null', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: null,
          session_duration: 100,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      const timing = await voiceSessionService.checkSessionTiming('session-1');

      expect(timing.targetDuration).toBe(300); // quick_checkin default
    });

    it('should throw when session is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceSessionService.checkSessionTiming('nonexistent')
      ).rejects.toThrow('Session not found');
    });

    it('should throw when DB query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Query failed'));

      await expect(
        voiceSessionService.checkSessionTiming('session-fail')
      ).rejects.toThrow('Query failed');
    });

    it('should always set currentPhaseDuration to 0', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([{
          target_duration: 300,
          session_duration: 120,
          created_at: new Date('2026-01-01T00:00:00Z'),
        }])
      );

      const timing = await voiceSessionService.checkSessionTiming('session-1');
      expect(timing.currentPhaseDuration).toBe(0);
    });
  });

  // ============================================
  // upgradeSession
  // ============================================

  describe('upgradeSession', () => {
    it('should upgrade quick_checkin to coaching_session', async () => {
      const currentRow = makeSessionRow({ session_type: 'quick_checkin' });
      const updatedRow = makeSessionRow({
        session_type: 'coaching_session',
        session_phase: 'opening_reflection',
        target_duration: 1500,
        upgraded_from: 'session-1',
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([currentRow]))   // SELECT current
        .mockResolvedValueOnce(pgResult([], 1))           // UPDATE
        .mockResolvedValueOnce(pgResult([updatedRow]));   // SELECT updated

      const result = await voiceSessionService.upgradeSession('session-1', 'coaching_session');

      expect(result.sessionType).toBe('coaching_session');
      expect(result.sessionPhase).toBe('opening_reflection');
      expect(result.targetDuration).toBe(1500);
    });

    it('should upgrade quick_checkin to goal_review', async () => {
      const currentRow = makeSessionRow({ session_type: 'quick_checkin' });
      const updatedRow = makeSessionRow({
        session_type: 'goal_review',
        session_phase: 'goal_selection',
        target_duration: 900,
        upgraded_from: 'session-1',
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([currentRow]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([updatedRow]));

      const result = await voiceSessionService.upgradeSession('session-1', 'goal_review');

      expect(result.sessionType).toBe('goal_review');
      expect(result.sessionPhase).toBe('goal_selection');
      expect(result.targetDuration).toBe(900);
    });

    it('should downgrade coaching_session to quick_checkin', async () => {
      const currentRow = makeSessionRow({
        session_type: 'coaching_session',
        session_phase: 'opening_reflection',
        target_duration: 1500,
      });
      const updatedRow = makeSessionRow({
        session_type: 'quick_checkin',
        session_phase: 'opening',
        target_duration: 300,
        upgraded_from: 'session-1',
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([currentRow]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([updatedRow]));

      const result = await voiceSessionService.upgradeSession('session-1', 'quick_checkin');

      expect(result.sessionType).toBe('quick_checkin');
      expect(result.sessionPhase).toBe('opening');
      expect(result.targetDuration).toBe(300);
    });

    it('should reject upgrade to emergency_support', async () => {
      const currentRow = makeSessionRow({ session_type: 'quick_checkin' });
      mockQuery.mockResolvedValueOnce(pgResult([currentRow]));

      await expect(
        voiceSessionService.upgradeSession('session-1', 'emergency_support')
      ).rejects.toThrow('Cannot upgrade from quick_checkin to emergency_support');
    });

    it('should reject invalid upgrade from goal_review to coaching_session', async () => {
      const currentRow = makeSessionRow({ session_type: 'goal_review' });
      mockQuery.mockResolvedValueOnce(pgResult([currentRow]));

      await expect(
        voiceSessionService.upgradeSession('session-1', 'coaching_session')
      ).rejects.toThrow('Cannot upgrade from goal_review to coaching_session');
    });

    it('should reject upgrade from emergency_support to anything', async () => {
      const currentRow = makeSessionRow({ session_type: 'emergency_support' });
      mockQuery.mockResolvedValueOnce(pgResult([currentRow]));

      await expect(
        voiceSessionService.upgradeSession('session-1', 'quick_checkin')
      ).rejects.toThrow('Cannot upgrade from emergency_support to quick_checkin');
    });

    it('should reject upgrade from coaching_session to goal_review', async () => {
      const currentRow = makeSessionRow({ session_type: 'coaching_session' });
      mockQuery.mockResolvedValueOnce(pgResult([currentRow]));

      await expect(
        voiceSessionService.upgradeSession('session-1', 'goal_review')
      ).rejects.toThrow('Cannot upgrade from coaching_session to goal_review');
    });

    it('should throw when session is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceSessionService.upgradeSession('nonexistent', 'coaching_session')
      ).rejects.toThrow('Session not found');
    });

    it('should pass correct parameters to the UPDATE query', async () => {
      const currentRow = makeSessionRow({ session_type: 'quick_checkin' });
      const updatedRow = makeSessionRow({
        session_type: 'coaching_session',
        session_phase: 'opening_reflection',
        target_duration: 1500,
        upgraded_from: 'session-1',
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([currentRow]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([updatedRow]));

      await voiceSessionService.upgradeSession('session-1', 'coaching_session');

      // The UPDATE call is the second query (index 1)
      const [updateSql, updateParams] = mockQuery.mock.calls[1];
      expect(updateSql).toContain('UPDATE rag_conversations');
      expect(updateParams[0]).toBe('coaching_session');    // targetType
      expect(updateParams[1]).toBe('opening_reflection');  // newPhase
      expect(updateParams[2]).toBe(1500);                  // targetDuration
      expect(updateParams[3]).toBe('session-1');           // upgraded_from (sessionId)
      expect(updateParams[4]).toBe('session-1');           // WHERE id
    });

    it('should map session row fields correctly in returned VoiceSession', async () => {
      const createdDate = new Date('2026-03-15T10:00:00Z');
      const updatedDate = new Date('2026-03-15T10:05:00Z');
      const currentRow = makeSessionRow({ session_type: 'quick_checkin' });
      const updatedRow = makeSessionRow({
        id: 'session-1',
        user_id: 'user-1',
        session_type: 'coaching_session',
        session_phase: 'opening_reflection',
        session_duration: 120,
        target_duration: 1500,
        emergency_triggered: false,
        goal_id: 'goal-42',
        upgraded_from: 'session-1',
        status: 'active',
        created_at: createdDate,
        updated_at: updatedDate,
      });

      mockQuery
        .mockResolvedValueOnce(pgResult([currentRow]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([updatedRow]));

      const result = await voiceSessionService.upgradeSession('session-1', 'coaching_session');

      expect(result.id).toBe('session-1');
      expect(result.userId).toBe('user-1');
      expect(result.conversationId).toBe('session-1');
      expect(result.sessionDuration).toBe(120);
      expect(result.goalId).toBe('goal-42');
      expect(result.upgradedFrom).toBe('session-1');
      expect(result.emergencyTriggered).toBe(false);
      expect(result.status).toBe('active');
      expect(result.createdAt).toBe(createdDate);
      expect(result.updatedAt).toBe(updatedDate);
    });
  });

  // ============================================
  // getSession
  // ============================================

  describe('getSession', () => {
    it('should return a session when found', async () => {
      const row = makeSessionRow();
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const session = await voiceSessionService.getSession('session-1');

      expect(session).not.toBeNull();
      expect(session.id).toBe('session-1');
      expect(session.userId).toBe('user-1');
      expect(session.sessionType).toBe('quick_checkin');
      expect(session.sessionPhase).toBe('opening');
      expect(session.targetDuration).toBe(300);
      expect(session.sessionDuration).toBe(0); // null -> 0
      expect(session.status).toBe('active');
      expect(session.conversationId).toBe('session-1');
    });

    it('should return null when session is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const session = await voiceSessionService.getSession('nonexistent');

      expect(session).toBeNull();
    });

    it('should default session_phase to opening when null in DB', async () => {
      const row = makeSessionRow({ session_phase: null });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const session = await voiceSessionService.getSession('session-1');

      expect(session.sessionPhase).toBe('opening');
    });

    it('should default target_duration to quick_checkin when null in DB', async () => {
      const row = makeSessionRow({ target_duration: null });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const session = await voiceSessionService.getSession('session-1');

      expect(session.targetDuration).toBe(300); // quick_checkin default
    });

    it('should map optional fields as undefined when null in DB', async () => {
      const row = makeSessionRow({
        upgraded_from: null,
        goal_id: null,
      });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const session = await voiceSessionService.getSession('session-1');

      expect(session.upgradedFrom).toBeUndefined();
      expect(session.goalId).toBeUndefined();
    });

    it('should map optional fields with values from DB', async () => {
      const row = makeSessionRow({
        upgraded_from: 'prev-session',
        goal_id: 'goal-42',
      });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const session = await voiceSessionService.getSession('session-1');

      expect(session.upgradedFrom).toBe('prev-session');
      expect(session.goalId).toBe('goal-42');
    });

    it('should throw when DB query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection lost'));

      await expect(
        voiceSessionService.getSession('session-1')
      ).rejects.toThrow('Connection lost');
    });
  });

  // ============================================
  // completeSession
  // ============================================

  describe('completeSession', () => {
    it('should mark session as completed with calculated duration', async () => {
      const startedAt = new Date(Date.now() - 120_000); // 120 seconds ago
      const row = makeSessionRow({ created_at: startedAt });

      mockQuery
        .mockResolvedValueOnce(pgResult([row]))   // getSession SELECT
        .mockResolvedValueOnce(pgResult([], 1));   // UPDATE

      await voiceSessionService.completeSession('session-1');

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const [updateSql, updateParams] = mockQuery.mock.calls[1];
      expect(updateSql).toContain("status = 'completed'");
      expect(updateSql).toContain('session_duration');
      // Duration should be approximately 120 seconds (allow tolerance)
      expect(updateParams[0]).toBeGreaterThanOrEqual(119);
      expect(updateParams[0]).toBeLessThan(125);
      expect(updateParams[1]).toBe('session-1');
    });

    it('should throw when session is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([])); // getSession returns null

      await expect(
        voiceSessionService.completeSession('nonexistent')
      ).rejects.toThrow('Session not found');
    });

    it('should throw when DB update fails', async () => {
      const row = makeSessionRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([row]))         // getSession
        .mockRejectedValueOnce(new Error('Write error')); // UPDATE fails

      await expect(
        voiceSessionService.completeSession('session-1')
      ).rejects.toThrow('Write error');
    });
  });

  // ============================================
  // abandonSession
  // ============================================

  describe('abandonSession', () => {
    it('should mark session as abandoned with calculated duration', async () => {
      const startedAt = new Date(Date.now() - 45_000); // 45 seconds ago
      const row = makeSessionRow({ created_at: startedAt });

      mockQuery
        .mockResolvedValueOnce(pgResult([row]))   // getSession SELECT
        .mockResolvedValueOnce(pgResult([], 1));   // UPDATE

      await voiceSessionService.abandonSession('session-1');

      expect(mockQuery).toHaveBeenCalledTimes(2);
      const [updateSql, updateParams] = mockQuery.mock.calls[1];
      expect(updateSql).toContain("status = 'abandoned'");
      expect(updateSql).toContain('session_duration');
      // Duration should be approximately 45 seconds
      expect(updateParams[0]).toBeGreaterThanOrEqual(44);
      expect(updateParams[0]).toBeLessThan(50);
      expect(updateParams[1]).toBe('session-1');
    });

    it('should throw when session is not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([])); // getSession returns null

      await expect(
        voiceSessionService.abandonSession('nonexistent')
      ).rejects.toThrow('Session not found');
    });

    it('should throw when DB update fails', async () => {
      const row = makeSessionRow();
      mockQuery
        .mockResolvedValueOnce(pgResult([row]))           // getSession
        .mockRejectedValueOnce(new Error('Disk full'));    // UPDATE fails

      await expect(
        voiceSessionService.abandonSession('session-1')
      ).rejects.toThrow('Disk full');
    });
  });
});
