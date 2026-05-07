/**
 * @file Reasoning Graph Domain Types
 * @description Type definitions for the Knowledge Graph–driven AI Coaching Architecture.
 *              The reasoning graph treats AI Coach as the root node and every feature
 *              as a connected node with typed edges, per-user state, and alerts.
 */

import type { GraphNodeCategory, GraphNodeType } from './knowledge-graph.js';

// ============================================
// FEATURE NODE IDENTIFIERS
// ============================================

/** 29 feature nodes: AI Coach root + 28 features matching the sidebar */
export type FeatureNodeId =
  | 'ai-coach'
  | 'overview'
  | 'workouts'
  | 'nutrition'
  | 'exercises'
  | 'progress'
  | 'activity'
  | 'activity-status'
  | 'whoop'
  | 'achievements'
  | 'wellbeing'
  | 'journal'
  | 'mood'
  | 'insights'
  | 'yoga'
  | 'pulse'
  | 'goals'
  | 'life-areas'
  | 'leaderboard'
  | 'competitions'
  | 'community'
  | 'contracts'
  | 'chat'
  | 'voice-assistant'
  | 'call-coach'
  | 'money-map'
  | 'notifications'
  | 'knowledge-graph'
  | 'hydration';

// ============================================
// STATIC NODE DEFINITION (compile-time)
// ============================================

export interface FeatureNodeDefinition {
  id: FeatureNodeId;
  label: string;
  category: GraphNodeCategory;
  /** null = direct child of ai-coach */
  parentNodeId: FeatureNodeId | null;
  /** Maps to existing TOOL_GROUPS in tool-router.service.ts */
  toolGroups: string[];
  /** DB tables this feature reads/writes */
  dataSources: string[];
  /** Visualization node types this feature produces */
  graphNodeTypes: GraphNodeType[];
  /** Client route for navigation */
  route: string;
  /** Human-readable description for AI Coach reasoning context */
  description: string;
}

// ============================================
// RUNTIME PER-USER STATE (DB-backed)
// ============================================

export type FeatureNodeStatus = 'active' | 'dormant' | 'never_used';

export interface FeatureNodeState {
  featureNodeId: FeatureNodeId;
  userId: string;
  /** 0-100, computed from feature data */
  healthScore: number;
  lastActivityAt: string | null;
  /** Entries in last 7 days */
  activityCount7d: number;
  status: FeatureNodeStatus;
  alerts: FeatureAlert[];
  updatedAt: string;
}

export type FeatureAlertType = 'declining' | 'missed' | 'conflict' | 'opportunity';
export type FeatureAlertSeverity = 'low' | 'medium' | 'high';

export interface FeatureAlert {
  type: FeatureAlertType;
  message: string;
  severity: FeatureAlertSeverity;
  relatedNodeId?: FeatureNodeId;
}

// ============================================
// REASONING EDGES (per-user, weighted)
// ============================================

export type ReasoningEdgeType =
  | 'coach_manages'
  | 'feeds_data'
  | 'user_correlates'
  | 'conflicts_with'
  | 'supports'
  | 'requires';

export type ReasoningEdgeDirection = 'unidirectional' | 'bidirectional';

export interface ReasoningEdge {
  id: string;
  sourceNodeId: FeatureNodeId;
  targetNodeId: FeatureNodeId;
  edgeType: ReasoningEdgeType;
  /** 0-1 strength */
  weight: number;
  direction: ReasoningEdgeDirection;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// GRAPH CONTEXT (injected into AI Coach prompt)
// ============================================

export interface GraphContextSummary {
  totalNodes: number;
  activeNodes: FeatureNodeId[];
  dormantNodes: FeatureNodeId[];
  neverUsedNodes: FeatureNodeId[];
  /** Max 5, sorted by severity desc */
  topAlerts: FeatureAlert[];
  /** Human-readable conflict descriptions */
  crossNodeConflicts: string[];
  /** Graph-derived action recommendations */
  suggestedNextActions: string[];
  /** 0-100, overall user engagement across features */
  graphHealthScore: number;
}

// ============================================
// GRAPH VALIDATION
// ============================================

export type ValidationIssueType = 'orphan_node' | 'weak_connection' | 'missing_edge' | 'dormant_edge';

export interface GraphValidationIssue {
  type: ValidationIssueType;
  nodeId: FeatureNodeId;
  description: string;
  suggestedFix?: {
    action: 'create_edge' | 'strengthen_edge' | 'mark_dormant';
    sourceNodeId: FeatureNodeId;
    targetNodeId: FeatureNodeId;
    edgeType: ReasoningEdgeType;
  };
}

export interface GraphValidationReport {
  userId: string;
  timestamp: string;
  totalNodes: number;
  reachableNodes: number;
  orphanNodes: FeatureNodeId[];
  weaklyConnected: FeatureNodeId[];
  issues: GraphValidationIssue[];
  autoRepaired: number;
}

// ============================================
// GRAPH EVENT (emitted on tool execution)
// ============================================

export interface GraphEvent {
  userId: string;
  featureNodeId: FeatureNodeId;
  eventType: 'data_created' | 'data_updated' | 'data_deleted' | 'feature_accessed';
  timestamp: string;
  toolName?: string;
}
