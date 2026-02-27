/**
 * @file WHOOP Data Service
 * @description Processes WHOOP webhook payloads, normalizes data, and stores in health_data_records
 */

import { query } from '../database/pg.js';
import { logger } from './logger.service.js';
import { ApiError } from '../utils/ApiError.js';
import {
  normalizeRecoveryData,
  normalizeSleepData,
  normalizeWorkoutData,
  getWhoopAccessToken,
  refreshWhoopToken,
} from './whoop.service.js';
import type { WhoopRecoveryData, WhoopSleepData, WhoopWorkoutData } from './whoop.service.js';
import { dailyHealthMetricsService } from './daily-health-metrics.service.js';

// WHOOP API v2 base URL
const WHOOP_API_V2_BASE = 'https://api.prod.whoop.com/developer/v2';

interface WebhookPayload {
  user_id?: number;
  user_id_string?: string;
  data?: any;
  event_type?: string;
  type?: string;
  timestamp?: string;
}

/**
 * Find user ID from WHOOP user ID
 */
async function findUserIdByWhoopId(whoopUserId: number | string): Promise<string | null> {
  const userIdResult = await query<{ user_id: string }>(
    `SELECT user_id FROM user_integrations
     WHERE provider = 'whoop' 
     AND device_info->>'whoop_user_id' = $1
     AND status = 'active'
     LIMIT 1`,
    [String(whoopUserId)]
  );
  
  if (userIdResult.rows.length > 0) {
    return userIdResult.rows[0].user_id;
  }
  
  // Try to find by matching WHOOP user ID in integration metadata
  // This assumes we store WHOOP user ID during OAuth flow
  return null;
}

/**
 * Process recovery webhook payload or API data
 * @param payload - Webhook payload or API data
 * @param userId - Optional user ID (if provided, skips lookup for webhooks)
 */
export async function processRecoveryWebhook(payload: WebhookPayload, userId?: string): Promise<void> {
  const recoveryData = payload.data as WhoopRecoveryData;
  
  if (!recoveryData || !recoveryData.user_id) {
    throw ApiError.badRequest('Invalid recovery data in payload');
  }
  
  // Find user ID if not provided (for webhooks)
  let finalUserId = userId;
  if (!finalUserId) {
    const foundUserId = await findUserIdByWhoopId(recoveryData.user_id);
    if (!foundUserId) {
      logger.warn('[WHOOPDataService] User not found for WHOOP user ID', {
        whoopUserId: recoveryData.user_id,
      });
      return;
    }
    finalUserId = foundUserId;
  }
  
  // Get integration ID
  const integrationResult = await query<{ id: string }>(
    `SELECT id FROM user_integrations
     WHERE user_id = $1 AND provider = 'whoop' AND status = 'active'
     LIMIT 1`,
    [finalUserId]
  );
  
  if (integrationResult.rows.length === 0) {
    logger.warn('[WHOOPDataService] Active WHOOP integration not found', { userId: finalUserId });
    return;
  }
  
  const integrationId = integrationResult.rows[0].id;
  
  // Normalize data
  const normalized = normalizeRecoveryData(recoveryData, finalUserId);
  
  // Store in health_data_records
  await query(
    `INSERT INTO health_data_records (
      user_id, integration_id, provider, data_type,
      recorded_at, value, unit, is_golden_source, raw_data_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING`,
    [
      finalUserId,
      integrationId,
      'whoop',
      'recovery',
      normalized.timestamp,
      JSON.stringify(normalized),
      'score',
      true, // WHOOP is golden source for recovery
      normalized.source_record_id,
    ]
  );
  
  logger.info('[WHOOPDataService] Recovery data stored', {
    userId: finalUserId,
    recoveryScore: normalized.recovery_score,
    timestamp: normalized.timestamp,
  });

  // Update daily health metrics
  try {
    const metricDate = new Date(normalized.timestamp);
    await dailyHealthMetricsService.updateDailyMetrics(
      finalUserId,
      metricDate,
      {
        recoveryScore: normalized.recovery_score,
        sleepHours: null,
        strainScore: null,
        cycleDay: null,
      },
      'whoop'
    );
  } catch (metricsError) {
    // Log but don't fail the webhook processing
    logger.warn('[WHOOPDataService] Failed to update daily metrics for recovery', {
      userId: finalUserId,
      error: metricsError instanceof Error ? metricsError.message : 'Unknown error',
    });
  }
}

/**
 * Process sleep webhook payload or API data
 * @param payload - Webhook payload or API data
 * @param userId - Optional user ID (if provided, skips lookup for webhooks)
 */
