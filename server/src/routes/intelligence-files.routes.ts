/**
 * @file Intelligence Files Routes
 * @description API routes for the AI Memory & Intelligence System
 * Mounted at /api/v1/intelligence/files
 */

import { Router } from 'express';
import { intelligenceFilesController } from '../controllers/intelligence-files.controller.js';

const router = Router();

// Folders
router.get('/folders', intelligenceFilesController.getFolders);

// Memories
router.get('/memories', intelligenceFilesController.listMemories);
router.get('/memories/search', intelligenceFilesController.searchMemories);
router.get('/memories/:id', intelligenceFilesController.getMemory);
router.post('/memories', intelligenceFilesController.createMemory);
router.patch('/memories/:id', intelligenceFilesController.updateMemory);
router.post('/memories/:id/verify', intelligenceFilesController.verifyMemory);
router.post('/memories/:id/reject', intelligenceFilesController.rejectMemory);
router.post('/memories/:id/expire', intelligenceFilesController.expireMemory);

// Core Profile
router.get('/core', intelligenceFilesController.getCoreProfile);
router.get('/core/:section', intelligenceFilesController.getCoreProfileSection);
router.patch('/core/:section/:key', intelligenceFilesController.updateCoreValue);

// Artifacts
router.get('/artifacts', intelligenceFilesController.listArtifacts);
router.get('/artifacts/:id', intelligenceFilesController.getArtifact);
router.patch('/artifacts/:id', intelligenceFilesController.updateArtifact);

// Plans
router.get('/plans', intelligenceFilesController.listPlans);
router.get('/plans/:id', intelligenceFilesController.getPlan);

// Logs
router.get('/logs', intelligenceFilesController.listLogs);

// Transparency
router.get('/transparency/:messageId', intelligenceFilesController.getMessageTransparency);
router.post('/transparency/:messageId/feedback', intelligenceFilesController.submitTransparencyFeedback);

// Feedback
router.post('/feedback', intelligenceFilesController.submitFeedback);

export default router;
