/**
 * Entitlements Controller
 * GET /api/me/entitlements — server-authoritative entitlement bundle with ETag.
 */

import type { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getUserEntitlements } from '../services/entitlement.service.js';
import { ensureWalletForEntitlements } from '../services/credit.service.js';

export const getMyEntitlementsHandler = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) throw ApiError.unauthorized('Authentication required');

        // First-time callers won't have a wallet row yet. ensureWalletForEntitlements
        // does exactly what its name suggests: no credits, no ledger rows.
        // Trial credits are granted by the Sprint 2 migration #10 backfill,
        // not by the entitlements hot path.
        await ensureWalletForEntitlements(userId);

        const bundle = await getUserEntitlements(userId);

        // ETag: allow the client to skip the body when nothing changed.
        const etag = `W/"${bundle.etag}"`;
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'private, max-age=60');

        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
            res.status(304).end();
            return;
        }

        ApiResponse.success(res, bundle);
    }
);
