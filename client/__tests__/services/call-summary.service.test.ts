/**
 * Call Summary Service Tests
 *
 * Unit tests for the client-side call summary service.
 * Covers all 5 API methods, 4 pure helper functions with edge cases,
 * and parameter serialization for URLSearchParams.
 *
 * @module __tests__/services/call-summary.service.test
 */

// ---------------------------------------------------------------------------
// Mock: @/lib/api-client
// ---------------------------------------------------------------------------

jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

// Import after mock
import { api } from '@/lib/api-client';
import {
  callSummaryService,
  getCategoryColor,
  getCategoryIcon,
  getPriorityColor,
  formatDuration,
} from '@/src/shared/services/call-summary.service';
import type { ActionCategory } from '@/src/shared/services/call-summary.service';

// Re-acquire mock references in beforeEach to survive resetMocks
let mockGet: jest.Mock;
let mockPost: jest.Mock;
let mockPatch: jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok<T>(data: T) {
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Call Summary Service', () => {
  beforeEach(() => {
    mockGet = api.get as jest.Mock;
    mockPost = api.post as jest.Mock;
    mockPatch = api.patch as jest.Mock;
  });

  // =========================================================================
  // getSummaries
  // =========================================================================

  describe('getSummaries', () => {
    it('should GET /call-summaries with no query params when called without arguments', async () => {
      mockGet.mockResolvedValueOnce(ok({ summaries: [], pagination: {} }));

      await callSummaryService.getSummaries();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/call-summaries');
    });

    it('should GET /call-summaries with no query params when called with empty object', async () => {
      mockGet.mockResolvedValueOnce(ok({ summaries: [], pagination: {} }));

      await callSummaryService.getSummaries({});

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/call-summaries');
    });

    it('should append page and limit as query parameters', async () => {
      mockGet.mockResolvedValueOnce(ok({ summaries: [], pagination: {} }));

      await callSummaryService.getSummaries({ page: 2, limit: 10 });

      expect(mockGet).toHaveBeenCalledWith('/call-summaries?page=2&limit=10');
    });

    it('should append only page when limit is not provided', async () => {
      mockGet.mockResolvedValueOnce(ok({ summaries: [], pagination: {} }));

      await callSummaryService.getSummaries({ page: 3 });

      expect(mockGet).toHaveBeenCalledWith('/call-summaries?page=3');
    });

    it('should append only limit when page is not provided', async () => {
      mockGet.mockResolvedValueOnce(ok({ summaries: [], pagination: {} }));

      await callSummaryService.getSummaries({ limit: 25 });

      expect(mockGet).toHaveBeenCalledWith('/call-summaries?limit=25');
    });

    it('should return the API response', async () => {
      const payload = {
        summaries: [{ id: 's1', callId: 'c1' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      mockGet.mockResolvedValueOnce(ok(payload));

      const result = await callSummaryService.getSummaries();

      expect(result).toEqual(ok(payload));
    });
  });

  // =========================================================================
  // getSummaryByCallId
  // =========================================================================

  describe('getSummaryByCallId', () => {
    it('should GET /call-summaries/:callId', async () => {
      mockGet.mockResolvedValueOnce(ok({ id: 's1', callId: 'call-abc' }));

      await callSummaryService.getSummaryByCallId('call-abc');

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/call-summaries/call-abc');
    });

    it('should return the API response', async () => {
      const summary = { id: 's1', callId: 'call-abc', summary: 'Great session' };
      mockGet.mockResolvedValueOnce(ok(summary));

      const result = await callSummaryService.getSummaryByCallId('call-abc');

      expect(result).toEqual(ok(summary));
    });
  });

  // =========================================================================
  // generateSummary
  // =========================================================================

  describe('generateSummary', () => {
    it('should POST to /call-summaries/generate with the provided data', async () => {
      const data = {
        callId: 'call-123',
        sessionType: 'coaching',
        depthMode: 'deep' as const,
        conversationId: 'conv-456',
        duration: 300,
      };
      mockPost.mockResolvedValueOnce(ok({ id: 's1' }));

      await callSummaryService.generateSummary(data);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith('/call-summaries/generate', data);
    });

    it('should work with only required fields', async () => {
      const data = {
        callId: 'call-789',
        sessionType: 'check-in',
        duration: 120,
      };
      mockPost.mockResolvedValueOnce(ok({ id: 's2' }));

      await callSummaryService.generateSummary(data);

      expect(mockPost).toHaveBeenCalledWith('/call-summaries/generate', data);
    });

    it('should return the API response', async () => {
      const summary = { id: 's1', callId: 'call-123', summary: 'Session summary' };
      mockPost.mockResolvedValueOnce(ok(summary));

      const result = await callSummaryService.generateSummary({
        callId: 'call-123',
        sessionType: 'coaching',
        duration: 300,
      });

      expect(result).toEqual(ok(summary));
    });
  });

  // =========================================================================
  // updateActionItemStatus
  // =========================================================================

  describe('updateActionItemStatus', () => {
    it('should PATCH /call-summaries/action-items/:id with status payload', async () => {
      mockPatch.mockResolvedValueOnce(ok({ id: 'ai-1', status: 'completed' }));

      await callSummaryService.updateActionItemStatus('ai-1', 'completed');

      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith(
        '/call-summaries/action-items/ai-1',
        { status: 'completed' }
      );
    });

    it('should return the API response', async () => {
      const actionItem = { id: 'ai-1', status: 'in_progress' };
      mockPatch.mockResolvedValueOnce(ok(actionItem));

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'in_progress');

      expect(result).toEqual(ok(actionItem));
    });
  });

  // =========================================================================
  // getPendingActionItems
  // =========================================================================

  describe('getPendingActionItems', () => {
    it('should GET /call-summaries/action-items/pending', async () => {
      mockGet.mockResolvedValueOnce(ok({ actionItems: [] }));

      await callSummaryService.getPendingActionItems();

      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith('/call-summaries/action-items/pending');
    });

    it('should return the API response', async () => {
      const payload = { actionItems: [{ id: 'ai-1', status: 'pending' }] };
      mockGet.mockResolvedValueOnce(ok(payload));

      const result = await callSummaryService.getPendingActionItems();

      expect(result).toEqual(ok(payload));
    });
  });

  // =========================================================================
  // getCategoryColor
  // =========================================================================

  describe('getCategoryColor', () => {
    const categoryColorMap: [ActionCategory, string][] = [
      ['fitness', '#f97316'],
      ['nutrition', '#22c55e'],
      ['sleep', '#8b5cf6'],
      ['stress', '#ef4444'],
      ['wellness', '#3b82f6'],
      ['goal', '#eab308'],
      ['habit', '#06b6d4'],
      ['follow_up', '#6b7280'],
    ];

    it.each(categoryColorMap)(
      'should return %s for category "%s"',
      (category, expectedColor) => {
        expect(getCategoryColor(category)).toBe(expectedColor);
      }
    );

    it('should return default gray for unknown category', () => {
      expect(getCategoryColor('unknown' as ActionCategory)).toBe('#6b7280');
    });
  });

  // =========================================================================
  // getCategoryIcon
  // =========================================================================

  describe('getCategoryIcon', () => {
    const categoryIconMap: [ActionCategory, string][] = [
      ['fitness', 'dumbbell'],
      ['nutrition', 'utensils'],
      ['sleep', 'moon'],
      ['stress', 'heart'],
      ['wellness', 'sparkles'],
      ['goal', 'target'],
      ['habit', 'repeat'],
      ['follow_up', 'calendar'],
    ];

    it.each(categoryIconMap)(
      'should return "%s" icon for category "%s"',
      (category, expectedIcon) => {
        expect(getCategoryIcon(category)).toBe(expectedIcon);
      }
    );

    it('should return "check" for unknown category', () => {
      expect(getCategoryIcon('unknown' as ActionCategory)).toBe('check');
    });
  });

  // =========================================================================
  // getPriorityColor
  // =========================================================================

  describe('getPriorityColor', () => {
    it('should return red for high priority', () => {
      expect(getPriorityColor('high')).toBe('#ef4444');
    });

    it('should return amber for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('#f59e0b');
    });

    it('should return green for low priority', () => {
      expect(getPriorityColor('low')).toBe('#22c55e');
    });
  });

  // =========================================================================
  // formatDuration
  // =========================================================================

  describe('formatDuration', () => {
    it('should format 0 seconds as "0s"', () => {
      expect(formatDuration(0)).toBe('0s');
    });

    it('should format seconds-only durations', () => {
      expect(formatDuration(30)).toBe('30s');
    });

    it('should format exactly 1 minute as "1m"', () => {
      expect(formatDuration(60)).toBe('1m');
    });

    it('should format minutes with remaining seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('should format larger durations correctly', () => {
      expect(formatDuration(125)).toBe('2m 5s');
    });

    it('should format exact multiple of 60 as minutes only', () => {
      expect(formatDuration(300)).toBe('5m');
    });

    it('should format 59 seconds without minutes', () => {
      expect(formatDuration(59)).toBe('59s');
    });
  });
});
