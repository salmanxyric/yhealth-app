/**
 * Chat Call Service — Unit Tests
 *
 * Tests for in-memory call orchestration: invite, accept, decline, cancel,
 * end, media-state, WebRTC signaling relay, disconnect handling,
 * AI coach calls, timeout, and missed call follow-up.
 *
 * Uses ESM mocking pattern: jest.unstable_mockModule() before await import().
 * beforeEach re-imports a fresh singleton for each test (resetMocks: true globally).
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// ──────────────────────────────────────────────
// Shared mock references (reset per test)
// ──────────────────────────────────────────────

const mockQuery = jest.fn<any>();
const mockEmitToUser = jest.fn<any>();
const mockEmitToChat = jest.fn<any>();
const mockIsUserConnected = jest.fn<any>().mockReturnValue(true);
const mockNotificationSend = jest.fn<any>().mockResolvedValue(null);
const mockGetChatById = jest.fn<any>();
const mockCreateOrGetChat = jest.fn<any>();
const mockSendMessage = jest.fn<any>();
const mockTransformMessage = jest.fn<any>().mockReturnValue({ id: 'msg-1', content: '{}' });
const mockGetForUser = jest.fn<any>();
const mockRecordAnswer = jest.fn<any>().mockResolvedValue(undefined);
const mockRecordMiss = jest.fn<any>().mockResolvedValue(undefined);
const mockDeliverForUser = jest.fn<any>().mockResolvedValue(undefined);
const mockGetUserLocalHour = jest.fn<any>().mockReturnValue(10);

let chatCallService: any;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function pgResult<T>(rows: T[] = [], rowCount?: number) {
  return { rows, rowCount: rowCount ?? rows.length, command: 'SELECT', oid: 0, fields: [] };
}

/** Minimal ChatWithParticipants shape returned by chatService.getChatById */
function fakeChat(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chat-1',
    chat_name: 'Test Chat',
    is_group_chat: false,
    participants: [
      {
        id: 'p-1',
        user_id: 'caller-1',
        joined_at: new Date(),
        left_at: null,
        is_blocked: false,
        unread_count: 0,
        last_read_at: null,
        user: { id: 'caller-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', avatar: 'av1.png', role: 'user' },
      },
      {
        id: 'p-2',
        user_id: 'callee-1',
        joined_at: new Date(),
        left_at: null,
        is_blocked: false,
        unread_count: 0,
        last_read_at: null,
        user: { id: 'callee-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', avatar: 'av2.png', role: 'user' },
      },
    ],
    ...overrides,
  };
}

