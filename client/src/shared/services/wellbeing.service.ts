/**
 * @file Wellbeing API Service
 * @description Client-side API service for all wellbeing features
 */

import { api, type ApiResponse } from '@/lib/api-client';
import type {
  MoodLog,
  EnergyLog,
  JournalEntry,
  Habit,
  HabitLog,
  WellbeingRoutine,
  RoutineCompletion,
  MindfulnessPractice,
  BreathingTest,
  BreathingTimelineData,
  BreathingStats,
  BreathingTestType,
  EmotionTag,
  MoodEmoji,
  WellbeingMode,
  JournalPromptCategory,
  HabitTrackingType,
} from '@shared/types/domain/wellbeing';

// ============================================
// MOOD SERVICE
// ============================================

export interface CreateMoodLogRequest {
  mood_emoji?: MoodEmoji;
  descriptor?: string;
  happiness_rating?: number;
  energy_rating?: number;
  stress_rating?: number;
  anxiety_rating?: number;
  emotion_tags?: EmotionTag[];
  context_note?: string;
  mode: WellbeingMode;
  logged_at?: string;
}

export interface MoodLogsResponse {
  logs: MoodLog[];
  total: number;
  page: number;
  limit: number;
}

export interface MoodTimelineResponse {
  timeline: Array<{
    date: string;
    moodEmoji?: MoodEmoji;
    averageRating?: number;
    emotionTags: EmotionTag[];
  }>;
}

export interface MoodPatternsResponse {
  patterns: {
    timeOfDay: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
    dominantEmotions: Array<{ tag: EmotionTag; frequency: number }>;
    averageRatings: {
      happiness?: number;
      energy?: number;
      stress?: number;
      anxiety?: number;
    };
  };
}

