import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

const GetShoppingListItemsSchema = z.object({
  category: z.string().optional().describe('Filter by category: produce, protein, dairy, grains, pantry, other'),
  isPurchased: z.boolean().optional().describe('Filter by purchased status'),
});

const GetShoppingListItemByIdSchema = z.object({
  itemId: z.string().describe('Shopping list item ID to retrieve (required)'),
});

const GetShoppingListItemByNameSchema = z.object({
  name: z.string().describe('Item name to search for (case-insensitive)'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const CreateShoppingListItemSchema = z.object({
  name: z.string().describe('Item name (required)'),
  quantity: z.string().optional().describe('Quantity: "2 lbs", "500g", "1 bunch"'),
  category: z.string().optional().describe('Category: produce, protein, dairy, grains, pantry, other'),
  notes: z.string().optional().describe('Additional notes'),
  calories: z.number().nullable().optional().describe('Estimated calories per item/portion (optional but recommended for nutrition tracking)'),
  source: z.string().optional().describe('Source: manual, ai_generated, diet_plan'),
  priority: z.number().optional().describe('Priority (higher = more important)'),
});

const UpdateShoppingListItemSchema = z.object({
  itemId: z.string().describe('Item ID (required)'),
  name: z.string().optional(),
  quantity: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  calories: z.number().nullable().optional().describe('Estimated calories per item/portion'),
  isPurchased: z.boolean().optional().describe('Mark as purchased'),
  priority: z.number().optional(),
});

const DeleteShoppingListItemSchema = z.object({
  itemId: z.string().describe('Item ID to delete (required)'),
});

const DeleteShoppingListItemByNameSchema = z.object({
  name: z.string().describe('Item name to delete'),
  exactMatch: z.boolean().optional().describe('If true, match exact name; if false, partial match'),
});

const DeleteAllShoppingListItemsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  category: z.string().optional().describe('Filter by category'),
  isPurchased: z.boolean().optional().describe('Filter by purchased status'),
});

const UpdateAllShoppingListItemsSchema = z.object({
  updates: z.object({
    isPurchased: z.boolean().optional(),
    category: z.string().optional(),
    priority: z.number().optional(),
  }),
  filter: z.object({
    category: z.string().optional(),
    isPurchased: z.boolean().optional(),
  }).optional(),
});

// --- Implementations ---

async function getShoppingListItems(userId: string, params?: z.infer<typeof GetShoppingListItemsSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM shopping_list_items WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params?.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    queryParams.push(params.category);
    paramIndex++;
  }

  if (params?.isPurchased !== undefined) {
    sqlQuery += ` AND is_purchased = $${paramIndex}`;
    queryParams.push(params.isPurchased);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY priority DESC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No shopping list items found', items: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    notes: row.notes,
    calories: row.calories,
    source: row.source,
    isPurchased: row.is_purchased,
    purchasedAt: row.purchased_at,
    priority: row.priority,
  }));

  return JSON.stringify({ items: formatted, count: formatted.length }, null, 2);
}

async function getShoppingListItemById(userId: string, params: z.infer<typeof GetShoppingListItemByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT * FROM shopping_list_items WHERE id = $1 AND user_id = $2`,
    [params.itemId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Shopping list item not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    notes: row.notes,
    calories: row.calories,
    source: row.source,
    isPurchased: row.is_purchased,
    purchasedAt: row.purchased_at,
    priority: row.priority,
  };

  return JSON.stringify({ success: true, item: formatted }, null, 2);
}

async function getShoppingListItemByName(userId: string, params: z.infer<typeof GetShoppingListItemByNameSchema>): Promise<string> {
  let sqlQuery = `SELECT * FROM shopping_list_items WHERE user_id = $1`;
  const queryParams: string[] = [userId];

  if (params.exactMatch) {
    sqlQuery += ` AND LOWER(name) = LOWER($2)`;
    queryParams.push(params.name);
  } else {
    sqlQuery += ` AND LOWER(name) LIKE LOWER($2)`;
    queryParams.push(`%${params.name}%`);
  }

  sqlQuery += ` ORDER BY priority DESC, created_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No shopping list items found', items: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    category: row.category,
    isPurchased: row.is_purchased,
  }));

  return JSON.stringify({ items: formatted, count: formatted.length }, null, 2);
}

