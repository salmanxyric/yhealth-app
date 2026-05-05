/**
 * @file Deep Assessment Constants
 */

import type { AICoachGoalCategory } from './types';

export const TARGET_USER_MESSAGES = 6;
export const TYPING_INDICATOR_MIN_DELAY = 500;

// Map onboarding goal to API goal format
export const GOAL_MAP: Record<string, AICoachGoalCategory> = {
  weight_loss: 'weight_loss',
  muscle_building: 'muscle_building',
  sleep_improvement: 'sleep_improvement',
  stress_wellness: 'stress_wellness',
  energy_productivity: 'energy_productivity',
  event_training: 'event_training',
  health_condition: 'health_condition',
  habit_building: 'habit_building',
  overall_optimization: 'overall_optimization',
  nutrition: 'nutrition',
  fitness: 'fitness',
  custom: 'custom',
};

// Map goal ID to user-facing label (matches WelcomeStep goalOptions)
export const GOAL_LABEL_MAP: Record<string, string> = {
  weight_loss: 'Lose Weight',
  muscle_building: 'Build Muscle',
  sleep_improvement: 'Sleep Better',
  stress_wellness: 'Reduce Stress',
  energy_productivity: 'Boost Energy',
  event_training: 'Train for Event',
  health_condition: 'Manage Health',
  habit_building: 'Build Habits',
  overall_optimization: 'Optimize Health',
  nutrition: 'Nutrition',
  fitness: 'Yoga Classes',
};
