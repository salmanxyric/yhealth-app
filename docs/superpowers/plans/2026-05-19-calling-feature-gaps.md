# Calling Feature Gap Closure Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all gaps identified in the calling feature audit: remove Twilio from voice calling, add feature flags, enforce concurrent call limits, add error boundary on client, and cover core services/controllers with unit tests.

**Architecture:** Pure WebSocket/WebRTC calling with no Twilio dependency for voice. Server services tested via ESM mocking (`jest.unstable_mockModule`) with existing helpers from `tests/helpers/`. Feature flag follows the existing `process.env.ENABLE_*` pattern.

**Tech Stack:** Node.js/Express, PostgreSQL, Jest (ESM), Next.js (React), WebRTC, Socket.IO

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `server/src/services/webrtc-signaling.service.ts` | Remove Twilio TURN refs, keep pure STUN |
| Modify | `server/src/services/voice-call.service.ts` | Remove Twilio TURN branch in `getWebRTCConfig` |
| Modify | `server/src/config/env.config.ts` | Add `ENABLE_VOICE_CALLS` flag, relabel Twilio comment |
| Modify | `server/.env.example` | Add `ENABLE_VOICE_CALLS`, relabel Twilio section |
| Modify | `server/src/routes/voice-calls.routes.ts` | Guard with feature flag middleware |
| Create | `client/app/components/voice/VoiceAssistantErrorBoundary.tsx` | Error boundary for voice assistant |
| Modify | `client/app/(pages)/voice-assistant/VoiceAssistantPageContent.tsx` | Wrap with error boundary |
| Create | `server/tests/unit/services/voice-call.service.test.ts` | Unit tests for voice-call service |
| Create | `server/tests/unit/services/call-summary.service.test.ts` | Unit tests for call-summary service |
| Create | `server/tests/unit/controllers/voice-call.controller.test.ts` | Controller tests |
| Create | `server/tests/unit/controllers/call-summary.controller.test.ts` | Controller tests |

---

### Task 1: Remove Twilio from WebRTC Signaling Service

**Files:**
- Modify: `server/src/services/webrtc-signaling.service.ts`

- [ ] **Step 1: Replace webrtc-signaling.service.ts with Twilio-free version**

Remove the `generateTwilioToken` method, remove Twilio env import, remove Twilio TURN branch from `getIceServers`:

```typescript
import { logger } from './logger.service.js';
import type { WebRTCOffer, WebRTCAnswer, RTCIceServer } from '../types/voice-call.types.js';

class WebRTCSignalingService {
  private readonly defaultIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ];

  getIceServers(): RTCIceServer[] {
    return this.defaultIceServers;
  }

  async processOffer(offer: WebRTCOffer, callId: string): Promise<WebRTCAnswer> {
    try {
      logger.info('[WebRTCSignaling] Processing offer', { callId, offerType: offer.type });

      const signalingUrl = process.env.VOICE_SIGNALING_URL;
      if (!signalingUrl) {
        throw new Error('VOICE_SIGNALING_URL is not configured');
      }

      const response = await fetch(`${signalingUrl.replace(/\/$/, '')}/calls/${callId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer }),
      });

      if (!response.ok) {
        throw new Error(`Signaling backend returned ${response.status}`);
      }

      const answer = await response.json() as Partial<WebRTCAnswer>;
      if (answer.type !== 'answer' || typeof answer.sdp !== 'string' || answer.sdp.trim().length === 0) {
        throw new Error('Signaling backend returned an invalid answer');
      }

      logger.info('[WebRTCSignaling] Offer processed, answer generated', { callId });
      return { type: 'answer', sdp: answer.sdp };
    } catch (error) {
      logger.error('[WebRTCSignaling] Error processing offer', { error, callId });
      throw error;
    }
  }

  getSignalingUrl(callId: string): string {
    return `/api/voice-calls/${callId}/signaling`;
  }
}

export const webrtcSignalingService = new WebRTCSignalingService();
```

- [ ] **Step 2: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS (no references to removed `generateTwilioToken` elsewhere)

- [ ] **Step 3: Commit**

```
git add server/src/services/webrtc-signaling.service.ts
git commit -m "refactor(voice): remove Twilio TURN from WebRTC signaling service"
```

---

### Task 2: Remove Twilio from Voice Call Service

**Files:**
- Modify: `server/src/services/voice-call.service.ts:1020-1046`

- [ ] **Step 1: Simplify getWebRTCConfig to remove Twilio branch**

Replace the `getWebRTCConfig` method (lines 1020-1046) — remove the `env` import usage for Twilio and the conditional branch:

Old code to replace:
```typescript
  private async getWebRTCConfig(callId: string): Promise<{
    signalingUrl: string;
    iceServers: RTCIceServer[];
  }> {
    // Default STUN servers (public)
    const defaultIceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];

    // If Twilio is configured, use Twilio TURN servers
    if (env.twilio.accountSid && env.twilio.authToken) {
      // In production, generate Twilio token for TURN servers
      // For now, use default STUN servers
      return {
        signalingUrl: `/api/voice-calls/${callId}/signaling`,
        iceServers: defaultIceServers,
      };
    }

    return {
      signalingUrl: `/api/voice-calls/${callId}/signaling`,
      iceServers: defaultIceServers,
    };
  }
