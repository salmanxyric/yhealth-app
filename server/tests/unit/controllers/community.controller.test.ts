/**
 * Community Controller Unit Tests
 *
 * Tests all exported handlers: public routes (categories, list, get by slug,
 * increment views, replies), authenticated routes (create post, like, reply),
 * and admin routes (CRUD, bulk delete, stats, AI generation).
 */

import { jest } from '@jest/globals';

// 1. Infrastructure mocks
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

setupDbMock();
setupLoggerMock();
setupCacheMock();

// 2. Mock community service (named exports)
const mockGetCommunityCategories = jest.fn<any>();
const mockListCommunityPosts = jest.fn<any>();
const mockGetCommunityPostBySlug = jest.fn<any>();
const mockIncrementCommunityPostViews = jest.fn<any>();
const mockGetPostRepliesService = jest.fn<any>();
const mockCreateCommunityPost = jest.fn<any>();
const mockLikeCommunityPost = jest.fn<any>();
const mockCreateReply = jest.fn<any>();
const mockGetCommunityPostById = jest.fn<any>();
const mockUpdateCommunityPost = jest.fn<any>();
const mockDeleteCommunityPost = jest.fn<any>();
const mockDeleteReply = jest.fn<any>();
const mockBulkDeleteCommunityPosts = jest.fn<any>();
const mockGetCommunityStats = jest.fn<any>();
const mockGenerateCommunityPostWithAI = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/community.service.js', () => ({
  getCommunityCategories: mockGetCommunityCategories,
  listCommunityPosts: mockListCommunityPosts,
  getCommunityPostBySlug: mockGetCommunityPostBySlug,
  incrementCommunityPostViews: mockIncrementCommunityPostViews,
  getPostReplies: mockGetPostRepliesService,
  createCommunityPost: mockCreateCommunityPost,
  likeCommunityPost: mockLikeCommunityPost,
  createReply: mockCreateReply,
  getCommunityPostById: mockGetCommunityPostById,
  updateCommunityPost: mockUpdateCommunityPost,
  deleteCommunityPost: mockDeleteCommunityPost,
  deleteReply: mockDeleteReply,
  bulkDeleteCommunityPosts: mockBulkDeleteCommunityPosts,
  getCommunityStats: mockGetCommunityStats,
  generateCommunityPostWithAI: mockGenerateCommunityPostWithAI,
}));

// 3. Dynamic imports (AFTER mocks)
const {
  getCommunityPostCategories,
  getPublicCommunityPosts,
  getPublicCommunityPost,
  incrementCommunityViews,
  getPostReplies,
  createCommunityPostHandler,
  likePost,
  createPostReply,
  createAdminCommunityPostHandler,
  getCommunityStatsHandler,
  getAdminCommunityPosts,
  getAdminCommunityPost,
  updateCommunityPostHandler,
  deleteCommunityPostHandler,
  deleteReplyHandler,
  bulkDeleteCommunityPostsHandler,
  generateCommunityPost,
} = await import('../../../src/controllers/community.controller.js');

const { createAuthReq, createRes, createNext, callHandler, getJsonBody, getStatus } =
  await import('../../helpers/controller-harness.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── PUBLIC ROUTES ──────────────────────────────────────────

describe('getCommunityPostCategories', () => {
  it('should return categories', async () => {
    const categories = ['general', 'fitness', 'nutrition'];
    mockGetCommunityCategories.mockResolvedValue(categories);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCommunityPostCategories, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(categories);
    expect(body.message).toBe('Categories retrieved');
  });

  it('should propagate service errors via next', async () => {
    mockGetCommunityCategories.mockRejectedValue(new Error('DB error'));

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCommunityPostCategories, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.message).toBe('DB error');
  });
});

describe('getPublicCommunityPosts', () => {
  const listResult = {
    posts: [{ id: '1', title: 'Test' }],
    page: 1,
    limit: 20,
    total: 1,
  };

  it('should return paginated posts with default params', async () => {
    mockListCommunityPosts.mockResolvedValue(listResult);

    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getPublicCommunityPosts, req, res, next);

    expect(mockListCommunityPosts).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      category: undefined,
      post_type: undefined,
      search: undefined,
      publicOnly: true,
    });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(listResult.posts);
    expect(body.meta).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('should pass query params to service', async () => {
    mockListCommunityPosts.mockResolvedValue({ ...listResult, page: 2 });

    const req = createAuthReq({}, {
      query: { page: '2', limit: '10', category: 'fitness', post_type: 'tip', search: 'test' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(getPublicCommunityPosts, req, res, next);

    expect(mockListCommunityPosts).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      category: 'fitness',
      post_type: 'tip',
      search: 'test',
      publicOnly: true,
    });
  });
});

