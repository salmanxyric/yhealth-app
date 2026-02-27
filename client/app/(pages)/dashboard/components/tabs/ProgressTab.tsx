'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Ruler,
  Camera,
  Flame,
  Trophy,
  Loader2,
  Plus,
  RefreshCw,
  Calendar,
  Activity,
  Target,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { WeightTrendChart } from '../progress/WeightTrendChart';
import { BMITrendChart } from '../progress/BMITrendChart';
import { WeeklyProgressChart } from '../progress/WeeklyProgressChart';
import { MonthlyProgressChart } from '../progress/MonthlyProgressChart';
import { MeasurementTrendChart } from '../progress/MeasurementTrendChart';
import {
  calculateBMI,
  getBMICategory,
  filterByDateRange,
  calculateWeeklyChange,
  calculateConsistencyScore,
  getTimePeriodLabel,
} from '../progress/utils/progressCalculations';
import { LogMeasurementsModal } from './progress/LogMeasurementsModal';
import { UploadPhotoModal } from './progress/UploadPhotoModal';
import { PhotoComparisonWithAI } from './progress/PhotoComparisonWithAI';
import toast from 'react-hot-toast';

// Types
interface WeightRecord {
  date: string;
  weightKg: number;
}

interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  bicepLeft?: number;
  bicepRight?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  neck?: number;
  shoulders?: number;
}

interface MeasurementRecord {
  date: string;
  measurements: BodyMeasurements;
}

interface ProgressPhoto {
  id: string;
  recordDate: string;
  photoType: 'front' | 'side' | 'back';
  photoUrl?: string;
}

interface AssessmentResponse {
  bodyStats?: {
    heightCm?: number;
  };
  baselineData?: {
    bodyStats?: {
      heightCm?: number;
    };
  };
  body_stats?: {
    heightCm?: number;
  };
  responses?: Array<{
    questionId?: string;
    question?: string;
    answer?: string | number;
  }>;
}

interface UserProfile {
  heightCm?: number;
  height?: number;
}

interface ApiError {
  message?: string;
  response?: {
    data?: {
      error?: string | { message?: string };
    };
    status?: number;
  };
  statusCode?: number;
}

interface ProgressSummary {
  weight: {
    current: number | null;
    starting: number | null;
    lowest: number | null;
    highest: number | null;
    change: number | null;
    trend: 'up' | 'down' | 'stable';
    history: WeightRecord[];
  };
  measurements: {
    current: BodyMeasurements | null;
    starting: BodyMeasurements | null;
    changes: Partial<BodyMeasurements> | null;
  };
  photos: {
    count: number;
    latest: ProgressPhoto[];
    firstSet: ProgressPhoto[];
  };
  streak: {
    current: number;
    longest: number;
  };
  workouts: {
    totalCompleted: number;
    thisWeek: number;
    thisMonth: number;
  };
}


