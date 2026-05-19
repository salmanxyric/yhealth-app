/**
 * Voice Call Controller Unit Tests
 *
 * Tests all exported handlers on voiceCallController:
 *   initiate, getStatus, endCall, getHistory, getCall,
 *   handleOffer, handleIceCandidate, getIceServers, markActive,
 *   retry, upgrade, triggerEmergency, getEmotions.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockVoiceCallService = {
  initiateCall: jest.fn<any>(),
  getCallStatus: jest.fn<any>(),
  endCall: jest.fn<any>(),
  getCallHistory: jest.fn<any>(),
  getCall: jest.fn<any>(),
  establishConnection: jest.fn<any>(),
  handleIceCandidate: jest.fn<any>(),
  markCallActive: jest.fn<any>(),
  retryConnection: jest.fn<any>(),
};

const mockCrisisDetection = {
  triggerEmergencyProtocol: jest.fn<any>(),
  getCrisisResources: jest.fn<any>(),
  scheduleFollowUpCheckIn: jest.fn<any>(),
};

const mockVoiceSession = {
  upgradeSession: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/voice-call.service.js', () => ({
  voiceCallService: mockVoiceCallService,
}));

jest.unstable_mockModule('../../../src/services/crisis-detection.service.js', () => ({
  crisisDetectionService: mockCrisisDetection,
}));

jest.unstable_mockModule('../../../src/services/voice-session.service.js', () => ({
  voiceSessionService: mockVoiceSession,
}));

// ── Dynamic imports AFTER mocks ──
const { voiceCallController } = await import('../../../src/controllers/voice-call.controller.js');
const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => {
  jest.clearAllMocks();
  // Restore default resolved values for crisis detection
  mockCrisisDetection.triggerEmergencyProtocol.mockResolvedValue(undefined);
  mockCrisisDetection.getCrisisResources.mockResolvedValue([]);
  mockCrisisDetection.scheduleFollowUpCheckIn.mockResolvedValue(undefined);
  mockVoiceSession.upgradeSession.mockResolvedValue({ sessionType: 'coaching_session' });
});

// ─────────────────────────────────────────────
// initiate
// ─────────────────────────────────────────────
describe('initiate', () => {
  it('calls initiateCall and returns 201', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'mobile_app' },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent') as any,
    });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.initiateCall.mockResolvedValueOnce({ callId: 'call-1', status: 'initiating' });

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.callId).toBe('call-1');
    expect(mockVoiceCallService.initiateCall).toHaveBeenCalledWith('test-user-id', {
      channel: 'mobile_app',
      pre_call_context: undefined,
      session_type: 'quick_checkin',
      call_purpose: undefined,
    });
  });

  it('passes session_type and call_purpose to initiateCall', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'whatsapp', session_type: 'coaching_session', call_purpose: 'nutrition' },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent') as any,
    });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.initiateCall.mockResolvedValueOnce({ callId: 'call-2' });

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(mockVoiceCallService.initiateCall).toHaveBeenCalledWith('test-user-id', {
      channel: 'whatsapp',
      pre_call_context: undefined,
      session_type: 'coaching_session',
      call_purpose: 'nutrition',
    });
  });

  it('rejects invalid channel with 400', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'invalid_channel' },
      get: jest.fn() as any,
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects missing channel with 400', async () => {
    const req = createAuthReq({}, {
      body: {},
      get: jest.fn() as any,
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects invalid session_type with 400', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'mobile_app', session_type: 'invalid_session' },
      get: jest.fn() as any,
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects invalid call_purpose with 400', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'mobile_app', call_purpose: 'invalid_purpose' },
      get: jest.fn() as any,
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'mobile_app' },
      get: jest.fn() as any,
    });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('re-throws service errors via next', async () => {
    const req = createAuthReq({}, {
      body: { channel: 'mobile_app' },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent') as any,
    });
    const res = createRes();
    const next = createNext();

    const serviceError = new Error('Service failed');
    mockVoiceCallService.initiateCall.mockRejectedValueOnce(serviceError);

    await callHandler(voiceCallController.initiate, req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});

// ─────────────────────────────────────────────
// getStatus
// ─────────────────────────────────────────────
describe('getStatus', () => {
  it('returns call status', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.getCallStatus.mockResolvedValueOnce({ status: 'active', duration: 120 });

    await callHandler(voiceCallController.getStatus, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('active');
    expect(mockVoiceCallService.getCallStatus).toHaveBeenCalledWith('call-1', 'test-user-id');
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.getStatus, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('rejects missing callId', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.getStatus, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// endCall
// ─────────────────────────────────────────────
describe('endCall', () => {
  it('ends call with reason and returns 200', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { reason: 'user_ended' },
    });
    const res = createRes();
    const next = createNext();

    const summary = { callId: 'call-1', duration: 300, status: 'completed' };
    mockVoiceCallService.endCall.mockResolvedValueOnce(summary);

    await callHandler(voiceCallController.endCall, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.duration).toBe(300);
    expect(mockVoiceCallService.endCall).toHaveBeenCalledWith('call-1', 'test-user-id', 'user_ended');
  });

  it('ends call without reason', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: {},
    });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.endCall.mockResolvedValueOnce({ callId: 'call-1' });

    await callHandler(voiceCallController.endCall, req, res, next);

    expect(mockVoiceCallService.endCall).toHaveBeenCalledWith('call-1', 'test-user-id', undefined);
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.endCall, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('rejects missing callId', async () => {
    const req = createAuthReq({}, { params: {}, body: { reason: 'timeout' } });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.endCall, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getHistory
// ─────────────────────────────────────────────
describe('getHistory', () => {
  it('returns paginated history with default params', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.getCallHistory.mockResolvedValueOnce({
      calls: [{ id: 'call-1' }, { id: 'call-2' }],
      page: 1,
      limit: 20,
      total: 2,
    });

    await callHandler(voiceCallController.getHistory, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(mockVoiceCallService.getCallHistory).toHaveBeenCalledWith('test-user-id', {
      page: 1,
      limit: 20,
    });
  });

  it('caps limit at 100', async () => {
    const req = createAuthReq({}, { query: { limit: '500', page: '2' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.getCallHistory.mockResolvedValueOnce({
      calls: [],
      page: 2,
      limit: 100,
      total: 0,
    });

    await callHandler(voiceCallController.getHistory, req, res, next);

    expect(mockVoiceCallService.getCallHistory).toHaveBeenCalledWith('test-user-id',
      expect.objectContaining({ limit: 100 })
    );
  });

  it('passes channel and status filters', async () => {
    const req = createAuthReq({}, { query: { channel: 'mobile_app', status: 'completed' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.getCallHistory.mockResolvedValueOnce({
      calls: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    await callHandler(voiceCallController.getHistory, req, res, next);

    expect(mockVoiceCallService.getCallHistory).toHaveBeenCalledWith('test-user-id',
      expect.objectContaining({ channel: 'mobile_app', status: 'completed' })
    );
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, { query: {} });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.getHistory, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getCall
// ─────────────────────────────────────────────
describe('getCall', () => {
  it('returns call details', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    const callData = { id: 'call-1', status: 'completed', duration: 600 };
    mockVoiceCallService.getCall.mockResolvedValueOnce(callData);

    await callHandler(voiceCallController.getCall, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('call-1');
    expect(mockVoiceCallService.getCall).toHaveBeenCalledWith('call-1', 'test-user-id');
  });

  it('rejects missing callId', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.getCall, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// handleOffer
// ─────────────────────────────────────────────
describe('handleOffer', () => {
  it('processes valid WebRTC offer', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\n', type: 'offer' },
    });
    const res = createRes();
    const next = createNext();

    const answer = { sdp: 'v=0\r\nanswer...', type: 'answer' };
    mockVoiceCallService.establishConnection.mockResolvedValueOnce(answer);

    await callHandler(voiceCallController.handleOffer, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.answer).toEqual(answer);
    expect(mockVoiceCallService.establishConnection).toHaveBeenCalledWith(
      'call-1',
      'test-user-id',
      { sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\n', type: 'offer' }
    );
  });

  it('rejects offer missing sdp with 400', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { type: 'offer' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleOffer, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects offer with wrong type with 400', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sdp: 'v=0...', type: 'answer' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleOffer, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects empty body with 400', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: {},
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleOffer, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sdp: 'v=0...', type: 'offer' },
    });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleOffer, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// handleIceCandidate
// ─────────────────────────────────────────────
describe('handleIceCandidate', () => {
  it('processes valid ICE candidate', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { candidate: 'candidate:0 1 UDP 2122252543 192.168.1.1 12345 typ host', sdpMid: '0', sdpMLineIndex: 0 },
    });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.handleIceCandidate.mockResolvedValueOnce(undefined);

    await callHandler(voiceCallController.handleIceCandidate, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
    expect(mockVoiceCallService.handleIceCandidate).toHaveBeenCalledWith(
      'call-1',
      'test-user-id',
      expect.objectContaining({ candidate: expect.any(String) })
    );
  });

  it('rejects missing candidate with 400', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sdpMid: '0' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleIceCandidate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects empty body with 400', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: {},
    });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.handleIceCandidate, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getIceServers
// ─────────────────────────────────────────────
describe('getIceServers', () => {
  it('returns ice servers from call record', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    const customServers = [{ urls: 'turn:turn.example.com:3478', username: 'u', credential: 'p' }];
    mockVoiceCallService.getCall.mockResolvedValueOnce({ id: 'call-1', ice_servers: customServers });

    await callHandler(voiceCallController.getIceServers, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.iceServers).toEqual(customServers);
  });

  it('returns default STUN servers when call has no ice_servers', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.getCall.mockResolvedValueOnce({ id: 'call-1', ice_servers: null });

    await callHandler(voiceCallController.getIceServers, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.iceServers).toEqual([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]);
  });
});

// ─────────────────────────────────────────────
// markActive
// ─────────────────────────────────────────────
describe('markActive', () => {
  it('marks call as active and returns 200', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.markCallActive.mockResolvedValueOnce(undefined);

    await callHandler(voiceCallController.markActive, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.success).toBe(true);
    expect(mockVoiceCallService.markCallActive).toHaveBeenCalledWith('call-1', 'test-user-id');
  });

  it('rejects missing callId', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.markActive, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// retry
// ─────────────────────────────────────────────
describe('retry', () => {
  it('retries call connection and returns success', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.retryConnection.mockResolvedValueOnce(true);

    await callHandler(voiceCallController.retry, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.success).toBe(true);
    expect(mockVoiceCallService.retryConnection).toHaveBeenCalledWith('call-1', 'test-user-id');
  });

  it('returns false when retry fails', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockVoiceCallService.retryConnection.mockResolvedValueOnce(false);

    await callHandler(voiceCallController.retry, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.success).toBe(false);
  });
});

// ─────────────────────────────────────────────
// upgrade
// ─────────────────────────────────────────────
describe('upgrade', () => {
  it('upgrades session type successfully', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sessionType: 'coaching_session' },
    });
    const res = createRes();
    const next = createNext();

    // Call query returns conversation_id
    mockQuery.mockResolvedValueOnce({ rows: [{ conversation_id: 'conv-1' }] });
    // Update query
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(voiceCallController.upgrade, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.session.sessionType).toBe('coaching_session');
    expect(mockVoiceSession.upgradeSession).toHaveBeenCalledWith('conv-1', 'coaching_session');
  });

  it('returns 404 when call not found', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'missing-call' },
      body: { sessionType: 'coaching_session' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(voiceCallController.upgrade, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('returns 400 when call has no conversation', async () => {
    const req = createAuthReq({}, {
      params: { callId: 'call-1' },
      body: { sessionType: 'coaching_session' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ conversation_id: null }] });

    await callHandler(voiceCallController.upgrade, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// triggerEmergency
// ─────────────────────────────────────────────
describe('triggerEmergency', () => {
  it('triggers emergency protocol and returns resources', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    const resources = [
      { name: 'Crisis Hotline', phone: '1-800-273-8255' },
      { name: 'Emergency Services', phone: '911' },
    ];
    mockCrisisDetection.triggerEmergencyProtocol.mockResolvedValueOnce(undefined);
    mockCrisisDetection.getCrisisResources.mockResolvedValueOnce(resources);
    mockCrisisDetection.scheduleFollowUpCheckIn.mockResolvedValueOnce(undefined);

    await callHandler(voiceCallController.triggerEmergency, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.emergency).toBe(true);
    expect(body.data.resources).toEqual(resources);
    expect(body.data.message).toContain('Emergency protocol activated');

    expect(mockCrisisDetection.triggerEmergencyProtocol).toHaveBeenCalledWith('call-1', 'test-user-id');
    expect(mockCrisisDetection.getCrisisResources).toHaveBeenCalled();
    expect(mockCrisisDetection.scheduleFollowUpCheckIn).toHaveBeenCalledWith('test-user-id', 'call-1');
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.triggerEmergency, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('rejects missing callId', async () => {
    const req = createAuthReq({}, { params: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.triggerEmergency, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// getEmotions
// ─────────────────────────────────────────────
describe('getEmotions', () => {
  it('returns emotions and summary for a call', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    // emotion_logs query
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'e-1', timestamp: '2026-01-01T00:00:00Z', emotion_category: 'happy', confidence_score: 0.9, source: 'voice' },
        { id: 'e-2', timestamp: '2026-01-01T00:01:00Z', emotion_category: 'calm', confidence_score: 0.8, source: 'voice' },
      ],
    });
    // emotion_summary query
    mockQuery.mockResolvedValueOnce({
      rows: [{ emotion_summary: { dominant: 'happy', confidence: 0.85 } }],
    });

    await callHandler(voiceCallController.getEmotions, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.emotions).toHaveLength(2);
    expect(body.data.emotions[0]).toEqual({
      id: 'e-1',
      timestamp: '2026-01-01T00:00:00Z',
      category: 'happy',
      confidence: 0.9,
      source: 'voice',
    });
    expect(body.data.summary).toEqual({ dominant: 'happy', confidence: 0.85 });
  });

  it('returns null summary when call has no emotion_summary', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(voiceCallController.getEmotions, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.emotions).toEqual([]);
    expect(body.data.summary).toBeNull();
  });

  it('rejects unauthenticated request', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(voiceCallController.getEmotions, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
