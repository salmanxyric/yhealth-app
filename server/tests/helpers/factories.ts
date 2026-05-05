/**
 * Test Data Factories
 *
 * Builder-pattern factories for all core domain entities.
 * Uses @faker-js/faker for realistic deterministic data.
 * Each factory returns snake_case DB row format by default.
 */

import { faker } from '@faker-js/faker';
import crypto from 'crypto';

// ─── Primitives ──────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

function isoDate(date?: Date): string {
  return (date ?? faker.date.recent()).toISOString();
}

function localDate(date?: Date): string {
  return (date ?? faker.date.recent()).toISOString().split('T')[0];
}

// ─── User ────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_id: string;
  is_active: boolean;
  is_email_verified: boolean;
  avatar: string | null;
  phone: string | null;
  auth_provider: string;
  onboarding_status: string;
  date_of_birth: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export function buildUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: uuid(),
    email: faker.internet.email().toLowerCase(),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    role: 'user',
    role_id: '11111111-1111-1111-1111-111111111101',
    is_active: true,
    is_email_verified: true,
    avatar: null,
    phone: null,
    auth_provider: 'local',
    onboarding_status: 'completed',
    date_of_birth: '1990-05-15',
    gender: 'male',
    created_at: isoDate(),
    updated_at: isoDate(),
    ...overrides,
  };
}

export function buildAdminRow(overrides: Partial<UserRow> = {}): UserRow {
  return buildUserRow({
    role: 'admin',
    role_id: '11111111-1111-1111-1111-111111111102',
    ...overrides,
  });
}

// ─── JWT Payload ─────────────────────────────────────────────

export interface JwtPayloadData {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}

export function buildJwtPayload(overrides: Partial<JwtPayloadData> = {}): JwtPayloadData {
  return {
    userId: uuid(),
    email: faker.internet.email().toLowerCase(),
    role: 'user',
    ...overrides,
  };
}

// ─── Subscription ────────────────────────────────────────────

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function buildSubscriptionRow(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: uuid(),
    user_id: uuid(),
    stripe_customer_id: `cus_${faker.string.alphanumeric(14)}`,
    stripe_subscription_id: `sub_${faker.string.alphanumeric(14)}`,
    plan_id: uuid(),
    plan_name: 'pro',
    status: 'active',
    current_period_start: isoDate(),
    current_period_end: isoDate(faker.date.future()),
    cancel_at_period_end: false,
    created_at: isoDate(),
    updated_at: isoDate(),
    ...overrides,
  };
}

// ─── Activity Event ──────────────────────────────────────────

export interface ActivityEventRow {
  id: string;
  user_id: string;
  event_type: string;
  source: string;
  duration_minutes: number;
  calories_burned: number | null;
  metadata: Record<string, unknown>;
  recorded_at: string;
  created_at: string;
}

export function buildActivityEventRow(overrides: Partial<ActivityEventRow> = {}): ActivityEventRow {
  return {
    id: uuid(),
    user_id: uuid(),
    event_type: faker.helpers.arrayElement(['workout', 'walk', 'run', 'cycle', 'swim']),
    source: faker.helpers.arrayElement(['manual', 'whoop', 'apple_health']),
    duration_minutes: faker.number.int({ min: 10, max: 120 }),
    calories_burned: faker.number.int({ min: 50, max: 800 }),
    metadata: {},
    recorded_at: isoDate(),
    created_at: isoDate(),
    ...overrides,
  };
}

// ─── Daily Score ─────────────────────────────────────────────

