/**
 * @file Feature Node Registry
 * @description Static registry of all 29 feature nodes in the reasoning graph.
 *              AI Coach is the root node; every sidebar feature is a connected node.
 *              Each node maps to its LangGraph tool groups, data source tables,
 *              visualization node types, and parent in the hierarchy.
 */

import type { FeatureNodeDefinition, FeatureNodeId } from '@shared/types/domain/reasoning-graph.js';

// ============================================
// FULL REGISTRY (29 nodes)
// ============================================

export const FEATURE_NODE_REGISTRY: readonly FeatureNodeDefinition[] = [
  // ── ROOT ──
  {
    id: 'ai-coach',
    label: 'AI Coach',
    category: 'coaching',
    parentNodeId: null,
    toolGroups: ['general'],
    dataSources: ['ai_coach_sessions', 'user_coaching_profiles', 'rag_conversations'],
    graphNodeTypes: ['voice_call', 'voice_journal', 'chat_message'],
    route: '/ai-coach',
    description: 'Central reasoning engine. Orchestrates all features via graph traversal, synthesizes cross-domain insights, and decides next-best actions.',
  },

  // ── DIRECT CHILDREN OF AI COACH ──

  {
    id: 'overview',
    label: 'Overview',
    category: 'intelligence',
    parentNodeId: null,
    toolGroups: ['general'],
    dataSources: ['daily_user_scores'],
    graphNodeTypes: ['daily_score'],
    route: '/dashboard',
    description: 'Unified dashboard showing daily score, wellness orbit, and knowledge graph visualization.',
  },
  {
    id: 'workouts',
    label: 'Workouts',
    category: 'fitness',
    parentNodeId: null,
    toolGroups: ['workouts'],
    dataSources: ['workout_logs', 'user_plans'],
    graphNodeTypes: ['workout_session', 'workout_plan'],
    route: '/workouts',
    description: 'Workout planning, logging, and progress tracking. Generates fitness nodes and feeds into daily score.',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    category: 'nutrition',
    parentNodeId: null,
    toolGroups: ['meals'],
    dataSources: ['meal_logs', 'diet_plans', 'nutrition_patterns'],
    graphNodeTypes: ['meal', 'diet_plan', 'nutrition_pattern'],
    route: '/nutrition',
    description: 'Meal logging, diet plan management, and nutritional analysis. Correlates with energy, mood, and workout performance.',
  },
  {
    id: 'progress',
    label: 'Progress',
    category: 'biometrics',
    parentNodeId: null,
    toolGroups: ['progress'],
    dataSources: ['progress_records', 'body_images'],
    graphNodeTypes: ['progress_record'],
    route: '/progress',
    description: 'Weight, body measurements, and progress photos. Tracks physical transformation over time.',
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing',
    category: 'wellbeing',
    parentNodeId: null,
    toolGroups: ['wellbeing', 'emotional'],
    dataSources: ['daily_checkins', 'habits', 'habit_logs', 'breathing_tests', 'mindfulness_practices'],
    graphNodeTypes: ['daily_checkin', 'habit_completion', 'mindfulness_practice', 'breathing_test', 'emotional_checkin'],
    route: '/wellbeing',
    description: 'Daily check-ins, habits, breathing exercises, meditation, and emotional screening. Core wellbeing signal hub.',
  },
  {
    id: 'goals',
    label: 'Goals',
    category: 'goals',
    parentNodeId: null,
    toolGroups: ['goals'],
    dataSources: ['user_goals', 'life_goals', 'goal_milestones'],
    graphNodeTypes: ['health_goal', 'life_goal', 'goal_milestone', 'goal_action'],
    route: '/goals',
    description: 'Health and life goal setting, milestone tracking, and progress monitoring. Drives accountability and plan generation.',
  },
  {
    id: 'insights',
    label: 'Insights',
    category: 'intelligence',
    parentNodeId: null,
    toolGroups: ['general'],
    dataSources: ['daily_user_scores', 'contradictions', 'correlations', 'weekly_reports'],
    graphNodeTypes: ['daily_score', 'insight', 'contradiction', 'correlation', 'prediction', 'action_item', 'weekly_report'],
    route: '/insights',
    description: 'Cross-domain intelligence: daily scores, correlations, contradictions, predictions, and weekly reports.',
  },
  {
    id: 'chat',
    label: 'Chat',
    category: 'coaching',
    parentNodeId: null,
    toolGroups: ['general'],
    dataSources: ['rag_conversations'],
    graphNodeTypes: ['chat_message'],
    route: '/chat',
    description: 'Real-time messaging with AI coach and community members.',
  },
  {
    id: 'competitions',
    label: 'Competitions',
    category: 'fitness',
    parentNodeId: null,
    toolGroups: ['competitions'],
    dataSources: ['competition_entries', 'competitions'],
    graphNodeTypes: [],
    route: '/competitions',
    description: 'Challenges, team competitions, and leaderboard-driven motivation.',
  },
  {
    id: 'money-map',
    label: 'Money Map',
    category: 'finance',
    parentNodeId: null,
    toolGroups: ['general'],
    dataSources: ['finance_transactions', 'finance_insights'],
    graphNodeTypes: ['finance_transaction', 'finance_insight'],
    route: '/money-map',
    description: 'Spending tracking, financial insights, and budget analysis. Correlates with stress and wellbeing.',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    category: 'intelligence',
    parentNodeId: null,
    toolGroups: ['reminders'],
    dataSources: ['notifications', 'notification_schedules'],
    graphNodeTypes: [],
    route: '/notifications',
    description: 'Smart notifications, reminders, and proactive messaging across all features.',
  },

  // ── CHILDREN OF WORKOUTS ──

  {
    id: 'exercises',
    label: 'Exercises',
    category: 'fitness',
    parentNodeId: 'workouts',
    toolGroups: ['workouts'],
    dataSources: [],
    graphNodeTypes: ['exercise'],
    route: '/exercises',
    description: 'Exercise library with 1.5K+ exercises. Feeds into workout plan creation.',
  },
  {
    id: 'yoga',
    label: 'Yoga',
    category: 'fitness',
    parentNodeId: 'workouts',
    toolGroups: ['workouts'],
    dataSources: ['yoga_sessions'],
    graphNodeTypes: ['yoga_session'],
    route: '/yoga',
    description: 'Yoga session tracking and routines. Correlates positively with mood and recovery.',
  },
  {
    id: 'activity',
    label: 'Activity',
    category: 'fitness',
    parentNodeId: 'workouts',
    toolGroups: ['workouts', 'status'],
    dataSources: ['activity_logs', 'activity_events'],
    graphNodeTypes: ['activity_completion'],
    route: '/activity',
    description: 'Activity logging and calendar view of completed/scheduled activities.',
  },

  // ── CHILD OF ACTIVITY ──

  {
    id: 'activity-status',
    label: 'Activity Status',
    category: 'fitness',
    parentNodeId: 'activity',
    toolGroups: ['status'],
    dataSources: ['activity_status_history'],
    graphNodeTypes: [],
    route: '/activity-status',
    description: 'Status history (sick, traveling, injured). Triggers plan adjustments and AI Coach awareness.',
  },

  // ── CHILD OF NUTRITION ──

  {
    id: 'hydration',
    label: 'Hydration',
    category: 'hydration',
    parentNodeId: 'nutrition',
    toolGroups: ['water'],
    dataSources: ['water_intake_logs'],
    graphNodeTypes: ['water_intake'],
    route: '/water',
    description: 'Water intake tracking. Correlates with energy levels and workout performance.',
  },

  // ── CHILD OF PROGRESS ──

  {
    id: 'whoop',
    label: 'Whoop',
    category: 'biometrics',
    parentNodeId: 'progress',
    toolGroups: ['integrations'],
    dataSources: ['daily_health_metrics', 'health_data_records'],
    graphNodeTypes: ['sleep_session', 'recovery_score', 'strain_score'],
    route: '/whoop',
    description: 'WHOOP wearable integration: sleep, recovery, strain, HRV. Primary biometric data source.',
  },

  // ── CHILDREN OF WELLBEING ──

  {
    id: 'journal',
    label: 'Journal',
    category: 'wellbeing',
    parentNodeId: 'wellbeing',
    toolGroups: ['wellbeing'],
    dataSources: ['journal_entries'],
    graphNodeTypes: ['journal_entry'],
    route: '/journal',
    description: 'Journal entry management with sentiment analysis and theme detection.',
  },
  {
    id: 'mood',
    label: 'Mood',
    category: 'wellbeing',
    parentNodeId: 'wellbeing',
    toolGroups: ['wellbeing'],
    dataSources: ['mood_logs', 'stress_logs', 'energy_logs', 'emotion_logs'],
    graphNodeTypes: ['mood_entry', 'stress_log', 'energy_log', 'emotion_detection'],
    route: '/mood',
    description: 'Mood, stress, energy, and emotion tracking. Key signal for AI Coach reasoning.',
  },
  {
    id: 'pulse',
    label: 'Pulse',
    category: 'wellbeing',
    parentNodeId: 'wellbeing',
    toolGroups: ['music'],
    dataSources: [],
    graphNodeTypes: [],
    route: '/pulse',
    description: 'Soundscape and ambient audio environment. Uses Spotify mood data for correlations.',
  },

  // ── CHILDREN OF GOALS ──

  {
    id: 'achievements',
    label: 'Achievements',
    category: 'goals',
    parentNodeId: 'goals',
    toolGroups: ['gamification'],
    dataSources: ['user_achievements', 'achievement_definitions'],
    graphNodeTypes: ['achievement'],
    route: '/achievements',
    description: 'Achievement tracking, badges, and XP. Gamification layer for engagement.',
  },
  {
    id: 'life-areas',
    label: 'Life Areas',
    category: 'goals',
    parentNodeId: 'goals',
    toolGroups: ['goals'],
    dataSources: ['life_areas'],
    graphNodeTypes: ['life_goal'],
    route: '/life-areas',
    description: 'Universal self-improvement hub spanning fitness, nutrition, wellbeing, and finance domains.',
  },
  {
    id: 'contracts',
    label: 'Contracts',
    category: 'goals',
    parentNodeId: 'goals',
    toolGroups: ['goals'],
    dataSources: ['accountability_contracts'],
    graphNodeTypes: [],
    route: '/contracts',
    description: 'Accountability contracts with conditions and penalties. Enforces commitment to goals.',
  },

  // ── CHILD OF INSIGHTS ──

  {
    id: 'knowledge-graph',
    label: 'Knowledge Graph',
    category: 'intelligence',
    parentNodeId: 'insights',
    toolGroups: ['general'],
    dataSources: [],
    graphNodeTypes: [],
    route: '/knowledge-graph',
    description: 'Interactive visualization of all health data relationships. Read-only exploration of the reasoning graph.',
  },

  // ── CHILDREN OF CHAT ──

  {
    id: 'voice-assistant',
    label: 'Voice Assistant',
    category: 'coaching',
    parentNodeId: 'chat',
    toolGroups: ['general'],
    dataSources: ['voice_journal_sessions'],
    graphNodeTypes: ['voice_journal'],
    route: '/voice-assistant',
    description: 'Voice-based AI coaching and commands. Produces voice journal nodes.',
  },

  // ── CHILD OF VOICE ASSISTANT ──

  {
    id: 'call-coach',
    label: 'Call Coach',
    category: 'coaching',
    parentNodeId: 'voice-assistant',
    toolGroups: ['general'],
    dataSources: ['voice_calls', 'call_summaries'],
    graphNodeTypes: ['voice_call'],
    route: '/voice-call',
    description: 'Voice call sessions with AI coach. Generates call summaries and insights.',
  },

  // ── CHILDREN OF COMPETITIONS ──

  {
    id: 'leaderboard',
    label: 'Leaderboard',
    category: 'fitness',
    parentNodeId: 'competitions',
    toolGroups: ['competitions', 'gamification'],
    dataSources: ['daily_user_scores'],
    graphNodeTypes: [],
    route: '/leaderboard',
    description: 'Personal and global rankings by XP, streaks, and achievements.',
  },
  {
    id: 'community',
    label: 'Community',
    category: 'fitness',
    parentNodeId: 'competitions',
    toolGroups: ['competitions'],
    dataSources: ['community_posts', 'community_replies'],
    graphNodeTypes: [],
    route: '/community',
    description: 'Community groups, forums, and social engagement features.',
  },
] as const;

