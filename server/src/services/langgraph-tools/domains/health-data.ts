import { z } from 'zod';
import { query } from '../../../config/database.config.js';
import type { ToolDefinition } from '../types.js';
import { withErrorHandling } from '../utils.js';

// --- Schemas ---

// User Integrations Schemas
const GetUserIntegrationsSchema = z.object({
  provider: z.string().optional().describe('Filter by provider: google_fit, apple_health, fitbit, garmin, whoop, oura, strava'),
  status: z.string().optional().describe('Filter by status: pending, active, error, disconnected'),
});

const GetUserIntegrationByIdSchema = z.object({
  integrationId: z.string().describe('Integration ID to retrieve (required)'),
});

const GetUserIntegrationByProviderSchema = z.object({
  provider: z.string().describe('Provider name to search for (required)'),
});

const CreateUserIntegrationSchema = z.object({
  provider: z.string().describe('Integration provider: google_fit, apple_health, fitbit, garmin, whoop, oura, strava'),
  accessToken: z.string().describe('OAuth access token (required)'),
  refreshToken: z.string().optional().describe('OAuth refresh token'),
  tokenExpiry: z.string().optional().describe('Token expiry timestamp'),
  scopes: z.array(z.string()).optional().describe('OAuth scopes array'),
  isEnabled: z.boolean().optional().describe('Whether integration is enabled'),
  deviceInfo: z.record(z.any()).optional().describe('Device information JSON'),
});

const UpdateUserIntegrationSchema = z.object({
  integrationId: z.string().describe('Integration ID (required)'),
  status: z.string().optional().describe('Sync status: pending, active, error, disconnected'),
  isEnabled: z.boolean().optional().describe('Whether integration is enabled'),
  isPrimaryForDataTypes: z.array(z.string()).optional().describe('Data types this integration is primary for'),
  deviceInfo: z.record(z.any()).optional().describe('Device information JSON'),
});

const DeleteUserIntegrationSchema = z.object({
  integrationId: z.string().describe('Integration ID to delete (required)'),
});

const DeleteUserIntegrationByProviderSchema = z.object({
  provider: z.string().describe('Provider name to delete (required)'),
});

const DeleteAllUserIntegrationsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  status: z.string().optional().describe('Filter by status'),
});

// Health Data Records Schemas
const GetHealthDataRecordsSchema = z.object({
  dataType: z.string().optional().describe('Filter by data type: steps, heart_rate, sleep, weight, etc.'),
  provider: z.string().optional().describe('Filter by provider: google_fit, apple_health, fitbit, etc.'),
  startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD)'),
  limit: z.number().optional().describe('Maximum number of records to return (default: 50)'),
});

const GetHealthDataRecordByIdSchema = z.object({
  recordId: z.string().describe('Health data record ID to retrieve (required)'),
});

const CreateHealthDataRecordSchema = z.object({
  integrationId: z.string().describe('Integration ID that provided this data (required)'),
  provider: z.string().describe('Provider name: google_fit, apple_health, fitbit, etc.'),
  dataType: z.string().describe('Data type: steps, heart_rate, sleep, weight, calories, etc.'),
  recordedAt: z.string().describe('When the data was recorded (ISO timestamp)'),
  value: z.record(z.any()).describe('Data value as JSON object'),
  unit: z.string().describe('Unit of measurement'),
  sourcePriority: z.number().optional().describe('Source priority (higher = more trusted)'),
  isGoldenSource: z.boolean().optional().describe('Whether this is the golden source for this data type'),
  rawDataId: z.string().optional().describe('Reference to raw data source'),
});

const UpdateHealthDataRecordSchema = z.object({
  recordId: z.string().describe('Record ID (required)'),
  value: z.record(z.any()).optional().describe('Updated data value'),
  unit: z.string().optional().describe('Updated unit'),
  sourcePriority: z.number().optional(),
  isGoldenSource: z.boolean().optional(),
});

const DeleteHealthDataRecordSchema = z.object({
  recordId: z.string().describe('Record ID to delete (required)'),
});

const DeleteAllHealthDataRecordsSchema = z.object({
  confirm: z.boolean().optional().describe('Confirmation flag (should be true for safety)'),
  dataType: z.string().optional().describe('Filter by data type'),
  provider: z.string().optional().describe('Filter by provider'),
  startDate: z.string().optional().describe('Delete records from this date onwards'),
  endDate: z.string().optional().describe('Delete records up to this date'),
});

