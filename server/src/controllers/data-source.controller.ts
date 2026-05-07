/**
 * @file Data Source Controller
 * @description Request handlers for the Universal Data Source Correlation system
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { dataSourceManagerService } from '../services/data-source-manager.service.js';
import { crossDomainCorrelatorService } from '../services/cross-domain-correlator.service.js';
import { prayerTimesService } from '../services/prayer-times.service.js';
import { financeTrackingService } from '../services/finance-tracking.service.js';

function getUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  return userId;
}

// ============================================
// CONNECTIONS
// ============================================

export const getConnections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const connections = await dataSourceManagerService.getConnections(getUserId(req));
  ApiResponse.success(res, { connections }, 'Connections retrieved');
});

export const connectSource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = getUserId(req);
  const { sourceType, config } = req.body;

  if (!sourceType) throw ApiError.badRequest('sourceType is required');

  const connection = await dataSourceManagerService.upsertConnection(userId, sourceType, config || {});

  if (sourceType === 'prayer_times' && config?.city && config?.country) {
    try {
      await prayerTimesService.syncPrayerTimes(userId, config);
      await dataSourceManagerService.markSynced(userId, 'prayer_times');
    } catch (error) {
      await dataSourceManagerService.updateConnectionStatus(
        userId,
        'prayer_times',
        'error',
        error instanceof Error ? error.message : 'Prayer time sync failed',
      );
      throw ApiError.badRequest('Unable to fetch prayer times for this location. Check the city, country, and calculation settings.');
    }
  }

  ApiResponse.created(res, { connection }, 'Source connected');
});

export const disconnectSource = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { sourceType } = req.params;
  if (!sourceType) throw ApiError.badRequest('sourceType is required');

  await dataSourceManagerService.disconnect(getUserId(req), sourceType);
  ApiResponse.success(res, null, 'Source disconnected');
});

// ============================================
// SIGNALS & CORRELATION
// ============================================

export const getSignals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const signals = await dataSourceManagerService.getSignalsForDate(getUserId(req), date);
  ApiResponse.success(res, { signals }, 'Signals retrieved');
});

export const getDailyCorrelation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const correlation = await crossDomainCorrelatorService.getCachedOrCompute(getUserId(req), date);
  ApiResponse.success(res, { correlation }, 'Correlation retrieved');
});

export const getCorrelationHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
  const history = await crossDomainCorrelatorService.getCorrelationHistory(getUserId(req), days);
  ApiResponse.success(res, { history }, 'Correlation history retrieved');
});

export const getOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const overview = await dataSourceManagerService.getOverview(getUserId(req));
  ApiResponse.success(res, { overview }, 'Overview retrieved');
});

// ============================================
// PRAYER SCHEDULE
// ============================================

export const getPrayerSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const prayers = await prayerTimesService.getPrayerSchedule(getUserId(req), date);
  ApiResponse.success(res, { prayers }, 'Prayer schedule retrieved');
});

export const syncPrayerSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = getUserId(req);
  const date = (req.body?.date as string | undefined) || (req.query.date as string | undefined);
  const connection = await dataSourceManagerService.getConnection(userId, 'prayer_times');
  if (!connection || connection.status === 'disconnected') {
    throw ApiError.badRequest('Prayer times are not connected');
  }

  try {
    const prayers = await prayerTimesService.syncPrayerTimes(userId, {
      ...connection.config,
      ...(date ? { date } : {}),
    });
    await dataSourceManagerService.markSynced(userId, 'prayer_times');
    ApiResponse.success(res, { prayers }, 'Prayer schedule synced');
  } catch (error) {
    await dataSourceManagerService.updateConnectionStatus(
      userId,
      'prayer_times',
      'error',
      error instanceof Error ? error.message : 'Prayer time sync failed',
    );
    throw ApiError.badRequest('Unable to sync prayer times. Check the saved city, country, and calculation settings.');
  }
});

export const saveManualPrayerTimes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = getUserId(req);
  const { date, manualTimes, timezone } = req.body as {
    date?: string;
    manualTimes?: Record<string, string>;
    timezone?: string;
  };

  if (!manualTimes || typeof manualTimes !== 'object') {
    throw ApiError.badRequest('manualTimes is required');
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const connection = await dataSourceManagerService.getConnection(userId, 'prayer_times');
  const nextConfig = {
    ...(connection?.config ?? {}),
    manualTimes,
    ...(timezone ? { timezone } : {}),
  };

  const prayers = await prayerTimesService.upsertManualPrayerTimes(
    userId,
    targetDate,
    manualTimes as any,
    timezone || String(connection?.config.timezone || 'UTC'),
  );

  await dataSourceManagerService.upsertConnection(userId, 'prayer_times', nextConfig);
  ApiResponse.success(res, { prayers, config: nextConfig }, 'Manual prayer times saved');
});

export const markPrayerComplete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) throw ApiError.badRequest('Prayer id is required');

  const success = await prayerTimesService.markCompleted(getUserId(req), id);
  if (!success) throw ApiError.notFound('Prayer not found or already completed');
  ApiResponse.success(res, null, 'Prayer marked complete');
});

// ============================================
// SPENDING
// ============================================

export const addTransaction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await financeTrackingService.addTransaction(getUserId(req), req.body);
  ApiResponse.created(res, { transaction }, 'Transaction created');
});

export const getTransactions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const start = (req.query.start as string) || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const end = (req.query.end as string) || new Date().toISOString().split('T')[0];
  const transactions = await financeTrackingService.getTransactions(getUserId(req), start, end);
  ApiResponse.success(res, { transactions }, 'Transactions retrieved');
});

export const importCSV = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows)) throw ApiError.badRequest('rows array is required');

  const count = await financeTrackingService.importCSV(getUserId(req), rows);
  ApiResponse.created(res, { count }, 'CSV imported');
});

export const getCategoryBreakdown = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const start = (req.query.start as string) || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const end = (req.query.end as string) || new Date().toISOString().split('T')[0];
  const breakdown = await financeTrackingService.getCategoryBreakdown(getUserId(req), start, end);
  ApiResponse.success(res, { breakdown }, 'Category breakdown retrieved');
});
