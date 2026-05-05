/**
 * Follow Controller Unit Tests
 * Tests: sendFollowRequest, acceptFollowRequest, rejectFollowRequest, removeFollow,
 *        blockUser, getFollowers, getFollowing, getPendingRequests, getMutualFollows,
 *        getRelationship, getSocialStats, getConsent, updateConsent, getSuggestions,
 *        dismissSuggestion, searchUsers.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── Service mocks ──
const mockFollowService = {
  sendFollowRequest: jest.fn<any>(),
  acceptFollowRequest: jest.fn<any>(),
  rejectFollowRequest: jest.fn<any>(),
  removeFollow: jest.fn<any>(),
  blockUser: jest.fn<any>(),
  getFollowers: jest.fn<any>(),
  getFollowing: jest.fn<any>(),
  getPendingRequests: jest.fn<any>(),
  getMutualFollows: jest.fn<any>(),
  getRelationship: jest.fn<any>(),
  getSocialStats: jest.fn<any>(),
  getConsent: jest.fn<any>(),
  updateConsent: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/follow.service.js', () => ({
  followService: mockFollowService,
}));

// Lazy-imported service mocks
const mockBuddySuggestionService = {
  getSuggestions: jest.fn<any>(),
  dismissSuggestion: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/buddy-suggestion.service.js', () => ({
  buddySuggestionService: mockBuddySuggestionService,
}));

// ── Dynamic imports AFTER mocks ──
const {
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollow,
  blockUser,
  getFollowers,
  getFollowing,
  getPendingRequests,
  getMutualFollows,
  getRelationship,
  getSocialStats,
  getConsent,
  updateConsent,
  getSuggestions,
  dismissSuggestion,
  searchUsers,
} = await import('../../../src/controllers/follow.controller.js');

const { createAuthReq, createReq, createRes, createNext, getJsonBody, getStatus, callHandler } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// sendFollowRequest
// ─────────────────────────────────────────────
describe('sendFollowRequest', () => {
  it('returns 201 with follow data', async () => {
    const follow = { id: 'f-1', followerId: 'u-1', followeeId: 'u-2', status: 'pending' };
    mockFollowService.sendFollowRequest.mockResolvedValueOnce(follow);

    const req = createAuthReq({ userId: 'u-1' }, {
      params: { userId: 'u-2' },
      body: { message: 'Hi!' },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    expect(mockFollowService.sendFollowRequest).toHaveBeenCalledWith('u-1', 'u-2', 'Hi!');
    expect(getStatus(res)).toBe(201);
    expect(getJsonBody(res).data).toEqual({ follow });
  });

  it('calls next with 400 when targetId is missing', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { params: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when trying to follow self', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 400 when service throws Error', async () => {
    mockFollowService.sendFollowRequest.mockRejectedValueOnce(new Error('Already following'));

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('rethrows non-Error exceptions', async () => {
    mockFollowService.sendFollowRequest.mockRejectedValueOnce('raw string error');

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    // asyncHandler catches and passes to next
    expect(next).toHaveBeenCalled();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(sendFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// acceptFollowRequest
// ─────────────────────────────────────────────
describe('acceptFollowRequest', () => {
  it('returns 200 with accepted follow', async () => {
    const follow = { id: 'f-1', status: 'accepted' };
    mockFollowService.acceptFollowRequest.mockResolvedValueOnce(follow);

    const req = createAuthReq({ userId: 'u-1' }, { params: { followId: 'f-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(acceptFollowRequest, req, res, next);

    expect(mockFollowService.acceptFollowRequest).toHaveBeenCalledWith('f-1', 'u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ follow });
  });

  it('calls next with 400 when service throws Error', async () => {
    mockFollowService.acceptFollowRequest.mockRejectedValueOnce(new Error('Not found'));

    const req = createAuthReq({ userId: 'u-1' }, { params: { followId: 'f-999' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(acceptFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { followId: 'f-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(acceptFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// rejectFollowRequest
// ─────────────────────────────────────────────
describe('rejectFollowRequest', () => {
  it('returns 200 with null data', async () => {
    mockFollowService.rejectFollowRequest.mockResolvedValueOnce(undefined);

    const req = createAuthReq({ userId: 'u-1' }, { params: { followId: 'f-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(rejectFollowRequest, req, res, next);

    expect(mockFollowService.rejectFollowRequest).toHaveBeenCalledWith('f-1', 'u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeNull();
  });

  it('calls next with 400 when service throws Error', async () => {
    mockFollowService.rejectFollowRequest.mockRejectedValueOnce(new Error('Not found'));

    const req = createAuthReq({ userId: 'u-1' }, { params: { followId: 'f-999' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(rejectFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(400);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { followId: 'f-1' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(rejectFollowRequest, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// removeFollow
// ─────────────────────────────────────────────
describe('removeFollow', () => {
  it('returns 200 with null data', async () => {
    mockFollowService.removeFollow.mockResolvedValueOnce(undefined);

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(removeFollow, req, res, next);

    expect(mockFollowService.removeFollow).toHaveBeenCalledWith('u-1', 'u-2');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeNull();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(removeFollow, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// blockUser
// ─────────────────────────────────────────────
describe('blockUser', () => {
  it('returns 200 with null data', async () => {
    mockFollowService.blockUser.mockResolvedValueOnce(undefined);

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(blockUser, req, res, next);

    expect(mockFollowService.blockUser).toHaveBeenCalledWith('u-1', 'u-2');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeNull();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(blockUser, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getFollowers
// ─────────────────────────────────────────────
describe('getFollowers', () => {
  it('returns 200 with followers list and count', async () => {
    const followers = [{ id: 'u-2', name: 'Alice' }, { id: 'u-3', name: 'Bob' }];
    mockFollowService.getFollowers.mockResolvedValueOnce(followers);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getFollowers, req, res, next);

    expect(mockFollowService.getFollowers).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.followers).toEqual(followers);
    expect(body.data.count).toBe(2);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getFollowers, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getFollowing
// ─────────────────────────────────────────────
describe('getFollowing', () => {
  it('returns 200 with following list and count', async () => {
    const following = [{ id: 'u-3', name: 'Bob' }];
    mockFollowService.getFollowing.mockResolvedValueOnce(following);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getFollowing, req, res, next);

    expect(mockFollowService.getFollowing).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.following).toEqual(following);
    expect(body.data.count).toBe(1);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getFollowing, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getPendingRequests
// ─────────────────────────────────────────────
describe('getPendingRequests', () => {
  it('returns 200 with pending requests and count', async () => {
    const pending = [{ id: 'f-1', userId: 'u-4' }];
    mockFollowService.getPendingRequests.mockResolvedValueOnce(pending);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getPendingRequests, req, res, next);

    expect(mockFollowService.getPendingRequests).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.requests).toEqual(pending);
    expect(body.data.count).toBe(1);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getPendingRequests, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getMutualFollows
// ─────────────────────────────────────────────
describe('getMutualFollows', () => {
  it('returns 200 with mutual follows and count', async () => {
    const mutual = [{ id: 'u-2' }, { id: 'u-3' }];
    mockFollowService.getMutualFollows.mockResolvedValueOnce(mutual);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getMutualFollows, req, res, next);

    expect(mockFollowService.getMutualFollows).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.mutual).toEqual(mutual);
    expect(body.data.count).toBe(2);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getMutualFollows, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getRelationship
// ─────────────────────────────────────────────
describe('getRelationship', () => {
  it('returns 200 with relationship data', async () => {
    const relationship = { isFollowing: true, isFollowedBy: false, isBlocked: false };
    mockFollowService.getRelationship.mockResolvedValueOnce(relationship);

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getRelationship, req, res, next);

    expect(mockFollowService.getRelationship).toHaveBeenCalledWith('u-1', 'u-2');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ relationship });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { userId: 'u-2' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getRelationship, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getSocialStats
// ─────────────────────────────────────────────
describe('getSocialStats', () => {
  it('returns 200 with stats', async () => {
    const stats = { followers: 10, following: 5, mutual: 3 };
    mockFollowService.getSocialStats.mockResolvedValueOnce(stats);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getSocialStats, req, res, next);

    expect(mockFollowService.getSocialStats).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ stats });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getSocialStats, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getConsent
// ─────────────────────────────────────────────
describe('getConsent', () => {
  it('returns 200 with consent data', async () => {
    const consent = { shareHealth: true, shareActivity: false };
    mockFollowService.getConsent.mockResolvedValueOnce(consent);

    const req = createAuthReq({ userId: 'u-1' });
    const res = createRes();
    const next = createNext();

    await callHandler(getConsent, req, res, next);

    expect(mockFollowService.getConsent).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ consent });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getConsent, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// updateConsent
// ─────────────────────────────────────────────
describe('updateConsent', () => {
  it('returns 200 with updated consent', async () => {
    const updatedConsent = { shareHealth: false, shareActivity: true };
    mockFollowService.updateConsent.mockResolvedValueOnce(undefined);
    mockFollowService.getConsent.mockResolvedValueOnce(updatedConsent);

    const req = createAuthReq({ userId: 'u-1' }, {
      body: { shareHealth: false, shareActivity: true },
    } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateConsent, req, res, next);

    expect(mockFollowService.updateConsent).toHaveBeenCalledWith('u-1', { shareHealth: false, shareActivity: true });
    expect(mockFollowService.getConsent).toHaveBeenCalledWith('u-1');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ consent: updatedConsent });
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ body: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(updateConsent, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// getSuggestions
// ─────────────────────────────────────────────
describe('getSuggestions', () => {
  it('returns 200 with suggestions', async () => {
    const suggestions = [{ id: 'u-5', name: 'Eve', score: 0.9 }];
    mockBuddySuggestionService.getSuggestions.mockResolvedValueOnce(suggestions);

    const req = createAuthReq({ userId: 'u-1' }, { query: { limit: '5' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getSuggestions, req, res, next);

    expect(mockBuddySuggestionService.getSuggestions).toHaveBeenCalledWith('u-1', 5);
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ suggestions });
  });

  it('defaults limit to 10', async () => {
    mockBuddySuggestionService.getSuggestions.mockResolvedValueOnce([]);

    const req = createAuthReq({ userId: 'u-1' }, { query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getSuggestions, req, res, next);

    expect(mockBuddySuggestionService.getSuggestions).toHaveBeenCalledWith('u-1', 10);
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ query: {} } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(getSuggestions, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// dismissSuggestion
// ─────────────────────────────────────────────
describe('dismissSuggestion', () => {
  it('returns 200 with null data', async () => {
    mockBuddySuggestionService.dismissSuggestion.mockResolvedValueOnce(undefined);

    const req = createAuthReq({ userId: 'u-1' }, { params: { userId: 'u-5' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(dismissSuggestion, req, res, next);

    expect(mockBuddySuggestionService.dismissSuggestion).toHaveBeenCalledWith('u-1', 'u-5');
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toBeNull();
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ params: { userId: 'u-5' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(dismissSuggestion, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});

// ─────────────────────────────────────────────
// searchUsers
// ─────────────────────────────────────────────
describe('searchUsers', () => {
  it('returns 200 with matching users from database', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'u-2', name: 'Alice Smith', avatar: 'https://example.com/alice.jpg' },
        { id: 'u-3', name: 'Alice Jones', avatar: null },
      ],
    });

    const req = createAuthReq({ userId: 'u-1' }, { query: { query: 'Alice' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    expect(mockQuery).toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data.users).toHaveLength(2);
    expect(body.data.users[0]).toEqual({ id: 'u-2', name: 'Alice Smith', avatar: 'https://example.com/alice.jpg' });
    // null avatar becomes undefined
    expect(body.data.users[1].avatar).toBeUndefined();
  });

  it('returns empty array when query is too short', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { query: { query: 'A' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ users: [] });
  });

  it('returns empty array when query is empty', async () => {
    const req = createAuthReq({ userId: 'u-1' }, { query: { query: '' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    expect(mockQuery).not.toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
    expect(getJsonBody(res).data).toEqual({ users: [] });
  });

  it('uses q param as fallback', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: 'u-1' }, { query: { q: 'Bob' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    expect(mockQuery).toHaveBeenCalled();
    expect(getStatus(res)).toBe(200);
  });

  it('clamps limit to max 50', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: 'u-1' }, { query: { query: 'test', limit: '100' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    // The third parameter to query should be clamped to 50
    const queryArgs = mockQuery.mock.calls[0][1];
    expect(queryArgs[2]).toBe(50);
  });

  it('escapes SQL wildcard characters in query', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const req = createAuthReq({ userId: 'u-1' }, { query: { query: '100%_test' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    const queryArgs = mockQuery.mock.calls[0][1];
    // The LIKE pattern should have escaped % and _
    expect(queryArgs[1]).toBe('%100\\%\\_test%');
  });

  it('falls back name to User when name is empty', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'u-2', name: '', avatar: null }],
    });

    const req = createAuthReq({ userId: 'u-1' }, { query: { query: 'test' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    const body = getJsonBody(res);
    expect(body.data.users[0].name).toBe('User');
  });

  it('calls next with 401 when not authenticated', async () => {
    const req = createReq({ query: { query: 'Alice' } } as any);
    const res = createRes();
    const next = createNext();

    await callHandler(searchUsers, req, res, next);

    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock<any>).mock.calls[0][0];
    expect(err.statusCode).toBe(401);
  });
});