// --- Implementations ---

// User Integrations

async function getUserIntegrations(userId: string, params?: z.infer<typeof GetUserIntegrationsSchema>): Promise<string> {
  let sqlQuery = `SELECT id, provider, status, connected_at, disconnected_at, last_sync_at, last_sync_status, is_enabled, is_primary_for_data_types FROM user_integrations WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params?.provider) {
    sqlQuery += ` AND provider = $${paramIndex}`;
    queryParams.push(params.provider);
    paramIndex++;
  }

  if (params?.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY connected_at DESC`;

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No integrations found', integrations: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    provider: row.provider,
    status: row.status,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    isEnabled: row.is_enabled,
    isPrimaryForDataTypes: row.is_primary_for_data_types || [],
  }));

  return JSON.stringify({ integrations: formatted, count: formatted.length }, null, 2);
}

async function getUserIntegrationById(userId: string, params: z.infer<typeof GetUserIntegrationByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT id, provider, status, connected_at, disconnected_at, last_sync_at, last_sync_status, is_enabled, is_primary_for_data_types, device_info FROM user_integrations WHERE id = $1 AND user_id = $2`,
    [params.integrationId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Integration not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    provider: row.provider,
    status: row.status,
    connectedAt: row.connected_at,
    disconnectedAt: row.disconnected_at,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    isEnabled: row.is_enabled,
    isPrimaryForDataTypes: row.is_primary_for_data_types || [],
    deviceInfo: row.device_info,
  };

  return JSON.stringify({ success: true, integration: formatted }, null, 2);
}

async function getUserIntegrationByProvider(userId: string, params: z.infer<typeof GetUserIntegrationByProviderSchema>): Promise<string> {
  const result = await query(
    `SELECT id, provider, status, connected_at, last_sync_at, is_enabled FROM user_integrations WHERE provider = $1 AND user_id = $2`,
    [params.provider, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'Integration not found', integration: null });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    provider: row.provider,
    status: row.status,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    isEnabled: row.is_enabled,
  };

  return JSON.stringify({ integration: formatted }, null, 2);
}

async function createUserIntegration(userId: string, params: z.infer<typeof CreateUserIntegrationSchema>): Promise<string> {
  // Check if integration already exists for this provider
  const existing = await query(
    `SELECT id FROM user_integrations WHERE user_id = $1 AND provider = $2`,
    [userId, params.provider]
  );

  if (existing.rows.length > 0) {
    return JSON.stringify({
      success: false,
      error: `Integration for ${params.provider} already exists. Use updateUserIntegration to modify it.`,
      integrationId: existing.rows[0].id
    });
  }

  const result = await query<{ id: string }>(
    `INSERT INTO user_integrations (
      user_id, provider, access_token, refresh_token, token_expiry, scopes, is_enabled, device_info
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
    [
      userId,
      params.provider,
      params.accessToken,
      params.refreshToken || null,
      params.tokenExpiry ? new Date(params.tokenExpiry) : null,
      params.scopes || [],
      params.isEnabled ?? true,
      params.deviceInfo ? JSON.stringify(params.deviceInfo) : null,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Integration created successfully',
    data: { id: result.rows[0].id, provider: params.provider },
  });
}

