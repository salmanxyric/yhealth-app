"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Loader2,
  AlertCircle,
  Save,
  Radio,
  Unlink,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  dataSourceService,
  type PrayerName,
  type PrayerTimesConfig,
} from '@/src/shared/services/data-source.service';
import { toast } from "sonner";
import {
  PRAYER_FIELDS,
  PRAYER_LABELS,
  PRAYER_METHODS,
  DEFAULT_PRAYER_CONFIG,
} from './settings-constants';
import { formatPrayerTime, todayISODate } from './settings-utils';

export function PrayerTimesSection() {
  const [config, setConfig] = useState<PrayerTimesConfig>(DEFAULT_PRAYER_CONFIG);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [schedule, setSchedule] = useState<Array<{ prayerName: string; scheduledTime: string; source?: string }>>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const updateConfig = <K extends keyof PrayerTimesConfig>(key: K, value: PrayerTimesConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateManualTime = (name: PrayerName, value: string) => {
    setConfig(prev => ({
      ...prev,
      manualTimes: { ...(prev.manualTimes || {}), [name]: value },
    }));
  };

  const updateOffset = (name: PrayerName, value: string) => {
    const minutes = value === '' ? undefined : Number(value);
    setConfig(prev => ({
      ...prev,
      offsets: {
        ...(prev.offsets || {}),
        [name]: Number.isFinite(minutes) ? minutes : 0,
      },
    }));
  };

  const loadTodaySchedule = useCallback(async () => {
    try {
      const prayers = await dataSourceService.getPrayerSchedule(todayISODate());
      setSchedule(prayers.map(p => ({
        prayerName: p.prayerName,
        scheduledTime: p.scheduledTime,
        source: p.source,
      })));
    } catch {
      setSchedule([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const connections = await dataSourceService.getConnections();
        const prayer = connections.find(c => c.sourceType === 'prayer_times' && c.status !== 'disconnected');
        if (prayer) {
          const saved = prayer.config as Partial<PrayerTimesConfig>;
          setConnected(prayer.status === 'active');
          setSyncError(prayer.syncError || null);
          setConfig({ ...DEFAULT_PRAYER_CONFIG, ...saved });
          setManualMode(Boolean(saved.manualTimes && Object.values(saved.manualTimes).some(Boolean)));
          await loadTodaySchedule();
        }
      } catch {
        setSyncError('Could not load prayer time settings');
      } finally {
        setChecking(false);
      }
    })();
  }, [loadTodaySchedule]);

  const handleSave = async () => {
    if (!config.city.trim() || !config.country.trim()) {
      toast.error('Enter both city and country');
      return;
    }

    setLoading(true);
    setSyncError(null);
    try {
      await dataSourceService.connect('prayer_times', {
        ...config,
        city: config.city.trim(),
        country: config.country.trim(),
      });
      setConnected(true);
      await loadTodaySchedule();
      toast.success('Prayer times enabled and synced');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to sync prayer times';
      setSyncError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualTimes = async () => {
    setLoading(true);
    try {
      const manualTimes = Object.fromEntries(
        Object.entries(config.manualTimes || {}).filter(([, value]) => value)
      ) as Partial<Record<PrayerName, string>>;
      await dataSourceService.saveManualPrayerTimes({
        date: todayISODate(),
        manualTimes,
        timezone: config.timezone || 'Asia/Karachi',
      });
      await dataSourceService.connect('prayer_times', { ...config, manualTimes });
      await loadTodaySchedule();
      setConnected(true);
      toast.success('Manual prayer times saved');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save manual times';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSyncError(null);
    try {
      await dataSourceService.syncPrayerSchedule(todayISODate());
      await loadTodaySchedule();
      setConnected(true);
      toast.success('Prayer schedule refreshed');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to refresh prayer schedule';
      setSyncError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await dataSourceService.disconnect('prayer_times');
      setConnected(false);
      setSchedule([]);
      setSyncError(null);
      toast.success('Prayer times disconnected');
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          <span className="text-sm text-slate-400">Checking prayer times connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border p-6 transition-colors',
      connected ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-slate-700/50 bg-slate-800/30'
    )}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Prayer Times</h4>
              {connected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {connected ? `${config.city}, ${config.country} · method ${config.method}` : 'Aladhan sync with manual overrides and prayer completion tracking'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {connected && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
              Refresh Today
            </button>
          )}
          {connected && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              Disconnect
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{syncError}</span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={config.city}
          onChange={e => updateConfig('city', e.target.value)}
          placeholder="City"
          className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-colors"
        />
        <input
          type="text"
          value={config.country}
          onChange={e => updateConfig('country', e.target.value)}
          placeholder="Country"
          className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-colors"
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <select
          value={config.method}
          onChange={e => updateConfig('method', Number(e.target.value))}
          className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500/50 outline-none"
        >
          {PRAYER_METHODS.map(method => (
            <option key={method.id} value={method.id}>{method.label}</option>
          ))}
        </select>
        <select
          value={config.school}
          onChange={e => updateConfig('school', Number(e.target.value))}
          className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500/50 outline-none"
        >
          <option value={0}>Standard Asr</option>
          <option value={1}>Hanafi Asr</option>
        </select>
        <input
          type="text"
          value={config.timezone || ''}
          onChange={e => updateConfig('timezone', e.target.value)}
          placeholder="Timezone, e.g. Asia/Karachi"
          className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 outline-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading || !config.city.trim() || !config.country.trim()}
          className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {connected ? 'Save & Sync' : 'Enable Prayer Times'}
        </button>
        <button
          type="button"
          onClick={() => setManualMode(prev => !prev)}
          className={cn(
            'min-h-10 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
            manualMode
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-700 text-slate-300 hover:bg-white/5'
          )}
        >
          Manual Times
        </button>
        <button
          type="button"
          onClick={() => setShowAdvanced(prev => !prev)}
          className="min-h-10 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
        >
          Advanced
        </button>
      </div>

      {schedule.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {schedule.map(item => (
            <div key={item.prayerName} className="rounded-lg border border-white/[0.06] bg-slate-950/40 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {PRAYER_LABELS[item.prayerName as PrayerName] || item.prayerName}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{formatPrayerTime(item.scheduledTime)}</p>
              <p className={cn('mt-0.5 text-[10px]', item.source === 'manual' ? 'text-amber-300' : 'text-emerald-300')}>
                {item.source === 'manual' ? 'Manual' : 'Aladhan'}
              </p>
            </div>
          ))}
        </div>
      )}

      {manualMode && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">Manual prayer times</p>
              <p className="text-xs text-slate-500">Overrides are saved per prayer and applied to today immediately.</p>
            </div>
            <button
              onClick={handleSaveManualTimes}
              disabled={loading}
              className="rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/25 disabled:opacity-50"
            >
              Save Manual
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRAYER_FIELDS.map(name => (
              <label key={name} className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {PRAYER_LABELS[name]}
                </span>
                <input
                  type="time"
                  value={config.manualTimes?.[name] || ''}
                  onChange={e => updateManualTime(name, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {showAdvanced && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              value={config.state || ''}
              onChange={e => updateConfig('state', e.target.value)}
              placeholder="State/province"
              className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 outline-none"
            />
            <select
              value={config.latitudeAdjustmentMethod ?? 3}
              onChange={e => updateConfig('latitudeAdjustmentMethod', Number(e.target.value))}
              className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500/50 outline-none"
            >
              <option value={1}>Middle of night</option>
              <option value={2}>One seventh</option>
              <option value={3}>Angle based</option>
            </select>
            <select
              value={config.midnightMode ?? 0}
              onChange={e => updateConfig('midnightMode', Number(e.target.value))}
              className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500/50 outline-none"
            >
              <option value={0}>Standard midnight</option>
              <option value={1}>Jafari midnight</option>
            </select>
            <input
              type="number"
              min={0}
              max={60}
              value={config.reminderLeadMinutes ?? 10}
              onChange={e => updateConfig('reminderLeadMinutes', Number(e.target.value))}
              placeholder="Reminder minutes"
              className="px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-emerald-500/50 outline-none"
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PRAYER_FIELDS.filter(name => name !== 'tahajjud').map(name => (
              <label key={name} className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {PRAYER_LABELS[name]} offset
                </span>
                <input
                  type="number"
                  min={-60}
                  max={60}
                  value={config.offsets?.[name] ?? 0}
                  onChange={e => updateOffset(name, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/60"
                />
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={config.includeTahajjud !== false}
              onChange={e => updateConfig('includeTahajjud', e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900"
            />
            Include Tahajjud as a tracked optional prayer
          </label>
        </div>
      )}
    </div>
  );
}
