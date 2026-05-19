/**
 * Voice Call Service - Unit Tests
 *
 * Tests for voiceCallService (10 methods, ~17 test cases).
 * Validates API delegation, correct endpoints, HTTP methods,
 * query parameter construction, and Idempotency-Key header.
 *
 * @module __tests__/services/voice-call.service.test
 */

// ---------------------------------------------------------------------------
// Mock: @/lib/api-client
// ---------------------------------------------------------------------------
jest.mock('@/lib/api-client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Must import AFTER jest.mock so the mock is in place
import { api } from '@/lib/api-client';
import { voiceCallService } from '@/src/shared/services/voice-call.service';

import type {
  CallInitiationRequest,
  CallInitiationResponse,
  CallStatusResponse,
  CallHistoryResponse,
  VoiceCall,
  VoiceCallSummary,
  WebRTCOffer,
  WebRTCAnswer,
  RTCIceCandidate,
} from '@/src/shared/services/voice-call.service';

// Typed mock reference
const mockApi = api as jest.Mocked<typeof api>;

// ---------------------------------------------------------------------------
// Mock: crypto.randomUUID (used by initiate for Idempotency-Key)
// ---------------------------------------------------------------------------
const MOCK_UUID = '550e8400-e29b-41d4-a716-446655440000';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: () => MOCK_UUID,
  configurable: true,
  writable: true,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a successful ApiResponse wrapper */
function ok<T>(data: T) {
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('voiceCallService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. initiate
  // =========================================================================
  describe('initiate', () => {
    const request: CallInitiationRequest = {
      channel: 'mobile_app',
      pre_call_context: 'User wants fitness advice',
      call_purpose: 'workout',
    };

    const response: CallInitiationResponse = {
      callId: 'call-001',
      webrtcConfig: {
        signalingUrl: 'wss://signal.example.com',
        iceServers: [{ urls: 'stun:stun.example.com' }],
      },
      status: 'initiating',
    };

    it('should POST to /voice-calls/initiate with request data', async () => {
      mockApi.post.mockResolvedValueOnce(ok(response));

      await voiceCallService.initiate(request);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/initiate',
        request,
        expect.objectContaining({
          headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
        })
      );
    });

    it('should include Idempotency-Key header as valid UUID', async () => {
      mockApi.post.mockResolvedValueOnce(ok(response));

      await voiceCallService.initiate(request);

      const callArgs = mockApi.post.mock.calls[0];
      const headers = callArgs[2]?.headers as Record<string, string>;
      expect(headers['Idempotency-Key']).toMatch(UUID_PATTERN);
    });

    it('should return the API response', async () => {
      mockApi.post.mockResolvedValueOnce(ok(response));

      const result = await voiceCallService.initiate(request);

      expect(result).toEqual(ok(response));
    });
  });

  // =========================================================================
  // 2. getStatus
  // =========================================================================
  describe('getStatus', () => {
    it('should GET the correct status endpoint with callId', async () => {
      const statusResponse: CallStatusResponse = {
        status: 'active',
        connectionDuration: 120,
        callDuration: 95,
      };
      mockApi.get.mockResolvedValueOnce(ok(statusResponse));

      const result = await voiceCallService.getStatus('call-123');

      expect(mockApi.get).toHaveBeenCalledWith('/voice-calls/call-123/status');
      expect(result).toEqual(ok(statusResponse));
    });
  });

  // =========================================================================
  // 3. endCall
  // =========================================================================
  describe('endCall', () => {
    const summary: VoiceCallSummary = {
      callId: 'call-123',
      summary: 'Discussed workout routine',
      duration: 300,
      keyTopics: ['exercise', 'nutrition'],
    };

    it('should POST to the end endpoint with a reason', async () => {
      mockApi.post.mockResolvedValueOnce(ok(summary));

      await voiceCallService.endCall('call-123', 'user_hangup');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-123/end',
        { reason: 'user_hangup' }
      );
    });

    it('should POST with undefined reason when not provided', async () => {
      mockApi.post.mockResolvedValueOnce(ok(summary));

      await voiceCallService.endCall('call-456');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-456/end',
        { reason: undefined }
      );
    });
  });

  // =========================================================================
  // 4. getHistory
  // =========================================================================
  describe('getHistory', () => {
    const historyResponse: CallHistoryResponse = {
      calls: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    it('should GET /voice-calls/history with no query string when no params provided', async () => {
      mockApi.get.mockResolvedValueOnce(ok(historyResponse));

      await voiceCallService.getHistory();

      expect(mockApi.get).toHaveBeenCalledWith('/voice-calls/history');
    });

    it('should GET /voice-calls/history with no query string when empty params object provided', async () => {
      mockApi.get.mockResolvedValueOnce(ok(historyResponse));

      await voiceCallService.getHistory({});

      expect(mockApi.get).toHaveBeenCalledWith('/voice-calls/history');
    });

    it('should append all query params when all are provided', async () => {
      mockApi.get.mockResolvedValueOnce(ok(historyResponse));

      await voiceCallService.getHistory({
        page: 2,
        limit: 25,
        channel: 'whatsapp',
        status: 'ended',
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/voice-calls/history?page=2&limit=25&channel=whatsapp&status=ended'
      );
    });

    it('should append only provided params (partial)', async () => {
      mockApi.get.mockResolvedValueOnce(ok(historyResponse));

      await voiceCallService.getHistory({ page: 3, status: 'active' });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/voice-calls/history?page=3&status=active'
      );
    });
  });

  // =========================================================================
  // 5. getCall
  // =========================================================================
  describe('getCall', () => {
    it('should GET the correct call detail endpoint', async () => {
      const callData = { id: 'call-789' } as VoiceCall;
      mockApi.get.mockResolvedValueOnce(ok(callData));

      const result = await voiceCallService.getCall('call-789');

      expect(mockApi.get).toHaveBeenCalledWith('/voice-calls/call-789');
      expect(result).toEqual(ok(callData));
    });
  });

  // =========================================================================
  // 6. handleOffer
  // =========================================================================
  describe('handleOffer', () => {
    it('should POST the WebRTC offer to the correct endpoint', async () => {
      const offer: WebRTCOffer = { sdp: 'v=0\r\n...', type: 'offer' };
      const answer: WebRTCAnswer = { sdp: 'v=0\r\n...answer', type: 'answer' };
      mockApi.post.mockResolvedValueOnce(ok({ answer }));

      const result = await voiceCallService.handleOffer('call-100', offer);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-100/offer',
        offer
      );
      expect(result).toEqual(ok({ answer }));
    });
  });

  // =========================================================================
  // 7. handleIceCandidate
  // =========================================================================
  describe('handleIceCandidate', () => {
    it('should POST the ICE candidate to the correct endpoint', async () => {
      const candidate: RTCIceCandidate = {
        candidate: 'candidate:1 1 udp 2130706431 192.168.1.1 5000 typ host',
        sdpMLineIndex: 0,
        sdpMid: 'audio',
      };
      mockApi.post.mockResolvedValueOnce(ok({ success: true }));

      const result = await voiceCallService.handleIceCandidate('call-200', candidate);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-200/ice-candidate',
        candidate
      );
      expect(result).toEqual(ok({ success: true }));
    });
  });

  // =========================================================================
  // 8. getIceServers
  // =========================================================================
  describe('getIceServers', () => {
    it('should GET ICE servers for the given call', async () => {
      const iceServers = { iceServers: [{ urls: 'turn:turn.example.com' }] };
      mockApi.get.mockResolvedValueOnce(ok(iceServers));

      const result = await voiceCallService.getIceServers('call-300');

      expect(mockApi.get).toHaveBeenCalledWith('/voice-calls/call-300/ice-servers');
      expect(result).toEqual(ok(iceServers));
    });
  });

  // =========================================================================
  // 9. markActive
  // =========================================================================
  describe('markActive', () => {
    it('should POST to the active endpoint with an empty body', async () => {
      mockApi.post.mockResolvedValueOnce(ok({ success: true }));

      const result = await voiceCallService.markActive('call-400');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-400/active',
        {}
      );
      expect(result).toEqual(ok({ success: true }));
    });
  });

  // =========================================================================
  // 10. retry
  // =========================================================================
  describe('retry', () => {
    it('should POST to the retry endpoint with an empty body', async () => {
      mockApi.post.mockResolvedValueOnce(ok({ success: true }));

      const result = await voiceCallService.retry('call-500');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/voice-calls/call-500/retry',
        {}
      );
      expect(result).toEqual(ok({ success: true }));
    });
  });
});
