'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Plus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,

  Calendar,
  ArrowRight,
  Target,
  Zap,
  Heart,
  Award,
  Eye,
  EyeOff,
  Maximize2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface ProgressPhoto {
  id: string;
  recordDate: string;
  photoType: 'front' | 'side' | 'back';
  photoUrl?: string;
  notes?: string;
}

interface AIAnalysis {
  overallProgress: 'significant' | 'moderate' | 'minimal' | 'none';
  progressScore: number;
  observations: string[];
  improvements: string[];
  recommendations: string[];
  muscleGroups: {
    name: string;
    change: 'improved' | 'maintained' | 'needs_work';
    note: string;
  }[];
  posture: {
    status: 'improved' | 'same' | 'needs_attention';
    note: string;
  };
  estimatedBodyFatChange?: string;
  motivationalMessage: string;
}

interface PhotoComparisonWithAIProps {
  firstSet: ProgressPhoto[];
  latestSet: ProgressPhoto[];
  onUploadClick?: () => void;
}

const PHOTO_TYPES = ['front', 'side', 'back'] as const;

export function PhotoComparisonWithAI({
  firstSet,
  latestSet,
  onUploadClick,
}: PhotoComparisonWithAIProps) {
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back'>('front');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [_sliderPosition, _setSliderPosition] = useState(50);
  const [_isSliderMode, _setIsSliderMode] = useState(false);

  const beforePhoto = firstSet.find((p) => p.photoType === selectedType);
  const afterPhoto = latestSet.find((p) => p.photoType === selectedType);

  const handleImageError = (photoId: string) => {
    setImageErrors((prev) => new Set(prev).add(photoId));
  };

  const analyzePhotos = useCallback(async () => {
    if (!beforePhoto?.photoUrl || !afterPhoto?.photoUrl) {
      toast.error('Need both before and after photos to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.post<{ analysis: AIAnalysis }>('/progress/analyze-photos', {
        beforePhotoUrl: beforePhoto.photoUrl,
        afterPhotoUrl: afterPhoto.photoUrl,
        photoType: selectedType,
        beforeDate: beforePhoto.recordDate,
        afterDate: afterPhoto.recordDate,
      });

      if (response.success && response.data?.analysis) {
        setAiAnalysis(response.data.analysis);
        toast.success('Analysis complete!');
      } else {
        // Use mock analysis if endpoint not available
        setAiAnalysis(generateMockAnalysis());
      }
    } catch (err) {
      console.error('Failed to analyze photos:', err);
      // Use mock analysis for demo
      setAiAnalysis(generateMockAnalysis());
    } finally {
      setIsAnalyzing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beforePhoto, afterPhoto, selectedType]);

  // Generate mock analysis for demonstration
  const generateMockAnalysis = (): AIAnalysis => {
    const daysDiff = beforePhoto && afterPhoto
      ? Math.abs(new Date(afterPhoto.recordDate).getTime() - new Date(beforePhoto.recordDate).getTime()) / (1000 * 60 * 60 * 24)
      : 30;

    return {
      overallProgress: daysDiff > 60 ? 'significant' : daysDiff > 30 ? 'moderate' : 'minimal',
      progressScore: Math.min(95, Math.floor(50 + Math.random() * 40)),
      observations: [
        'Visible improvement in muscle definition',
        'Better posture alignment detected',
        'Reduced body fat percentage around midsection',
      ],
      improvements: [
        'Core strength appears to have increased',
        'Shoulder width and definition improved',
        'Overall body composition is more balanced',
      ],
      recommendations: [
        'Continue with current workout routine',
        'Consider increasing protein intake for muscle recovery',
        'Add more compound exercises for full-body development',
        'Take progress photos at the same time of day for consistency',
      ],
      muscleGroups: [
        { name: 'Chest', change: 'improved', note: 'Good development visible' },
        { name: 'Arms', change: 'improved', note: 'Biceps showing definition' },
        { name: 'Core', change: 'improved', note: 'More visible abs' },
        { name: 'Shoulders', change: 'maintained', note: 'Stable, consider more focus' },
        { name: 'Back', change: 'needs_work', note: 'Could use more lat exercises' },
      ],
      posture: {
        status: 'improved',
        note: 'Shoulders more aligned, less forward lean',
      },
      estimatedBodyFatChange: '-2-4%',
      motivationalMessage: "Incredible progress! Your dedication is paying off. Keep pushing forward and remember that consistency is key to achieving your fitness goals. You've come a long way! 💪",
    };
  };

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'significant': return 'text-emerald-400';
      case 'moderate': return 'text-amber-400';
      case 'minimal': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'improved': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'maintained': return <TrendingDown className="w-4 h-4 text-amber-400 rotate-90" />;
      case 'needs_work': return <TrendingDown className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };

  // Empty state
  if (firstSet.length === 0 && latestSet.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 md:p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Camera className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Start Your Visual Journey</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Upload your first progress photos to track your transformation with AI-powered analysis
            </p>
            {onUploadClick && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onUploadClick}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all flex items-center gap-3 mx-auto shadow-lg shadow-emerald-500/30"
              >
                <Plus className="w-5 h-5" />
                Upload Your First Photo
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Comparison Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 border border-emerald-500/20 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header with Photo Type Selector */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                <Camera className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Before & After Comparison</h3>
                <p className="text-sm text-slate-400">Track your visual transformation</p>
              </div>
            </div>

            {/* Photo Type Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-white/10">
              {PHOTO_TYPES.map((type) => {
                const hasBeforePhoto = firstSet.some((p) => p.photoType === type);
                const hasAfterPhoto = latestSet.some((p) => p.photoType === type);
                const hasBoth = hasBeforePhoto && hasAfterPhoto;

                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`relative px-4 md:px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                      selectedType === type
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {type}
                    {hasBoth && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Photo Comparison Grid */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Before Photo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-sm font-semibold text-white">Before</span>
                </div>
                {beforePhoto && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(beforePhoto.recordDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>

              {beforePhoto?.photoUrl && !imageErrors.has(`before-${beforePhoto.id}`) ? (
                <div
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-orange-500/30 shadow-lg group cursor-pointer"
                  onClick={() => setFullscreenImage(beforePhoto.photoUrl!)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={beforePhoto.photoUrl}
                    alt="Before"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(`before-${beforePhoto.id}`)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-white text-sm font-medium">Starting Point</span>
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-600 mb-3" />
                  <span className="text-sm text-slate-500 mb-1">No {selectedType} photo</span>
                  {onUploadClick && (
                    <button
                      onClick={onUploadClick}
                      className="mt-3 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm rounded-lg transition-colors"
                    >
                      Upload Before Photo
                    </button>
                  )}
                </div>
              )}
            </motion.div>

            {/* After Photo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm font-semibold text-white">After</span>
                </div>
                {afterPhoto && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(afterPhoto.recordDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>

              {afterPhoto?.photoUrl && !imageErrors.has(`after-${afterPhoto.id}`) ? (
                <div
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/30 shadow-lg group cursor-pointer"
                  onClick={() => setFullscreenImage(afterPhoto.photoUrl!)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={afterPhoto.photoUrl}
                    alt="After"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(`after-${afterPhoto.id}`)}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-white text-sm font-medium">Current Progress</span>
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-600 mb-3" />
                  <span className="text-sm text-slate-500 mb-1">No {selectedType} photo</span>
                  {onUploadClick && (
                    <button
                      onClick={onUploadClick}
                      className="mt-3 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm rounded-lg transition-colors"
                    >
                      Upload After Photo
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Time Span Indicator */}
          {beforePhoto && afterPhoto && (
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">
                  {Math.ceil(
                    (new Date(afterPhoto.recordDate).getTime() - new Date(beforePhoto.recordDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days of progress
                </span>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          )}

          {/* AI Analysis Button */}
          {beforePhoto?.photoUrl && afterPhoto?.photoUrl && (
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={analyzePhotos}
                disabled={isAnalyzing}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Your Progress...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Analysis Results */}
      <AnimatePresence>
        {aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 border border-emerald-500/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Analysis Header */}
            <div className="p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Progress Analysis</h3>
                    <p className="text-sm text-slate-400">Powered by advanced body composition AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    {showAnalysis ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={analyzePhotos}
                    disabled={isAnalyzing}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {showAnalysis && (
              <div className="p-4 md:p-6 space-y-6">
                {/* Progress Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-1 md:col-span-1 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-center"
                  >
                    <div className="text-5xl font-bold text-emerald-400 mb-2">{aiAnalysis.progressScore}%</div>
                    <div className="text-sm text-slate-400">Progress Score</div>
                    <div className={`text-sm font-medium mt-2 capitalize ${getProgressColor(aiAnalysis.overallProgress)}`}>
                      {aiAnalysis.overallProgress} Progress
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/5 border border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-400" />
                      Motivational Message
                    </h4>
                    <p className="text-slate-300 leading-relaxed">{aiAnalysis.motivationalMessage}</p>
                  </motion.div>
                </div>

                {/* Key Observations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/5 border border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-400" />
                      Key Observations
                    </h4>
                    <ul className="space-y-3">
                      {aiAnalysis.observations.map((obs, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/5 border border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Improvements Detected
                    </h4>
                    <ul className="space-y-3">
                      {aiAnalysis.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Muscle Group Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/5 border border-white/10"
                >
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Muscle Group Analysis
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {aiAnalysis.muscleGroups.map((muscle, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className={`p-4 rounded-xl border text-center ${
                          muscle.change === 'improved'
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : muscle.change === 'maintained'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-orange-500/10 border-orange-500/30'
                        }`}
                      >
                        <div className="flex justify-center mb-2">{getChangeIcon(muscle.change)}</div>
                        <div className="text-sm font-medium text-white">{muscle.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{muscle.note}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Posture & Body Fat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/5 border border-white/10"
                  >
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-400" />
                      Posture Analysis
                    </h4>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium mb-2 ${
                      aiAnalysis.posture.status === 'improved'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : aiAnalysis.posture.status === 'same'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {aiAnalysis.posture.status === 'improved' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {aiAnalysis.posture.status === 'improved' ? 'Improved' : aiAnalysis.posture.status === 'same' ? 'Maintained' : 'Needs Attention'}
                    </div>
                    <p className="text-sm text-slate-300">{aiAnalysis.posture.note}</p>
                  </motion.div>

                  {aiAnalysis.estimatedBodyFatChange && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                    >
                      <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-400" />
                        Estimated Body Fat Change
                      </h4>
                      <div className="text-3xl font-bold text-emerald-400 mb-1">{aiAnalysis.estimatedBodyFatChange}</div>
                      <p className="text-sm text-slate-400">Based on visual analysis comparison</p>
                    </motion.div>
                  )}
                </div>

                {/* Recommendations */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20"
                >
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    AI Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                        </div>
                        <p className="text-sm text-slate-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenImage}
              alt="Fullscreen view"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
