"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Settings,
  Shield,
  Trash2,
  Eye,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { confirm } from "@/components/common/ConfirmDialog";
import {
  emotionService,
  type EmotionTrend,
  type EmotionCategory,
  type EmotionPreferences,
  getEmotionColor,
  getEmotionEmoji,
  getEmotionLabel,

} from "@/src/shared/services/emotion.service";

interface EmotionTrendsWidgetProps {
  compact?: boolean;
  showPrivacyControls?: boolean;
  onViewDetails?: () => void;
}

export function EmotionTrendsWidget({
  compact = false,
  showPrivacyControls = true,
  onViewDetails,
}: EmotionTrendsWidgetProps) {
  const [trends, setTrends] = useState<EmotionTrend | null>(null);
  const [preferences, setPreferences] = useState<EmotionPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [trendsResponse, prefsResponse] = await Promise.all([
        emotionService.getTrends(14), // Last 2 weeks
        emotionService.getPreferences(),
      ]);

      if (trendsResponse.success && trendsResponse.data) {
        setTrends(trendsResponse.data);
      }

      if (prefsResponse.success && prefsResponse.data) {
        setPreferences(prefsResponse.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load emotion data:", err);
      setError((err as Error).message || "Failed to load emotion data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLogging = async () => {
    if (!preferences) return;

    try {
      const response = await emotionService.updatePreferences({
        emotionLoggingEnabled: !preferences.emotionLoggingEnabled,
      });

      if (response.success) {
        setPreferences({
          ...preferences,
          emotionLoggingEnabled: !preferences.emotionLoggingEnabled,
        });
      }
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const handleDeleteAllLogs = async () => {
    const confirmed = await confirm({
      title: "Delete All Emotion Data",
      description: "Are you sure you want to delete all emotion data? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await emotionService.deleteAllLogs();
      if (response.success) {
        setTrends(null);
        loadData();
      }
    } catch (err) {
      console.error("Failed to delete emotion logs:", err);
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendLabel = (trend?: string) => {
    switch (trend) {
      case "improving":
        return "Improving";
      case "declining":
        return "Needs attention";
      default:
        return "Stable";
    }
  };

  // Get top 4 emotions for distribution display
  const getTopEmotions = (): Array<{ category: EmotionCategory; count: number; percentage: number }> => {
    if (!trends?.emotionDistribution) return [];

    const total = Object.values(trends.emotionDistribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Object.entries(trends.emotionDistribution)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({
        category: category as EmotionCategory,
        count,
        percentage: (count / total) * 100,
      }));
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (preferences && !preferences.emotionLoggingEnabled) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-white">Emotional Wellbeing</h3>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Shield className="w-10 h-10 text-slate-500 mb-3" />
          <p className="text-slate-400 mb-4">
            Emotion tracking is currently disabled
          </p>
          <button
            onClick={handleToggleLogging}
            className="px-4 py-2 rounded-lg bg-pink-500/20 text-pink-400 text-sm font-medium hover:bg-pink-500/30 transition-colors"
          >
            Enable Emotion Tracking
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-pink-400" />
          <h3 className="font-semibold text-white">Emotional Wellbeing</h3>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const topEmotions = getTopEmotions();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <h3 className="font-semibold text-white">Emotional Wellbeing</h3>
          </div>

          <div className="flex items-center gap-2">
            {showPrivacyControls && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Emotion Logging</span>
                  </div>
                  <button
                    onClick={handleToggleLogging}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      preferences?.emotionLoggingEnabled
                        ? "bg-pink-500"
                        : "bg-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences?.emotionLoggingEnabled
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                <button
                  onClick={handleDeleteAllLogs}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Emotion Data
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="p-5">
        {!trends || topEmotions.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400">
              No emotion data yet. Start a voice call to track emotions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dominant Emotion */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getEmotionEmoji(trends.dominantEmotion)}</span>
                <div>
                  <p className="text-sm text-slate-400">Primary Emotion</p>
                  <p className="text-lg font-semibold text-white">
                    {getEmotionLabel(trends.dominantEmotion)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(trends.trend)}
                <span className="text-sm text-slate-400">{getTrendLabel(trends.trend)}</span>
              </div>
            </div>

            {/* Emotion Distribution */}
            {!compact && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Last 14 Days
                </p>
                <div className="space-y-2">
                  {topEmotions.map(({ category, percentage }) => (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-lg">{getEmotionEmoji(category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-300">
                            {getEmotionLabel(category)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: getEmotionColor(category) }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Emotions */}
            {!compact && trends.recentEmotions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Recent
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {trends.recentEmotions.slice(0, 8).map((emotion, index) => (
                    <div
                      key={index}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1"
                      title={`${getEmotionLabel(emotion.category)} - ${emotion.confidence}% confidence`}
                    >
                      <span className="text-sm">{getEmotionEmoji(emotion.category)}</span>
                      <span className="text-xs text-slate-400">
                        {getEmotionLabel(emotion.category)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Score */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-sm text-slate-400">Detection Confidence</span>
              <span className="text-sm font-medium text-white">
                {trends.averageConfidence.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default EmotionTrendsWidget;

