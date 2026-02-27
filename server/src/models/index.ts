// Re-export types (defining locally instead of from Prisma)
// User types
export type UserRole = 'user' | 'admin' | 'moderator' | 'doctor' | 'patient';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type AuthProvider = 'local' | 'google' | 'apple';
export type OnboardingStatus = 'registered' | 'consent_pending' | 'assessment_pending' | 'goals_pending' | 'integrations_pending' | 'preferences_pending' | 'plan_pending' | 'completed';

// Consent types
export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'email_marketing' | 'whatsapp_coaching';

// Assessment types
export type GoalCategory = 'weight_loss' | 'muscle_building' | 'sleep_improvement' | 'stress_wellness' | 'energy_productivity' | 'event_training' | 'health_condition' | 'habit_building' | 'overall_optimization' | 'custom';
export type HealthPillar = 'fitness' | 'nutrition' | 'wellbeing';
export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
export type AssessmentType = 'quick' | 'deep';
export type QuestionType = 'single_select' | 'multi_select' | 'slider' | 'emoji_scale' | 'number_input' | 'date_picker' | 'text_input';

// Integration types
export type IntegrationProvider = 'whoop' | 'apple_health' | 'fitbit' | 'garmin' | 'oura' | 'samsung_health' | 'myfitnesspal' | 'nutritionix' | 'cronometer' | 'strava';
export type SyncStatus = 'active' | 'paused' | 'error' | 'disconnected' | 'pending';
export type DataType = 'heart_rate' | 'hrv' | 'sleep' | 'steps' | 'workouts' | 'calories' | 'nutrition' | 'strain' | 'recovery' | 'body_temp' | 'vo2_max' | 'training_load' | 'gps_activities';

// Preferences types
export type NotificationChannel = 'push' | 'email' | 'whatsapp' | 'sms';
export type CoachingStyle = 'supportive' | 'direct' | 'analytical' | 'motivational';
export type CoachingIntensity = 'light' | 'moderate' | 'intensive';

// Plan types
export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type ActivityType = 'workout' | 'meal' | 'sleep_routine' | 'mindfulness' | 'habit' | 'check_in' | 'reflection' | 'learning';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type ActivityLogStatus = 'pending' | 'completed' | 'skipped' | 'partial';

// Export database functions
export { query, transaction, getClient, database } from '../config/database.config.js';

// Integration metadata (moved here from old model)
export interface IIntegrationMeta {
  provider: string;
  displayName: string;
  description: string;
  logoUrl: string;
  tier: number;
  category: string;
  dataTypes: string[];
  authType: 'oauth2' | 'native' | 'api_key';
  scopes: string[];
  setupInstructions: string;
}

export const INTEGRATION_METADATA: IIntegrationMeta[] = [
  {
    provider: 'whoop',
    displayName: 'WHOOP',
    description: 'Advanced recovery, strain, and sleep tracking',
    logoUrl: '/integrations/whoop.svg',
    tier: 1,
    category: 'wearables',
    dataTypes: ['sleep', 'recovery', 'hrv', 'strain', 'heart_rate'],
    authType: 'oauth2',
    scopes: ['read:recovery', 'read:cycles', 'read:sleep', 'read:workout', 'read:profile'],
    setupInstructions: 'Connect your WHOOP account to sync your recovery and strain data.',
  },
  {
    provider: 'apple_health',
    displayName: 'Apple Health',
    description: 'Comprehensive health data from Apple ecosystem',
    logoUrl: '/integrations/apple-health.svg',
    tier: 1,
    category: 'health_platforms',
    dataTypes: ['steps', 'heart_rate', 'sleep', 'workouts', 'nutrition', 'weight'],
    authType: 'native',
    scopes: [],
    setupInstructions: 'Enable Apple Health access in the iOS app settings.',
  },
  {
    provider: 'fitbit',
    displayName: 'Fitbit',
    description: 'Activity, sleep, and heart rate tracking',
    logoUrl: '/integrations/fitbit.svg',
    tier: 1,
    category: 'wearables',
    dataTypes: ['steps', 'heart_rate', 'sleep', 'workouts', 'weight'],
    authType: 'oauth2',
    scopes: ['activity', 'heartrate', 'sleep', 'weight', 'profile'],
    setupInstructions: 'Connect your Fitbit account to sync your fitness data.',
  },
  {
    provider: 'garmin',
    displayName: 'Garmin Connect',
    description: 'GPS tracking and advanced fitness metrics',
    logoUrl: '/integrations/garmin.svg',
    tier: 1,
    category: 'wearables',
    dataTypes: ['steps', 'heart_rate', 'sleep', 'workouts', 'stress'],
    authType: 'oauth2',
    scopes: ['activity', 'sleep', 'stress'],
    setupInstructions: 'Connect your Garmin Connect account.',
  },
  {
    provider: 'oura',
    displayName: 'Oura Ring',
    description: 'Premium sleep and readiness tracking',
    logoUrl: '/integrations/oura.svg',
    tier: 1,
    category: 'wearables',
    dataTypes: ['sleep', 'readiness', 'hrv', 'heart_rate'],
    authType: 'oauth2',
    scopes: ['daily', 'heartrate', 'personal', 'session', 'workout'],
    setupInstructions: 'Connect your Oura account to sync sleep and readiness data.',
  },
  {
    provider: 'myfitnesspal',
    displayName: 'MyFitnessPal',
    description: 'Food diary and nutrition tracking',
    logoUrl: '/integrations/myfitnesspal.svg',
    tier: 2,
    category: 'nutrition',
    dataTypes: ['nutrition', 'calories', 'macros'],
    authType: 'oauth2',
    scopes: ['diary'],
    setupInstructions: 'Connect MyFitnessPal to sync your food diary.',
  },
  {
    provider: 'strava',
    displayName: 'Strava',
    description: 'Running and cycling activity tracking',
    logoUrl: '/integrations/strava.svg',
    tier: 2,
    category: 'fitness',
    dataTypes: ['workouts', 'distance', 'pace'],
    authType: 'oauth2',
    scopes: ['read', 'activity:read'],
    setupInstructions: 'Connect Strava to sync your running and cycling activities.',
  },
];

export const GOLDEN_SOURCE_PRIORITY: Record<string, string[]> = {
  sleep: ['whoop', 'oura', 'apple_health', 'fitbit', 'garmin'],
  heart_rate: ['whoop', 'oura', 'apple_health', 'garmin', 'fitbit'],
  hrv: ['whoop', 'oura', 'garmin'],
  steps: ['apple_health', 'fitbit', 'garmin'],
  workouts: ['strava', 'apple_health', 'garmin', 'fitbit'],
  nutrition: ['myfitnesspal', 'cronometer', 'apple_health'],
  weight: ['apple_health', 'fitbit', 'garmin'],
  recovery: ['whoop', 'oura'],
};
