/**
 * Integration Controller Unit Tests
 * Tests: getIntegrations, selectIntegrations, disconnectIntegration, getIntegrationStatus,
 *        getSyncDashboard, getGoldenSourceConfig, completeIntegrationsStep,
 *        storeWhoopCredentials, deleteWhoopCredentials, manageWhoopTokens,
 *        getWhoopTokens, deleteWhoopTokens, toggleWhoopTokens,
 *        registerWhoopWebhook, getWhoopStatus.
 */

import { jest } from '@jest/globals';
import { setupDbMock } from '../../helpers/mock-db.js';
import { setupLoggerMock, setupCacheMock } from '../../helpers/mock-services.js';

// ── Infrastructure mocks (BEFORE any service/controller imports) ──
const { mockQuery } = setupDbMock();
setupLoggerMock();
const mockCache = setupCacheMock();

// ── Service mocks ──
const mockWhoopService = {
  initiateWhoopOAuth: jest.fn<any>(),
  exchangeWhoopOAuthCode: jest.fn<any>(),
  generatePKCE: jest.fn<any>().mockReturnValue({
    codeVerifier: 'test-verifier',
    codeChallenge: 'test-challenge',
  }),
  fetchWhoopUserProfile: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/whoop.service.js', () => mockWhoopService);

const mockWhoopDataService = {
  fetchHistoricalData: jest.fn<any>(),
};

jest.unstable_mockModule('../../../src/services/whoop-data.service.js', () => ({
  whoopDataService: mockWhoopDataService,
}));

const mockSocketService = {
  emitToUser: jest.fn(),
};

jest.unstable_mockModule('../../../src/services/socket.service.js', () => ({
  socketService: mockSocketService,
}));

jest.unstable_mockModule('../../../src/config/env.config.js', () => ({
  env: {
    client: { url: 'http://localhost:3000' },
    api: { prefix: '/api/v1' },
  },
}));

// ── Dynamic imports AFTER mocks ──
const {
  getIntegrations,
  selectIntegrations,
  disconnectIntegration,
  getIntegrationStatus,
  getSyncDashboard,
  getGoldenSourceConfig,
  completeIntegrationsStep,
  storeWhoopCredentials,
  deleteWhoopCredentials,
  manageWhoopTokens,
  getWhoopTokens,
  deleteWhoopTokens,
  toggleWhoopTokens,
  registerWhoopWebhook,
  getWhoopStatus,
} = await import('../../../src/controllers/integration.controller.js');

const { createAuthReq, createRes, createNext, callHandler, getJsonBody } = await import(
  '../../helpers/controller-harness.js'
);

beforeEach(() => {
  jest.clearAllMocks();
  // Re-establish default cache mock behavior after clearAllMocks
  mockCache.get.mockReturnValue(null);
});

// ─────────────────────────────────────────────
// getIntegrations
// ─────────────────────────────────────────────
describe('getIntegrations', () => {
  it('returns 401 when user is not authenticated', async () => {
    const req = createAuthReq({ userId: undefined as any });
    const res = createRes();
    const next = createNext();

    await callHandler(getIntegrations, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns available integrations with connection status', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{ provider: 'whoop', status: 'active', last_sync_at: new Date() }],
    });

    await callHandler(getIntegrations, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.integrations).toBeDefined();
    expect(body.data.connectedCount).toBe(1);
    expect(body.data.hasMinimum).toBe(true);

    // WHOOP should be marked as connected
    const whoop = body.data.integrations.find((i: any) => i.provider === 'whoop');
    expect(whoop.isConnected).toBe(true);
  });
});

// ─────────────────────────────────────────────
// selectIntegrations
// ─────────────────────────────────────────────
describe('selectIntegrations', () => {
  it('returns selected integration metadata', async () => {
    const req = createAuthReq({}, {
      body: { integrations: ['whoop', 'fitbit'] },
    });
    const res = createRes();
    const next = createNext();

    await callHandler(selectIntegrations, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.selected).toHaveLength(2);
    expect(body.data.nextStep).toBe('connect');
  });
});