export interface DailyScoreRow {
  id: string;
  user_id: string;
  date: string;
  total_score: number;
  component_scores: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export function buildDailyScoreRow(overrides: Partial<DailyScoreRow> = {}): DailyScoreRow {
  return {
    id: uuid(),
    user_id: uuid(),
    date: localDate(),
    total_score: faker.number.int({ min: 0, max: 100 }),
    component_scores: {
      workout: faker.number.int({ min: 0, max: 100 }),
      nutrition: faker.number.int({ min: 0, max: 100 }),
      wellbeing: faker.number.int({ min: 0, max: 100 }),
      biometrics: faker.number.int({ min: 0, max: 100 }),
      engagement: faker.number.int({ min: 0, max: 100 }),
      consistency: faker.number.int({ min: 0, max: 100 }),
    },
    created_at: isoDate(),
    updated_at: isoDate(),
    ...overrides,
  };
}

// ─── Competition ─────────────────────────────────────────────

export interface CompetitionRow {
  id: string;
  name: string;
  type: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  rules: Record<string, unknown>;
  eligibility: Record<string, unknown>;
  scoring_weights: Record<string, number>;
  anti_cheat_policy: Record<string, unknown>;
  prize_metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participant_count: string;
}

export function buildCompetitionRow(overrides: Partial<CompetitionRow> = {}): CompetitionRow {
  return {
    id: uuid(),
    name: faker.company.catchPhrase(),
    type: 'standard',
    description: faker.lorem.sentence(),
    start_date: isoDate(),
    end_date: isoDate(faker.date.future()),
    status: 'active',
    rules: { minParticipants: 2, maxParticipants: 100 },
    eligibility: {},
    scoring_weights: { workout: 0.3, nutrition: 0.2, wellbeing: 0.15, biometrics: 0.15, engagement: 0.1, consistency: 0.1 },
    anti_cheat_policy: {},
    prize_metadata: {},
    created_by: uuid(),
    created_at: isoDate(),
    updated_at: isoDate(),
    participant_count: '0',
    ...overrides,
  };
}

// ─── Chat Message ────────────────────────────────────────────

export interface ChatMessageRow {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  role: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function buildChatMessageRow(overrides: Partial<ChatMessageRow> = {}): ChatMessageRow {
  return {
    id: uuid(),
    session_id: uuid(),
    sender_id: uuid(),
    content: faker.lorem.sentence(),
    role: faker.helpers.arrayElement(['user', 'assistant']),
    metadata: {},
    created_at: isoDate(),
    ...overrides,
  };
}

// ─── Emotional Checkin ───────────────────────────────────────

export interface EmotionalCheckinRow {
  id: string;
  user_id: string;
  mood_rating: number;
  energy_level: number;
  stress_level: number;
  notes: string | null;
  triggers: string[];
  created_at: string;
}

export function buildEmotionalCheckinRow(overrides: Partial<EmotionalCheckinRow> = {}): EmotionalCheckinRow {
  return {
    id: uuid(),
    user_id: uuid(),
    mood_rating: faker.number.int({ min: 1, max: 10 }),
    energy_level: faker.number.int({ min: 1, max: 10 }),
    stress_level: faker.number.int({ min: 1, max: 10 }),
    notes: faker.lorem.sentence(),
    triggers: [],
    created_at: isoDate(),
    ...overrides,
  };
}

// ─── Notification ────────────────────────────────────────────

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function buildNotificationRow(overrides: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: uuid(),
    user_id: uuid(),
    type: faker.helpers.arrayElement(['reminder', 'achievement', 'system', 'social']),
    title: faker.lorem.sentence(3),
    body: faker.lorem.sentence(),
    read: false,
    metadata: {},
    created_at: isoDate(),
    ...overrides,
  };
}

// ─── Streak ──────────────────────────────────────────────────

export interface StreakRow {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  streak_start_date: string;
  created_at: string;
  updated_at: string;
}

export function buildStreakRow(overrides: Partial<StreakRow> = {}): StreakRow {
  return {
    id: uuid(),
    user_id: uuid(),
    current_streak: faker.number.int({ min: 0, max: 365 }),
    longest_streak: faker.number.int({ min: 0, max: 365 }),
    last_activity_date: localDate(),
    streak_start_date: localDate(faker.date.past()),
    created_at: isoDate(),
    updated_at: isoDate(),
    ...overrides,
  };
}

// ─── Workout Plan ────────────────────────────────────────────

export interface WorkoutPlanRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  exercises: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export function buildWorkoutPlanRow(overrides: Partial<WorkoutPlanRow> = {}): WorkoutPlanRow {
  return {
    id: uuid(),
    user_id: uuid(),
    name: `${faker.word.adjective()} ${faker.word.noun()} Plan`,
    description: faker.lorem.sentence(),
    status: 'active',
    start_date: localDate(),
    end_date: localDate(faker.date.future()),
    exercises: [],
    created_at: isoDate(),
    updated_at: isoDate(),
    ...overrides,
  };
}

// ─── Leaderboard Entry ───────────────────────────────────────

export interface LeaderboardEntryRow {
  user_id: string;
  rank: number;
  total_score: number;
  first_name: string;
  last_name: string;
  avatar: string | null;
  component_scores: Record<string, number>;
}

export function buildLeaderboardEntryRow(overrides: Partial<LeaderboardEntryRow> = {}): LeaderboardEntryRow {
  return {
    user_id: uuid(),
    rank: faker.number.int({ min: 1, max: 100 }),
    total_score: faker.number.int({ min: 0, max: 100 }),
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    avatar: null,
    component_scores: {
      workout: faker.number.int({ min: 0, max: 100 }),
      nutrition: faker.number.int({ min: 0, max: 100 }),
      wellbeing: faker.number.int({ min: 0, max: 100 }),
      biometrics: faker.number.int({ min: 0, max: 100 }),
      engagement: faker.number.int({ min: 0, max: 100 }),
      consistency: faker.number.int({ min: 0, max: 100 }),
    },
    ...overrides,
  };
}

// ─── Credit ──────────────────────────────────────────────────

export interface CreditRow {
  id: string;
  user_id: string;
  feature: string;
  amount: number;
  status: string;
  idempotency_key: string | null;
  created_at: string;
}

export function buildCreditRow(overrides: Partial<CreditRow> = {}): CreditRow {
  return {
    id: uuid(),
    user_id: uuid(),
    feature: faker.helpers.arrayElement(['ai_coach', 'voice_call', 'advanced_analytics']),
    amount: 1,
    status: 'reserved',
    idempotency_key: uuid(),
    created_at: isoDate(),
    ...overrides,
  };
}

// ─── PG Result Builder ───────────────────────────────────────

export function pgResult<T>(rows: T[], rowCount?: number) {
  return {
    rows,
    rowCount: rowCount ?? rows.length,
    command: 'SELECT' as const,
    oid: 0,
    fields: [],
  };
}

export function pgEmpty() {
  return pgResult([]);
}

export function pgCount(count: number) {
  return pgResult([{ count: String(count) }]);
}

export function pgInsertResult<T>(row: T) {
  return {
    rows: [row],
    rowCount: 1,
    command: 'INSERT' as const,
    oid: 0,
    fields: [],
  };
}
