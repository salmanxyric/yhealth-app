/**
 * Preferences Validator Unit Tests
 */

import {
  notificationPreferencesSchema,
  coachingPreferencesSchema,
  displayPreferencesSchema,
  privacyPreferencesSchema,
  integrationPreferencesSchema,
  voiceAssistantPreferencesSchema,
  updatePreferencesSchema,
} from '../../../src/validators/preferences.validator.js';

describe('Preferences Validators', () => {
  describe('notificationPreferencesSchema', () => {
    it('should accept empty object (all optional)', () => {
      const result = notificationPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept channel preferences', () => {
      const result = notificationPreferencesSchema.safeParse({
        channels: { push: true, email: false, whatsapp: true, sms: false },
      });
      expect(result.success).toBe(true);
    });

    it('should accept quiet hours config', () => {
      const result = notificationPreferencesSchema.safeParse({
        quietHours: { enabled: true, start: '22:00', end: '07:00', timezone: 'UTC' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid quiet hours time format', () => {
      const result = notificationPreferencesSchema.safeParse({
        quietHours: { start: '25:00' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid quiet hours time format (single digit)', () => {
      const result = notificationPreferencesSchema.safeParse({
        quietHours: { start: '9:00' },
      });
      expect(result.success).toBe(false);
    });

    it('should accept frequency limits', () => {
      const result = notificationPreferencesSchema.safeParse({
        frequency: { maxPerDay: 5, maxPerWeek: 30 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject maxPerDay below 1', () => {
      const result = notificationPreferencesSchema.safeParse({
        frequency: { maxPerDay: 0 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject maxPerDay above 50', () => {
      const result = notificationPreferencesSchema.safeParse({
        frequency: { maxPerDay: 51 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject maxPerWeek above 200', () => {
      const result = notificationPreferencesSchema.safeParse({
        frequency: { maxPerWeek: 201 },
      });
      expect(result.success).toBe(false);
    });

    it('should accept notification types record', () => {
      const result = notificationPreferencesSchema.safeParse({
        types: { weeklyReport: true, aiSuggestions: false },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('coachingPreferencesSchema', () => {
    it('should accept empty object (all optional)', () => {
      const result = coachingPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid aiCoachPersona values', () => {
      for (const persona of ['drill_sergeant', 'gentle_friend', 'data_driven_neutral']) {
        const result = coachingPreferencesSchema.safeParse({ aiCoachPersona: persona });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid aiCoachPersona', () => {
      const result = coachingPreferencesSchema.safeParse({ aiCoachPersona: 'robot' });
      expect(result.success).toBe(false);
    });

    it('should accept valid coaching styles', () => {
      for (const style of ['supportive', 'direct', 'analytical', 'motivational']) {
        const result = coachingPreferencesSchema.safeParse({ style });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid intensity values', () => {
      for (const intensity of ['light', 'moderate', 'intensive']) {
        const result = coachingPreferencesSchema.safeParse({ intensity });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid checkInFrequency values', () => {
      for (const freq of ['daily', 'twice_daily', 'every_other_day', 'weekly']) {
        const result = coachingPreferencesSchema.safeParse({ checkInFrequency: freq });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid preferredCheckInTime', () => {
      const result = coachingPreferencesSchema.safeParse({ preferredCheckInTime: '08:30' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid preferredCheckInTime', () => {
      const result = coachingPreferencesSchema.safeParse({ preferredCheckInTime: '8:30' });
      expect(result.success).toBe(false);
    });

    it('should accept aiPersonality settings', () => {
      const result = coachingPreferencesSchema.safeParse({
        aiPersonality: {
          useEmojis: true,
          formalityLevel: 'casual',
          encouragementLevel: 'high',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid formalityLevel', () => {
      const result = coachingPreferencesSchema.safeParse({
        aiPersonality: { formalityLevel: 'very_casual' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 5 focusAreas', () => {
      const result = coachingPreferencesSchema.safeParse({
        focusAreas: ['a', 'b', 'c', 'd', 'e', 'f'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid preferredChannel values', () => {
      for (const channel of ['push', 'email', 'whatsapp', 'sms', 'both']) {
        const result = coachingPreferencesSchema.safeParse({ preferredChannel: channel });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('displayPreferencesSchema', () => {
    it('should apply defaults', () => {
      const result = displayPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateFormat).toBe('YYYY-MM-DD');
        expect(result.data.timeFormat).toBe('24h');
        expect(result.data.language).toBe('en');
        expect(result.data.theme).toBe('system');
      }
    });

    it('should accept valid weight units', () => {
      for (const weight of ['kg', 'lbs']) {
        const result = displayPreferencesSchema.safeParse({ units: { weight } });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid height units', () => {
      for (const height of ['cm', 'ft_in']) {
        const result = displayPreferencesSchema.safeParse({ units: { height } });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid date formats', () => {
      for (const dateFormat of ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']) {
        const result = displayPreferencesSchema.safeParse({ dateFormat });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid date format', () => {
      const result = displayPreferencesSchema.safeParse({ dateFormat: 'YYYY/MM/DD' });
      expect(result.success).toBe(false);
    });

    it('should accept valid theme values', () => {
      for (const theme of ['light', 'dark', 'system']) {
        const result = displayPreferencesSchema.safeParse({ theme });
        expect(result.success).toBe(true);
      }
    });

    it('should accept valid temperature units', () => {
      for (const temperature of ['celsius', 'fahrenheit']) {
        const result = displayPreferencesSchema.safeParse({ units: { temperature } });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('privacyPreferencesSchema', () => {
    it('should apply defaults', () => {
      const result = privacyPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shareProgressWithCoach).toBe(true);
        expect(result.data.allowAnonymousDataForResearch).toBe(false);
        expect(result.data.showInLeaderboards).toBe(false);
        expect(result.data.profileVisibility).toBe('private');
        expect(result.data.healthProfileVisibility).toBe('friends');
        expect(result.data.healthProfileAllowedUsers).toEqual([]);
      }
    });

    it('should accept valid profileVisibility values', () => {
      for (const vis of ['private', 'friends', 'public']) {
        const result = privacyPreferencesSchema.safeParse({ profileVisibility: vis });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid profileVisibility', () => {
      const result = privacyPreferencesSchema.safeParse({ profileVisibility: 'hidden' });
      expect(result.success).toBe(false);
    });

    it('should accept valid healthProfileVisibility values', () => {
      for (const vis of ['disabled', 'friends', 'all', 'custom']) {
        const result = privacyPreferencesSchema.safeParse({ healthProfileVisibility: vis });
        expect(result.success).toBe(true);
      }
    });

    it('should accept healthProfileAllowedUsers with UUIDs', () => {
      const result = privacyPreferencesSchema.safeParse({
        healthProfileAllowedUsers: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-UUID in healthProfileAllowedUsers', () => {
      const result = privacyPreferencesSchema.safeParse({
        healthProfileAllowedUsers: ['not-a-uuid'],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('integrationPreferencesSchema', () => {
    it('should apply defaults', () => {
      const result = integrationPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoSyncEnabled).toBe(true);
        expect(result.data.syncOnWifiOnly).toBe(false);
        expect(result.data.backgroundSyncEnabled).toBe(true);
        expect(result.data.dataRetentionDays).toBe(365);
      }
    });

    it('should reject dataRetentionDays below 30', () => {
      const result = integrationPreferencesSchema.safeParse({ dataRetentionDays: 10 });
      expect(result.success).toBe(false);
    });

    it('should reject dataRetentionDays above 3650', () => {
      const result = integrationPreferencesSchema.safeParse({ dataRetentionDays: 4000 });
      expect(result.success).toBe(false);
    });

    it('should accept boundary values for dataRetentionDays', () => {
      for (const days of [30, 3650]) {
        const result = integrationPreferencesSchema.safeParse({ dataRetentionDays: days });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('voiceAssistantPreferencesSchema', () => {
    it('should accept empty object', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid avatar URL', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null avatarUrl', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({ avatarUrl: null });
      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar URL', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({ avatarUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should accept assistantName', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({ assistantName: 'Balancia' });
      expect(result.success).toBe(true);
    });

    it('should reject empty assistantName', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({ assistantName: '' });
      expect(result.success).toBe(false);
    });

    it('should reject assistantName over 100 characters', () => {
      const result = voiceAssistantPreferencesSchema.safeParse({ assistantName: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('updatePreferencesSchema', () => {
    it('should accept empty object', () => {
      const result = updatePreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all sections together', () => {
      const result = updatePreferencesSchema.safeParse({
        notifications: { channels: { push: true, email: true, whatsapp: false, sms: false } },
        coaching: { style: 'supportive' },
        display: { theme: 'dark' },
        privacy: { showInLeaderboards: true },
        integrations: { autoSyncEnabled: false },
        voiceAssistant: { assistantName: 'Coach' },
      });
      expect(result.success).toBe(true);
    });

    it('should accept individual sections', () => {
      const result = updatePreferencesSchema.safeParse({
        display: { theme: 'light', timeFormat: '12h' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid nested data', () => {
      const result = updatePreferencesSchema.safeParse({
        display: { theme: 'rainbow' },
      });
      expect(result.success).toBe(false);
    });
  });
});
