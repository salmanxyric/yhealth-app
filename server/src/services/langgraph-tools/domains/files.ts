import { z } from 'zod';
import { userFilesService } from '../../user-files.service.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

const FILE_TYPES = ['goal', 'training_plan', 'nutrition_targets', 'constraint', 'artifact', 'pattern', 'note'] as const;

const GetUserFilesSchema = z.object({
  fileType: z.enum(FILE_TYPES).optional().describe('Filter by file type'),
  includeArchived: z.boolean().optional().describe('Include archived files'),
});

const CreateUserFileSchema = z.object({
  fileType: z.enum(FILE_TYPES).describe('Type of file to create'),
  title: z.string().min(1).max(255).describe('File title'),
  content: z.record(z.unknown()).describe('File content as JSON object. Include a "summary" or "description" key for display.'),
  isPinned: z.boolean().optional().describe('Pin to top of files list'),
});

const UpdateUserFileSchema = z.object({
  fileId: z.string().uuid().describe('File ID to update'),
  title: z.string().min(1).max(255).optional(),
  content: z.record(z.unknown()).optional(),
  isPinned: z.boolean().optional(),
});

const ArchiveUserFileSchema = z.object({
  fileId: z.string().uuid().describe('File ID to archive'),
});

async function getUserFiles(userId: string, params: z.infer<typeof GetUserFilesSchema>): Promise<string> {
  const files = await userFilesService.getUserFiles(userId, {
    fileType: params.fileType as any,
    includeArchived: params.includeArchived,
  });

  if (files.length === 0) {
    return JSON.stringify({ message: 'No files found', files: [] });
  }

  const formatted = files.map((f) => ({
    id: f.id,
    fileType: f.fileType,
    title: f.title,
    content: f.content,
    source: f.source,
    isPinned: f.isPinned,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));

  return JSON.stringify({ files: formatted, count: formatted.length }, null, 2);
}

async function createUserFile(userId: string, params: z.infer<typeof CreateUserFileSchema>): Promise<string> {
  const file = await userFilesService.createFile(userId, {
    fileType: params.fileType as any,
    title: params.title,
    content: params.content,
    source: 'ai',
    isPinned: params.isPinned,
  });

  return JSON.stringify({
    success: true,
    message: `File "${file.title}" created`,
    data: { id: file.id, title: file.title, fileType: file.fileType },
  });
}

async function updateUserFile(userId: string, params: z.infer<typeof UpdateUserFileSchema>): Promise<string> {
  const file = await userFilesService.updateFile(userId, params.fileId, {
    title: params.title,
    content: params.content,
    isPinned: params.isPinned,
  });

  if (!file) {
    return JSON.stringify({ success: false, error: 'File not found or access denied' });
  }

  return JSON.stringify({
    success: true,
    message: `File "${file.title}" updated`,
    data: { id: file.id, title: file.title },
  });
}

async function archiveUserFile(userId: string, params: z.infer<typeof ArchiveUserFileSchema>): Promise<string> {
  const success = await userFilesService.archiveFile(userId, params.fileId);
  if (!success) {
    return JSON.stringify({ success: false, error: 'File not found or access denied' });
  }
  return JSON.stringify({ success: true, message: 'File archived' });
}

export function registerFilesTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserFiles',
      description: 'Get the user\'s files (goals, plans, notes, constraints, etc.). Use when the user mentions their files, goals, plans, or when you need to reference a previously saved file.',
      schema: GetUserFilesSchema,
      icon: 'file-text',
      mutationType: 'read',
      handler: withErrorHandling('getUserFiles', getUserFiles),
    },
    {
      name: 'createUserFile',
      description: 'Create a new file for the user. Use when the user discusses a goal, plan, constraint, or insight worth persisting. Files survive across conversations. Include a "summary" key in content for display.',
      schema: CreateUserFileSchema,
      icon: 'file-plus',
      mutationType: 'create',
      semanticDelta: (params: any) => `Created: ${params.title}`,
      handler: withErrorHandling('createUserFile', createUserFile),
      undoHandler: async (userId: string, _operationId: string, _params: any, result: any) => {
        const data = typeof result === 'string' ? JSON.parse(result) : result;
        const fileId = data?.data?.id;
        if (fileId) await userFilesService.deleteFile(userId, fileId);
        return 'File creation undone';
      },
    },
    {
      name: 'updateUserFile',
      description: 'Update an existing user file. Use when the user wants to modify a goal, plan, or note. Requires the file ID.',
      schema: UpdateUserFileSchema,
      icon: 'file-edit',
      mutationType: 'update',
      semanticDelta: (params: any) => `Updated: ${params.title || 'file'}`,
      handler: withErrorHandling('updateUserFile', updateUserFile),
    },
    {
      name: 'archiveUserFile',
      description: 'Archive a user file. Use when a goal is completed, a plan is no longer active, or the user wants to remove a file from their active list.',
      schema: ArchiveUserFileSchema,
      icon: 'archive',
      mutationType: 'update',
      semanticDelta: () => 'Archived file',
      handler: withErrorHandling('archiveUserFile', archiveUserFile),
    },
  ];
}
