/**
 * @file Accountability Domain Types
 * @description Shared types for Social Accountability & Accountability Contracts
 */

// ─── Social Accountability ─────────────────────────────────────────

export type ContactRole = 'friend' | 'spouse' | 'family' | 'coach' | 'mentor';

export interface AccountabilityContact {
  id: string;
  userId: string;
  contactUserId: string;
  nickname: string | null;
  role: ContactRole;
  chatId: string | null;
  isActive: boolean;
  addedAt: string;
  removedAt: string | null;
  contactName?: string;
  contactAvatar?: string;
}

export interface AccountabilityGroup {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  chatId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: AccountabilityContact[];
  memberCount?: number;
}

export interface AccountabilityConsent {
  id: string;
  userId: string;
  enabled: boolean;
  allowMotivationReminders: boolean;
  allowFailureAlerts: boolean;
  allowSosAlerts: boolean;
  sosInactivityDays: number;
  sosMessage: string;
  aiInterveneFirst: boolean;
  globalCooldownHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactConsent {
  allowMotivation: boolean;
  allowFailure: boolean;
  allowSos: boolean;
  isEmergencyContact: boolean;
}

// ─── Triggers ──────────────────────────────────────────────────────

export type TriggerConditionType = 'inactivity' | 'metric_threshold' | 'streak_break' | 'login_gap' | 'custom';
export type TriggerTargetType = 'contact' | 'group' | 'emergency' | 'app_chat';
export type TriggerMessageType = 'motivation' | 'failure' | 'sos';
export type TriggerOperator = 'lt' | 'gt' | 'eq' | 'gte' | 'lte' | 'missed';

export interface AccountabilityTrigger {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  conditionType: TriggerConditionType;
  conditionMetric: string | null;
  conditionOperator: TriggerOperator | null;
  conditionValue: number | null;
  conditionWindowDays: number;
  targetType: TriggerTargetType;
  targetContactId: string | null;
  targetGroupId: string | null;
  /** Native app group chat (Messages) when targetType is app_chat */
  targetChatId: string | null;
  messageType: TriggerMessageType;
  messageTemplate: string | null;
  cooldownHours: number;
  isActive: boolean;
  aiInterveneFirst: boolean;
  lastTriggeredAt: string | null;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TriggerLogResult = 'fired' | 'blocked_consent' | 'blocked_cooldown' | 'ai_intervened' | 'cancelled';

export interface TriggerLog {
  id: string;
  triggerId: string | null;
  userId: string;
  conditionSnapshot: Record<string, unknown>;
  result: TriggerLogResult;
  messageSent: boolean;
  messageId: string | null;
  chatId: string | null;
  targetUserIds: string[];
  aiInterventionAttempted: boolean;
  aiInterventionMessage: string | null;
  createdAt: string;
  triggerName?: string;
  conditionType?: string;
  messageType?: string;
}

export interface ConsentAudit {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

// ─── Contracts ─────────────────────────────────────────────────────

export type ContractStatus = 'draft' | 'active' | 'at_risk' | 'violated' | 'completed' | 'cancelled' | 'paused';
export type ContractConditionType = 'missed_activity' | 'calorie_exceeded' | 'streak_break' | 'missed_goal' | 'sleep_deficit' | 'custom';
export type ContractPenaltyType = 'donation' | 'xp_loss' | 'social_alert' | 'streak_freeze_loss' | 'custom';

export interface Contract {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  conditionType: string;
  conditionMetric: string | null;
  conditionOperator: string | null;
  conditionValue: number | null;
  conditionWindowDays: number;
  conditionDetails: Record<string, unknown>;
  penaltyType: string;
  penaltyAmount: number | null;
  penaltyCurrency: string;
  penaltyDetails: Record<string, unknown>;
  status: ContractStatus;
  signedAt: string | null;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  pauseCount: number;
  verificationMethod: string;
  gracePeriodHours: number;
  confidenceThreshold: number;
  aiSuggested: boolean;
  aiSuggestionReason: string | null;
  socialEnforcerIds: string[];
  violationCount: number;
  successCount: number;
  totalChecks: number;
  lastCheckedAt: string | null;
  lastViolationAt: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
}

export interface ContractViolation {
  id: string;
  contractId: string;
  userId: string;
  violationType: string;
  confidenceScore: number;
  evidence: Record<string, unknown>;
  penaltyStatus: string;
  penaltyExecutedAt: string | null;
  penaltyExecutionDetails: Record<string, unknown>;
  graceExpiresAt: string | null;
  graceUsed: boolean;
  aiIntervened: boolean;
  aiInterventionMessage: string | null;
  userNotified: boolean;
  enforcersNotified: boolean;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface ContractStats {
  activeCount: number;
  completedCount: number;
  totalViolations: number;
  totalSuccessChecks: number;
  overallSuccessRate: number;
  currentActiveStreak: number;
  penaltiesExecuted: number;
  penaltiesPending: number;
}

export interface ContractSuggestion {
  id: string;
  title: string;
  description: string;
  reason: string;
  conditionType: string;
  conditionMetric: string | null;
  conditionOperator: string | null;
  conditionValue: number | null;
  conditionWindowDays: number;
  penaltyType: string;
  penaltyAmount: number;
  penaltyCurrency: string;
  confidence: number;
}

export interface ContractsResponse {
  contracts: Contract[];
  total: number;
}