describe('getPublicCommunityPost', () => {
  it('should return post by slug', async () => {
    const post = { id: '1', slug: 'test-post', title: 'Test' };
    mockGetCommunityPostBySlug.mockResolvedValue(post);

    const req = createAuthReq({}, { params: { slug: 'test-post' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getPublicCommunityPost, req, res, next);

    expect(mockGetCommunityPostBySlug).toHaveBeenCalledWith('test-post');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(post);
  });

  it('should throw 404 when post not found', async () => {
    mockGetCommunityPostBySlug.mockResolvedValue(null);

    const req = createAuthReq({}, { params: { slug: 'nonexistent' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getPublicCommunityPost, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

describe('incrementCommunityViews', () => {
  it('should increment views and return success', async () => {
    mockIncrementCommunityPostViews.mockResolvedValue(undefined);

    const req = createAuthReq({}, { params: { id: 'post-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(incrementCommunityViews, req, res, next);

    expect(mockIncrementCommunityPostViews).toHaveBeenCalledWith('post-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
    expect(body.message).toBe('View count incremented');
  });
});

describe('getPostReplies', () => {
  it('should return replies with default pagination', async () => {
    const repliesResult = { replies: [], total: 0 };
    mockGetPostRepliesService.mockResolvedValue(repliesResult);

    const req = createAuthReq({}, { params: { id: 'post-1' }, query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getPostReplies, req, res, next);

    expect(mockGetPostRepliesService).toHaveBeenCalledWith('post-1', 1, 20);
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(repliesResult);
  });

  it('should pass custom pagination params', async () => {
    mockGetPostRepliesService.mockResolvedValue({ replies: [], total: 0 });

    const req = createAuthReq({}, { params: { id: 'post-1' }, query: { page: '3', limit: '5' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getPostReplies, req, res, next);

    expect(mockGetPostRepliesService).toHaveBeenCalledWith('post-1', 3, 5);
  });
});

// ─── AUTHENTICATED ROUTES ───────────────────────────────────

describe('createCommunityPostHandler', () => {
  it('should create a post with authenticated user', async () => {
    const post = { id: '1', title: 'New Post' };
    mockCreateCommunityPost.mockResolvedValue(post);

    const req = createAuthReq(
      { userId: 'user-1' },
      { body: { title: 'New Post', content: 'Content' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createCommunityPostHandler, req, res, next);

    expect(mockCreateCommunityPost).toHaveBeenCalledWith({
      title: 'New Post',
      content: 'Content',
      author_id: 'user-1',
    });
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(post);
  });

  it('should throw 401 when user not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(createCommunityPostHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

describe('likePost', () => {
  it('should like a post', async () => {
    mockLikeCommunityPost.mockResolvedValue(undefined);

    const req = createAuthReq({}, { params: { id: 'post-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(likePost, req, res, next);

    expect(mockLikeCommunityPost).toHaveBeenCalledWith('post-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.message).toBe('Post liked');
  });
});

describe('createPostReply', () => {
  it('should create a reply with authenticated user', async () => {
    const reply = { id: 'reply-1', content: 'Nice post!' };
    mockCreateReply.mockResolvedValue(reply);

    const req = createAuthReq(
      { userId: 'user-1' },
      { params: { id: 'post-1' }, body: { content: 'Nice post!' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createPostReply, req, res, next);

    expect(mockCreateReply).toHaveBeenCalledWith('post-1', 'user-1', 'Nice post!');
    expect(getStatus(res)).toBe(201);
    const body = getJsonBody(res);
    expect(body.data).toEqual(reply);
  });

  it('should throw 401 when user not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(createPostReply, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

// ─── ADMIN ROUTES ───────────────────────────────────────────

describe('createAdminCommunityPostHandler', () => {
  it('should create a post as admin', async () => {
    const post = { id: '1', title: 'Admin Post' };
    mockCreateCommunityPost.mockResolvedValue(post);

    const req = createAuthReq(
      { userId: 'admin-1', role: 'admin' },
      { body: { title: 'Admin Post', content: 'Admin content', status: 'published' } }
    );
    const res = createRes();
    const next = createNext();

    await callHandler(createAdminCommunityPostHandler, req, res, next);

    expect(mockCreateCommunityPost).toHaveBeenCalledWith({
      title: 'Admin Post',
      content: 'Admin content',
      status: 'published',
      author_id: 'admin-1',
    });
    expect(getStatus(res)).toBe(201);
  });

  it('should throw 401 when not authenticated', async () => {
    const req = createAuthReq();
    (req as any).user = undefined;
    const res = createRes();
    const next = createNext();

    await callHandler(createAdminCommunityPostHandler, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });
});

describe('getCommunityStatsHandler', () => {
  it('should return community stats', async () => {
    const stats = { totalPosts: 100, totalReplies: 500 };
    mockGetCommunityStats.mockResolvedValue(stats);

    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    await callHandler(getCommunityStatsHandler, req, res, next);

    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(stats);
    expect(body.message).toBe('Stats retrieved');
  });
});

describe('getAdminCommunityPosts', () => {
  it('should return paginated posts with admin filters', async () => {
    const listResult = { posts: [], page: 1, limit: 20, total: 0 };
    mockListCommunityPosts.mockResolvedValue(listResult);

    const req = createAuthReq({}, {
      query: { page: '1', limit: '20', status: 'draft', category: 'fitness', search: 'test' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(getAdminCommunityPosts, req, res, next);

    expect(mockListCommunityPosts).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: 'draft',
      category: 'fitness',
      search: 'test',
    });
    expect(getStatus(res)).toBe(200);
  });

  it('should use default pagination when no query params', async () => {
    mockListCommunityPosts.mockResolvedValue({ posts: [], page: 1, limit: 20, total: 0 });

    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(getAdminCommunityPosts, req, res, next);

    expect(mockListCommunityPosts).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      status: undefined,
      category: undefined,
      search: undefined,
    });
  });
});

describe('getAdminCommunityPost', () => {
  it('should return post by id', async () => {
    const post = { id: 'post-1', title: 'Admin View' };
    mockGetCommunityPostById.mockResolvedValue(post);

    const req = createAuthReq({}, { params: { id: 'post-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getAdminCommunityPost, req, res, next);

    expect(mockGetCommunityPostById).toHaveBeenCalledWith('post-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(post);
  });

  it('should throw 404 when post not found', async () => {
    mockGetCommunityPostById.mockResolvedValue(null);

    const req = createAuthReq({}, { params: { id: 'nonexistent' } });
    const res = createRes();
    const next = createNext();

    await callHandler(getAdminCommunityPost, req, res, next);

    expect(next).toHaveBeenCalled();
    const error = (next as jest.Mock<any>).mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });
});

describe('updateCommunityPostHandler', () => {
  it('should update a post', async () => {
    const updated = { id: 'post-1', title: 'Updated' };
    mockUpdateCommunityPost.mockResolvedValue(updated);

    const req = createAuthReq({}, { params: { id: 'post-1' }, body: { title: 'Updated' } });
    const res = createRes();
    const next = createNext();

    await callHandler(updateCommunityPostHandler, req, res, next);

    expect(mockUpdateCommunityPost).toHaveBeenCalledWith('post-1', { title: 'Updated' });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(updated);
    expect(body.message).toBe('Community post updated');
  });
});

describe('deleteCommunityPostHandler', () => {
  it('should delete a post', async () => {
    mockDeleteCommunityPost.mockResolvedValue(undefined);

    const req = createAuthReq({}, { params: { id: 'post-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(deleteCommunityPostHandler, req, res, next);

    expect(mockDeleteCommunityPost).toHaveBeenCalledWith('post-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
    expect(body.message).toBe('Community post deleted');
  });
});

describe('deleteReplyHandler', () => {
  it('should delete a reply', async () => {
    mockDeleteReply.mockResolvedValue(undefined);

    const req = createAuthReq({}, { params: { id: 'reply-1' } });
    const res = createRes();
    const next = createNext();

    await callHandler(deleteReplyHandler, req, res, next);

    expect(mockDeleteReply).toHaveBeenCalledWith('reply-1');
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toBeNull();
    expect(body.message).toBe('Reply deleted');
  });
});

describe('bulkDeleteCommunityPostsHandler', () => {
  it('should bulk delete posts and return count', async () => {
    mockBulkDeleteCommunityPosts.mockResolvedValue(3);

    const req = createAuthReq({}, { body: { ids: ['id-1', 'id-2', 'id-3'] } });
    const res = createRes();
    const next = createNext();

    await callHandler(bulkDeleteCommunityPostsHandler, req, res, next);

    expect(mockBulkDeleteCommunityPosts).toHaveBeenCalledWith(['id-1', 'id-2', 'id-3']);
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual({ deletedCount: 3 });
    expect(body.message).toBe('3 post(s) deleted');
  });
});

describe('generateCommunityPost', () => {
  it('should generate a community post with AI', async () => {
    const generated = { title: 'AI Post', content: 'Generated content' };
    mockGenerateCommunityPostWithAI.mockResolvedValue(generated);

    const req = createAuthReq({}, {
      body: {
        topic: 'Healthy eating tips',
        post_type: 'tip',
        tone: 'friendly',
        length: 'medium',
      },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(generateCommunityPost, req, res, next);

    expect(mockGenerateCommunityPostWithAI).toHaveBeenCalledWith({
      topic: 'Healthy eating tips',
      post_type: 'tip',
      requirements: undefined,
      tone: 'friendly',
      targetAudience: undefined,
      length: 'medium',
    });
    expect(getStatus(res)).toBe(200);
    const body = getJsonBody(res);
    expect(body.data).toEqual(generated);
    expect(body.message).toBe('Community post content generated successfully');
  });

  it('should use defaults for optional fields', async () => {
    const generated = { title: 'AI Post', content: 'Content' };
    mockGenerateCommunityPostWithAI.mockResolvedValue(generated);

    const req = createAuthReq({}, {
      body: { topic: 'Fitness' },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(generateCommunityPost, req, res, next);

    expect(mockGenerateCommunityPostWithAI).toHaveBeenCalledWith({
      topic: 'Fitness',
      post_type: 'discussion',
      requirements: undefined,
      tone: 'friendly',
      targetAudience: undefined,
      length: 'medium',
    });
  });

  it('should pass validation error to next when topic is missing', async () => {
    const req = createAuthReq({}, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(generateCommunityPost, req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
