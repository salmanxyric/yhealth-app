/**
 * User Service Unit Tests
 *
 * Tests for user CRUD, filtering, pagination, toggle status, and stats.
 */

import { jest } from '@jest/globals';

// ============================================
// MOCKS (unstable_mockModule for ESM)
// ============================================

const mockQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

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

// Mock the encryption helper used by createUser
jest.unstable_mockModule('../../../src/helper/encryption.js', () => ({
  hashPassword: jest.fn<any>().mockResolvedValue('hashed_password_123'),
}));

// ============================================
// IMPORTS (dynamic, after mock setup)
// ============================================

const { ApiError: _ApiError } = await import('../../../src/utils/ApiError.js');
const {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  bulkUpdateUserStatus,
  toggleUserStatus,
  getUserStats,
  listUsers,
} = await import('../../../src/services/user.service.js');

// ============================================
// HELPERS
// ============================================

function pgResult<T>(rows: T[]) {
  return { rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] };
}

const sampleUser = {
  id: 'u-001',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role_id: '11111111-1111-1111-1111-111111111101',
  is_active: true,
  is_email_verified: false,
  phone: null,
  date_of_birth: null,
  gender: null,
  avatar: null,
  password: 'hashed',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
  last_login: null,
  stripe_customer_id: null,
};

// ============================================
// TESTS
// ============================================

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUserById', () => {
  it('returns user with blog count when found', async () => {
    const row = { ...sampleUser, role: 'user', blog_count: '3' };
    mockQuery.mockResolvedValueOnce(pgResult([row]));

    const result = await getUserById('u-001');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('u-001');
    expect(result!.blog_count).toBe(3);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE u.id = $1'), ['u-001']);
  });

  it('returns null when user not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const result = await getUserById('nonexistent');

    expect(result).toBeNull();
  });
});

describe('getUserByEmail', () => {
  it('returns user row when found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([sampleUser]));

    const result = await getUserByEmail('john@example.com');

    expect(result).not.toBeNull();
    expect(result!.email).toBe('john@example.com');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = $1'),
      ['john@example.com'],
    );
  });

  it('returns null for unknown email', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const result = await getUserByEmail('nobody@example.com');

    expect(result).toBeNull();
  });

  it('lowercases email before querying', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await getUserByEmail('JOHN@EXAMPLE.COM');

    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ['john@example.com'],
    );
  });
});

describe('createUser', () => {
  it('inserts a new user and returns the row', async () => {
    // getUserByEmail check (no existing user)
    mockQuery.mockResolvedValueOnce(pgResult([]));
    // INSERT query
    mockQuery.mockResolvedValueOnce(pgResult([sampleUser]));

    const result = await createUser({
      email: 'john@example.com',
      password: 'secret123',
      first_name: 'John',
      last_name: 'Doe',
    });

    expect(result.email).toBe('john@example.com');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'User created',
      expect.objectContaining({ email: 'john@example.com' }),
    );
  });

  it('throws conflict when email already exists', async () => {
    // getUserByEmail returns existing user
    mockQuery.mockResolvedValueOnce(pgResult([sampleUser]));

    await expect(
      createUser({ email: 'john@example.com', first_name: 'John', last_name: 'Doe' }),
    ).rejects.toThrow('User with this email already exists');
  });

  it('creates user without password when not provided', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));
    const noPassUser = { ...sampleUser, password: null };
    mockQuery.mockResolvedValueOnce(pgResult([noPassUser]));

    const result = await createUser({
      email: 'jane@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
    });

    expect(result).toBeDefined();
    // The INSERT call should have null for password
    const insertCall = mockQuery.mock.calls[1];
    expect(insertCall[1][1]).toBeNull(); // password param
  });
});

