export interface GoalContextEntry {
  name: string;
  description: string;
  keyTopics: string[];
}

export const goalContextMap: Record<string, GoalContextEntry> = {
  weight_loss: {
    name: 'Weight Loss',
    description: 'User wants to lose weight and reduce body fat',
    keyTopics: ['current diet habits', 'exercise frequency', 'eating triggers', 'portion control', 'meal timing', 'hydration', 'past diet attempts'],
  },
  muscle_building: {
    name: 'Muscle Building',
    description: 'User wants to build muscle mass and increase strength',
    keyTopics: ['training experience', 'workout preference', 'protein intake', 'recovery habits', 'gym access', 'supplement use', 'training schedule'],
  },
  sleep_improvement: {
    name: 'Sleep Improvement',
    description: 'User wants to improve sleep quality and duration',
    keyTopics: ['sleep challenges', 'sleep duration', 'bedtime routine', 'screen habits', 'caffeine intake', 'stress impact on sleep', 'sleep schedule'],
  },
  stress_wellness: {
    name: 'Stress Management & Wellness',
    description: 'User wants to reduce stress and improve mental wellbeing',
    keyTopics: ['stress triggers', 'coping mechanisms', 'mindfulness experience', 'stress impact on life', 'anxiety frequency', 'relaxation preferences', 'work-life balance'],
  },
  energy_productivity: {
    name: 'Energy & Productivity',
    description: 'User wants to boost energy levels and daily productivity',
    keyTopics: ['energy patterns', 'work hours', 'afternoon crashes', 'morning routine', 'hydration', 'sleep quality', 'break habits'],
  },
  event_training: {
    name: 'Event Training',
    description: 'User is training for a specific athletic event or competition',
    keyTopics: ['event type', 'event timeline', 'fitness level', 'training frequency', 'past events', 'nutrition strategy', 'recovery routine'],
  },
  health_condition: {
    name: 'Health Condition Management',
    description: 'User wants to manage a health condition through lifestyle changes',
    keyTopics: ['condition type', 'daily impact', 'medical supervision', 'medications', 'exercise capacity', 'dietary restrictions', 'health concerns'],
  },
  habit_building: {
    name: 'Habit Building',
    description: 'User wants to build healthy habits and stick to them',
    keyTopics: ['target habit', 'past attempts', 'barriers', 'preferred time', 'accountability preference', 'time commitment', 'motivation style'],
  },
  overall_optimization: {
    name: 'Overall Health Optimization',
    description: 'User wants to improve overall health across fitness, nutrition, sleep, and mental wellness',
    keyTopics: ['weakest health area', 'health priority', 'readiness for change', 'exercise frequency', 'eating habits', 'stress level', 'sleep quality'],
  },
  fitness: {
    name: 'Fitness & Exercise',
    description: 'User wants to improve fitness through exercise and movement',
    keyTopics: ['current activity level', 'exercise preference', 'time availability', 'fitness goals', 'obstacles', 'workout environment', 'motivation', 'recovery'],
  },
  nutrition: {
    name: 'Nutrition',
    description: 'User wants to improve nutrition and eating habits',
    keyTopics: ['eating patterns', 'cooking frequency', 'cravings', 'dietary preference', 'meal timing', 'hydration', 'food knowledge', 'consistency'],
  },
  custom: {
    name: 'Custom Health Goals',
    description: 'User has personalized health goals',
    keyTopics: ['desired changes', 'current challenges', 'exercise habits', 'stress level', 'sleep quality', 'hydration', 'motivation'],
  },
};