export const moodService = {
  async createLog(data: CreateMoodLogRequest): Promise<ApiResponse<{ moodLog: MoodLog }>> {
    return api.post('/v1/wellbeing/mood', data);
  },

  async getLogs(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<MoodLogsResponse>> {
    return api.get('/v1/wellbeing/mood', { params });
  },

  async getTimeline(startDate: string, endDate: string): Promise<ApiResponse<MoodTimelineResponse>> {
    return api.get('/v1/wellbeing/mood/timeline', {
      params: { startDate, endDate },
    });
  },

  async getPatterns(days: number = 30): Promise<ApiResponse<MoodPatternsResponse>> {
    return api.get('/v1/wellbeing/mood/patterns', {
      params: { days },
    });
  },
};

// ============================================
// ENERGY SERVICE
// ============================================

export interface CreateEnergyLogRequest {
  energy_rating: number;
  context_tag?: string;
  context_note?: string;
  logged_at?: string;
}

export interface EnergyLogsResponse {
  logs: EnergyLog[];
  total: number;
  page: number;
  limit: number;
}

export interface EnergyTimelineResponse {
  timeline: Array<{
    timestamp: string;
    energyRating: number;
    contextTag?: string;
  }>;
}

export interface EnergyPatternsResponse {
  patterns: {
    timeOfDay: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
    averageByContext: Array<{
      context: string;
      averageRating: number;
      count: number;
    }>;
  };
}

export const energyService = {
  async createLog(data: CreateEnergyLogRequest): Promise<ApiResponse<{ energyLog: EnergyLog }>> {
    return api.post('/v1/wellbeing/energy', data);
  },

  async getLogs(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<EnergyLogsResponse>> {
    return api.get('/v1/wellbeing/energy', { params });
  },

  async getLogById(id: string): Promise<ApiResponse<{ energyLog: EnergyLog }>> {
    return api.get(`/v1/wellbeing/energy/${id}`);
  },

  async updateLog(id: string, data: Partial<CreateEnergyLogRequest>): Promise<ApiResponse<{ energyLog: EnergyLog }>> {
    return api.put(`/v1/wellbeing/energy/${id}`, data);
  },

  async deleteLog(id: string): Promise<ApiResponse<null>> {
    return api.delete(`/v1/wellbeing/energy/${id}`);
  },

  async getTimeline(startDate: string, endDate: string): Promise<ApiResponse<EnergyTimelineResponse>> {
    return api.get('/v1/wellbeing/energy/timeline', {
      params: { startDate, endDate },
    });
  },

  async getPatterns(days: number = 30): Promise<ApiResponse<EnergyPatternsResponse>> {
    return api.get('/v1/wellbeing/energy/patterns', {
      params: { days },
    });
  },
};

// ============================================
// JOURNAL SERVICE
// ============================================

export interface JournalPrompt {
  id: string;
  text: string;
  category: JournalPromptCategory;
  description?: string;
}

export interface CreateJournalEntryRequest {
  prompt: string;
  prompt_category?: JournalPromptCategory;
  prompt_id?: string;
  entry_text: string;
  mode: WellbeingMode;
  voice_entry?: boolean;
  duration_seconds?: number;
  logged_at?: string;
}

export interface JournalEntriesResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface JournalStreakResponse {
  streak: {
    currentStreak: number;
    longestStreak: number;
    streakStartDate?: string;
  };
}

export const journalService = {
  async getPrompts(limit: number = 3): Promise<ApiResponse<{ prompts: JournalPrompt[] }>> {
    return api.get('/v1/wellbeing/journal/prompts', {
      params: { limit },
    });
  },

  async createEntry(data: CreateJournalEntryRequest): Promise<ApiResponse<{ entry: JournalEntry }>> {
    return api.post('/v1/wellbeing/journal', data);
  },

  async getEntries(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    category?: JournalPromptCategory;
  }): Promise<ApiResponse<JournalEntriesResponse>> {
    return api.get('/v1/wellbeing/journal', { params });
  },

  async getEntry(id: string): Promise<ApiResponse<{ entry: JournalEntry }>> {
    return api.get(`/v1/wellbeing/journal/${id}`);
  },

  async updateEntry(id: string, data: Partial<CreateJournalEntryRequest>): Promise<ApiResponse<{ entry: JournalEntry }>> {
    return api.put(`/v1/wellbeing/journal/${id}`, data);
  },

  async deleteEntry(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/v1/wellbeing/journal/${id}`);
  },

  async getStreak(): Promise<ApiResponse<JournalStreakResponse>> {
    return api.get('/v1/wellbeing/journal/streak');
  },
};

// ============================================
// HABIT SERVICE
// ============================================

export interface CreateHabitRequest {
  habit_name: string;
  category?: string;
  tracking_type: HabitTrackingType;
  frequency: 'daily' | 'weekly' | 'custom';
  specific_days?: string[];
  description?: string;
  target_value?: number;
  unit?: string;
  reminder_enabled?: boolean;
  reminder_time?: string;
}

export interface UpdateHabitRequest extends Partial<CreateHabitRequest> {
  is_active?: boolean;
  is_archived?: boolean;
}

export interface CreateHabitLogRequest {
  completed: boolean;
  value?: number;
  note?: string;
  log_date?: string;
}

export interface HabitAnalyticsResponse {
  analytics: {
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    streakStartDate?: string;
    lastCompleted?: string;
    totalCompletions: number;
    totalDays: number;
    correlations?: Array<{
      metric: string;
      correlation: number;
      insight?: string;
    }>;
  };
}

export const habitService = {
  async getHabits(includeArchived: boolean = false): Promise<ApiResponse<{ habits: Habit[] }>> {
    return api.get('/v1/wellbeing/habits', {
      params: { includeArchived },
    });
  },

  async createHabit(data: CreateHabitRequest): Promise<ApiResponse<{ habit: Habit }>> {
    return api.post('/v1/wellbeing/habits', data);
  },

  async getHabit(id: string): Promise<ApiResponse<{ habit: Habit }>> {
    return api.get(`/v1/wellbeing/habits/${id}`);
  },

  async updateHabit(id: string, data: UpdateHabitRequest): Promise<ApiResponse<{ habit: Habit }>> {
    return api.put(`/v1/wellbeing/habits/${id}`, data);
  },

  async deleteHabit(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/v1/wellbeing/habits/${id}`);
  },

  async logCompletion(
    id: string,
    data: CreateHabitLogRequest
  ): Promise<ApiResponse<{ habitLog: HabitLog }>> {
    return api.post(`/v1/wellbeing/habits/${id}/log`, data);
  },

  async getLogs(id: string, days: number = 30): Promise<ApiResponse<{ logs: HabitLog[] }>> {
    return api.get(`/v1/wellbeing/habits/${id}/logs`, {
      params: { days },
    });
  },

  async getAnalytics(id: string, days: number = 30): Promise<ApiResponse<HabitAnalyticsResponse>> {
    return api.get(`/v1/wellbeing/habits/${id}/analytics`, {
      params: { days },
    });
  },
};

// ============================================
// ROUTINE SERVICE
// ============================================

export interface RoutineTemplate {
  name: string;
  type: 'morning' | 'evening' | 'custom';
  steps: Array<{
    step: string;
    durationMin: number;
    order: number;
    instructions?: string;
  }>;
  description: string;
}

export interface CreateRoutineRequest {
  routine_name: string;
  routine_type: 'morning' | 'evening' | 'custom';
  steps: Array<{
    step: string;
    duration_min: number;
    order: number;
    instructions?: string;
  }>;
  frequency?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  specific_days?: string[];
  trigger_time?: string;
  template_id?: string;
}

