/**
 * Follow Service Unit Tests
 *
 * Tests for sendFollowRequest, acceptFollowRequest, rejectFollowRequest,
 * removeFollow, blockUser, getFollowers, getFollowing, getPendingRequests,
 * getRelationship, getSocialStats.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
const mockEmitToUser = jest.fn();
const mockNotificationSend = jest.fn<any>().mockResolvedValue(undefined);

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: jest.fn(),
  pool: { query: mockQuery, end: jest.fn() },
  database: { healthCheck: jest.fn() },
  getClient: jest.fn(),
  closePool: jest.fn(),
  testConnection: jest.fn(),
  getPoolStats: jest.fn(),
  default: {},
}));

jest.unstable_mockModule('../../../src/database/pg.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/notification-engine.service.js', () => ({
  notificationEngine: {
    send: mockNotificationSend,
  },
}));

jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: {
    emitToUser: mockEmitToUser,
  },
}));

// ============================================
// IMPORTS
// ============================================

const { followService } = await import('../../../src/services/follow.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[], rowCount?: number) {
  return { rows, rowCount: rowCount ?? rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const USER_A = 'user-a-uuid';
const USER_B = 'user-b-uuid';
const FOLLOW_ID = 'follow-uuid-1';

function makeFollowRow(overrides: Record<string, unknown> = {}) {
  return {
    id: FOLLOW_ID,
    requester_id: USER_A,
    recipient_id: USER_B,
    status: 'pending',
    chat_id: null,
    match_reason: null,
    match_score: null,
    requester_message: null,
    accepted_at: null,
    rejected_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('FollowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationSend.mockResolvedValue(undefined);
  });

  // ------------------------------------------
  // sendFollowRequest
  // ------------------------------------------
  describe('sendFollowRequest', () => {
    it('creates a follow request and notifies recipient', async () => {
      const followRow = makeFollowRow();

      // Use implementation-based mock to handle variable ensureTables calls
      let businessCallIndex = 0;
      const businessResults = [
        pgResult([]),                       // SELECT existing relationship (none)
        pgResult([followRow]),              // INSERT follow
        pgResult([{ first_name: 'Alice' }]), // SELECT requester name
        pgResult([]),                       // SELECT buddy suggestion (none)
      ];

      mockQuery.mockImplementation(async (sql: string) => {
        if (typeof sql === 'string' && (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX'))) {
          return pgResult([]);
        }
        const result = businessResults[businessCallIndex] ?? pgResult([]);
        businessCallIndex++;
        return result;
      });

      const result = await followService.sendFollowRequest(USER_A, USER_B, 'Hey!');

      expect(result.id).toBe(FOLLOW_ID);
      expect(result.requesterId).toBe(USER_A);
      expect(result.recipientId).toBe(USER_B);
      expect(mockEmitToUser).toHaveBeenCalledWith(USER_B, 'follow:request', expect.any(Object));
    });

    it('throws when trying to follow a blocked user', async () => {
      mockQuery
        // ensureTables (may be skipped if already ensured)
        .mockResolvedValueOnce(pgResult([{ id: 'existing', status: 'blocked' }])); // existing blocked relationship

      await expect(
        followService.sendFollowRequest(USER_A, USER_B)
      ).rejects.toThrow(/Cannot send follow request/);
    });

    it('throws when follow request already pending', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'existing', status: 'pending' }]));

      await expect(
        followService.sendFollowRequest(USER_A, USER_B)
      ).rejects.toThrow(/already pending/);
    });

    it('throws when already connected', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{ id: 'existing', status: 'accepted' }]));

      await expect(
        followService.sendFollowRequest(USER_A, USER_B)
      ).rejects.toThrow(/Already connected/);
    });
  });

  // ------------------------------------------
  // rejectFollowRequest
  // ------------------------------------------
  describe('rejectFollowRequest', () => {
    it('updates status to rejected', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([], 1)); // UPDATE with rowCount 1

      await expect(
        followService.rejectFollowRequest(FOLLOW_ID, USER_B)
      ).resolves.toBeUndefined();
    });

    it('throws when follow request not found', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([], 0)); // UPDATE with rowCount 0

      await expect(
        followService.rejectFollowRequest('nonexistent', USER_B)
      ).rejects.toThrow(/not found/);
    });
  });

  // ------------------------------------------
  // removeFollow
  // ------------------------------------------
  describe('removeFollow', () => {
    it('deletes follow relationship in either direction', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await expect(
        followService.removeFollow(USER_A, USER_B)
      ).resolves.toBeUndefined();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        [USER_A, USER_B]
      );
    });
  });

  // ------------------------------------------
  // blockUser
  // ------------------------------------------
  describe('blockUser', () => {
    it('upserts follow row with blocked status', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      await followService.blockUser(USER_A, USER_B);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('blocked'),
        [USER_A, USER_B]
      );
    });
  });

  // ------------------------------------------
  // getFollowers
  // ------------------------------------------
  describe('getFollowers', () => {
    it('returns accepted followers with user info', async () => {
      const rows = [
        makeFollowRow({ status: 'accepted', requester_name: 'Alice Smith', requester_avatar: 'https://avatar.url' }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const result = await followService.getFollowers(USER_B);

      expect(result).toHaveLength(1);
      expect(result[0].requesterName).toBe('Alice Smith');
    });
  });

  // ------------------------------------------
  // getFollowing
  // ------------------------------------------
  describe('getFollowing', () => {
    it('returns accepted following with user info', async () => {
      const rows = [
        makeFollowRow({ status: 'accepted', recipient_name: 'Bob Jones', recipient_avatar: null }),
      ];
      mockQuery.mockResolvedValueOnce(pgResult(rows));

      const result = await followService.getFollowing(USER_A);

      expect(result).toHaveLength(1);
      expect(result[0].recipientName).toBe('Bob Jones');
    });
  });

  // ------------------------------------------
  // getRelationship
  // ------------------------------------------
  describe('getRelationship', () => {
    it('returns status and IDs when relationship exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([
        { id: FOLLOW_ID, status: 'accepted', chat_id: 'chat-1' },
      ]));

      const result = await followService.getRelationship(USER_A, USER_B);

      expect(result.status).toBe('accepted');
      expect(result.followId).toBe(FOLLOW_ID);
      expect(result.chatId).toBe('chat-1');
    });

    it('returns null status when no relationship exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const result = await followService.getRelationship(USER_A, USER_B);

      expect(result.status).toBeNull();
      expect(result.followId).toBeNull();
    });
  });

  // ------------------------------------------
  // getSocialStats
  // ------------------------------------------
  describe('getSocialStats', () => {
    it('returns follower, following, mutual, and pending counts', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{
        followers: '10',
        following: '8',
        mutual: '5',
        pending: '2',
      }]));

      const stats = await followService.getSocialStats(USER_A);

      expect(stats.followersCount).toBe(10);
      expect(stats.followingCount).toBe(8);
      expect(stats.mutualCount).toBe(5);
      expect(stats.pendingCount).toBe(2);
    });
  });
});
