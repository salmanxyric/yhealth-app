/**
 * Fallback assessment questions for onboarding
 *
 * These are used ONLY when AI-generated questions fail to load.
 * Each goal category has 2-3 essential questions as a safety net.
 */

import type { GoalCategory } from '@/src/types';
import {
  Activity,
  Moon,
  Utensils,
  Brain,
  Target,
  Ruler,
  Scale,
  Timer,
  Dumbbell,
  TrendingUp,
  Coffee,
  Clock,
  Heart,
  Zap,
  Trophy,
  Calendar,
  Pill,
  Apple,
  Flame,
  BedDouble,
  Sunrise,
  Wind,
  Sparkles,
} from 'lucide-react';
import { createElement } from 'react';

export interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels?: string[];
  unit?: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'slider' | 'emoji_scale' | 'single_select' | 'multi_select' | 'number';
  category: string;
  pillar: string;
  iconName: string;
  options?: QuestionOption[];
  sliderConfig?: SliderConfig;
  unit?: string;
}

export const getQuestionIcon = (iconName: string, className = 'w-6 h-6') => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Activity,
    Moon,
    Utensils,
    Brain,
    Target,
    Ruler,
    Scale,
    Timer,
    Dumbbell,
    TrendingUp,
    Coffee,
    Clock,
    Heart,
    Zap,
    Trophy,
    Calendar,
    Pill,
    Apple,
    Flame,
    BedDouble,
    Sunrise,
    Wind,
    Sparkles,
  };
  const IconComponent = iconMap[iconName] || Target;
  return createElement(IconComponent, { className });
};

// ---------------------------------------------------------------------------
// Fallback questions per goal (2-3 each)
// ---------------------------------------------------------------------------

const weightLossFallback: AssessmentQuestion[] = [
  {
    id: 'eating_habits',
    text: 'How would you describe your current eating habits?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'nutrition',
    iconName: 'Utensils',
    options: [
      { value: 'unhealthy', label: 'Mostly processed/fast food' },
      { value: 'mixed', label: 'Mix of healthy and unhealthy' },
      { value: 'healthy', label: 'Mostly whole foods' },
      { value: 'very_healthy', label: 'Very clean, balanced diet' },
    ],
  },
  {
    id: 'activity_level',
    text: 'How physically active are you currently?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Activity',
    options: [
      { value: 'sedentary', label: 'Mostly sedentary' },
      { value: 'light', label: 'Light activity (walking)' },
      { value: 'moderate', label: 'Moderate (exercise 2-3x/week)' },
      { value: 'active', label: 'Very active (exercise 4+x/week)' },
    ],
  },
  {
    id: 'biggest_challenge_weight',
    text: 'What is your biggest weight loss challenge?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Target',
    options: [
      { value: 'cravings', label: 'Managing food cravings' },
      { value: 'portions', label: 'Controlling portion sizes' },
      { value: 'emotional', label: 'Emotional or stress eating' },
      { value: 'motivation', label: 'Staying motivated' },
    ],
  },
];

const muscleBuildingFallback: AssessmentQuestion[] = [
  {
    id: 'gym_experience',
    text: 'How much weight training experience do you have?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Dumbbell',
    options: [
      { value: 'beginner', label: 'Complete beginner (0-6 months)' },
      { value: 'intermediate', label: 'Some experience (6 months - 2 years)' },
      { value: 'experienced', label: 'Experienced (2-5 years)' },
      { value: 'advanced', label: 'Advanced (5+ years)' },
    ],
  },
  {
    id: 'muscle_goal',
    text: 'What is your primary muscle-building goal?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Target',
    options: [
      { value: 'strength', label: 'Get stronger (focus on lifts)' },
      { value: 'size', label: 'Build muscle size (hypertrophy)' },
      { value: 'tone', label: 'Get toned and defined' },
      { value: 'athletic', label: 'Improve athletic performance' },
    ],
  },
];

const sleepFallback: AssessmentQuestion[] = [
  {
    id: 'sleep_hours',
    text: 'How many hours of sleep do you typically get?',
    type: 'slider',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Moon',
    sliderConfig: {
      min: 3,
      max: 10,
      step: 0.5,
      labels: ['3h', '5h', '7h', '9h', '10h'],
      unit: 'hours',
    },
  },
  {
    id: 'sleep_issues',
    text: 'What sleep issues do you experience most?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Moon',
    options: [
      { value: 'falling_asleep', label: 'Difficulty falling asleep' },
      { value: 'staying_asleep', label: 'Waking up during the night' },
      { value: 'waking_early', label: 'Waking up too early' },
      { value: 'not_rested', label: 'Not feeling rested after sleep' },
    ],
  },
];

