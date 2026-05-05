/**
 * Emotional Check-In Controller Unit Tests
 * Tests: startCheckIn, submitResponse, getSession, completeSession, getHistory,
 *        getTrends, analyzeCameraImage, processTensorFlowAnalysis, getEnhancedTrends,
 *        getIncompleteSessions, recoverSession.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery: _mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockEmotionalCheckInService = {
  startCheckIn: jest.fn<any>(),
  processResponse: jest.fn<any>(),
  getSession: jest.fn<any>(),
  completeSession: jest.fn<any>(),
  getCheckInHistory: jest.fn<any>(),
  analyzeCameraImage: jest.fn<any>(),
  findIncompleteSessions: jest.fn<any>(),
  recoverSession: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/emotional-checkin.service.js', () => ({
  emotionalCheckInService: mockEmotionalCheckInService,
}));

// Lazy-imported services mocked at module level
const mockTrendsService = {
  getTrends: jest.fn<any>(),
  getUserBaseline: jest.fn<any>(),
  getEnhancedTrends: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/emotional-checkin-trends.service.js', () => ({
  emotionalCheckinTrendsService: mockTrendsService,
}));

const mockCameraEmotionService = {
  processEmotionAnalysis: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/camera-emotion.service.js', () => ({
  cameraEmotionService: mockCameraEmotionService,
}));

// ── Dynamic imports AFTER mocks ──
const { emotionalCheckInController } = await import('../../../src/controllers/emotional-checkin.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// startCheckIn
// ─────────────────────────────────────────────
describe('startCheckIn', () => {
  it('returns 201 with session data', async () => {
    const session = { sessionId: 's-1', type: 'PHQ-2', questions: [] };
    mockEmotionalCheckInService.startCheckIn.mockResolvedValueOnce(session);

    const req = createAuthReq({ userId: 'u-1' }, { body: { type: 'PHQ-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.startCheckIn, req, res, next);

    expect(mockEmotionalCheckInService.startCheckIn).toHaveBeenCalledWith('u-1', 'PHQ-2');
    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data).toEqual(session);
  });

  it('passes undefined type when not provided', async () => {
    mockEmotionalCheckInService.startCheckIn.mockResolvedValueOnce({ sessionId: 's-2' });

    const req = createAuthReq({ userId: 'u-1' }, { body: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.startCheckIn, req, res, next);

    expect(mockEmotionalCheckInService.startCheckIn).toHaveBeenCalledWith('u-1', undefined);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.startCheckIn, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// submitResponse
// ─────────────────────────────────────────────
describe('submitResponse', () => {
  it('returns 200 with processed result', async () => {
    const result = { nextQuestion: { id: 'q-2', text: 'How are you?' } };
    mockEmotionalCheckInService.processResponse.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: {
        questionId: 'q-1',
        value: 3,
        text: 'Feeling okay',
        conversationHistory: [
          { role: 'assistant', content: 'Hi', timestamp: '2025-04-01T00:00:00.000Z' },
        ],
      },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.submitResponse, req, res, next);

    expect(mockEmotionalCheckInService.processResponse).toHaveBeenCalledWith(
      's-1',
      'q-1',
      { questionId: 'q-1', value: 3, text: 'Feeling okay' },
      expect.arrayContaining([
        expect.objectContaining({ role: 'assistant', content: 'Hi' }),
      ])
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(result);
  });

  it('calls next with 400 when questionId is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: { value: 3 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.submitResponse, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when value is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: { questionId: 'q-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.submitResponse, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('handles empty conversationHistory gracefully', async () => {
    mockEmotionalCheckInService.processResponse.mockResolvedValueOnce({});

    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: { questionId: 'q-1', value: 2 },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.submitResponse, req, res, next);

    expect(mockEmotionalCheckInService.processResponse).toHaveBeenCalledWith(
      's-1',
      'q-1',
      { questionId: 'q-1', value: 2, text: undefined },
      []
    );
    expect(getStatus(res)).toBe(200);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { sessionId: 's-1' }, body: { questionId: 'q-1', value: 1 } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.submitResponse, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getSession
// ─────────────────────────────────────────────
describe('getSession', () => {
  it('returns 200 with session data', async () => {
    const session = { sessionId: 's-1', userId: 'u-1', status: 'in_progress' };
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce(session);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getSession, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ session });
  });

  it('calls next with 404 when session not found', async () => {
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce(null);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-999' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('calls next with 403 when session belongs to another user', async () => {
    const session = { sessionId: 's-1', userId: 'other-user' };
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce(session);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// completeSession
// ─────────────────────────────────────────────
describe('completeSession', () => {
  it('returns 200 with completed session data', async () => {
    const session = { sessionId: 's-1', userId: 'u-1', status: 'in_progress' };
    const completedSession = { sessionId: 's-1', userId: 'u-1', status: 'completed', score: 8 };
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce(session);
    mockEmotionalCheckInService.completeSession.mockResolvedValueOnce(completedSession);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.completeSession, req, res, next);

    expect(mockEmotionalCheckInService.completeSession).toHaveBeenCalledWith('s-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ session: completedSession });
  });

  it('calls next with 404 when session not found', async () => {
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce(null);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-999' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.completeSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('calls next with 403 when session belongs to another user', async () => {
    mockEmotionalCheckInService.getSession.mockResolvedValueOnce({ sessionId: 's-1', userId: 'other' });

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.completeSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────
// getHistory
// ─────────────────────────────────────────────
describe('getHistory', () => {
  it('returns 200 with paginated history', async () => {
    const result = { sessions: [{ id: 's-1' }], total: 1 };
    mockEmotionalCheckInService.getCheckInHistory.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' }, { query: { page: '2', limit: '10' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getHistory, req, res, next);

    expect(mockEmotionalCheckInService.getCheckInHistory).toHaveBeenCalledWith('u-1', { page: 2, limit: 10 });
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(result);
  });

  it('defaults page to 1 and limit to 20', async () => {
    mockEmotionalCheckInService.getCheckInHistory.mockResolvedValueOnce({ sessions: [], total: 0 });

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getHistory, req, res, next);

    expect(mockEmotionalCheckInService.getCheckInHistory).toHaveBeenCalledWith('u-1', { page: 1, limit: 20 });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getHistory, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getTrends
// ─────────────────────────────────────────────
describe('getTrends', () => {
  it('returns 200 with trends and baseline', async () => {
    const trends = { scores: [1, 2, 3] };
    const baseline = { average: 2 };
    mockTrendsService.getTrends.mockResolvedValueOnce(trends);
    mockTrendsService.getUserBaseline.mockResolvedValueOnce(baseline);

    const req = createAuthReq({ userId: 'u-1' }, { query: { timeWindow: 'month' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getTrends, req, res, next);

    expect(mockTrendsService.getTrends).toHaveBeenCalledWith('u-1', 'month');
    expect(mockTrendsService.getUserBaseline).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ trends, baseline });
  });

  it('defaults timeWindow to week', async () => {
    mockTrendsService.getTrends.mockResolvedValueOnce({});
    mockTrendsService.getUserBaseline.mockResolvedValueOnce({});

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getTrends, req, res, next);

    expect(mockTrendsService.getTrends).toHaveBeenCalledWith('u-1', 'week');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getTrends, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// analyzeCameraImage
// ─────────────────────────────────────────────
describe('analyzeCameraImage', () => {
  it('returns 200 with analysis result', async () => {
    const result = { emotion: 'happy', confidence: 0.92 };
    mockEmotionalCheckInService.analyzeCameraImage.mockResolvedValueOnce(result);

    const fileBuffer = Buffer.from('fake-image-data');
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      file: { buffer: fileBuffer, mimetype: 'image/jpeg' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.analyzeCameraImage, req, res, next);

    expect(mockEmotionalCheckInService.analyzeCameraImage).toHaveBeenCalledWith(
      's-1',
      fileBuffer,
      'image/jpeg'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(result);
  });

  it('calls next with 400 when no file provided', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.analyzeCameraImage, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.analyzeCameraImage, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// processTensorFlowAnalysis
// ─────────────────────────────────────────────
describe('processTensorFlowAnalysis', () => {
  const validBody = {
    dominant: 'happy',
    distribution: { happy: 0.7, sad: 0.1, neutral: 0.2 },
    engagement: 0.85,
    stressIndicators: { browFurrow: 0.1, jawTension: 0.2, eyeStrain: 0.15 },
    averageConfidence: 0.78,
    sampleCount: 10,
  };

  it('returns 200 with processed result', async () => {
    const result = { processed: true, insights: {} };
    mockCameraEmotionService.processEmotionAnalysis.mockResolvedValueOnce(result);

    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: validBody,
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.processTensorFlowAnalysis, req, res, next);

    expect(mockCameraEmotionService.processEmotionAnalysis).toHaveBeenCalledWith('u-1', {
      sessionId: 's-1',
      dominant: 'happy',
      distribution: validBody.distribution,
      engagement: 0.85,
      stressIndicators: validBody.stressIndicators,
      averageConfidence: 0.78,
      sampleCount: 10,
    });
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(result);
  });

  it('calls next with 400 when dominant is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: { ...validBody, dominant: undefined },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.processTensorFlowAnalysis, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when stressIndicators is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, {
      params: { sessionId: 's-1' },
      body: { ...validBody, stressIndicators: undefined },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.processTensorFlowAnalysis, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { sessionId: 's-1' }, body: validBody } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.processTensorFlowAnalysis, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getEnhancedTrends
// ─────────────────────────────────────────────
describe('getEnhancedTrends', () => {
  it('returns 200 with enhanced trends', async () => {
    const enhancedTrends = { sevenDay: {}, thirtyDay: {}, ninetyDay: {} };
    mockTrendsService.getEnhancedTrends.mockResolvedValueOnce(enhancedTrends);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getEnhancedTrends, req, res, next);

    expect(mockTrendsService.getEnhancedTrends).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(enhancedTrends);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getEnhancedTrends, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getIncompleteSessions
// ─────────────────────────────────────────────
describe('getIncompleteSessions', () => {
  it('returns 200 with incomplete sessions', async () => {
    const sessions = [{ sessionId: 's-1', status: 'in_progress' }];
    mockEmotionalCheckInService.findIncompleteSessions.mockResolvedValueOnce(sessions);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getIncompleteSessions, req, res, next);

    expect(mockEmotionalCheckInService.findIncompleteSessions).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ sessions });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.getIncompleteSessions, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// recoverSession
// ─────────────────────────────────────────────
describe('recoverSession', () => {
  it('returns 200 when session recovered successfully', async () => {
    const recoveryData = { recovered: true, session: { sessionId: 's-1' } };
    mockEmotionalCheckInService.recoverSession.mockResolvedValueOnce(recoveryData);

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(mockEmotionalCheckInService.recoverSession).toHaveBeenCalledWith('s-1', 'u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(recoveryData);
  });

  it('calls next with 404 when session_not_found', async () => {
    mockEmotionalCheckInService.recoverSession.mockResolvedValueOnce({
      recovered: false,
      reason: 'session_not_found',
    });

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-999' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(404);
  });

  it('calls next with 403 when unauthorized', async () => {
    mockEmotionalCheckInService.recoverSession.mockResolvedValueOnce({
      recovered: false,
      reason: 'unauthorized',
    });

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  it('calls next with 400 when session expired', async () => {
    mockEmotionalCheckInService.recoverSession.mockResolvedValueOnce({
      recovered: false,
      reason: 'expired',
    });

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when already_completed', async () => {
    mockEmotionalCheckInService.recoverSession.mockResolvedValueOnce({
      recovered: false,
      reason: 'already_completed',
    });

    const req = createAuthReq({ userId: 'u-1' }, { params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { sessionId: 's-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(emotionalCheckInController.recoverSession, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
