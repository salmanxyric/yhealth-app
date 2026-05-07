'use client';

import { useFetch } from '@/hooks/use-fetch';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useEffect } from 'react';
import { Zap, HeartPulse, Droplet, Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function WhoopMetrics() {
  const { data, isLoading, error, refetch, reset } = useFetch<{
    currentRecovery: {
      score: number;
      hrv: number;
      rhr: number;
      spo2?: number;
      skinTemp?: number;
      timestamp: string;
    } | null;
    currentSleep: {
      duration: number;
      quality: number;
      efficiency: number;
      timestamp: string;
    } | null;
    todayStrain: {
      score: number;
      normalized: number;
      avgHeartRate?: number;
      maxHeartRate?: number;
      calories?: number;
      timestamp: string;
    } | null;
  }>('/whoop/analytics/overview', {
    immediate: true,
  });

  // Listen for refresh/connection events from parent
  useEffect(() => {
    const handleRefresh = () => { reset(); refetch(); };
    window.addEventListener('whoop-refresh-requested', handleRefresh);
    window.addEventListener('whoop-connected', handleRefresh);
    return () => {
      window.removeEventListener('whoop-refresh-requested', handleRefresh);
      window.removeEventListener('whoop-connected', handleRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate: triggerSync, isLoading: isSyncing } = useApiMutation({
    onSuccess: () => {
      toast.success('Sync started! Data will appear shortly...');
      // Refetch after a short delay to get new data
      setTimeout(() => {
        refetch();
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync data');
    },
  });

  const handleRetry = async () => {
    try {
      await refetch();
      toast.success('Refreshing metrics...');
    } catch (_err) {
      toast.error('Failed to refresh metrics');
    }
  };

  const handleSync = () => {
    triggerSync('/integrations/whoop/sync', {});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl bg-slate-700/50" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2 bg-slate-700/50" />
                  <Skeleton className="h-8 w-16 bg-slate-700/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full bg-slate-700/50" />
                <Skeleton className="h-3 w-3/4 bg-slate-700/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <div>
              <p className="text-[13px] sm:text-[14px] text-red-400 font-medium">Failed to load metrics</p>
              <p className="text-[13px] sm:text-[14px] text-red-300/70 mt-1">
                {error.message || 'Unable to fetch WHOOP data. Please check your connection and try again.'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Check if data exists but is empty
  if (!data) {
    return (
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <div className="flex-1">
            <p className="text-[13px] sm:text-[14px] text-blue-400 font-medium">No data available</p>
            <p className="text-[13px] sm:text-[14px] text-blue-300/70 mt-1">
              Unable to load WHOOP metrics. Please try refreshing.
            </p>
          </div>
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const recovery = data.currentRecovery;
  const sleep = data.currentSleep;
  const strain = data.todayStrain;

  // Check if all metrics are null (no data available)
  const hasNoData = !recovery && !sleep && !strain;

  if (hasNoData) {
    return (
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-[13px] sm:text-[14px] text-blue-400 font-medium">No data available</p>
              <p className="text-[13px] sm:text-[14px] text-blue-300/70 mt-1">
                WHOOP data hasn&apos;t been synced yet. Your device is connected, but no health data has been received. This usually means:
                <br />• Data sync may take a few minutes after connecting
                <br />• Make sure your WHOOP device is actively tracking and syncing
                <br />• Try refreshing or check back later
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              variant="outline"
              size="sm"
              disabled={isSyncing}
              className="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const heartRate = strain?.avgHeartRate || recovery?.rhr;

  const MetricCard = ({
    label,
    value,
    icon,
    sparkPath,
    sparkFillId,
    sparkColor,
    isEmpty = false,
  }: {
    label: string;
    value: string;
    icon: React.ReactNode;
    sparkPath: string;
    sparkFillId: string;
    sparkColor: string;
    isEmpty?: boolean;
  }) => (
    <div
      className={`relative h-[192px] overflow-hidden rounded-[32px] border border-white/10 ${
        isEmpty ? 'opacity-60' : ''
      }`}
      style={{ backgroundColor: '#080615' }}
    >
      <div className="absolute top-[17px] left-[20px] right-[20px] flex items-center justify-between">
        <div className="flex flex-col gap-[5px]">
          <p className="font-normal text-[15.8px] leading-none text-white opacity-50 tracking-[0.33px]">
            {label}
          </p>
          <p className="font-semibold text-[26.3px] leading-none text-white tracking-[0.33px] whitespace-nowrap">
            {isEmpty ? '--' : value}
          </p>
        </div>
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      {/* Sparkline fills bottom */}
      <svg
        className="absolute left-0 right-0 bottom-0 w-full h-[88px]"
        viewBox="0 0 400 88"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={sparkFillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sparkColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={sparkColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${sparkPath} L 400 88 L 0 88 Z`} fill={`url(#${sparkFillId})`} />
        <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-[32px]">
      {/* Recovery */}
      <MetricCard
        label="Recovery"
        value={recovery?.score != null ? String(recovery.score) : '--'}
        icon={<Zap className="w-7 h-7 fill-[#f59e0b] text-[#f59e0b]" />}
        sparkPath="M 0 58 C 40 54, 60 62, 100 56 S 160 48, 200 50 S 280 44, 320 46 S 380 40, 400 42"
        sparkFillId="spark-recovery"
        sparkColor="#f59e0b"
        isEmpty={!recovery}
      />

      {/* Heart Rate */}
      <MetricCard
        label="Heart Rate"
        value={heartRate ? `${heartRate} bpm` : '--'}
        icon={<HeartPulse className="w-7 h-7 text-[#10b981]" />}
        sparkPath="M 0 60 C 30 56, 50 48, 90 50 S 150 62, 190 54 S 250 42, 290 50 S 350 58, 400 52"
        sparkFillId="spark-hr"
        sparkColor="#10b981"
        isEmpty={!heartRate}
      />

      {/* HRV */}
      <MetricCard
        label="HRV"
        value={recovery?.hrv ? `${recovery.hrv.toFixed(2)}ms` : '--'}
        icon={<Zap className="w-7 h-7 fill-[#a855f7] text-[#a855f7]" />}
        sparkPath="M 0 62 C 40 60, 80 58, 120 60 S 200 62, 240 60 S 320 58, 360 60 S 400 58, 400 58"
        sparkFillId="spark-hrv"
        sparkColor="#a855f7"
        isEmpty={!recovery?.hrv}
      />

      {/* SPO2 */}
      <MetricCard
        label="SPO2"
        value={recovery?.spo2 ? `${recovery.spo2}%` : '--'}
        icon={<Droplet className="w-7 h-7 fill-[#06b6d4] text-[#06b6d4]" />}
        sparkPath="M 0 52 C 20 36, 40 68, 60 52 S 100 30, 120 50 S 160 68, 180 48 S 220 28, 240 48 S 280 66, 300 50 S 340 32, 360 48 S 400 62, 400 50"
        sparkFillId="spark-spo2"
        sparkColor="#06b6d4"
        isEmpty={!recovery?.spo2}
      />
    </div>
  );
}