// Enhanced Stat Card Component
function StatCard({
  icon,
  label,
  value,
  change,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number | null;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-xl p-4 sm:p-5 hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-sm text-slate-400 block font-medium truncate">{label}</span>
          {subtitle && <span className="text-xs text-slate-500 mt-0.5 truncate block">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent truncate">{value}</span>
        {change !== undefined && change !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center text-xs sm:text-sm font-medium px-2 py-1 rounded-lg shrink-0 ${
              change > 0
                ? 'text-red-400 bg-red-500/10'
                : change < 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400 bg-slate-500/10'
            }`}
          >
            {change > 0 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> : change < 0 ? <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> : <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />}
            {Math.abs(change).toFixed(1)} kg
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Measurement Row Component
function MeasurementRow({
  label,
  current,
  change,
  index,
}: {
  label: string;
  current?: number;
  change?: number;
  index?: number;
}) {
  if (current === undefined) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index || 0) * 0.05 }}
      whileHover={{ scale: 1.02, x: 4 }}
      className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-white/5 to-white/5 hover:from-white/10 hover:to-white/10 transition-all border border-white/10 hover:border-teal-500/30 shadow-sm hover:shadow-lg backdrop-blur-sm group"
    >
      <span className="text-slate-200 font-medium text-sm sm:text-base group-hover:text-white transition-colors">{label}</span>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
          {current} cm
        </span>
        {change !== undefined && change !== 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm ${
              change > 0
                ? 'text-red-400 bg-red-500/20 border border-red-500/30'
                : 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            {change > 0 ? '+' : ''}{change.toFixed(1)}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

// Photo Comparison Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PhotoComparison({
  firstSet,
  latestSet,
  onUploadClick,
}: {
  firstSet: ProgressPhoto[];
  latestSet: ProgressPhoto[];
  onUploadClick?: () => void;
}) {
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back'>('front');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const firstPhoto = firstSet.find((p) => p.photoType === selectedType);
  const latestPhoto = latestSet.find((p) => p.photoType === selectedType);

  const handleImageError = (photoId: string) => {
    setImageErrors((prev) => new Set(prev).add(photoId));
  };

  if (firstSet.length === 0 && latestSet.length === 0) {
    return (
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center">
            <Camera className="w-8 h-8 text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white mb-1">No progress photos yet</p>
            <p className="text-sm text-slate-400 mb-6">
              Upload before and after photos to track your visual progress
            </p>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-medium rounded-xl transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Upload Your First Photo
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Photo Type Selector */}
      <div className="flex border-b border-white/10 bg-white/5">
        {(['front', 'side', 'back'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex-1 py-4 text-sm font-medium capitalize transition-all relative ${
              selectedType === type
                ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {type}
            {selectedType === type && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Photo Comparison */}
      <div className="grid grid-cols-2 gap-6 p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Before</span>
            {firstPhoto && (
              <span className="text-xs text-slate-500">{firstPhoto.recordDate}</span>
            )}
          </div>
          {firstPhoto?.photoUrl && !imageErrors.has(`first-${firstPhoto.id}`) ? (
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstPhoto.photoUrl}
                alt="Before"
                className="w-full h-full object-cover"
                onError={() => handleImageError(`first-${firstPhoto.id}`)}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center shadow-lg">
              <Camera className="w-12 h-12 text-slate-600 mb-2" />
              <span className="text-xs text-slate-500">No {selectedType} photo</span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">After</span>
            {latestPhoto && (
              <span className="text-xs text-slate-500">{latestPhoto.recordDate}</span>
            )}
          </div>
          {latestPhoto?.photoUrl && !imageErrors.has(`latest-${latestPhoto.id}`) ? (
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 border-2 border-emerald-500/30 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={latestPhoto.photoUrl}
                alt="After"
                className="w-full h-full object-cover"
                onError={() => handleImageError(`latest-${latestPhoto.id}`)}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center shadow-lg">
              <Camera className="w-12 h-12 text-slate-600 mb-2" />
              <span className="text-xs text-slate-500">No {selectedType} photo</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Main Progress Tab Component
export function ProgressTab() {
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements' | 'photos' | 'workouts' | 'analytics'>('weight');
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [timePeriod, setTimePeriod] = useState<number | null>(90); // Default to 90 days
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementRecord[]>([]);

  // Fetch user height from assessment - try multiple sources
  const fetchUserHeight = useCallback(async () => {
    try {
      // Try to get from assessment responses
      const assessmentResponse = await api.get<AssessmentResponse>('/assessment/goals');
      if (assessmentResponse.success && assessmentResponse.data) {
        const data = assessmentResponse.data;
        
        // Try different possible structures for bodyStats
        let heightCm: number | null = null;
        
        // Structure 1: Direct bodyStats
        if (data.bodyStats?.heightCm && typeof data.bodyStats.heightCm === 'number') {
          heightCm = data.bodyStats.heightCm;
        }
        // Structure 2: Nested in baselineData
        else if (data.baselineData?.bodyStats?.heightCm && typeof data.baselineData.bodyStats.heightCm === 'number') {
          heightCm = data.baselineData.bodyStats.heightCm;
        }
        // Structure 3: In assessment response body_stats field
        else if (data.body_stats?.heightCm && typeof data.body_stats.heightCm === 'number') {
          heightCm = data.body_stats.heightCm;
        }
        // Structure 4: Try to find in responses array
        else if (Array.isArray(data.responses)) {
          const heightResponse = data.responses.find((r) => 
            r.questionId?.toLowerCase().includes('height') || 
            r.question?.toLowerCase().includes('height')
          );
          if (heightResponse?.answer) {
            const heightValue = typeof heightResponse.answer === 'number' 
              ? heightResponse.answer 
              : parseFloat(String(heightResponse.answer));
            if (!isNaN(heightValue) && heightValue > 50 && heightValue < 300) {
              heightCm = heightValue; // Reasonable range for height in cm
            }
          }
        }
        
        if (heightCm && heightCm > 0) {
          setUserHeight(heightCm);
          console.log('[ProgressTab] User height fetched:', heightCm, 'cm');
        }
      }
      
      // Also try to get from user profile/auth endpoint
      try {
        const profileResponse = await api.get<{ user?: UserProfile }>('/auth/me');
        if (profileResponse.success && profileResponse.data?.user) {
          const user = profileResponse.data.user;
          // Check various possible fields
          if (user.heightCm && typeof user.heightCm === 'number') {
            setUserHeight(user.heightCm);
          } else if (user.height && typeof user.height === 'number') {
            setUserHeight(user.height);
          }
        }
      } catch (_profileErr) {
        // Ignore profile fetch errors - height is optional
      }
    } catch (err) {
      console.warn('[ProgressTab] Could not fetch user height:', err);
      // Height is optional - BMI chart will show a message if height is not available
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      if (!isRefreshing) {
        setIsLoading(true);
      }
      
      console.log('[ProgressTab] Fetching progress summary...');
      const response = await api.get<{ summary: ProgressSummary }>('/progress/summary');
      
      if (response.success && response.data) {
        // Server returns: { success: true, data: { summary: ... } }
        // API client returns: { success: true, data: { summary: ... } }
        // So we access: response.data.summary
        const summaryData = response.data.summary;
        
        console.log('[ProgressTab] Summary data received:', {
          hasSummary: !!summaryData,
          hasWeight: !!summaryData?.weight,
          hasHistory: !!summaryData?.weight?.history,
          historyLength: summaryData?.weight?.history?.length || 0,
          historyIsArray: Array.isArray(summaryData?.weight?.history),
          firstItem: summaryData?.weight?.history?.[0],
          lastItem: summaryData?.weight?.history?.[summaryData?.weight?.history?.length - 1],
          weightCurrent: summaryData?.weight?.current,
          weightStarting: summaryData?.weight?.starting,
          measurementsCount: summaryData?.measurements ? 1 : 0,
          photosCount: summaryData?.photos?.count || 0,
          streakCurrent: summaryData?.streak?.current || 0,
          workoutsTotal: summaryData?.workouts?.totalCompleted || 0,
        });
        
        if (summaryData) {
          // Ensure history is an array and properly formatted
          if (summaryData.weight && summaryData.weight.history) {
            if (!Array.isArray(summaryData.weight.history)) {
              console.warn('[ProgressTab] Weight history is not an array, converting...');
              summaryData.weight.history = [];
            } else {
              // Validate history items have required fields
              summaryData.weight.history = summaryData.weight.history.filter((item) => {
                const isValid = item && 
                  typeof item.date === 'string' && 
                  typeof item.weightKg === 'number' && 
                  !isNaN(item.weightKg);
                if (!isValid) {
                  console.warn('[ProgressTab] Invalid weight history item:', item);
                }
                return isValid;
              });
              
              console.log('[ProgressTab] Validated weight history:', {
                originalLength: summaryData.weight.history.length,
                filteredLength: summaryData.weight.history.length,
              });
            }
          }
          
          setSummary(summaryData);
          setLastUpdated(new Date());
          console.log('[ProgressTab] Summary set successfully');
        } else {
          console.warn('[ProgressTab] Summary data is null or undefined - user may not have logged data yet');
          // Set empty summary instead of error - user might not have logged data yet
          setSummary(null);
          setLastUpdated(new Date());
        }
      } else {
        console.error('[ProgressTab] Invalid response structure:', {
          success: response.success,
          hasData: !!response.data,
          response: response,
        });
        setError('Failed to load progress data. Invalid response from server.');
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('[ProgressTab] Failed to fetch progress summary:', {
        error: err,
        message: apiError?.message,
        response: apiError?.response?.data,
        status: apiError?.statusCode || apiError?.response?.status,
      });
      
      // Handle different error types
      let errorMessage = 'Failed to load progress data. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('Network') || err.message.includes('connect')) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Please sign in to view your progress.';
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (apiError?.response?.data?.error) {
        const errorData = apiError.response.data.error;
        errorMessage = typeof errorData === 'string' 
          ? errorData 
          : (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string')
            ? errorData.message 
            : errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSummary();
  }, [fetchSummary]);

  // Fetch measurement history
  const fetchMeasurementHistory = useCallback(async () => {
    try {
      const response = await api.get<{ history?: MeasurementRecord[] }>('/progress/measurements');
      if (response.success && response.data) {
        // API returns { success: true, data: { history: [...] } }
        const history = response.data.history || [];
        setMeasurementHistory(Array.isArray(history) ? history : []);
      }
    } catch (err) {
      console.error('[ProgressTab] Failed to fetch measurement history:', err);
      setMeasurementHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchUserHeight();
    fetchMeasurementHistory();
  }, [fetchSummary, fetchUserHeight, fetchMeasurementHistory]);

  // Listen for custom event to open weight modal from chart empty state
  useEffect(() => {
    const handleOpenWeightModal = () => {
      setShowWeightModal(true);
    };
    
    window.addEventListener('openWeightModal', handleOpenWeightModal);
    return () => {
      window.removeEventListener('openWeightModal', handleOpenWeightModal);
    };
  }, []);

  // Extract data from summary with defaults
  const defaultSummary = {
    weight: { current: null, starting: null, lowest: null, highest: null, change: null, trend: 'stable' as const, history: [] },
    measurements: { current: null, starting: null, changes: null },
    photos: { count: 0, latest: [], firstSet: [] },
    streak: { current: 0, longest: 0 },
    workouts: { totalCompleted: 0, thisWeek: 0, thisMonth: 0 },
  };

  const { weight, measurements, photos, streak, workouts } = summary || defaultSummary;

  // Debug: Log weight history structure when summary changes
  useEffect(() => {
    if (summary) {
      console.log('[ProgressTab] Summary structure:', {
        hasWeight: !!summary.weight,
        hasHistory: !!summary.weight?.history,
        historyLength: summary.weight?.history?.length || 0,
        historyType: Array.isArray(summary.weight?.history) ? 'array' : typeof summary.weight?.history,
        firstItem: summary.weight?.history?.[0],
        weightCurrent: summary.weight?.current,
      });
    } else {
      console.log('[ProgressTab] Summary is null - using defaults');
    }
  }, [summary]);

  // Calculate BMI and other metrics
  const currentBMI = useMemo(() => {
    if (!userHeight || !weight?.current) return null;
    return calculateBMI(weight.current, userHeight);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userHeight, weight?.current]);

  const bmiCategory = useMemo(() => {
    if (!currentBMI) return null;
    return getBMICategory(currentBMI);
  }, [currentBMI]);

  const weeklyChange = useMemo(() => {
    if (!weight?.history || weight.history.length === 0) return null;
    return calculateWeeklyChange(weight.history);
  }, [weight?.history]);

  const consistencyScore = useMemo(() => {
    if (!weight?.history || weight.history.length === 0) return 0;
    return calculateConsistencyScore(weight.history, 4);
  }, [weight?.history]);

  // Filter data by time period
  const filteredWeightHistory = useMemo(() => {
    if (!weight || !weight.history || !Array.isArray(weight.history)) {
      console.log('[ProgressTab] No weight history available for filtering');
      return [];
    }
    
    if (weight.history.length === 0) {
      console.log('[ProgressTab] Weight history is empty');
      return [];
    }
    
    // Ensure all items have required fields
    const validHistory = weight.history.filter((item) => {
      const isValid = item && 
        typeof item.date === 'string' && 
        typeof item.weightKg === 'number' && 
        !isNaN(item.weightKg) &&
        item.weightKg > 0;
      return isValid;
    });
    
    if (validHistory.length !== weight.history.length) {
      console.warn('[ProgressTab] Filtered out invalid weight history items:', {
        original: weight.history.length,
        valid: validHistory.length,
      });
    }
    
    if (validHistory.length === 0) {
      console.log('[ProgressTab] No valid weight history items after filtering');
      return [];
    }
    
    // Apply time period filter if specified
    const filtered = timePeriod 
      ? filterByDateRange(validHistory, timePeriod)
      : validHistory;
    
    console.log('[ProgressTab] Filtered weight history:', {
      originalLength: weight.history.length,
      validLength: validHistory.length,
      filteredLength: filtered.length,
      timePeriod: timePeriod || 'all',
      firstDate: filtered[0]?.date,
      lastDate: filtered[filtered.length - 1]?.date,
    });
    
    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight?.history, timePeriod]);

  const handleLogWeight = async () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;

    setIsSaving(true);
    try {
      const response = await api.post('/progress/weight', { weightKg: weight });
      if (response.success) {
        setShowWeightModal(false);
        setWeightInput('');
        setError(null);
        toast.success('Weight logged successfully!');
        await fetchSummary();
      } else {
        toast.error('Failed to log weight. Please try again.');
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Failed to log weight:', err);
      let errorMessage = 'Failed to log weight. Please try again.';
      if (apiError?.message && typeof apiError.message === 'string') {
        errorMessage = apiError.message;
      } else if (apiError?.response?.data?.error) {
        const errorData = apiError.response.data.error;
        errorMessage = typeof errorData === 'string' 
          ? errorData 
          : (errorData && typeof errorData === 'object' && 'message' in errorData && typeof errorData.message === 'string')
            ? errorData.message 
            : errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMeasurementSuccess = useCallback(() => {
    fetchSummary();
    fetchMeasurementHistory();
  }, [fetchSummary, fetchMeasurementHistory]);

  const handlePhotoSuccess = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load progress data</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchSummary}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const measurementLabels: Record<keyof BodyMeasurements, string> = {
    chest: 'Chest',
    waist: 'Waist',
    hips: 'Hips',
    bicepLeft: 'Left Bicep',
    bicepRight: 'Right Bicep',
    thighLeft: 'Left Thigh',
    thighRight: 'Right Thigh',
    calfLeft: 'Left Calf',
    calfRight: 'Right Calf',
    neck: 'Neck',
    shoulders: 'Shoulders',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent">
            Progress Tracking
          </h2>
          <p className="text-slate-400 mt-1">Monitor your health journey</p>
          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-colors disabled:opacity-50 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {activeTab === 'weight' && (
            <button
              onClick={() => setShowWeightModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Log Weight
            </button>
          )}
          {activeTab === 'measurements' && (
            <button
              onClick={() => setShowMeasurementsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              Log Measurements
            </button>
          )}
          {activeTab === 'photos' && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Upload Photo
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'weight' as const, label: 'Weight', icon: Scale },
          { id: 'measurements' as const, label: 'Measurements', icon: Ruler },
          { id: 'photos' as const, label: 'Photos', icon: Camera },
          // { id: 'workouts' as const, label: 'Workouts', icon: Trophy },
          // { id: 'analytics' as const, label: 'Analytics', icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'weight' && (
          <motion.div
            key="weight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Time Period Filter and View Mode */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400 whitespace-nowrap">Period:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[7, 30, 90, 180, 365, null].map((days) => (
                    <button
                      key={days || 'all'}
                      onClick={() => setTimePeriod(days)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        timePeriod === days
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {days ? `${days}d` : 'All'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 whitespace-nowrap">View:</span>
                <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                  {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                        viewMode === mode
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                icon={<Scale className="w-5 h-5 text-white" />}
                label="Current Weight"
                value={weight.current ? `${weight.current} kg` : '—'}
                change={weight.change}
                color="bg-emerald-500/20"
                subtitle={weight.starting ? `Started: ${weight.starting} kg` : undefined}
              />
              {currentBMI && bmiCategory && (
                <StatCard
                  icon={<Activity className="w-5 h-5 text-white" />}
                  label="BMI"
                  value={currentBMI.toFixed(1)}
                  color={`${bmiCategory.category === 'Normal' ? 'bg-emerald-500/20' : bmiCategory.category === 'Underweight' ? 'bg-blue-500/20' : bmiCategory.category === 'Overweight' ? 'bg-orange-500/20' : 'bg-red-500/20'}`}
                  subtitle={bmiCategory.category}
                />
              )}
              <StatCard
                icon={<Flame className="w-5 h-5 text-white" />}
                label="Current Streak"
                value={`${streak.current} days`}
                color="bg-orange-500/20"
                subtitle={streak.longest > streak.current ? `Best: ${streak.longest} days` : undefined}
              />
            </div>

            {/* Analytics Insights */}
            {(weeklyChange !== null || consistencyScore > 0) && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  Analytics Insights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {weeklyChange !== null && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-sm text-slate-400 mb-1">Weekly Average Change</p>
                      <p className={`text-xl sm:text-2xl font-bold ${weeklyChange < 0 ? 'text-emerald-400' : weeklyChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(2)} kg/week
                      </p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                    <p className="text-sm text-slate-400 mb-1">Consistency Score</p>
                    <p className="text-xl sm:text-2xl font-bold text-cyan-400">{consistencyScore}%</p>
                    <p className="text-xs text-slate-500 mt-1">Days logged (last 4 weeks)</p>
                  </div>
                  {filteredWeightHistory.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-sm text-slate-400 mb-1">Data Points</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{filteredWeightHistory.length}</p>
                      <p className="text-xs text-slate-500 mt-1">{getTimePeriodLabel(timePeriod)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="space-y-8">
              {/* Weight and BMI Charts */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Weight Trend Chart */}
                <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Weight Trend</h3>
                    <div className="flex items-center gap-2 text-sm">
                      {weight.trend === 'down' && (
                        <span className="flex items-center text-emerald-400">
                          <TrendingDown className="w-4 h-4 mr-1" />
                          Losing
                        </span>
                      )}
                      {weight.trend === 'up' && (
                        <span className="flex items-center text-red-400">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Gaining
                        </span>
                      )}
                      {weight.trend === 'stable' && (
                        <span className="flex items-center text-slate-400">
                          <Minus className="w-4 h-4 mr-1" />
                          Stable
                        </span>
                      )}
                    </div>
                  </div>
                  {viewMode === 'daily' && (
                    <WeightTrendChart
                      history={filteredWeightHistory}
                      timePeriod={timePeriod}
                      showTrendLine={true}
                    />
                  )}
                  {viewMode === 'weekly' && (
                    <>
                      {filteredWeightHistory.length > 0 ? (
                        <WeeklyProgressChart
                          weightHistory={filteredWeightHistory}
                          timePeriod={timePeriod}
                        />
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-900/20 rounded-lg border border-white/5">
                          <Calendar className="w-12 h-12 mb-3 text-slate-500 opacity-50" />
                          <p className="text-base font-medium mb-1">No weekly data available</p>
                          <p className="text-sm text-slate-500 mb-4">Log your weight to see weekly breakdown</p>
                          <button
                            onClick={() => setShowWeightModal(true)}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium border border-emerald-500/30"
                          >
                            Log Your First Weight
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {viewMode === 'monthly' && (
                    <>
                      {filteredWeightHistory.length > 0 ? (
                        <MonthlyProgressChart weightHistory={filteredWeightHistory} />
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-900/20 rounded-lg border border-white/5">
                          <Calendar className="w-12 h-12 mb-3 text-slate-500 opacity-50" />
                          <p className="text-base font-medium mb-1">No monthly data available</p>
                          <p className="text-sm text-slate-500 mb-4">Log your weight to see monthly breakdown</p>
                          <button
                            onClick={() => setShowWeightModal(true)}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium border border-emerald-500/30"
                          >
                            Log Your First Weight
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Weight Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <span className="text-xs text-slate-400 block">Starting</span>
                      <span className="text-lg font-semibold text-white">
                        {weight.starting ? `${weight.starting} kg` : '—'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-slate-400 block">Lowest</span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {weight.lowest ? `${weight.lowest} kg` : '—'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-slate-400 block">Highest</span>
                      <span className="text-lg font-semibold text-red-400">
                        {weight.highest ? `${weight.highest} kg` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BMI Chart */}
                <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">BMI Trend</h3>
                    {currentBMI && bmiCategory && (
                      <span className={`text-sm font-medium ${bmiCategory.color}`}>
                        {bmiCategory.category}
                      </span>
                    )}
                  </div>
                  <BMITrendChart
                    weightHistory={filteredWeightHistory}
                    heightCm={userHeight}
                    timePeriod={timePeriod}
                  />
                  {!userHeight && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                      <p className="text-sm text-blue-400 mb-2">Height required for BMI calculation</p>
                      <p className="text-xs text-slate-400">Please update your profile with your height to see BMI trends</p>
                    </div>
                  )}
                  {currentBMI && (
                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <p className="text-sm text-slate-400 mb-1">Current BMI</p>
                      <p className={`text-3xl font-bold ${bmiCategory?.color || 'text-white'}`}>
                        {currentBMI.toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'measurements' && (
          <motion.div
            key="measurements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Body Measurements Section */}
            <div className="bg-gradient-to-br from-white/5 via-white/5 to-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-teal-500/20 via-cyan-500/20 to-blue-500/20 flex items-center justify-center shadow-lg shrink-0">
                    <Ruler className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Body Measurements</h3>
                    <p className="text-xs sm:text-sm text-slate-400">Track your body composition</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMeasurementsModal(true)}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 w-full sm:w-auto"
                >
                  <Plus className="w-5 h-5" />
                  Log Measurements
                </button>
              </div>

              {measurements.current ? (
                <>
                  {/* Measurement List */}
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {(Object.keys(measurementLabels) as (keyof BodyMeasurements)[]).map((key, index) => (
                      <MeasurementRow
                        key={key}
                        label={measurementLabels[key]}
                        current={measurements.current?.[key]}
                        change={measurements.changes?.[key]}
                        index={index}
                      />
                    ))}
                  </div>
                  
                  {/* Measurement Trend Chart */}
                  {measurementHistory.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Measurement Trends</h4>
                        <p className="text-sm text-slate-400">Track your progress over time</p>
                      </div>
                      <MeasurementTrendChart history={measurementHistory} />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center">
                      <Ruler className="w-8 h-8 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white mb-1">No measurements logged yet</p>
                      <p className="text-sm text-slate-400 mb-6">
                        Track your body measurements to see changes over time
                      </p>
                      <button
                        onClick={() => setShowMeasurementsModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-teal-500/20"
                      >
                        Log Your First Measurement
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'photos' && (
          <motion.div
            key="photos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* AI-Powered Photo Comparison */}
            <PhotoComparisonWithAI
              firstSet={photos.firstSet}
              latestSet={photos.latest}
              onUploadClick={() => setShowPhotoModal(true)}
            />

            {/* Photo Gallery */}
            {photos.latest.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-sm shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Camera className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Photo Gallery</h3>
                      <p className="text-sm text-slate-400">{photos.count} photos total</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Photo
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {photos.latest.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="relative group cursor-pointer"
                    >
                      {photo.photoUrl ? (
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/20 group-hover:border-emerald-500/50 transition-all shadow-lg group-hover:shadow-xl group-hover:shadow-emerald-500/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.photoUrl}
                            alt={`${photo.photoType} photo`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="text-white">
                              <div className="font-semibold capitalize text-sm">{photo.photoType}</div>
                              <div className="text-slate-300 text-xs">{new Date(photo.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-600 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'workouts' && (
          <motion.div
            key="workouts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Workout Stats */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Workout Summary</h3>
                  <p className="text-xs sm:text-sm text-slate-400">Your fitness activity overview</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 text-center backdrop-blur-sm"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                    {workouts.thisWeek}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">This Week</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 text-center backdrop-blur-sm"
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                    {workouts.thisMonth}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400">This Month</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 text-center backdrop-blur-sm"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{workouts.totalCompleted}</div>
                  <div className="text-xs sm:text-sm text-slate-400">Total Completed</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Analytics Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* BMI Chart */}
              <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">BMI Trend</h3>
                  {currentBMI && bmiCategory && (
                    <span className={`text-xs sm:text-sm font-medium ${bmiCategory.color}`}>
                      {bmiCategory.category}
                    </span>
                  )}
                </div>
                <BMITrendChart
                  weightHistory={filteredWeightHistory}
                  heightCm={userHeight}
                  timePeriod={timePeriod}
                />
                {!userHeight && (
                  <div className="mt-4 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <p className="text-xs sm:text-sm text-blue-400 mb-1 sm:mb-2">Height required for BMI calculation</p>
                    <p className="text-xs text-slate-400">Please update your profile with your height</p>
                  </div>
                )}
                {currentBMI && (
                  <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <p className="text-xs sm:text-sm text-slate-400 mb-1">Current BMI</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${bmiCategory?.color || 'text-white'}`}>
                      {currentBMI.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>

              {/* Analytics Insights */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-sm shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  Progress Insights
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  {weeklyChange !== null && (
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-xs sm:text-sm text-slate-400 mb-1">Weekly Average Change</p>
                      <p className={`text-xl sm:text-2xl font-bold ${weeklyChange < 0 ? 'text-emerald-400' : weeklyChange > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(2)} kg/week
                      </p>
                    </div>
                  )}
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
                    <p className="text-xs sm:text-sm text-slate-400 mb-1">Consistency Score</p>
                    <p className="text-xl sm:text-2xl font-bold text-cyan-400">{consistencyScore}%</p>
                    <p className="text-xs text-slate-500 mt-1">Days logged (last 4 weeks)</p>
                  </div>
                  {filteredWeightHistory.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 backdrop-blur-sm">
                      <p className="text-xs sm:text-sm text-slate-400 mb-1">Data Points</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{filteredWeightHistory.length}</p>
                      <p className="text-xs text-slate-500 mt-1">{getTimePeriodLabel(timePeriod)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Log Weight</h3>
              </div>
              <div className="mb-4">
                <label className="text-sm text-slate-400 block mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="e.g., 75.5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogWeight}
                  disabled={isSaving || !weightInput}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogMeasurementsModal
        isOpen={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
        onSuccess={handleMeasurementSuccess}
      />

      <UploadPhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onSuccess={handlePhotoSuccess}
      />
    </motion.div>
  );
}
