/**
 * @file Achievement domain types — shared between server and client
 */

export type AchievementCategory =
  | 'streak'
  | 'milestone'
  | 'special'
  | 'challenge'
  | 'pillar'
  | 'comeback'
  | 'micro-win';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type DynamicAchievementType = 'goal' | 'comeback' | 'progression' | 'micro-win';

export type AchievementFilter = 'all' | 'unlocked' | 'locked';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  progressPercentage: number;
  unlockedAt?: string;
  aiGenerated?: boolean;
  emotionalContext?: string;
  type?: DynamicAchievementType;
}

export interface AchievementSummary {
  level: number;
  totalXP: number;
  xpProgress: number;
  xpNeeded: number;
  xpProgressPercentage: number;
  totalUnlocked: number;
  totalAchievements: number;
  featuredAchievements: Achievement[];
  nearlyUnlocked: Achievement[];
  recentUnlocks?: Achievement[];
  currentStreak: number;
  longestStreak: number;
}

export interface CategoryBreakdown {
  total: number;
  unlocked: number;
}

export interface AchievementsData {
  achievements: Achievement[];
  summary: {
    totalAchievements: number;
    unlockedCount: number;
    unlockedPercentage: number;
    totalXP: number;
    categoryBreakdown: Record<string, CategoryBreakdown>;
    rarityBreakdown: Record<string, number>;
  };
}