// ─────────────────────────────────────────────
// getIntegrationStatus
// ─────────────────────────────────────────────
describe('getIntegrationStatus', () => {
  it('returns not connected when no integration exists', async () => {
    const req = createAuthReq({}, { params: { provider: 'whoop' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(getIntegrationStatus, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.isConnected).toBe(false);
  });

  it('returns connected status with sync history', async () => {
    const req = createAuthReq({}, { params: { provider: 'whoop' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'int-1',
        provider: 'whoop',
        status: 'active',
        connected_at: new Date(),
        last_sync_at: new Date(),
        last_sync_status: 'success',
        initial_sync_complete: true,
        initial_sync_progress: null,
      }],
    });
    // Sync logs query
    mockQuery.mockResolvedValueOnce({
      rows: [{
        sync_type: 'manual',
        status: 'success',
        records_processed: 42,
        completed_at: new Date(),
      }],
    });

    await callHandler(getIntegrationStatus, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.isConnected).toBe(true);
    expect(body.data.recentSyncs).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────
// disconnectIntegration
// ─────────────────────────────────────────────
describe('disconnectIntegration', () => {
  it('returns error when integration not found', async () => {
    const req = createAuthReq({}, { params: { provider: 'whoop' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(disconnectIntegration, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('disconnects an existing integration', async () => {
    const req = createAuthReq({}, { params: { provider: 'whoop' } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'int-1', provider: 'whoop' }],
    });
    // Disconnect UPDATE query
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(disconnectIntegration, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.message).toContain('disconnected');
  });
});

// ─────────────────────────────────────────────
// getSyncDashboard
// ─────────────────────────────────────────────
describe('getSyncDashboard', () => {
  it('returns dashboard with integration statuses', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [
        { provider: 'whoop', status: 'active', last_sync_at: new Date(), is_enabled: true, last_sync_status: 'success', initial_sync_complete: true },
      ],
    });

    await callHandler(getSyncDashboard, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.integrations).toHaveLength(1);
    expect(body.data.integrations[0].statusIcon).toBe('✅');
  });
});

// ─────────────────────────────────────────────
// getGoldenSourceConfig
// ─────────────────────────────────────────────
describe('getGoldenSourceConfig', () => {
  it('returns golden source config filtered by connected providers', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{ provider: 'whoop' }],
    });

    await callHandler(getGoldenSourceConfig, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.config).toBeDefined();
    // heart_rate should only contain whoop since only whoop is connected
    expect(body.data.config.heart_rate).toEqual(['whoop']);
  });
});

// ─────────────────────────────────────────────
// completeIntegrationsStep
// ─────────────────────────────────────────────
describe('completeIntegrationsStep', () => {
  it('returns error when no integrations are connected', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ count: '0' }] });

    await callHandler(completeIntegrationsStep, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('completes step when at least one integration exists', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
    // Update onboarding status
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(completeIntegrationsStep, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.connectedCount).toBe(2);
    expect(body.data.nextStep).toBe('preferences');
  });
});

// ─────────────────────────────────────────────
// storeWhoopCredentials
// ─────────────────────────────────────────────
describe('storeWhoopCredentials', () => {
  it('returns error when clientId is empty', async () => {
    const req = createAuthReq({}, { body: { clientId: '', clientSecret: 'secret' } });
    const res = createRes();
    const next = createNext();

    await callHandler(storeWhoopCredentials, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('creates new integration with credentials when none exists', async () => {
    const req = createAuthReq({}, { body: { clientId: 'cid-1', clientSecret: 'csec-1' } });
    const res = createRes();
    const next = createNext();

    // Check existing
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // Insert new
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'int-1', status: 'pending' }] });

    await callHandler(storeWhoopCredentials, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('pending');
  });
});

