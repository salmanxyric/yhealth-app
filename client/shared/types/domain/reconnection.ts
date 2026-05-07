/**
 * @file Goal Reconnection domain types
 * Feature: proactively surface life_goals that have gone silent for
 * 21 / 42 / 70 days so they don't quietly die.
 */

export type ReconnectionTier = 1 | 2 | 3;

export type ReconnectionResponse =
  | 'committed'
  | 'paused'
  | 'archived'
  | 'snoozed'
  | 'no_response';

export interface GoalReconnection {
  id: string;
  userId: string;
  lifeGoalId: string;
  goalTitle: string;
  daysSilent: number;
  tier: ReconnectionTier;
  userResponse: ReconnectionResponse | null;
  snoozedUntil: string | null;
  checkinNote: string | null;
  moodAboutGoal: number | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReconnectionRespondInput {
  response: ReconnectionResponse;
  snoozeDays?: number;
  checkinNote?: string;
  moodAboutGoal?: number;
}
