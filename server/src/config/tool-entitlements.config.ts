/**
 * @file Tool Entitlements Configuration
 * @description Maps AI tool names to required feature keys from the EntitlementBundle.
 * Tools not listed here are available to all plans (no feature gate).
 *
 * Feature keys must match those in `plan_features` / `feature_catalog` tables.
 * The wrapper checks `bundle.features[featureKey].enabled` before invoking the tool.
 */

export const TOOL_FEATURE_REQUIREMENTS: Record<string, string> = {
  // Premium integrations
  musicManager:           'ai.music',
  whoopAnalyticsManager:  'ai.integrations.whoop',

  // Premium features
  competitionManager:     'ai.competitions',
  voiceJournalManager:    'ai.voice-journal',

  // All other tools: no feature requirement (available to all plans)
};
