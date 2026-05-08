// server/tests/unit/jobs/wiki-lint.job.test.ts
import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();

const mockWikiLintService = {
  lintUser: jest.fn<any>(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
}));

jest.unstable_mockModule('../../../src/services/wiki-lint.service.js', () => ({
  wikiLintService: mockWikiLintService,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { processWikiLintForAllUsers } = await import(
  '../../../src/jobs/wiki-lint.job.js'
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processWikiLintForAllUsers', () => {
  it('should lint all users with wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
    });
    mockWikiLintService.lintUser.mockResolvedValue({
      staleMarked: 1, orphansFound: 0, brokenLinks: 0, errors: 0,
    });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).toHaveBeenCalledTimes(2);
    expect(mockWikiLintService.lintUser).toHaveBeenCalledWith('user-1');
    expect(mockWikiLintService.lintUser).toHaveBeenCalledWith('user-2');
  });

  it('should skip when no users have wiki pages', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).not.toHaveBeenCalled();
  });

  it('should continue processing when one user fails', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
    });
    mockWikiLintService.lintUser
      .mockRejectedValueOnce(new Error('User 1 failed'))
      .mockResolvedValueOnce({
        staleMarked: 0, orphansFound: 0, brokenLinks: 0, errors: 0,
      });

    await processWikiLintForAllUsers();

    expect(mockWikiLintService.lintUser).toHaveBeenCalledTimes(2);
  });
});