async function createShoppingListItem(userId: string, params: z.infer<typeof CreateShoppingListItemSchema>): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO shopping_list_items (
      user_id, name, quantity, category, notes, calories, source, priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      userId,
      params.name,
      params.quantity || null,
      params.category || 'other',
      params.notes || null,
      params.calories !== undefined ? params.calories : null,
      params.source || 'manual',
      params.priority || 0,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Shopping list item created successfully',
    data: { id: result.rows[0].id, name: params.name, calories: params.calories || null },
  });
}

async function updateShoppingListItem(userId: string, params: z.infer<typeof UpdateShoppingListItemSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM shopping_list_items WHERE id = $1 AND user_id = $2`,
    [params.itemId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Shopping list item not found or access denied' });
  }

  const fieldMapping: Record<string, string> = {
    name: 'name',
    quantity: 'quantity',
    category: 'category',
    notes: 'notes',
    calories: 'calories',
    isPurchased: 'is_purchased',
    priority: 'priority',
  };

  const setClauses: string[] = [];
  const values: (string | number | boolean | Date)[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(params)) {
    if (key === 'itemId') continue;
    const dbField = fieldMapping[key];
    if (dbField && value !== undefined) {
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value as string | number | boolean);
      if (key === 'isPurchased' && value === true) {
        setClauses.push(`purchased_at = CURRENT_TIMESTAMP`);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE shopping_list_items SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.itemId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Shopping list item updated successfully',
  });
}

async function deleteShoppingListItem(userId: string, params: z.infer<typeof DeleteShoppingListItemSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM shopping_list_items WHERE id = $1 AND user_id = $2`,
    [params.itemId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Shopping list item not found or access denied' });
  }

  await query(
    `DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2`,
    [params.itemId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Shopping list item deleted successfully',
  });
}