export interface CompleteRoutineRequest {
  steps_completed: Array<{
    step: string;
    completed: boolean;
    completed_at?: string;
  }>;
  started_at?: string;
  completed_at?: string;
}

export interface RoutineProgressResponse {
  progress: {
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    completions: RoutineCompletion[];
  };
}

export const routineService = {
  async getTemplates(): Promise<ApiResponse<{ templates: RoutineTemplate[] }>> {
    return api.get('/v1/wellbeing/routines/templates');
  },

  async createRoutine(data: CreateRoutineRequest): Promise<ApiResponse<{ routine: WellbeingRoutine }>> {
    return api.post('/v1/wellbeing/routines', data);
  },

  async getRoutines(includeArchived: boolean = false): Promise<ApiResponse<{ routines: WellbeingRoutine[] }>> {
    return api.get('/v1/wellbeing/routines', {
      params: { includeArchived },
    });
  },

  async getRoutine(id: string): Promise<ApiResponse<{ routine: WellbeingRoutine }>> {
    return api.get(`/v1/wellbeing/routines/${id}`);
  },

  async completeRoutine(
    id: string,
    data: CompleteRoutineRequest
  ): Promise<ApiResponse<{ completion: RoutineCompletion }>> {
    return api.post(`/v1/wellbeing/routines/${id}/complete`, data);
  },

  async getProgress(id: string, days: number = 30): Promise<ApiResponse<RoutineProgressResponse>> {
    return api.get(`/v1/wellbeing/routines/${id}/progress`, {
      params: { days },
    });
  },
};

// ============================================
// MINDFULNESS SERVICE
// ============================================

export interface LogPracticeRequest {
  practice_name: string;
  practice_category: 'breathing' | 'meditation' | 'movement' | 'quick_reset' | 'evening';
  actual_duration_minutes?: number;
  effectiveness_rating?: number;
  context?: string;
  note?: string;
}

export const mindfulnessService = {
  async getPractices(): Promise<ApiResponse<{ practices: MindfulnessPractice[] }>> {
    return api.get('/v1/wellbeing/mindfulness/practices');
  },

  async getRecommendation(
    context?: 'high_stress' | 'low_energy' | 'low_mood' | 'poor_sleep'
  ): Promise<ApiResponse<{ practice: MindfulnessPractice | null }>> {
    return api.get('/v1/wellbeing/mindfulness/recommend', {
      params: context ? { context } : undefined,
    });
  },

  async logPractice(data: LogPracticeRequest): Promise<ApiResponse<{ practice: MindfulnessPractice }>> {
    return api.post('/v1/wellbeing/mindfulness/log', data);
  },

  async getHistory(limit: number = 20): Promise<ApiResponse<{ history: MindfulnessPractice[] }>> {
    return api.get('/v1/wellbeing/mindfulness/history', {
      params: { limit },
    });
  },
};

// ============================================
// BREATHING SERVICE
// ============================================

export interface CreateBreathingTestRequest {
  test_type: BreathingTestType;
  pattern_name?: string;
  breath_hold_duration_seconds?: number;
  total_cycles_completed?: number;
  total_duration_seconds: number;
  average_inhale_duration?: number;
  average_exhale_duration?: number;
  average_hold_duration?: number;
  consistency_score?: number;
  difficulty_rating?: number;
  notes?: string;
  started_at: string;
}

export interface BreathingTestsResponse {
  tests: BreathingTest[];
  total: number;
  page: number;
  limit: number;
}

export interface BreathingTimelineResponse {
  timeline: BreathingTimelineData[];
}

export interface BreathingStatsResponse {
  stats: BreathingStats;
}

export const breathingService = {
  async saveTest(data: CreateBreathingTestRequest): Promise<ApiResponse<{ breathingTest: BreathingTest }>> {
    return api.post('/v1/wellbeing/breathing', data);
  },

  async getTests(params?: {
    startDate?: string;
    endDate?: string;
    testType?: BreathingTestType;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<BreathingTestsResponse>> {
    return api.get('/v1/wellbeing/breathing', { params });
  },

  async getTestById(id: string): Promise<ApiResponse<{ breathingTest: BreathingTest }>> {
    return api.get(`/v1/wellbeing/breathing/${id}`);
  },

  async deleteTest(id: string): Promise<ApiResponse<null>> {
    return api.delete(`/v1/wellbeing/breathing/${id}`);
  },

  async getTimeline(startDate: string, endDate: string): Promise<ApiResponse<BreathingTimelineResponse>> {
    return api.get('/v1/wellbeing/breathing/timeline', {
      params: { startDate, endDate },
    });
  },

  async getStats(days: number = 30): Promise<ApiResponse<BreathingStatsResponse>> {
    return api.get('/v1/wellbeing/breathing/stats', {
      params: { days },
    });
  },
};

