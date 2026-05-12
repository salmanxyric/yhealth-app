// Settings components barrel export

// Section components
export { ChangePasswordModal } from './ChangePasswordModal';
export { GoogleCalendarSection } from './GoogleCalendarSection';
export { PrayerTimesSection } from './PrayerTimesSection';
export { SpendingTrackerSection } from './SpendingTrackerSection';
export { CommunicationSettingsSection } from './CommunicationSettingsSection';
export { ProfileSettingsSection } from './ProfileSettingsSection';

// Tab section components
export { AICoachSettingsSection } from './AICoachSettingsSection';
export { NotificationsSettingsSection } from './NotificationsSettingsSection';
export { IntegrationsSection } from './IntegrationsSection';
export { AppearanceSettingsSection } from './AppearanceSettingsSection';
export { VoiceAssistantSettingsSection } from './VoiceAssistantSettingsSection';
export { GoalsSettingsSection } from './GoalsSettingsSection';
export { PrivacySettingsSection } from './PrivacySettingsSection';
export { AccountabilitySettingsSection } from './AccountabilitySettingsSection';
export { ContractsSettingsSection } from './ContractsSettingsSection';
export { SubscriptionSettingsSection } from './SubscriptionSettingsSection';
export { SecuritySettingsSection } from './SecuritySettingsSection';
export { HelpSupportSettingsSection } from './HelpSupportSettingsSection';
export { AccountSettingsSection } from './AccountSettingsSection';

// Modals
export { WhoopCredentialsModal } from './WhoopCredentialsModal';
export { SpotifyCredentialsModal } from './SpotifyCredentialsModal';

// Loading
export { SettingsLoadingSkeleton } from './SettingsLoadingSkeleton';

// Shared UI
export {
  SegmentedControl,
  ToggleSwitch,
  GlassCard,
  SectionHeader,
  HourSelect,
  ProfileInfoTile,
} from './SettingsSharedUI';

// Types
export type {
  UserPreferences,
  ApiPreferencesResponse,
  ConnectedIntegration,
  ProfileUser,
  SettingsSectionId,
  WhoopStatus,
  SpotifyStatus,
  TokenInfo,
  PreferencesProps,
  PreferencesWithSetterProps,
  IntegrationsSectionProps,
} from './settings-types';
export {
  SETTINGS_SECTION_IDS,
  isValidSettingsSection,
} from './settings-types';

// Constants
export {
  PRAYER_FIELDS,
  PRAYER_LABELS,
  PRAYER_METHODS,
  DEFAULT_PRAYER_CONFIG,
  intensityLevels,
  formalityOptions,
  encouragementOptions,
  messageStyleOptions,
  availableFocusAreas,
  REDUCE_MOTION_STORAGE_KEY,
} from './settings-constants';

// Utils
export {
  apiToLocalPreferences,
  localToApiPreferences,
  formatProfileDate,
  calculateAge,
  calculateProfileCompletion,
  formatPrayerTime,
  todayISODate,
} from './settings-utils';