async function deleteShoppingListItemByName(userId: string, params: z.infer<typeof DeleteShoppingListItemByNameSchema>): Promise<string> {
  let sqlQuery = `DELETE FROM shopping_list_items WHERE user_id = $1`;
  const queryParams: string[] = [userId];

  if (params.exactMatch) {
    sqlQuery += ` AND LOWER(name) = LOWER($2)`;
    queryParams.push(params.name);
  } else {
    sqlQuery += ` AND LOWER(name) LIKE LOWER($2)`;
    queryParams.push(`%${params.name}%`);
  }

  const result = await query(sqlQuery, queryParams);

  if (result.rowCount === 0) {
    return JSON.stringify({ success: false, error: 'Shopping list item not found' });
  }

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} shopping list item(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function deleteAllShoppingListItems(userId: string, params: z.infer<typeof DeleteAllShoppingListItemsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all shopping list items.'
    });
  }

  let sqlQuery = `DELETE FROM shopping_list_items WHERE user_id = $1`;
  const queryParams: (string | boolean)[] = [userId];
  let paramIndex = 2;

  if (params.category) {
    sqlQuery += ` AND category = $${paramIndex}`;
    queryParams.push(params.category);
    paramIndex++;
  }

  if (params.isPurchased !== undefined) {
    sqlQuery += ` AND is_purchased = $${paramIndex}`;
    queryParams.push(params.isPurchased);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} shopping list item(s)`,
    deletedCount: result.rowCount || 0,
  });
}

async function updateAllShoppingListItems(userId: string, params: z.infer<typeof UpdateAllShoppingListItemsSchema>): Promise<string> {
  let sqlQuery = `UPDATE shopping_list_items SET `;
  const setClauses: string[] = [];
  const values: (string | number | boolean)[] = [];
  let paramIndex = 1;

  if (params.updates.isPurchased !== undefined) {
    setClauses.push(`is_purchased = $${paramIndex}`);
    values.push(params.updates.isPurchased);
    if (params.updates.isPurchased) {
      setClauses.push(`purchased_at = CURRENT_TIMESTAMP`);
    }
    paramIndex++;
  }

  if (params.updates.category !== undefined) {
    setClauses.push(`category = $${paramIndex}`);
    values.push(params.updates.category);
    paramIndex++;
  }

  if (params.updates.priority !== undefined) {
    setClauses.push(`priority = $${paramIndex}`);
    values.push(params.updates.priority);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  sqlQuery += setClauses.join(', ');

  sqlQuery += ` WHERE user_id = $${paramIndex}`;
  values.push(userId);
  paramIndex++;

  if (params.filter) {
    if (params.filter.category) {
      sqlQuery += ` AND category = $${paramIndex}`;
      values.push(params.filter.category);
      paramIndex++;
    }
    if (params.filter.isPurchased !== undefined) {
      sqlQuery += ` AND is_purchased = $${paramIndex}`;
      values.push(params.filter.isPurchased);
      paramIndex++;
    }
  }

  const result = await query(sqlQuery, values);

  return JSON.stringify({
    success: true,
    message: `Updated ${result.rowCount || 0} shopping list item(s)`,
    updatedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerShoppingListTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getShoppingListItems',
      description: 'Get shopping list items. Use when user asks about their shopping list, grocery list, or items to buy.',
      schema: GetShoppingListItemsSchema,
      handler: withErrorHandling('getShoppingListItems', async (uid, params) =>
        getShoppingListItems(uid, params),
      ),
    },
    {
      name: 'getShoppingListItemById',
      description: 'Get a specific shopping list item by ID. Use when user asks about a particular item.',
      schema: GetShoppingListItemByIdSchema,
      handler: withErrorHandling('getShoppingListItemById', async (uid, params) =>
        getShoppingListItemById(uid, params),
      ),
    },
    {
      name: 'getShoppingListItemByName',
      description: 'Get shopping list items by searching for the item name. Use when user asks about an item by its name.',
      schema: GetShoppingListItemByNameSchema,
      handler: withErrorHandling('getShoppingListItemByName', async (uid, params) =>
        getShoppingListItemByName(uid, params),
      ),
    },
    {
      name: 'createShoppingListItem',
      description: 'Create a shopping list item. Use when user asks to add an item to their shopping list. IMPORTANT: Always include calories (estimated calories per item/portion) when creating food items for nutrition tracking. For example: salmon fillets (1 lb) ~800 calories, eggs (1 dozen) ~840 calories, quinoa (500g) ~555 calories, spinach (1 bunch) ~20 calories, broccoli (500g) ~165 calories. Estimate based on standard nutritional values if exact calories are unknown.',
      schema: CreateShoppingListItemSchema,
      handler: withErrorHandling('createShoppingListItem', async (uid, params) =>
        createShoppingListItem(uid, params),
      ),
    },
    {
      name: 'updateShoppingListItem',
      description: 'Update a shopping list item. Use when user asks to modify an item, mark it as purchased, or change its details.',
      schema: UpdateShoppingListItemSchema,
      handler: withErrorHandling('updateShoppingListItem', async (uid, params) =>
        updateShoppingListItem(uid, params),
      ),
    },
    {
      name: 'deleteShoppingListItem',
      description: 'Delete a shopping list item. Use when user asks to remove an item from their shopping list.',
      schema: DeleteShoppingListItemSchema,
      handler: withErrorHandling('deleteShoppingListItem', async (uid, params) =>
        deleteShoppingListItem(uid, params),
      ),
    },
    {
      name: 'deleteShoppingListItemByName',
      description: 'Delete shopping list items by name. Use when user asks to remove items by their name.',
      schema: DeleteShoppingListItemByNameSchema,
      handler: withErrorHandling('deleteShoppingListItemByName', async (uid, params) =>
        deleteShoppingListItemByName(uid, params),
      ),
    },
    {
      name: 'deleteAllShoppingListItems',
      description: 'Delete all shopping list items (with optional filters). Use when user asks to clear their shopping list. Requires confirmation.',
      schema: DeleteAllShoppingListItemsSchema,
      handler: withErrorHandling('deleteAllShoppingListItems', async (uid, params) =>
        deleteAllShoppingListItems(uid, params),
      ),
    },
    {
      name: 'updateAllShoppingListItems',
      description: 'Update multiple shopping list items at once. Use when user asks to bulk update items, mark all as purchased, etc.',
      schema: UpdateAllShoppingListItemsSchema,
      handler: withErrorHandling('updateAllShoppingListItems', async (uid, params) =>
        updateAllShoppingListItems(uid, params),
      ),
    },
  ];
}
