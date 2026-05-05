/**
 * @file Coach Profile Generation Job Tests
 * Tests for timezone-aware coaching profile regeneration.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Mocks (BEFORE dynamic imports) ──────────────────────────

const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

const mockUserCoachingProfileService = {
  archiveProfile: jest.fn<any>().mockResolvedValue(undefined),
  generateProfile: jest.fn<any>().mockResolvedValue({ id: 'profile-1' }),
  updateStableTraits: jest.fn<any>().mockResolvedValue(undefined),
};
jest.unstable_mockModule('../../../src/services/user-coaching-profile.service.js', () => ({
  userCoachingProfileService: mockUserCoachingProfileService,
}));

const mockLlmCircuitBreaker = {
  isCallAllowed: jest.fn<any>().mockReturnValue(true),
  getStatus: jest.fn().mockReturnValue({ cooldownRemaining: 0, consecutiveFailures: 0 }),
};
jest.unstable_mockModule('../../../src/services/llm-circuit-breaker.service.js', () => ({
  llmCircuitBreaker: mockLlmCircuitBreaker,
}));

// ── Dynamic imports ─────────────────────────────────────────

const { coachProfileGenerationJob } = await import(
  '../../../src/jobs/coach-profile-generation.job.js'
);
const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ── Tests ───────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Re-set defaults after clearAllMocks wipes implementations
  mockUserCoachingProfileService.archiveProfile.mockResolvedValue(undefined);
  mockUserCoachingProfileService.generateProfile.mockResolvedValue({ id: 'profile-1' });
  mockUserCoachingProfileService.updateStableTraits.mockResolvedValue(undefined);
  mockLlmCircuitBreaker.isCallAllowed.mockReturnValue(true);
  mockLlmCircuitBreaker.getStatus.mockReturnValue({ cooldownRemaining: 0, consecutiveFailures: 0 });
});

describe('CoachProfileGenerationJob', () => {
  describe('processNow', () => {
    it('should archive, generate, and update traits for stale users', async () => {
      const users = [{ id: 'u1' }, { id: 'u2' }];
      mockQuery.mockResolvedValueOnce(pgResult(users));

      await coachProfileGenerationJob.processNow();

      expect(mockUserCoachingProfileService.archiveProfile).toHaveBeenCalledWith('u1');
      expect(mockUserCoachingProfileService.archiveProfile).toHaveBeenCalledWith('u2');
      expect(mockUserCoachingProfileService.generateProfile).toHaveBeenCalledWith('u1');
      expect(mockUserCoachingProfileService.generateProfile).toHaveBeenCalledWith('u2');
      expect(mockUserCoachingProfileService.updateStableTraits).toHaveBeenCalledTimes(2);
    });

    it('should do nothing when no users need profile updates', async () => {
      mockQuery.mockResolvedValueOnce(pgEmpty());

      await coachProfileGenerationJob.processNow();

      expect(mockUserCoachingProfileService.archiveProfile).not.toHaveBeenCalled();
      expect(mockUserCoachingProfileService.generateProfile).not.toHaveBeenCalled();
    });

    it('should skip run when LLM circuit breaker is open', async () => {
      mockLlmCircuitBreaker.isCallAllowed.mockReturnValue(false);

      await coachProfileGenerationJob.processNow();

      expect(mockQuery).not.toHaveBeenCalled();
      expect(mockUserCoachingProfileService.generateProfile).not.toHaveBeenCalled();
    });

    it('should continue processing when one user fails', async () => {
      const users = [{ id: 'u1' }, { id: 'u2' }];
      mockQuery.mockResolvedValueOnce(pgResult(users));

      mockUserCoachingProfileService.generateProfile
        .mockRejectedValueOnce(new Error('OpenAI rate limit'))
        .mockResolvedValueOnce({ id: 'profile-2' });

      await coachProfileGenerationJob.processNow();

      // Both should be attempted (Promise.allSettled)
      expect(mockUserCoachingProfileService.archiveProfile).toHaveBeenCalledTimes(2);
      expect(mockUserCoachingProfileService.generateProfile).toHaveBeenCalledTimes(2);
    });

    it('should treat stable traits update failure as non-fatal', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'u1' }]));
      mockUserCoachingProfileService.updateStableTraits.mockRejectedValueOnce(
        new Error('Traits analysis failed'),
      );

      // Should not throw — traits update is wrapped in .catch()
      await expect(coachProfileGenerationJob.processNow()).resolves.toBeUndefined();

      // Profile should still have been generated
      expect(mockUserCoachingProfileService.generateProfile).toHaveBeenCalledWith('u1');
    });

    it('should handle fatal database error gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Connection pool exhausted'));

      await expect(coachProfileGenerationJob.processNow()).resolves.toBeUndefined();
    });
  });

  describe('lifecycle', () => {
    afterEach(() => coachProfileGenerationJob.stop());

    it('should start and stop without throwing', () => {
      expect(() => coachProfileGenerationJob.start()).not.toThrow();
      expect(() => coachProfileGenerationJob.stop()).not.toThrow();
    });

    it('should report isRunning state', () => {
      expect(coachProfileGenerationJob.isRunning()).toBe(false);
      coachProfileGenerationJob.start();
      expect(coachProfileGenerationJob.isRunning()).toBe(true);
      coachProfileGenerationJob.stop();
      expect(coachProfileGenerationJob.isRunning()).toBe(false);
    });
  });
});
