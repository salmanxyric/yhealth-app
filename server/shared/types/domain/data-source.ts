/**
 * @file Universal Data Source Correlation domain types
 */

// ─── Source Types ────────────────────────────────────────────────────────────

export type DataSourceType = 'google_calendar' | 'spotify' | 'prayer_times' | 'finance';

export type DataSourceStatus = 'active' | 'paused' | 'error' | 'disconnected';

export interface DataSourceConnection {
  id: string;
  userId: string;
  sourceType: DataSourceType;
  status: DataSourceStatus;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Signal Types ────────────────────────────────────────────────────────────

export type SignalType =
  | 'busy_block'
  | 'free_window'
  | 'music_mood'
  | 'music_energy'
  | 'prayer_time'
  | 'prayer_completed'
  | 'spending'
  | 'spending_spike';

export interface DataSourceSignal {
  id: string;
  userId: string;
  sourceType: DataSourceType;
  signalType: SignalType;
  signalDate: string;
  startTime: string | null;
  endTime: string | null;
  value: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Correlation Types ───────────────────────────────────────────────────────

export type CorrelationRuleId =
  | 'CALENDAR_OVERLOAD_MOOD_DROP'
  | 'SPENDING_STRESS_SLEEP'
  | 'PRAYER_CONSISTENCY_MOOD'
  | 'BUSY_DAY_NO_EXERCISE'
  | 'MUSIC_ENERGY_WORKOUT'
  | 'EVENING_SPENDING_SLEEP'
  | 'FASTING_EXERCISE_RISK'
  | 'SOCIAL_CALENDAR_ISOLATION';

export type RecommendedMode = 'short' | 'normal' | 'deep';
export type ToneAdjustment = 'supportive' | 'celebratory' | 'direct' | 'motivational';

export interface CorrelationInsight {
  ruleId: CorrelationRuleId;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  evidence: string[];
  domains: DataSourceType[];
}

export interface DailyCorrelation {
  id: string;
  userId: string;
  correlationDate: string;
  stressScore: number;
  energyScore: number;
  moodScore: number;
  availabilityScore: number;
  calendarLoad: number;
  musicMood: string | null;
  prayerAdherence: number;
  spendingStress: number;
  correlations: CorrelationInsight[];
  recommendedMode: RecommendedMode;
  toneAdjustment: ToneAdjustment;
  signalsSummary: Record<string, unknown>;
  computedAt: string;
}

// ─── Spotify Listening ───────────────────────────────────────────────────────

export type SpotifyMoodTag = 'happy' | 'melancholic' | 'energetic' | 'calm' | 'aggressive';

export interface SpotifyListeningSession {
  id: string;
  userId: string;
  listenedAt: string;
  trackName: string;
  artistName: string;
  genre: string | null;
  valence: number;
  energy: number;
  tempo: number;
  moodTag: SpotifyMoodTag;
  sessionId: string | null;
}

// ─── Prayer ──────────────────────────────────────────────────────────────────

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tahajjud';

export interface PrayerSchedule {
  id: string;
  userId: string;
  prayerDate: string;
  prayerName: PrayerName;
  scheduledTime: string;
  completed: boolean;
  completedAt: string | null;
  source: 'api' | 'manual';
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export type SpendingCategory =
  | 'food'
  | 'health'
  | 'entertainment'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'education'
  | 'other';

export interface SpendingTransaction {
  id: string;
  userId: string;
  transactionDate: string;
  amount: number;
  currency: string;
  category: SpendingCategory | string;
  description: string | null;
  source: 'manual' | 'csv_import' | 'api';
  stressIndicator: boolean;
}

// ─── Dashboard / API Response ────────────────────────────────────────────────

export interface CorrelationDashboardData {
  today: DailyCorrelation | null;
  history: DailyCorrelation[];
  connections: DataSourceConnection[];
  todaySignals: DataSourceSignal[];
}

export interface DataSourceOverview {
  sourceType: DataSourceType;
  connected: boolean;
  status: DataSourceStatus | null;
  lastSyncAt: string | null;
  signalCount: number;
}
