'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFetch } from '@/hooks/use-fetch';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { WhoopOverview } from './components/WhoopOverview';
import { RecoveryChart } from './components/RecoveryChart';
import { SleepStagesChart } from './components/SleepStagesChart';
import { StrainChart } from './components/StrainChart';
import { CycleAnalysis } from './components/CycleAnalysis';
import { RecoveriesTable } from './components/RecoveriesTable';
import { WhoopMetrics } from './components/WhoopMetrics';
import { StressMonitor } from './components/StressMonitor';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Activity, Heart, Moon, TrendingUp, CheckCircle2, XCircle, AlertCircle, Loader2, Settings, Clock, Link2, Calendar, Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface WhoopStatus {
  isConnected: boolean;
  hasCredentials: boolean;
  status: string;
  connectedAt: string | null;
  lastSyncAt: string | null;
  webhookRegistered: boolean;
  initialSyncComplete: boolean;
  provider: string;
  email?: string;
  whoopUserId?: number;
  firstName?: string;
  lastName?: string;
}

export default function WhoopPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);
  const router = useRouter();
  const previousTabRef = useRef<string | null>(null);
  const isConnectedRef = useRef<boolean>(false);

  const { data: statusData, isLoading: isLoadingStatus, error: statusError, refetch: refetchStatus } = useFetch<WhoopStatus>(
    '/integrations/whoop/status',
    { immediate: true }
  );

  // Hide initial skeleton once status is loaded
  useEffect(() => {
    if (!isLoadingStatus && statusData) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowInitialSkeleton(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingStatus, statusData]);

  // Refetch when user returns to tab (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetchStatus]);

  // Stabilize isConnected value to prevent components from unmounting
  // Once connected, keep the ref true even if status temporarily changes
  useEffect(() => {
    if (statusData?.isConnected) {
      isConnectedRef.current = true;
      // Dispatch event to notify child components that connection is established
      window.dispatchEvent(new CustomEvent('whoop-connected'));
    }
    // Don't set to false when disconnected - keep showing data to prevent flash
    // Only set to false if explicitly disconnected AND we have confirmed status
  }, [statusData?.isConnected]);

  // Dispatch events on mount - trigger fresh data fetches in child components
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('whoop-tab-changed', { 
      detail: { tab: activeTab } 
    }));
    // Dispatch immediately - child components should handle it
    window.dispatchEvent(new CustomEvent('whoop-page-opened'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - activeTab is stable initial value

  // Auto-refresh data when switching tabs
  useEffect(() => {
    // Skip if this is the same tab (not a change)
    if (previousTabRef.current === activeTab) {
      return;
    }

    // Trigger event for tab change
    window.dispatchEvent(new CustomEvent('whoop-tab-changed', { 
      detail: { tab: activeTab } 
    }));
    
    previousTabRef.current = activeTab;
  }, [activeTab]);

  // Handle refresh - sync data from WHOOP and refetch
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      
      // Trigger sync from WHOOP API
      const syncResponse = await api.post('/integrations/whoop/sync', {});
      
      if (syncResponse.success) {
        toast.success('Syncing latest data from WHOOP...');
        
        // Refetch status
        await refetchStatus();
        
        // Dispatch event to notify child components to refetch
        window.dispatchEvent(new CustomEvent('whoop-refresh-requested'));
        
        // Wait a bit for sync to process, then refetch
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('whoop-page-opened'));
          toast.success('Data refreshed successfully');
        }, 2000);
      } else {
        throw new Error('Failed to trigger sync');
      }
    } catch (error) {
      console.error('[WHOOP Page] Failed to refresh data:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to refresh data. Please try again.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle WHOOP OAuth connection
  const handleConnectWhoop = async () => {
    try {
      setIsConnecting(true);
      
      console.log('[WHOOP Page] Initiating OAuth connection...');
      
      const response = await api.post<{
        authUrl: string;
        state: string;
      }>('/integrations/oauth/initiate', {
        provider: 'whoop',
      });

      if (!response.success || !response.data?.authUrl) {
        throw new Error('Failed to get authorization URL');
      }

      console.log('[WHOOP Page] Redirecting to WHOOP authorization page...', {
        hasAuthUrl: !!response.data.authUrl,
      });

      // Redirect user to WHOOP authorization page
      window.location.href = response.data.authUrl;
      
      // Note: User will be redirected back to /auth/whoop/callback after authorization
    } catch (error) {
      console.error('[WHOOP Page] Failed to initiate WHOOP connection:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to connect WHOOP. Please ensure WHOOP credentials are configured in settings.'
      );
      setIsConnecting(false);
    }
  };

  return (
    <DashboardLayout activeTab="whoop">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  WHOOP Analytics
                </span>
              </h1>
              <p className="text-slate-400">
                Comprehensive recovery, sleep, and strain insights
              </p>
            </div>
            {/* Refresh Button - Show when connected */}
            {(statusData?.isConnected || isConnectedRef.current) && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoadingStatus}
                variant="outline"
                size="sm"
                className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Connection Status Banner */}
          {isLoadingStatus ? (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400 mr-2" />
              <span className="text-slate-400">Loading connection status...</span>
            </div>
          ) : statusError ? (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Failed to load connection status</p>
                  <p className="text-sm text-red-300/70">{statusError.message || 'Unknown error'}</p>
                </div>
              </div>
              <Button
                onClick={() => refetchStatus()}
                variant="outline"
                size="sm"
                className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              >
                Retry
              </Button>
            </div>
          ) : statusData && !statusData.isConnected && !statusData.hasCredentials ? (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-medium">WHOOP OAuth not configured</p>
                  <p className="text-sm text-yellow-300/70">Please add your WHOOP Client ID and Client Secret in settings to connect.</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/settings?tab=integrations')}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                View Settings
              </Button>
            </div>
          ) : statusData && !statusData.isConnected ? (
            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-orange-400 font-medium">WHOOP disconnected</p>
                  <p className="text-sm text-orange-300/70">
                    Status: {statusData.status === 'pending' ? 'Pending connection' : 'Disconnected'}
                    {statusData.lastSyncAt && (
                      <span className="ml-2">
                        • Last sync: {new Date(statusData.lastSyncAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConnectWhoop}
                  disabled={isConnecting || !statusData.hasCredentials}
                  variant="outline"
                  size="sm"
                  className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect WHOOP
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/settings?tab=integrations')}
                  variant="outline"
                  size="sm"
                  className="bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          ) : statusData && statusData.isConnected ? (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div className="flex-1">
                  <p className="text-green-400 font-medium">WHOOP connected</p>
                  <div className="flex items-center gap-4 text-sm text-green-300/70 mt-1 flex-wrap">
                    {statusData.email && (
                      <span className="flex items-center gap-1">
                        <span className="text-green-400">Email:</span> {statusData.email}
                      </span>
                    )}
                    {statusData.connectedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Connected: {new Date(statusData.connectedAt).toLocaleDateString()}
                      </span>
                    )}
                    {statusData.lastSyncAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last sync: {new Date(statusData.lastSyncAt).toLocaleString()}
                      </span>
                    )}
                    {statusData.webhookRegistered && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Webhook active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConnectWhoop}
                  disabled={isConnecting}
                  variant="outline"
                  size="sm"
                  className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reconnecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Reconnect WHOOP
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/settings?tab=integrations')}
                  variant="outline"
                  size="sm"
                  className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          ) : null}

          {/* Loading Skeleton when status is loading or initial load */}
          {(isLoadingStatus || showInitialSkeleton) ? (
            <div className="space-y-8">
              {/* Metrics Skeleton */}
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

              {/* Tab Navigation Skeleton */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-r from-white/5 via-white/5 to-white/5 border border-white/10 backdrop-blur-xl overflow-x-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-12 w-24 rounded-xl bg-slate-700/50 flex-shrink-0" />
                ))}
              </div>
              
              {/* Tab Content Skeleton */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
                      <Skeleton className="h-5 w-32 mb-4 bg-slate-700/50" />
                      <Skeleton className="h-64 w-full rounded-lg bg-slate-700/50" />
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 p-6">
                  <Skeleton className="h-6 w-48 mb-4 bg-slate-700/50" />
                  <Skeleton className="h-96 w-full rounded-lg bg-slate-700/50" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Current Metrics - Always show (has own loading state) */}
              <WhoopMetrics />

              {/* Tabs - Always show (components have own loading states) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            {/* Beautiful Custom Tab List */}
            <div className="relative mb-8">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gradient-to-r from-white/5 via-white/5 to-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-purple-500/10 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp, gradient: 'from-purple-500 via-pink-500 to-purple-500', color: 'text-purple-400' },
                  // { id: 'recoveries', label: 'Recoveries', icon: Heart, gradient: 'from-green-500 via-emerald-500 to-green-500', color: 'text-green-400' },
                  { id: 'recovery', label: 'Recovery', icon: Heart, gradient: 'from-red-500 via-rose-500 to-red-500', color: 'text-red-400' },
                  { id: 'sleep', label: 'Sleep', icon: Moon, gradient: 'from-blue-500 via-cyan-500 to-blue-500', color: 'text-blue-400' },
                  { id: 'strain', label: 'Strain', icon: Activity, gradient: 'from-purple-500 via-violet-500 to-purple-500', color: 'text-purple-400' },
                  { id: 'stress', label: 'Stress', icon: Brain, gradient: 'from-rose-500 via-pink-500 to-rose-500', color: 'text-rose-400' },
                  { id: 'cycles', label: 'Cycles', icon: Calendar, gradient: 'from-indigo-500 via-purple-500 to-indigo-500', color: 'text-indigo-400' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm
                        transition-all duration-300 whitespace-nowrap cursor-pointer
                        ${isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeWhoopTab"
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.gradient} opacity-90 shadow-lg shadow-purple-500/30`}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <motion.span
                        className="relative z-10"
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.color}`} />
                      </motion.span>
                      <span className="relative z-10">{tab.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white shadow-lg"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {activeTab === 'overview' && (
                  <TabsContent value="overview" className="mt-0">
                    <WhoopOverview />
                  </TabsContent>
                )}
                {activeTab === 'recoveries' && (
                  <TabsContent value="recoveries" className="mt-0">
                    <RecoveriesTable />
                  </TabsContent>
                )}
                {activeTab === 'recovery' && (
                  <TabsContent value="recovery" className="mt-0">
                    <RecoveryChart />
                  </TabsContent>
                )}
                {activeTab === 'sleep' && (
                  <TabsContent value="sleep" className="mt-0">
                    <SleepStagesChart />
                  </TabsContent>
                )}
                {activeTab === 'strain' && (
                  <TabsContent value="strain" className="mt-0">
                    <StrainChart />
                  </TabsContent>
                )}
                {activeTab === 'stress' && (
                  <TabsContent value="stress" className="mt-0">
                    <StressMonitor />
                  </TabsContent>
                )}
                {activeTab === 'cycles' && (
                  <TabsContent value="cycles" className="mt-0">
                    <CycleAnalysis />
                  </TabsContent>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
            </>
          )}

          {/* Empty state when not connected - show connect CTA and preview */}
          {!isLoadingStatus && statusData && !statusData.isConnected && !isConnectedRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 md:p-12 text-center"
            >
              <div className="max-w-lg mx-auto">
                <Heart className="w-16 h-16 text-purple-400/60 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Connect WHOOP to see your analytics</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Once connected, you&apos;ll see recovery scores, sleep analysis, strain patterns, and stress insights from your WHOOP device.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {statusData.hasCredentials ? (
                    <Button
                      onClick={handleConnectWhoop}
                      disabled={isConnecting}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect WHOOP
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push('/settings?tab=integrations')}
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure in Settings
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </div>
    </DashboardLayout>
  );
}