// ─────────────────────────────────────────────
// deleteWhoopCredentials
// ─────────────────────────────────────────────
describe('deleteWhoopCredentials', () => {
  it('returns error when no credentials exist', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(deleteWhoopCredentials, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('disconnects WHOOP credentials successfully', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'int-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(deleteWhoopCredentials, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.disconnected).toBe(true);
  });
});

// ─────────────────────────────────────────────
// manageWhoopTokens
// ─────────────────────────────────────────────
describe('manageWhoopTokens', () => {
  it('returns error when accessToken is empty', async () => {
    const req = createAuthReq({}, { body: { accessToken: '' } });
    const res = createRes();
    const next = createNext();

    await callHandler(manageWhoopTokens, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('creates new integration when none exists', async () => {
    const req = createAuthReq({}, {
      body: { accessToken: 'tok-1', refreshToken: 'ref-1' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'int-1', status: 'active', connected_at: new Date() }],
    });

    await callHandler(manageWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('active');
  });

  it('updates existing integration tokens', async () => {
    const req = createAuthReq({}, {
      body: { accessToken: 'new-tok', refreshToken: 'new-ref' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'int-1' }] });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'int-1', status: 'active', connected_at: new Date() }],
    });

    await callHandler(manageWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.message).toContain('updated');
  });
});

// ─────────────────────────────────────────────
// getWhoopTokens
// ─────────────────────────────────────────────
describe('getWhoopTokens', () => {
  it('returns hasTokens=false when no integration exists', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(getWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.hasTokens).toBe(false);
  });

  it('returns masked tokens by default', async () => {
    const req = createAuthReq({}, { query: {} });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'int-1',
        access_token: 'abcdefghijklmnop',
        refresh_token: 'refreshtokenvalue',
        token_expiry: new Date(),
        status: 'active',
        connected_at: new Date(),
      }],
    });

    await callHandler(getWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.hasTokens).toBe(true);
    expect(body.data.accessTokenMasked).toMatch(/^abcd\.\.\.mnop$/);
  });
});

// ─────────────────────────────────────────────
// deleteWhoopTokens
// ─────────────────────────────────────────────
describe('deleteWhoopTokens', () => {
  it('returns error when no tokens exist', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(deleteWhoopTokens, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('deletes tokens successfully', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'int-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(deleteWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });
});

// ─────────────────────────────────────────────
// toggleWhoopTokens
// ─────────────────────────────────────────────
describe('toggleWhoopTokens', () => {
  it('returns error when no WHOOP integration exists', async () => {
    const req = createAuthReq({}, { body: { disabled: true } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(toggleWhoopTokens, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('pauses WHOOP integration when disabled=true', async () => {
    const req = createAuthReq({}, { body: { disabled: true } });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'int-1' }] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(toggleWhoopTokens, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('paused');
    expect(body.data.disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────
// registerWhoopWebhook
// ─────────────────────────────────────────────
describe('registerWhoopWebhook', () => {
  it('returns error when webhookUrl is missing', async () => {
    const req = createAuthReq({}, { body: {} });
    const res = createRes();
    const next = createNext();

    await callHandler(registerWhoopWebhook, req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('registers webhook URL successfully', async () => {
    const req = createAuthReq({}, {
      body: { webhookUrl: 'https://example.com/webhook', webhookSecret: 'sec' },
    });
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(registerWhoopWebhook, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.registered).toBe(true);
  });
});

// ─────────────────────────────────────────────
// getWhoopStatus
// ─────────────────────────────────────────────
describe('getWhoopStatus', () => {
  it('returns not connected when no integration exists', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    mockQuery.mockResolvedValueOnce({ rows: [] });

    await callHandler(getWhoopStatus, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.isConnected).toBe(false);
  });

  it('returns cached status when available', async () => {
    const req = createAuthReq();
    const res = createRes();
    const next = createNext();

    const cachedResponse = { isConnected: true, status: 'active', provider: 'whoop' };
    mockCache.get.mockReturnValueOnce(cachedResponse);

    await callHandler(getWhoopStatus, req, res, next);

    const body = getJsonBody(res);
    expect(body.success).toBe(true);
    expect(body.data.isConnected).toBe(true);
    // Should NOT have queried the database
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
