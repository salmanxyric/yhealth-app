import { jest } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockPoolQuery = jest.fn<any>();
const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  pool: { query: mockPoolQuery },
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

const { quickNoteService } = await import('../../../src/services/quick-note.service.js');

const NOW = new Date('2026-05-06T10:00:00.000Z');

function quickNoteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'note-1',
    user_id: 'user-1',
    title: 'Idea',
    content: 'Remember to prep meal plan',
    status: 'active',
    color: '#facc15',
    tags: ['health'],
    source: 'text',
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function pgResult<T>(rows: T[], rowCount = rows.length) {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

describe('quickNoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a user-scoped quick note', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([quickNoteRow()]));

    const note = await quickNoteService.createNote('user-1', {
      title: 'Idea',
      content: 'Remember to prep meal plan',
      tags: ['health'],
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO quick_notes'),
      expect.arrayContaining(['user-1', 'Idea', 'Remember to prep meal plan']),
    );
    expect(note).toEqual(expect.objectContaining({
      id: 'note-1',
      userId: 'user-1',
      content: 'Remember to prep meal plan',
      status: 'active',
    }));
  });

  it('lists notes for one user with status and search filters', async () => {
    mockQuery
      .mockResolvedValueOnce(pgResult([{ count: '1' }]))
      .mockResolvedValueOnce(pgResult([quickNoteRow({ status: 'pinned' })]));

    const result = await quickNoteService.getNotes('user-1', {
      status: 'pinned',
      search: 'meal',
      limit: 10,
      offset: 0,
    });

    expect(mockQuery.mock.calls[0][0]).toContain('FROM quick_notes WHERE user_id = $1 AND status = $2');
    expect(mockQuery.mock.calls[0][1]).toEqual(['user-1', 'pinned', '%meal%']);
    expect(result.total).toBe(1);
    expect(result.notes[0].status).toBe('pinned');
  });

  it('updates only owned notes', async () => {
    mockQuery.mockResolvedValueOnce(pgResult([
      quickNoteRow({ title: 'Updated', status: 'archived' }),
    ]));

    const note = await quickNoteService.updateNote('user-1', 'note-1', {
      title: 'Updated',
      status: 'archived',
    });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $3 AND user_id = $4'),
      ['Updated', 'archived', 'note-1', 'user-1'],
    );
    expect(note?.title).toBe('Updated');
    expect(note?.status).toBe('archived');
  });

  it('deletes only owned notes', async () => {
    mockPoolQuery.mockResolvedValueOnce(pgResult([], 1));

    const deleted = await quickNoteService.deleteNote('user-1', 'note-1');

    expect(deleted).toBe(true);
    expect(mockPoolQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM quick_notes WHERE id = $1 AND user_id = $2'),
      ['note-1', 'user-1'],
    );
  });
});