async function updateUserIntegration(userId: string, params: z.infer<typeof UpdateUserIntegrationSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_integrations WHERE id = $1 AND user_id = $2`,
    [params.integrationId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Integration not found or access denied' });
  }

  const setClauses: string[] = [];
  const values: (string | boolean | null | object | string[])[] = [];
  let paramIndex = 1;

  if (params.status !== undefined) {
    setClauses.push(`status = $${paramIndex}`);
    values.push(params.status);
    paramIndex++;
  }

  if (params.isEnabled !== undefined) {
    setClauses.push(`is_enabled = $${paramIndex}`);
    values.push(params.isEnabled);
    paramIndex++;
  }

  if (params.isPrimaryForDataTypes !== undefined) {
    setClauses.push(`is_primary_for_data_types = $${paramIndex}`);
    values.push(params.isPrimaryForDataTypes);
    paramIndex++;
  }

  if (params.deviceInfo !== undefined) {
    setClauses.push(`device_info = $${paramIndex}`);
    values.push(JSON.stringify(params.deviceInfo));
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE user_integrations SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.integrationId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Integration updated successfully',
  });
}

async function deleteUserIntegration(userId: string, params: z.infer<typeof DeleteUserIntegrationSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_integrations WHERE id = $1 AND user_id = $2`,
    [params.integrationId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Integration not found or access denied' });
  }

  await query(
    `UPDATE user_integrations SET status = 'disconnected', disconnected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
    [params.integrationId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Integration disconnected successfully',
  });
}

async function deleteUserIntegrationByProvider(userId: string, params: z.infer<typeof DeleteUserIntegrationByProviderSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM user_integrations WHERE provider = $1 AND user_id = $2`,
    [params.provider, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Integration not found or access denied' });
  }

  await query(
    `UPDATE user_integrations SET status = 'disconnected', disconnected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE provider = $1 AND user_id = $2`,
    [params.provider, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Integration disconnected successfully',
  });
}

async function deleteAllUserIntegrations(userId: string, params: z.infer<typeof DeleteAllUserIntegrationsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to disconnect all integrations.'
    });
  }

  let sqlQuery = `UPDATE user_integrations SET status = 'disconnected', disconnected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`;
  const queryParams: string[] = [userId];
  let paramIndex = 2;

  if (params.status) {
    sqlQuery += ` AND status = $${paramIndex}`;
    queryParams.push(params.status);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Disconnected ${result.rowCount || 0} integration(s)`,
    disconnectedCount: result.rowCount || 0,
  });
}

// Health Data Records

async function getHealthDataRecords(userId: string, params?: z.infer<typeof GetHealthDataRecordsSchema>): Promise<string> {
  let sqlQuery = `SELECT hdr.*, ui.provider as integration_provider
                  FROM health_data_records hdr
                  JOIN user_integrations ui ON hdr.integration_id = ui.id
                  WHERE hdr.user_id = $1`;
  const queryParams: (string | number | Date)[] = [userId];
  let paramIndex = 2;

  if (params?.dataType) {
    sqlQuery += ` AND hdr.data_type = $${paramIndex}`;
    queryParams.push(params.dataType);
    paramIndex++;
  }

  if (params?.provider) {
    sqlQuery += ` AND hdr.provider = $${paramIndex}`;
    queryParams.push(params.provider);
    paramIndex++;
  }

  if (params?.startDate) {
    sqlQuery += ` AND hdr.recorded_at >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params?.endDate) {
    sqlQuery += ` AND hdr.recorded_at <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  sqlQuery += ` ORDER BY hdr.recorded_at DESC`;

  if (params?.limit) {
    sqlQuery += ` LIMIT $${paramIndex}`;
    queryParams.push(params.limit);
  } else {
    sqlQuery += ` LIMIT 50`;
  }

  const result = await query(sqlQuery, queryParams);

  if (result.rows.length === 0) {
    return JSON.stringify({ message: 'No health data records found', records: [] });
  }

  const formatted = result.rows.map((row: any) => ({
    id: row.id,
    provider: row.provider,
    dataType: row.data_type,
    recordedAt: row.recorded_at,
    value: row.value,
    unit: row.unit,
    sourcePriority: row.source_priority,
    isGoldenSource: row.is_golden_source,
  }));

  return JSON.stringify({ records: formatted, count: formatted.length }, null, 2);
}

async function getHealthDataRecordById(userId: string, params: z.infer<typeof GetHealthDataRecordByIdSchema>): Promise<string> {
  const result = await query(
    `SELECT hdr.*, ui.provider as integration_provider
     FROM health_data_records hdr
     JOIN user_integrations ui ON hdr.integration_id = ui.id
     WHERE hdr.id = $1 AND hdr.user_id = $2`,
    [params.recordId, userId]
  );

  if (result.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Health data record not found or access denied' });
  }

  const row = result.rows[0];
  const formatted = {
    id: row.id,
    integrationId: row.integration_id,
    provider: row.provider,
    dataType: row.data_type,
    recordedAt: row.recorded_at,
    receivedAt: row.received_at,
    value: row.value,
    unit: row.unit,
    sourcePriority: row.source_priority,
    isGoldenSource: row.is_golden_source,
    rawDataId: row.raw_data_id,
  };

  return JSON.stringify({ success: true, record: formatted }, null, 2);
}

async function createHealthDataRecord(userId: string, params: z.infer<typeof CreateHealthDataRecordSchema>): Promise<string> {
  // Verify integration belongs to user
  const integrationCheck = await query(
    `SELECT id FROM user_integrations WHERE id = $1 AND user_id = $2`,
    [params.integrationId, userId]
  );

  if (integrationCheck.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Integration not found or access denied' });
  }

  const result = await query<{ id: string }>(
    `INSERT INTO health_data_records (
      user_id, integration_id, provider, data_type, recorded_at, value, unit,
      source_priority, is_golden_source, raw_data_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id`,
    [
      userId,
      params.integrationId,
      params.provider,
      params.dataType,
      new Date(params.recordedAt),
      JSON.stringify(params.value),
      params.unit,
      params.sourcePriority || 0,
      params.isGoldenSource || false,
      params.rawDataId || null,
    ]
  );

  return JSON.stringify({
    success: true,
    message: 'Health data record created successfully',
    data: { id: result.rows[0].id },
  });
}

async function updateHealthDataRecord(userId: string, params: z.infer<typeof UpdateHealthDataRecordSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM health_data_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Health data record not found or access denied' });
  }

  const setClauses: string[] = [];
  const values: (string | number | boolean | object)[] = [];
  let paramIndex = 1;

  if (params.value !== undefined) {
    setClauses.push(`value = $${paramIndex}`);
    values.push(JSON.stringify(params.value));
    paramIndex++;
  }

  if (params.unit !== undefined) {
    setClauses.push(`unit = $${paramIndex}`);
    values.push(params.unit);
    paramIndex++;
  }

  if (params.sourcePriority !== undefined) {
    setClauses.push(`source_priority = $${paramIndex}`);
    values.push(params.sourcePriority);
    paramIndex++;
  }

  if (params.isGoldenSource !== undefined) {
    setClauses.push(`is_golden_source = $${paramIndex}`);
    values.push(params.isGoldenSource);
    paramIndex++;
  }

  if (setClauses.length === 0) {
    return JSON.stringify({ success: false, error: 'No valid fields to update' });
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

  await query(
    `UPDATE health_data_records SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
    [...values, params.recordId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Health data record updated successfully',
  });
}

