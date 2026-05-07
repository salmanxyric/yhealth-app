/**
 * @file Obstacle diagnosis domain types
 * Feature: proactive coach-led diagnosis when a user repeatedly misses a goal.
 */

export type ObstacleCategory =
  | 'time'
  | 'location'
  | 'energy'
  | 'motivation'
  | 'skill'
  | 'social'
  | 'health'
  | 'environment'
  | 'unclear';

export type GoalRefType = 'life_goal' | 'user_goal' | 'daily_intention';

export type ObstacleUserResponse =
  | 'accepted'
  | 'modified'
  | 'declined'
  | 'no_response';

/* Discriminated union for the coach's proposed adjustment. */
export type SuggestedAdjustment =
  | { kind: 'reschedule'; payload: { newTime?: string; newDayOfWeek?: number[]; note?: string } }
  | { kind: 'reduce_frequency'; payload: { newTargetValue: number; newTargetUnit?: string; note?: string } }
  | { kind: 'change_location'; payload: { newLocation: string; note?: string } }
  | { kind: 'add_preparation_intention'; payload: { intentionText: string; triggerTime?: string } }
  | { kind: 'no_change'; payload: { reason: string } };

export interface GoalObstacle {
  id: string;
  userId: string;
  goalRefType: GoalRefType;
  goalRefId: string;
  goalTitle: string;
  missCountLast7d: number;
  category: ObstacleCategory | null;
  aiNotes: string | null;
  suggestedAdjustment: SuggestedAdjustment | null;
  userResponse: ObstacleUserResponse | null;
  coachSessionId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* Structured block the coach emits at diagnosis end — parsed server-side. */
export interface ObstacleDiagnosisBlock {
  category: ObstacleCategory;
  aiNotes: string;
  suggestedAdjustment: SuggestedAdjustment;
}
