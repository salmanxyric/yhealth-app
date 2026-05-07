/**
 * @file Quick Note Controller
 * @description Authenticated CRUD for user quick notes.
 */

import type { Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { quickNoteService } from '../services/quick-note.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import type {
  CreateQuickNoteInput,
  QuickNoteSource,
  QuickNoteStatus,
  UpdateQuickNoteInput,
} from '../services/quick-note.service.js';

const VALID_STATUSES = new Set<QuickNoteStatus>(['active', 'pinned', 'archived']);
const VALID_SOURCES = new Set<QuickNoteSource>(['text', 'voice', 'ai']);

function requireUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  return userId;
}

function validateNoteInput(input: Partial<CreateQuickNoteInput | UpdateQuickNoteInput>, requireContent = false): void {
  if (requireContent && (!input.content || !input.content.trim())) {
    throw ApiError.badRequest('Content is required');
  }
  if (input.content !== undefined && !input.content.trim()) {
    throw ApiError.badRequest('Content cannot be empty');
  }
  if (input.content && input.content.length > 10000) {
    throw ApiError.badRequest('Content must be 10000 characters or fewer');
  }
  if (input.title && input.title.length > 160) {
    throw ApiError.badRequest('Title must be 160 characters or fewer');
  }
  if (input.status && !VALID_STATUSES.has(input.status)) {
    throw ApiError.badRequest('Invalid note status');
  }
  if (input.source && !VALID_SOURCES.has(input.source)) {
    throw ApiError.badRequest('Invalid note source');
  }
  if (input.tags && (!Array.isArray(input.tags) || input.tags.some((tag) => typeof tag !== 'string'))) {
    throw ApiError.badRequest('Tags must be an array of strings');
  }
}

export const createQuickNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as CreateQuickNoteInput;
  validateNoteInput(input, true);

  const note = await quickNoteService.createNote(userId, input);
  ApiResponse.created(res, note, 'Quick note created successfully');
});

export const getQuickNotes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const { status, search, limit, offset } = req.query as {
    status?: QuickNoteStatus;
    search?: string;
    limit?: string;
    offset?: string;
  };

  if (status && !VALID_STATUSES.has(status)) {
    throw ApiError.badRequest('Invalid note status');
  }

  const result = await quickNoteService.getNotes(userId, {
    status,
    search,
    limit: limit ? parseInt(limit, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
  });

  ApiResponse.success(res, result);
});

export const getQuickNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const note = await quickNoteService.getNote(userId, req.params.id);
  if (!note) throw ApiError.notFound('Quick note not found');
  ApiResponse.success(res, note);
});

export const updateQuickNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const input = req.body as UpdateQuickNoteInput;
  validateNoteInput(input);

  const note = await quickNoteService.updateNote(userId, req.params.id, input);
  if (!note) throw ApiError.notFound('Quick note not found');
  ApiResponse.success(res, note, 'Quick note updated successfully');
});

export const deleteQuickNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = requireUserId(req);
  const deleted = await quickNoteService.deleteNote(userId, req.params.id);
  if (!deleted) throw ApiError.notFound('Quick note not found');
  ApiResponse.success(res, { deleted: true }, 'Quick note deleted successfully');
});