// ============================================
// LOOKUP HELPERS
// ============================================

const _registryMap = new Map<FeatureNodeId, FeatureNodeDefinition>(
  FEATURE_NODE_REGISTRY.map((n) => [n.id, n]),
);

export function getFeatureNode(id: FeatureNodeId): FeatureNodeDefinition | undefined {
  return _registryMap.get(id);
}

export function getFeatureNodeOrThrow(id: FeatureNodeId): FeatureNodeDefinition {
  const node = _registryMap.get(id);
  if (!node) throw new Error(`Feature node not found: ${id}`);
  return node;
}

export function getAllFeatureNodeIds(): FeatureNodeId[] {
  return FEATURE_NODE_REGISTRY.map((n) => n.id);
}

export function getDirectChildrenOf(parentId: FeatureNodeId): FeatureNodeDefinition[] {
  if (parentId === 'ai-coach') {
    return FEATURE_NODE_REGISTRY.filter((n) => n.parentNodeId === null && n.id !== 'ai-coach');
  }
  return FEATURE_NODE_REGISTRY.filter((n) => n.parentNodeId === parentId);
}

export function getAncestorChain(nodeId: FeatureNodeId): FeatureNodeId[] {
  const chain: FeatureNodeId[] = [];
  let current = _registryMap.get(nodeId);
  while (current && current.parentNodeId) {
    chain.push(current.parentNodeId);
    current = _registryMap.get(current.parentNodeId);
  }
  if (chain.length === 0 && nodeId !== 'ai-coach') {
    chain.push('ai-coach');
  }
  return chain;
}

