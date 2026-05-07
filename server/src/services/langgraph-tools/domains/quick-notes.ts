import { z } from 'zod';
import { quickNoteService } from '../../quick-note.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const QuickNoteStatusSchema = z.enum(['active', 'pinned', 'archived']);
const QuickNoteSourceSchema = z.enum(['text', 'voice', 'ai']);

const GetQuickNotesSchema = z.object({
  status: QuickNoteStatusSchema.optional().describe('Filter notes by status'),
  search: z.string().optional().describe('Search note titles and content'),
  limit: z.number().optional().describe('Maximum notes to return, default 20'),
  offset: z.number().optional().describe('Pagination offset'),
});

const GetQuickNoteByIdSchema = z.object({
  noteId: z.string().describe('Quick note ID'),
});

const CreateQuickNoteSchema = z.object({
  title: z.string().optional().describe('Short note title'),
  content: z.string().describe('Note content to save'),
  status: QuickNoteStatusSchema.optional().describe('Initial note status'),
  color: z.string().optional().describe('Color hex code for the note'),
  tags: z.array(z.string()).optional().describe('Tags for organization'),
  source: QuickNoteSourceSchema.optional().describe('Where the note came from'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
});

const UpdateQuickNoteSchema = z.object({
  noteId: z.string().describe('Quick note ID'),
  title: z.string().optional(),
  content: z.string().optional(),
  status: QuickNoteStatusSchema.optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: QuickNoteSourceSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

const DeleteQuickNoteSchema = z.object({
  noteId: z.string().describe('Quick note ID to delete'),
});

async function getQuickNotes(userId: string, params?: z.infer<typeof GetQuickNotesSchema>): Promise<string> {
  const result = await quickNoteService.getNotes(userId, {
    status: params?.status,
    search: params?.search,
    limit: params?.limit || 20,
    offset: params?.offset,
  });
  return JSON.stringify({ success: true, data: result }, null, 2);
}

async function getQuickNoteById(userId: string, params: z.infer<typeof GetQuickNoteByIdSchema>): Promise<string> {
  const note = await quickNoteService.getNote(userId, params.noteId);
  if (!note) return JSON.stringify({ success: false, error: 'Quick note not found' }, null, 2);
  return JSON.stringify({ success: true, data: { note } }, null, 2);
}

async function createQuickNote(userId: string, params: z.infer<typeof CreateQuickNoteSchema>): Promise<string> {
  const note = await quickNoteService.createNote(userId, {
    ...params,
    source: params.source || 'ai',
  });
  return JSON.stringify({ success: true, data: { note }, message: 'Quick note saved' }, null, 2);
}

async function updateQuickNote(userId: string, params: z.infer<typeof UpdateQuickNoteSchema>): Promise<string> {
  const note = await quickNoteService.updateNote(userId, params.noteId, {
    title: params.title,
    content: params.content,
    status: params.status,
    color: params.color,
    tags: params.tags,
    source: params.source,
    metadata: params.metadata,
  });
  if (!note) return JSON.stringify({ success: false, error: 'Quick note not found' }, null, 2);
  return JSON.stringify({ success: true, data: { note }, message: 'Quick note updated' }, null, 2);
}

async function deleteQuickNote(userId: string, params: z.infer<typeof DeleteQuickNoteSchema>): Promise<string> {
  const deleted = await quickNoteService.deleteNote(userId, params.noteId);
  if (!deleted) return JSON.stringify({ success: false, error: 'Quick note not found' }, null, 2);
  return JSON.stringify({ success: true, message: 'Quick note deleted' }, null, 2);
}

export function registerQuickNoteTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getQuickNotes',
      description: 'Get the user quick notes. Use when the user asks to show, list, search, recall, or review saved notes.',
      schema: GetQuickNotesSchema,
      mutationType: 'read',
      icon: 'sticky-note',
      handler: withErrorHandling('getQuickNotes', async (uid, params) => getQuickNotes(uid, params)),
    },
    {
      name: 'getQuickNoteById',
      description: 'Get one quick note by ID before reviewing, editing, or confirming details.',
      schema: GetQuickNoteByIdSchema,
      mutationType: 'read',
      icon: 'sticky-note',
      handler: withErrorHandling('getQuickNoteById', async (uid, params) => getQuickNoteById(uid, params)),
    },
    {
      name: 'createQuickNote',
      description: 'Create a quick note from user text. Use when the user says to save a note, remember something, make a sticky note, or capture a thought.',
      schema: CreateQuickNoteSchema,
      mutationType: 'create',
      icon: 'sticky-note',
      semanticDelta: (params) => `Saved quick note: ${params.title || params.content?.slice(0, 80) || 'Untitled note'}`,
      handler: withErrorHandling('createQuickNote', async (uid, params) => createQuickNote(uid, params)),
    },
    {
      name: 'updateQuickNote',
      description: 'Update a quick note title, content, color, tags, or status. Use when the user asks to edit, pin, archive, unarchive, recolor, or retag a note.',
      schema: UpdateQuickNoteSchema,
      mutationType: 'update',
      icon: 'sticky-note',
      semanticDelta: (params) => `Updated quick note ${params.noteId}`,
      handler: withErrorHandling('updateQuickNote', async (uid, params) => updateQuickNote(uid, params)),
    },
    {
      name: 'deleteQuickNote',
      description: 'Delete a quick note. Use only when the user clearly asks to remove or delete a note.',
      schema: DeleteQuickNoteSchema,
      mutationType: 'delete',
      icon: 'trash',
      semanticDelta: (params) => `Deleted quick note ${params.noteId}`,
      handler: withErrorHandling('deleteQuickNote', async (uid, params) => deleteQuickNote(uid, params)),
    },
  ];
}
