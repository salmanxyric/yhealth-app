import { Router } from 'express';
import { voiceCallController } from '../controllers/voice-call.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireFeature, consumeCredits } from '../middlewares/entitlement.middleware.js';
import { voiceCallLimiter, voiceCallSignalingLimiter } from '../middlewares/rateLimiter.middleware.js';
import { z } from 'zod';
import { env } from '../config/env.config.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

router.use((_req, _res, next) => {
  if (!env.featureFlags.voiceCalls) {
    throw ApiError.serviceUnavailable('Voice calling is currently disabled');
  }
  next();
});

// ============================================================================
// Validation Schemas
// ============================================================================

const initiateCallSchema = z.object({
  channel: z.enum(['mobile_app', 'whatsapp', 'widget']),
  pre_call_context: z.string().max(500).optional(),
  session_type: z.enum([
    'quick_checkin',
    'coaching_session',
    'emergency_support',
    'goal_review',
    'health_coach',
    'nutrition',
    'fitness',
    'wellness',
  ]).optional(),
  call_purpose: z.enum([
    'workout',
    'nutrition',
    'meal',
    'emotion',
    'emergency',
    'sleep',
    'stress',
    'goal_review',
    'general_health',
    'fitness',
    'wellness',
    'recovery',
  ]).optional(),
});

const endCallSchema = z.object({
  reason: z.string().max(200).optional(),
});

const webRTCOfferSchema = z.object({
  sdp: z.string().min(1),
  type: z.literal('offer'),
});

const iceCandidateSchema = z.object({
  candidate: z.string().min(1),
  sdpMLineIndex: z.number().nullable(),
  sdpMid: z.string().nullable(),
});

// ============================================================================
// Call Management Routes
// ============================================================================

/**
 * @route   POST /api/voice-calls/initiate
 * @desc    Initiate a new voice call
 * @access  Private
 */
router.post(
  '/initiate',
  authenticate,
  voiceCallLimiter,
  validate(initiateCallSchema),
  requireFeature('ai.voice.call'),
  consumeCredits('ai.voice.call'),
  voiceCallController.initiate
);

/**
 * @route   GET /api/voice-calls/:callId/status
 * @desc    Get call status
 * @access  Private
 */
router.get('/:callId/status', authenticate, voiceCallController.getStatus);

/**
 * @route   POST /api/voice-calls/:callId/end
 * @desc    End a call
 * @access  Private
 */
router.post('/:callId/end', authenticate, validate(endCallSchema), voiceCallController.endCall);

/**
 * @route   GET /api/voice-calls/history
 * @desc    Get call history
 * @access  Private
 */
router.get('/history', authenticate, voiceCallController.getHistory);

/**
 * @route   GET /api/voice-calls/:callId
 * @desc    Get call details
 * @access  Private
 */
router.get('/:callId', authenticate, voiceCallController.getCall);

/**
 * @route   POST /api/voice-calls/:callId/retry
 * @desc    Retry a failed call connection
 * @access  Private
 */
router.post('/:callId/retry', authenticate, voiceCallLimiter, voiceCallController.retry);

// ============================================================================
// WebRTC Signaling Routes
// ============================================================================

/**
 * @route   POST /api/voice-calls/:callId/offer
 * @desc    Handle WebRTC offer
 * @access  Private
 */
router.post('/:callId/offer', authenticate, voiceCallSignalingLimiter, validate(webRTCOfferSchema), voiceCallController.handleOffer);

/**
 * @route   POST /api/voice-calls/:callId/ice-candidate
 * @desc    Handle ICE candidate
 * @access  Private
 */
router.post('/:callId/ice-candidate', authenticate, voiceCallSignalingLimiter, validate(iceCandidateSchema), voiceCallController.handleIceCandidate);

/**
 * @route   GET /api/voice-calls/:callId/ice-servers
 * @desc    Get ICE servers configuration
 * @access  Private
 */
router.get('/:callId/ice-servers', authenticate, voiceCallSignalingLimiter, voiceCallController.getIceServers);

/**
 * @route   POST /api/voice-calls/:callId/active
 * @desc    Mark call as active (connection established)
 * @access  Private
 */
router.post('/:callId/active', authenticate, voiceCallSignalingLimiter, voiceCallController.markActive);

// ============================================================================
// Quality Metrics & Transcript Routes
// ============================================================================

const qualityMetricsSchema = z.object({
  timestamp: z.string(),
  audio: z.object({
    jitter: z.number().min(0).optional(),
    packetLoss: z.number().min(0).max(100).optional(),
    roundTripTime: z.number().min(0).optional(),
    bitrate: z.number().min(0).optional(),
    codec: z.string().optional(),
  }),
  connection: z.object({
    candidateType: z.string().optional(),
    networkType: z.string().optional(),
    localAddress: z.string().optional(),
    remoteAddress: z.string().optional(),
  }).optional(),
  mos: z.number().min(1).max(5).optional(),
});

const transcriptSegmentSchema = z.object({
  speaker: z.enum(['user', 'ai']),
  text: z.string().min(1).max(5000),
  timestamp: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  duration: z.number().min(0).optional(),
});

/**
 * @route   POST /api/voice-calls/:callId/quality-metrics
 * @desc    Report WebRTC quality metrics
 * @access  Private
 */
router.post(
  '/:callId/quality-metrics',
  authenticate,
  voiceCallSignalingLimiter,
  validate(qualityMetricsSchema),
  voiceCallController.reportQualityMetrics
);

/**
 * @route   GET /api/voice-calls/:callId/quality-metrics
 * @desc    Get call quality metrics
 * @access  Private
 */
router.get('/:callId/quality-metrics', authenticate, voiceCallController.getQualityMetrics);

/**
 * @route   POST /api/voice-calls/:callId/transcript
 * @desc    Store a transcript segment
 * @access  Private
 */
router.post(
  '/:callId/transcript',
  authenticate,
  voiceCallSignalingLimiter,
  validate(transcriptSegmentSchema),
  voiceCallController.storeTranscriptSegment
);

/**
 * @route   GET /api/voice-calls/:callId/transcript
 * @desc    Get call transcript
 * @access  Private
 */
router.get('/:callId/transcript', authenticate, voiceCallController.getTranscript);

// ============================================================================
// Session Management Routes
// ============================================================================

/**
 * @route   POST /api/voice-calls/:callId/upgrade
 * @desc    Upgrade session type
 * @access  Private
 */
router.post(
  '/:callId/upgrade',
  authenticate,
  validate(z.object({
    sessionType: z.enum([
      'quick_checkin',
      'coaching_session',
      'emergency_support',
      'goal_review',
      'health_coach',
      'nutrition',
      'fitness',
      'wellness',
    ]),
  })),
  voiceCallController.upgrade
);

/**
 * @route   POST /api/voice-calls/:callId/emergency
 * @desc    Trigger emergency protocol
 * @access  Private
 */
router.post('/:callId/emergency', authenticate, voiceCallController.triggerEmergency);

/**
 * @route   GET /api/voice-calls/:callId/emotions
 * @desc    Get call emotions
 * @access  Private
 */
router.get('/:callId/emotions', authenticate, voiceCallController.getEmotions);

export default router;