describe('updateUser', () => {
  it('updates specified fields and returns updated user', async () => {
    // getUserById
    const existingRow = { ...sampleUser, role: 'user', blog_count: '0' };
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    // UPDATE
    const updatedUser = { ...sampleUser, first_name: 'Jonathan' };
    mockQuery.mockResolvedValueOnce(pgResult([updatedUser]));

    const result = await updateUser('u-001', { first_name: 'Jonathan' });

    expect(result.first_name).toBe('Jonathan');
    expect(mockLogger.info).toHaveBeenCalledWith('User updated', { userId: 'u-001' });
  });

  it('throws 404 when user not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await expect(updateUser('nonexistent', { first_name: 'X' })).rejects.toThrow('User not found');
  });

  it('returns existing user when no fields to update', async () => {
    const existingRow = { ...sampleUser, role: 'user', blog_count: '0' };
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));

    const result = await updateUser('u-001', {});

    // Should return existing user without running UPDATE
    expect(result).toBeDefined();
    // Only 1 query call (getUserById), no UPDATE call
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('deleteUser', () => {
  it('deletes user when found', async () => {
    const existingRow = { ...sampleUser, role: 'user', blog_count: '0' };
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await deleteUser('u-001');

    expect(mockQuery).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1', ['u-001']);
    expect(mockLogger.info).toHaveBeenCalledWith('User deleted', { userId: 'u-001' });
  });

  it('throws 404 when user not found', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await expect(deleteUser('nonexistent')).rejects.toThrow('User not found');
  });
});

describe('bulkDeleteUsers', () => {
  it('deletes multiple users by ids', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await bulkDeleteUsers(['u-001', 'u-002']);

    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM users WHERE id = ANY($1)',
      [['u-001', 'u-002']],
    );
  });

  it('does nothing for empty id list', async () => {
    await bulkDeleteUsers([]);

    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('bulkUpdateUserStatus', () => {
  it('updates status for multiple users', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await bulkUpdateUserStatus(['u-001', 'u-002'], false);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET is_active'),
      [false, ['u-001', 'u-002']],
    );
  });

  it('does nothing for empty id list', async () => {
    await bulkUpdateUserStatus([], true);

    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('toggleUserStatus', () => {
  it('toggles is_active and returns updated user', async () => {
    const existingRow = { ...sampleUser, role: 'user', blog_count: '0' };
    mockQuery.mockResolvedValueOnce(pgResult([existingRow]));
    const toggled = { ...sampleUser, is_active: false };
    mockQuery.mockResolvedValueOnce(pgResult([toggled]));

    const result = await toggleUserStatus('u-001');

    expect(result.is_active).toBe(false);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('NOT is_active'),
      ['u-001'],
    );
  });

  it('throws 404 for missing user', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([]));

    await expect(toggleUserStatus('nonexistent')).rejects.toThrow('User not found');
  });
});

describe('getUserStats', () => {
  it('returns aggregate counts and role breakdown', async () => {
    mockQuery
      .mockResolvedValueOnce(pgResult([{ count: '50' }]))   // total
      .mockResolvedValueOnce(pgResult([{ count: '40' }]))   // active
      .mockResolvedValueOnce(pgResult([{ count: '30' }]))   // verified
      .mockResolvedValueOnce(pgResult([                      // by_role
        { slug: 'admin', count: '5' },
        { slug: 'user', count: '45' },
      ]));

    const stats = await getUserStats();

    expect(stats.total).toBe(50);
    expect(stats.active).toBe(40);
    expect(stats.inactive).toBe(10);
    expect(stats.verified).toBe(30);
    expect(stats.unverified).toBe(20);
    expect(stats.by_role).toEqual({ admin: 5, user: 45 });
  });
});

describe('listUsers', () => {
  it('returns paginated users with defaults', async () => {
    // COUNT
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '2' }]));
    // SELECT users
    const rows = [
      { ...sampleUser, id: 'u-001', role: 'user', blog_count: '1' },
      { ...sampleUser, id: 'u-002', role: 'admin', blog_count: '5' },
    ];
    mockQuery.mockResolvedValueOnce(pgResult(rows));

    const result = await listUsers();

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total_pages).toBe(1);
    expect(result.users).toHaveLength(2);
    expect(result.users[0].blog_count).toBe(1);
  });

  it('applies search filter', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '1' }]));
    mockQuery.mockResolvedValueOnce(pgResult([{ ...sampleUser, role: 'user', blog_count: '0' }]));

    await listUsers({ search: 'john' });

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain('%john%');
  });

  it('applies pagination options', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([{ count: '50' }]));
    mockQuery.mockResolvedValueOnce(pgResult([]));

    const result = await listUsers({}, { page: 3, limit: 10 });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.total_pages).toBe(5);
    // Verify offset in query params (page 3, limit 10 => offset 20)
    const selectCall = mockQuery.mock.calls[1];
    const params = selectCall[1] as number[];
    expect(params[params.length - 1]).toBe(20); // offset
    expect(params[params.length - 2]).toBe(10); // limit
  });
});
