import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetUserBodyImagesSchema = z.object({
  imageType: z.string().optional().describe('Filter by image type: face, front, side, back'),
  captureContext: z.string().optional().describe('Filter by capture context: onboarding, progress, weekly_checkin'),
  startDate: z.string().optional().describe('Filter images from this date (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('Filter images up to this date (YYYY-MM-DD)'),
});

const GetUserBodyImageByIdSchema = z.object({
  imageId: z.string().describe('Body image ID to retrieve (required)'),
});

const CreateUserBodyImageSchema = z.object({
  imageType: z.string().describe('Image type: face, front, side, back (required)'),
  imageKey: z.string().describe('R2 storage key for the image (required)'),
  captureContext: z.string().describe('Capture context: onboarding, progress, weekly_checkin (required)'),
  isEncrypted: z.boolean().optional().describe('Whether image is encrypted'),
});

const DeleteUserBodyImageSchema = z.object({
  imageId: z.string().describe('Body image ID to delete (required)'),
});

const DeleteAllUserBodyImagesSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  imageType: z.string().optional().describe('Filter by image type'),
  captureContext: z.string().optional().describe('Filter by capture context'),
});

// --- Implementations ---

async function getUserBodyImages(userId: string, params?: z.infer<typeof GetUserBodyImagesSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM user_body_images WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.imageType) {
    sqlQuery += ` AND image_type = $${paramIndex}`;
    queryParams.push(params.imageType);
    paramIndex++;
  }

  if (params?.captureContext) {
    sqlQuery += ` AND capture_context = $${paramIndex}`;
    queryParams.push(params.captureContext);
    paramIndex++;
  }

  if (params?.startDate) {
    sqlQuery += ` AND captured_at >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    sqlQuery += ` AND captured_at <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY captured_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No body images found', images: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    imageType: row.image_type,
    imageKey: row.image_key,
    captureContext: row.capture_context,
    analysisStatus: row.analysis_status,
    capturedAt: row.captured_at,
    analyzedAt: row.analyzed_at,
  }));

  return JSON.stringify({ images: formatted, count: formatted.length }, null, 2);
}

async function getUserBodyImageById(userId: string, params: z.infer<typeof GetUserBodyImageByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM user_body_images WHERE id = $1 AND user_id = $2`,
    [params.imageId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Body image not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    imageType: row.image_type,
    imageKey: row.image_key,
    captureContext: row.capture_context,
    analysisStatus: row.analysis_status,
    analysisResult: row.analysis_result,
    capturedAt: row.captured_at,
    analyzedAt: row.analyzed_at,
  };

  return JSON.stringify({ success: true, image: formatted }, null, 2);
}

async function createUserBodyImage(userId: string, params: z.infer<typeof CreateUserBodyImageSchema>): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO user_body_images (
      user_id, image_type, image_key, capture_context, is_encrypted
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [
      userId,
      params.imageType,
      params.imageKey,
      params.captureContext,
      params.isEncrypted || false,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Body image record created successfully',
    data: { id: result.rows[0].id },
  });
}

async function deleteUserBodyImage(userId: string, params: z.infer<typeof DeleteUserBodyImageSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_body_images WHERE id = $1 AND user_id = $2`,
    [params.imageId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Body image not found or access denied' });
  }

  // Note: In production, you might want to also delete the file from R2 storage
  await query(
    `DELETE FROM user_body_images WHERE id = $1 AND user_id = $2`,
    [params.imageId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Body image deleted successfully',
  });
}

async function deleteAllUserBodyImages(userId: string, params: z.infer<typeof DeleteAllUserBodyImagesSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all body images.'
    });
  }

  let sqlQuery = `DELETE FROM user_body_images WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params.imageType) {
    sqlQuery += ` AND image_type = $${paramIndex}`;
    queryParams.push(params.imageType);
    paramIndex++;
  }

  if (params.captureContext) {
    sqlQuery += ` AND capture_context = $${paramIndex}`;
    queryParams.push(params.captureContext);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} body image(s)`,
    deletedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerBodyImageTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserBodyImages',
      description: 'Get user body images. Use when user asks about their progress photos or body images.',
      schema: GetUserBodyImagesSchema,
      handler: withErrorHandling('getUserBodyImages', (uid, params) => getUserBodyImages(uid, params)),
    },
    {
      name: 'getUserBodyImageById',
      description: 'Get a specific body image by ID. Use when user asks about a particular body image.',
      schema: GetUserBodyImageByIdSchema,
      handler: withErrorHandling('getUserBodyImageById', (uid, params) => getUserBodyImageById(uid, params)),
    },
    {
      name: 'createUserBodyImage',
      description: 'Create a body image record. Use when user uploads a progress photo. Note: Image file must be uploaded separately.',
      schema: CreateUserBodyImageSchema,
      handler: withErrorHandling('createUserBodyImage', (uid, params) => createUserBodyImage(uid, params)),
    },
    {
      name: 'deleteUserBodyImage',
      description: 'Delete a body image. Use when user asks to remove or delete a progress photo.',
      schema: DeleteUserBodyImageSchema,
      handler: withErrorHandling('deleteUserBodyImage', (uid, params) => deleteUserBodyImage(uid, params)),
    },
    {
      name: 'deleteAllUserBodyImages',
      description: 'Delete all body images (with optional filters). Use when user asks to remove all progress photos. Requires confirmation.',
      schema: DeleteAllUserBodyImagesSchema,
      handler: withErrorHandling('deleteAllUserBodyImages', (uid, params) => deleteAllUserBodyImages(uid, params)),
    },
  ];
}
