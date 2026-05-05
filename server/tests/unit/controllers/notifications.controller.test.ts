/**
 * Notifications Controller Unit Tests
 *
 * Tests: getNotifications, getUnreadCount, getNotificationById,
 *        markAsRead, markAllAsRead, deleteNotification, deleteAllRead
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

const { mockQuery } = setupDbMock();
setupLoggerMock();

// 2. Mock notification engine
const mockNotificationEngine = {
  emitCountUpdate: jest.fn<any>().mockResolvedValue(undefined),
};

jest.unstable_mockModule('../../../src/services/notification-engine.service.js', () => ({
  notificationEngine: mockNotificationEngine,
}));

// 3. Mock socket service (used in createNotification)
jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: jest.fn(),
  },
}));

// 4. Dynamic imports (AFTER mocks)
const notificationsController = (
  await import('../../../src/controllers/notifications.controller.js')
).default;

const { createAuthReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

const { pgResult, pgEmpty } = await import('../../helpers/factories.js');

// ─── Helpers ─────────────────────────────────────────────────

function buildNotificationDbRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'notif-1',
    user_id: 'test-user-id',
    type: 'reminder',
    title: 'Test Notification',
    message: 'Hello world',
    icon: null,
    image_url: null,
    action_url: null,
    action_label: null,
    category: null,
    priority: 'normal',
    is_read: false,
    read_at: null,
    is_archived: false,
    archived_at: null,
    related_entity_type: null,
    related_entity_id: null,
    metadata: null,
    expires_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNotificationEngine.emitCountUpdate.mockResolvedValue(undefined);
});

// ─── getNotifications ────────────────────────────────────────

describe('getNotifications', () => {
  it('should return paginated notifications', async () => {
    const row = buildNotificationDbRow();
    // First call = count query, second call = data query
    mockQuery
      .mockResolvedValueOnce(pgResult([{ count: '1' }]))
      .mockResolvedValueOnce(pgResult([row]));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: { page: '1', limit: '20' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotifications, req, res, next);

    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('notif-1');
    expect(body.data[0].userId).toBe('test-user-id');
    expect(body.meta).toBeDefined();
    expect(body.meta.total).toBe(1);
  });

  it('should return empty list when no notifications', async () => {
    mockQuery
      .mockResolvedValueOnce(pgResult([{ count: '0' }]))
      .mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotifications, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toHaveLength(0);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotifications, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── getUnreadCount ──────────────────────────────────────────

describe('getUnreadCount', () => {
  it('should return unread, urgent, and high counts', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ count: '5', urgent: '1', high: '2' }])
    );

    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getUnreadCount, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual({
      unreadCount: 5,
      urgentCount: 1,
      highCount: 2,
    });
  });
});

// ─── getNotificationById ─────────────────────────────────────

describe('getNotificationById', () => {
  it('should return a single notification', async () => {
    const row = buildNotificationDbRow();
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'notif-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotificationById, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.notification.id).toBe('notif-1');
  });

  it('should throw 404 when notification not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'missing' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotificationById, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

// ─── markAsRead ──────────────────────────────────────────────

describe('markAsRead', () => {
  it('should mark notification as read and emit count update', async () => {
    const row = buildNotificationDbRow({ is_read: true, read_at: new Date() });
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'notif-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.markAsRead, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.notification.isRead).toBe(true);
    expect(mockNotificationEngine.emitCountUpdate).toHaveBeenCalledWith('test-user-id');
  });

  it('should throw 404 when notification not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'missing' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.markAsRead, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

// ─── markAllAsRead ───────────────────────────────────────────

describe('markAllAsRead', () => {
  it('should mark all unread notifications as read', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'n1' }, { id: 'n2' }]));

    const req = createAuthReq({ userId: 'test-user-id' }, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.markAllAsRead, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.updatedCount).toBe(2);
    expect(mockNotificationEngine.emitCountUpdate).toHaveBeenCalledWith('test-user-id');
  });

  it('should filter by type when provided', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'n1' }]));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { type: 'reminder' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.markAllAsRead, req, res, next);

    // Verify the query includes type filter
    const queryCall = mockQuery.mock.calls[0];
    expect(queryCall[0]).toContain('type = $2');
    expect(queryCall[1]).toContain('reminder');
  });
});

// ─── deleteNotification ──────────────────────────────────────

describe('deleteNotification', () => {
  it('should delete notification and emit count update', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ id: 'notif-1' }]));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'notif-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.deleteNotification, req, res, next);

    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeNull();
    expect(mockNotificationEngine.emitCountUpdate).toHaveBeenCalledWith('test-user-id');
  });

  it('should throw 404 when notification not found', async () => {
    mockQuery.mockResolvedValueOnce(pgEmpty());

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'missing' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.deleteNotification, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

// ─── deleteAllRead ───────────────────────────────────────────

describe('deleteAllRead', () => {
  it('should delete all read notifications', async () => {
    mockQuery.mockResolvedValueOnce(
      pgResult([{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }])
    );

    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.deleteAllRead, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.deletedCount).toBe(3);
    expect(mockNotificationEngine.emitCountUpdate).toHaveBeenCalledWith('test-user-id');
  });
});

// ─── getNotificationStats ────────────────────────────────────

describe('getNotificationStats', () => {
  it('should return aggregated statistics', async () => {
    mockQuery
      .mockResolvedValueOnce(
        pgResult([{ total: '10', unread: '3', read: '5', archived: '2' }])
      )
      .mockResolvedValueOnce(
        pgResult([
          { type: 'reminder', count: '4' },
          { type: 'system', count: '6' },
        ])
      )
      .mockResolvedValueOnce(
        pgResult([
          { priority: 'normal', count: '8' },
          { priority: 'high', count: '2' },
        ])
      );

    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(notificationsController.getNotificationStats, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.total).toBe(10);
    expect(body.data.unread).toBe(3);
    expect(body.data.read).toBe(5);
    expect(body.data.archived).toBe(2);
    expect(body.data.byType).toEqual({ reminder: 4, system: 6 });
    expect(body.data.byPriority).toEqual({ normal: 8, high: 2 });
  });
});
