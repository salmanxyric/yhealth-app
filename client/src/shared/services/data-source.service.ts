/**
 * @file Data Source Service (Client)
 * @description API client for Universal Data Source Correlation system
 */

import { api } from '@/lib/api-client';

// ============================================
// TYPES (mirrors shared/types/domain/data-source.ts)
// ============================================

export type DataSourceType = 'google_calendar' | 'spotify' | 'prayer_times' | 'finance';

export interface DataSourceConnection {
  id: string;
  userId: string;
  sourceType: DataSourceType;
  status: string;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceSignal {
  id: string;
  sourceType: DataSourceType;
  signalType: string;
  signalDate: string;
  startTime: string | null;
  endTime: string | null;
  value: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface CorrelationInsight {
  ruleId: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  evidence: string[];
  domains: DataSourceType[];
}

export interface DailyCorrelation {
  id: string;
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
  recommendedMode: 'short' | 'normal' | 'deep';
  toneAdjustment: string;
  signalsSummary: Record<string, unknown>;
  computedAt: string;
}

export interface PrayerScheduleItem {
  id: string;
  prayerDate: string;
  prayerName: string;
  scheduledTime: string;
  completed: boolean;
  completedAt: string | null;
  source?: string;
}

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'tahajjud';

export interface PrayerTimesConfig {
  city: string;
  country: string;
  state?: string;
  method: number;
  school: number;
  latitudeAdjustmentMethod?: number;
  midnightMode?: number;
  adjustment?: number;
  timezone?: string;
  includeTahajjud?: boolean;
  reminderLeadMinutes?: number;
  offsets?: Partial<Record<PrayerName, number>>;
  manualTimes?: Partial<Record<PrayerName, string>>;
}

export interface SpendingTransaction {
  id: string;
  transactionDate: string;
  amount: number;
  currency: string;
  category: string | null;
  description: string | null;
  source: string;
  stressIndicator: boolean;
}

export interface DataSourceOverview {
  sourceType: DataSourceType;
  connected: boolean;
  status: string | null;
  lastSyncAt: string | null;
  signalCount: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

/** API envelope shapes for `api.get` / `api.post` generics (avoids `data` typed as `{}`). */
type ConnectionsResponse = { connections: DataSourceConnection[] };
type ConnectionResponse = { connection: DataSourceConnection };
type OverviewResponse = { overview: DataSourceOverview[] };
type SignalsResponse = { signals: DataSourceSignal[] };
type CorrelationResponse = { correlation: DailyCorrelation | null };
type HistoryResponse = { history: DailyCorrelation[] };
type PrayerRowRaw = {
  id: string;
  prayer_date?: string;
  prayerDate?: string;
  prayer_name?: string;
  prayerName?: string;
  scheduled_time?: string;
  scheduledTime?: string;
  completed: boolean;
  completed_at?: string | null;
  completedAt?: string | null;
  source?: string;
};
type PrayersResponse = { prayers: PrayerRowRaw[] };
type PrayerConfigResponse = { prayers: PrayerRowRaw[]; config?: Record<string, unknown> };
type TransactionResponse = { transaction: SpendingTransaction };
type TransactionsResponse = { transactions: SpendingTransaction[] };
type ImportCountResponse = { count: number };
type BreakdownResponse = { breakdown: CategoryBreakdown[] };

// ============================================
// SERVICE
// ============================================

const BASE = '/data-sources';

class DataSourceService {
  // ─── Connections ──────────────────────────────────────────

  async getConnections(): Promise<DataSourceConnection[]> {
    const res = await api.get<ConnectionsResponse>(`${BASE}`);
    return res.data?.connections ?? [];
  }

  async connect(sourceType: DataSourceType, config: Record<string, unknown> = {}): Promise<DataSourceConnection> {
    const res = await api.post<ConnectionResponse>(`${BASE}`, { sourceType, config });
    if (!res.data?.connection) {
      throw new Error(res.error?.message ?? 'Failed to connect data source');
    }
    return res.data.connection;
  }

  async disconnect(sourceType: DataSourceType): Promise<void> {
    await api.delete(`${BASE}/${sourceType}`);
  }

  async getOverview(): Promise<DataSourceOverview[]> {
    const res = await api.get<OverviewResponse>(`${BASE}/overview`);
    return res.data?.overview ?? [];
  }

  // ─── Signals & Correlations ───────────────────────────────

  async getSignals(date: string): Promise<DataSourceSignal[]> {
    const res = await api.get<SignalsResponse>(`${BASE}/signals`, { params: { date } });
    return res.data?.signals ?? [];
  }

  async getDailyCorrelation(date: string): Promise<DailyCorrelation | null> {
    const res = await api.get<CorrelationResponse>(`${BASE}/correlation`, { params: { date } });
    return res.data?.correlation ?? null;
  }

  async getCorrelationHistory(days: number = 7): Promise<DailyCorrelation[]> {
    const res = await api.get<HistoryResponse>(`${BASE}/correlation/history`, { params: { days } });
    return res.data?.history ?? [];
  }

  // ─── Prayer ───────────────────────────────────────────────

  async getPrayerSchedule(date: string): Promise<PrayerScheduleItem[]> {
    const res = await api.get<PrayersResponse>(`${BASE}/prayers`, { params: { date } });
    return this.mapPrayerRows(res.data?.prayers ?? []);
  }

  async syncPrayerSchedule(date?: string): Promise<PrayerScheduleItem[]> {
    const res = await api.post<PrayersResponse>(`${BASE}/prayers/sync`, date ? { date } : {});
    return this.mapPrayerRows(res.data?.prayers ?? []);
  }

  async saveManualPrayerTimes(data: {
    date?: string;
    manualTimes: Partial<Record<PrayerName, string>>;
    timezone?: string;
  }): Promise<PrayerScheduleItem[]> {
    const res = await api.patch<PrayerConfigResponse>(`${BASE}/prayers/manual`, data);
    return this.mapPrayerRows(res.data?.prayers ?? []);
  }

  async markPrayerComplete(prayerId: string): Promise<void> {
    await api.post(`${BASE}/prayers/${prayerId}/complete`);
  }

  private mapPrayerRows(rows: PrayerRowRaw[]): PrayerScheduleItem[] {
    return rows.map((r) => ({
      id: r.id,
      prayerDate: r.prayerDate ?? r.prayer_date ?? '',
      prayerName: r.prayerName ?? r.prayer_name ?? '',
      scheduledTime: r.scheduledTime ?? r.scheduled_time ?? '',
      completed: !!r.completed,
      completedAt: r.completedAt ?? r.completed_at ?? null,
      source: r.source,
    }));
  }

  // ─── Spending ─────────────────────────────────────────────

  async addTransaction(data: {
    transactionDate: string;
    amount: number;
    currency?: string;
    category?: string;
    description?: string;
  }): Promise<SpendingTransaction> {
    const res = await api.post<TransactionResponse>(`${BASE}/spending`, data);
    if (!res.data?.transaction) {
      throw new Error(res.error?.message ?? 'Failed to add transaction');
    }
    return res.data.transaction;
  }

  async getTransactions(start: string, end: string): Promise<SpendingTransaction[]> {
    const res = await api.get<TransactionsResponse>(`${BASE}/spending`, { params: { start, end } });
    return res.data?.transactions ?? [];
  }

  async importTransactionsCSV(rows: Array<{ date: string; amount: number; category?: string; description?: string }>): Promise<number> {
    const res = await api.post<ImportCountResponse>(`${BASE}/spending/import`, { rows });
    return res.data?.count ?? 0;
  }

  async getCategoryBreakdown(start: string, end: string): Promise<CategoryBreakdown[]> {
    const res = await api.get<BreakdownResponse>(`${BASE}/spending/categories`, { params: { start, end } });
    return res.data?.breakdown ?? [];
  }
}

export const dataSourceService = new DataSourceService();
