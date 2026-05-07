/**
 * @file Knowledge Graph Domain Types
 * @description Type definitions for the Knowledge Graph visualization system
 */

// ============================================
// NODE TYPES
// ============================================

export type GraphNodeCategory =
  | 'fitness'
  | 'nutrition'
  | 'hydration'
  | 'wellbeing'
  | 'biometrics'
  | 'goals'
  | 'intelligence'
  | 'coaching'
  | 'finance';

export type GraphNodeType =
  // Fitness
  | 'workout_session'
  | 'exercise'
  | 'workout_plan'
  | 'yoga_session'
  // Nutrition
  | 'meal'
  | 'diet_plan'
  // Hydration
  | 'water_intake'
  // Wellbeing
  | 'mood_entry'
  | 'stress_log'
  | 'energy_log'
  | 'journal_entry'
  | 'habit_completion'
  | 'mindfulness_practice'
  | 'emotional_checkin'
  | 'daily_checkin'
  // Biometrics
  | 'sleep_session'
  | 'recovery_score'
  | 'strain_score'
  // Goals
  | 'health_goal'
  | 'life_goal'
  | 'goal_milestone'
  | 'goal_action'
  // Intelligence
  | 'daily_score'
  | 'insight'
  | 'contradiction'
  | 'correlation'
  | 'prediction'
  | 'action_item'
  | 'weekly_report'
  // Coaching
  | 'voice_call'
  | 'voice_journal'
  // Finance
  | 'finance_insight'
  | 'finance_transaction'
  // Extended types (Phase 1 expansion)
  | 'breathing_test'
  | 'meditation_session'
  | 'emotion_detection'
  | 'progress_record'
  | 'daily_intention'
  | 'emotional_screening'
  | 'nutrition_pattern'
  | 'chat_message'
  | 'activity_completion'
  | 'schedule_entry'
  | 'achievement';

// ============================================
// VISUAL ENCODING
// ============================================

export const NODE_CATEGORY_COLORS: Record<GraphNodeCategory, string> = {
  fitness: '#EF4444',
  nutrition: '#22C55E',
  hydration: '#06B6D4',
  wellbeing: '#A855F7',
  biometrics: '#3B82F6',
  goals: '#0EA5E9',
  intelligence: '#FCD34D',
  coaching: '#4ADE80',
  finance: '#34D399',
};

export interface NodeVisualEncoding {
  color: string;
  size: number;
  opacity: number;
  glowing: boolean;
  ringColor?: string;
}

// ============================================
// NODE DATA SHAPES (per node type)
// ============================================

export interface WorkoutSessionData {
  workoutName: string | null;
  scheduledDate: string;
  durationMinutes: number | null;
  status: string;
  totalVolume: number;
  difficultyRating: number | null;
  energyLevel: number | null;
  moodAfter: number | null;
  xpEarned: number;
  planId?: string;
}

export interface MealData {
  mealType: string;
  mealName: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  healthScore: number | null;
  eatenAt: string;
  dietPlanId?: string;
}

export interface MoodEntryData {
  moodEmoji: string | null;
  mode: string;
  happinessRating: number | null;
  energyRating: number | null;
  stressRating: number | null;
  anxietyRating: number | null;
  emotionTags: string[];
  loggedAt: string;
}

export interface StressLogData {
  stressRating: number;
  triggers: string[];
  finalStressScore: number | null;
  checkInType: string;
  loggedAt: string;
}

export interface EnergyLogData {
  energyRating: number;
  contextTag: string | null;
  loggedAt: string;
}

export interface JournalEntryData {
  promptCategory: string | null;
  wordCount: number;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  mode: string;
  loggedAt: string;
}

export interface HabitCompletionData {
  habitName: string;
  completed: boolean;
  value: number | null;
  logDate: string;
  category: string | null;
}