/** Returns all tool groups needed to serve a feature (including ancestors) */
export function getToolGroupsForFeature(nodeId: FeatureNodeId): string[] {
  const node = _registryMap.get(nodeId);
  if (!node) return [];
  const groups = new Set(node.toolGroups);
  let current = node;
  while (current.parentNodeId) {
    const parent = _registryMap.get(current.parentNodeId);
    if (!parent) break;
    for (const g of parent.toolGroups) groups.add(g);
    current = parent;
  }
  return Array.from(groups);
}

/** Maps a LangGraph tool name to its feature node */
export function featureNodeForToolGroup(toolGroup: string): FeatureNodeId | undefined {
  for (const node of FEATURE_NODE_REGISTRY) {
    if (node.toolGroups.includes(toolGroup)) return node.id;
  }
  return undefined;
}

/** Default hierarchical edges (coach_manages) derived from the registry */
export function getDefaultEdges(): Array<{
  sourceNodeId: FeatureNodeId;
  targetNodeId: FeatureNodeId;
  edgeType: 'coach_manages';
}> {
  const edges: Array<{
    sourceNodeId: FeatureNodeId;
    targetNodeId: FeatureNodeId;
    edgeType: 'coach_manages';
  }> = [];

  for (const node of FEATURE_NODE_REGISTRY) {
    if (node.id === 'ai-coach') continue;
    const parent = node.parentNodeId ?? 'ai-coach';
    edges.push({
      sourceNodeId: parent === 'ai-coach' ? 'ai-coach' : parent,
      targetNodeId: node.id,
      edgeType: 'coach_manages',
    });
  }

  return edges;
}

