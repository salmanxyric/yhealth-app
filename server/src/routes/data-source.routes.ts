/**
 * @file Data Source Routes
 * @description API endpoints for the Universal Data Source Correlation system
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as ds from '../controllers/data-source.controller.js';

const router = Router();

router.use(authenticate);

// Connections
router.get('/', ds.getConnections);
router.post('/', ds.connectSource);
router.delete('/:sourceType', ds.disconnectSource);

// Signals & Correlation
router.get('/signals', ds.getSignals);
router.get('/correlation', ds.getDailyCorrelation);
router.get('/correlation/history', ds.getCorrelationHistory);
router.get('/overview', ds.getOverview);

// Prayer Schedule
router.get('/prayers', ds.getPrayerSchedule);
router.post('/prayers/sync', ds.syncPrayerSchedule);
router.patch('/prayers/manual', ds.saveManualPrayerTimes);
router.post('/prayers/:id/complete', ds.markPrayerComplete);

// Spending
router.post('/spending', ds.addTransaction);
router.get('/spending', ds.getTransactions);
router.post('/spending/import', ds.importCSV);
router.get('/spending/categories', ds.getCategoryBreakdown);

export default router;