```

New code:
```typescript
  private async getWebRTCConfig(callId: string): Promise<{
    signalingUrl: string;
    iceServers: RTCIceServer[];
  }> {
    return {
      signalingUrl: `/api/voice-calls/${callId}/signaling`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ],
    };
  }
```

- [ ] **Step 2: Remove unused `env` import if no other usage remains**

Check whether `env` is still used elsewhere in voice-call.service.ts. If not, remove:
```typescript
import { env } from '../config/env.config.js';
```

- [ ] **Step 3: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```
git add server/src/services/voice-call.service.ts
git commit -m "refactor(voice): remove Twilio TURN from voice-call service"
```

---

### Task 3: Update env.config.ts and .env.example

**Files:**
- Modify: `server/src/config/env.config.ts:204-212`
- Modify: `server/.env.example:110-116`

- [ ] **Step 1: Relabel Twilio comment in env.config.ts**

Change line 204 from:
```typescript
  // Twilio (Voice Calls & WhatsApp)
```
To:
```typescript
  // Twilio (SMS & WhatsApp — NOT used for voice calling)
```

- [ ] **Step 2: Add feature flag to env.config.ts**

After the existing config sections (after `assemblyai` block around line 228), add to the env object:

```typescript
  // Feature Flags
  featureFlags: {
    voiceCalls: process.env['ENABLE_VOICE_CALLS'] !== 'false',
    chatCalls: process.env['ENABLE_CHAT_CALLS'] !== 'false',
  },
```

- [ ] **Step 3: Update .env.example**

Change line 112 comment from:
```
# Twilio - Get from https://console.twilio.com
```
To:
```
# Twilio (SMS & WhatsApp only — NOT used for voice calling)
```

Add to the Feature Flags section (after line 191):
```
ENABLE_VOICE_CALLS=true
ENABLE_CHAT_CALLS=true
```

- [ ] **Step 4: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```
git add server/src/config/env.config.ts server/.env.example
git commit -m "feat(config): add ENABLE_VOICE_CALLS/ENABLE_CHAT_CALLS feature flags, relabel Twilio"
```

---

### Task 4: Guard Voice Call Routes with Feature Flag

**Files:**
- Modify: `server/src/routes/voice-calls.routes.ts`

- [ ] **Step 1: Add feature flag guard middleware at the top of the route file**

After the existing imports (line 6), add:

```typescript
import { env } from '../config/env.config.js';
import { ApiError } from '../utils/ApiError.js';
```

Before the routes (after line 8 `const router = Router();`), add the guard:

```typescript
router.use((_req, _res, next) => {
  if (!env.featureFlags.voiceCalls) {
    throw ApiError.serviceUnavailable('Voice calling is currently disabled');
  }
  next();
});
```

- [ ] **Step 2: Run typecheck**

Run: `npm.cmd --prefix server run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```
git add server/src/routes/voice-calls.routes.ts
git commit -m "feat(voice): guard voice call routes with ENABLE_VOICE_CALLS feature flag"
```

---

### Task 5: Add Error Boundary for VoiceAssistantTab

**Files:**
- Create: `client/app/components/voice/VoiceAssistantErrorBoundary.tsx`
- Modify: `client/app/(pages)/voice-assistant/VoiceAssistantPageContent.tsx`

- [ ] **Step 1: Create the error boundary component**

```tsx
'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VoiceAssistantErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VoiceAssistant] Unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Voice Assistant encountered an error
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            Something went wrong with the voice assistant. This won&apos;t affect
            the rest of the app. You can try reloading.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

- [ ] **Step 2: Wrap VoiceAssistantPageContent with the error boundary**

In `client/app/(pages)/voice-assistant/VoiceAssistantPageContent.tsx`, import and wrap:

```tsx
import { VoiceAssistantErrorBoundary } from '@/app/components/voice/VoiceAssistantErrorBoundary';
```

Wrap the `VoiceAssistantTab` render with:
```tsx
<VoiceAssistantErrorBoundary>
  <VoiceAssistantTab ... />
