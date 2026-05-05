/**
 * @file Calendar Routes
 * @description Google Calendar OAuth + sync + event retrieval endpoints
 */

import { Router, type Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { query } from '../config/database.config.js';
import { googleCalendarService } from '../services/google-calendar.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// ── OAuth callback must be BEFORE authenticate middleware ──
// Google redirects here with no JWT header — userId comes from the `state` query param.
router.get(
  '/callback',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const clientUrl = process.env['CLIENT_URL'] || 'http://localhost:3000';
    // Land every outcome on the premium success/error page. It auto-forwards
    // to /wellbeing/schedule on success and shows retry options on failure.
    const doneUrl = `${clientUrl}/calendar/connected`;

    // If the user denied consent or Google returned an error in the redirect,
    // it arrives as `?error=access_denied` (no `code`). Surface that to the UI.
    const googleError = req.query.error as string | undefined;
    if (googleError) {
      return res.redirect(`${doneUrl}?status=error&reason=${encodeURIComponent(googleError)}`);
    }

    const userId = req.query.state as string;
    const code = req.query.code as string;

    if (!userId || !code) {
      return res.redirect(`${doneUrl}?status=error&reason=${encodeURIComponent('Missing authorization code or user state')}`);
    }

    // Validate userId exists in DB to prevent abuse
    const userCheck = await query<{ id: string }>('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.redirect(`${doneUrl}?status=error&reason=${encodeURIComponent('Invalid user state parameter')}`);
    }

    try {
      const connection = await googleCalendarService.handleCallback(userId, code);
      // Trigger initial sync (fire-and-forget)
      googleCalendarService.syncEvents(userId, connection.id).catch(() => {});
      return res.redirect(`${doneUrl}?status=connected`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      return res.redirect(`${doneUrl}?status=error&reason=${encodeURIComponent(message)}`);
    }
  }),
);

// All remaining routes require authentication
router.use(authenticate);

/**
 * GET /api/calendar/auth-url
 * Get Google Calendar OAuth2 authorization URL
 */
router.get(
  '/auth-url',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const hasCredentials = await googleCalendarService.isUserConfigured(userId);
    if (!hasCredentials) {
      throw ApiError.badRequest('Please add your Google Calendar credentials first');
    }

    const url = await googleCalendarService.getAuthUrl(userId);
    ApiResponse.success(res, { url }, 'Authorization URL generated');
  }),
);

/**
 * POST /api/calendar/credentials
 * Save user's own Google Calendar API credentials
 */
router.post(
  '/credentials',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const { clientId, clientSecret, redirectUri } = req.body;
    if (!clientId || !clientSecret) {
      throw ApiError.badRequest('Client ID and Client Secret are required');
    }
    // Validate optional redirect URI — must be absolute http(s) URL.
    if (redirectUri && !/^https?:\/\//i.test(String(redirectUri))) {
      throw ApiError.badRequest('Redirect URI must start with http:// or https://');
    }

    await googleCalendarService.saveCredentials(userId, clientId, clientSecret, redirectUri);
    ApiResponse.success(res, null, 'Google Calendar credentials saved');
  }),
);

/**
 * GET /api/calendar/credentials
 * Get user's masked credentials
 */
router.get(
  '/credentials',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const credentials = await googleCalendarService.getCredentials(userId);
    const suggestedRedirectUri = googleCalendarService.getDefaultRedirectUri();
    ApiResponse.success(res, {
      credentials,
      hasCredentials: !!credentials,
      suggestedRedirectUri,
    });
  }),
);

/**
 * DELETE /api/calendar/credentials
 * Remove credentials and disconnect calendar
 */
router.delete(
  '/credentials',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    await googleCalendarService.deleteCredentials(userId);
    ApiResponse.success(res, null, 'Google Calendar credentials removed');
  }),
);

/**
 * GET /api/calendar/connections
 * List user's calendar connections
 */
router.get(
  '/connections',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const connections = await googleCalendarService.getConnections(userId);
    ApiResponse.success(res, { connections, configured: googleCalendarService.isConfigured() });
  }),
);

/**
 * DELETE /api/calendar/connections/:id
 * Disconnect a calendar connection
 */
router.delete(
  '/connections/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    await googleCalendarService.disconnect(userId, req.params.id);
    ApiResponse.success(res, null, 'Calendar disconnected');
  }),
);

/**
 * GET /api/calendar/connections/:id/calendars
 * List available calendars from user's Google account
 */
router.get(
  '/connections/:id/calendars',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const calendars = await googleCalendarService.listCalendars(userId, req.params.id);
    ApiResponse.success(res, { calendars });
  }),
);

/**
 * PUT /api/calendar/connections/:id/calendars
 * Select which calendars to sync
 */
router.put(
  '/connections/:id/calendars',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const { calendarIds } = req.body;
    if (!Array.isArray(calendarIds)) throw ApiError.badRequest('calendarIds must be an array');

    await googleCalendarService.updateSyncCalendars(userId, req.params.id, calendarIds);
    ApiResponse.success(res, null, 'Sync calendars updated');
  }),
);

/**
 * POST /api/calendar/sync
 * Trigger manual sync for all user connections
 */
router.post(
  '/sync',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const connections = await googleCalendarService.getConnections(userId);
    let totalSynced = 0;

    for (const conn of connections) {
      if (!conn.syncEnabled) continue;
      try {
        const count = await googleCalendarService.syncEvents(userId, conn.id);
        totalSynced += count;
      } catch (err) {
        console.error('[Calendar] Sync failed for connection', conn.id, err);
      }
    }

    ApiResponse.success(res, { eventsSynced: totalSynced }, 'Calendar sync completed');
  }),
);

/**
 * GET /api/calendar/events
 * Get synced calendar events for a date range
 */
router.get(
  '/events',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized();

    const startDate = (req.query.start as string) || new Date().toISOString().split('T')[0];
    const endDate = (req.query.end as string) || startDate;

    const events = await googleCalendarService.getEvents(userId, startDate, endDate);
    ApiResponse.success(res, { events, count: events.length });
  }),
);

export default router;