const stressFallback: AssessmentQuestion[] = [
  {
    id: 'stress_sources',
    text: 'What is your primary source of stress?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Brain',
    options: [
      { value: 'work', label: 'Work or career' },
      { value: 'relationships', label: 'Relationships or family' },
      { value: 'health', label: 'Health concerns' },
      { value: 'finances', label: 'Financial stress' },
      { value: 'general', label: 'General life overwhelm' },
    ],
  },
  {
    id: 'coping_methods',
    text: 'How do you currently cope with stress?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Heart',
    options: [
      { value: 'exercise', label: 'Physical activity' },
      { value: 'social', label: 'Talking to friends/family' },
      { value: 'unhealthy', label: 'Unhealthy habits (food, screens, etc.)' },
      { value: 'nothing', label: 'I don\'t really cope well' },
    ],
  },
];

const energyFallback: AssessmentQuestion[] = [
  {
    id: 'energy_pattern',
    text: 'When do you feel most energetic?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Zap',
    options: [
      { value: 'morning', label: 'Morning person' },
      { value: 'afternoon', label: 'Afternoon peak' },
      { value: 'evening', label: 'Night owl' },
      { value: 'never', label: 'Rarely feel energetic' },
    ],
  },
  {
    id: 'energy_drains',
    text: 'What drains your energy most?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Coffee',
    options: [
      { value: 'poor_sleep', label: 'Poor sleep quality' },
      { value: 'diet', label: 'Poor nutrition' },
      { value: 'stress', label: 'Stress and overthinking' },
      { value: 'inactivity', label: 'Lack of physical activity' },
    ],
  },
];

const fitnessFallback: AssessmentQuestion[] = [
  {
    id: 'yoga_experience',
    text: 'What is your experience level with yoga or flexibility training?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Activity',
    options: [
      { value: 'beginner', label: 'Complete beginner' },
      { value: 'some_experience', label: 'Tried a few classes' },
      { value: 'regular', label: 'Practice regularly (1-2x/week)' },
      { value: 'advanced', label: 'Experienced practitioner (3+x/week)' },
    ],
  },
  {
    id: 'fitness_goal',
    text: 'What do you want to achieve most from your practice?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Target',
    options: [
      { value: 'flexibility', label: 'Improve flexibility and mobility' },
      { value: 'strength', label: 'Build functional strength' },
      { value: 'relaxation', label: 'Stress relief and relaxation' },
      { value: 'balance', label: 'Better balance and posture' },
    ],
  },
  {
    id: 'practice_time',
    text: 'How much time can you dedicate to each session?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'fitness',
    iconName: 'Clock',
    options: [
      { value: '15min', label: '15 minutes' },
      { value: '30min', label: '30 minutes' },
      { value: '45min', label: '45 minutes' },
      { value: '60min', label: '1 hour or more' },
    ],
  },
];

const genericFallback: AssessmentQuestion[] = [
  {
    id: 'current_state',
    text: 'How would you rate your overall wellbeing right now?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Heart',
    options: [
      { value: 'poor', label: 'Needs a lot of improvement' },
      { value: 'fair', label: 'Could be better' },
      { value: 'good', label: 'Pretty good overall' },
      { value: 'great', label: 'Great, looking to optimize' },
    ],
  },
  {
    id: 'biggest_barrier',
    text: 'What is the biggest barrier to reaching your goal?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Target',
    options: [
      { value: 'time', label: 'Not enough time' },
      { value: 'motivation', label: 'Lack of motivation' },
      { value: 'knowledge', label: 'Don\'t know where to start' },
      { value: 'consistency', label: 'Trouble staying consistent' },
    ],
  },
  {
    id: 'commitment_level',
    text: 'How much time can you dedicate daily to your goal?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Clock',
    options: [
      { value: '15min', label: '15 minutes' },
      { value: '30min', label: '30 minutes' },
      { value: '1hour', label: '1 hour' },
      { value: 'more', label: 'More than 1 hour' },
    ],
  },
];