</VoiceAssistantErrorBoundary>
```

- [ ] **Step 3: Run client build to verify**

Run: `npm.cmd --prefix client run build`
Expected: PASS

- [ ] **Step 4: Commit**

```
git add client/app/components/voice/VoiceAssistantErrorBoundary.tsx client/app/(pages)/voice-assistant/VoiceAssistantPageContent.tsx
git commit -m "feat(client): add error boundary around VoiceAssistantTab"
```

---

### Task 6: Unit Tests for voice-call.service.ts

**Files:**
- Create: `server/tests/unit/services/voice-call.service.test.ts`

Tests cover: `initiateCall`, `getCallStatus`, `getCall`, `getCallHistory`, `endCall`, `markCallActive`, `retryConnection`, `markCallFailed`.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockVectorEmbedding = {
  createConversation: jest.fn<any>().mockResolvedValue('conv-123'),
  getConversation: jest.fn<any>().mockResolvedValue(null),
};

let voiceCallService: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockQuery.mockReset();
  mockVectorEmbedding.createConversation.mockReset().mockResolvedValue('conv-123');
  mockVectorEmbedding.getConversation.mockReset().mockResolvedValue(null);

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
    env: {
      featureFlags: { voiceCalls: true, chatCalls: true },
    },
  }));

  jest.unstable_mockModule('../../../src/services/vector-embedding.service.js', () => ({
    vectorEmbeddingService: mockVectorEmbedding,
  }));

  jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
    class ApiError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
      }
      static badRequest(msg: string) { return new ApiError(msg, 400); }
      static unauthorized(msg: string) { return new ApiError(msg, 401); }
      static notFound(msg: string) { return new ApiError(msg, 404); }
      static conflict(msg: string) { return new ApiError(msg, 409); }
      static tooManyRequests(msg: string) { return new ApiError(msg, 429); }
      static internal(msg: string) { return new ApiError(msg, 500); }
      static serviceUnavailable(msg: string) { return new ApiError(msg, 503); }
    }
    return { ApiError };
  });

  const mod = await import('../../../src/services/voice-call.service.js');
  voiceCallService = mod.voiceCallService;
});

// ─────────────────────────── helpers ───────────────────────────

function fakeCallRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'call-1',
    user_id: 'user-1',
    channel: 'mobile_app',
    status: 'initiating',
    session_id: null,
    conversation_id: null,
    session_type: 'quick_checkin',
    call_purpose: null,
    emergency_triggered: false,
    initiated_at: new Date(),
    connected_at: null,
    ended_at: null,
    connection_duration: null,
    call_duration: null,
    webrtc_session_id: null,
    signaling_url: null,
    ice_servers: null,
    error_code: null,
    error_message: null,
    retry_count: 0,
    pre_call_context: null,
    call_summary: null,
    initiator_source: null,
    checkin_outcome: null,
    checkin_followup_sent_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function mockQuerySequence(...responses: Array<{ rows: unknown[]; rowCount?: number }>) {
  for (const resp of responses) {
    mockQuery.mockResolvedValueOnce(resp);
  }
}

// ─────────────────────────── initiateCall ───────────────────────────

describe('VoiceCallService', () => {
  describe('initiateCall', () => {
    it('creates a call record and returns callId + webrtcConfig', async () => {
      const call = fakeCallRow();
      mockQuerySequence(
        { rows: [], rowCount: 0 },       // cleanup stale
        { rows: [] },                     // rate limit check (active/connecting)
        { rows: [] },                     // rapid duplicate check
        { rows: [{ exists: true }] },     // checkColumnExists session_type
        { rows: [{ exists: true }] },     // checkColumnExists call_purpose
        { rows: [call], rowCount: 1 },    // INSERT call
        { rows: [{ exists: false }] },    // checkColumnExists initiator_source
        { rows: [], rowCount: 1 },        // logCallEvent INSERT
        { rows: [], rowCount: 1 },        // UPDATE webrtc info
        { rows: [], rowCount: 1 },        // UPDATE conversation_id
      );

      const result = await voiceCallService.initiateCall('user-1', {
        channel: 'mobile_app',
        session_type: 'quick_checkin',
      });

      expect(result).toHaveProperty('callId', 'call-1');
      expect(result).toHaveProperty('webrtcConfig');
      expect(result.webrtcConfig.iceServers).toEqual(
        expect.arrayContaining([expect.objectContaining({ urls: expect.stringContaining('stun:') })])
      );
      expect(result.status).toBe('initiating');
    });

    it('throws 429 when an active call exists within 5 minutes', async () => {
      mockQuerySequence(
        { rows: [], rowCount: 0 },       // cleanup
        { rows: [fakeCallRow({ status: 'active', initiated_at: new Date() })] }, // active call
      );

      await expect(
        voiceCallService.initiateCall('user-1', { channel: 'mobile_app' })
      ).rejects.toMatchObject({ statusCode: 429 });
    });

    it('cancels stale active calls older than 5 minutes', async () => {
      const oldDate = new Date(Date.now() - 400_000); // 6.7 min ago
      mockQuerySequence(
        { rows: [], rowCount: 0 },                                // cleanup stale initiating
        { rows: [fakeCallRow({ status: 'active', initiated_at: oldDate })] }, // old active
        { rows: [], rowCount: 1 },                                // cancel stale
        { rows: [] },                                             // rapid duplicate check
        { rows: [{ exists: true }] },                             // schema session_type
        { rows: [{ exists: true }] },                             // schema call_purpose
        { rows: [fakeCallRow()], rowCount: 1 },                   // INSERT
        { rows: [{ exists: false }] },                            // initiator_source
        { rows: [], rowCount: 1 },                                // logCallEvent
        { rows: [], rowCount: 1 },                                // webrtc info
        { rows: [], rowCount: 1 },                                // conversation_id
      );

      const result = await voiceCallService.initiateCall('user-1', { channel: 'mobile_app' });
      expect(result).toHaveProperty('callId');
    });

    it('rejects invalid session_type', async () => {
      mockQuerySequence(
        { rows: [], rowCount: 0 },
        { rows: [] },
        { rows: [] },
      );

      await expect(
        voiceCallService.initiateCall('user-1', {
          channel: 'mobile_app',
          session_type: 'invalid_type',
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────── getCallStatus ───────────────────────────

  describe('getCallStatus', () => {
    it('returns status for a valid call', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [fakeCallRow({ status: 'active', call_duration: 120, connection_duration: 5 })],
      });

      const status = await voiceCallService.getCallStatus('call-1', 'user-1');
      expect(status.status).toBe('active');
      expect(status.callDuration).toBe(120);
      expect(status.connectionDuration).toBe(5);
    });

    it('includes error info when present', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [fakeCallRow({ status: 'failed', error_code: 'TIMEOUT', error_message: 'Connection timed out' })],
      });

      const status = await voiceCallService.getCallStatus('call-1', 'user-1');
      expect(status.error).toEqual({
        code: 'TIMEOUT',
        message: 'Connection timed out',
      });
    });

    it('throws 404 for non-existent call', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        voiceCallService.getCallStatus('missing', 'user-1')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────── getCall ───────────────────────────

  describe('getCall', () => {
    it('returns full call record', async () => {
      const call = fakeCallRow();
      mockQuery.mockResolvedValueOnce({ rows: [call] });

      const result = await voiceCallService.getCall('call-1', 'user-1');
      expect(result.id).toBe('call-1');
      expect(result.channel).toBe('mobile_app');
    });

    it('throws 404 when call does not belong to user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        voiceCallService.getCall('call-1', 'wrong-user')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────── getCallHistory ───────────────────────────

  describe('getCallHistory', () => {
    it('returns paginated results', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [fakeCallRow(), fakeCallRow({ id: 'call-2' })] });

      const result = await voiceCallService.getCallHistory('user-1', { page: 1, limit: 10 });
      expect(result.total).toBe(2);
      expect(result.calls).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it('applies channel and status filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [fakeCallRow()] });

      await voiceCallService.getCallHistory('user-1', {
        channel: 'mobile_app',
        status: 'ended',
      });

      const countQuery = mockQuery.mock.calls[0][0] as string;
      expect(countQuery).toContain('channel = $2');
      expect(countQuery).toContain('status = $3');
    });

    it('caps limit at 100', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await voiceCallService.getCallHistory('user-1', { limit: 500 });
      expect(result.limit).toBe(100);
    });
  });

  // ─────────────────────────── markCallActive ───────────────────────────

  describe('markCallActive', () => {
    it('updates status to active with connection duration', async () => {
      const initiated = new Date(Date.now() - 5000);
      mockQuery
        .mockResolvedValueOnce({ rows: [fakeCallRow({ initiated_at: initiated })] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await voiceCallService.markCallActive('call-1', 'user-1');

      const updateArgs = mockQuery.mock.calls[1];
      expect(updateArgs[1][0]).toBe('active');
    });

    it('throws 404 for unknown call', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        voiceCallService.markCallActive('missing', 'user-1')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────── endCall ───────────────────────────

  describe('endCall', () => {
    it('ends a call and returns summary', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [fakeCallRow({ status: 'active', connected_at: new Date(Date.now() - 60_000) })],
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ exists: false }] });

      const result = await voiceCallService.endCall('call-1', 'user-1', 'user_ended');
      expect(result.callId).toBe('call-1');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('returns existing summary if call already ended', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [fakeCallRow({ status: 'ended', call_summary: 'Done', call_duration: 30 })],
      });

      const result = await voiceCallService.endCall('call-1', 'user-1');
      expect(result.summary).toBe('Done');
      expect(result.duration).toBe(30);
    });

    it('throws 404 for unknown call', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        voiceCallService.endCall('missing', 'user-1')
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ─────────────────────────── retryConnection ───────────────────────────

  describe('retryConnection', () => {
    it('resets status to initiating and increments retry count', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [fakeCallRow({ status: 'failed', retry_count: 0 })],
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const result = await voiceCallService.retryConnection('call-1', 'user-1');
      expect(result).toBe(true);
    });

    it('rejects when max retries reached', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [fakeCallRow({ status: 'failed', retry_count: 3 })],
      });

      await expect(
        voiceCallService.retryConnection('call-1', 'user-1')
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects when call is not in retryable state', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [fakeCallRow({ status: 'active', retry_count: 0 })],
      });

      await expect(
        voiceCallService.retryConnection('call-1', 'user-1')
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ─────────────────────────── markCallFailed ───────────────────────────

  describe('markCallFailed', () => {
    it('updates call to failed with error details', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await voiceCallService.markCallFailed('call-1', 'WEBRTC_ERROR', 'ICE failed');

      const updateArgs = mockQuery.mock.calls[0];
      expect(updateArgs[1]).toContain('failed');
      expect(updateArgs[1]).toContain('WEBRTC_ERROR');
    });

    it('does not throw on DB error (non-critical)', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        voiceCallService.markCallFailed('call-1', 'ERR', 'msg')
      ).resolves.toBeUndefined();
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="voice-call.service"`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```
git add server/tests/unit/services/voice-call.service.test.ts
git commit -m "test(voice): add unit tests for voice-call.service"
```

