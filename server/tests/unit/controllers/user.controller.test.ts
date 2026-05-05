/**
 * User Controller Unit Tests
 *
 * Tests admin CRUD operations: list, get by id, create, update,
 * delete, bulk delete, bulk status update, toggle status, and stats.
 *
 * All handlers are wrapped with asyncHandler, so errors propagate to next().
 */

import { jest } from '@jest/globals';
import type { Response as _Response, NextFunction as _NextFunction } from 'express';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks ────────────────────────────────────────
setupDbMock();
setupLoggerMock();
setupCacheMock();

// ── User service mock ───────────────────────────────────────────
const mockListUsers = jest.fn<any>();
const mockGetUserById = jest.fn<any>();
const mockCreateUser = jest.fn<any>();
const mockUpdateUser = jest.fn<any>();
const mockDeleteUser = jest.fn<any>();
const mockBulkDeleteUsers = jest.fn<any>();
const mockBulkUpdateUserStatus = jest.fn<any>();
const mockToggleUserStatus = jest.fn<any>();
const mockGetUserStats = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/user.service.js', () => ({
  listUsers: mockListUsers,
  getUserById: mockGetUserById,
  createUser: mockCreateUser,
  updateUser: mockUpdateUser,
  deleteUser: mockDeleteUser,
  bulkDeleteUsers: mockBulkDeleteUsers,
  bulkUpdateUserStatus: mockBulkUpdateUserStatus,
  toggleUserStatus: mockToggleUserStatus,
  getUserStats: mockGetUserStats,
}));

// ── Dynamic imports ─────────────────────────────────────────────
const {
  getAdminUsers,
  getUserStatistics,
  getAdminUserById,
  createUserPost,
  updateUserPut,
  deleteUserDelete,
  bulkDeleteUsersPost,
  bulkUpdateUserStatusPost,
  toggleUserStatusPost,
} = await import('../../../src/controllers/user.controller.js');

const { createAuthReq, createRes, createNext, callHandler, getJsonBody: _getJsonBody, getStatus, expectSuccess } =
  await import('../../helpers/controller-harness.js');

const { buildUserRow } = await import('../../helpers/factories.js');

