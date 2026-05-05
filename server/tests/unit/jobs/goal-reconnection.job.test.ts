/**
 * @file Goal Reconnection Job Tests
 * Tests for DKA prevention: detecting stale goals and sending reconnection messages.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockGoalReconnectionService = {
  detectCandidates: jest.fn<any>().mockResolvedValue([]),
  createReconnection: jest.fn<any>().mockResolvedValue({ id: 'recon-1' }),
};
jest.unstable_mockModule('../../../src/services/goal-reconnection.service.js', () => ({
  goalReconnectionService: mockGoalReconnectionService,
}));

const mockProactiveMessagingService = {
  sendProactiveMessage: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/proactive-messaging.service.js', () => ({
  proactiveMessagingService: mockProactiveMessagingService,
}));

// ReconnectionTier is imported as `import type` — erased by ts-jest at compile time, no mock needed.

// ── Dynamic imports ─────────────────────────────────────────

const { goalReconnectionJob } = await import('../../../src/jobs/goal-reconnection.job.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockGoalReconnectionService.detectCandidates.mockResolvedValue([]);
  mockGoalReconnectionService.createReconnection.mockResolvedValue({ id: 'recon-1' });
  mockProactiveMessagingService.sendProactiveMessage.mockResolvedValue(undefined);
});

describe('GoalReconnectionJob', () => {
  describe('runOnce', () => {
    it('should detect candidates and create reconnections with messages', async () => {
      const candidates = [
        { userId: 'u1', lifeGoalId: 'g1', goalTitle: 'Run a marathon', tier: 1 as const },
        { userId: 'u2', lifeGoalId: 'g2', goalTitle: 'Eat healthier', tier: 2 as const },
      ];
      mockGoalReconnectionService.detectCandidates.mockResolvedValueOnce(candidates);
      mockGoalReconnectionService.createReconnection
        .mockResolvedValueOnce({ id: 'recon-1' })
        .mockResolvedValueOnce({ id: 'recon-2' });

      await goalReconnectionJob.runOnce();

      expect(mockGoalReconnectionService.createReconnection).toHaveBeenCalledTimes(2);
      expect(mockProactiveMessagingService.sendProactiveMessage).toHaveBeenCalledTimes(2);

      // Verify tier 1 message content
      expect(mockProactiveMessagingService.sendProactiveMessage).toHaveBeenCalledWith(
        'u1',
        expect.stringContaining('Run a marathon'),
        'goal_reconnection',
        undefined,
        { reconnectionId: 'recon-1' },
      );
    });

    it('should do nothing when no candidates are detected', async () => {
      mockGoalReconnectionService.detectCandidates.mockResolvedValueOnce([]);

      await goalReconnectionJob.runOnce();

      expect(mockGoalReconnectionService.createReconnection).not.toHaveBeenCalled();
      expect(mockProactiveMessagingService.sendProactiveMessage).not.toHaveBeenCalled();
    });

    it('should skip messaging when reconnection already existed (null return)', async () => {
      const candidates = [
        { userId: 'u1', lifeGoalId: 'g1', goalTitle: 'Meditate daily', tier: 1 as const },
      ];
      mockGoalReconnectionService.detectCandidates.mockResolvedValueOnce(candidates);
      // createReconnection returns null when tier already exists
      mockGoalReconnectionService.createReconnection.mockResolvedValueOnce(null);

      await goalReconnectionJob.runOnce();

      expect(mockProactiveMessagingService.sendProactiveMessage).not.toHaveBeenCalled();
    });

    it('should continue processing when one candidate fails', async () => {
      const candidates = [
        { userId: 'u1', lifeGoalId: 'g1', goalTitle: 'Goal 1', tier: 1 as const },
        { userId: 'u2', lifeGoalId: 'g2', goalTitle: 'Goal 2', tier: 2 as const },
      ];
      mockGoalReconnectionService.detectCandidates.mockResolvedValueOnce(candidates);
      mockGoalReconnectionService.createReconnection
        .mockRejectedValueOnce(new Error('DB constraint violation'))
        .mockResolvedValueOnce({ id: 'recon-2' });

      await goalReconnectionJob.runOnce();

      // Second candidate should still be processed
      expect(mockGoalReconnectionService.createReconnection).toHaveBeenCalledTimes(2);
      expect(mockProactiveMessagingService.sendProactiveMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle proactive message failure without stopping', async () => {
      const candidates = [
        { userId: 'u1', lifeGoalId: 'g1', goalTitle: 'Goal 1', tier: 3 as const },
      ];
      mockGoalReconnectionService.detectCandidates.mockResolvedValueOnce(candidates);
      mockGoalReconnectionService.createReconnection.mockResolvedValueOnce({ id: 'recon-1' });
      mockProactiveMessagingService.sendProactiveMessage.mockRejectedValueOnce(
        new Error('Push notification failed'),
      );

      // Should not throw
      await expect(goalReconnectionJob.runOnce()).resolves.toBeUndefined();
    });

    it('should handle fatal error in detectCandidates gracefully', async () => {
      mockGoalReconnectionService.detectCandidates.mockRejectedValueOnce(
        new Error('Connection timeout'),
      );

      await expect(goalReconnectionJob.runOnce()).resolves.toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    afterEach(() => goalReconnectionJob.stop());

    it('should start and stop without throwing', () => {
      expect(() => goalReconnectionJob.start()).not.toThrow();
      expect(() => goalReconnectionJob.stop()).not.toThrow();
    });
  });
});