---

### Task 7: Unit Tests for call-summary.service.ts

**Files:**
- Create: `server/tests/unit/services/call-summary.service.test.ts`

Tests cover: `generateSummary`, `getSummaryByCallId`, `getSummariesForUser`, `updateActionItemStatus`.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockQuery = jest.fn<any>();
const mockAiProvider = {
  generateCompletion: jest.fn<any>(),
};

let callSummaryService: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  mockQuery.mockReset();
  mockAiProvider.generateCompletion.mockReset();

  jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
    query: (...args: unknown[]) => mockQuery(...args),
  }));

  jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  }));

  jest.unstable_mockModule('../../../src/services/ai-provider.service.js', () => ({
    aiProviderService: mockAiProvider,
  }));

  const mod = await import('../../../src/services/call-summary.service.js');
  callSummaryService = mod.callSummaryService;
});

// ─────────────────────────── helpers ───────────────────────────

function fakeSummaryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sum-1',
    call_id: 'call-1',
    user_id: 'user-1',
    session_type: 'quick_checkin',
    depth_mode: 'light',
    summary: 'Good session',
    key_insights: JSON.stringify(['insight1', 'insight2']),
    emotional_trend: 'positive',
    duration: 120,
    generated_at: new Date(),
    delivery_status: JSON.stringify({ app: false, whatsapp: false, push: false }),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function fakeActionItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ai-1',
    summary_id: 'sum-1',
    content: 'Do 30 min exercise',
    category: 'fitness',
    priority: 'high',
    due_date: null,
    status: 'pending',
    completed_at: null,
    reminder_set: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// ─────────────────────────── generateSummary ───────────────────────────

