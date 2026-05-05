/**
 * Integration Validator Unit Tests
 */

import {
  selectIntegrationsSchema,
  initiateOAuthSchema,
  completeOAuthSchema,
  connectApiKeySchema,
  triggerSyncSchema,
  updateIntegrationSchema,
  disconnectIntegrationSchema,
  setGoldenSourceSchema,
  storeWhoopCredentialsSchema,
  manageWhoopTokensSchema,
} from '../../../src/validators/integration.validator.js';

describe('Integration Validators', () => {
  const validProviders = [
    'whoop', 'apple_health', 'fitbit', 'garmin', 'oura',
    'samsung_health', 'myfitnesspal', 'nutritionix', 'cronometer',
    'strava', 'spotify',
  ];

  describe('selectIntegrationsSchema', () => {
    it('should accept valid integrations array', () => {
      const result = selectIntegrationsSchema.safeParse({
        integrations: ['whoop', 'fitbit'],
      });
      expect(result.success).toBe(true);
    });

    it('should accept all valid providers', () => {
      const result = selectIntegrationsSchema.safeParse({
        integrations: validProviders,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty integrations array', () => {
      const result = selectIntegrationsSchema.safeParse({ integrations: [] });
      expect(result.success).toBe(false);
    });

    it('should reject invalid provider', () => {
      const result = selectIntegrationsSchema.safeParse({
        integrations: ['google_fit'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing integrations field', () => {
      const result = selectIntegrationsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('initiateOAuthSchema', () => {
    it('should accept valid provider', () => {
      const result = initiateOAuthSchema.safeParse({ provider: 'whoop' });
      expect(result.success).toBe(true);
    });

    it('should accept optional redirectUri', () => {
      const result = initiateOAuthSchema.safeParse({
        provider: 'fitbit',
        redirectUri: 'https://example.com/callback',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid redirectUri', () => {
      const result = initiateOAuthSchema.safeParse({
        provider: 'fitbit',
        redirectUri: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid provider', () => {
      const result = initiateOAuthSchema.safeParse({ provider: 'unknown' });
      expect(result.success).toBe(false);
    });
  });

  describe('completeOAuthSchema', () => {
    it('should accept valid OAuth completion data', () => {
      const result = completeOAuthSchema.safeParse({
        provider: 'whoop',
        code: 'auth_code_123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const result = completeOAuthSchema.safeParse({
        provider: 'whoop',
        code: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional state parameter', () => {
      const result = completeOAuthSchema.safeParse({
        provider: 'fitbit',
        code: 'abc',
        state: 'csrf_token',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('connectApiKeySchema', () => {
    it('should accept valid Nutritionix API key data', () => {
      const result = connectApiKeySchema.safeParse({
        provider: 'nutritionix',
        apiKey: 'my-api-key',
        appId: 'my-app-id',
      });
      expect(result.success).toBe(true);
    });

    it('should reject provider other than nutritionix', () => {
      const result = connectApiKeySchema.safeParse({
        provider: 'fitbit',
        apiKey: 'key',
        appId: 'id',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty apiKey', () => {
      const result = connectApiKeySchema.safeParse({
        provider: 'nutritionix',
        apiKey: '',
        appId: 'id',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty appId', () => {
      const result = connectApiKeySchema.safeParse({
        provider: 'nutritionix',
        apiKey: 'key',
        appId: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('triggerSyncSchema', () => {
    it('should accept empty object with defaults', () => {
      const result = triggerSyncSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.syncType).toBe('manual');
      }
    });

    it('should accept valid sync types', () => {
      for (const syncType of ['initial', 'incremental', 'manual']) {
        const result = triggerSyncSchema.safeParse({ syncType });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid sync type', () => {
      const result = triggerSyncSchema.safeParse({ syncType: 'full' });
      expect(result.success).toBe(false);
    });

    it('should accept optional dateRange', () => {
      const result = triggerSyncSchema.safeParse({
        provider: 'whoop',
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-03-31',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateIntegrationSchema', () => {
    it('should accept isEnabled toggle', () => {
      const result = updateIntegrationSchema.safeParse({ isEnabled: false });
      expect(result.success).toBe(true);
    });

    it('should accept isPrimaryForDataTypes array', () => {
      const result = updateIntegrationSchema.safeParse({
        isPrimaryForDataTypes: ['heart_rate', 'sleep'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid data type', () => {
      const result = updateIntegrationSchema.safeParse({
        isPrimaryForDataTypes: ['invalid_type'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid data types', () => {
      const types = [
        'heart_rate', 'hrv', 'sleep', 'steps', 'workouts', 'calories',
        'nutrition', 'strain', 'recovery', 'body_temp', 'vo2_max',
        'training_load', 'gps_activities',
      ];
      const result = updateIntegrationSchema.safeParse({ isPrimaryForDataTypes: types });
      expect(result.success).toBe(true);
    });
  });

  describe('disconnectIntegrationSchema', () => {
    it('should accept valid disconnect data', () => {
      const result = disconnectIntegrationSchema.safeParse({ provider: 'whoop' });
      expect(result.success).toBe(true);
    });

    it('should default deleteData to false', () => {
      const result = disconnectIntegrationSchema.safeParse({ provider: 'whoop' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleteData).toBe(false);
      }
    });

    it('should accept deleteData flag', () => {
      const result = disconnectIntegrationSchema.safeParse({
        provider: 'fitbit',
        deleteData: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleteData).toBe(true);
      }
    });
  });

  describe('setGoldenSourceSchema', () => {
    it('should accept valid golden source data', () => {
      const result = setGoldenSourceSchema.safeParse({
        dataType: 'heart_rate',
        providerOrder: ['whoop', 'fitbit'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty providerOrder', () => {
      const result = setGoldenSourceSchema.safeParse({
        dataType: 'sleep',
        providerOrder: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid dataType', () => {
      const result = setGoldenSourceSchema.safeParse({
        dataType: 'blood_pressure',
        providerOrder: ['whoop'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('storeWhoopCredentialsSchema', () => {
    it('should accept valid credentials', () => {
      const result = storeWhoopCredentialsSchema.safeParse({
        clientId: 'whoop-client-id',
        clientSecret: 'whoop-client-secret',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty clientId', () => {
      const result = storeWhoopCredentialsSchema.safeParse({
        clientId: '',
        clientSecret: 'secret',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty clientSecret', () => {
      const result = storeWhoopCredentialsSchema.safeParse({
        clientId: 'id',
        clientSecret: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('manageWhoopTokensSchema', () => {
    it('should accept valid token data', () => {
      const result = manageWhoopTokensSchema.safeParse({
        accessToken: 'access-token-123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty accessToken', () => {
      const result = manageWhoopTokensSchema.safeParse({ accessToken: '' });
      expect(result.success).toBe(false);
    });

    it('should accept optional refreshToken', () => {
      const result = manageWhoopTokensSchema.safeParse({
        accessToken: 'token',
        refreshToken: 'refresh-token',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid ISO datetime for tokenExpiry', () => {
      const result = manageWhoopTokensSchema.safeParse({
        accessToken: 'token',
        tokenExpiry: '2025-12-31T23:59:59Z',
      });
      expect(result.success).toBe(true);
    });

    it('should accept datetime-local format for tokenExpiry', () => {
      const result = manageWhoopTokensSchema.safeParse({
        accessToken: 'token',
        tokenExpiry: '2025-12-31T23:59',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid tokenExpiry format', () => {
      const result = manageWhoopTokensSchema.safeParse({
        accessToken: 'token',
        tokenExpiry: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});
