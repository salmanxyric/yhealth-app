/**
 * Call Summary Service — Unit Tests
 *
 * Tests summary generation, retrieval, pagination, and action item updates.
 *
 * Uses ESM mocking pattern: jest.unstable_mockModule() before await import().
 * beforeEach re-imports a fresh singleton for each test (resetMocks: true globally).
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockAiProvider = {
  generateCompletion: jest.fn<any>(),
};

let callSummaryService: any;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dbResult(rows: Record<string, unknown>[] = []) {
  return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] };
}

function fakeSummaryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sum-1',
    call_id: 'call-1',
    user_id: 'user-1',
    session_type: 'quick_checkin',
    depth_mode: 'light',
    summary: 'Good session',
    key_insights: JSON.stringify(['insight1', 'insight2']),
    emotional_trend: 'positive',
    duration: 120,
    generated_at: new Date('2026-05-19T10:00:00Z'),
    delivery_status: JSON.stringify({ app: false, whatsapp: false, push: false }),
    created_at: new Date('2026-05-19T10:00:00Z'),
    updated_at: new Date('2026-05-19T10:00:00Z'),
    ...overrides,
  };
}

function fakeActionItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ai-1',
    summary_id: 'sum-1',
    content: 'Do 30 min exercise',
    category: 'fitness',
    priority: 'high',
    due_date: null,
    status: 'pending',
    completed_at: null,
    reminder_set: false,
    created_at: new Date('2026-05-19T10:00:00Z'),
    updated_at: new Date('2026-05-19T10:00:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Module setup (fresh per test)
// ---------------------------------------------------------------------------

beforeEach(async () => {
  jest.restoreAllMocks();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/services/ai-provider.service.js', () => ({
    aiProviderService: mockAiProvider,
  }));

  jest.resetModules();
  mockQuery.mockReset();
  mockAiProvider.generateCompletion.mockReset();

  const mod = await import('../../../src/services/call-summary.service.js');
  callSummaryService = mod.callSummaryService;
});

// ===========================================================================
// generateSummary
// ===========================================================================

describe('CallSummaryService', () => {
  describe('generateSummary', () => {
    const baseOptions = {
      callId: 'call-1',
      userId: 'user-1',
      sessionType: 'quick_checkin' as const,
      duration: 120,
      conversationId: 'conv-1',
    };

    it('generates summary with AI and saves to DB', async () => {
      // 1. getConversationTranscript → rag_conversations messages
      mockQuery.mockResolvedValueOnce(
        dbResult([
          {
            messages: JSON.stringify([
              { role: 'user', content: 'Hi coach' },
              { role: 'assistant', content: 'Hello! How can I help?' },
            ]),
          },
        ]),
      );

      // 2. getEmotionTrend → dominant emotion
      mockQuery.mockResolvedValueOnce(
        dbResult([{ emotion_category: 'positive', count: '5' }]),
      );

      // 3. AI generateCompletion (summary)
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '{"summary": "Great session", "keyInsights": ["insight1"]}',
      });

      // 4. AI generateCompletion (action items)
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '[{"content": "Exercise daily", "category": "fitness", "priority": "high"}]',
      });

      // 5. saveSummary INSERT call_summaries
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'sum-1' }]));

      // 6. INSERT action_items
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'ai-1' }]));

      const result = await callSummaryService.generateSummary(baseOptions);

      expect(result.id).toBe('sum-1');
      expect(result.summary).toBe('Great session');
      expect(result.keyInsights).toEqual(['insight1']);
      expect(result.actionItems).toHaveLength(1);
      expect(result.actionItems[0].content).toBe('Exercise daily');
      expect(result.actionItems[0].category).toBe('fitness');
      expect(result.callId).toBe('call-1');
      expect(result.userId).toBe('user-1');
      expect(result.deliveryStatus).toEqual({ app: false, whatsapp: false, push: false });

      // Verify AI was called twice (summary + action items)
      expect(mockAiProvider.generateCompletion).toHaveBeenCalledTimes(2);

      // Verify summary INSERT was called
      const summaryInsertCall = mockQuery.mock.calls[2]; // 3rd query call
      expect(summaryInsertCall[0]).toContain('INSERT INTO call_summaries');
      expect(summaryInsertCall[1]).toEqual(
        expect.arrayContaining(['call-1', 'user-1']),
      );
    });

    it('uses deep mode by default for coaching_session type', async () => {
      const coachingOptions = {
        ...baseOptions,
        sessionType: 'coaching_session' as const,
      };

      // transcript
      mockQuery.mockResolvedValueOnce(
        dbResult([{ messages: JSON.stringify([{ role: 'user', content: 'Session talk' }]) }]),
      );
      // emotion trend
      mockQuery.mockResolvedValueOnce(dbResult([]));
      // AI summary
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '{"summary": "Deep coaching session", "keyInsights": ["a", "b", "c"]}',
      });
      // AI action items
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '[]',
      });
      // save summary
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'sum-2' }]));

      const result = await callSummaryService.generateSummary(coachingOptions);

      expect(result.depthMode).toBe('deep');

      // Verify the summary AI prompt mentions deep analysis — the first AI call
      // should include "comprehensive" since it's deep mode
      const summaryCall = mockAiProvider.generateCompletion.mock.calls[0];
      expect(summaryCall[0].userPrompt).toContain('comprehensive');
    });

    it('returns default summary when AI fails', async () => {
      // transcript
      mockQuery.mockResolvedValueOnce(
        dbResult([{ messages: JSON.stringify([{ role: 'user', content: 'Hello' }]) }]),
      );
      // emotion trend
      mockQuery.mockResolvedValueOnce(dbResult([]));

      // AI generateCompletion for summary fails
      mockAiProvider.generateCompletion.mockRejectedValueOnce(new Error('AI unavailable'));

      // AI generateCompletion for action items — also called after fallback summary
      mockAiProvider.generateCompletion.mockRejectedValueOnce(new Error('AI unavailable'));

      // save summary (still called with fallback content)
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'sum-fallback' }]));

      const result = await callSummaryService.generateSummary(baseOptions);

      expect(result.id).toBe('sum-fallback');
      // Fallback summary includes the session type label
      expect(result.summary).toContain('Quick Check-In');
      expect(result.summary).toContain('completed');
      // Fallback key insights
      expect(result.keyInsights).toEqual(['Session completed', 'Continue your health journey']);
      // Action items should be empty since AI failed
      expect(result.actionItems).toEqual([]);
    });

    it('falls back to voice_call_events when no conversationId provided', async () => {
      const noConvOptions = {
        ...baseOptions,
        conversationId: undefined,
      };

      // voice_call_events fallback
      mockQuery.mockResolvedValueOnce(
        dbResult([
          { event_data: JSON.stringify({ transcript: 'User said hello' }) },
          { event_data: JSON.stringify({ response: 'AI said hi back' }) },
        ]),
      );
      // emotion trend
      mockQuery.mockResolvedValueOnce(dbResult([{ emotion_category: 'neutral', count: '3' }]));
      // AI summary
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '{"summary": "Brief check-in", "keyInsights": ["all good"]}',
      });
      // AI action items
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '[]',
      });
      // save summary
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'sum-3' }]));

      const result = await callSummaryService.generateSummary(noConvOptions);

      expect(result.id).toBe('sum-3');
      expect(result.summary).toBe('Brief check-in');

      // First query should hit voice_call_events (not rag_conversations)
      const firstQuerySql = mockQuery.mock.calls[0][0];
      expect(firstQuerySql).toContain('voice_call_events');
    });

    it('handles empty transcript gracefully', async () => {
      // rag_conversations returns no rows, voice_call_events also empty
      mockQuery
        .mockResolvedValueOnce(dbResult([])) // rag_conversations
        .mockResolvedValueOnce(dbResult([])); // voice_call_events (fallback within getConversationTranscript when conversationId provided but no results)

      // Wait — if conversationId is provided and rag_conversations returns empty,
      // it falls back to voice_call_events. Let me re-check the service logic.
      // Actually, looking at the service: if conversationId is provided and result is empty,
      // it falls through to the voice_call_events query. So we need two DB results.

      // emotion trend
      mockQuery.mockResolvedValueOnce(dbResult([]));
      // AI summary
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '{"summary": "Session completed", "keyInsights": []}',
      });
      // AI action items
      mockAiProvider.generateCompletion.mockResolvedValueOnce({
        content: '[]',
      });
      // save summary
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'sum-empty' }]));

      const result = await callSummaryService.generateSummary(baseOptions);

      expect(result.id).toBe('sum-empty');
      expect(result.actionItems).toEqual([]);
    });
  });

  // =========================================================================
  // getSummaryByCallId
  // =========================================================================

  describe('getSummaryByCallId', () => {
    it('returns summary with action items when found', async () => {
      // SELECT from call_summaries
      mockQuery.mockResolvedValueOnce(dbResult([fakeSummaryRow()]));
      // SELECT from action_items
      mockQuery.mockResolvedValueOnce(dbResult([fakeActionItemRow()]));

      const result = await callSummaryService.getSummaryByCallId('call-1');

      expect(result).not.toBeNull();
      expect(result.id).toBe('sum-1');
      expect(result.callId).toBe('call-1');
      expect(result.summary).toBe('Good session');
      expect(result.keyInsights).toEqual(['insight1', 'insight2']);
      expect(result.actionItems).toHaveLength(1);
      expect(result.actionItems[0].id).toBe('ai-1');
      expect(result.actionItems[0].content).toBe('Do 30 min exercise');
      expect(result.actionItems[0].category).toBe('fitness');
      expect(result.actionItems[0].priority).toBe('high');
      expect(result.actionItems[0].status).toBe('pending');
      expect(result.emotionalTrend).toBe('positive');
      expect(result.deliveryStatus).toEqual({ app: false, whatsapp: false, push: false });
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce(dbResult([]));

      const result = await callSummaryService.getSummaryByCallId('nonexistent-call');

      expect(result).toBeNull();
    });

    it('returns null on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));

      const result = await callSummaryService.getSummaryByCallId('call-1');

      expect(result).toBeNull();
    });

    it('handles key_insights as pre-parsed array', async () => {
      mockQuery.mockResolvedValueOnce(
        dbResult([fakeSummaryRow({ key_insights: ['already', 'parsed'] })]),
      );
      mockQuery.mockResolvedValueOnce(dbResult([]));

      const result = await callSummaryService.getSummaryByCallId('call-1');

      expect(result.keyInsights).toEqual(['already', 'parsed']);
    });
  });

  // =========================================================================
  // getSummariesForUser
  // =========================================================================

  describe('getSummariesForUser', () => {
    it('returns paginated summaries with action items', async () => {
      // COUNT query
      mockQuery.mockResolvedValueOnce(dbResult([{ count: '2' }]));
      // SELECT call_summaries
      mockQuery.mockResolvedValueOnce(
        dbResult([
          fakeSummaryRow({ id: 'sum-1', call_id: 'call-1' }),
          fakeSummaryRow({ id: 'sum-2', call_id: 'call-2' }),
        ]),
      );
      // action_items for sum-1
      mockQuery.mockResolvedValueOnce(
        dbResult([fakeActionItemRow({ id: 'ai-1', summary_id: 'sum-1' })]),
      );
      // action_items for sum-2
      mockQuery.mockResolvedValueOnce(
        dbResult([fakeActionItemRow({ id: 'ai-2', summary_id: 'sum-2', content: 'Drink more water' })]),
      );

      const result = await callSummaryService.getSummariesForUser('user-1', { page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.summaries).toHaveLength(2);
      expect(result.summaries[0].id).toBe('sum-1');
      expect(result.summaries[1].id).toBe('sum-2');
      expect(result.summaries[0].actionItems).toHaveLength(1);
      expect(result.summaries[1].actionItems[0].content).toBe('Drink more water');
    });

    it('returns empty array when none exist', async () => {
      // COUNT query
      mockQuery.mockResolvedValueOnce(dbResult([{ count: '0' }]));
      // SELECT call_summaries (empty)
      mockQuery.mockResolvedValueOnce(dbResult([]));

      const result = await callSummaryService.getSummariesForUser('user-no-summaries');

      expect(result.total).toBe(0);
      expect(result.summaries).toEqual([]);
    });

    it('uses default pagination when no options provided', async () => {
      mockQuery.mockResolvedValueOnce(dbResult([{ count: '0' }]));
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await callSummaryService.getSummariesForUser('user-1');

      // SELECT query should use default limit=20 and offset=0
      const selectCall = mockQuery.mock.calls[1];
      expect(selectCall[1]).toEqual(['user-1', 20, 0]);
    });

    it('caps limit at 50', async () => {
      mockQuery.mockResolvedValueOnce(dbResult([{ count: '0' }]));
      mockQuery.mockResolvedValueOnce(dbResult([]));

      await callSummaryService.getSummariesForUser('user-1', { limit: 100 });

      const selectCall = mockQuery.mock.calls[1];
      expect(selectCall[1]).toEqual(['user-1', 50, 0]);
    });

    it('returns empty result on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB timeout'));

      const result = await callSummaryService.getSummariesForUser('user-1');

      expect(result.summaries).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // =========================================================================
  // updateActionItemStatus
  // =========================================================================

  describe('updateActionItemStatus', () => {
    it('updates status and sets completedAt for completed items', async () => {
      const completedAt = new Date('2026-05-19T12:00:00Z');

      // Ownership verification
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'ai-1' }]));

      // UPDATE RETURNING
      mockQuery.mockResolvedValueOnce(
        dbResult([
          fakeActionItemRow({
            status: 'completed',
            completed_at: completedAt,
          }),
        ]),
      );

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'user-1', 'completed');

      expect(result).not.toBeNull();
      expect(result.status).toBe('completed');
      expect(result.completedAt).toEqual(completedAt);

      // Verify ownership check query
      const verifyCall = mockQuery.mock.calls[0];
      expect(verifyCall[0]).toContain('action_items');
      expect(verifyCall[0]).toContain('call_summaries');
      expect(verifyCall[1]).toEqual(['ai-1', 'user-1']);

      // Verify update query passes completedAt (not null) for completed status
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toContain('UPDATE action_items');
      expect(updateCall[1][0]).toBe('completed');
      expect(updateCall[1][1]).toBeInstanceOf(Date); // completedAt should be a Date
      expect(updateCall[1][2]).toBe('ai-1');
    });

    it('sets completedAt to null for non-completed status', async () => {
      // Ownership verification
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'ai-1' }]));

      // UPDATE RETURNING
      mockQuery.mockResolvedValueOnce(
        dbResult([fakeActionItemRow({ status: 'in_progress', completed_at: null })]),
      );

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'user-1', 'in_progress');

      expect(result).not.toBeNull();
      expect(result.status).toBe('in_progress');
      expect(result.completedAt).toBeUndefined(); // mapped from null to undefined

      // Verify completedAt is null in the query params
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[1][1]).toBeNull();
    });

    it('returns null when not owned by user', async () => {
      // Ownership verification — empty result means not owned
      mockQuery.mockResolvedValueOnce(dbResult([]));

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'wrong-user', 'completed');

      expect(result).toBeNull();
      // Should only have called one query (ownership check), not the update
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('returns null on database error', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'user-1', 'completed');

      expect(result).toBeNull();
    });

    it('updates to dismissed status without completedAt', async () => {
      mockQuery.mockResolvedValueOnce(dbResult([{ id: 'ai-1' }]));
      mockQuery.mockResolvedValueOnce(
        dbResult([fakeActionItemRow({ status: 'dismissed', completed_at: null })]),
      );

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'user-1', 'dismissed');

      expect(result).not.toBeNull();
      expect(result.status).toBe('dismissed');
      expect(result.completedAt).toBeUndefined();

      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[1][1]).toBeNull();
    });
  });
});