async function deleteHealthDataRecord(userId: string, params: z.infer<typeof DeleteHealthDataRecordSchema>): Promise<string> {
  // Verify ownership
  const existing = await query(
    `SELECT * FROM health_data_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  if (existing.rows.length === 0) {
    return JSON.stringify({ success: false, error: 'Health data record not found or access denied' });
  }

  await query(
    `DELETE FROM health_data_records WHERE id = $1 AND user_id = $2`,
    [params.recordId, userId]
  );

  return JSON.stringify({
    success: true,
    message: 'Health data record deleted successfully',
  });
}

async function deleteAllHealthDataRecords(userId: string, params: z.infer<typeof DeleteAllHealthDataRecordsSchema>): Promise<string> {
  if (!params.confirm) {
    return JSON.stringify({
      success: false,
      error: 'Confirmation required. Set confirm to true to delete all health data records.'
    });
  }

  let sqlQuery = `DELETE FROM health_data_records WHERE user_id = $1`;
  const queryParams: (string | Date)[] = [userId];
  let paramIndex = 2;

  if (params.dataType) {
    sqlQuery += ` AND data_type = $${paramIndex}`;
    queryParams.push(params.dataType);
    paramIndex++;
  }

  if (params.provider) {
    sqlQuery += ` AND provider = $${paramIndex}`;
    queryParams.push(params.provider);
    paramIndex++;
  }

  if (params.startDate) {
    sqlQuery += ` AND recorded_at >= $${paramIndex}`;
    queryParams.push(params.startDate);
    paramIndex++;
  }

  if (params.endDate) {
    sqlQuery += ` AND recorded_at <= $${paramIndex}`;
    queryParams.push(params.endDate);
    paramIndex++;
  }

  const result = await query(sqlQuery, queryParams);

  return JSON.stringify({
    success: true,
    message: `Deleted ${result.rowCount || 0} health data record(s)`,
    deletedCount: result.rowCount || 0,
  });
}

// --- Registration ---

export function registerHealthDataTools(_userId: string): ToolDefinition[] {
  return [
    {
      name: 'getUserIntegrations',
      description: "Get the user's health app integrations (Google Fit, Apple Health, Fitbit, etc.). Use when user asks about their connected apps, integrations, or synced devices.",
      schema: GetUserIntegrationsSchema,
      handler: withErrorHandling('getUserIntegrations', (uid, params) => getUserIntegrations(uid, params)),
    },
    {
      name: 'getUserIntegrationById',
      description: 'Get a specific integration by its ID. Use when user asks about a particular integration or references an integration ID.',
      schema: GetUserIntegrationByIdSchema,
      handler: withErrorHandling('getUserIntegrationById', (uid, params) => getUserIntegrationById(uid, params)),
    },
    {
      name: 'getUserIntegrationByProvider',
      description: 'Get integration by provider name. Use when user asks about a specific provider like Google Fit, Apple Health, Fitbit, etc.',
      schema: GetUserIntegrationByProviderSchema,
      handler: withErrorHandling('getUserIntegrationByProvider', (uid, params) => getUserIntegrationByProvider(uid, params)),
    },
    {
      name: 'createUserIntegration',
      description: 'Create a new health app integration. Use when user wants to connect a new health app or device. Requires provider and access token.',
      schema: CreateUserIntegrationSchema,
      handler: withErrorHandling('createUserIntegration', (uid, params) => createUserIntegration(uid, params)),
    },
    {
      name: 'updateUserIntegration',
      description: 'Update an existing integration. Use when user asks to modify integration settings, enable/disable sync, or change integration preferences.',
      schema: UpdateUserIntegrationSchema,
      handler: withErrorHandling('updateUserIntegration', (uid, params) => updateUserIntegration(uid, params)),
    },
    {
      name: 'deleteUserIntegration',
      description: 'Disconnect an integration by ID. Use when user asks to disconnect, remove, or delete a health app integration.',
      schema: DeleteUserIntegrationSchema,
      handler: withErrorHandling('deleteUserIntegration', (uid, params) => deleteUserIntegration(uid, params)),
    },
    {
      name: 'deleteUserIntegrationByProvider',
      description: 'Disconnect an integration by provider name. Use when user asks to disconnect a specific provider like Google Fit or Fitbit.',
      schema: DeleteUserIntegrationByProviderSchema,
      handler: withErrorHandling('deleteUserIntegrationByProvider', (uid, params) => deleteUserIntegrationByProvider(uid, params)),
    },
    {
      name: 'deleteAllUserIntegrations',
      description: 'Disconnect all integrations. Use when user asks to disconnect, remove, or delete all health app integrations. Requires confirmation.',
      schema: DeleteAllUserIntegrationsSchema,
      handler: withErrorHandling('deleteAllUserIntegrations', (uid, params) => deleteAllUserIntegrations(uid, params)),
    },
    {
      name: 'getHealthDataRecords',
      description: 'Get health data records synced from integrations. Use when user asks about their synced health data, steps, heart rate, sleep, weight, etc.',
      schema: GetHealthDataRecordsSchema,
      handler: withErrorHandling('getHealthDataRecords', (uid, params) => getHealthDataRecords(uid, params)),
    },
    {
      name: 'getHealthDataRecordById',
      description: 'Get a specific health data record by ID. Use when user asks about a particular health data record.',
      schema: GetHealthDataRecordByIdSchema,
      handler: withErrorHandling('getHealthDataRecordById', (uid, params) => getHealthDataRecordById(uid, params)),
    },
    {
      name: 'createHealthDataRecord',
      description: 'Create a health data record manually. Use when user wants to manually log health data like steps, weight, etc.',
      schema: CreateHealthDataRecordSchema,
      handler: withErrorHandling('createHealthDataRecord', (uid, params) => createHealthDataRecord(uid, params)),
    },
    {
      name: 'updateHealthDataRecord',
      description: 'Update a health data record. Use when user asks to modify or correct health data.',
      schema: UpdateHealthDataRecordSchema,
      handler: withErrorHandling('updateHealthDataRecord', (uid, params) => updateHealthDataRecord(uid, params)),
    },
    {
      name: 'deleteHealthDataRecord',
      description: 'Delete a health data record. Use when user asks to remove or delete health data.',
      schema: DeleteHealthDataRecordSchema,
      handler: withErrorHandling('deleteHealthDataRecord', (uid, params) => deleteHealthDataRecord(uid, params)),
    },
    {
      name: 'deleteAllHealthDataRecords',
      description: 'Delete all health data records (with optional filters). Use when user asks to clear all health data. Requires confirmation.',
      schema: DeleteAllHealthDataRecordsSchema,
      handler: withErrorHandling('deleteAllHealthDataRecords', (uid, params) => deleteAllHealthDataRecords(uid, params)),
    },
  ];
}