export interface SleepSessionData {
  sleepHours: number | null;
  metricDate: string;
  provider: string;
  // Whoop-enriched fields
  qualityScore?: number | null;
  efficiencyPercent?: number | null;
  consistencyPercent?: number | null;
  respiratoryRate?: number | null;
  sleepDebtMinutes?: number | null;
  stages?: {
    remMinutes: number;
    deepMinutes: number;
    lightMinutes: number;
    awakeMinutes: number;
  } | null;
  isNap?: boolean;
}

export interface RecoveryScoreData {
  recoveryScore: number;
  metricDate: string;
  // Whoop-enriched fields
  hrvRmssd?: number | null;
  restingHeartRate?: number | null;
  spo2Percent?: number | null;
  skinTempCelsius?: number | null;
  calibrating?: boolean;
  provider?: string;
}

export interface StrainScoreData {
  strainScore: number;
  metricDate: string;
  // Whoop-enriched fields
  strainNormalized?: number | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  durationMinutes?: number | null;
  activityType?: string | null;
  distanceMeters?: number | null;
  heartRateZones?: {
    zone0: number;
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  } | null;
  provider?: string;
}

export interface HealthGoalData {
  title: string;
  category: string;
  pillar: string;
  progress: number;
  status: string;
  targetDate: string;
  confidenceLevel: number;
}

export interface LifeGoalData {
  title: string;
  category: string;
  progress: number;
  status: string;
  trackingMethod: string;
  journalMentionCount: number;
}

export interface DailyScoreData {
  date: string;
  totalScore: number;
  componentScores: Record<string, number>;
  explanation: string | null;
}

export interface InsightData {
  claim: string;
  impact: string;
  confidence: 'high' | 'medium' | 'low';
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  pillarsConnected: string[];
  evidence: string[];
  action: string;
}

export interface ContradictionData {
  ruleId: string;
  pillarA: string;
  pillarB: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: string;
  aiCorrection: string | null;
}

export interface CorrelationData {
  patternType: string;
  correlationStrength: number;
  confidence: 'high' | 'medium' | 'low';
  headline: string;
}

export interface VoiceCallData {
  sessionType: string;
  summary: string | null;
  keyInsights: unknown[];
  emotionalTrend: string | null;
  durationSeconds: number;
}

// ── Extended data shapes (Phase 1 expansion) ──

export interface BreathingTestData {
  testType: string;
  totalDurationSeconds: number;
  consistencyScore: number | null;
  lungCapacityEstimate: number | null;
  difficultyRating: number | null;
}

export interface MeditationSessionData {
  mode: string;
  durationMinutes: number;
  ambientSound: string | null;
  completed: boolean;
}

export interface EmotionDetectionData {
  emotionCategory: string;
  confidenceScore: number;
  source: string;
}

export interface ProgressRecordData {
  recordDate: string;
  recordType: string;
  value: Record<string, unknown>;
  source: string | null;
}

export interface DailyIntentionData {
  intentionDate: string;
  intentionText: string;
  fulfilled: boolean | null;
  reflection: string | null;
}

export interface EmotionalScreeningData {
  screeningType: string;
  overallAnxietyScore: number | null;
  overallMoodScore: number | null;
  riskLevel: string;
  questionCount: number;
}

export interface NutritionPatternData {
  patternType: string;
  patternKey: string;
  successRate: number;
  confidenceScore: number;
  aiInsight: string | null;
}

export interface ChatMessageData {
  role: string;
  contentPreview: string;
  conversationId: string;
}

export interface ActivityCompletionData {
  activityId: string;
  status: string;
  scheduledDate: string;
  actualValue: number | null;
  targetValue: number | null;
}

export interface ScheduleEntryData {
  scheduleDate: string;
  itemCount: number;
  completionRate: number | null;
}

export interface FinanceTransactionData {
  amount: number;
  transactionType: string;
  category: string | null;
  title: string;
  transactionDate: string;
}

