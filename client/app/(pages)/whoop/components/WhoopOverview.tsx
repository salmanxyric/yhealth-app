'use client';

import { useState, useEffect } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/whoop/DateRangePicker';
import { validateAndAdjustDateRange, MAX_DATE_RANGE_DAYS } from '@/lib/utils/date-range-validation';

export function WhoopOverview() {
  // Initialize with last 7 days by default
  const getDefaultDateRange = () => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    return { from: startDate, to: endDate };
  };

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(
    getDefaultDateRange()
  );

  // Handle date range changes with validation
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    const validated = validateAndAdjustDateRange(range, true);
    setDateRange(validated);
  };

  // Build query string with date range
  const buildQueryString = () => {
    const validatedRange = validateAndAdjustDateRange(dateRange, false);
    const params = new URLSearchParams();
    if (validatedRange.from) {
      params.append('startDate', validatedRange.from.toISOString().split('T')[0]);
    }
    if (validatedRange.to) {
      params.append('endDate', validatedRange.to.toISOString().split('T')[0]);
    }
    return params.toString();
  };

  const queryString = buildQueryString();
  const endpoint = queryString 
    ? `/whoop/analytics/overview?${queryString}`
    : '/whoop/analytics/overview';

  const { data, isLoading, error, refetch } = useFetch<{
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
    trends: {
      recovery7d: number[] | Array<{ date: string; value: number }>;
      sleep7d: number[] | Array<{ date: string; value: number }>;
      strain7d: number[] | Array<{ date: string; value: number }>;
    };
  }>(endpoint, {
    immediate: true,
    deps: [dateRange.from?.toISOString(), dateRange.to?.toISOString()], // Refetch when date range changes
  });

  // Listen for refresh events from parent (visibility change, manual refresh)
  useEffect(() => {
    const handleRefresh = () => refetch();
    window.addEventListener('whoop-refresh-requested', handleRefresh);
    return () => window.removeEventListener('whoop-refresh-requested', handleRefresh);
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
      toast.success('Refreshing trends...');
    } catch {
      toast.error('Failed to refresh trends');
    }
  };

  const handleSync = () => {
    triggerSync('/integrations/whoop/sync', {});
  };

  return (
    <div className="space-y-4 sm:space-y-[16px]">
      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-[11px] h-[42px] px-4 py-[5px] rounded-[8px] border border-white/10 text-white text-[16px] font-normal tracking-[0.1px] leading-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-white/[0.05]"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400 mb-2" />
          <span>Loading trends...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              <div>
                <p className="text-[13px] sm:text-[14px] text-red-400 font-medium">Failed to load trends</p>
                <p className="text-[13px] sm:text-[14px] text-red-300/70 mt-1">
                  {error.message || 'Unable to fetch WHOOP trends. Please check your connection and try again.'}
                </p>
                {error.message?.includes('90 days') && (
                  <p className="text-xs text-red-300/50 mt-2">
                    💡 Tip: Date range is automatically limited to {MAX_DATE_RANGE_DAYS} days. The range has been adjusted.
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => {
                // Auto-adjust date range if error is about 90 days
                if (error.message?.includes('90 days') && dateRange.from && dateRange.to) {
                  const adjusted = validateAndAdjustDateRange(dateRange, true);
                  setDateRange(adjusted);
                }
                handleRetry();
              }}
              variant="outline"
              size="sm"
              className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      ) : !data ? (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <div>
                <p className="text-[13px] sm:text-[14px] text-blue-400 font-medium">No trend data available</p>
                <p className="text-[13px] sm:text-[14px] text-blue-300/70 mt-1">
                  Unable to load WHOOP trends. Please try refreshing.
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
                  <RefreshCw className="w-4 h-4 mr-2" />
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
      ) : !data.trends || 
          ((!data.trends.recovery7d || (Array.isArray(data.trends.recovery7d) && data.trends.recovery7d.length === 0)) &&
           (!data.trends.sleep7d || (Array.isArray(data.trends.sleep7d) && data.trends.sleep7d.length === 0)) &&
           (!data.trends.strain7d || (Array.isArray(data.trends.strain7d) && data.trends.strain7d.length === 0))) ? (
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <div>
                <p className="text-[13px] sm:text-[14px] text-blue-400 font-medium">No trend data available</p>
                <p className="text-[13px] sm:text-[14px] text-blue-300/70 mt-1">
                  WHOOP data hasn&apos;t been synced yet. Your device is connected, but no historical data has been received. This usually means:
                  <br />• Data sync may take a few minutes after connecting
                  <br />• Make sure your WHOOP device is actively tracking and syncing
                  <br />• Historical data will appear once your device syncs
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
                  <RefreshCw className="w-4 h-4 mr-2" />
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
      ) : (() => {
        // Check if all trends are empty (all zeros or empty)
        const hasData = (data.trends.recovery7d && Array.isArray(data.trends.recovery7d) && data.trends.recovery7d.length > 0 && data.trends.recovery7d.some(v => (typeof v === 'number' ? v > 0 : (v as { value: number }).value > 0))) ||
                        (data.trends.sleep7d && Array.isArray(data.trends.sleep7d) && data.trends.sleep7d.length > 0 && data.trends.sleep7d.some(v => (typeof v === 'number' ? v > 0 : (v as { value: number }).value > 0))) ||
                        (data.trends.strain7d && Array.isArray(data.trends.strain7d) && data.trends.strain7d.length > 0 && data.trends.strain7d.some(v => (typeof v === 'number' ? v > 0 : (v as { value: number }).value > 0)));

        if (!hasData) {
          return (
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 sm:p-6 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <div>
                    <p className="text-[13px] sm:text-[14px] text-blue-400 font-medium">No trend data available</p>
                    <p className="text-[13px] sm:text-[14px] text-blue-300/70 mt-1">
                      No data points found for the selected date range. Make sure your WHOOP device is syncing data regularly.
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
                      <RefreshCw className="w-4 h-4 mr-2" />
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

        // Create chart data from trends - merge all data by date
        const dateMap = new Map<string, { recovery: number; sleep: number; strain: number; date: Date }>();
        
        // Get date range for generating dates when data is just numbers
        const validatedRange = validateAndAdjustDateRange(dateRange, false);
        const startDate = validatedRange.from || getDefaultDateRange().from;
        const endDate = validatedRange.to || getDefaultDateRange().to;
        
        // Helper to get date for index when data is just numbers
        const getDateForIndex = (index: number, total: number): Date => {
          if (total === 0) return startDate;
          const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const daysPerPoint = daysDiff / Math.max(1, total - 1);
          const date = new Date(startDate);
          date.setDate(date.getDate() + Math.round(index * daysPerPoint));
          return date;
        };
        
        // Process recovery data
        data.trends.recovery7d.forEach((item, index) => {
          let date: Date;
          let value: number;
          
          if (typeof item === 'number') {
            value = item;
            date = getDateForIndex(index, data.trends.recovery7d.length);
          } else {
            value = item.value;
            date = new Date(item.date);
          }
          
          const key = date.toISOString().split('T')[0];
          if (!dateMap.has(key)) {
            dateMap.set(key, { recovery: 0, sleep: 0, strain: 0, date });
          }
          dateMap.get(key)!.recovery = value;
        });
        
        // Process sleep data
        data.trends.sleep7d.forEach((item, index) => {
          let date: Date;
          let value: number;
          
          if (typeof item === 'number') {
            value = item;
            date = getDateForIndex(index, data.trends.sleep7d.length);
          } else {
            value = item.value;
            date = new Date(item.date);
          }
          
          const key = date.toISOString().split('T')[0];
          if (!dateMap.has(key)) {
            dateMap.set(key, { recovery: 0, sleep: 0, strain: 0, date });
          }
          dateMap.get(key)!.sleep = value;
        });
        
        // Process strain data
        data.trends.strain7d.forEach((item, index) => {
          let date: Date;
          let value: number;
          
          if (typeof item === 'number') {
            value = item;
            date = getDateForIndex(index, data.trends.strain7d.length);
          } else {
            value = item.value;
            date = new Date(item.date);
          }
          
          const key = date.toISOString().split('T')[0];
          if (!dateMap.has(key)) {
            dateMap.set(key, { recovery: 0, sleep: 0, strain: 0, date });
          }
          dateMap.get(key)!.strain = value;
        });
        
        // Convert to array and sort by date
        const chartData = Array.from(dateMap.values())
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((item) => ({
            date: format(item.date, 'MMM d'),
            fullDate: item.date,
            recovery: item.recovery || 0,
            sleep: item.sleep ? Math.round((item.sleep / 60) * 10) / 10 : 0, // Convert minutes to hours
            strain: item.strain || 0,
          }));

        const currentRecovery = data.currentRecovery;
        const currentSleep = data.currentSleep;
        const tempC = currentRecovery?.skinTemp;
        const sleepHours = currentSleep ? Math.round((currentSleep.duration / 60) * 10) / 10 : null;
        const recoveryPct = currentRecovery?.score ?? 0;

        return (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_337px] gap-4 sm:gap-[30px] items-start">
            {/* LEFT — Trends card */}
            <div
              className="relative rounded-[24px] sm:rounded-[32px] border border-white/10 p-5 sm:p-8 h-auto xl:h-[445px] overflow-hidden"
              style={{ backgroundColor: '#080615' }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h3 className="text-[20px] sm:text-[24px] font-medium text-white leading-none">
                    Trends
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-white opacity-50 mt-1 leading-[1.2]">
                    Historical performance metrics
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-[9px]">
                    <div className="w-[10.79px] h-[10px] rounded-[2px] border-2 border-[#201f2c]" style={{ backgroundColor: '#159d73' }} />
                    <span className="font-normal leading-6 text-[14px] text-white opacity-50 tracking-[0.1px]">Recovery</span>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <div className="w-[10.79px] h-[10px] rounded-[2px] border-2 border-[#201f2c]" style={{ backgroundColor: '#0284c7' }} />
                    <span className="font-normal leading-6 text-[14px] text-white opacity-50 tracking-[0.1px]">Sleep</span>
                  </div>
                  <div className="flex items-center gap-[9px]">
                    <div className="w-[10.79px] h-[10px] rounded-[2px] border-2 border-[#201f2c]" style={{ backgroundColor: '#faac18' }} />
                    <span className="font-normal leading-6 text-[14px] text-white opacity-50 tracking-[0.1px]">Strain</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={298}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barCategoryGap="20%"
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#92929d"
                    tick={{ fill: '#92929d', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#92929d"
                    tick={{ fill: '#92929d', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(8, 6, 21, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600, marginBottom: '6px' }}
                    itemStyle={{ color: '#e5e7eb', padding: '2px 0' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="recovery" fill="#159d73" name="Recovery" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="sleep" fill="#0284c7" name="Sleep (hrs)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="strain" fill="#faac18" name="Strain" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* RIGHT — Sidebar (Temperature + Sleep) */}
            <div className="flex flex-col gap-4 sm:gap-[24px] w-full xl:w-[337px]">
              {/* Temperature */}
              <div
                className="rounded-[24px] border border-white/10 overflow-hidden px-[25px] py-[20px]"
                style={{ backgroundColor: '#080615' }}
              >
                <div className="flex flex-col items-center gap-4">
                  <p className="font-normal text-[22px] text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Temperature
                  </p>
                  {/* Sun icon */}
                  <svg className="w-[90px] h-[90px]" viewBox="0 0 90 90" fill="none" aria-hidden>
                    <defs>
                      <radialGradient id="sunGrad" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="60%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </radialGradient>
                    </defs>
                    <circle cx="45" cy="45" r="28" fill="url(#sunGrad)" />
                    <circle cx="45" cy="45" r="38" fill="none" stroke="#f59e0b" strokeOpacity="0.2" strokeWidth="2" />
                  </svg>
                  <div className="flex flex-col gap-3 w-full">
                    <p className="text-center font-semibold text-white" style={{ fontSize: '42px', letterSpacing: '-0.8px', lineHeight: 1 }}>
                      {tempC != null ? tempC.toFixed(1) : '--'}
                      <span style={{ fontSize: '27px', verticalAlign: 'super' }}>°</span>
                      C
                    </p>
                    <div className="flex items-center justify-between w-full text-[12px]">
                      <span className="font-medium text-white">Skin Temp:</span>
                      <span className="font-normal text-[#b4b4b4]">
                        {tempC != null ? `${tempC.toFixed(1)}°C` : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sleep */}
              <div
                className="rounded-[24px] border border-white/10 overflow-hidden px-[24px] py-[20px]"
                style={{ backgroundColor: '#080615' }}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <p className="font-normal text-[20px] text-center text-white opacity-80 w-full">
                    Sleep
                  </p>
                  {/* Circular progress ring */}
                  <div className="relative w-[169px] h-[162px] flex items-center justify-center">
                    <svg className="absolute inset-0" viewBox="0 0 170 170" fill="none" aria-hidden>
                      {/* Base ring (dashed) */}
                      <circle
                        cx="85"
                        cy="85"
                        r="75"
                        stroke="#2a2a3a"
                        strokeWidth="8"
                        strokeDasharray="4 6"
                        fill="none"
                      />
                      {/* Progress arc */}
                      <circle
                        cx="85"
                        cy="85"
                        r="75"
                        stroke="#0284c7"
                        strokeWidth="9"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={`${(recoveryPct / 100) * 2 * Math.PI * 75} ${2 * Math.PI * 75}`}
                        transform="rotate(-90 85 85)"
                      />
                    </svg>
                    <div className="relative flex flex-col items-center gap-[2px] text-center">
                      <p className="font-bold text-[20.7px] text-[#f9f9f9] leading-none">
                        {sleepHours != null ? Math.round(sleepHours) : '--'}
                        <span className="text-[#f9f9f9]">hrs</span>
                      </p>
                      <p className="text-[13.8px] text-[#555] leading-none">
                        Recovery: {recoveryPct}%
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <div className="flex items-center justify-between w-full text-[12px]">
                      <span className="font-medium text-white">Quality:</span>
                      <span className="font-normal text-[#b4b4b4]">
                        {currentSleep ? `${currentSleep.quality}%` : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full text-[12px]">
                      <span className="font-medium text-white">Efficiency:</span>
                      <span className="font-normal text-[#b4b4b4]">
                        {currentSleep ? `${currentSleep.efficiency.toFixed(1)}%` : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
