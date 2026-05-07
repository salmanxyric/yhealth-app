import { jest } from '@jest/globals';

const mockQuickNoteService = {
  getNotes: jest.fn<any>(),
  getNote: jest.fn<any>(),
  createNote: jest.fn<any>(),
  updateNote: jest.fn<any>(),
  deleteNote: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/quick-note.service.js', () => ({
  quickNoteService: mockQuickNoteService,
}));

const { registerQuickNoteTools } = await import('../../../src/services/langgraph-tools/domains/quick-notes.js');

function getTool(name: string) {
  const tool = registerQuickNoteTools('user-1').find((definition) => definition.name === name);
  if (!tool) throw new Error(`Missing tool ${name}`);
  return tool;
}

describe('registerQuickNoteTools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers note CRUD tools with mutation metadata', () => {
    const tools = registerQuickNoteTools('user-1');
    const names = tools.map((tool) => tool.name);

    expect(names).toEqual(expect.arrayContaining([
      'createQuickNote',
      'updateQuickNote',
      'deleteQuickNote',
      'getQuickNotes',
      'getQuickNoteById',
    ]));
    expect(getTool('createQuickNote').mutationType).toBe('create');
    expect(getTool('updateQuickNote').mutationType).toBe('update');
    expect(getTool('deleteQuickNote').mutationType).toBe('delete');
    expect(getTool('getQuickNotes').mutationType).toBe('read');
  });

  it('creates notes through the user-scoped service', async () => {
    mockQuickNoteService.createNote.mockResolvedValueOnce({
      id: 'note-1',
      userId: 'user-1',
      content: 'Remember this',
      status: 'active',
    });

    const result = JSON.parse(await getTool('createQuickNote').handler('user-1', {
      content: 'Remember this',
    }));

    expect(result.success).toBe(true);
    expect(mockQuickNoteService.createNote).toHaveBeenCalledWith('user-1', expect.objectContaining({
      content: 'Remember this',
      source: 'ai',
    }));
  });

  it('returns not found for another users note', async () => {
    mockQuickNoteService.getNote.mockResolvedValueOnce(null);

    const result = JSON.parse(await getTool('getQuickNoteById').handler('user-1', {
      noteId: 'note-other',
    }));

    expect(result.success).toBe(false);
    expect(mockQuickNoteService.getNote).toHaveBeenCalledWith('user-1', 'note-other');
  });
});
