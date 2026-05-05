import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { toolMetricsService } from '../services/tool-metrics.service.js';
import { toolAuditService } from '../services/tool-audit.service.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/metrics', (_req: Request, res: Response) => {
  res.json({ success: true, metrics: toolMetricsService.getMetrics() });
});

router.get('/metrics/slowest', (req: Request, res: Response) => {
  const n = parseInt(req.query.n as string, 10) || 10;
  res.json({ success: true, slowest: toolMetricsService.getTopSlowest(n) });
});

router.get('/metrics/failures', (_req: Request, res: Response) => {
  res.json({ success: true, failures: toolMetricsService.getFailureRates() });
});

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const daysBack = parseInt(req.query.daysBack as string, 10) || 7;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId query parameter is required' });
      return;
    }

    const mutations = await toolAuditService.getRecentMutations(userId, { daysBack, limit });
    res.json({ success: true, count: mutations.length, mutations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit log' });
  }
});

export default router;