export interface AchievementData {
  achievementId: string;
  achievementName: string;
  progress: number;
  unlockedAt: string | null;
}

/** Map from node type to its data shape */
export interface GraphNodeDataMap {
  workout_session: WorkoutSessionData;
  exercise: { name: string; category: string; primaryMuscleGroup: string | null; difficultyLevel: string };
  workout_plan: { name: string; goalCategory: string; completionRate: number; status: string };
  yoga_session: { title: string; sessionType: string; difficulty: string; durationMinutes: number };
  meal: MealData;
  diet_plan: { name: string; dailyCalories: number | null; adherenceRate: number; status: string };
  water_intake: { logDate: string; glassesConsumed: number; targetGlasses: number; goalAchieved: boolean };
  mood_entry: MoodEntryData;
  stress_log: StressLogData;
  energy_log: EnergyLogData;
  journal_entry: JournalEntryData;
  habit_completion: HabitCompletionData;
  mindfulness_practice: { practiceName: string; category: string; durationMinutes: number | null; effectivenessRating: number | null };
  emotional_checkin: { anxietyScore: number | null; moodScore: number | null; riskLevel: string; screeningType: string };
  daily_checkin: { moodScore: number | null; energyScore: number | null; sleepQuality: number | null; stressScore: number | null; tags: string[] };
  sleep_session: SleepSessionData;
  recovery_score: RecoveryScoreData;
  strain_score: StrainScoreData;
  health_goal: HealthGoalData;
  life_goal: LifeGoalData;
  goal_milestone: { title: string; completed: boolean; targetDate: string | null };
  goal_action: { title: string; actionType: string; pillar: string | null; isCompleted: boolean };
  daily_score: DailyScoreData;
  insight: InsightData;
  contradiction: ContradictionData;
  correlation: CorrelationData;
  prediction: { predictionType: string; predictedValue: number | null; actualValue: number | null; accuracyPct: number | null };
  action_item: { content: string; category: string; priority: string; status: string; dueDate: string | null };
  weekly_report: { weekEndDate: string; avgScore: number; scoreTrend: string; topInsights: string[] };
  voice_call: VoiceCallData;
  voice_journal: { summaryMood: string | null; summaryThemes: string[]; exchangeCount: number };
  finance_insight: { insightType: string; title: string; savingsPotential: number | null; category: string | null };
  finance_transaction: FinanceTransactionData;
  // Extended node data (Phase 1 expansion)
  breathing_test: BreathingTestData;
  meditation_session: MeditationSessionData;
  emotion_detection: EmotionDetectionData;
  progress_record: ProgressRecordData;
  daily_intention: DailyIntentionData;
  emotional_screening: EmotionalScreeningData;
  nutrition_pattern: NutritionPatternData;
  chat_message: ChatMessageData;
  activity_completion: ActivityCompletionData;
  schedule_entry: ScheduleEntryData;
  achievement: AchievementData;
}

// ============================================
// GRAPH NODE
// ============================================

export interface GraphNode<T extends GraphNodeType = GraphNodeType> {
  id: string;
  type: T;
  category: GraphNodeCategory;
  label: string;
  date: string;
  timestamp: string;
  data: T extends keyof GraphNodeDataMap ? GraphNodeDataMap[T] : Record<string, unknown>;
  visual: NodeVisualEncoding;
  sourceTable: string;
}

// ============================================
// EDGE TYPES
// ============================================

export type EdgeCategory =
  | 'temporal'
  | 'hierarchical'
  | 'causal'
  | 'correlation'
  | 'semantic';

