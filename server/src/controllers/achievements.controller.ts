import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { query } from '../database/pg.js';
import { getPublicProfile } from '../utils/user.helpers.js';

// Achievement definitions - these define all possible achievements
interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'streak' | 'milestone' | 'special' | 'challenge' | 'pillar';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  maxProgress: number;
  checkFn: (stats: UserStats) => { unlocked: boolean; progress: number; unlockedAt?: Date };
}

interface UserStats {
  totalActivitiesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  fitnessActivities: number;
  nutritionActivities: number;
  wellbeingActivities: number;
  totalWorkouts: number;
  totalMeals: number;
  totalMindfulness: number;
  daysActive: number;
  perfectDays: number;
  earlyMorningWorkouts: number;
  weekendWorkouts: number;
  accountCreatedAt: Date;
  integrationsConnected: number;
  assessmentsCompleted: number;
}

// Define all achievements
const achievementDefinitions: AchievementDef[] = [
  // ============================================
  // STREAK ACHIEVEMENTS
  // ============================================
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first activity',
    icon: '👣',
    category: 'streak',
    rarity: 'common',
    xpReward: 50,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.totalActivitiesCompleted >= 1,
      progress: Math.min(stats.totalActivitiesCompleted, 1),
    }),
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 7,
    checkFn: (stats) => ({
      unlocked: stats.currentStreak >= 7 || stats.longestStreak >= 7,
      progress: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 7),
    }),
  },
  {
    id: 'two_week_titan',
    title: 'Two Week Titan',
    description: 'Maintain a 14-day streak',
    icon: '💪',
    category: 'streak',
    rarity: 'rare',
    xpReward: 250,
    maxProgress: 14,
    checkFn: (stats) => ({
      unlocked: stats.currentStreak >= 14 || stats.longestStreak >= 14,
      progress: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 14),
    }),
  },
  {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    rarity: 'epic',
    xpReward: 500,
    maxProgress: 30,
    checkFn: (stats) => ({
      unlocked: stats.currentStreak >= 30 || stats.longestStreak >= 30,
      progress: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 30),
    }),
  },
  {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 2000,
    maxProgress: 100,
    checkFn: (stats) => ({
      unlocked: stats.currentStreak >= 100 || stats.longestStreak >= 100,
      progress: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 100),
    }),
  },

  // ============================================
  // MILESTONE ACHIEVEMENTS
  // ============================================
  {
    id: 'ten_activities',
    title: 'Getting Started',
    description: 'Complete 10 activities',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 10,
    checkFn: (stats) => ({
      unlocked: stats.totalActivitiesCompleted >= 10,
      progress: Math.min(stats.totalActivitiesCompleted, 10),
    }),
  },
  {
    id: 'fifty_activities',
    title: 'Dedicated',
    description: 'Complete 50 activities',
    icon: '⭐',
    category: 'milestone',
    rarity: 'rare',
    xpReward: 300,
    maxProgress: 50,
    checkFn: (stats) => ({
      unlocked: stats.totalActivitiesCompleted >= 50,
      progress: Math.min(stats.totalActivitiesCompleted, 50),
    }),
  },
  {
    id: 'hundred_activities',
    title: 'Centurion',
    description: 'Complete 100 activities',
    icon: '💯',
    category: 'milestone',
    rarity: 'epic',
    xpReward: 750,
    maxProgress: 100,
    checkFn: (stats) => ({
      unlocked: stats.totalActivitiesCompleted >= 100,
      progress: Math.min(stats.totalActivitiesCompleted, 100),
    }),
  },
  {
    id: 'five_hundred_activities',
    title: 'Elite Performer',
    description: 'Complete 500 activities',
    icon: '🌟',
    category: 'milestone',
    rarity: 'legendary',
    xpReward: 2500,
    maxProgress: 500,
    checkFn: (stats) => ({
      unlocked: stats.totalActivitiesCompleted >= 500,
      progress: Math.min(stats.totalActivitiesCompleted, 500),
    }),
  },

  // ============================================
  // GOAL ACHIEVEMENTS
  // ============================================
  {
    id: 'goal_setter',
    title: 'Goal Setter',
    description: 'Create your first goal',
    icon: '🎪',
    category: 'milestone',
    rarity: 'common',
    xpReward: 50,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.totalGoals >= 1,
      progress: Math.min(stats.totalGoals, 1),
    }),
  },
  {
    id: 'goal_achiever',
    title: 'Goal Achiever',
    description: 'Complete your first goal',
    icon: '🏅',
    category: 'milestone',
    rarity: 'rare',
    xpReward: 500,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.completedGoals >= 1,
      progress: Math.min(stats.completedGoals, 1),
    }),
  },
  {
    id: 'goal_crusher',
    title: 'Goal Crusher',
    description: 'Complete 5 goals',
    icon: '🎖️',
    category: 'milestone',
    rarity: 'epic',
    xpReward: 1500,
    maxProgress: 5,
    checkFn: (stats) => ({
      unlocked: stats.completedGoals >= 5,
      progress: Math.min(stats.completedGoals, 5),
    }),
  },

  // ============================================
  // PILLAR ACHIEVEMENTS
  // ============================================
  {
    id: 'fitness_starter',
    title: 'Fitness Starter',
    description: 'Complete 10 fitness activities',
    icon: '🏋️',
    category: 'pillar',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 10,
    checkFn: (stats) => ({
      unlocked: stats.fitnessActivities >= 10,
      progress: Math.min(stats.fitnessActivities, 10),
    }),
  },
  {
    id: 'fitness_enthusiast',
    title: 'Fitness Enthusiast',
    description: 'Complete 50 fitness activities',
    icon: '💪',
    category: 'pillar',
    rarity: 'rare',
    xpReward: 400,
    maxProgress: 50,
    checkFn: (stats) => ({
      unlocked: stats.fitnessActivities >= 50,
      progress: Math.min(stats.fitnessActivities, 50),
    }),
  },
  {
    id: 'nutrition_starter',
    title: 'Nutrition Starter',
    description: 'Log 10 meals',
    icon: '🥗',
    category: 'pillar',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 10,
    checkFn: (stats) => ({
      unlocked: stats.nutritionActivities >= 10,
      progress: Math.min(stats.nutritionActivities, 10),
    }),
  },
  {
    id: 'nutrition_master',
    title: 'Nutrition Master',
    description: 'Log 100 meals',
    icon: '🍎',
    category: 'pillar',
    rarity: 'epic',
    xpReward: 600,
    maxProgress: 100,
    checkFn: (stats) => ({
      unlocked: stats.nutritionActivities >= 100,
      progress: Math.min(stats.nutritionActivities, 100),
    }),
  },
  {
    id: 'wellbeing_explorer',
    title: 'Wellbeing Explorer',
    description: 'Complete 10 wellbeing activities',
    icon: '🧘',
    category: 'pillar',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 10,
    checkFn: (stats) => ({
      unlocked: stats.wellbeingActivities >= 10,
      progress: Math.min(stats.wellbeingActivities, 10),
    }),
  },
  {
    id: 'zen_master',
    title: 'Zen Master',
    description: 'Complete 50 mindfulness sessions',
    icon: '☮️',
    category: 'pillar',
    rarity: 'epic',
    xpReward: 600,
    maxProgress: 50,
    checkFn: (stats) => ({
      unlocked: stats.totalMindfulness >= 50,
      progress: Math.min(stats.totalMindfulness, 50),
    }),
  },

  // ============================================
  // SPECIAL ACHIEVEMENTS
  // ============================================
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Complete 10 workouts before 7 AM',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    xpReward: 300,
    maxProgress: 10,
    checkFn: (stats) => ({
      unlocked: stats.earlyMorningWorkouts >= 10,
      progress: Math.min(stats.earlyMorningWorkouts, 10),
    }),
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete 20 weekend workouts',
    icon: '🎊',
    category: 'special',
    rarity: 'rare',
    xpReward: 350,
    maxProgress: 20,
    checkFn: (stats) => ({
      unlocked: stats.weekendWorkouts >= 20,
      progress: Math.min(stats.weekendWorkouts, 20),
    }),
  },
  {
    id: 'perfect_day',
    title: 'Perfect Day',
    description: 'Complete all scheduled activities in a day',
    icon: '✨',
    category: 'special',
    rarity: 'common',
    xpReward: 75,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.perfectDays >= 1,
      progress: Math.min(stats.perfectDays, 1),
    }),
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Have 7 perfect days',
    icon: '🌈',
    category: 'special',
    rarity: 'epic',
    xpReward: 800,
    maxProgress: 7,
    checkFn: (stats) => ({
      unlocked: stats.perfectDays >= 7,
      progress: Math.min(stats.perfectDays, 7),
    }),
  },

  // ============================================
  // CHALLENGE ACHIEVEMENTS
  // ============================================
  {
    id: 'connected',
    title: 'Connected',
    description: 'Connect your first health integration',
    icon: '🔗',
    category: 'challenge',
    rarity: 'common',
    xpReward: 100,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.integrationsConnected >= 1,
      progress: Math.min(stats.integrationsConnected, 1),
    }),
  },
  {
    id: 'data_driven',
    title: 'Data Driven',
    description: 'Connect 3 health integrations',
    icon: '📊',
    category: 'challenge',
    rarity: 'rare',
    xpReward: 400,
    maxProgress: 3,
    checkFn: (stats) => ({
      unlocked: stats.integrationsConnected >= 3,
      progress: Math.min(stats.integrationsConnected, 3),
    }),
  },
  {
    id: 'self_aware',
    title: 'Self Aware',
    description: 'Complete a health assessment',
    icon: '🔍',
    category: 'challenge',
    rarity: 'common',
    xpReward: 75,
    maxProgress: 1,
    checkFn: (stats) => ({
      unlocked: stats.assessmentsCompleted >= 1,
      progress: Math.min(stats.assessmentsCompleted, 1),
    }),
  },
  {
    id: 'balanced_life',
    title: 'Balanced Life',
    description: 'Complete activities in all 3 pillars in one week',
    icon: '⚖️',
    category: 'challenge',
    rarity: 'epic',
    xpReward: 500,
    maxProgress: 3,
    checkFn: (stats) => {
      // Check if user has at least one activity in each pillar
      const pillarsActive = [
        stats.fitnessActivities > 0 ? 1 : 0,
        stats.nutritionActivities > 0 ? 1 : 0,
        stats.wellbeingActivities > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0);
      return {
        unlocked: pillarsActive === 3,
        progress: pillarsActive,
      };
    },
  },
];