const customRoutineFallback: AssessmentQuestion[] = [
  {
    id: 'custom_routine_breakdown',
    text: 'Which part of your daily routine breaks down most often?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Calendar',
    options: [
      { value: 'starting_day', label: 'Starting the day' },
      { value: 'work_blocks', label: 'Focused work blocks' },
      { value: 'evening_wind_down', label: 'Evening wind-down' },
      { value: 'all_areas', label: 'All of these' },
    ],
  },
  {
    id: 'custom_sleep_disruption',
    text: 'What most often disrupts your sleep consistency?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'wellbeing',
    iconName: 'Moon',
    options: [
      { value: 'late_screens', label: 'Late screens' },
      { value: 'irregular_bedtime', label: 'Irregular bedtime' },
      { value: 'overthinking', label: 'Stress or overthinking' },
      { value: 'demands', label: 'Work or family demands' },
    ],
  },
  {
    id: 'custom_meaningful_work',
    text: 'What usually blocks meaningful work each day?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'productivity',
    iconName: 'Target',
    options: [
      { value: 'unclear_priority', label: 'No clear priority' },
      { value: 'distractions', label: 'Distractions' },
      { value: 'low_energy', label: 'Low energy' },
      { value: 'avoidance', label: 'Avoiding hard tasks' },
    ],
  },
  {
    id: 'custom_relationship_action',
    text: 'Which relationship action is hardest to keep consistent?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'relationships',
    iconName: 'Heart',
    options: [
      { value: 'checking_in', label: 'Checking in' },
      { value: 'quality_time', label: 'Quality time' },
      { value: 'difficult_conversations', label: 'Difficult conversations' },
      { value: 'appreciation', label: 'Showing appreciation' },
    ],
  },
  {
    id: 'custom_discipline_structure',
    text: 'What kind of structure would help your discipline most?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Clock',
    options: [
      { value: 'morning_plan', label: 'Morning plan' },
      { value: 'time_blocks', label: 'Time blocks' },
      { value: 'evening_review', label: 'Evening review' },
      { value: 'accountability', label: 'Accountability check-ins' },
    ],
  },
  {
    id: 'custom_daily_reset',
    text: 'When would a daily reset be easiest to maintain?',
    type: 'single_select',
    category: 'goal_specific',
    pillar: 'general',
    iconName: 'Sunrise',
    options: [
      { value: 'after_waking', label: 'Right after waking' },
      { value: 'before_work', label: 'Before work starts' },
      { value: 'after_work', label: 'After work' },
      { value: 'before_bed', label: 'Before bed' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Goal → fallback question map
// ---------------------------------------------------------------------------

const commonBaselineQuestions: AssessmentQuestion[] = [
  {
    id: 'height',
    text: 'What is your height?',
    type: 'number',
    category: 'body_stats',
    pillar: 'general',
    iconName: 'Ruler',
    unit: 'cm',
  },
  {
    id: 'weight',
    text: 'What is your current weight?',
    type: 'number',
    category: 'body_stats',
    pillar: 'general',
    iconName: 'Scale',
    unit: 'kg',
  },
];

const goalQuestionMap: Record<GoalCategory, AssessmentQuestion[]> = {
  weight_loss: weightLossFallback,
  muscle_building: muscleBuildingFallback,
  sleep_improvement: sleepFallback,
  stress_wellness: stressFallback,
  energy_productivity: energyFallback,
  event_training: genericFallback,
  health_condition: genericFallback,
  habit_building: genericFallback,
  overall_optimization: genericFallback,
  nutrition: genericFallback,
  fitness: fitnessFallback,
  custom: genericFallback,
};

function customGoalLooksRoutineBased(customGoalText?: string): boolean {
  if (!customGoalText) return false;
  return /\b(discipline|career|work|focus|meaningful|relationship|relationships|sleep|routine|consistent|consistency|daily)\b/i.test(customGoalText);
}

export function getQuestionsForGoal(
  goalCategory: GoalCategory | null,
  customGoalText?: string
): AssessmentQuestion[] {
  if (!goalCategory) {
    return [...genericFallback, ...commonBaselineQuestions];
  }
  if (goalCategory === 'custom' && customGoalLooksRoutineBased(customGoalText)) {
    return [...customRoutineFallback, ...commonBaselineQuestions];
  }
  const goalSpecificQuestions = goalQuestionMap[goalCategory] || genericFallback;
  return [...goalSpecificQuestions, ...commonBaselineQuestions];
}

export function getAssessmentTitle(goalCategory: GoalCategory | null): string {
  const titles: Record<GoalCategory, string> = {
    weight_loss: 'Weight Loss Assessment',
    muscle_building: 'Muscle Building Assessment',
    sleep_improvement: 'Sleep Quality Assessment',
    stress_wellness: 'Stress & Wellness Assessment',
    energy_productivity: 'Energy Assessment',
    event_training: 'Event Training Assessment',
    health_condition: 'Health Management Assessment',
    habit_building: 'Habit Building Assessment',
    overall_optimization: 'Health Optimization Assessment',
    nutrition: 'Nutrition Assessment',
    fitness: 'Fitness Assessment',
    custom: 'Personal Health Assessment',
  };
  return goalCategory ? titles[goalCategory] : 'Quick Assessment';
}

export function getAssessmentSubtitle(goalCategory: GoalCategory | null): string {
  const subtitles: Record<GoalCategory, string> = {
    weight_loss: 'Help us understand your current habits to create your personalized weight loss plan',
    muscle_building: 'Tell us about your training background to build your muscle-gaining program',
    sleep_improvement: 'Share your sleep patterns so we can help you wake up refreshed',
    stress_wellness: 'Let us understand your stress triggers to design your wellness routine',
    energy_productivity: 'Help us identify what is draining your energy',
    event_training: 'Tell us about your event so we can create your training plan',
    health_condition: 'Share your health goals so we can support your journey safely',
    habit_building: 'Help us understand your patterns to build lasting healthy habits',
    overall_optimization: 'Give us a complete picture to optimize every aspect of your health',
    nutrition: 'Tell us about your eating habits to create a personalized nutrition plan',
    fitness: 'Share your fitness background to design your training program',
    custom: 'Answer a few questions to personalize your experience',
  };
  return goalCategory ? subtitles[goalCategory] : 'Help us personalize your health journey';
}
