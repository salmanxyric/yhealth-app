/**
 * @file Intelligence Files Domain Types
 * @description Type definitions for the AI Memory & Intelligence System
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type MemoryType = 'pattern' | 'preference' | 'context' | 'feedback' | 'relationship' | 'learned_rule';

export type IntelligenceCategory = 'fitness' | 'nutrition' | 'sleep' | 'wellbeing' | 'lifestyle' | 'behavioral' | 'cross_domain';

export type MemoryStatus = 'active' | 'verified' | 'rejected' | 'expired' | 'superseded';

export type IntelligenceSource = 'ai' | 'user' | 'system' | 'wearable';

export type IntelligenceFolder = 'memories' | 'wiki' | 'notes' | 'artifacts' | 'plans' | 'core' | 'logs';

export type ArtifactType = 'chart' | 'comparison' | 'report' | 'heatmap' | 'scatter' | 'gauge' | 'timeline' | 'table';

export type PlanType = 'weekly_training' | 'nutrition_cycle' | 'habit_formation' | 'recovery' | 'goal_sprint' | 'custom';

export type PlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';

export type AnalysisType = 'correlation' | 'regression' | 'anomaly' | 'trend' | 'comparison' | 'multi_factor' | 'comprehensive';

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export type FeedbackAction = 'verify' | 'reject' | 'correct' | 'dismiss' | 'expand' | 'pin';

export type CoreSection = 'biometrics' | 'targets' | 'constraints' | 'preferences' | 'medical' | 'lifestyle';

export type EnhancedChartType =
  | 'line' | 'bar' | 'area' | 'pie' | 'radar'
  | 'scatter' | 'correlation_scatter' | 'time_series' | 'comparison_bar'
  | 'distribution_histogram' | 'heatmap_calendar' | 'radar_multi'
  | 'trend_area' | 'box_whisker' | 'funnel_progression' | 'gauge' | 'gauge_current';

// ============================================
// FOLDER SUMMARY
// ============================================

export interface FolderSummary {
  id: IntelligenceFolder;
  label: string;
  itemCount: number;
  lastModified: string | null;
}

// ============================================
// EVIDENCE & PROVENANCE
// ============================================

export interface MemoryEvidence {
  source_table: string;
  source_id: string;
  date: string;
  summary: string;
}

export interface DataSourceReference {
  table: string;
  date_range: { start: string; end: string };
  query_summary: string;
  row_count?: number;
}

// ============================================
// MEMORIES
// ============================================

export interface IntelligenceMemory {
  id: string;
  userId: string;
  memoryType: MemoryType;
  category: IntelligenceCategory;
  subcategory?: string;
  title: string;
  description: string;
  structuredData: Record<string, unknown>;
  confidence: number;
  evidenceCount: number;
  evidence: MemoryEvidence[];
  minEvidence: number;
  source: IntelligenceSource;
  kgNodeIds: string[];
  relatedMemoryIds: string[];
  status: MemoryStatus;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  supersededBy: string | null;
  lastAccessedAt: string;
  accessCount: number;
  decayRate: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoryInput {
  memoryType: MemoryType;
  category: IntelligenceCategory;
  subcategory?: string;
  title: string;
  description: string;
  structuredData?: Record<string, unknown>;
  evidence: MemoryEvidence[];
  source?: IntelligenceSource;
  expiresAt?: string;
}

export interface UpdateMemoryInput {
  title?: string;
  description?: string;
  structuredData?: Record<string, unknown>;
}

// ============================================
// ARTIFACTS
// ============================================

export interface IntelligenceArtifact {
  id: string;
  userId: string;
  artifactType: ArtifactType;
  title: string;
  description: string | null;
  chartConfig: Record<string, unknown>;
  data: Record<string, unknown>[];
  insight: string | null;
  generatedBy: string;
  triggerMessageId: string | null;
  conversationId: string | null;
  analysisId: string | null;
  memoryIdsUsed: string[];
  dataSources: DataSourceReference[];
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PLANS
// ============================================

export interface PlanAdaptation {
  date: string;
  trigger: string;
  changeDescription: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export interface IntelligencePlan {
  id: string;
  userId: string;
  planType: PlanType;
  title: string;
  description: string | null;
  planData: Record<string, unknown>;
  currentPhase: string | null;
  version: number;
  adaptationLog: PlanAdaptation[];
  adherenceRate: number | null;
  status: PlanStatus;
  startsAt: string | null;
  endsAt: string | null;
  lastAdaptedAt: string | null;
  source: IntelligenceSource;
  memoryIdsUsed: string[];
  goalIds: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CORE PROFILE
// ============================================

export interface CoreProfileEntry {
  id: string;
  userId: string;
  section: CoreSection;
  key: string;
  value: unknown;
  unit: string | null;
  confidence: number;
  calibratedAt: string;
  dataPointsUsed: number;
  source: IntelligenceSource;
  previousValues: Array<{ value: unknown; calibratedAt: string; dataPointsUsed: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface CoreProfile {
  biometrics: CoreProfileEntry[];
  targets: CoreProfileEntry[];
  constraints: CoreProfileEntry[];
  preferences: CoreProfileEntry[];
  medical: CoreProfileEntry[];
  lifestyle: CoreProfileEntry[];
  missingFields: Array<{ section: CoreSection; key: string; impact: 'low' | 'medium' | 'high' }>;
}

// ============================================
// LOG REFERENCES
// ============================================

export interface LogReference {
  id: string;
  userId: string;
  sourceTable: string;
  sourceId: string;
  sourceDate: string;
  summary: string | null;
  category: IntelligenceCategory;
  memoryIds: string[];
  artifactIds: string[];
  createdAt: string;
}

// ============================================
// ANALYSES
// ============================================

export interface AnalysisStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  durationMs?: number;
  resultSummary?: string;
}

export interface AnalysisSession {
  id: string;
  userId: string;
  analysisType: AnalysisType;
  query: string | null;
  parameters: Record<string, unknown>;
  status: AnalysisStatus;
  startedAt: string | null;
  completedAt: string | null;
  steps: AnalysisStep[];
  statisticalResults: Record<string, unknown> | null;
  narrative: string | null;
  artifactIds: string[];
  memoryIdsUsed: string[];
  memoryIdsCreated: string[];
  trigger: 'user' | 'scheduled' | 'proactive';
  conversationId: string | null;
  modelUsed: string | null;
  createdAt: string;
}

// ============================================
// TRANSPARENCY / EXPLAINABILITY
// ============================================

export interface MemoryReference {
  memoryId: string;
  title: string;
  memoryType: MemoryType;
  confidence: number;
  relevanceScore: number;
}

export interface CoreProfileReference {
  section: CoreSection;
  key: string;
  value: unknown;
  unit?: string;
}

export interface TransparencyData {
  conversationId: string;
  messageId: string | null;
  memoriesUsed: MemoryReference[];
  coreProfileUsed: CoreProfileReference[];
  analysesUsed: Array<{ analysisId: string; type: AnalysisType; summary: string }>;
  overallConfidence: number | null;
  confidenceBreakdown: Record<string, number> | null;
  wasHelpful: boolean | null;
  correction: string | null;
}

// ============================================
// FEEDBACK
// ============================================

export interface IntelligenceFeedback {
  id: string;
  userId: string;
  targetType: 'memory' | 'artifact' | 'plan' | 'insight' | 'recommendation';
  targetId: string;
  action: FeedbackAction;
  correctionData: Record<string, unknown> | null;
  comment: string | null;
  confidenceDelta: number | null;
  memoriesAffected: string[];
  createdAt: string;
}

export interface SubmitFeedbackInput {
  targetType: 'memory' | 'artifact' | 'plan' | 'insight' | 'recommendation';
  targetId: string;
  action: FeedbackAction;
  correctionData?: Record<string, unknown>;
  comment?: string;
}

// ============================================
// SSE STREAM EVENTS (new intelligence events)
// ============================================

export interface StreamMemoryUsedEvent {
  type: 'memory_used';
  memoryId: string;
  title: string;
  confidence: number;
  relevance: number;
}

export interface StreamAnalysisStepEvent {
  type: 'analysis_step';
  analysisId: string;
  stepName: string;
  description: string;
  status: 'running' | 'completed';
  durationMs?: number;
}

export interface StreamArtifactGeneratedEvent {
  type: 'artifact_generated';
  artifactId: string;
  artifact: Record<string, unknown>;
}

export interface StreamExplainabilityEvent {
  type: 'explainability';
  memoriesUsed: Array<{ id: string; title: string; confidence: number }>;
  coreProfileUsed: Array<{ section: string; key: string }>;
  overallConfidence: number;
}

export interface IntelligenceDonePayload {
  memoriesUsed: string[];
  memoriesCreated: string[];
  artifactIds: string[];
  overallConfidence: number;
}