/** Cross-feature semantic edges that are always present regardless of user data */
export const STATIC_CROSS_EDGES: ReadonlyArray<{
  sourceNodeId: FeatureNodeId;
  targetNodeId: FeatureNodeId;
  edgeType: 'feeds_data' | 'supports' | 'requires';
  weight: number;
}> = [
  { sourceNodeId: 'nutrition', targetNodeId: 'workouts', edgeType: 'feeds_data', weight: 0.8 },
  { sourceNodeId: 'whoop', targetNodeId: 'workouts', edgeType: 'feeds_data', weight: 0.9 },
  { sourceNodeId: 'whoop', targetNodeId: 'wellbeing', edgeType: 'feeds_data', weight: 0.7 },
  { sourceNodeId: 'mood', targetNodeId: 'insights', edgeType: 'feeds_data', weight: 0.8 },
  { sourceNodeId: 'workouts', targetNodeId: 'progress', edgeType: 'feeds_data', weight: 0.9 },
  { sourceNodeId: 'nutrition', targetNodeId: 'progress', edgeType: 'feeds_data', weight: 0.8 },
  { sourceNodeId: 'hydration', targetNodeId: 'wellbeing', edgeType: 'supports', weight: 0.6 },
  { sourceNodeId: 'yoga', targetNodeId: 'mood', edgeType: 'supports', weight: 0.7 },
  { sourceNodeId: 'journal', targetNodeId: 'mood', edgeType: 'supports', weight: 0.6 },
  { sourceNodeId: 'goals', targetNodeId: 'workouts', edgeType: 'requires', weight: 0.7 },
  { sourceNodeId: 'goals', targetNodeId: 'nutrition', edgeType: 'requires', weight: 0.7 },
  { sourceNodeId: 'contracts', targetNodeId: 'goals', edgeType: 'supports', weight: 0.8 },
  { sourceNodeId: 'achievements', targetNodeId: 'competitions', edgeType: 'supports', weight: 0.6 },
  { sourceNodeId: 'money-map', targetNodeId: 'wellbeing', edgeType: 'feeds_data', weight: 0.5 },
];