// ─────────────────────────────────────────────────────────────────

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getAdminUsers ─────────────────────────────────────────────

  describe('getAdminUsers', () => {
    it('returns paginated user list with 200', async () => {
      const users = [buildUserRow(), buildUserRow()];
      mockListUsers.mockResolvedValue({
        users,
        page: 1,
        limit: 20,
        total: 2,
      });

      const req = createAuthReq({ role: 'admin' }, { query: {} } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(getAdminUsers, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data).toHaveLength(2);
      expect(body.meta).toBeDefined();
      expect(body.meta.total).toBe(2);
    });

    it('passes query filters to service', async () => {
      mockListUsers.mockResolvedValue({
        users: [],
        page: 1,
        limit: 10,
        total: 0,
      });

      const req = createAuthReq(
        { role: 'admin' },
        {
          query: {
            page: '2',
            limit: '10',
            role: 'user',
            is_active: 'true',
            search: 'john',
          },
        } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(getAdminUsers, req, res, next);

      expect(mockListUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          is_active: true,
          search: 'john',
        }),
        expect.objectContaining({
          page: 2,
          limit: 10,
        })
      );
    });

    it('propagates service errors to next()', async () => {
      mockListUsers.mockRejectedValue(new Error('DB error'));

      const req = createAuthReq({ role: 'admin' }, { query: {} } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(getAdminUsers, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── getUserStatistics ─────────────────────────────────────────

  describe('getUserStatistics', () => {
    it('returns user stats with 200', async () => {
      const stats = { totalUsers: 100, activeUsers: 80, newToday: 5 };
      mockGetUserStats.mockResolvedValue(stats);

      const req = createAuthReq({ role: 'admin' });
      const res = createRes();
      const next = createNext();

      await callHandler(getUserStatistics, req, res, next);

      const body = expectSuccess(res);
      expect(body.data).toEqual(stats);
    });
  });

  // ── getAdminUserById ──────────────────────────────────────────

  describe('getAdminUserById', () => {
    it('returns user with 200 when found', async () => {
      const user = buildUserRow();
      mockGetUserById.mockResolvedValue(user);

      const req = createAuthReq({ role: 'admin' }, { params: { id: user.id } } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(getAdminUserById, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data).toEqual(user);
    });

    it('passes ApiError.notFound to next when user does not exist', async () => {
      mockGetUserById.mockResolvedValue(null);

      const req = createAuthReq({ role: 'admin' }, { params: { id: 'nonexistent' } } as any);
      const res = createRes();
      const next = createNext();

      await callHandler(getAdminUserById, req, res, next);

      expect(next).toHaveBeenCalled();
      const err = (next as jest.Mock<any>).mock.calls[0][0];
      expect(err.statusCode).toBe(404);
    });
  });

  // ── createUserPost ────────────────────────────────────────────

  describe('createUserPost', () => {
    it('creates user and returns 201', async () => {
      const created = buildUserRow();
      mockCreateUser.mockResolvedValue(created);
      mockGetUserById.mockResolvedValue(created);

      const req = createAuthReq(
        { role: 'admin' },
        {
          body: {
            email: created.email,
            first_name: created.first_name,
            last_name: created.last_name,
            password: 'SecureP@ss1',
          },
        } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(createUserPost, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(getStatus(res)).toBe(201);
      expect(mockCreateUser).toHaveBeenCalled();
    });

    it('propagates service errors to next()', async () => {
      mockCreateUser.mockRejectedValue(new Error('Duplicate email'));

      const req = createAuthReq(
        { role: 'admin' },
        { body: { email: 'dup@example.com', password: 'P@ss1' } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(createUserPost, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ── updateUserPut ─────────────────────────────────────────────

  describe('updateUserPut', () => {
    it('updates user and returns 200', async () => {
      const user = buildUserRow({ first_name: 'Updated' });
      mockUpdateUser.mockResolvedValue(user);
      mockGetUserById.mockResolvedValue(user);

      const req = createAuthReq(
        { role: 'admin' },
        { params: { id: user.id }, body: { first_name: 'Updated' } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(updateUserPut, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.data).toEqual(user);
    });
  });

  // ── deleteUserDelete ──────────────────────────────────────────

  describe('deleteUserDelete', () => {
    it('deletes user and returns 200', async () => {
      mockDeleteUser.mockResolvedValue(undefined);

      const req = createAuthReq(
        { role: 'admin' },
        { params: { id: 'user-to-delete' } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(deleteUserDelete, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockDeleteUser).toHaveBeenCalledWith('user-to-delete');
      const body = expectSuccess(res);
      expect(body.data).toBeNull();
    });
  });

  // ── bulkDeleteUsersPost ───────────────────────────────────────

  describe('bulkDeleteUsersPost', () => {
    it('bulk deletes users and returns 200', async () => {
      const ids = ['id1', 'id2', 'id3'];
      mockBulkDeleteUsers.mockResolvedValue(undefined);

      const req = createAuthReq(
        { role: 'admin' },
        { body: { ids } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(bulkDeleteUsersPost, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockBulkDeleteUsers).toHaveBeenCalledWith(ids);
      const body = expectSuccess(res);
      expect(body.message).toContain('3 user(s) deleted');
    });
  });

  // ── bulkUpdateUserStatusPost ──────────────────────────────────

  describe('bulkUpdateUserStatusPost', () => {
    it('activates users in bulk', async () => {
      mockBulkUpdateUserStatus.mockResolvedValue(undefined);

      const req = createAuthReq(
        { role: 'admin' },
        { body: { ids: ['id1', 'id2'], is_active: true } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(bulkUpdateUserStatusPost, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(mockBulkUpdateUserStatus).toHaveBeenCalledWith(['id1', 'id2'], true);
      const body = expectSuccess(res);
      expect(body.message).toContain('activated');
    });

    it('deactivates users in bulk', async () => {
      mockBulkUpdateUserStatus.mockResolvedValue(undefined);

      const req = createAuthReq(
        { role: 'admin' },
        { body: { ids: ['id1'], is_active: false } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(bulkUpdateUserStatusPost, req, res, next);

      const body = expectSuccess(res);
      expect(body.message).toContain('deactivated');
    });
  });

  // ── toggleUserStatusPost ──────────────────────────────────────

  describe('toggleUserStatusPost', () => {
    it('toggles user status and returns result', async () => {
      const user = buildUserRow({ is_active: false });
      mockToggleUserStatus.mockResolvedValue(user);

      const req = createAuthReq(
        { role: 'admin' },
        { params: { id: user.id } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(toggleUserStatusPost, req, res, next);

      expect(next).not.toHaveBeenCalled();
      const body = expectSuccess(res);
      expect(body.message).toContain('deactivated');
    });

    it('propagates service errors to next()', async () => {
      mockToggleUserStatus.mockRejectedValue(new Error('User not found'));

      const req = createAuthReq(
        { role: 'admin' },
        { params: { id: 'nonexistent' } } as any
      );
      const res = createRes();
      const next = createNext();

      await callHandler(toggleUserStatusPost, req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