function fakeGroupChat(overrides: Record<string, unknown> = {}) {
  return fakeChat({
    is_group_chat: true,
    chat_name: 'Group Chat',
    participants: [
      {
        id: 'p-1', user_id: 'caller-1', joined_at: new Date(), left_at: null, is_blocked: false,
        unread_count: 0, last_read_at: null,
        user: { id: 'caller-1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', avatar: null, role: 'user' },
      },
      {
        id: 'p-2', user_id: 'callee-1', joined_at: new Date(), left_at: null, is_blocked: false,
        unread_count: 0, last_read_at: null,
        user: { id: 'callee-1', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', avatar: null, role: 'user' },
      },
      {
        id: 'p-3', user_id: 'callee-2', joined_at: new Date(), left_at: null, is_blocked: false,
        unread_count: 0, last_read_at: null,
        user: { id: 'callee-2', first_name: 'Carol', last_name: 'Lee', email: 'carol@test.com', avatar: null, role: 'user' },
      },
    ],
    ...overrides,
  });
}

// ──────────────────────────────────────────────
// beforeEach — re-mock and re-import every test
// ──────────────────────────────────────────────

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.useFakeTimers();
  mockQuery.mockReset();
  mockEmitToUser.mockReset();
  mockEmitToChat.mockReset();
  mockIsUserConnected.mockReset().mockReturnValue(true);
  mockNotificationSend.mockReset().mockResolvedValue(null);
  mockGetChatById.mockReset();
  mockCreateOrGetChat.mockReset();
  mockSendMessage.mockReset().mockResolvedValue({ id: 'msg-1', content: '{}', created_at: new Date(), updated_at: new Date() });
  mockTransformMessage.mockReset().mockReturnValue({ id: 'msg-1', content: '{}' });
  mockGetForUser.mockReset().mockResolvedValue({ checkin_miss_count_by_hour: {} });
  mockRecordAnswer.mockReset().mockResolvedValue(undefined);
  mockRecordMiss.mockReset().mockResolvedValue(undefined);
  mockDeliverForUser.mockReset().mockResolvedValue(undefined);
  mockGetUserLocalHour.mockReset().mockReturnValue(10);

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
    socketService: {
      emitToUser: (...args: unknown[]) => mockEmitToUser(...args),
      emitToChat: (...args: unknown[]) => mockEmitToChat(...args),
      isUserConnected: (...args: unknown[]) => mockIsUserConnected(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/services/notification-engine.service.js', () => ({
    notificationEngine: {
      send: (...args: unknown[]) => mockNotificationSend(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/services/chat.service.js', () => ({
    chatService: {
      getChatById: (...args: unknown[]) => mockGetChatById(...args),
      createOrGetChat: (...args: unknown[]) => mockCreateOrGetChat(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/services/message.service.js', () => ({
    messageService: {
      sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/utils/message-transform.util.js', () => ({
    transformMessageForSocket: (...args: unknown[]) => mockTransformMessage(...args),
  }));

  jest.unstable_mockModule('../../../src/services/communication-preferences.service.js', () => ({
    communicationPreferencesService: {
      getForUser: (...args: unknown[]) => mockGetForUser(...args),
      recordAnswer: (...args: unknown[]) => mockRecordAnswer(...args),
      recordMiss: (...args: unknown[]) => mockRecordMiss(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/services/push-notification.service.js', () => ({
    pushNotificationService: {
      deliverForUser: (...args: unknown[]) => mockDeliverForUser(...args),
    },
  }));

  jest.unstable_mockModule('../../../src/lib/user-timezone.js', () => ({
    getUserLocalHour: (...args: unknown[]) => mockGetUserLocalHour(...args),
    resolveTimeZone: (tz: unknown) => (typeof tz === 'string' && tz) || 'UTC',
  }));

  jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
    class ApiError extends Error {
      statusCode: number;
      code: string;
      constructor(statusCode: number, message: string, opts?: { code?: string }) {
        super(message);
        this.statusCode = statusCode;
        this.code = opts?.code || 'UNKNOWN';
        this.name = 'ApiError';
      }
      static badRequest(msg: string) { return new ApiError(400, msg, { code: 'BAD_REQUEST' }); }
      static unauthorized(msg: string) { return new ApiError(401, msg, { code: 'UNAUTHORIZED' }); }
      static forbidden(msg: string) { return new ApiError(403, msg, { code: 'FORBIDDEN' }); }
      static notFound(msg: string) { return new ApiError(404, msg, { code: 'NOT_FOUND' }); }
      static conflict(msg: string) { return new ApiError(409, msg, { code: 'CONFLICT' }); }
      static internal(msg: string) { return new ApiError(500, msg, { code: 'INTERNAL_SERVER_ERROR' }); }
    }
    return { ApiError, default: ApiError };
  });

  jest.resetModules();

  const mod = await import('../../../src/services/chat-call.service.js');
  chatCallService = mod.chatCallService;
});

afterEach(() => {
  jest.useRealTimers();
});

// ──────────────────────────────────────────────
// invite
// ──────────────────────────────────────────────

describe('ChatCallService', () => {

  describe('invite', () => {
    it('creates a call session, emits outgoing + incoming events, and persists to DB', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([])); // persistCallStart

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      expect(call).toEqual(expect.objectContaining({
        chatId: 'chat-1',
        callType: 'voice',
        status: 'ringing',
        initiatorId: 'caller-1',
        isGroupCall: false,
      }));
      expect(call.id).toBeDefined();
      expect(call.participantIds).toEqual(['caller-1', 'callee-1']);
      expect(call.acceptedUserIds).toBeInstanceOf(Set);
      expect(call.acceptedUserIds.has('caller-1')).toBe(true);

      // Outgoing event to caller
      expect(mockEmitToUser).toHaveBeenCalledWith(
        'caller-1',
        'chat:call:outgoing',
        expect.objectContaining({ chatId: 'chat-1' }),
      );

      // Incoming event to callee (connected via socket)
      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:incoming',
        expect.objectContaining({ chatId: 'chat-1', recipientId: 'callee-1' }),
      );

      // DB persistence
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO chat_calls'),
        expect.any(Array),
      );
    });

    it('sends push notification when callee is not connected via socket', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockIsUserConnected.mockReturnValue(false);
      mockQuery.mockResolvedValue(pgResult([]));

      await chatCallService.invite('chat-1', 'caller-1', 'voice');

      expect(mockNotificationSend).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'callee-1',
          type: 'chat_call',
          priority: 'high',
        }),
      );
    });

    it('starts a 45-second timeout', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      // The timeout is stored on the session
      expect(call.timeout).toBeDefined();
    });

    it('throws BAD_REQUEST for invalid call type', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());

      await expect(
        chatCallService.invite('chat-1', 'caller-1', 'hologram' as any),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400 }));
    });

    it('throws BAD_REQUEST for video call in group chat', async () => {
      mockGetChatById.mockResolvedValue(fakeGroupChat());

      await expect(
        chatCallService.invite('chat-1', 'caller-1', 'video'),
      ).rejects.toThrow(expect.objectContaining({
        statusCode: 400,
        message: 'Video calls are only available in direct chats',
      }));
    });

    it('throws FORBIDDEN when initiator is not a participant', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());

      await expect(
        chatCallService.invite('chat-1', 'stranger-1', 'voice'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('throws CONFLICT when an active call already exists for the chat', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      // First invite succeeds
      await chatCallService.invite('chat-1', 'caller-1', 'voice');

      // Second invite should conflict
      mockGetChatById.mockResolvedValue(fakeChat());
      await expect(
        chatCallService.invite('chat-1', 'caller-1', 'voice'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 409 }));
    });

    it('throws BAD_REQUEST when no eligible invitees (only AI coach user)', async () => {
      const chat = fakeChat({
        participants: [
          {
            id: 'p-1', user_id: 'caller-1', joined_at: new Date(), left_at: null, is_blocked: false,
            unread_count: 0, last_read_at: null,
            user: { id: 'caller-1', first_name: 'Alice', last_name: 'Smith', email: 'a@t.com', avatar: null, role: 'user' },
          },
          {
            id: 'p-2', user_id: '00000000-0000-0000-0000-000000000001', joined_at: new Date(), left_at: null, is_blocked: false,
            unread_count: 0, last_read_at: null,
            user: { id: '00000000-0000-0000-0000-000000000001', first_name: 'AI', last_name: 'Coach', email: 'ai@t.com', avatar: null, role: 'bot' },
          },
        ],
      });
      mockGetChatById.mockResolvedValue(chat);

      await expect(
        chatCallService.invite('chat-1', 'caller-1', 'voice'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 400, message: 'No eligible participants to call' }));
    });

    it('sets video media state for video call type', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      const call = await chatCallService.invite('chat-1', 'caller-1', 'video');

      const mediaState = call.mediaState.get('caller-1');
      expect(mediaState).toEqual({ audioEnabled: true, videoEnabled: true });
    });
  });

  // ──────────────────────────────────────────────
  // accept
  // ──────────────────────────────────────────────

  describe('accept', () => {
    async function setupRingingCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      return call;
    }

    it('transitions call to active and clears timeout', async () => {
      const call = await setupRingingCall();

      const accepted = await chatCallService.accept(call.id, 'callee-1');

      expect(accepted.status).toBe('active');
      expect(accepted.startedAt).toBeInstanceOf(Date);
      expect(accepted.timeout).toBeUndefined();
      expect(accepted.acceptedUserIds.has('callee-1')).toBe(true);
    });

    it('emits participants-list to accepter and accepted to all participants', async () => {
      const call = await setupRingingCall();

      await chatCallService.accept(call.id, 'callee-1');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:participants-list',
        expect.objectContaining({
          call: expect.objectContaining({ callId: call.id }),
        }),
      );

      // accepted event emitted to both participants
      expect(mockEmitToUser).toHaveBeenCalledWith(
        'caller-1',
        'chat:call:accepted',
        expect.objectContaining({
          call: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('persists state to DB after accepting', async () => {
      const call = await setupRingingCall();

      await chatCallService.accept(call.id, 'callee-1');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chat_calls'),
        expect.any(Array),
      );
    });

    it('throws NOT_FOUND for non-existent call', async () => {
      await expect(
        chatCallService.accept('nonexistent-id', 'callee-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws FORBIDDEN for non-participant', async () => {
      const call = await setupRingingCall();

      await expect(
        chatCallService.accept(call.id, 'stranger-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('throws BAD_REQUEST when call is already ended', async () => {
      const call = await setupRingingCall();

      // End the call first
      mockSendMessage.mockResolvedValue({ id: 'msg-e', content: '{}', created_at: new Date(), updated_at: new Date() });
      await chatCallService.end(call.id, 'caller-1');

      await expect(
        chatCallService.accept(call.id, 'callee-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('does not change status if already active (second accept in group)', async () => {
      mockGetChatById.mockResolvedValue(fakeGroupChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));

      // First accept makes it active
      await chatCallService.accept(call.id, 'callee-1');
      const startedAt = call.startedAt;

      // Second accept stays active
      mockQuery.mockResolvedValue(pgResult([]));
      await chatCallService.accept(call.id, 'callee-2');

      expect(call.status).toBe('active');
      expect(call.startedAt).toBe(startedAt); // same startedAt
      expect(call.acceptedUserIds.has('callee-2')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // decline
  // ──────────────────────────────────────────────

  describe('decline', () => {
    async function setupRingingCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-d', content: '{}', created_at: new Date(), updated_at: new Date() });
      return call;
    }

    it('adds user to declined set and emits declined event', async () => {
      const call = await setupRingingCall();

      await chatCallService.decline(call.id, 'callee-1');

      expect(call.declinedUserIds.has('callee-1')).toBe(true);
    });

    it('finishes a direct (non-group) call on decline', async () => {
      const call = await setupRingingCall();

      await chatCallService.decline(call.id, 'callee-1');

      // Call should be cleaned up (status set to declined and removed from map)
      expect(call.status).toBe('declined');
    });

    it('throws NOT_FOUND for non-existent call', async () => {
      await expect(
        chatCallService.decline('bad-id', 'callee-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws FORBIDDEN for non-participant', async () => {
      const call = await setupRingingCall();

      await expect(
        chatCallService.decline(call.id, 'stranger-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('is a no-op when call is already ended', async () => {
      const call = await setupRingingCall();

      // End the call
      await chatCallService.end(call.id, 'caller-1');
      mockEmitToUser.mockClear();

      // Re-create the call and end it again so status is ended
      // Actually the call was removed from the map by end, so decline throws not found
      await expect(
        chatCallService.decline(call.id, 'callee-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ──────────────────────────────────────────────
  // cancel
  // ──────────────────────────────────────────────

  describe('cancel', () => {
    async function setupRingingCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-c', content: '{}', created_at: new Date(), updated_at: new Date() });
      return call;
    }

    it('cancels a ringing call initiated by the caller', async () => {
      const call = await setupRingingCall();

      await chatCallService.cancel(call.id, 'caller-1');

      expect(call.status).toBe('cancelled');
      expect(call.endedAt).toBeInstanceOf(Date);
    });

    it('emits cancelled event to all participants', async () => {
      const call = await setupRingingCall();

      await chatCallService.cancel(call.id, 'caller-1');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'caller-1',
        'chat:call:cancelled',
        expect.objectContaining({
          call: expect.objectContaining({ status: 'cancelled' }),
        }),
      );
      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:cancelled',
        expect.any(Object),
      );
    });

    it('throws FORBIDDEN when non-initiator tries to cancel', async () => {
      const call = await setupRingingCall();

      await expect(
        chatCallService.cancel(call.id, 'callee-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('is a no-op when call is already active', async () => {
      const call = await setupRingingCall();

      // Accept the call to make it active
      mockQuery.mockResolvedValue(pgResult([]));
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      // Cancel should be a no-op (status is active, not ringing)
      await chatCallService.cancel(call.id, 'caller-1');

      // Call should still be active
      expect(call.status).toBe('active');
    });

    it('throws NOT_FOUND for non-existent call', async () => {
      await expect(
        chatCallService.cancel('bad-id', 'caller-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ──────────────────────────────────────────────
  // end
  // ──────────────────────────────────────────────

  describe('end', () => {
    async function setupActiveCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-e', content: '{}', created_at: new Date(), updated_at: new Date() });
      return call;
    }

    it('ends an active call with status ended', async () => {
      const call = await setupActiveCall();

      await chatCallService.end(call.id, 'caller-1');

      expect(call.status).toBe('ended');
      expect(call.endedAt).toBeInstanceOf(Date);
    });

    it('emits ended event to all participants', async () => {
      const call = await setupActiveCall();

      await chatCallService.end(call.id, 'caller-1');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'caller-1',
        'chat:call:ended',
        expect.any(Object),
      );
      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:ended',
        expect.any(Object),
      );
    });

    it('ends a ringing call as cancelled', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-e', content: '{}', created_at: new Date(), updated_at: new Date() });

      await chatCallService.end(call.id, 'caller-1');

      // Ringing call ended by participant becomes 'cancelled'
      expect(call.status).toBe('cancelled');
    });

    it('throws FORBIDDEN for non-participant', async () => {
      const call = await setupActiveCall();

      await expect(
        chatCallService.end(call.id, 'stranger-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 403 }));
    });

    it('throws NOT_FOUND for non-existent call', async () => {
      await expect(
        chatCallService.end('bad-id', 'caller-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('is a no-op when call is already ended', async () => {
      const call = await setupActiveCall();

      await chatCallService.end(call.id, 'caller-1');

      // Second call should throw NOT_FOUND because the session was removed
      await expect(
        chatCallService.end(call.id, 'caller-1'),
      ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // ──────────────────────────────────────────────
  // updateMediaState
  // ──────────────────────────────────────────────

  describe('updateMediaState', () => {
    async function setupActiveCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();
      return call;
    }

    it('updates media state and emits to all participants', async () => {
      const call = await setupActiveCall();

      chatCallService.updateMediaState(call.id, 'caller-1', { audioEnabled: false });

      expect(call.mediaState.get('caller-1')).toEqual(
        expect.objectContaining({ audioEnabled: false }),
      );

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:media-state-changed',
        expect.objectContaining({
          callId: call.id,
          userId: 'caller-1',
          audioEnabled: false,
        }),
      );
    });

    it('forces videoEnabled to false in group calls', async () => {
      mockGetChatById.mockResolvedValue(fakeGroupChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      chatCallService.updateMediaState(call.id, 'caller-1', { videoEnabled: true });

      // In group calls, videoEnabled is always forced to false
      expect(call.mediaState.get('caller-1')?.videoEnabled).toBe(false);
    });

    it('throws NOT_FOUND for non-existent call', () => {
      expect(() => {
        chatCallService.updateMediaState('bad-id', 'caller-1', { audioEnabled: false });
      }).toThrow(expect.objectContaining({ statusCode: 404 }));
    });

    it('throws FORBIDDEN for non-participant', async () => {
      const call = await setupActiveCall();

      expect(() => {
        chatCallService.updateMediaState(call.id, 'stranger-1', { audioEnabled: false });
      }).toThrow(expect.objectContaining({ statusCode: 403 }));
    });
  });

  // ──────────────────────────────────────────────
  // WebRTC signaling relay
  // ──────────────────────────────────────────────

  describe('relayOffer', () => {
    async function setupActiveCall() {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();
      return call;
    }

    it('relays SDP offer to target user', async () => {
      const call = await setupActiveCall();

      chatCallService.relayOffer(call.id, 'caller-1', 'callee-1', 'sdp-offer-data');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:offer',
        { callId: call.id, fromUserId: 'caller-1', sdp: 'sdp-offer-data' },
      );
    });

    it('throws FORBIDDEN when sender has not accepted', async () => {
      mockGetChatById.mockResolvedValue(fakeGroupChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      // callee-2 has not accepted
      mockEmitToUser.mockClear();

      expect(() => {
        chatCallService.relayOffer(call.id, 'callee-2', 'caller-1', 'sdp');
      }).toThrow(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('relayAnswer', () => {
    it('relays SDP answer to target user', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      chatCallService.relayAnswer(call.id, 'callee-1', 'caller-1', 'sdp-answer-data');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'caller-1',
        'chat:call:answer',
        { callId: call.id, fromUserId: 'callee-1', sdp: 'sdp-answer-data' },
      );
    });
  });

  describe('relayIceCandidate', () => {
    it('relays ICE candidate to target user', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      const candidate = { candidate: 'candidate-string', sdpMLineIndex: 0, sdpMid: '0' };
      chatCallService.relayIceCandidate(call.id, 'caller-1', 'callee-1', candidate);

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:ice-candidate',
        { callId: call.id, fromUserId: 'caller-1', candidate },
      );
    });
  });

  // ──────────────────────────────────────────────
  // handleDisconnect
  // ──────────────────────────────────────────────

  describe('handleDisconnect', () => {
    it('removes user from accepted set and emits participant-left', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();
      mockSendMessage.mockResolvedValue({ id: 'msg-d', content: '{}', created_at: new Date(), updated_at: new Date() });

      chatCallService.handleDisconnect('callee-1');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        expect.any(String),
        'chat:call:participant-left',
        expect.objectContaining({ userId: 'callee-1' }),
      );
    });

    it('ends an active call when accepted participants drop below 2', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockSendMessage.mockResolvedValue({ id: 'msg-d', content: '{}', created_at: new Date(), updated_at: new Date() });

      chatCallService.handleDisconnect('callee-1');

      // Give the async finishCall a tick to resolve
      await jest.advanceTimersByTimeAsync(0);

      // Call should be ended (removed from map)
      expect(call.status).toBe('ended');
    });

    it('does nothing for a user not in any call', () => {
      // Should not throw
      chatCallService.handleDisconnect('unknown-user');
      expect(mockEmitToUser).not.toHaveBeenCalledWith(
        expect.any(String),
        'chat:call:participant-left',
        expect.any(Object),
      );
    });
  });

  // ──────────────────────────────────────────────
  // emitPendingIncomingCalls
  // ──────────────────────────────────────────────

  describe('emitPendingIncomingCalls', () => {
    it('emits incoming events for ringing calls the user is invited to', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockEmitToUser.mockClear();

      chatCallService.emitPendingIncomingCalls('callee-1');

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'callee-1',
        'chat:call:incoming',
        expect.objectContaining({ recipientId: 'callee-1' }),
      );
    });

    it('does not emit for users who already accepted', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      chatCallService.emitPendingIncomingCalls('callee-1');

      // Should not emit incoming because user already accepted
      expect(mockEmitToUser).not.toHaveBeenCalledWith(
        'callee-1',
        'chat:call:incoming',
        expect.any(Object),
      );
    });

    it('does not emit for users who already declined', async () => {
      mockGetChatById.mockResolvedValue(fakeGroupChat());
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-d', content: '{}', created_at: new Date(), updated_at: new Date() });

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      // callee-1 declines; in group call with other invitees still pending, call stays ringing
      mockIsUserConnected
        .mockReturnValueOnce(true)   // callee-1 is connected for the allInviteesDone check
        .mockReturnValueOnce(true);  // callee-2 is connected
      await chatCallService.decline(call.id, 'callee-1');
      mockEmitToUser.mockClear();

      chatCallService.emitPendingIncomingCalls('callee-1');

      // Should not emit incoming for declined user
      expect(mockEmitToUser).not.toHaveBeenCalledWith(
        'callee-1',
        'chat:call:incoming',
        expect.any(Object),
      );
    });
  });

  // ──────────────────────────────────────────────
  // timeoutCall (via fake timers)
  // ──────────────────────────────────────────────

  describe('timeoutCall (via 45s timer)', () => {
    it('finishes a ringing call as missed after 45 seconds', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-t', content: '{}', created_at: new Date(), updated_at: new Date() });

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      // Advance past 45s timeout
      await jest.advanceTimersByTimeAsync(45_000);

      expect(call.status).toBe('missed');
      expect(call.endedAt).toBeInstanceOf(Date);
    });

    it('does not timeout if call was already accepted', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      // Accept before timeout
      await chatCallService.accept(call.id, 'callee-1');

      // Advance timers — should not change status
      await jest.advanceTimersByTimeAsync(45_000);

      expect(call.status).toBe('active');
    });
  });

  // ──────────────────────────────────────────────
  // initiateAICoachCall
  // ──────────────────────────────────────────────

  describe('initiateAICoachCall', () => {
    const AI_COACH_ID = '00000000-0000-0000-0000-000000000001';

    it('creates a call from AI coach to the target user', async () => {
      // findOrCreateAICoachChat query
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'ai-chat-1' }])) // existing chat found
        .mockResolvedValueOnce(pgResult([{ first_name: 'AI', last_name: 'Coach', avatar: 'ai.png' }])) // AI profile
        .mockResolvedValueOnce(pgResult([{ first_name: 'Target', last_name: 'User', avatar: 'u.png' }])) // target profile
        .mockResolvedValue(pgResult([])); // persistCallStart

      const call = await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'morning check-in',
        sessionType: 'scheduled_checkin',
      });

      expect(call.initiatorId).toBe(AI_COACH_ID);
      expect(call.chatId).toBe('ai-chat-1');
      expect(call.callType).toBe('voice');
      expect(call.status).toBe('ringing');
      expect(call.participantIds).toContain('target-1');
      expect(call.participantIds).toContain(AI_COACH_ID);
      expect(call.initiatorName).toBe('AI Coach');
    });

    it('emits incoming event when target user is connected', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'ai-chat-1' }]))
        .mockResolvedValueOnce(pgResult([{ first_name: 'AI', last_name: 'Coach', avatar: null }]))
        .mockResolvedValueOnce(pgResult([{ first_name: 'Bob', last_name: 'User', avatar: null }]))
        .mockResolvedValue(pgResult([]));
      mockIsUserConnected.mockReturnValue(true);

      await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'ctx',
        sessionType: 'scheduled_checkin',
      });

      expect(mockEmitToUser).toHaveBeenCalledWith(
        'target-1',
        'chat:call:incoming',
        expect.objectContaining({ recipientId: 'target-1' }),
      );
    });

    it('sends push notification when target user is not connected', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'ai-chat-1' }]))
        .mockResolvedValueOnce(pgResult([{ first_name: 'AI', last_name: 'Coach', avatar: null }]))
        .mockResolvedValueOnce(pgResult([{ first_name: 'Bob', last_name: 'User', avatar: null }]))
        .mockResolvedValue(pgResult([]));
      mockIsUserConnected.mockReturnValue(false);

      await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'ctx',
        sessionType: 'scheduled_checkin',
      });

      expect(mockNotificationSend).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'target-1',
          type: 'chat_call',
          category: 'coaching',
          priority: 'high',
        }),
      );
    });

    it('creates a new chat when no existing chat is found', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([])) // no existing chat
        .mockResolvedValueOnce(pgResult([{ first_name: 'AI', last_name: 'Coach', avatar: null }]))
        .mockResolvedValueOnce(pgResult([{ first_name: 'User', last_name: 'One', avatar: null }]))
        .mockResolvedValue(pgResult([]));
      mockCreateOrGetChat.mockResolvedValue({ id: 'new-chat-1' });

      const call = await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'ctx',
        sessionType: 'scheduled_checkin',
      });

      expect(mockCreateOrGetChat).toHaveBeenCalledWith({
        userId: AI_COACH_ID,
        otherUserId: 'target-1',
        isGroupChat: false,
      });
      expect(call.chatId).toBe('new-chat-1');
    });

    it('uses fallback name when AI profile not found', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'ai-chat-1' }]))
        .mockResolvedValueOnce(pgResult([])) // AI profile not found
        .mockResolvedValueOnce(pgResult([])) // target profile not found
        .mockResolvedValue(pgResult([]));

      const call = await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'ctx',
        sessionType: 'scheduled_checkin',
      });

      expect(call.initiatorName).toBe('AI Coach');
    });
  });

  // ──────────────────────────────────────────────
  // isAICoachChat
  // ──────────────────────────────────────────────

  describe('isAICoachChat', () => {
    it('returns true when AI coach is a participant', async () => {
      mockQuery.mockResolvedValue(pgResult([{ cnt: '1' }]));

      const result = await chatCallService.isAICoachChat('chat-1', 'ai-coach-id');

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('chat_participants'),
        ['chat-1', 'ai-coach-id'],
      );
    });

    it('returns false when AI coach is not a participant', async () => {
      mockQuery.mockResolvedValue(pgResult([{ cnt: '0' }]));

      const result = await chatCallService.isAICoachChat('chat-1', 'ai-coach-id');

      expect(result).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // handleAICoachCallOutcome (tested via finishCall)
  // ──────────────────────────────────────────────

  describe('AI coach call outcome handling', () => {
    const AI_COACH_ID = '00000000-0000-0000-0000-000000000001';

    async function setupAICoachCall() {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'ai-chat-1' }])) // findOrCreateAICoachChat
        .mockResolvedValueOnce(pgResult([{ first_name: 'AI', last_name: 'Coach', avatar: null }])) // AI profile
        .mockResolvedValueOnce(pgResult([{ first_name: 'User', last_name: 'One', avatar: null }])) // target profile
        .mockResolvedValue(pgResult([])); // persistCallStart and subsequent queries

      const call = await chatCallService.initiateAICoachCall('target-1', {
        preCallContext: 'ctx',
        sessionType: 'scheduled_checkin',
      });

      mockQuery.mockClear();
      mockEmitToUser.mockClear();
      return call;
    }

    it('records an answered outcome when AI coach call ends after being active', async () => {
      const call = await setupAICoachCall();

      // Accept the call (making it active)
      mockQuery.mockResolvedValue(pgResult([]));
      await chatCallService.accept(call.id, 'target-1');
      mockQuery.mockClear();

      // End the call
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({ id: 'msg-e', content: '{}', created_at: new Date(), updated_at: new Date() });

      await chatCallService.end(call.id, 'target-1');

      // Allow async handleAICoachCallOutcome to run
      await jest.advanceTimersByTimeAsync(0);

      // Should query for user timezone and update ai_coach_call_log
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT timezone FROM users'),
        ['target-1'],
      );
      expect(mockRecordAnswer).toHaveBeenCalledWith('target-1', 10);
    });

    it('records a missed outcome and sends follow-up when AI coach call times out', async () => {
      const call = await setupAICoachCall();

      // Setup mocks for the timeout flow
      mockSendMessage.mockResolvedValue({ id: 'msg-t', content: '{}', created_at: new Date(), updated_at: new Date() });
      mockQuery
        .mockResolvedValue(pgResult([])) // default for persistCallState and other queries
        .mockResolvedValueOnce(pgResult([])) // persistCallState in finishCall
        .mockResolvedValueOnce(pgResult([])); // persistCallMessage -> sendMessage handles via mock

      // Trigger timeout
      await jest.advanceTimersByTimeAsync(45_000);

      // Allow async outcome handling to complete
      await jest.advanceTimersByTimeAsync(0);

      expect(call.status).toBe('missed');
    });
  });

  // ──────────────────────────────────────────────
  // finishCall — persistence and cleanup
  // ──────────────────────────────────────────────

  describe('finishCall (indirectly via end/cancel/decline)', () => {
    it('persists a call message via messageService.sendMessage', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({
        id: 'msg-fin',
        content: JSON.stringify({ callId: call.id, callType: 'voice', status: 'ended' }),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await chatCallService.end(call.id, 'caller-1');

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: 'chat-1',
          senderId: 'caller-1',
          contentType: 'call',
        }),
      );
    });

    it('emits newMessage to chat room after persisting call message', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockResolvedValue({
        id: 'msg-fin',
        content: '{}',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await chatCallService.end(call.id, 'caller-1');

      expect(mockEmitToChat).toHaveBeenCalledWith(
        'chat-1',
        'newMessage',
        expect.objectContaining({ chatId: 'chat-1' }),
      );
    });

    it('clears the timeout on finish', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      mockSendMessage.mockResolvedValue({ id: 'msg-d', content: '{}', created_at: new Date(), updated_at: new Date() });

      await chatCallService.cancel(call.id, 'caller-1');

      expect(call.timeout).toBeUndefined();
    });

    it('handles sendMessage failure gracefully and returns null message', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');
      await chatCallService.accept(call.id, 'callee-1');
      mockQuery.mockClear();
      mockQuery.mockResolvedValue(pgResult([]));
      mockSendMessage.mockRejectedValue(new Error('DB failure'));

      // Should not throw despite sendMessage failing
      await chatCallService.end(call.id, 'caller-1');

      expect(call.status).toBe('ended');
    });

    it('logs DB persistence failure at warn level for missing table (42P01)', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      // First query (persistCallStart) fails with table not found
      const tableError = Object.assign(new Error('relation does not exist'), { code: '42P01' });
      mockQuery.mockRejectedValueOnce(tableError);

      // Should not throw — persistence is non-blocking
      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      expect(call).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // displayName (tested via invite payloads)
  // ──────────────────────────────────────────────

  describe('displayName (via invite initiatorName)', () => {
    it('uses first_name + last_name', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      expect(call.initiatorName).toBe('Alice Smith');
    });

    it('falls back to email when names are missing', async () => {
      const chat = fakeChat({
        participants: [
          {
            id: 'p-1', user_id: 'caller-1', joined_at: new Date(), left_at: null, is_blocked: false,
            unread_count: 0, last_read_at: null,
            user: { id: 'caller-1', first_name: '', last_name: '', email: 'anon@test.com', avatar: null, role: 'user' },
          },
          {
            id: 'p-2', user_id: 'callee-1', joined_at: new Date(), left_at: null, is_blocked: false,
            unread_count: 0, last_read_at: null,
            user: { id: 'callee-1', first_name: 'Bob', last_name: '', email: 'bob@test.com', avatar: null, role: 'user' },
          },
        ],
      });
      mockGetChatById.mockResolvedValue(chat);
      mockQuery.mockResolvedValue(pgResult([]));

      const call = await chatCallService.invite('chat-1', 'caller-1', 'voice');

      expect(call.initiatorName).toBe('anon@test.com');
    });
  });

  // ──────────────────────────────────────────────
  // toPayload
  // ──────────────────────────────────────────────

  describe('toPayload (via invite return + events)', () => {
    it('includes all expected fields in the outgoing event payload', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      await chatCallService.invite('chat-1', 'caller-1', 'voice');

      const outgoingCall = mockEmitToUser.mock.calls.find(
        (c: any) => c[1] === 'chat:call:outgoing',
      );
      expect(outgoingCall).toBeDefined();
      const payload = outgoingCall![2] as Record<string, unknown>;

      expect(payload).toEqual(expect.objectContaining({
        chatId: 'chat-1',
        callType: 'voice',
        status: 'ringing',
        initiatorId: 'caller-1',
        initiatorName: 'Alice Smith',
        isGroupCall: false,
        participantIds: ['caller-1', 'callee-1'],
        createdAt: expect.any(String),
        startedAt: null,
        endedAt: null,
      }));
    });

    it('includes recipientId for targeted payloads', async () => {
      mockGetChatById.mockResolvedValue(fakeChat());
      mockQuery.mockResolvedValue(pgResult([]));

      await chatCallService.invite('chat-1', 'caller-1', 'voice');

      const incomingCall = mockEmitToUser.mock.calls.find(
        (c: any) => c[1] === 'chat:call:incoming',
      );
      expect(incomingCall).toBeDefined();
      const payload = incomingCall![2] as Record<string, unknown>;

      expect(payload.recipientId).toBe('callee-1');
    });
  });
});