export const batchGoalContextMap: Record<string, GoalContextEntry> = {
  ...goalContextMap,
  weight_loss: {
    name: 'Weight Loss',
    description: 'lose weight and reduce body fat',
    keyTopics: ['current activity level', 'eating habits', 'snacking patterns', 'meal timing', 'hydration', 'sleep quality', 'motivation', 'biggest obstacles'],
  },
  muscle_building: {
    name: 'Muscle Building',
    description: 'build muscle mass and increase strength',
    keyTopics: ['training experience', 'workout preference', 'gym access', 'protein intake', 'recovery habits', 'training schedule', 'supplement use', 'muscle goals'],
  },
  sleep_improvement: {
    name: 'Sleep Improvement',
    description: 'improve sleep quality and duration',
    keyTopics: ['sleep challenges', 'sleep duration', 'bedtime routine', 'screen habits', 'caffeine intake', 'stress impact', 'sleep schedule', 'morning energy'],
  },
  stress_wellness: {
    name: 'Stress Management & Wellness',
    description: 'reduce stress and improve mental wellbeing',
    keyTopics: ['stress triggers', 'coping mechanisms', 'mindfulness experience', 'work-life balance', 'anxiety frequency', 'relaxation preferences', 'social support', 'energy patterns'],
  },
  energy_productivity: {
    name: 'Energy & Productivity',
    description: 'boost energy levels and daily productivity',
    keyTopics: ['energy patterns', 'work rhythm', 'afternoon crashes', 'morning routine', 'focus time', 'distractions', 'break habits', 'time management'],
  },
  event_training: {
    name: 'Event Training',
    description: 'train for a specific athletic event or competition',
    keyTopics: ['event type', 'event timeline', 'current fitness', 'training frequency', 'nutrition strategy', 'recovery routine', 'past events', 'performance goals'],
  },
  health_condition: {
    name: 'Health Condition Management',
    description: 'manage a health condition through lifestyle changes',
    keyTopics: ['daily impact', 'exercise capacity', 'dietary needs', 'energy level', 'sleep quality', 'stress management', 'support system', 'health priorities'],
  },
  habit_building: {
    name: 'Habit Building',
    description: 'build healthy habits and stick to them',
    keyTopics: ['target habit', 'past attempts', 'barriers', 'preferred time', 'accountability style', 'time commitment', 'motivation style', 'tracking preference'],
  },
  overall_optimization: {
    name: 'Overall Health Optimization',
    description: 'improve overall health across fitness, nutrition, sleep, and mental wellness',
    keyTopics: ['weakest health area', 'health priority', 'exercise frequency', 'eating habits', 'stress level', 'sleep quality', 'energy level', 'readiness for change'],
  },
  fitness: {
    name: 'Fitness & Exercise',
    description: 'improve fitness through exercise and movement',
    keyTopics: ['current activity level', 'exercise preference', 'time availability', 'fitness goals', 'obstacles', 'workout environment', 'motivation', 'recovery'],
  },
  nutrition: {
    name: 'Nutrition',
    description: 'improve nutrition and eating habits',
    keyTopics: ['eating patterns', 'cooking frequency', 'cravings', 'dietary preference', 'meal timing', 'hydration', 'food knowledge', 'consistency'],
  },
  custom: {
    name: 'Custom Goal',
    description: 'achieve a personalized goal',
    keyTopics: ['current state', 'biggest challenges', 'time availability', 'past attempts', 'support needs', 'motivation', 'preferred approach', 'desired timeline'],
  },
};

export const goalCategoryNames: Record<string, string> = {
  weight_loss: 'Weight Loss',
  muscle_building: 'Build Muscle',
  sleep_improvement: 'Better Sleep',
  stress_wellness: 'Stress Management',
  energy_productivity: 'More Energy',
  event_training: 'Event Training',
  health_condition: 'Health Condition',
  habit_building: 'Build Habits',
  overall_optimization: 'Overall Optimization',
  custom: 'Custom Goal',
};

export const goalDescriptions: Record<string, string> = {
  weight_loss: 'weight loss and healthy weight management',
  muscle_building: 'building muscle and strength',
  sleep_improvement: 'improving sleep quality',
  stress_wellness: 'stress management and wellbeing',
  energy_productivity: 'increasing energy and productivity',
  event_training: 'training for a specific event',
  health_condition: 'managing a health condition',
  habit_building: 'building healthy habits',
  overall_optimization: 'overall health optimization',
  financial: 'financial goals and money management',
  faith: 'faith, spiritual practice, and religious goals',
  relationships: 'improving relationships — family, friends, or partner',
  education: 'education, learning, and personal study goals',
  career: 'career development and professional growth',
  health_wellness: 'general health and wellness improvements',
  spiritual: 'spiritual growth and mindfulness',
  social: 'social connections and community building',
  productivity: 'productivity and time management',
  happiness: 'happiness and life satisfaction',
  anxiety_management: 'managing anxiety and building resilience',
  creative: 'creative pursuits and artistic goals',
  personal_growth: 'personal growth and self-improvement',
  custom: 'personalized goals',
};
