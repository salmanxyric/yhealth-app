import { DynamicStructuredTool } from '@langchain/core/tools';
import { logger } from '../logger.service.js';
import type { ToolDefinition } from './types.js';

import { registerWorkoutTools } from './domains/workout.js';
import { registerNutritionTools } from './domains/nutrition.js';
import { registerWellbeingTools } from './domains/wellbeing.js';
import { registerHabitTools } from './domains/habits.js';
import { registerScheduleTools } from './domains/schedule.js';
import { registerGoalsTools } from './domains/goals.js';
import { registerProgressTools } from './domains/progress.js';
import { registerHealthDataTools } from './domains/health-data.js';
import { registerUserPreferencesTools } from './domains/user-preferences.js';
import { registerPlansTools } from './domains/plans.js';
import { registerNotificationTools } from './domains/notifications.js';
import { registerBodyImageTools } from './domains/body-images.js';
import { registerWaterIntakeTools } from './domains/water-intake.js';
import { registerShoppingListTools } from './domains/shopping-list.js';
import { registerReminderTools } from './domains/reminders.js';
import { registerStatusHistoryTools } from './domains/status-history.js';
import { registerCalendarTools } from './domains/calendar.js';
import { registerIntelligenceMemoryTools } from './domains/intelligence-memory.js';
import { registerArtifactTools } from './domains/artifacts.js';
import { registerAnalyticsTools } from './domains/analytics.js';
import { registerFinanceTools } from './domains/finance.js';
import { registerFilesTools } from './domains/files.js';
import { registerStreakTools } from './domains/streak.js';
import { registerWikiTools } from './domains/wiki.js';
import { registerQuickNoteTools } from './domains/quick-notes.js';

const TOOLS_TO_EXCLUDE = new Set([
  // Batch delete operations - dangerous and rarely needed
  'deleteAllGoals',
  'deleteAllUserIntegrations',
  'deleteAllHealthDataRecords',
  'deleteAllUserPlans',
  'deleteAllNotifications',
  'deleteAllUserBodyImages',
  'deleteAllWorkoutLogs',
  'deleteAllProgressRecords',
  'deleteAllWaterIntakeLogs',
  'deleteAllShoppingListItems',
  'deleteAllScheduledReminders',
  'deleteAllMeals',
  'deleteAllDietPlans',
  'deleteAllRecipes',
  // Batch update operations - rarely needed
  'updateAllGoals',
  'updateAllUserPlans',
  'updateAllWorkoutLogs',
  'updateAllProgressRecords',
  'updateAllShoppingListItems',
  'updateAllMeals',
  'updateAllDietPlans',
  'updateAllRecipes',
  // ByName/ByProvider variants - redundant, can use ID-based tools
  'getMealByName',
  'updateMealByName',
  'deleteMealByName',
  'getDietPlanByName',
  'updateDietPlanByName',
  'deleteDietPlanByName',
  'getRecipeByName',
  'updateRecipeByName',
  'deleteRecipeByName',
  'getShoppingListItemByName',
  'deleteShoppingListItemByName',
  'getUserIntegrationByProvider',
  'deleteUserIntegrationByProvider',
]);

function definitionToTool(def: ToolDefinition, userId: string): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: def.name,
    description: def.description,
    schema: def.schema,
    func: async (params: any) => def.handler(userId, params),
  });
}

export function createTools(userId: string): DynamicStructuredTool[] {
  const domainRegisters = [
    registerWorkoutTools,
    registerNutritionTools,
    registerQuickNoteTools,
    registerWellbeingTools,
    registerHabitTools,
    registerScheduleTools,
    registerGoalsTools,
    registerProgressTools,
    registerHealthDataTools,
    registerUserPreferencesTools,
    registerPlansTools,
    registerNotificationTools,
    registerBodyImageTools,
    registerWaterIntakeTools,
    registerShoppingListTools,
    registerReminderTools,
    registerStatusHistoryTools,
    registerCalendarTools,
    registerFinanceTools,
    registerIntelligenceMemoryTools,
    registerArtifactTools,
    registerAnalyticsTools,
    registerFilesTools,
    registerStreakTools,
    registerWikiTools,
  ];

  const allDefinitions: ToolDefinition[] = [];
  for (const register of domainRegisters) {
    allDefinitions.push(...register(userId));
  }

  const allTools = allDefinitions.map(def => definitionToTool(def, userId));

  const filteredTools = allTools.filter(tool => !TOOLS_TO_EXCLUDE.has(tool.name));

  if (filteredTools.length > 128) {
    logger.warn('[LangGraphTools] Too many tools after filtering, limiting to 128', {
      total: allTools.length,
      afterFilter: filteredTools.length,
      userId,
      excludedByPriority: Array.from(TOOLS_TO_EXCLUDE),
      includedTools: filteredTools.slice(0, 128).map(t => t.name),
      excludedTools: filteredTools.slice(128).map(t => t.name),
    });
    return filteredTools.slice(0, 128);
  }

  logger.debug('[LangGraphTools] Tools created', {
    total: allTools.length,
    afterFilter: filteredTools.length,
    excluded: Array.from(TOOLS_TO_EXCLUDE),
    userId,
  });

  return filteredTools;
}

export const langgraphToolsService = {
  createTools,
};
