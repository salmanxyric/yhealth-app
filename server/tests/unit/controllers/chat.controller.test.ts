/**
 * Chat Controller Unit Tests
 *
 * Tests: createChat, getChats, getChatById, createGroupChat,
 *        deleteChat, joinGroupByCode, getTotalUnreadCount
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();

// 2. Mock cache (default export)
const mockCache = {
  get: jest.fn<any>().mockReturnValue(null),
  set: jest.fn(),
  delete: jest.fn(),
  deleteByPattern: jest.fn().mockReturnValue(0),
  getOrSet: jest.fn<any>().mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory()
  ),
  has: jest.fn<any>().mockReturnValue(false),
  clear: jest.fn(),
  getStats: jest.fn().mockReturnValue({ keys: 0, hits: 0, misses: 0 }),
};

jest.unstable_mockModule('../../../src/services/cache.service.js', () => ({
  cache: mockCache,
  default: mockCache,
  cacheKeys: {
    user: (id: string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,
    session: (id: string) => `session:${id}`,
    token: (token: string) => `token:${token}`,
    config: (key: string) => `config:${key}`,
    list: (resource: string, params?: string) =>
      `list:${resource}${params ? `:${params}` : ''}`,
    count: (resource: string, filter?: string) =>
      `count:${resource}${filter ? `:${filter}` : ''}`,
  },
}));

// 3. Mock chat service
const mockChatService = {
  createOrGetChat: jest.fn<any>(),
  getUserChats: jest.fn<any>(),
  getChatById: jest.fn<any>(),
  createGroupChat: jest.fn<any>(),
  updateGroupChat: jest.fn<any>(),
  renameGroupChat: jest.fn<any>(),
  addUserToGroup: jest.fn<any>(),
  removeUserFromGroup: jest.fn<any>(),
  deleteChat: jest.fn<any>(),
  joinGroupByCode: jest.fn<any>(),
  regenerateJoinCode: jest.fn<any>(),
  deleteGroup: jest.fn<any>(),
  getGroupMembers: jest.fn<any>(),
  updateMessagePermissions: jest.fn<any>(),
  getTotalUnreadCount: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/chat.service.js', () => ({
  chatService: mockChatService,
}));

// 4. Dynamic imports (AFTER mocks)
const {
  createChat,
  getChats,
  getChatById,
  createGroupChat,
  deleteChat,
  joinGroupByCode,
  getTotalUnreadCount,
} = await import('../../../src/controllers/chat.controller.js');

const { createAuthReq, createRes, createNext, getJsonBody, getStatus, callHandler } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
  // Re-setup getOrSet since resetMocks clears it
  mockCache.getOrSet.mockImplementation(
    async (_key: string, factory: () => Promise<unknown>) => factory()
  );
});

// ─── createChat ──────────────────────────────────────────────

describe('createChat', () => {
  it('should create or get a one-on-one chat', async () => {
    const chatData = { id: 'chat-1', isGroupChat: false };
    mockChatService.createOrGetChat.mockResolvedValue(chatData);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { userId: 'other-user-id' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createChat, req, res, next);

    expect(mockChatService.createOrGetChat).toHaveBeenCalledWith({
      userId: 'test-user-id',
      otherUserId: 'other-user-id',
      isGroupChat: false,
    });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(chatData);
  });

  it('should throw 400 when userId is missing from body', async () => {
    const req = createAuthReq({ userId: 'test-user-id' }, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(createChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 401 when user is not authenticated', async () => {
    const req = createAuthReq({}, { body: { userId: 'other' } });
    // Remove user entirely
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(createChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── getChats ────────────────────────────────────────────────

describe('getChats', () => {
  it('should return paginated chats for user', async () => {
    const chats = [{ id: 'c1' }, { id: 'c2' }];
    mockChatService.getUserChats.mockResolvedValue(chats);

    const req = createAuthReq(
      { userId: 'test-user-id', role: 'user' },
      { query: { page: '1', limit: '50' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getChats, req, res, next);

    expect(mockChatService.getUserChats).toHaveBeenCalledWith(
      'test-user-id',
      1,
      50
    );
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(chats);
  });

  it('should use same query for admin role (no special admin listing)', async () => {
    mockChatService.getUserChats.mockResolvedValue([]);

    const req = createAuthReq(
      { userId: 'test-user-id', role: 'admin' },
      { query: {} }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getChats, req, res, next);

    expect(mockChatService.getUserChats).toHaveBeenCalledWith(
      'test-user-id',
      1,
      50
    );
  });
});

// ─── getChatById ─────────────────────────────────────────────

describe('getChatById', () => {
  it('should return chat details', async () => {
    const chat = { id: 'chat-1', chatName: 'test' };
    mockChatService.getChatById.mockResolvedValue(chat);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'chat-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getChatById, req, res, next);

    expect(mockChatService.getChatById).toHaveBeenCalledWith(
      'chat-1',
      'test-user-id'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(chat);
  });

  it('should propagate service errors via next', async () => {
    mockChatService.getChatById.mockRejectedValue(new Error('Not found'));

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'missing' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(getChatById, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ─── createGroupChat ─────────────────────────────────────────

describe('createGroupChat', () => {
  it('should create a group chat', async () => {
    const group = { id: 'group-1', chatName: 'My Group', isGroupChat: true };
    mockChatService.createGroupChat.mockResolvedValue(group);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      {
        body: {
          chatName: 'My Group',
          users: ['user-a', 'user-b'],
          avatar: 'https://example.com/avatar.png',
        },
      }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createGroupChat, req, res, next);

    expect(mockChatService.createGroupChat).toHaveBeenCalledWith({
      userId: 'test-user-id',
      chatName: 'My Group',
      userIds: ['user-a', 'user-b'],
      avatar: 'https://example.com/avatar.png',
      isGroupChat: true,
    });
    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data).toEqual(group);
  });

  it('should throw 400 when chatName is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { users: [], avatar: 'x' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createGroupChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('should throw 400 when avatar is missing', async () => {
    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { chatName: 'Test', users: [] } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createGroupChat, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─── deleteChat ──────────────────────────────────────────────

describe('deleteChat', () => {
  it('should delete chat and return success', async () => {
    mockChatService.deleteChat.mockResolvedValue(undefined);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { params: { id: 'chat-1' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(deleteChat, req, res, next);

    expect(mockChatService.deleteChat).toHaveBeenCalledWith(
      'chat-1',
      'test-user-id'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).success).toBe(true);
  });
});

// ─── joinGroupByCode ─────────────────────────────────────────

describe('joinGroupByCode', () => {
  it('should join group with valid code', async () => {
    const chat = { id: 'group-1', chatName: 'Group' };
    mockChatService.joinGroupByCode.mockResolvedValue(chat);

    const req = createAuthReq(
      { userId: 'test-user-id' },
      { body: { code: '123456' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(joinGroupByCode, req, res, next);

    expect(mockChatService.joinGroupByCode).toHaveBeenCalledWith(
      '123456',
      'test-user-id'
    );
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual(chat);
  });

  it('should throw 400 when code is missing', async () => {
    const req = createAuthReq({ userId: 'test-user-id' }, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(joinGroupByCode, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });
});

// ─── getTotalUnreadCount ─────────────────────────────────────

describe('getTotalUnreadCount', () => {
  it('should return unread count via cache', async () => {
    mockChatService.getTotalUnreadCount.mockResolvedValue(5);

    const req = createAuthReq({ userId: 'test-user-id' });
    const res = createRes();
    const next = createNext();

    await callHandler(getTotalUnreadCount, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual({ unreadCount: 5 });
  });
});