export type EdgeType =
  // Temporal
  | 'same_day'
  | 'preceded_by'
  | 'part_of_routine'
  | 'weekly_aggregation'
  // Hierarchical
  | 'belongs_to_plan'
  | 'follows_diet'
  | 'milestone_of'
  | 'action_of'
  | 'exercise_in'
  | 'generated_from'
  | 'linked_to_journal'
  // Causal
  | 'impacts_mood'
  | 'impacts_energy'
  | 'impacts_recovery'
  | 'triggers_stress'
  | 'contradiction_between'
  // Correlation
  | 'positively_correlated'
  | 'negatively_correlated'
  | 'predicted_by'
  // Semantic
  | 'semantically_similar'
  | 'theme_shared'
  | 'goal_relevant'
  // Extended edges (Phase 1 expansion)
  | 'workout_mood_impact'
  | 'sleep_energy_impact'
  | 'breathing_stress_reduction'
  | 'report_aggregates'
  | 'achievement_of'
  // Whoop biometric causal edges
  | 'sleep_recovery_impact'
  | 'strain_recovery_impact'
  | 'recovery_strain_readiness';

export interface EdgeVisualEncoding {
  color: string;
  thickness: number;
  dashPattern: 'solid' | 'dashed' | 'dotted';
  animated: boolean;
  opacity: number;
}

export interface GraphEdge {
  id: string;
  type: EdgeType;
  category: EdgeCategory;
  sourceNodeId: string;
  targetNodeId: string;
  sourceNodeType: GraphNodeType;
  targetNodeType: GraphNodeType;
  strength: number;
  confidence: number;
  label?: string;
  metadata?: Record<string, unknown>;
  visual: EdgeVisualEncoding;
}

// ============================================
// FILTERS & QUERY
// ============================================

export interface GraphDateRange {
  from: string;
  to: string;
}

export interface GraphFilter {
  dateRange: GraphDateRange;
  categories?: GraphNodeCategory[];
  nodeTypes?: GraphNodeType[];
  edgeCategories?: EdgeCategory[];
  edgeTypes?: EdgeType[];
  minEdgeStrength?: number;
  minEdgeConfidence?: number;
  includeIsolatedNodes?: boolean;
  focusNodeId?: string;
  focusDepth?: number;
  searchQuery?: string;
  maxNodes?: number;
  maxEdges?: number;
  includeAI?: boolean;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodeCountByCategory: Partial<Record<GraphNodeCategory, number>>;
  edgeCountByCategory: Partial<Record<EdgeCategory, number>>;
  dateRange: GraphDateRange;
}

export interface GraphMeta {
  userId: string;
  filter: GraphFilter;
  stats: GraphStats;
  computedAt: string;
  cacheKey?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
  aiSummary?: {
    headline: string;
    keyFindings: string[];
    suggestedFocus: string;
  };
}

// ============================================
// ANALYTICS
// ============================================

export interface NodeCentrality {
  nodeId: string;
  nodeType: GraphNodeType;
  label: string;
  degreeCentrality: number;
  inDegree: number;
  outDegree: number;
}

export interface GraphCluster {
  clusterId: string;
  label: string;
  nodeIds: string[];
  dominantCategory: GraphNodeCategory;
}

export interface GraphAnalytics {
  centralNodes: NodeCentrality[];
  clusters: GraphCluster[];
  strongestEdges: GraphEdge[];
  isolatedNodes: number;
}

// ============================================
// REAL-TIME
// ============================================

export type GraphEventType =
  | 'node:created'
  | 'node:updated'
  | 'node:deleted'
  | 'edge:created'
  | 'graph:invalidated';

export interface GraphEvent {
  type: GraphEventType;
  timestamp: string;
  userId: string;
  payload: {
    node?: GraphNode;
    edge?: GraphEdge;
    reason?: string;
  };
}

// ============================================
// AI QUERY
// ============================================

export interface GraphAIQuery {
  question: string;
  contextNodeIds?: string[];
}

export interface GraphAIQueryResult {
  answer: string;
  relevantNodes: GraphNode[];
  relevantEdges: GraphEdge[];
  confidence: number;
}

// ============================================
// EXPORT
// ============================================

export type GraphExportFormat = 'json' | 'csv';