export async function processSleepWebhook(payload: WebhookPayload, userId?: string): Promise<void> {
  const sleepData = payload.data as WhoopSleepData;
  
  if (!sleepData || !sleepData.user_id) {
    throw ApiError.badRequest('Invalid sleep data in payload');
  }
  
  // Find user ID if not provided (for webhooks)
  let finalUserId = userId;
  if (!finalUserId) {
    const foundUserId = await findUserIdByWhoopId(sleepData.user_id);
    if (!foundUserId) {
      logger.warn('[WHOOPDataService] User not found for WHOOP user ID', {
        whoopUserId: sleepData.user_id,
      });
      return;
    }
    finalUserId = foundUserId;
  }
  
  // Get integration ID
  const integrationResult = await query<{ id: string }>(
    `SELECT id FROM user_integrations
     WHERE user_id = $1 AND provider = 'whoop' AND status = 'active'
     LIMIT 1`,
    [finalUserId]
  );
  
  if (integrationResult.rows.length === 0) {
    logger.warn('[WHOOPDataService] Active WHOOP integration not found', { userId: finalUserId });
    return;
  }
  
  const integrationId = integrationResult.rows[0].id;
  
  // Normalize data
  const normalized = normalizeSleepData(sleepData, finalUserId);
  
  // Store in health_data_records
  await query(
    `INSERT INTO health_data_records (
      user_id, integration_id, provider, data_type,
      recorded_at, value, unit, is_golden_source, raw_data_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING`,
    [
      finalUserId,
      integrationId,
      'whoop',
      'sleep',
      normalized.start_time,
      JSON.stringify(normalized),
      'minutes',
      true, // WHOOP is golden source for sleep
      normalized.source_record_id,
    ]
  );
  
  logger.info('[WHOOPDataService] Sleep data stored', {
    userId: finalUserId,
    durationMinutes: normalized.duration_minutes,
    startTime: normalized.start_time,
  });

  // Check if proactive message should be sent for poor sleep
  // Only check if sleep was poor (< 6 hours or quality < 60%)
  const sleepHours = normalized.duration_minutes / 60;
  const sleepQuality = normalized.sleep_quality_score || 0;
  const isPoorSleep = sleepHours < 6 || sleepQuality < 60;

  if (isPoorSleep) {
    // Trigger proactive message check asynchronously (don't block webhook processing)
    setImmediate(async () => {
      try {
        const { proactiveMessagingService } = await import('./proactive-messaging.service.js');
        await proactiveMessagingService.checkAndSendSleepMessage(finalUserId);
      } catch (error) {
        logger.warn('[WHOOPDataService] Error triggering proactive sleep message', {
          userId: finalUserId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Don't throw - proactive messaging failure shouldn't break webhook processing
      }
    });
  }

  // Update daily health metrics
  try {
    const metricDate = new Date(normalized.start_time);
    const sleepHours = normalized.duration_minutes / 60;
    await dailyHealthMetricsService.updateDailyMetrics(
      finalUserId,
      metricDate,
      {
        sleepHours,
        recoveryScore: null,
        strainScore: null,
        cycleDay: null,
      },
      'whoop'
    );
  } catch (metricsError) {
    // Log but don't fail the webhook processing
    logger.warn('[WHOOPDataService] Failed to update daily metrics for sleep', {
      userId: finalUserId,
      error: metricsError instanceof Error ? metricsError.message : 'Unknown error',
    });
  }
}

/**
 * Process workout webhook payload or API data
 * @param payload - Webhook payload or API data
 * @param userId - Optional user ID (if provided, skips lookup for webhooks)
 */
export async function processWorkoutWebhook(payload: WebhookPayload, userId?: string): Promise<void> {
  const workoutData = payload.data as WhoopWorkoutData;
  
  if (!workoutData || !workoutData.user_id) {
    throw ApiError.badRequest('Invalid workout data in payload');
  }
  
  // Find user ID if not provided (for webhooks)
  let finalUserId = userId;
  if (!finalUserId) {
    const foundUserId = await findUserIdByWhoopId(workoutData.user_id);
    if (!foundUserId) {
      logger.warn('[WHOOPDataService] User not found for WHOOP user ID', {
        whoopUserId: workoutData.user_id,
      });
      return;
    }
    finalUserId = foundUserId;
  }
  
  // Get integration ID
  const integrationResult = await query<{ id: string }>(
    `SELECT id FROM user_integrations
     WHERE user_id = $1 AND provider = 'whoop' AND status = 'active'
     LIMIT 1`,
    [finalUserId]
  );
  
  if (integrationResult.rows.length === 0) {
    logger.warn('[WHOOPDataService] Active WHOOP integration not found', { userId: finalUserId });
    return;
  }
  
  const integrationId = integrationResult.rows[0].id;
  
  // Normalize data
  const normalized = normalizeWorkoutData(workoutData, finalUserId);
  
  // Store in health_data_records
  await query(
    `INSERT INTO health_data_records (
      user_id, integration_id, provider, data_type,
      recorded_at, value, unit, is_golden_source, raw_data_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING`,
    [
      finalUserId,
      integrationId,
      'whoop',
      'strain',
      normalized.start_time,
      JSON.stringify(normalized),
      'score',
      true, // WHOOP is golden source for strain
      normalized.source_record_id,
    ]
  );
  
  logger.info('[WHOOPDataService] Workout data stored', {
    userId: finalUserId,
    strainScore: normalized.strain_score,
    startTime: normalized.start_time,
  });

  // Update daily health metrics (aggregate strain for the day)
  try {
    const metricDate = new Date(normalized.start_time);
    // Get existing daily metrics to preserve other values
    const existing = await dailyHealthMetricsService.getDailyMetricsHistory(
      finalUserId,
      metricDate,
      metricDate
    );
    
    const existingForDate = existing.find(
      (m) => m.metricDate.toISOString().split('T')[0] === metricDate.toISOString().split('T')[0]
    );

    // Use max strain for the day (WHOOP typically provides daily strain, but workouts contribute)
    const maxStrain = existingForDate?.strainScore 
      ? Math.max(existingForDate.strainScore, normalized.strain_score)
      : normalized.strain_score;

    await dailyHealthMetricsService.updateDailyMetrics(
      finalUserId,
      metricDate,
      {
        strainScore: maxStrain,
        sleepHours: existingForDate?.sleepHours ?? null,
        recoveryScore: existingForDate?.recoveryScore ?? null,
        cycleDay: existingForDate?.cycleDay ?? null,
      },
      'whoop'
    );
  } catch (metricsError) {
    // Log but don't fail the webhook processing
    logger.warn('[WHOOPDataService] Failed to update daily metrics for workout', {
      userId: finalUserId,
      error: metricsError instanceof Error ? metricsError.message : 'Unknown error',
    });
  }
}

/**
 * Process cycle webhook payload
 */
export async function processCycleWebhook(payload: WebhookPayload): Promise<void> {
  // Cycle data is typically aggregated - handle similarly to recovery
  const cycleData = payload.data;
  
  if (!cycleData || !cycleData.user_id) {
    throw ApiError.badRequest('Invalid cycle data in webhook payload');
  }
  
  logger.info('[WHOOPDataService] Cycle webhook received', {
    whoopUserId: cycleData.user_id,
    note: 'Cycle data processing - implement as needed',
  });
  
  // TODO: Implement cycle data processing if needed
  // Cycles are 24-hour physiological cycles tracked by WHOOP
}

/**
 * Fetch historical data from WHOOP API (90-day backfill)
 */
/**
 * Helper function to fetch with automatic token refresh on 401
 */
async function fetchWithAuthRetry(
  url: string,
  userId: string,
  currentToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  };
  
  let response = await makeRequest(currentToken);
  
  // If 401, try refreshing token and retry once
  if (response.status === 401) {
    console.log('[WHOOPDataService] 401 Unauthorized detected, attempting token refresh', { userId });
    
    try {
      // Force refresh by directly calling refresh logic
      // Get integration to access refresh token and scopes
      const integrationResult = await query<{
        refresh_token: string | null;
        client_id: string | null;
        client_secret: string | null;
        scopes: string[] | null;
        status: string;
      }>(
        `SELECT refresh_token, client_id, client_secret, scopes, status
         FROM user_integrations
         WHERE user_id = $1 AND provider = 'whoop'`,
        [userId]
      );
      
      if (integrationResult.rows.length === 0) {
        logger.error('[WHOOPDataService] No integration found for token refresh', { 
          userId,
        });
        return response; // Return 401
      }
      
      const integration = integrationResult.rows[0];
      
      // Check if integration is in error state - don't try to refresh
      if (integration.status === 'error' || integration.status === 'disconnected') {
        logger.error('[WHOOPDataService] Integration in error state - cannot refresh token', {
          userId,
          status: integration.status,
        });
        throw new Error('WHOOP_INTEGRATION_ERROR: Integration is in error state. Please reconnect your account.');
      }
      
      if (!integration.refresh_token) {
        logger.error('[WHOOPDataService] No refresh token available for refresh', { 
          userId,
          hasIntegration: true,
          hasRefreshToken: false,
        });
        return response; // Return 401
      }
      
      const refreshToken = integration.refresh_token;
      
      // Validate refresh token exists and looks valid
      if (!refreshToken || refreshToken.trim().length === 0) {
        logger.error('[WHOOPDataService] Refresh token is empty or invalid', { userId });
        return response; // Return 401
      }
      
      // Get credentials (per-user or from env) - MUST use same client_id as during token issuance
      // This is critical - WHOOP will reject refresh if client_id doesn't match
      const credResult = await query<{
        client_id: string | null;
        client_secret: string | null;
      }>(
        `SELECT client_id, client_secret
         FROM user_integrations
         WHERE user_id = $1 AND provider = 'whoop'`,
        [userId]
      );
      
      let clientId: string | undefined;
      let clientSecret: string | undefined;
      
      // Prioritize stored credentials (they match what was used during token issuance)
      if (credResult.rows.length > 0 && credResult.rows[0].client_id && credResult.rows[0].client_secret) {
        clientId = credResult.rows[0].client_id;
        clientSecret = credResult.rows[0].client_secret;
        logger.info('[WHOOPDataService] Using stored credentials for token refresh', {
          userId,
          usingStoredCredentials: true,
          clientIdPreview: clientId.substring(0, 20) + '...',
        });
      } else {
        // Fall back to environment variables (for legacy tokens or app-level credentials)
        clientId = process.env.WHOOP_CLIENT_ID;
        clientSecret = process.env.WHOOP_CLIENT_SECRET;
        logger.warn('[WHOOPDataService] Using environment credentials for token refresh (stored credentials not found)', {
          userId,
          usingStoredCredentials: false,
          hasEnvClientId: !!clientId,
          hasEnvClientSecret: !!clientSecret,
        });
      }
      
      if (!clientId || !clientSecret) {
        logger.error('[WHOOPDataService] Missing credentials for token refresh', { 
          userId,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
          storedCredentialsFound: !!(credResult.rows[0]?.client_id),
        });
        console.error('[WHOOPDataService] CRITICAL: Cannot refresh token - credentials missing', {
          userId,
          hasStoredClientId: !!(credResult.rows[0]?.client_id),
          hasEnvClientId: !!process.env.WHOOP_CLIENT_ID,
        });
        return response; // Return 401
      }
      
      console.log('[WHOOPDataService] Forcing token refresh after 401', { 
        userId,
        refreshTokenLength: refreshToken.length,
        refreshTokenPreview: `${refreshToken.substring(0, 20)}...`,
        usingStoredCredentials: !!(credResult.rows[0]?.client_id),
        clientIdPreview: clientId.substring(0, 20) + '...',
      });
      
      // Get redirect_uri from env config
      const { env } = await import('../config/env.config.js');
      const redirectUri = `${env.client.url}/auth/whoop/callback`;
      
      const newTokens = await refreshWhoopToken(refreshToken, clientId, clientSecret, userId, redirectUri);
      
      // Update stored tokens
      await query(
        `UPDATE user_integrations
         SET access_token = $1, refresh_token = $2, token_expiry = $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND provider = 'whoop'`,
        [
          newTokens.accessToken,
          newTokens.refreshToken || refreshToken, // Fallback to old refresh token if not provided
          newTokens.expiresAt ? newTokens.expiresAt : null,
          userId,
        ]
      );
      
      console.log('[WHOOPDataService] Token refreshed after 401, retrying request', { userId });
      response = await makeRequest(newTokens.accessToken);
    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Unknown error';
      const errorStack = refreshError instanceof Error ? refreshError.stack : undefined;
      const isClientIdMismatch = errorMessage.includes('credentials have changed') || 
                                 errorMessage.includes('Client ID') ||
                                 errorMessage.includes('does not match');
      
      console.error('[WHOOPDataService] Token refresh failed after 401', {
        userId,
        error: errorMessage,
        errorType: refreshError instanceof Error ? refreshError.constructor.name : 'Unknown',
        isClientIdMismatch,
      });
      
      logger.error('[WHOOPDataService] Token refresh failed after 401', {
        userId,
        error: errorMessage,
        stack: errorStack,
        isClientIdMismatch,
      });
      
      // If it's a client_id mismatch, clear tokens and set status to pending (not error)
      // This allows the user to reconnect without manual intervention
      if (isClientIdMismatch) {
        try {
          // Clear tokens and set status to pending so user can reconnect
          await query(
            `UPDATE user_integrations
             SET access_token = NULL, refresh_token = NULL, token_expiry = NULL,
                 status = 'pending', last_sync_error = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND provider = 'whoop'`,
            [userId]
          );
          
          console.error('[WHOOPDataService] CRITICAL: WHOOP tokens cleared - credentials mismatch', {
            userId,
            reason: 'Client ID mismatch during token refresh',
            action: 'User must reconnect WHOOP',
            status: 'pending',
          });
          
          logger.warn('[WHOOPDataService] WHOOP tokens cleared due to client_id mismatch', {
            userId,
            action: 'User must reconnect WHOOP',
          });
        } catch (updateError) {
          logger.error('[WHOOPDataService] Failed to clear tokens after client_id mismatch', {
            userId,
            error: updateError instanceof Error ? updateError.message : 'Unknown error',
          });
        }
        
        // Always throw to stop processing when client_id mismatch is detected
        // This prevents cascading failures when trying to continue fetching data
        throw new Error('WHOOP_INTEGRATION_ERROR: WHOOP credentials have changed. Your tokens have been cleared. Please click "Connect WHOOP" to reconnect with your current credentials.');
      } else {
        // For other errors, just log that reconnection may be needed
        // But don't stop processing - return the 401 response
        console.error('[WHOOPDataService] WHOOP integration may need reconnection', {
          userId,
          reason: 'Token refresh failed',
          action: 'User should disconnect and reconnect WHOOP in settings',
        });
      }
    }
  }
  
  return response;
}

export async function fetchHistoricalData(
  userId: string,
  days: number = 90
): Promise<{
  recovery: number;
  sleep: number;
  workouts: number;
}> {
  const startTime = Date.now();
  
  console.log('[WHOOPDataService] ===== Starting Historical Data Sync =====', {
    userId,
    days,
    timestamp: new Date().toISOString(),
  });
  
  try {
    // Get access token (will auto-refresh if needed)
    console.log('[WHOOPDataService] Obtaining WHOOP access token...', { userId });
    let accessToken = await getWhoopAccessToken(userId);
    console.log('[WHOOPDataService] Access token obtained successfully', {
      userId,
      tokenLength: accessToken.length,
      tokenPreview: accessToken.substring(0, 20) + '...',
    });
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    console.log('[WHOOPDataService] Sync date range:', {
      userId,
      startDate: startISO,
      endDate: endISO,
      days,
    });
    
    let recoveryCount = 0;
    let sleepCount = 0;
    let workoutCount = 0;
    
    // Check integration status before starting data fetch
    // This prevents wasting time if integration is already in error state
    const statusCheck = await query<{ status: string; last_sync_error: string | null; access_token: string | null }>(
      `SELECT status, last_sync_error, access_token
       FROM user_integrations
       WHERE user_id = $1 AND provider = 'whoop'`,
      [userId]
    );
    
    if (statusCheck.rows.length > 0) {
      const integration = statusCheck.rows[0];
      if (integration.status === 'error') {
        const errorMessage = integration.last_sync_error || 
          'WHOOP integration is in an error state. Please disconnect and reconnect your WHOOP account.';
        
        // If it's a credentials mismatch error and tokens exist, clear them automatically
        const isCredentialsMismatch = errorMessage.includes('credentials have changed') || 
                                       errorMessage.includes('Client ID') ||
                                       errorMessage.includes('does not match');
        
        if (isCredentialsMismatch && integration.access_token) {
          console.log('[WHOOPDataService] Auto-clearing tokens due to credentials mismatch', { userId });
          await query(
            `UPDATE user_integrations SET
             access_token = NULL, refresh_token = NULL, token_expiry = NULL,
             status = 'pending', last_sync_error = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND provider = 'whoop'`,
            [userId]
          );
          throw new Error('WHOOP credentials have changed. Your tokens have been cleared. Please click "Connect WHOOP" to reconnect with your current credentials.');
        }
        
        console.error('[WHOOPDataService] Cannot sync - integration is in error state', {
          userId,
          status: integration.status,
          error: integration.last_sync_error,
        });
        
        logger.error('[WHOOPDataService] Cannot sync - integration is in error state', {
          userId,
          status: integration.status,
          error: integration.last_sync_error,
        });
        
        throw new Error(errorMessage);
      }
    }
    
    // Fetch recovery data with pagination
    try {
      const startISO = startDate.toISOString(); // Date-time format (ISO 8601)
      const endISO = endDate.toISOString();
      
      console.log('[WHOOPDataService] Fetching recovery data', {
        userId,
        startDate: startISO,
        endDate: endISO,
        days,
      });
      
      let nextToken: string | null = null;
      let allRecoveryRecords: unknown[] = [];
      
      do {
        const params = new URLSearchParams({
          start: startISO,
          end: endISO,
          limit: '25', // Max limit per WHOOP API
        });
        if (nextToken) {
          params.set('nextToken', nextToken);
        }
        
        const recoveryUrl = `${WHOOP_API_V2_BASE}/recovery?${params.toString()}`;
        console.log('[WHOOPDataService] Recovery API Request:', {
          url: recoveryUrl,
          method: 'GET',
          hasToken: !!accessToken,
        });
        
        // Wrap fetchWithAuthRetry in try-catch to handle WHOOP_INTEGRATION_ERROR
        let recoveryResponse: Response;
        try {
          recoveryResponse = await fetchWithAuthRetry(recoveryUrl, userId, accessToken);
        } catch (fetchError) {
          // If fetchWithAuthRetry throws WHOOP_INTEGRATION_ERROR, stop processing
          if (fetchError instanceof Error && fetchError.message.includes('WHOOP_INTEGRATION_ERROR')) {
            console.error('[WHOOPDataService] Critical error during recovery fetch - stopping sync', {
              userId,
              error: fetchError.message,
            });
            throw fetchError; // Re-throw to stop entire sync
          }
          // For other errors, wrap in a response-like object or rethrow
          throw fetchError;
        }
        
        // If fetchWithAuthRetry returned 401 and we couldn't refresh, check if integration is now in error state
        if (recoveryResponse.status === 401) {
          // Check if integration was marked as error during refresh attempt
          const errorCheck = await query<{ status: string }>(
            `SELECT status FROM user_integrations WHERE user_id = $1 AND provider = 'whoop'`,
            [userId]
          );
          
          if (errorCheck.rows.length > 0 && errorCheck.rows[0].status === 'error') {
            console.error('[WHOOPDataService] Integration marked as error during recovery fetch - stopping sync', {
              userId,
            });
            throw new Error('WHOOP_INTEGRATION_ERROR: Integration marked as error. Please reconnect your account.');
          }
          
          // If still 401 after refresh attempt, we can't proceed
          console.error('[WHOOPDataService] Recovery fetch returned 401 after refresh attempt - stopping sync', {
            userId,
          });
          throw new Error('WHOOP_INTEGRATION_ERROR: Unable to authenticate with WHOOP. Please reconnect your account.');
        }
        
        // If request succeeded, optionally check for token refresh
        if (recoveryResponse.ok) {
          try {
            const newToken = await getWhoopAccessToken(userId);
            if (newToken !== accessToken) {
              accessToken = newToken;
            }
          } catch (tokenError) {
            // If token check fails, log but don't fail the request
            logger.warn('[WHOOPDataService] Failed to check for token refresh', {
              userId,
              error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
            });
          }
        }
        
        console.log('[WHOOPDataService] Recovery API Response Status:', {
          status: recoveryResponse.status,
          statusText: recoveryResponse.statusText,
          ok: recoveryResponse.ok,
        });
        
        if (!recoveryResponse.ok) {
          const errorText = await recoveryResponse.text();
          console.error('[WHOOPDataService] Recovery API Error Response:', {
            status: recoveryResponse.status,
            statusText: recoveryResponse.statusText,
            error: errorText,
          });
          logger.warn('[WHOOPDataService] Recovery API returned non-OK status', {
            userId,
            status: recoveryResponse.status,
            statusText: recoveryResponse.statusText,
            error: errorText,
          });
          break;
        }
        
        const responseText = await recoveryResponse.text();
        console.log('[WHOOPDataService] Recovery API Response Body (raw):', responseText.substring(0, 500));
        
        let recoveryData: { records?: unknown[]; next_token?: string };
        try {
          recoveryData = JSON.parse(responseText) as { records?: unknown[]; next_token?: string };
          console.log('[WHOOPDataService] Recovery API Response (parsed):', {
            hasRecords: !!recoveryData.records,
            recordCount: recoveryData.records?.length || 0,
            hasNextToken: !!recoveryData.next_token,
            firstRecord: recoveryData.records?.[0] ? JSON.stringify(recoveryData.records[0]).substring(0, 200) : null,
          });
        } catch (parseError) {
          console.error('[WHOOPDataService] Failed to parse recovery response:', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            responsePreview: responseText.substring(0, 200),
          });
          logger.error('[WHOOPDataService] Failed to parse recovery response', {
            userId,
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
          });
          break;
        }
        
        const records = recoveryData.records || [];
        allRecoveryRecords.push(...records);
        nextToken = recoveryData.next_token || null;
        
        logger.info('[WHOOPDataService] Fetched recovery records page', {
          userId,
          pageCount: records.length,
          totalSoFar: allRecoveryRecords.length,
          hasNextPage: !!nextToken,
        });
      } while (nextToken);
      
      recoveryCount = allRecoveryRecords.length;
      
      console.log('[WHOOPDataService] Total recovery records fetched:', {
        userId,
        totalCount: recoveryCount,
      });
      
      // Process and store each record (pass userId to skip lookup)
      for (const record of allRecoveryRecords) {
        try {
          await processRecoveryWebhook({ data: record }, userId);
        } catch (recordError) {
          logger.error('[WHOOPDataService] Error processing recovery record', {
            userId,
            error: recordError instanceof Error ? recordError.message : 'Unknown error',
          });
        }
      }
      
      logger.info('[WHOOPDataService] Completed recovery data sync', {
        userId,
        totalRecords: recoveryCount,
      });
    } catch (error) {
      logger.error('[WHOOPDataService] Error fetching recovery data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    
    // Fetch sleep data with pagination
    try {
      const startISO = startDate.toISOString(); // Date-time format (ISO 8601)
      const endISO = endDate.toISOString();
      
      console.log('[WHOOPDataService] Fetching sleep data', {
        userId,
        startDate: startISO,
        endDate: endISO,
        days,
      });
      
      let nextToken: string | null = null;
      let allSleepRecords: unknown[] = [];
      
      do {
        const params = new URLSearchParams({
          start: startISO,
          end: endISO,
          limit: '25', // Max limit per WHOOP API
        });
        if (nextToken) {
          params.set('nextToken', nextToken);
        }
        
        const sleepUrl = `${WHOOP_API_V2_BASE}/activity/sleep?${params.toString()}`;
        console.log('[WHOOPDataService] Sleep API Request:', {
          url: sleepUrl,
          method: 'GET',
          hasToken: !!accessToken,
        });
        
        let sleepResponse = await fetchWithAuthRetry(sleepUrl, userId, accessToken);
        
        // Update accessToken if it was refreshed
        if (sleepResponse.status === 401) {
          accessToken = await getWhoopAccessToken(userId);
        } else {
          const newToken = await getWhoopAccessToken(userId);
          if (newToken !== accessToken) {
            accessToken = newToken;
          }
        }
        
        console.log('[WHOOPDataService] Sleep API Response Status:', {
          status: sleepResponse.status,
          statusText: sleepResponse.statusText,
          ok: sleepResponse.ok,
        });
        
        if (!sleepResponse.ok) {
          const errorText = await sleepResponse.text();
          console.error('[WHOOPDataService] Sleep API Error Response:', {
            status: sleepResponse.status,
            statusText: sleepResponse.statusText,
            error: errorText,
          });
          logger.warn('[WHOOPDataService] Sleep API returned non-OK status', {
            userId,
            status: sleepResponse.status,
            statusText: sleepResponse.statusText,
            error: errorText,
          });
          break;
        }
        
        const responseText = await sleepResponse.text();
        console.log('[WHOOPDataService] Sleep API Response Body (raw):', responseText.substring(0, 500));
        
        let sleepData: { records?: unknown[]; next_token?: string };
        try {
          sleepData = JSON.parse(responseText) as { records?: unknown[]; next_token?: string };
          console.log('[WHOOPDataService] Sleep API Response (parsed):', {
            hasRecords: !!sleepData.records,
            recordCount: sleepData.records?.length || 0,
            hasNextToken: !!sleepData.next_token,
            firstRecord: sleepData.records?.[0] ? JSON.stringify(sleepData.records[0]).substring(0, 200) : null,
          });
        } catch (parseError) {
          console.error('[WHOOPDataService] Failed to parse sleep response:', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            responsePreview: responseText.substring(0, 200),
          });
          logger.error('[WHOOPDataService] Failed to parse sleep response', {
            userId,
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
          });
          break;
        }
        
        const records = sleepData.records || [];
        allSleepRecords.push(...records);
        nextToken = sleepData.next_token || null;
        
        logger.info('[WHOOPDataService] Fetched sleep records page', {
          userId,
          pageCount: records.length,
          totalSoFar: allSleepRecords.length,
          hasNextPage: !!nextToken,
        });
      } while (nextToken);
      
      sleepCount = allSleepRecords.length;
      
      console.log('[WHOOPDataService] Total sleep records fetched:', {
        userId,
        totalCount: sleepCount,
      });
      
      // Process and store each record (pass userId to skip lookup)
      for (const record of allSleepRecords) {
        try {
          await processSleepWebhook({ data: record }, userId);
        } catch (recordError) {
          logger.error('[WHOOPDataService] Error processing sleep record', {
            userId,
            error: recordError instanceof Error ? recordError.message : 'Unknown error',
          });
        }
      }
      
      logger.info('[WHOOPDataService] Completed sleep data sync', {
        userId,
        totalRecords: sleepCount,
      });
    } catch (error) {
      logger.error('[WHOOPDataService] Error fetching sleep data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    
    // Fetch workout data with pagination
    try {
      const startISO = startDate.toISOString(); // Date-time format (ISO 8601)
      const endISO = endDate.toISOString();
      
      console.log('[WHOOPDataService] Fetching workout data', {
        userId,
        startDate: startISO,
        endDate: endISO,
        days,
      });
      
      let nextToken: string | null = null;
      let allWorkoutRecords: unknown[] = [];
      
      do {
        const params = new URLSearchParams({
          start: startISO,
          end: endISO,
          limit: '25', // Max limit per WHOOP API
        });
        if (nextToken) {
          params.set('nextToken', nextToken);
        }
        
        const workoutUrl = `${WHOOP_API_V2_BASE}/activity/workout?${params.toString()}`;
        console.log('[WHOOPDataService] Workout API Request:', {
          url: workoutUrl,
          method: 'GET',
          hasToken: !!accessToken,
        });
        
        let workoutResponse = await fetchWithAuthRetry(workoutUrl, userId, accessToken);
        
        // Update accessToken if it was refreshed
        if (workoutResponse.status === 401) {
          accessToken = await getWhoopAccessToken(userId);
        } else {
          const newToken = await getWhoopAccessToken(userId);
          if (newToken !== accessToken) {
            accessToken = newToken;
          }
        }
        
        console.log('[WHOOPDataService] Workout API Response Status:', {
          status: workoutResponse.status,
          statusText: workoutResponse.statusText,
          ok: workoutResponse.ok,
        });
        
        if (!workoutResponse.ok) {
          const errorText = await workoutResponse.text();
          console.error('[WHOOPDataService] Workout API Error Response:', {
            status: workoutResponse.status,
            statusText: workoutResponse.statusText,
            error: errorText,
          });
          logger.warn('[WHOOPDataService] Workout API returned non-OK status', {
            userId,
            status: workoutResponse.status,
            statusText: workoutResponse.statusText,
            error: errorText,
          });
          break;
        }
        
        const responseText = await workoutResponse.text();
        console.log('[WHOOPDataService] Workout API Response Body (raw):', responseText.substring(0, 500));
        
        let workoutData: { records?: unknown[]; next_token?: string };
        try {
          workoutData = JSON.parse(responseText) as { records?: unknown[]; next_token?: string };
          console.log('[WHOOPDataService] Workout API Response (parsed):', {
            hasRecords: !!workoutData.records,
            recordCount: workoutData.records?.length || 0,
            hasNextToken: !!workoutData.next_token,
            firstRecord: workoutData.records?.[0] ? JSON.stringify(workoutData.records[0]).substring(0, 200) : null,
          });
        } catch (parseError) {
          console.error('[WHOOPDataService] Failed to parse workout response:', {
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
            responsePreview: responseText.substring(0, 200),
          });
          logger.error('[WHOOPDataService] Failed to parse workout response', {
            userId,
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
          });
          break;
        }
        
        const records = workoutData.records || [];
        allWorkoutRecords.push(...records);
        nextToken = workoutData.next_token || null;
        
        logger.info('[WHOOPDataService] Fetched workout records page', {
          userId,
          pageCount: records.length,
          totalSoFar: allWorkoutRecords.length,
          hasNextPage: !!nextToken,
        });
      } while (nextToken);
      
      workoutCount = allWorkoutRecords.length;
      
      console.log('[WHOOPDataService] Total workout records fetched:', {
        userId,
        totalCount: workoutCount,
      });
      
      // Process and store each record (pass userId to skip lookup)
      for (const record of allWorkoutRecords) {
        try {
          await processWorkoutWebhook({ data: record }, userId);
        } catch (recordError) {
          logger.error('[WHOOPDataService] Error processing workout record', {
            userId,
            error: recordError instanceof Error ? recordError.message : 'Unknown error',
          });
        }
      }
      
      logger.info('[WHOOPDataService] Completed workout data sync', {
        userId,
        totalRecords: workoutCount,
      });
    } catch (error) {
      logger.error('[WHOOPDataService] Error fetching workout data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    
    const duration = Date.now() - startTime;
    const totalRecords = recoveryCount + sleepCount + workoutCount;
    
    console.log('[WHOOPDataService] ===== Historical Data Sync Completed =====', {
      userId,
      durationMs: duration,
      durationSeconds: Math.round(duration / 1000),
      recoveryCount,
      sleepCount,
      workoutCount,
      totalRecords,
      success: true,
    });
    
    logger.info('[WHOOPDataService] Historical data fetched', {
      userId,
      recoveryCount,
      sleepCount,
      workoutCount,
      totalRecords,
      durationMs: duration,
    });

    // Update daily metrics for all synced data
    // Get the latest records for each type and update daily metrics
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get latest recovery for today
      const latestRecovery = await query<{
        value: any;
        recorded_at: Date;
      }>(
        `SELECT value, recorded_at FROM health_data_records
         WHERE user_id = $1 AND provider = 'whoop' AND data_type = 'recovery'
         AND recorded_at >= $2
         ORDER BY recorded_at DESC LIMIT 1`,
        [userId, today]
      );

      // Get latest sleep for today
      const latestSleep = await query<{
        value: any;
        recorded_at: Date;
      }>(
        `SELECT value, recorded_at FROM health_data_records
         WHERE user_id = $1 AND provider = 'whoop' AND data_type = 'sleep'
         AND recorded_at >= $2
         ORDER BY recorded_at DESC LIMIT 1`,
        [userId, today]
      );

      // Get max strain for today (aggregate all workouts)
      const todayStrain = await query<{
        value: any;
        recorded_at: Date;
      }>(
        `SELECT value, recorded_at FROM health_data_records
         WHERE user_id = $1 AND provider = 'whoop' AND data_type = 'strain'
         AND recorded_at >= $2
         ORDER BY (value->>'strain_score')::numeric DESC LIMIT 1`,
        [userId, today]
      );

      if (latestRecovery.rows[0] || latestSleep.rows[0] || todayStrain.rows[0]) {
        const recoveryData = latestRecovery.rows[0]?.value;
        const sleepData = latestSleep.rows[0]?.value;
        const strainData = todayStrain.rows[0]?.value;

        await dailyHealthMetricsService.updateDailyMetrics(
          userId,
          today,
          {
            recoveryScore: recoveryData?.recovery_score ?? null,
            sleepHours: sleepData?.duration_minutes 
              ? parseFloat((sleepData.duration_minutes / 60).toFixed(2))
              : null,
            strainScore: strainData?.strain_score ?? null,
            cycleDay: null, // Cycle data not yet available
          },
          'whoop'
        );

        logger.info('[WHOOPDataService] Daily metrics updated after historical sync', {
          userId,
          hasRecovery: !!recoveryData,
          hasSleep: !!sleepData,
          hasStrain: !!strainData,
        });
      }
    } catch (metricsError) {
      // Log but don't fail the sync
      logger.warn('[WHOOPDataService] Failed to update daily metrics after historical sync', {
        userId,
        error: metricsError instanceof Error ? metricsError.message : 'Unknown error',
      });
    }
    
    return { recovery: recoveryCount, sleep: sleepCount, workouts: workoutCount };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[WHOOPDataService] ===== Historical Data Sync Failed =====', {
      userId,
      durationMs: duration,
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString(),
    });
    
    logger.error('[WHOOPDataService] Error in fetchHistoricalData', {
      userId,
      error: errorMessage,
      stack: errorStack,
      durationMs: duration,
    });
    
    throw error;
  }
}

export const whoopDataService = {
  processRecoveryWebhook,
  processSleepWebhook,
  processWorkoutWebhook,
  processCycleWebhook,
  fetchHistoricalData,
};

