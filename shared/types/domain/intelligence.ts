/**
 * @file Intelligence Domain Types
 * @description Type definitions for Epic 08: Cross-Domain Intelligence
 */

// ============================================
// DAILY ANALYSIS REPORT TYPES
// ============================================

export interface DailySnapshot {
  date: string;
  totalScore: number;
  componentScores: Record<string, number>;
  scoreDelta: number;
  weekOverWeekDelta: number;
  recoveryScore: number | null;
  sleepHours: number | null;
  strainScore: number | null;
  moodLevel: number;
  stressLevel: number;
  energyLevel: number;
  workoutsCompleted: number;
  workoutsScheduled: number;
  mealsLogged: number;
  calorieAdherence: number | null;
  waterIntakePercentage: number | null;
  habitsCompleted: number;
  habitsTotal: number;
  streakDays: number;
}

export interface StructuredInsight {
  id: string;
  claim: string;
  evidence: string[];
  impact: string;
  action: string;
  confidence: 'high' | 'medium' | 'low';
  pillars_connected: string[];
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  tradeOffs?: string;
  safetyNote?: string;
}

export interface CrossDomainInsight {
  domains: string[];
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak';
  direction: 'positive' | 'negative';
  evidence_window_days: number;
}

export interface Prediction {
  type: string;
  predicted_value: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

export interface RiskFlag {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
}

export interface NextBestAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  pillar: string;
  reasoning?: string;
}

export interface CoachingDirective {
  headline: string;
  toneRecommendation: 'supportive' | 'direct' | 'tough_love';
  focusAreas: string[];
  avoidTopics: string[];
}

export interface DailyAnalysisReport {
  userId: string;
  reportDate: string;
  snapshot: DailySnapshot;
  insights: StructuredInsight[];
  crossDomainInsights: CrossDomainInsight[];
  predictions: Prediction[];
  risks: RiskFlag[];
  actions: NextBestAction[];
  coachingDirective: CoachingDirective;
  generatedAt: string;
  generationModel: string;
}

// ============================================
// CONTRADICTION TYPES
// ============================================

export type ContradictionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ContradictionStatus = 'detected' | 'notified' | 'resolved' | 'dismissed';

export interface StoredContradiction {
  id: string;
  userId: string;
  ruleId: string;
  pillarA: string;
  pillarB: string;
  severity: ContradictionSeverity;
  evidence: {
    pillar_a_data: Record<string, unknown>;
    pillar_b_data: Record<string, unknown>;
    threshold_violated: string;
  };
  aiCorrection: string | null;
  status: ContradictionStatus;
  detectedAt: string;
  resolvedAt: string | null;
  description: string;
}

export interface ContradictionSummary {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// ============================================
// SCORE TYPES
// ============================================

export interface ComponentScores {
  workout: number;
  nutrition: number;
  wellbeing: number;
  biometrics: number;
  engagement: number;
  consistency: number;
}

export interface DailyScore {
  userId: string;
  date: string;
  totalScore: number;
  componentScores: ComponentScores;
  explanation: string;
  flags: {
    anomaly_detected?: boolean;
    low_confidence?: boolean;
    requires_review?: boolean;
  };
}

export interface ScoreTrendPoint {
  date: string;
  totalScore: number;
  componentScores: ComponentScores;
}

// ============================================
// WEEKLY REPORT TYPES
// ============================================

export interface WeeklyReportSummary {
  avgTotalScore: number;
  avgComponentScores: ComponentScores;
  scoreTrend: 'improving' | 'stable' | 'declining';
  bestDay: { date: string; score: number } | null;
  worstDay: { date: string; score: number } | null;
  topInsights: string[];
  totalInsightsCount: number;
  totalRiskCount: number;
  contradictionCounts: ContradictionSummary;
  dailyReportCount: number;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekEndDate: string;
  dailyReportIds: string[];
  summary: WeeklyReportSummary;
  narrative: string | null;
  generatedAt: string;
}

// ============================================
// PREDICTION ACCURACY TYPES
// ============================================

export interface PredictionAccuracyStat {
  overallAccuracy: number;
  byType: Record<string, { accuracy: number; count: number }>;
  recentPredictions: Array<{
    date: string;
    type: string;
    predicted: number;
    actual: number;
    accuracyPct: number;
  }>;
  totalTracked: number;
}

// ============================================
// BEST DAY FORMULA TYPES
// ============================================

export interface BestDayFormula {
  avgSleep: number | null;
  exerciseRate: number | null;
  avgStress: number | null;
  dataPoints: number;
  confidence: 'high' | 'medium' | 'low';
  criteria: Array<{
    label: string;
    threshold: string;
    met: boolean;
  }>;
}

export interface FormulaProgress {
  achievementScore: number;
  formula: BestDayFormula;
  streak: number;
  todayMetrics: {
    sleepHours: number | null;
    exercised: boolean;
    stressLevel: number | null;
  };
}

// ============================================
// INSIGHT FEEDBACK TYPES
// ============================================

export interface InsightFeedback {
  insightId: string;
  reportDate: string;
  useful: boolean;
  comment?: string;
}

// ============================================
// REPORT HISTORY TYPES
// ============================================

export interface ReportHistoryItem {
  date: string;
  totalScore: number;
  insightsCount: number;
  riskCount: number;
}

export interface WeeklyHistoryItem {
  weekEndDate: string;
  avgScore: number;
  reportCount: number;
  generatedAt: string;
}
