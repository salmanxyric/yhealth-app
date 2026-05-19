/**
 * Voice Call Service — Unit Tests
 *
 * Tests for call initiation, status, history, ending, retry, and failure flows.
 *
 * Note: This project uses resetMocks: true globally, so mock implementations
 * set in beforeAll are stripped before each test. We use beforeEach to
 * re-import a fresh singleton for each test.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockVectorEmbedding = {
  createConversation: jest.fn<any>().mockResolvedValue('conv-123'),
  getConversation: jest.fn<any>().mockResolvedValue(null),
};

let voiceCallService: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockQuery.mockReset();
  mockVectorEmbedding.createConversation.mockReset().mockResolvedValue('conv-123');
  mockVectorEmbedding.getConversation.mockReset().mockResolvedValue(null);

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
    env: { featureFlags: { voiceCalls: true, chatCalls: true } },
  }));

  jest.unstable_mockModule('../../../src/services/vector-embedding.service.js', () => ({
    vectorEmbeddingService: mockVectorEmbedding,
  }));

  jest.unstable_mockModule('../../../src/services/call-summary.service.js', () => ({
    callSummaryService: {
      generateSummary: jest.fn<any>().mockResolvedValue({ summary: 'AI-generated summary' }),
    },
  }));

  jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
    class ApiError extends Error {
      statusCode: number;
      code?: string;
      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
      }
      static badRequest(msg: string) { return new ApiError(msg, 400); }
      static unauthorized(msg: string) { return new ApiError(msg, 401); }
      static notFound(msg: string) { return new ApiError(msg, 404); }
      static conflict(msg: string) { return new ApiError(msg, 409); }
      static tooManyRequests(msg: string) { return new ApiError(msg, 429); }
      static internal(msg: string) { return new ApiError(msg, 500); }
      static serviceUnavailable(msg: string) { return new ApiError(msg, 503); }
    }
    return { ApiError };
  });

  jest.resetModules();

  const mod = await import('../../../src/services/voice-call.service.js');
  voiceCallService = mod.voiceCallService;
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

function fakeCallRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'call-1',
    user_id: 'user-1',
    channel: 'mobile_app',
    status: 'initiating',
    session_id: null,
    conversation_id: null,
    session_type: 'quick_checkin',
    call_purpose: null,
    emergency_triggered: false,
    initiated_at: new Date('2026-05-19T10:00:00Z'),
    connected_at: null,
    ended_at: null,
    connection_duration: null,
    call_duration: null,
    webrtc_session_id: null,
    signaling_url: null,
    ice_servers: null,
    error_code: null,
    error_message: null,
    retry_count: 0,
    pre_call_context: null,
    call_summary: null,
    initiator_source: null,
    checkin_outcome: null,
    checkin_followup_sent_at: null,
    created_at: new Date('2026-05-19T10:00:00Z'),
    updated_at: new Date('2026-05-19T10:00:00Z'),
    ...overrides,
  };
}

/**
 * Mock the full initiateCall query sequence:
 * 1. UPDATE stale initiating calls (cleanup)
 * 2. SELECT recent active/connecting calls (rate limit)
 * 3. SELECT very recent initiating calls (duplicate check)
 * 4. SELECT information_schema for session_type (schema check)
 * 5. SELECT information_schema for call_purpose (schema check)
 * 6. INSERT INTO voice_calls (create call)
 * 7. SELECT information_schema for initiator_source (schema check)
 * 8. UPDATE initiator_source (optional)
 * 9. INSERT INTO voice_call_events (event log)
 * 10. UPDATE voice_calls SET webrtc (webrtc update)
 * 11. INSERT INTO voice_call_events (pre-warm event — not always present)
 * 12. UPDATE voice_calls SET session_id, conversation_id (conversation prewarm)
 */
function mockInitiateCallSequence(callRow?: Record<string, unknown>) {
  const row = fakeCallRow(callRow);
  mockQuery
    // 1. Cleanup stale initiating calls
    .mockResolvedValueOnce(pgResult([], 0))
    // 2. Rate limit check — no active/connecting calls
    .mockResolvedValueOnce(pgResult([]))
    // 3. Duplicate check — no very recent initiating calls
    .mockResolvedValueOnce(pgResult([]))
    // 4. Schema check: session_type exists
    .mockResolvedValueOnce(pgResult([{ exists: true }]))
    // 5. Schema check: call_purpose exists
    .mockResolvedValueOnce(pgResult([{ exists: true }]))
    // 6. INSERT call record
    .mockResolvedValueOnce(pgResult([row]))
    // 7. Schema check: initiator_source exists
    .mockResolvedValueOnce(pgResult([{ exists: true }]))
    // 8. UPDATE initiator_source
    .mockResolvedValueOnce(pgResult([], 1))
    // 9. INSERT event log (initiated)
    .mockResolvedValueOnce(pgResult([], 1))
    // 10. UPDATE webrtc session info
    .mockResolvedValueOnce(pgResult([], 1))
    // 11. UPDATE session_id + conversation_id (conversation prewarm)
    .mockResolvedValueOnce(pgResult([], 1));
}

