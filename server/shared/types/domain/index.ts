/**
 * @file Domain types barrel export
 */

// Goal types
export type {
  GoalCategory,
  HealthPillar,
  GoalStatus,
  GoalTimeline,
  Goal,
  SuggestedGoal,
} from './goal.js';

// Plan types
export type {
  PlanStatus,
  ActivityType,
  ActivityLogStatus,
  DayOfWeek,
  Activity,
  WeeklyFocus,
  Plan,
  TodayData,
  WeeklySummary,
  ActivityLog,
} from './plan.js';

// User types
export type {
  UserRole,
  Gender,
  AuthProvider,
  OnboardingStatus,
  User,
} from './user.js';

// Assessment types
export type {
  AssessmentType,
  QuestionType,
  AssessmentQuestion,
  AssessmentOption,
  AssessmentResponse,
  AssessmentResult,
  AssessmentInsight,
} from './assessment.js';

// Integration types
export type {
  IntegrationProvider,
  SyncStatus,
  DataType,
  Integration,
} from './integration.js';

// Preferences types
export type {
  NotificationChannel,
  CoachingStyle,
  CoachingIntensity,
  ConsentType,
  NotificationPreferences,
  CoachingPreferences,
  UserPreferences,
} from './preferences.js';

// Obstacle types
export type {
  ObstacleCategory,
  GoalRefType,
  ObstacleUserResponse,
  SuggestedAdjustment,
  GoalObstacle,
  ObstacleDiagnosisBlock,
} from './obstacle.js';

// Goal Reconnection types
export type {
  ReconnectionTier,
  ReconnectionResponse,
  GoalReconnection,
  ReconnectionRespondInput,
} from './reconnection.js';

// Intelligence Files types
export type {
  MemoryType,
  IntelligenceCategory,
  MemoryStatus,
  IntelligenceSource,
  IntelligenceFolder,
  ArtifactType,
  PlanType,
  AnalysisType,
  AnalysisStatus,
  FeedbackAction,
  CoreSection,
  EnhancedChartType,
  FolderSummary,
  MemoryEvidence,
  DataSourceReference,
  IntelligenceMemory,
  CreateMemoryInput,
  UpdateMemoryInput,
  IntelligenceArtifact,
  PlanAdaptation,
  IntelligencePlan,
  CoreProfileEntry,
  CoreProfile,
  LogReference,
  AnalysisStep,
  AnalysisSession,
  MemoryReference,
  CoreProfileReference,
  TransparencyData,
  IntelligenceFeedback,
  SubmitFeedbackInput,
  StreamMemoryUsedEvent,
  StreamAnalysisStepEvent,
  StreamArtifactGeneratedEvent,
  StreamExplainabilityEvent,
  IntelligenceDonePayload,
} from './intelligence-files.js';

// Wiki types
export * from './wiki.js';
