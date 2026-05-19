/**
 * Call Summary Controller Unit Tests
 *
 * Tests all exported handlers on callSummaryController:
 *   getSummaries, getSummaryByCallId, generateSummary,
 *   updateActionItem, getPendingActionItems.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mock ──
const mockCallSummaryService = {
  getSummariesForUser: jest.fn<any>(),
  getSummaryByCallId: jest.fn<any>(),
  generateSummary: jest.fn<any>(),
  updateActionItemStatus: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/call-summary.service.js', () => ({
  callSummaryService: mockCallSummaryService,
}));

// ── Dynamic imports AFTER mocks ──
const { callSummaryController } = await import('../../../src/controllers/call-summary.controller.js');
const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } = await import(
  '../../helpers/controller-harness.js'
);

// ── Helper ──
function fakeSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sum-1',
    callId: 'call-1',
    userId: 'test-user-id',
    sessionType: 'quick_checkin',
    depthMode: 'light',
    summary: 'Good session',
    keyInsights: ['insight1'],
    actionItems: [
      {
        id: 'ai-1',
        summaryId: 'sum-1',
        content: 'Exercise',
        category: 'fitness',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2026-06-01'),
      },
    ],
    duration: 120,
    generatedAt: new Date(),
    deliveryStatus: { app: false, whatsapp: false, push: false },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// getSummaries
// ─────────────────────────────────────────────
describe('getSummaries', () => {
  it('returns paginated summaries with 200', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    const summaries = [fakeSummary(), fakeSummary({ id: 'sum-2', callId: 'call-2' })];
    mockCallSummaryService.getSummariesForUser.mockResolvedValueOnce({
      summaries,
      total: 2,
    });

    await callHandler(callSummaryController.getSummaries, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.summaries).toHaveLength(2);
    expect(body.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    expect(mockCallSummaryService.getSummariesForUser).toHaveBeenCalledWith('test-user-id', {
      page: 1,
      limit: 20,
    });
  });

  it('passes page and limit from query params', async () => {
    const req = createAuthReq({}, { query: { page: '3', limit: '10' } });
    const res = createRes();
    const next = createNext();

    mockCallSummaryService.getSummariesForUser.mockResolvedValueOnce({
      summaries: [],
      total: 25,
    });

    await callHandler(callSummaryController.getSummaries, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(mockCallSummaryService.getSummariesForUser).toHaveBeenCalledWith('test-user-id', {
      page: 3,
      limit: 10,
    });
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, { query: {} });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.getSummaries, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getSummaryByCallId
// ─────────────────────────────────────────────
describe('getSummaryByCallId', () => {
  it('returns summary when found and owned by user', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    const summary = fakeSummary();
    mockCallSummaryService.getSummaryByCallId.mockResolvedValueOnce(summary);

    await callHandler(callSummaryController.getSummaryByCallId, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('sum-1');
    expect(mockCallSummaryService.getSummaryByCallId).toHaveBeenCalledWith('call-1');
  });

  it('throws 404 when not found', async () => {
    const req = createAuthReq({}, { params: { callId: 'missing-call' } });
    const res = createRes();
    const next = createNext();

    mockCallSummaryService.getSummaryByCallId.mockResolvedValueOnce(null);

    await callHandler(callSummaryController.getSummaryByCallId, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('throws 403 when userId does not match', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    const res = createRes();
    const next = createNext();

    const summary = fakeSummary({ userId: 'other-user-id' });
    mockCallSummaryService.getSummaryByCallId.mockResolvedValueOnce(summary);

    await callHandler(callSummaryController.getSummaryByCallId, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(403);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, { params: { callId: 'call-1' } });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.getSummaryByCallId, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// generateSummary
// ─────────────────────────────────────────────
describe('generateSummary', () => {
  it('generates and returns summary with 201 status', async () => {
    const req = createAuthReq({}, {
      body: {
        callId: 'call-1',
        sessionType: 'quick_checkin',
        duration: 120,
        depthMode: 'light',
        conversationId: 'conv-1',
      },
    });
    const res = createRes();
    const next = createNext();

    const summary = fakeSummary();
    mockCallSummaryService.generateSummary.mockResolvedValueOnce(summary);

    await callHandler(callSummaryController.generateSummary, req, res, next);

    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('sum-1');
    expect(mockCallSummaryService.generateSummary).toHaveBeenCalledWith({
      callId: 'call-1',
      userId: 'test-user-id',
      sessionType: 'quick_checkin',
      depthMode: 'light',
      conversationId: 'conv-1',
      duration: 120,
    });
  });

  it('rejects when callId is missing with 400', async () => {
    const req = createAuthReq({}, {
      body: { sessionType: 'quick_checkin', duration: 120 },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.generateSummary, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects when sessionType is missing with 400', async () => {
    const req = createAuthReq({}, {
      body: { callId: 'call-1', duration: 120 },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.generateSummary, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects when duration is missing with 400', async () => {
    const req = createAuthReq({}, {
      body: { callId: 'call-1', sessionType: 'quick_checkin' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.generateSummary, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, {
      body: { callId: 'call-1', sessionType: 'quick_checkin', duration: 120 },
    });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.generateSummary, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateActionItem
// ─────────────────────────────────────────────
describe('updateActionItem', () => {
  it('updates action item status successfully', async () => {
    const req = createAuthReq({}, {
      params: { actionItemId: 'ai-1' },
      body: { status: 'completed' },
    });
    const res = createRes();
    const next = createNext();

    const updatedItem = { id: 'ai-1', status: 'completed' };
    mockCallSummaryService.updateActionItemStatus.mockResolvedValueOnce(updatedItem);

    await callHandler(callSummaryController.updateActionItem, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
    expect(mockCallSummaryService.updateActionItemStatus).toHaveBeenCalledWith(
      'ai-1',
      'test-user-id',
      'completed'
    );
  });

  it('rejects invalid status value with 400', async () => {
    const req = createAuthReq({}, {
      params: { actionItemId: 'ai-1' },
      body: { status: 'invalid_status' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.updateActionItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('rejects missing status with 400', async () => {
    const req = createAuthReq({}, {
      params: { actionItemId: 'ai-1' },
      body: {},
    });
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.updateActionItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('throws 404 when action item not found', async () => {
    const req = createAuthReq({}, {
      params: { actionItemId: 'missing-ai' },
      body: { status: 'completed' },
    });
    const res = createRes();
    const next = createNext();

    mockCallSummaryService.updateActionItemStatus.mockResolvedValueOnce(null);

    await callHandler(callSummaryController.updateActionItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, {
      params: { actionItemId: 'ai-1' },
      body: { status: 'completed' },
    });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.updateActionItem, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getPendingActionItems
// ─────────────────────────────────────────────
describe('getPendingActionItems', () => {
  it('returns pending/in_progress items sorted by priority then due date', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    const summaries = [
      fakeSummary({
        actionItems: [
          { id: 'ai-1', priority: 'low', status: 'pending', dueDate: '2026-06-01' },
          { id: 'ai-2', priority: 'high', status: 'pending', dueDate: '2026-06-10' },
          { id: 'ai-3', priority: 'high', status: 'in_progress', dueDate: '2026-06-05' },
        ],
      }),
      fakeSummary({
        id: 'sum-2',
        actionItems: [
          { id: 'ai-4', priority: 'medium', status: 'pending', dueDate: '2026-06-02' },
        ],
      }),
    ];

    mockCallSummaryService.getSummariesForUser.mockResolvedValueOnce({ summaries });

    await callHandler(callSummaryController.getPendingActionItems, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);

    const items = body.data.actionItems;
    expect(items).toHaveLength(4);
    // high priority items first, sorted by due date
    expect(items[0].id).toBe('ai-3'); // high, 2026-06-05
    expect(items[1].id).toBe('ai-2'); // high, 2026-06-10
    // medium next
    expect(items[2].id).toBe('ai-4'); // medium, 2026-06-02
    // low last
    expect(items[3].id).toBe('ai-1'); // low, 2026-06-01

    expect(mockCallSummaryService.getSummariesForUser).toHaveBeenCalledWith('test-user-id', {
      limit: 50,
    });
  });

  it('filters out completed and dismissed items', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    const summaries = [
      fakeSummary({
        actionItems: [
          { id: 'ai-1', priority: 'high', status: 'pending', dueDate: '2026-06-01' },
          { id: 'ai-2', priority: 'high', status: 'completed', dueDate: '2026-06-02' },
          { id: 'ai-3', priority: 'medium', status: 'dismissed', dueDate: '2026-06-03' },
          { id: 'ai-4', priority: 'low', status: 'in_progress', dueDate: '2026-06-04' },
        ],
      }),
    ];

    mockCallSummaryService.getSummariesForUser.mockResolvedValueOnce({ summaries });

    await callHandler(callSummaryController.getPendingActionItems, req, res, next);

    const body = getJsonBody(res);
    const items = body.data.actionItems;
    expect(items).toHaveLength(2);
    expect(items.map((i: any) => i.id)).toEqual(['ai-1', 'ai-4']);
  });

  it('rejects unauthenticated request with 401', async () => {
    const req = createAuthReq({}, { query: {} });
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(callSummaryController.getPendingActionItems, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});