// ============================================
// TESTS
// ============================================

describe('VoiceCallService', () => {
  // ------------------------------------------
  // initiateCall
  // ------------------------------------------
  describe('initiateCall', () => {
    it('creates a call and returns callId + webrtcConfig', async () => {
      mockInitiateCallSequence({ id: 'call-abc' });

      const result = await voiceCallService.initiateCall('user-1', {
        channel: 'mobile_app',
        session_type: 'quick_checkin',
      });

      expect(result).toEqual(
        expect.objectContaining({
          callId: 'call-abc',
          status: 'initiating',
          webrtcConfig: expect.objectContaining({
            signalingUrl: expect.stringContaining('call-abc'),
            iceServers: expect.any(Array),
          }),
        }),
      );

      // Verify the INSERT was called with correct params
      const insertCall = mockQuery.mock.calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes('INSERT INTO voice_calls'),
      );
      expect(insertCall).toBeDefined();
      expect(insertCall![1]).toContain('user-1');
      expect(insertCall![1]).toContain('mobile_app');
    });

    it('throws 429 when an active call exists within 5 minutes', async () => {
      const recentCall = fakeCallRow({
        status: 'active',
        initiated_at: new Date(), // just now — within 300s window
      });

      mockQuery
        // 1. Cleanup stale initiating calls
        .mockResolvedValueOnce(pgResult([], 0))
        // 2. Rate limit check — active call exists (recent)
        .mockResolvedValueOnce(pgResult([recentCall]));

      await expect(
        voiceCallService.initiateCall('user-1', {
          channel: 'mobile_app',
          session_type: 'quick_checkin',
        }),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 429 }));
    });

    it('rejects invalid session_type with 400', async () => {
      mockQuery
        // 1. Cleanup stale initiating calls
        .mockResolvedValueOnce(pgResult([], 0))
        // 2. Rate limit check — no active calls
        .mockResolvedValueOnce(pgResult([]))
        // 3. Duplicate check — no very recent initiating calls
        .mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.initiateCall('user-1', {
          channel: 'mobile_app',
          session_type: 'invalid_type' as any,
        }),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('defaults session_type to quick_checkin when not provided', async () => {
      mockInitiateCallSequence({ id: 'call-default' });

      const result = await voiceCallService.initiateCall('user-1', {
        channel: 'mobile_app',
      });

      expect(result.callId).toBe('call-default');
      expect(result.status).toBe('initiating');
    });

    it('cancels stale active/connecting calls older than 5 minutes', async () => {
      const staleCall = fakeCallRow({
        id: 'stale-call',
        status: 'connecting',
        initiated_at: new Date(Date.now() - 600_000), // 10 min ago
      });

      mockQuery
        // 1. Cleanup stale initiating calls
        .mockResolvedValueOnce(pgResult([], 0))
        // 2. Rate limit check — stale connecting call found (>300s old)
        .mockResolvedValueOnce(pgResult([staleCall]))
        // 2b. Cancel stale call
        .mockResolvedValueOnce(pgResult([], 1))
        // 3. Duplicate check
        .mockResolvedValueOnce(pgResult([]))
        // 4-11. Normal flow
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult([fakeCallRow({ id: 'new-call' })]))
        .mockResolvedValueOnce(pgResult([{ exists: true }]))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1));

      const result = await voiceCallService.initiateCall('user-1', {
        channel: 'mobile_app',
        session_type: 'quick_checkin',
      });

      expect(result.callId).toBe('new-call');

      // Verify the stale call was cancelled
      const cancelCall = mockQuery.mock.calls.find(
        (c: any) =>
          typeof c[0] === 'string' &&
          c[0].includes("SET status = 'cancelled'") &&
          c[1]?.includes?.('stale-call'),
      );
      expect(cancelCall).toBeDefined();
    });
  });

  // ------------------------------------------
  // getCallStatus
  // ------------------------------------------
  describe('getCallStatus', () => {
    it('returns status for a valid call', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakeCallRow({ status: 'active', connection_duration: 5, call_duration: null })]),
      );

      const result = await voiceCallService.getCallStatus('call-1', 'user-1');

      expect(result).toEqual(
        expect.objectContaining({
          status: 'active',
          connectionDuration: 5,
        }),
      );
      expect(result.callDuration).toBeUndefined();
    });

    it('includes error info when error_code and error_message are present', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          fakeCallRow({
            status: 'failed',
            error_code: 'TIMEOUT',
            error_message: 'Connection timed out',
          }),
        ]),
      );

      const result = await voiceCallService.getCallStatus('call-1', 'user-1');

      expect(result.error).toEqual({
        code: 'TIMEOUT',
        message: 'Connection timed out',
      });
    });

    it('uses default error values when only error_code is present', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          fakeCallRow({
            status: 'failed',
            error_code: 'NETWORK_ERROR',
            error_message: null,
          }),
        ]),
      );

      const result = await voiceCallService.getCallStatus('call-1', 'user-1');

      expect(result.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'An error occurred',
      });
    });

    it('throws 404 for a non-existent call', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.getCallStatus('no-such-call', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ------------------------------------------
  // getCall
  // ------------------------------------------
  describe('getCall', () => {
    it('returns the full call record', async () => {
      const row = fakeCallRow({ id: 'call-42', status: 'active' });
      mockQuery.mockResolvedValueOnce(pgResult([row]));

      const result = await voiceCallService.getCall('call-42', 'user-1');

      expect(result).toEqual(expect.objectContaining({ id: 'call-42', status: 'active' }));
    });

    it('throws 404 when not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.getCall('missing', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ------------------------------------------
  // getCallHistory
  // ------------------------------------------
  describe('getCallHistory', () => {
    it('returns paginated results with defaults', async () => {
      const calls = [fakeCallRow({ id: 'c1' }), fakeCallRow({ id: 'c2' })];
      // 1. COUNT query
      mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
      // 2. SELECT query
      mockQuery.mockResolvedValueOnce(pgResult(calls));

      const result = await voiceCallService.getCallHistory('user-1');

      expect(result).toEqual(
        expect.objectContaining({
          calls,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      );
    });

    it('caps limit at 100', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ count: '0' }]))
        .mockResolvedValueOnce(pgResult([]));

      const result = await voiceCallService.getCallHistory('user-1', { limit: 500 });

      expect(result.limit).toBe(100);

      // Verify the LIMIT param passed to the SELECT query
      const selectCall = mockQuery.mock.calls[1];
      const params = selectCall[1] as (string | number)[];
      // The limit value is the second-to-last param
      expect(params).toContain(100);
    });

    it('applies channel filter', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ count: '1' }]))
        .mockResolvedValueOnce(pgResult([fakeCallRow()]));

      await voiceCallService.getCallHistory('user-1', { channel: 'whatsapp' });

      // Verify the count query includes the channel filter
      const countSql = mockQuery.mock.calls[0][0] as string;
      expect(countSql).toContain('channel = $2');
      expect(mockQuery.mock.calls[0][1]).toContain('whatsapp');
    });

    it('applies status filter', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ count: '0' }]))
        .mockResolvedValueOnce(pgResult([]));

      await voiceCallService.getCallHistory('user-1', { status: 'ended' });

      const countSql = mockQuery.mock.calls[0][0] as string;
      expect(countSql).toContain('status = $2');
      expect(mockQuery.mock.calls[0][1]).toContain('ended');
    });

    it('applies date range filters', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      mockQuery
        .mockResolvedValueOnce(pgResult([{ count: '3' }]))
        .mockResolvedValueOnce(pgResult([]));

      await voiceCallService.getCallHistory('user-1', { startDate, endDate });

      const countSql = mockQuery.mock.calls[0][0] as string;
      expect(countSql).toContain('initiated_at >= $2');
      expect(countSql).toContain('initiated_at <= $3');
    });

    it('calculates correct pagination offsets', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ count: '50' }]))
        .mockResolvedValueOnce(pgResult([]));

      const result = await voiceCallService.getCallHistory('user-1', { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);

      // Verify offset = (3-1) * 10 = 20
      const selectParams = mockQuery.mock.calls[1][1] as (string | number)[];
      expect(selectParams).toContain(20);
    });
  });

  // ------------------------------------------
  // endCall
  // ------------------------------------------
  describe('endCall', () => {
    it('ends call and returns summary', async () => {
      const connectedAt = new Date(Date.now() - 120_000); // 2 min ago
      mockQuery
        // 1. SELECT call
        .mockResolvedValueOnce(
          pgResult([fakeCallRow({ status: 'active', connected_at: connectedAt, session_id: null })]),
        )
        // 2. UPDATE call ended
        .mockResolvedValueOnce(pgResult([], 1))
        // 3. INSERT event log
        .mockResolvedValueOnce(pgResult([], 1))
        // 4. Schema check for checkin_outcome column
        .mockResolvedValueOnce(pgResult([{ exists: false }]));

      const result = await voiceCallService.endCall('call-1', 'user-1', 'user_hangup');

      expect(result).toEqual(
        expect.objectContaining({
          callId: 'call-1',
          summary: expect.any(String),
          duration: expect.any(Number),
        }),
      );
      expect(result.duration).toBeGreaterThan(0);
    });

    it('returns existing summary if call is already ended', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([
          fakeCallRow({
            status: 'ended',
            call_summary: 'Previous summary',
            call_duration: 60,
          }),
        ]),
      );

      const result = await voiceCallService.endCall('call-1', 'user-1');

      expect(result).toEqual({
        callId: 'call-1',
        summary: 'Previous summary',
        duration: 60,
      });

      // Should not attempt UPDATE since call is already ended
      const updateCalls = mockQuery.mock.calls.filter(
        (c: any) => typeof c[0] === 'string' && c[0].includes('UPDATE voice_calls'),
      );
      expect(updateCalls.length).toBe(0);
    });

    it('throws 404 for unknown call', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.endCall('no-call', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('generates summary from conversation when session_id is present', async () => {
      const connectedAt = new Date(Date.now() - 30_000);
      mockVectorEmbedding.getConversation.mockResolvedValueOnce({
        conversation: { title: 'Discussed morning routine' },
      });

      mockQuery
        // 1. SELECT call with session_id
        .mockResolvedValueOnce(
          pgResult([
            fakeCallRow({ status: 'active', connected_at: connectedAt, session_id: 'sess-1' }),
          ]),
        )
        // 2. UPDATE call ended
        .mockResolvedValueOnce(pgResult([], 1))
        // 3. INSERT event log
        .mockResolvedValueOnce(pgResult([], 1))
        // 4. Schema check for checkin_outcome
        .mockResolvedValueOnce(pgResult([{ exists: false }]));

      const result = await voiceCallService.endCall('call-1', 'user-1');

      expect(result.summary).toBe('Discussed morning routine');
    });

    it('falls through to generateCallSummary when getConversation returns no conversation object', async () => {
      const connectedAt = new Date(Date.now() - 30_000);
      // First getConversation call (in endCall, limit 10) returns null conversation -> falls to generateCallSummary
      // Second getConversation call (in generateCallSummary, limit 50) returns messages
      mockVectorEmbedding.getConversation
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] });

      mockQuery
        .mockResolvedValueOnce(
          pgResult([
            fakeCallRow({ status: 'active', connected_at: connectedAt, session_id: 'sess-1' }),
          ]),
        )
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([{ exists: false }]));

      const result = await voiceCallService.endCall('call-1', 'user-1');

      expect(result.summary).toBe('AI-generated summary');
    });

    it('uses "Call completed" fallback when conversation title is null', async () => {
      const connectedAt = new Date(Date.now() - 30_000);
      // getConversation returns conversation object but title is null -> || fallback
      mockVectorEmbedding.getConversation
        .mockResolvedValueOnce({ conversation: { title: null } });

      mockQuery
        .mockResolvedValueOnce(
          pgResult([
            fakeCallRow({ status: 'active', connected_at: connectedAt, session_id: 'sess-1' }),
          ]),
        )
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([{ exists: false }]));

      const result = await voiceCallService.endCall('call-1', 'user-1');

      expect(result.summary).toBe('Call completed');
    });

    it('returns duration 0 when call was never connected', async () => {
      mockQuery
        .mockResolvedValueOnce(
          pgResult([fakeCallRow({ status: 'initiating', connected_at: null, session_id: null })]),
        )
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([{ exists: false }]));

      const result = await voiceCallService.endCall('call-1', 'user-1');

      expect(result.duration).toBe(0);
    });
  });

  // ------------------------------------------
  // markCallActive
  // ------------------------------------------
  describe('markCallActive', () => {
    it('updates status to active and calculates connection duration', async () => {
      const initiatedAt = new Date(Date.now() - 5_000); // 5s ago
      mockQuery
        // 1. SELECT call
        .mockResolvedValueOnce(
          pgResult([fakeCallRow({ status: 'connecting', initiated_at: initiatedAt, connected_at: null })]),
        )
        // 2. UPDATE status to active
        .mockResolvedValueOnce(pgResult([], 1))
        // 3. INSERT event log
        .mockResolvedValueOnce(pgResult([], 1));

      await voiceCallService.markCallActive('call-1', 'user-1');

      // Verify UPDATE was called with 'active' status
      const updateCall = mockQuery.mock.calls.find(
        (c: any) =>
          typeof c[0] === 'string' &&
          c[0].includes('UPDATE voice_calls') &&
          c[0].includes('status = $1'),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]![0]).toBe('active');
    });

    it('uses connected_at for duration calculation when available', async () => {
      const connectedAt = new Date(Date.now() - 10_000); // 10s ago
      mockQuery
        .mockResolvedValueOnce(
          pgResult([
            fakeCallRow({
              status: 'connecting',
              initiated_at: new Date(Date.now() - 30_000),
              connected_at: connectedAt,
            }),
          ]),
        )
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1));

      await voiceCallService.markCallActive('call-1', 'user-1');

      // connection_duration should be ~10 seconds (based on connected_at), not ~30
      const updateCall = mockQuery.mock.calls.find(
        (c: any) => typeof c[0] === 'string' && c[0].includes("SET status = $1"),
      );
      const duration = updateCall![1]![1] as number;
      expect(duration).toBeGreaterThanOrEqual(9);
      expect(duration).toBeLessThanOrEqual(12);
    });

    it('throws 404 for unknown call', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.markCallActive('no-call', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ------------------------------------------
  // retryConnection
  // ------------------------------------------
  describe('retryConnection', () => {
    it('resets to initiating and increments retry count', async () => {
      mockQuery
        // 1. SELECT call
        .mockResolvedValueOnce(
          pgResult([fakeCallRow({ status: 'failed', retry_count: 1 })]),
        )
        // 2. UPDATE retry
        .mockResolvedValueOnce(pgResult([], 1))
        // 3. INSERT event log
        .mockResolvedValueOnce(pgResult([], 1));

      const result = await voiceCallService.retryConnection('call-1', 'user-1');

      expect(result).toBe(true);

      // Verify UPDATE sets status to initiating
      const updateCall = mockQuery.mock.calls.find(
        (c: any) =>
          typeof c[0] === 'string' &&
          c[0].includes('SET status = $1') &&
          c[0].includes('retry_count = retry_count + 1'),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]![0]).toBe('initiating');
    });

    it('rejects when max retries (3) reached', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakeCallRow({ status: 'failed', retry_count: 3 })]),
      );

      await expect(
        voiceCallService.retryConnection('call-1', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('rejects when status is not retryable (active)', async () => {
      mockQuery.mockResolvedValueOnce(
        pgResult([fakeCallRow({ status: 'active', retry_count: 0 })]),
      );

      await expect(
        voiceCallService.retryConnection('call-1', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('allows retry from timeout state', async () => {
      mockQuery
        .mockResolvedValueOnce(
          pgResult([fakeCallRow({ status: 'timeout', retry_count: 0 })]),
        )
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1));

      const result = await voiceCallService.retryConnection('call-1', 'user-1');

      expect(result).toBe(true);
    });

    it('throws 404 for unknown call', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        voiceCallService.retryConnection('no-call', 'user-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ------------------------------------------
  // markCallFailed
  // ------------------------------------------
  describe('markCallFailed', () => {
    it('updates call to failed with error details', async () => {
      mockQuery
        // 1. UPDATE call to failed
        .mockResolvedValueOnce(pgResult([], 1))
        // 2. INSERT event log
        .mockResolvedValueOnce(pgResult([], 1));

      await voiceCallService.markCallFailed('call-1', 'NETWORK_ERROR', 'Connection lost');

      const updateCall = mockQuery.mock.calls[0];
      expect(updateCall[0]).toContain('UPDATE voice_calls');
      expect(updateCall[1]).toEqual(['failed', 'NETWORK_ERROR', 'Connection lost', 'call-1']);
    });

    it('does NOT throw on DB error (non-critical)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

      // Should resolve without throwing
      await expect(
        voiceCallService.markCallFailed('call-1', 'ERR', 'test'),
      ).resolves.toBeUndefined();
    });

    it('logs the event after updating', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([], 1))
        .mockResolvedValueOnce(pgResult([], 1));

      await voiceCallService.markCallFailed('call-1', 'TIMEOUT', 'Timed out');

      // Verify the event log INSERT
      const eventCall = mockQuery.mock.calls[1];
      expect(eventCall[0]).toContain('INSERT INTO voice_call_events');
      expect(eventCall[1]![0]).toBe('call-1');
      expect(eventCall[1]![1]).toBe('error_occurred');
    });
  });
});