// Helper function to gather all user stats
async function getUserStats(userId: string): Promise<UserStats> {
  // Get user creation date
  const userResult = await query<{ created_at: Date }>(
    'SELECT created_at FROM users WHERE id = $1',
    [userId]
  );
  const accountCreatedAt = userResult.rows[0]?.created_at || new Date();

  // Get total activities from activity_logs
  const activitiesResult = await query<{ completed_count: string; days_active: string }>(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(DISTINCT scheduled_date) FILTER (WHERE status = 'completed') as days_active
    FROM activity_logs
    WHERE user_id = $1`,
    [userId]
  );
  const totalActivitiesCompleted = parseInt(activitiesResult.rows[0]?.completed_count || '0');
  const daysActive = parseInt(activitiesResult.rows[0]?.days_active || '0');

  // Get goal stats
  const goalsResult = await query<{ total_goals: string; completed_goals: string; active_goals: string }>(
    `SELECT
      COUNT(*) as total_goals,
      COUNT(*) FILTER (WHERE status = 'completed') as completed_goals,
      COUNT(*) FILTER (WHERE status = 'active') as active_goals
    FROM user_goals
    WHERE user_id = $1`,
    [userId]
  );
  const totalGoals = parseInt(goalsResult.rows[0]?.total_goals || '0');
  const completedGoals = parseInt(goalsResult.rows[0]?.completed_goals || '0');
  const activeGoals = parseInt(goalsResult.rows[0]?.active_goals || '0');

  // Get pillar activities from user_plans activities JSONB
  const pillarActivitiesResult = await query<{ pillar: string; completed_count: string }>(
    `SELECT
      up.pillar,
      COUNT(al.id) FILTER (WHERE al.status = 'completed') as completed_count
    FROM user_plans up
    LEFT JOIN activity_logs al ON al.plan_id = up.id
    WHERE up.user_id = $1
    GROUP BY up.pillar`,
    [userId]
  );

  let fitnessActivities = 0;
  let nutritionActivities = 0;
  let wellbeingActivities = 0;

  for (const row of pillarActivitiesResult.rows) {
    const count = parseInt(row.completed_count || '0');
    switch (row.pillar) {
      case 'fitness':
        fitnessActivities = count;
        break;
      case 'nutrition':
        nutritionActivities = count;
        break;
      case 'wellbeing':
        wellbeingActivities = count;
        break;
    }
  }

  // Get workout and meal specific counts from health_data_records
  const workoutsResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM health_data_records
     WHERE user_id = $1 AND data_type = 'workouts'`,
    [userId]
  );
  const totalWorkouts = parseInt(workoutsResult.rows[0]?.count || '0');

  const mealsResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM health_data_records
     WHERE user_id = $1 AND data_type = 'nutrition'`,
    [userId]
  );
  const totalMeals = parseInt(mealsResult.rows[0]?.count || '0');

  // Calculate streaks from activity_logs
  const streakResult = await query<{ longest_streak: string }>(
    `WITH daily_completions AS (
      SELECT
        scheduled_date,
        CASE WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0 THEN 1 ELSE 0 END as had_completion
      FROM activity_logs
      WHERE user_id = $1
      GROUP BY scheduled_date
      ORDER BY scheduled_date DESC
    ),
    streak_groups AS (
      SELECT
        scheduled_date,
        had_completion,
        scheduled_date - (ROW_NUMBER() OVER (ORDER BY scheduled_date))::int AS grp
      FROM daily_completions
      WHERE had_completion = 1
    )
    SELECT
      MAX(COUNT(*)) OVER () as longest_streak
    FROM streak_groups
    GROUP BY grp
    LIMIT 1`,
    [userId]
  );
  const longestStreak = parseInt(streakResult.rows[0]?.longest_streak || '0');

  // Get current streak
  const currentStreakResult = await query<{ current_streak: string }>(
    `WITH daily_completions AS (
      SELECT
        scheduled_date,
        CASE WHEN COUNT(*) FILTER (WHERE status = 'completed') > 0 THEN 1 ELSE 0 END as had_completion
      FROM activity_logs
      WHERE user_id = $1
      GROUP BY scheduled_date
      ORDER BY scheduled_date DESC
    )
    SELECT COUNT(*) as current_streak
    FROM (
      SELECT
        scheduled_date,
        had_completion,
        ROW_NUMBER() OVER (ORDER BY scheduled_date DESC) as rn
      FROM daily_completions
    ) sub
    WHERE had_completion = 1
      AND scheduled_date >= CURRENT_DATE - rn::int`,
    [userId]
  );
  const currentStreak = parseInt(currentStreakResult.rows[0]?.current_streak || '0');

  // Get integrations count
  const integrationsResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM user_integrations
     WHERE user_id = $1 AND status = 'active'`,
    [userId]
  );
  const integrationsConnected = parseInt(integrationsResult.rows[0]?.count || '0');

  // Get assessments completed
  const assessmentsResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM assessment_responses
     WHERE user_id = $1 AND is_complete = true`,
    [userId]
  );
  const assessmentsCompleted = parseInt(assessmentsResult.rows[0]?.count || '0');

  // Get perfect days (days where all scheduled activities were completed)
  const perfectDaysResult = await query<{ perfect_days: string }>(
    `WITH daily_stats AS (
      SELECT
        scheduled_date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM activity_logs
      WHERE user_id = $1
      GROUP BY scheduled_date
    )
    SELECT COUNT(*) as perfect_days
    FROM daily_stats
    WHERE total = completed AND total > 0`,
    [userId]
  );
  const perfectDays = parseInt(perfectDaysResult.rows[0]?.perfect_days || '0');

  // Get early morning workouts (simplified - using health_data_records)
  const earlyMorningResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM health_data_records
     WHERE user_id = $1
     AND data_type = 'workouts'
     AND EXTRACT(HOUR FROM recorded_at) < 7`,
    [userId]
  );
  const earlyMorningWorkouts = parseInt(earlyMorningResult.rows[0]?.count || '0');

  // Get weekend workouts
  const weekendResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM health_data_records
     WHERE user_id = $1
     AND data_type = 'workouts'
     AND EXTRACT(DOW FROM recorded_at) IN (0, 6)`,
    [userId]
  );
  const weekendWorkouts = parseInt(weekendResult.rows[0]?.count || '0');

  return {
    totalActivitiesCompleted,
    currentStreak,
    longestStreak,
    totalGoals,
    completedGoals,
    activeGoals,
    fitnessActivities,
    nutritionActivities,
    wellbeingActivities,
    totalWorkouts,
    totalMeals,
    totalMindfulness: wellbeingActivities, // Using wellbeing as mindfulness proxy
    daysActive,
    perfectDays,
    earlyMorningWorkouts,
    weekendWorkouts,
    accountCreatedAt,
    integrationsConnected,
    assessmentsCompleted,
  };
}

// Get all achievements with user progress
const getAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const { category, status } = req.query;

  // Get user stats
  const stats = await getUserStats(userId);

  // Calculate achievement status for each definition
  let achievements = achievementDefinitions.map((def) => {
    const result = def.checkFn(stats);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      xpReward: def.xpReward,
      unlocked: result.unlocked,
      progress: result.progress,
      maxProgress: def.maxProgress,
      progressPercentage: Math.round((result.progress / def.maxProgress) * 100),
      unlockedAt: result.unlockedAt,
    };
  });

  // Apply filters
  if (category && category !== 'all') {
    achievements = achievements.filter((a) => a.category === category);
  }

  if (status === 'unlocked') {
    achievements = achievements.filter((a) => a.unlocked);
  } else if (status === 'locked') {
    achievements = achievements.filter((a) => !a.unlocked);
  }

  // Sort achievements: unlocked first, then by progress percentage (desc), then by rarity
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  achievements.sort((a, b) => {
    // Unlocked achievements first
    if (a.unlocked !== b.unlocked) {
      return a.unlocked ? -1 : 1;
    }
    // For locked achievements, sort by progress percentage (nearly complete first)
    if (!a.unlocked && !b.unlocked) {
      if (a.progressPercentage !== b.progressPercentage) {
        return b.progressPercentage - a.progressPercentage;
      }
    }
    // Then by rarity
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  // Calculate summary stats (use original achievements array before filtering)
  const allAchievements = achievementDefinitions.map((def) => {
    const result = def.checkFn(stats);
    return { ...def, unlocked: result.unlocked };
  });
  const totalAchievements = achievementDefinitions.length;
  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const totalXP = allAchievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0);

  // Category breakdown (use allAchievements for accurate counts)
  const categoryBreakdown = {
    streak: {
      total: allAchievements.filter((a) => a.category === 'streak').length,
      unlocked: allAchievements.filter((a) => a.category === 'streak' && a.unlocked).length,
    },
    milestone: {
      total: allAchievements.filter((a) => a.category === 'milestone').length,
      unlocked: allAchievements.filter((a) => a.category === 'milestone' && a.unlocked).length,
    },
    special: {
      total: allAchievements.filter((a) => a.category === 'special').length,
      unlocked: allAchievements.filter((a) => a.category === 'special' && a.unlocked).length,
    },
    challenge: {
      total: allAchievements.filter((a) => a.category === 'challenge').length,
      unlocked: allAchievements.filter((a) => a.category === 'challenge' && a.unlocked).length,
    },
    pillar: {
      total: allAchievements.filter((a) => a.category === 'pillar').length,
      unlocked: allAchievements.filter((a) => a.category === 'pillar' && a.unlocked).length,
    },
  };

  // Rarity breakdown (use allAchievements for accurate counts)
  const rarityBreakdown = {
    common: allAchievements.filter((a) => a.rarity === 'common' && a.unlocked).length,
    rare: allAchievements.filter((a) => a.rarity === 'rare' && a.unlocked).length,
    epic: allAchievements.filter((a) => a.rarity === 'epic' && a.unlocked).length,
    legendary: allAchievements.filter((a) => a.rarity === 'legendary' && a.unlocked).length,
  };

  ApiResponse.success(
    res,
    {
      achievements,
      summary: {
        totalAchievements,
        unlockedCount,
        unlockedPercentage: Math.round((unlockedCount / totalAchievements) * 100),
        totalXP,
        categoryBreakdown,
        rarityBreakdown,
      },
      stats,
    },
    'Achievements retrieved successfully'
  );
});

// Get achievement summary/overview for dashboard
const getAchievementSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const stats = await getUserStats(userId);

  // Get recently unlocked (closest to being fully unlocked)
  const achievements = achievementDefinitions.map((def) => {
    const result = def.checkFn(stats);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      xpReward: def.xpReward,
      unlocked: result.unlocked,
      progress: result.progress,
      maxProgress: def.maxProgress,
      progressPercentage: Math.round((result.progress / def.maxProgress) * 100),
    };
  });

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  // Sort locked by progress percentage (closest to unlock first)
  const nearlyUnlocked = lockedAchievements
    .sort((a, b) => b.progressPercentage - a.progressPercentage)
    .slice(0, 3);

  // Featured achievements (latest unlocked or random unlocked)
  const featuredAchievements = unlockedAchievements.slice(0, 4);

  // Calculate level based on XP
  const totalXP = unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0);
  const level = Math.floor(totalXP / 500) + 1;
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  ApiResponse.success(
    res,
    {
      level,
      totalXP,
      xpProgress,
      xpNeeded,
      xpProgressPercentage: Math.round((xpProgress / xpNeeded) * 100),
      totalUnlocked: unlockedAchievements.length,
      totalAchievements: achievements.length,
      featuredAchievements,
      nearlyUnlocked,
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    },
    'Achievement summary retrieved successfully'
  );
});

// Get user achievements (for viewing another user's profile)
const getUserAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.userId;
  if (!currentUserId) throw ApiError.unauthorized();

  const targetUserId = req.params.userId;
  if (!targetUserId) {
    throw ApiError.badRequest('userId parameter is required');
  }

  // Privacy check: Verify users are in a chat together
  const chatCheck = await query<{ chat_id: string }>(
    `SELECT DISTINCT c.id as chat_id
     FROM chats c
     INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
     INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
     WHERE cp1.user_id = $1
     AND cp2.user_id = $2
     AND cp1.left_at IS NULL
     AND cp2.left_at IS NULL
     LIMIT 1`,
    [currentUserId, targetUserId]
  );

  if (chatCheck.rows.length === 0) {
    throw ApiError.forbidden('You can only view achievements of users you chat with');
  }

  // Get target user's stats
  const stats = await getUserStats(targetUserId);

  // Calculate achievements for target user
  const achievements = achievementDefinitions.map((def) => {
    const result = def.checkFn(stats);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      category: def.category,
      rarity: def.rarity,
      xpReward: def.xpReward,
      unlocked: result.unlocked,
      progress: result.progress,
      maxProgress: def.maxProgress,
      progressPercentage: Math.round((result.progress / def.maxProgress) * 100),
    };
  });

  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  // Calculate level based on XP
  const totalXP = unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0);
  const level = Math.floor(totalXP / 500) + 1;
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const xpProgress = totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  ApiResponse.success(
    res,
    {
      level,
      totalXP,
      xpProgress,
      xpNeeded,
      xpProgressPercentage: Math.round((xpProgress / xpNeeded) * 100),
      totalUnlocked: unlockedAchievements.length,
      totalAchievements: achievements.length,
      unlockedAchievements: unlockedAchievements.slice(0, 6), // Return top 6 unlocked achievements
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
    },
    'User achievements retrieved successfully'
  );
});

// Get leaderboard (simplified version)
const getLeaderboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  // For now, return placeholder leaderboard with current user
  const stats = await getUserStats(userId);
  const achievementResults = achievementDefinitions.map((def) => def.checkFn(stats));
  const unlockedCount = achievementResults.filter((r) => r.unlocked).length;

  // Get user info
  const userResult = await query<{ first_name: string; last_name: string; avatar: string }>(
    'SELECT first_name, last_name, avatar FROM users WHERE id = $1',
    [userId]
  );
  const user = userResult.rows[0];

  // Calculate total XP from unlocked achievements
  const totalXP = achievementDefinitions
    .filter((_, index) => achievementResults[index].unlocked)
    .reduce((sum, def) => sum + def.xpReward, 0);

  ApiResponse.success(
    res,
    {
      leaderboard: [
        {
          rank: 1,
          userId,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Anonymous',
          avatar: user?.avatar ? (() => {
            // Use helper to ensure avatar URL doesn't expire
            const profile = getPublicProfile({
              id: userId,
              email: '',
              password: null,
              firstName: user?.first_name || '',
              lastName: user?.last_name || '',
              dateOfBirth: null,
              gender: null,
              phone: null,
              role: 'user',
              isActive: true,
              avatar: user?.avatar || null,
              isEmailVerified: false,
              authProvider: 'email',
              providerId: null,
              onboardingStatus: 'completed',
              onboardingCompletedAt: null,
              lastLogin: null,
              refreshToken: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            return profile.avatarUrl;
          })() : null,
          achievementsUnlocked: unlockedCount,
          totalXP,
          isCurrentUser: true,
        },
      ],
      userRank: 1,
    },
    'Leaderboard retrieved successfully'
  );
});

// Check for new achievements (useful after completing an activity)
const checkNewAchievements = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();

  const stats = await getUserStats(userId);

  // Find newly unlocked achievements
  const newlyUnlocked = achievementDefinitions
    .map((def) => {
      const result = def.checkFn(stats);
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        rarity: def.rarity,
        xpReward: def.xpReward,
        unlocked: result.unlocked,
        progress: result.progress,
        maxProgress: def.maxProgress,
      };
    })
    .filter((a) => a.unlocked);

  ApiResponse.success(
    res,
    {
      newAchievements: newlyUnlocked,
      totalUnlocked: newlyUnlocked.length,
    },
    'Achievement check completed'
  );
});

export default {
  getAchievements,
  getAchievementSummary,
  getUserAchievements,
  getLeaderboard,
  checkNewAchievements,
};