describe('CallSummaryService', () => {
  describe('generateSummary', () => {
    it('generates summary with AI and saves to DB', async () => {
      // getConversationTranscript (from rag_conversations)
      mockQuery.mockResolvedValueOnce({
        rows: [{ messages: [{ role: 'user', content: 'Hello' }, { role: 'assistant', content: 'Hi' }] }],
      });
      // getEmotionTrend
      mockQuery.mockResolvedValueOnce({
        rows: [{ emotion_category: 'happy', count: '3' }],
      });

      // AI generates summary
      mockAiProvider.generateCompletion
        .mockResolvedValueOnce({
          content: '{"summary": "Great session", "keyInsights": ["insight1"]}',
        })
        .mockResolvedValueOnce({
          content: '[{"content": "Exercise daily", "category": "fitness", "priority": "high"}]',
        });

      // saveSummary INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sum-1' }] });
      // action_items INSERT
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'ai-1' }] });

      const result = await callSummaryService.generateSummary({
        callId: 'call-1',
        userId: 'user-1',
        sessionType: 'quick_checkin',
        conversationId: 'conv-1',
        duration: 120,
      });

      expect(result.id).toBe('sum-1');
      expect(result.summary).toBe('Great session');
      expect(result.keyInsights).toEqual(['insight1']);
      expect(result.actionItems).toHaveLength(1);
    });

    it('uses deep mode for coaching_session by default', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no transcript from rag
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no events
      mockQuery.mockResolvedValueOnce({ rows: [] }); // no emotions

      mockAiProvider.generateCompletion
        .mockResolvedValueOnce({
          content: '{"summary": "Deep summary", "keyInsights": ["a", "b"]}',
        })
        .mockResolvedValueOnce({
          content: '[]',
        });

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sum-2' }] });

      const result = await callSummaryService.generateSummary({
        callId: 'call-2',
        userId: 'user-1',
        sessionType: 'coaching_session',
        duration: 1500,
      });

      expect(result.depthMode).toBe('deep');
    });

    it('returns default summary when AI fails', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });
      mockQuery.mockResolvedValueOnce({ rows: [] });

      mockAiProvider.generateCompletion
        .mockRejectedValueOnce(new Error('AI down'))
        .mockResolvedValueOnce({ content: '[]' });

      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sum-3' }] });

      const result = await callSummaryService.generateSummary({
        callId: 'call-3',
        userId: 'user-1',
        sessionType: 'quick_checkin',
        duration: 60,
      });

      expect(result.summary).toContain('Quick Check-In');
      expect(result.keyInsights).toEqual(expect.arrayContaining(['Session completed']));
    });
  });

  // ─────────────────────────── getSummaryByCallId ───────────────────────────

  describe('getSummaryByCallId', () => {
    it('returns summary with action items', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [fakeSummaryRow()] })
        .mockResolvedValueOnce({ rows: [fakeActionItemRow()] });

      const result = await callSummaryService.getSummaryByCallId('call-1');
      expect(result).not.toBeNull();
      expect(result.callId).toBe('call-1');
      expect(result.actionItems).toHaveLength(1);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await callSummaryService.getSummaryByCallId('missing');
      expect(result).toBeNull();
    });
  });

  // ─────────────────────────── getSummariesForUser ───────────────────────────

  describe('getSummariesForUser', () => {
    it('returns paginated summaries', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [fakeSummaryRow()] })
        .mockResolvedValueOnce({ rows: [fakeActionItemRow()] });

      const result = await callSummaryService.getSummariesForUser('user-1', { page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.summaries).toHaveLength(1);
    });

    it('returns empty when no summaries exist', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '0' }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await callSummaryService.getSummariesForUser('user-1');
      expect(result.summaries).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─────────────────────────── updateActionItemStatus ───────────────────────────

  describe('updateActionItemStatus', () => {
    it('updates status and sets completedAt for completed items', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 'ai-1' }] })
        .mockResolvedValueOnce({ rows: [fakeActionItemRow({ status: 'completed', completed_at: new Date() })] });

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'user-1', 'completed');
      expect(result).not.toBeNull();
      expect(result.status).toBe('completed');
    });

    it('returns null when action item not owned by user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await callSummaryService.updateActionItemStatus('ai-1', 'wrong-user', 'completed');
      expect(result).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="call-summary.service"`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```
git add server/tests/unit/services/call-summary.service.test.ts
git commit -m "test(voice): add unit tests for call-summary.service"
```

---

### Task 8: Controller Tests for voice-call.controller.ts

**Files:**
- Create: `server/tests/unit/controllers/voice-call.controller.test.ts`

Uses controller harness: `createAuthReq`, `createRes`, `callHandler`, `createNext`.

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  setupControllerMocks,
  createAuthReq,
  createRes,
  createNext,
  callHandler,
  expectSuccess,
  expectNextCalledWithError,
} from '../../helpers/controller-harness.js';

const mockVoiceCallService = {
  initiateCall: jest.fn<any>(),
  getCallStatus: jest.fn<any>(),
  endCall: jest.fn<any>(),
  getCallHistory: jest.fn<any>(),
  getCall: jest.fn<any>(),
  establishConnection: jest.fn<any>(),
  handleIceCandidate: jest.fn<any>(),
  markCallActive: jest.fn<any>(),
  retryConnection: jest.fn<any>(),
};

const mockCrisisDetection = {
  triggerEmergencyProtocol: jest.fn<any>().mockResolvedValue(undefined),
  getCrisisResources: jest.fn<any>().mockResolvedValue([{ name: 'Hotline', number: '911' }]),
  scheduleFollowUpCheckIn: jest.fn<any>().mockResolvedValue(undefined),
};

const mockVoiceSession = {
  upgradeSession: jest.fn<any>().mockResolvedValue({ sessionType: 'coaching_session' }),
};

let voiceCallController: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  Object.values(mockVoiceCallService).forEach(fn => fn.mockReset());
  Object.values(mockCrisisDetection).forEach(fn => {
    fn.mockReset();
    if (fn === mockCrisisDetection.getCrisisResources) {
      fn.mockResolvedValue([{ name: 'Hotline', number: '911' }]);
    } else {
      fn.mockResolvedValue(undefined);
    }
  });
  mockVoiceSession.upgradeSession.mockReset().mockResolvedValue({ sessionType: 'coaching_session' });

  setupControllerMocks();

  jest.unstable_mockModule('../../../src/services/voice-call.service.js', () => ({
    voiceCallService: mockVoiceCallService,
  }));

  jest.unstable_mockModule('../../../src/services/crisis-detection.service.js', () => ({
    crisisDetectionService: mockCrisisDetection,
  }));

  jest.unstable_mockModule('../../../src/services/voice-session.service.js', () => ({
    voiceSessionService: mockVoiceSession,
  }));

  jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
    asyncHandler: (fn: Function) => fn,
  }));

  jest.unstable_mockModule('../../../src/utils/ApiResponse.js', () => ({
    ApiResponse: {
      success: jest.fn((res: any, data: any, message: string) => {
        res.status(200);
        res.json({ success: true, data, message });
      }),
      created: jest.fn((res: any, data: any, message: string) => {
        res.status(201);
        res.json({ success: true, data, message });
      }),
      paginated: jest.fn((res: any, data: any, pagination: any, message: string) => {
        res.status(200);
        res.json({ success: true, data, pagination, message });
      }),
    },
  }));

  jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
    class ApiError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
      }
      static unauthorized(msg: string) { return new ApiError(msg, 401); }
      static badRequest(msg: string) { return new ApiError(msg, 400); }
      static notFound(msg: string) { return new ApiError(msg, 404); }
    }
    return { ApiError };
  });

  const mod = await import('../../../src/controllers/voice-call.controller.js');
  voiceCallController = mod.voiceCallController;
});

describe('VoiceCallController', () => {
  describe('initiate', () => {
    it('initiates a call and returns 201', async () => {
      mockVoiceCallService.initiateCall.mockResolvedValue({
        callId: 'call-1',
        webrtcConfig: { iceServers: [] },
        status: 'initiating',
      });

      const req = createAuthReq({}, {
        body: { channel: 'mobile_app' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.initiate, req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockVoiceCallService.initiateCall).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ channel: 'mobile_app' })
      );
    });

    it('rejects invalid channel', async () => {
      const req = createAuthReq({}, {
        body: { channel: 'invalid' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(voiceCallController.initiate, req, res, next)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid session_type', async () => {
      const req = createAuthReq({}, {
        body: { channel: 'mobile_app', session_type: 'bogus' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(voiceCallController.initiate, req, res, next)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects unauthenticated requests', async () => {
      const req = createAuthReq({}, {});
      (req as any).user = undefined;
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(voiceCallController.initiate, req, res, next)
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe('getStatus', () => {
    it('returns call status', async () => {
      mockVoiceCallService.getCallStatus.mockResolvedValue({ status: 'active' });

      const req = createAuthReq({}, { params: { callId: 'call-1' } });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.getStatus, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('endCall', () => {
    it('ends a call and returns summary', async () => {
      mockVoiceCallService.endCall.mockResolvedValue({
        callId: 'call-1',
        summary: 'Done',
        duration: 60,
      });

      const req = createAuthReq({}, {
        params: { callId: 'call-1' },
        body: { reason: 'user_ended' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.endCall, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockVoiceCallService.endCall).toHaveBeenCalledWith('call-1', 'test-user-id', 'user_ended');
    });
  });

  describe('getHistory', () => {
    it('returns paginated call history', async () => {
      mockVoiceCallService.getCallHistory.mockResolvedValue({
        calls: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = createAuthReq({}, { query: { page: '1', limit: '20' } });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.getHistory, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('caps limit at 100', async () => {
      mockVoiceCallService.getCallHistory.mockResolvedValue({
        calls: [], total: 0, page: 1, limit: 100, totalPages: 0,
      });

      const req = createAuthReq({}, { query: { limit: '999' } });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.getHistory, req, res, next);

      expect(mockVoiceCallService.getCallHistory).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  describe('handleOffer', () => {
    it('processes valid WebRTC offer', async () => {
      mockVoiceCallService.establishConnection.mockResolvedValue({
        type: 'answer',
        sdp: 'v=0...',
      });

      const req = createAuthReq({}, {
        params: { callId: 'call-1' },
        body: { sdp: 'v=0...', type: 'offer' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.handleOffer, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects invalid offer (missing sdp)', async () => {
      const req = createAuthReq({}, {
        params: { callId: 'call-1' },
        body: { type: 'offer' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(voiceCallController.handleOffer, req, res, next)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('triggerEmergency', () => {
    it('activates emergency protocol and returns resources', async () => {
      const req = createAuthReq({}, { params: { callId: 'call-1' } });
      const res = createRes();
      const next = createNext();

      await callHandler(voiceCallController.triggerEmergency, req, res, next);

      expect(mockCrisisDetection.triggerEmergencyProtocol).toHaveBeenCalledWith('call-1', 'test-user-id');
      expect(mockCrisisDetection.scheduleFollowUpCheckIn).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="voice-call.controller"`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```
git add server/tests/unit/controllers/voice-call.controller.test.ts
git commit -m "test(voice): add controller tests for voice-call.controller"
```

---

### Task 9: Controller Tests for call-summary.controller.ts

**Files:**
- Create: `server/tests/unit/controllers/call-summary.controller.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  setupControllerMocks,
  createAuthReq,
  createRes,
  createNext,
  callHandler,
} from '../../helpers/controller-harness.js';

const mockCallSummaryService = {
  getSummariesForUser: jest.fn<any>(),
  getSummaryByCallId: jest.fn<any>(),
  generateSummary: jest.fn<any>(),
  updateActionItemStatus: jest.fn<any>(),
};

let callSummaryController: any;

beforeEach(async () => {
  jest.restoreAllMocks();
  Object.values(mockCallSummaryService).forEach(fn => fn.mockReset());

  setupControllerMocks();

  jest.unstable_mockModule('../../../src/services/call-summary.service.js', () => ({
    callSummaryService: mockCallSummaryService,
  }));

  jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
    asyncHandler: (fn: Function) => fn,
  }));

  jest.unstable_mockModule('../../../src/utils/ApiResponse.js', () => ({
    ApiResponse: {
      success: jest.fn((res: any, data: any, message: string, statusCode?: number) => {
        res.status(statusCode || 200);
        res.json({ success: true, data, message });
      }),
    },
  }));

  jest.unstable_mockModule('../../../src/utils/ApiError.js', () => {
    class ApiError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
      }
      static unauthorized(msg: string) { return new ApiError(msg, 401); }
      static badRequest(msg: string) { return new ApiError(msg, 400); }
      static notFound(msg: string) { return new ApiError(msg, 404); }
      static forbidden(msg: string) { return new ApiError(msg, 403); }
    }
    return { ApiError };
  });

  const mod = await import('../../../src/controllers/call-summary.controller.js');
  callSummaryController = mod.callSummaryController;
});

function fakeSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sum-1',
    callId: 'call-1',
    userId: 'test-user-id',
    sessionType: 'quick_checkin',
    depthMode: 'light',
    summary: 'Good session',
    keyInsights: ['insight1'],
    actionItems: [
      { id: 'ai-1', summaryId: 'sum-1', content: 'Exercise', category: 'fitness', priority: 'high', status: 'pending' },
    ],
    duration: 120,
    generatedAt: new Date(),
    deliveryStatus: { app: false, whatsapp: false, push: false },
    ...overrides,
  };
}

describe('CallSummaryController', () => {
  describe('getSummaries', () => {
    it('returns paginated summaries', async () => {
      mockCallSummaryService.getSummariesForUser.mockResolvedValue({
        summaries: [fakeSummary()],
        total: 1,
      });

      const req = createAuthReq({}, { query: { page: '1', limit: '20' } });
      const res = createRes();
      const next = createNext();

      await callHandler(callSummaryController.getSummaries, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCallSummaryService.getSummariesForUser).toHaveBeenCalledWith(
        'test-user-id',
        { page: 1, limit: 20 }
      );
    });
  });

  describe('getSummaryByCallId', () => {
    it('returns summary for owned call', async () => {
      mockCallSummaryService.getSummaryByCallId.mockResolvedValue(fakeSummary());

      const req = createAuthReq({}, { params: { callId: 'call-1' } });
      const res = createRes();
      const next = createNext();

      await callHandler(callSummaryController.getSummaryByCallId, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('throws 404 when not found', async () => {
      mockCallSummaryService.getSummaryByCallId.mockResolvedValue(null);

      const req = createAuthReq({}, { params: { callId: 'missing' } });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(callSummaryController.getSummaryByCallId, req, res, next)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 when user does not own the summary', async () => {
      mockCallSummaryService.getSummaryByCallId.mockResolvedValue(
        fakeSummary({ userId: 'other-user' })
      );

      const req = createAuthReq({}, { params: { callId: 'call-1' } });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(callSummaryController.getSummaryByCallId, req, res, next)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe('generateSummary', () => {
    it('generates and returns a summary with 201', async () => {
      mockCallSummaryService.generateSummary.mockResolvedValue(fakeSummary());

      const req = createAuthReq({}, {
        body: {
          callId: 'call-1',
          sessionType: 'quick_checkin',
          duration: 120,
        },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(callSummaryController.generateSummary, req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects when required fields missing', async () => {
      const req = createAuthReq({}, {
        body: { callId: 'call-1' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(callSummaryController.generateSummary, req, res, next)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('updateActionItem', () => {
    it('updates action item status', async () => {
      mockCallSummaryService.updateActionItemStatus.mockResolvedValue({
        id: 'ai-1',
        status: 'completed',
      });

      const req = createAuthReq({}, {
        params: { actionItemId: 'ai-1' },
        body: { status: 'completed' },
      });
      const res = createRes();
      const next = createNext();

      await callHandler(callSummaryController.updateActionItem, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects invalid status', async () => {
      const req = createAuthReq({}, {
        params: { actionItemId: 'ai-1' },
        body: { status: 'invalid' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(callSummaryController.updateActionItem, req, res, next)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 404 when action item not found', async () => {
      mockCallSummaryService.updateActionItemStatus.mockResolvedValue(null);

      const req = createAuthReq({}, {
        params: { actionItemId: 'missing' },
        body: { status: 'completed' },
      });
      const res = createRes();
      const next = createNext();

      await expect(
        callHandler(callSummaryController.updateActionItem, req, res, next)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getPendingActionItems', () => {
    it('returns pending items sorted by priority then due date', async () => {
      mockCallSummaryService.getSummariesForUser.mockResolvedValue({
        summaries: [
          fakeSummary({
            actionItems: [
              { id: 'ai-1', status: 'pending', priority: 'low', dueDate: new Date('2026-06-01') },
              { id: 'ai-2', status: 'pending', priority: 'high', dueDate: new Date('2026-06-02') },
              { id: 'ai-3', status: 'completed', priority: 'high' },
            ],
          }),
        ],
      });

      const req = createAuthReq({});
      const res = createRes();
      const next = createNext();

      await callHandler(callSummaryController.getPendingActionItems, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      const body = (res.json as jest.Mock<any>).mock.calls[0][0];
      expect(body.data.actionItems).toHaveLength(2);
      expect(body.data.actionItems[0].priority).toBe('high');
    });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm.cmd --prefix server run test:unit -- --testPathPatterns="call-summary.controller"`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```
git add server/tests/unit/controllers/call-summary.controller.test.ts
git commit -m "test(voice): add controller tests for call-summary.controller"
```

---

## Post-Plan Verification

After all tasks complete, run the full suite:

```
npm.cmd --prefix server run typecheck
npm.cmd --prefix server run lint
npm.cmd --prefix server run test:unit
npm.cmd --prefix client run build
```

All must pass.
