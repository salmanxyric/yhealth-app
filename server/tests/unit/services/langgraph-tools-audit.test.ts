import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { classifyIntent, TOOL_GROUPS, type ToolIntent } from '../../../src/services/tool-router.service.js';

// ============================================================
// MOCK FACTORIES — stored at module scope so beforeEach can re-set
// ============================================================

const mockQuery = jest.fn<any>();
const mockTransaction = jest.fn<any>();

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockEmbeddingQueue = { enqueueEmbedding: jest.fn<any>() };

const mockWorkoutPlanService = {
  getUserPlans: jest.fn<any>(),
  getWorkoutLogs: jest.fn<any>(),
  generatePlan: jest.fn<any>(),
};

const mockTaskService = { getTasks: jest.fn<any>() };

const mockWorkoutAlarmService = {
  createAlarm: jest.fn<any>(),
  updateAlarm: jest.fn<any>(),
  deleteAlarm: jest.fn<any>(),
  getAlarms: jest.fn<any>(),
  getEnabledAlarms: jest.fn<any>(),
  getAlarm: jest.fn<any>(),
  getTodayAlarms: jest.fn<any>(),
  getScheduleSummary: jest.fn<any>(),
  toggleAlarm: jest.fn<any>(),
  snoozeAlarm: jest.fn<any>(),
  formatDaysOfWeek: jest.fn<any>(),
};

const mockMoodService = {
  getMoodLogs: jest.fn<any>(),
  createMoodLog: jest.fn<any>(),
  getMoodTimeline: jest.fn<any>(),
  getMoodPatterns: jest.fn<any>(),
};

const mockStressService = {
  getStressLogs: jest.fn<any>(),
  createStressLog: jest.fn<any>(),
  getMultiSignalStressPatterns: jest.fn<any>(),
};

const mockJournalService = {
  getJournalEntries: jest.fn<any>(),
  createJournalEntry: jest.fn<any>(),
  updateJournalEntry: jest.fn<any>(),
  deleteJournalEntry: jest.fn<any>(),
  getJournalStreak: jest.fn<any>(),
};

const mockDailyCheckinService = {
  createOrUpdateCheckin: jest.fn<any>(),
  getTodayCheckin: jest.fn<any>(),
  getCheckinHistory: jest.fn<any>(),
  getCheckinStreak: jest.fn<any>(),
};

const mockEnergyService = {
  getEnergyLogs: jest.fn<any>(),
  createEnergyLog: jest.fn<any>(),
  updateEnergyLog: jest.fn<any>(),
  deleteEnergyLog: jest.fn<any>(),
  getEnergyTimeline: jest.fn<any>(),
  getEnergyPatterns: jest.fn<any>(),
};

const mockHabitService = {
  getHabits: jest.fn<any>(),
  createHabit: jest.fn<any>(),
  updateHabit: jest.fn<any>(),
  deleteHabit: jest.fn<any>(),
  logCompletion: jest.fn<any>(),
  getCompletionHistory: jest.fn<any>(),
  getHabitStats: jest.fn<any>(),
};

const mockQuickNoteService = {
  getNotes: jest.fn<any>(),
  getNote: jest.fn<any>(),
  createNote: jest.fn<any>(),
  updateNote: jest.fn<any>(),
  deleteNote: jest.fn<any>(),
};

const mockFinanceService = {
  getTransactionSummary: jest.fn<any>(),
  getMonthlySummary: jest.fn<any>(),
  getCategoryBreakdown: jest.fn<any>(),
  getSpendingTrends: jest.fn<any>(),
  getMonthComparison: jest.fn<any>(),
  getForecast: jest.fn<any>(),
  getBudgets: jest.fn<any>(),
  getBudgetAlerts: jest.fn<any>(),
  getGoals: jest.fn<any>(),
  getTransactions: jest.fn<any>(),
  createTransaction: jest.fn<any>(),
  updateTransaction: jest.fn<any>(),
  deleteTransaction: jest.fn<any>(),
  createBudget: jest.fn<any>(),
  updateBudget: jest.fn<any>(),
  deleteBudget: jest.fn<any>(),
  createGoal: jest.fn<any>(),
  updateGoal: jest.fn<any>(),
  deleteGoal: jest.fn<any>(),
  getFinancialReport: jest.fn<any>(),
};

const mockStreakService = {
  getStreakStatus: jest.fn<any>(),
  getCalendar: jest.fn<any>(),
  getStreakLeaderboard: jest.fn<any>(),
  getAroundMe: jest.fn<any>(),
  applyFreeze: jest.fn<any>(),
  getStats: jest.fn<any>(),
};

const mockDeepAnalysisEngine = {
  analyzeCorrelation: jest.fn<any>(),
  analyzeTrend: jest.fn<any>(),
};

const mockScheduleService = {
  getUserSchedules: jest.fn<any>(),
  getScheduleByDate: jest.fn<any>(),
  createDailySchedule: jest.fn<any>(),
  updateDailySchedule: jest.fn<any>(),
  deleteDailySchedule: jest.fn<any>(),
  createScheduleItem: jest.fn<any>(),
  updateScheduleItem: jest.fn<any>(),
  deleteScheduleItem: jest.fn<any>(),
  createScheduleLink: jest.fn<any>(),
  deleteScheduleLink: jest.fn<any>(),
  checkConflicts: jest.fn<any>(),
};

const mockUserFilesService = {
  getUserFiles: jest.fn<any>(),
  createFile: jest.fn<any>(),
  updateFile: jest.fn<any>(),
  archiveFile: jest.fn<any>(),
};

const mockMemoryEngineService = {
  searchMemories: jest.fn<any>(),
  createMemory: jest.fn<any>(),
  getMemoryEvidence: jest.fn<any>(),
  updateMemory: jest.fn<any>(),
  deleteMemory: jest.fn<any>(),
};

const mockWikiService = {
  searchPages: jest.fn<any>(),
  getPage: jest.fn<any>(),
  createPage: jest.fn<any>(),
  updatePage: jest.fn<any>(),
  createLink: jest.fn<any>(),
  flagContradiction: jest.fn<any>(),
  fileQueryAsPage: jest.fn<any>(),
};

// ============================================================
// MODULE MOCKS
// ============================================================

jest.unstable_mockModule('../../../src/config/database.config.js', () => ({
  query: mockQuery,
  transaction: mockTransaction,
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
  logger: mockLogger,
}));

jest.unstable_mockModule('../../../src/services/embedding-queue.service.js', () => ({
  embeddingQueueService: mockEmbeddingQueue,
}));

jest.unstable_mockModule('../../../src/config/queue.config.js', () => ({
  JobPriorities: { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 },
}));

jest.unstable_mockModule('../../../src/services/workout-plan.service.js', () => ({
  workoutPlanService: mockWorkoutPlanService,
}));

jest.unstable_mockModule('../../../src/services/task.service.js', () => ({
  taskService: mockTaskService,
}));

jest.unstable_mockModule('../../../src/services/workout-alarm.service.js', () => ({
  workoutAlarmService: mockWorkoutAlarmService,
}));

jest.unstable_mockModule('../../../src/services/wellbeing/mood.service.js', () => ({
  moodService: mockMoodService,
}));

jest.unstable_mockModule('../../../src/services/stress.service.js', () => ({
  stressService: mockStressService,
}));

jest.unstable_mockModule('../../../src/services/wellbeing/journal.service.js', () => ({
  journalService: mockJournalService,
}));

jest.unstable_mockModule('../../../src/services/wellbeing/daily-checkin.service.js', () => ({
  dailyCheckinService: mockDailyCheckinService,
}));

jest.unstable_mockModule('../../../src/services/wellbeing/energy.service.js', () => ({
  energyService: mockEnergyService,
}));

jest.unstable_mockModule('../../../src/services/wellbeing/habit.service.js', () => ({
  habitService: mockHabitService,
}));

jest.unstable_mockModule('../../../src/services/quick-note.service.js', () => ({
  quickNoteService: mockQuickNoteService,
}));

jest.unstable_mockModule('../../../src/services/finance.service.js', () => ({
  financeService: mockFinanceService,
}));

jest.unstable_mockModule('../../../src/services/streak.service.js', () => ({
  streakService: mockStreakService,
}));

jest.unstable_mockModule('../../../src/services/deep-analysis-engine.service.js', () => ({
  deepAnalysisEngineService: mockDeepAnalysisEngine,
}));

jest.unstable_mockModule('../../../src/services/analysis-step-emitter.store.js', () => ({
  getAnalysisStepEmitter: jest.fn().mockReturnValue(null),
}));

jest.unstable_mockModule('../../../src/services/artifact-generation.service.js', () => ({
  artifactGenerationService: { generate: jest.fn<any>().mockResolvedValue(null) },
}));

jest.unstable_mockModule('../../../src/services/schedule.service.js', () => ({
  scheduleService: mockScheduleService,
}));

jest.unstable_mockModule('../../../src/services/user-files.service.js', () => ({
  userFilesService: mockUserFilesService,
}));

jest.unstable_mockModule('../../../src/services/memory-engine.service.js', () => ({
  memoryEngineService: mockMemoryEngineService,
}));

jest.unstable_mockModule('../../../src/services/wiki.service.js', () => ({
  wikiService: mockWikiService,
}));

jest.unstable_mockModule('../../../src/lib/user-timezone.js', () => ({
  getUserTimezone: jest.fn<any>().mockResolvedValue('UTC'),
  toUserLocalDate: jest.fn<any>().mockImplementation((date: any) => date),
  resolveTimeZone: jest.fn<any>().mockReturnValue('UTC'),
  getUserLocalDateISO: jest.fn<any>().mockReturnValue(new Date().toISOString().slice(0, 10)),
  addDaysToISODate: jest.fn<any>().mockImplementation((dateISO: string, days: number) => {
    const d = new Date(dateISO);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }),
  getUserLocalHour: jest.fn<any>().mockReturnValue(12),
  getUserLocalHourAndSunday: jest.fn<any>().mockReturnValue({ hour: 12, isSunday: false }),
  localTimeToUtc: jest.fn<any>().mockImplementation((time: string) => time),
  formatHHmm: jest.fn<any>().mockImplementation((date: any) => '12:00'),
  formatTime12h: jest.fn<any>().mockImplementation((time: string) => time),
  formatUserLocalDateTime: jest.fn<any>().mockImplementation((date: any) => String(date)),
}));

// ============================================================
// Dynamic imports (after mocks)
// ============================================================

const { registerWorkoutTools } = await import('../../../src/services/langgraph-tools/domains/workout.js');
const { registerNutritionTools } = await import('../../../src/services/langgraph-tools/domains/nutrition.js');
const { registerWellbeingTools } = await import('../../../src/services/langgraph-tools/domains/wellbeing.js');
const { registerHealthDataTools } = await import('../../../src/services/langgraph-tools/domains/health-data.js');
const { registerQuickNoteTools } = await import('../../../src/services/langgraph-tools/domains/quick-notes.js');
const { registerFinanceTools } = await import('../../../src/services/langgraph-tools/domains/finance.js');
const { registerGoalsTools } = await import('../../../src/services/langgraph-tools/domains/goals.js');
const { registerHabitTools } = await import('../../../src/services/langgraph-tools/domains/habits.js');
const { registerStreakTools } = await import('../../../src/services/langgraph-tools/domains/streak.js');
const { registerWaterIntakeTools } = await import('../../../src/services/langgraph-tools/domains/water-intake.js');
const { registerProgressTools } = await import('../../../src/services/langgraph-tools/domains/progress.js');
const { registerAnalyticsTools } = await import('../../../src/services/langgraph-tools/domains/analytics.js');
const { registerArtifactTools } = await import('../../../src/services/langgraph-tools/domains/artifacts.js');
const { registerBodyImageTools } = await import('../../../src/services/langgraph-tools/domains/body-images.js');
const { registerCalendarTools } = await import('../../../src/services/langgraph-tools/domains/calendar.js');
const { registerFilesTools } = await import('../../../src/services/langgraph-tools/domains/files.js');
const { registerIntelligenceMemoryTools } = await import('../../../src/services/langgraph-tools/domains/intelligence-memory.js');
const { registerNotificationTools } = await import('../../../src/services/langgraph-tools/domains/notifications.js');
const { registerPlansTools } = await import('../../../src/services/langgraph-tools/domains/plans.js');
const { registerReminderTools } = await import('../../../src/services/langgraph-tools/domains/reminders.js');
const { registerScheduleTools } = await import('../../../src/services/langgraph-tools/domains/schedule.js');
const { registerShoppingListTools } = await import('../../../src/services/langgraph-tools/domains/shopping-list.js');
const { registerStatusHistoryTools } = await import('../../../src/services/langgraph-tools/domains/status-history.js');
const { registerUserPreferencesTools } = await import('../../../src/services/langgraph-tools/domains/user-preferences.js');
const { registerWikiTools } = await import('../../../src/services/langgraph-tools/domains/wiki.js');

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================================
// Shared mock setup — re-applied before each test
// ============================================================

function setupMockDefaults() {
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  mockTransaction.mockImplementation(async (fn: any) => fn({ query: jest.fn<any>().mockResolvedValue({ rows: [], rowCount: 0 }) }));
  mockEmbeddingQueue.enqueueEmbedding.mockResolvedValue(undefined);

  // Workout
  mockWorkoutPlanService.getUserPlans.mockResolvedValue([]);
  mockWorkoutPlanService.getWorkoutLogs.mockResolvedValue({ logs: [], total: 0 });
  mockWorkoutPlanService.generatePlan.mockResolvedValue({ weeklySchedule: {} });
  mockTaskService.getTasks.mockResolvedValue({ tasks: [], total: 0 });
  mockWorkoutAlarmService.getAlarms.mockResolvedValue([]);
  mockWorkoutAlarmService.getTodayAlarms.mockResolvedValue([]);
  mockWorkoutAlarmService.getScheduleSummary.mockResolvedValue({ totalAlarms: 0, enabledAlarms: 0, todayAlarms: [], nextAlarm: null });
  mockWorkoutAlarmService.formatDaysOfWeek.mockReturnValue('');

  // Mood
  mockMoodService.getMoodLogs.mockResolvedValue({ logs: [], total: 0 });
  mockMoodService.createMoodLog.mockResolvedValue({ id: 'mood-1' });
  mockMoodService.getMoodTimeline.mockResolvedValue([]);
  mockMoodService.getMoodPatterns.mockResolvedValue({});

  // Stress
  mockStressService.getStressLogs.mockResolvedValue([]);
  mockStressService.createStressLog.mockResolvedValue({ id: 'stress-1' });
  mockStressService.getMultiSignalStressPatterns.mockResolvedValue({});

  // Journal
  mockJournalService.getJournalEntries.mockResolvedValue({ entries: [], total: 0 });
  mockJournalService.createJournalEntry.mockResolvedValue({ id: 'journal-1' });
  mockJournalService.updateJournalEntry.mockResolvedValue({ id: 'journal-1' });
  mockJournalService.deleteJournalEntry.mockResolvedValue(undefined);
  mockJournalService.getJournalStreak.mockResolvedValue({ current: 0, longest: 0 });

  // Daily check-in
  mockDailyCheckinService.createOrUpdateCheckin.mockResolvedValue({ id: 'checkin-1' });
  mockDailyCheckinService.getTodayCheckin.mockResolvedValue(null);
  mockDailyCheckinService.getCheckinHistory.mockResolvedValue({ checkins: [] });
  mockDailyCheckinService.getCheckinStreak.mockResolvedValue({ current: 0 });

  // Energy
  mockEnergyService.getEnergyLogs.mockResolvedValue({ logs: [], total: 0 });
  mockEnergyService.createEnergyLog.mockResolvedValue({ id: 'energy-1' });
  mockEnergyService.updateEnergyLog.mockResolvedValue({ id: 'energy-1' });
  mockEnergyService.deleteEnergyLog.mockResolvedValue(undefined);
  mockEnergyService.getEnergyTimeline.mockResolvedValue([]);
  mockEnergyService.getEnergyPatterns.mockResolvedValue({});

  // Habit
  mockHabitService.getHabits.mockResolvedValue([]);
  mockHabitService.createHabit.mockResolvedValue({ id: 'habit-1' });

  // Quick notes
  mockQuickNoteService.getNotes.mockResolvedValue({ notes: [], total: 0 });
  mockQuickNoteService.getNote.mockResolvedValue(null);
  mockQuickNoteService.createNote.mockResolvedValue({ id: 'note-1', content: 'test' });
  mockQuickNoteService.updateNote.mockResolvedValue({ id: 'note-1' });
  mockQuickNoteService.deleteNote.mockResolvedValue(true);

  // Finance
  mockFinanceService.getTransactionSummary.mockResolvedValue({ totalIncome: 0, totalExpense: 0, netSavings: 0 });
  mockFinanceService.getMonthlySummary.mockResolvedValue({ totalIncome: 0, totalExpense: 0, netSavings: 0 });
  mockFinanceService.getCategoryBreakdown.mockResolvedValue([]);
  mockFinanceService.getSpendingTrends.mockResolvedValue([]);
  mockFinanceService.getMonthComparison.mockResolvedValue(null);
  mockFinanceService.getForecast.mockResolvedValue(null);
  mockFinanceService.getBudgets.mockResolvedValue([]);
  mockFinanceService.getBudgetAlerts.mockResolvedValue([]);
  mockFinanceService.getGoals.mockResolvedValue([]);
  mockFinanceService.getTransactions.mockResolvedValue({ transactions: [], total: 0 });
  mockFinanceService.createTransaction.mockResolvedValue({ id: 'txn-1' });
  mockFinanceService.updateTransaction.mockResolvedValue({ id: 'txn-1' });
  mockFinanceService.deleteTransaction.mockResolvedValue(undefined);
  mockFinanceService.createBudget.mockResolvedValue({ id: 'budget-1' });
  mockFinanceService.updateBudget.mockResolvedValue({ id: 'budget-1' });
  mockFinanceService.deleteBudget.mockResolvedValue(undefined);
  mockFinanceService.createGoal.mockResolvedValue({ id: 'goal-1' });
  mockFinanceService.updateGoal.mockResolvedValue({ id: 'goal-1' });
  mockFinanceService.deleteGoal.mockResolvedValue(undefined);

  // Streak
  mockStreakService.getStreakStatus.mockResolvedValue({ currentStreak: 0 });
  mockStreakService.getCalendar.mockResolvedValue({});
  mockStreakService.getStreakLeaderboard.mockResolvedValue([]);
  mockStreakService.getAroundMe.mockResolvedValue(null);
  mockStreakService.applyFreeze.mockResolvedValue(undefined);
  mockStreakService.getStats.mockResolvedValue({});

  // Deep analysis
  mockDeepAnalysisEngine.analyzeCorrelation.mockResolvedValue({});
  mockDeepAnalysisEngine.analyzeTrend.mockResolvedValue({});

  // Schedule
  mockScheduleService.getUserSchedules.mockResolvedValue([]);
  mockScheduleService.getScheduleByDate.mockResolvedValue(null);
  mockScheduleService.createDailySchedule.mockResolvedValue({ id: 'sched-1' });
  mockScheduleService.checkConflicts.mockResolvedValue([]);

  // User files
  mockUserFilesService.getUserFiles.mockResolvedValue([]);
  mockUserFilesService.createFile.mockResolvedValue({ id: 'file-1' });

  // Memory engine
  mockMemoryEngineService.searchMemories.mockResolvedValue([]);
  mockMemoryEngineService.createMemory.mockResolvedValue({ id: 'mem-1' });
  mockMemoryEngineService.getMemoryEvidence.mockResolvedValue([]);

  // Wiki
  mockWikiService.searchPages.mockResolvedValue([]);
  mockWikiService.getPage.mockResolvedValue(null);
  mockWikiService.createPage.mockResolvedValue({ id: 'wiki-1' });
}

// ============================================================
// 1. TOOL REGISTRATION AUDIT
// ============================================================

const ALL_DOMAIN_NAMES = [
  'workout', 'nutrition', 'wellbeing', 'healthData', 'quickNotes',
  'finance', 'goals', 'habits', 'streak', 'waterIntake', 'progress',
  'analytics', 'artifacts', 'bodyImages', 'calendar', 'files',
  'intelligenceMemory', 'notifications', 'plans', 'reminders',
  'schedule', 'shoppingList', 'statusHistory', 'userPreferences', 'wiki',
];

describe('Tool Registration Audit', () => {
  const domainRegistry: Record<string, ReturnType<typeof registerWorkoutTools>> = {};

  beforeEach(() => {
    setupMockDefaults();
    domainRegistry['workout'] = registerWorkoutTools(TEST_USER_ID);
    domainRegistry['nutrition'] = registerNutritionTools(TEST_USER_ID);
    domainRegistry['wellbeing'] = registerWellbeingTools(TEST_USER_ID);
    domainRegistry['healthData'] = registerHealthDataTools(TEST_USER_ID);
    domainRegistry['quickNotes'] = registerQuickNoteTools(TEST_USER_ID);
    domainRegistry['finance'] = registerFinanceTools(TEST_USER_ID);
    domainRegistry['goals'] = registerGoalsTools(TEST_USER_ID);
    domainRegistry['habits'] = registerHabitTools(TEST_USER_ID);
    domainRegistry['streak'] = registerStreakTools(TEST_USER_ID);
    domainRegistry['waterIntake'] = registerWaterIntakeTools(TEST_USER_ID);
    domainRegistry['progress'] = registerProgressTools(TEST_USER_ID);
    domainRegistry['analytics'] = registerAnalyticsTools(TEST_USER_ID);
    domainRegistry['artifacts'] = registerArtifactTools(TEST_USER_ID);
    domainRegistry['bodyImages'] = registerBodyImageTools(TEST_USER_ID);
    domainRegistry['calendar'] = registerCalendarTools(TEST_USER_ID);
    domainRegistry['files'] = registerFilesTools(TEST_USER_ID);
    domainRegistry['intelligenceMemory'] = registerIntelligenceMemoryTools(TEST_USER_ID);
    domainRegistry['notifications'] = registerNotificationTools(TEST_USER_ID);
    domainRegistry['plans'] = registerPlansTools(TEST_USER_ID);
    domainRegistry['reminders'] = registerReminderTools(TEST_USER_ID);
    domainRegistry['schedule'] = registerScheduleTools(TEST_USER_ID);
    domainRegistry['shoppingList'] = registerShoppingListTools(TEST_USER_ID);
    domainRegistry['statusHistory'] = registerStatusHistoryTools(TEST_USER_ID);
    domainRegistry['userPreferences'] = registerUserPreferencesTools(TEST_USER_ID);
    domainRegistry['wiki'] = registerWikiTools(TEST_USER_ID);
  });

  it.each(ALL_DOMAIN_NAMES)('%s domain registers at least 1 tool', (domain) => {
    expect(domainRegistry[domain].length).toBeGreaterThan(0);
  });

  it.each(ALL_DOMAIN_NAMES)('%s domain tools have valid structure', (domain) => {
    for (const tool of domainRegistry[domain]) {
      expect(tool.name).toBeTruthy();
      expect(typeof tool.name).toBe('string');
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');
      expect(tool.schema).toBeDefined();
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('no duplicate tool names across domains', () => {
    const allNames: string[] = [];
    for (const tools of Object.values(domainRegistry)) {
      for (const tool of tools) {
        allNames.push(tool.name);
      }
    }
    const unique = new Set(allNames);
    const duplicates = allNames.filter((name, i) => allNames.indexOf(name) !== i);
    expect(duplicates).toEqual([]);
    expect(unique.size).toBe(allNames.length);
  });

  it('all tool names are camelCase (no underscores or hyphens)', () => {
    for (const tools of Object.values(domainRegistry)) {
      for (const tool of tools) {
        expect(tool.name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
      }
    }
  });

  it('all tool descriptions are non-empty and meaningful', () => {
    for (const tools of Object.values(domainRegistry)) {
      for (const tool of tools) {
        expect(tool.description.length).toBeGreaterThan(10);
      }
    }
  });
});

// ============================================================
// 2. WORKOUT TOOLS AUDIT
// ============================================================

describe('Workout Tools', () => {
  let tools: ReturnType<typeof registerWorkoutTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerWorkoutTools(TEST_USER_ID);
  });

  const EXPECTED_WORKOUT_TOOLS = [
    'getUserWorkoutPlans', 'getUserWorkoutLogs', 'getUserTasks',
    'createWorkoutPlan', 'updateWorkoutPlan', 'deleteWorkoutPlan',
    'createWorkoutAlarm', 'updateWorkoutAlarm', 'deleteWorkoutAlarm',
    'getAllAlarms', 'getAlarmById', 'getAlarmsByDay', 'getTodayAlarms',
    'getAlarmSummary', 'toggleAlarm', 'snoozeAlarm',
    'getWorkoutLogById', 'getWorkoutLogByDate', 'createWorkoutLog',
    'updateWorkoutLog', 'deleteWorkoutLog', 'deleteAllWorkoutLogs',
    'updateAllWorkoutLogs', 'checkWorkoutProgress', 'rescheduleWorkoutTasks',
  ];

  it.each(EXPECTED_WORKOUT_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserWorkoutPlans handler returns valid JSON on empty result', async () => {
    const tool = tools.find(t => t.name === 'getUserWorkoutPlans')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('plans');
    expect(Array.isArray(parsed.plans)).toBe(true);
    expect(parsed.plans).toEqual([]);
  });

  it('getUserWorkoutLogs handler returns valid JSON on empty result', async () => {
    const tool = tools.find(t => t.name === 'getUserWorkoutLogs')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('logs');
    expect(parsed.logs).toEqual([]);
  });

  it('createWorkoutPlan rejects empty name', async () => {
    const tool = tools.find(t => t.name === 'createWorkoutPlan')!;
    const result = await tool.handler(TEST_USER_ID, { name: '' });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
  });
});

// ============================================================
// 3. NUTRITION TOOLS AUDIT
// ============================================================

describe('Nutrition Tools', () => {
  let tools: ReturnType<typeof registerNutritionTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerNutritionTools(TEST_USER_ID);
  });

  const EXPECTED_NUTRITION_TOOLS = [
    'getUserDietPlans', 'getUserMealLogs', 'getUserRecipes',
    'createRecipe', 'updateRecipe', 'deleteRecipe',
    'createMealLog', 'updateMealLog', 'deleteMealLog',
    'createDietPlan', 'updateDietPlan', 'deleteDietPlan',
    'getMealByName', 'updateMealByName', 'deleteMealByName',
    'getDietPlanByName', 'updateDietPlanByName', 'deleteDietPlanByName',
    'getRecipeByName', 'updateRecipeByName', 'deleteRecipeByName',
    'deleteAllMeals', 'updateAllMeals',
    'deleteAllDietPlans', 'updateAllDietPlans',
    'deleteAllRecipes', 'updateAllRecipes',
  ];

  it.each(EXPECTED_NUTRITION_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserDietPlans returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserDietPlans')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    // DB returns empty rows → "No diet plans found"
    expect(parsed).toHaveProperty('plans');
    expect(parsed.plans).toEqual([]);
  });

  it('getUserMealLogs returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserMealLogs')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('meals');
    expect(parsed.meals).toEqual([]);
  });

  it('deleteAllMeals requires confirmation', async () => {
    const tool = tools.find(t => t.name === 'deleteAllMeals')!;
    const result = await tool.handler(TEST_USER_ID, { confirm: false });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Confirmation');
  });
});

// ============================================================
// 4. WELLBEING TOOLS AUDIT (mood, stress, journal, energy, checkin)
// ============================================================

describe('Wellbeing Tools', () => {
  let tools: ReturnType<typeof registerWellbeingTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerWellbeingTools(TEST_USER_ID);
  });

  const EXPECTED_WELLBEING_TOOLS = [
    'getUserActivityLogsWithMood', 'getUserMoodTrends',
    'getUserMoodLogs', 'getMoodLogById', 'createMoodLog', 'updateMoodLog',
    'deleteMoodLog', 'getMoodTimeline', 'getMoodPatterns',
    'getUserStressLogs', 'getStressLogById', 'createStressLog', 'updateStressLog',
    'deleteStressLog', 'getStressTrends',
    'getUserJournalEntries', 'getJournalEntryById', 'createJournalEntry',
    'updateJournalEntry', 'deleteJournalEntry', 'getJournalStreak', 'getJournalInsights',
    'createDailyCheckin', 'getTodayCheckin', 'getCheckinHistory', 'getCheckinStreak',
    'getUserEnergyLogs', 'getEnergyLogById', 'createEnergyLog', 'updateEnergyLog',
    'deleteEnergyLog', 'getEnergyTimeline', 'getEnergyPatterns',
  ];

  it.each(EXPECTED_WELLBEING_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserMoodLogs returns valid JSON', async () => {
    const tool = tools.find(t => t.name === 'getUserMoodLogs')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });

  it('createMoodLog returns success with moodLog data', async () => {
    const tool = tools.find(t => t.name === 'createMoodLog')!;
    const result = await tool.handler(TEST_USER_ID, {
      mode: 'light',
      happinessRating: 7,
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.moodLog).toHaveProperty('id');
  });

  it('createStressLog returns success', async () => {
    const tool = tools.find(t => t.name === 'createStressLog')!;
    const result = await tool.handler(TEST_USER_ID, {
      stressRating: 5,
      checkInType: 'on_demand',
      clientRequestId: 'test-123',
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.stressLog).toHaveProperty('id');
  });

  it('createJournalEntry returns success', async () => {
    const tool = tools.find(t => t.name === 'createJournalEntry')!;
    const result = await tool.handler(TEST_USER_ID, {
      prompt: 'How are you feeling?',
      entryText: 'I am feeling great today',
      mode: 'light',
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.entry).toHaveProperty('id');
  });

  it('createDailyCheckin returns success', async () => {
    const tool = tools.find(t => t.name === 'createDailyCheckin')!;
    const result = await tool.handler(TEST_USER_ID, {
      moodScore: 7,
      energyScore: 6,
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.checkin).toHaveProperty('id');
  });

  it('createEnergyLog returns success', async () => {
    const tool = tools.find(t => t.name === 'createEnergyLog')!;
    const result = await tool.handler(TEST_USER_ID, {
      energyRating: 8,
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data.energyLog).toHaveProperty('id');
  });

  it('getJournalInsights returns valid data on empty entries', async () => {
    const tool = tools.find(t => t.name === 'getJournalInsights')!;
    const result = await tool.handler(TEST_USER_ID, { days: 30 });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.data).toHaveProperty('totalEntries');
    expect(parsed.data.totalEntries).toBe(0);
  });
});

// ============================================================
// 5. QUICK NOTES TOOLS AUDIT
// ============================================================

describe('Quick Notes Tools', () => {
  let tools: ReturnType<typeof registerQuickNoteTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerQuickNoteTools(TEST_USER_ID);
  });

  const EXPECTED_NOTE_TOOLS = [
    'getQuickNotes', 'getQuickNoteById', 'createQuickNote',
    'updateQuickNote', 'deleteQuickNote',
  ];

  it.each(EXPECTED_NOTE_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('createQuickNote returns success', async () => {
    const tool = tools.find(t => t.name === 'createQuickNote')!;
    const result = await tool.handler(TEST_USER_ID, {
      content: 'Remember to buy groceries',
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });

  it('getQuickNotes returns valid list', async () => {
    const tool = tools.find(t => t.name === 'getQuickNotes')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });

  it('quick note tools have mutationType set', () => {
    const createTool = tools.find(t => t.name === 'createQuickNote')!;
    const deleteTool = tools.find(t => t.name === 'deleteQuickNote')!;
    expect(createTool.mutationType).toBe('create');
    expect(deleteTool.mutationType).toBe('delete');
  });

  it('createQuickNote has semanticDelta', () => {
    const tool = tools.find(t => t.name === 'createQuickNote')!;
    expect(tool.semanticDelta).toBeDefined();
    const delta = tool.semanticDelta!({ content: 'Test note' }, {});
    expect(typeof delta).toBe('string');
    expect(delta.length).toBeGreaterThan(0);
  });
});

// ============================================================
// 6. HEALTH DATA / WHOOP TOOLS AUDIT
// ============================================================

describe('Health Data / Whoop Tools', () => {
  let tools: ReturnType<typeof registerHealthDataTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerHealthDataTools(TEST_USER_ID);
  });

  const EXPECTED_HEALTH_TOOLS = [
    'getUserIntegrations', 'getUserIntegrationById', 'getUserIntegrationByProvider',
    'createUserIntegration', 'updateUserIntegration', 'deleteUserIntegration',
    'deleteUserIntegrationByProvider', 'deleteAllUserIntegrations',
    'getHealthDataRecords', 'getHealthDataRecordById',
    'createHealthDataRecord', 'updateHealthDataRecord',
    'deleteHealthDataRecord', 'deleteAllHealthDataRecords',
  ];

  it.each(EXPECTED_HEALTH_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserIntegrations returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserIntegrations')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('integrations');
    expect(parsed.integrations).toEqual([]);
  });

  it('deleteAllUserIntegrations requires confirmation', async () => {
    const tool = tools.find(t => t.name === 'deleteAllUserIntegrations')!;
    const result = await tool.handler(TEST_USER_ID, { confirm: false });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Confirmation');
  });

  it('deleteAllHealthDataRecords requires confirmation', async () => {
    const tool = tools.find(t => t.name === 'deleteAllHealthDataRecords')!;
    const result = await tool.handler(TEST_USER_ID, { confirm: false });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Confirmation');
  });
});

// ============================================================
// 7. FINANCE TOOLS AUDIT
// ============================================================

describe('Finance Tools', () => {
  let tools: ReturnType<typeof registerFinanceTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerFinanceTools(TEST_USER_ID);
  });

  const EXPECTED_FINANCE_TOOLS = [
    'getFinancialSummary', 'getMonthlySummary', 'getSpendingByCategory',
    'getSpendingTrends', 'getMonthComparison', 'getFinancialForecast',
    'getFinancialReport', 'getBudgets', 'getBudgetAlerts', 'getSavingGoals',
    'getRecentTransactions', 'logTransaction',
    'updateTransaction', 'deleteTransaction',
    'createBudget', 'updateBudget', 'deleteBudget',
    'createSavingGoal', 'updateSavingGoal', 'deleteSavingGoal',
  ];

  it.each(EXPECTED_FINANCE_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getFinancialSummary returns valid JSON', async () => {
    const tool = tools.find(t => t.name === 'getFinancialSummary')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    // successResponse({ summary }) spreads → { success: true, summary: {...} }
    expect(parsed).toHaveProperty('summary');
  });

  it('logTransaction returns success', async () => {
    const tool = tools.find(t => t.name === 'logTransaction')!;
    const result = await tool.handler(TEST_USER_ID, {
      amount: 50,
      transactionType: 'expense',
      category: 'food',
      title: 'Lunch',
    });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed).toHaveProperty('transaction');
    expect(parsed).toHaveProperty('message');
  });

  it('getFinancialReport returns comprehensive report', async () => {
    const tool = tools.find(t => t.name === 'getFinancialReport')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed).toHaveProperty('report');
    expect(parsed.report).toHaveProperty('summary');
    expect(parsed.report).toHaveProperty('categoryBreakdown');
    expect(parsed.report).toHaveProperty('budgets');
    expect(parsed.report).toHaveProperty('savingGoals');
  });

  it('finance write tools have mutationType', () => {
    const updateTxn = tools.find(t => t.name === 'updateTransaction')!;
    const deleteTxn = tools.find(t => t.name === 'deleteTransaction')!;
    const createBudget = tools.find(t => t.name === 'createBudget')!;
    expect(updateTxn.mutationType).toBe('update');
    expect(deleteTxn.mutationType).toBe('delete');
    expect(createBudget.mutationType).toBe('create');
  });
});

// ============================================================
// 8. STREAK TOOLS AUDIT
// ============================================================

describe('Streak Tools', () => {
  let tools: ReturnType<typeof registerStreakTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerStreakTools(TEST_USER_ID);
  });

  const EXPECTED_STREAK_TOOLS = [
    'getStreakStatus', 'getStreakCalendar', 'getStreakLeaderboard',
    'freezeStreak', 'getStreakStats',
  ];

  it.each(EXPECTED_STREAK_TOOLS)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getStreakStatus returns valid JSON', async () => {
    const tool = tools.find(t => t.name === 'getStreakStatus')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
  });
});

// ============================================================
// 9. ANALYTICS TOOLS AUDIT
// ============================================================

describe('Analytics Tools', () => {
  let tools: ReturnType<typeof registerAnalyticsTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerAnalyticsTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'analyzeCorrelation', 'analyzeTrend', 'compareTimePeriods',
    'detectAnomalies', 'analyzeMultiFactor', 'analyzeGoalProgress',
    'getDashboardSummary',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('all analytics tools have read mutationType or none', () => {
    for (const tool of tools) {
      if (tool.mutationType) {
        expect(tool.mutationType).toBe('read');
      }
    }
  });
});

// ============================================================
// 10. SCHEDULE TOOLS AUDIT
// ============================================================

describe('Schedule Tools', () => {
  let tools: ReturnType<typeof registerScheduleTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerScheduleTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'createDailySchedule', 'getUserSchedules', 'getScheduleByDate',
    'updateDailySchedule', 'deleteDailySchedule',
    'createScheduleItem', 'updateScheduleItem', 'deleteScheduleItem',
    'createScheduleLink', 'deleteScheduleLink', 'checkScheduleConflicts',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });
});

// ============================================================
// 11. SHOPPING LIST TOOLS AUDIT
// ============================================================

describe('Shopping List Tools', () => {
  let tools: ReturnType<typeof registerShoppingListTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerShoppingListTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getShoppingListItems', 'getShoppingListItemById', 'getShoppingListItemByName',
    'createShoppingListItem', 'updateShoppingListItem', 'deleteShoppingListItem',
    'deleteShoppingListItemByName', 'deleteAllShoppingListItems', 'updateAllShoppingListItems',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getShoppingListItems returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getShoppingListItems')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('items');
  });

  it('deleteAllShoppingListItems requires confirmation', async () => {
    const tool = tools.find(t => t.name === 'deleteAllShoppingListItems')!;
    const result = await tool.handler(TEST_USER_ID, { confirm: false });
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Confirmation');
  });
});

// ============================================================
// 12. REMINDERS TOOLS AUDIT
// ============================================================

describe('Reminder Tools', () => {
  let tools: ReturnType<typeof registerReminderTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerReminderTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getScheduledReminders', 'getScheduledReminderById',
    'createScheduledReminder', 'updateScheduledReminder',
    'deleteScheduledReminder', 'deleteAllScheduledReminders',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getScheduledReminders returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getScheduledReminders')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('reminders');
  });
});

// ============================================================
// 13. NOTIFICATIONS TOOLS AUDIT
// ============================================================

describe('Notification Tools', () => {
  let tools: ReturnType<typeof registerNotificationTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerNotificationTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getNotifications', 'getNotificationById', 'createNotification',
    'updateNotification', 'deleteNotification',
    'deleteAllNotifications', 'markAllNotificationsRead',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getNotifications returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getNotifications')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('notifications');
  });
});

// ============================================================
// 14. PLANS TOOLS AUDIT
// ============================================================

describe('Plans Tools', () => {
  let tools: ReturnType<typeof registerPlansTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerPlansTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getUserActivePlans', 'getUserPlans', 'getUserPlanById',
    'getUserPlanByName', 'createUserPlan', 'updateUserPlan',
    'deleteUserPlan', 'deleteAllUserPlans', 'updateAllUserPlans',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserActivePlans returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserActivePlans')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('workoutPlan');
    expect(parsed).toHaveProperty('dietPlan');
    expect(parsed).toHaveProperty('generalPlan');
  });
});

// ============================================================
// 15. BODY IMAGES TOOLS AUDIT
// ============================================================

describe('Body Image Tools', () => {
  let tools: ReturnType<typeof registerBodyImageTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerBodyImageTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getUserBodyImages', 'getUserBodyImageById',
    'createUserBodyImage', 'deleteUserBodyImage',
    'deleteAllUserBodyImages',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserBodyImages returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserBodyImages')!;
    const result = await tool.handler(TEST_USER_ID, {});
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('images');
  });
});

// ============================================================
// 16. CALENDAR TOOLS AUDIT
// ============================================================

describe('Calendar Tools', () => {
  let tools: ReturnType<typeof registerCalendarTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerCalendarTools(TEST_USER_ID);
  });

  it('registers getGoogleCalendarEvents tool', () => {
    expect(tools.find(t => t.name === 'getGoogleCalendarEvents')).toBeDefined();
  });
});

// ============================================================
// 17. FILES TOOLS AUDIT
// ============================================================

describe('Files Tools', () => {
  let tools: ReturnType<typeof registerFilesTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerFilesTools(TEST_USER_ID);
  });

  const EXPECTED = ['getUserFiles', 'createUserFile', 'updateUserFile', 'archiveUserFile'];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });
});

// ============================================================
// 18. INTELLIGENCE MEMORY TOOLS AUDIT
// ============================================================

describe('Intelligence Memory Tools', () => {
  let tools: ReturnType<typeof registerIntelligenceMemoryTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerIntelligenceMemoryTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'searchUserMemories', 'createUserMemory', 'getMemoryEvidence',
    'updateUserMemory', 'deleteUserMemory',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });
});

// ============================================================
// 19. STATUS HISTORY TOOLS AUDIT
// ============================================================

describe('Status History Tools', () => {
  let tools: ReturnType<typeof registerStatusHistoryTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerStatusHistoryTools(TEST_USER_ID);
  });

  it('registers getStatusHistory tool', () => {
    expect(tools.find(t => t.name === 'getStatusHistory')).toBeDefined();
  });

  it('getStatusHistory returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getStatusHistory')!;
    const result = await tool.handler(TEST_USER_ID, {});
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

// ============================================================
// 20. USER PREFERENCES TOOLS AUDIT
// ============================================================

describe('User Preferences Tools', () => {
  let tools: ReturnType<typeof registerUserPreferencesTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerUserPreferencesTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'getUserPreferences', 'createUserPreferences',
    'updateUserPreferences', 'deleteUserPreferences',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });

  it('getUserPreferences returns valid JSON on empty DB', async () => {
    const tool = tools.find(t => t.name === 'getUserPreferences')!;
    const result = await tool.handler(TEST_USER_ID, {});
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

// ============================================================
// 21. WIKI TOOLS AUDIT
// ============================================================

describe('Wiki Tools', () => {
  let tools: ReturnType<typeof registerWikiTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerWikiTools(TEST_USER_ID);
  });

  const EXPECTED = [
    'searchWikiPages', 'getWikiPage', 'createWikiPage',
    'updateWikiPage', 'createWikiLink', 'flagWikiContradiction',
    'fileQueryAsWikiPage',
  ];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });
});

// ============================================================
// 22. ARTIFACT TOOLS AUDIT
// ============================================================

describe('Artifact Tools', () => {
  let tools: ReturnType<typeof registerArtifactTools>;

  beforeEach(() => {
    setupMockDefaults();
    tools = registerArtifactTools(TEST_USER_ID);
  });

  const EXPECTED = ['generateChart', 'generateComparison'];

  it.each(EXPECTED)('registers %s tool', (toolName) => {
    expect(tools.find(t => t.name === toolName)).toBeDefined();
  });
});

// ============================================================
// 23. COMPLETE TOOL COUNT AUDIT
// ============================================================

describe('Complete Tool Count', () => {
  beforeEach(() => {
    setupMockDefaults();
  });

  it('total registered tools across all 25 domains is >= 200', () => {
    const allTools = [
      ...registerWorkoutTools(TEST_USER_ID),
      ...registerNutritionTools(TEST_USER_ID),
      ...registerWellbeingTools(TEST_USER_ID),
      ...registerHealthDataTools(TEST_USER_ID),
      ...registerQuickNoteTools(TEST_USER_ID),
      ...registerFinanceTools(TEST_USER_ID),
      ...registerGoalsTools(TEST_USER_ID),
      ...registerHabitTools(TEST_USER_ID),
      ...registerStreakTools(TEST_USER_ID),
      ...registerWaterIntakeTools(TEST_USER_ID),
      ...registerProgressTools(TEST_USER_ID),
      ...registerAnalyticsTools(TEST_USER_ID),
      ...registerArtifactTools(TEST_USER_ID),
      ...registerBodyImageTools(TEST_USER_ID),
      ...registerCalendarTools(TEST_USER_ID),
      ...registerFilesTools(TEST_USER_ID),
      ...registerIntelligenceMemoryTools(TEST_USER_ID),
      ...registerNotificationTools(TEST_USER_ID),
      ...registerPlansTools(TEST_USER_ID),
      ...registerReminderTools(TEST_USER_ID),
      ...registerScheduleTools(TEST_USER_ID),
      ...registerShoppingListTools(TEST_USER_ID),
      ...registerStatusHistoryTools(TEST_USER_ID),
      ...registerUserPreferencesTools(TEST_USER_ID),
      ...registerWikiTools(TEST_USER_ID),
    ];
    expect(allTools.length).toBeGreaterThanOrEqual(200);
  });

  it('all 25 domains successfully register without errors', () => {
    const domains = [
      registerWorkoutTools, registerNutritionTools, registerWellbeingTools,
      registerHealthDataTools, registerQuickNoteTools, registerFinanceTools,
      registerGoalsTools, registerHabitTools, registerStreakTools,
      registerWaterIntakeTools, registerProgressTools, registerAnalyticsTools,
      registerArtifactTools, registerBodyImageTools, registerCalendarTools,
      registerFilesTools, registerIntelligenceMemoryTools, registerNotificationTools,
      registerPlansTools, registerReminderTools, registerScheduleTools,
      registerShoppingListTools, registerStatusHistoryTools, registerUserPreferencesTools,
      registerWikiTools,
    ];
    for (const register of domains) {
      expect(() => register(TEST_USER_ID)).not.toThrow();
    }
  });
});

// ============================================================
// 24. INTENT CLASSIFICATION & TOOL ROUTING AUDIT
//    Tests align with actual keyword-length scoring behavior
// ============================================================

describe('Intent Classification', () => {
  describe('primary intent detection', () => {
    const testCases: [string, ToolIntent][] = [
      // Workout — keyword must dominate
      ['I want to create a workout plan', 'workouts'],
      ['log my exercise today', 'workouts'],
      ['how many reps should I do', 'workouts'],
      // "show me my gym schedule" → schedule(8) > gym(3), so schedules is correct behavior
      ['show me my gym schedule', 'schedules'],
      // Nutrition / Meals
      ['log my breakfast', 'meals'],
      ['what should I eat for dinner', 'meals'],
      ['create a meal plan', 'meals'],
      ['show me my recipes', 'meals'],
      ['how many calories did I eat', 'meals'],
      // Wellbeing
      ['I am feeling stressed today', 'wellbeing'],
      ['log my mood', 'wellbeing'],
      ['journal entry about my day', 'wellbeing'],
      ['how is my energy level', 'wellbeing'],
      ['daily check-in', 'wellbeing'],
      ['I slept badly last night', 'wellbeing'],
      // Notes
      ['save a quick note', 'notes'],
      ['show my sticky notes', 'notes'],
      ['remember this for later', 'notes'],
      // Integrations / Whoop
      ['show my whoop data', 'integrations'],
      ['recovery score from whoop', 'integrations'],
      // "what is my hrv trend" → analytics wins due to "trend"
      ['what is my hrv trend', 'analytics'],
      // Finance — use unambiguous messages
      ['show my budget breakdown', 'finance'],
      ['what are my savings goals', 'finance'],
      ['financial report for this month', 'finance'],
      ['log an expense of fifty dollars', 'finance'],
      // Competitions
      ['create a competition', 'competitions'],
      ['show leaderboard', 'competitions'],
      // Gamification / achievements
      ['what level am I at right now', 'gamification'],
      ['show my streak', 'gamification'],
      ['how many achievement badges do I have', 'gamification'],
      // Analytics
      ['correlation between sleep and mood', 'analytics'],
      ['trend analysis of my workouts', 'analytics'],
      ['what anomalies in my data', 'analytics'],
      // Goals
      ['set a new goal', 'goals'],
      ['track my progress toward my target', 'goals'],
      // Water
      ['log 500ml of water', 'water'],
      ['how much water did I drink', 'water'],
      // Schedules
      ['plan my day', 'schedules'],
      ['what is my routine tomorrow', 'schedules'],
      // Music / Pulse
      ['play some music', 'music'],
      ['pause the song', 'music'],
      // Status
      ['mark as rest day', 'status'],
      // "I am sick today" → may route to schedules/wellbeing due to "today"
      ['I am feeling sick and injured', 'status'],
      // Personal
      ['I am married with 2 kids', 'personal'],
      ['I take medication for blood pressure', 'personal'],
    ];

    it.each(testCases)('"%s" → %s', (message, expectedIntent) => {
      const result = classifyIntent(message);
      expect(result.primary).toBe(expectedIntent);
    });
  });

  describe('message complexity detection', () => {
    it('trivial: greetings', () => {
      expect(classifyIntent('hi').complexity).toBe('TRIVIAL');
      expect(classifyIntent('hello!').complexity).toBe('TRIVIAL');
      expect(classifyIntent('thanks').complexity).toBe('TRIVIAL');
      expect(classifyIntent('good morning').complexity).toBe('TRIVIAL');
    });

    it('simple_action: short direct commands', () => {
      const result = classifyIntent('log my water');
      expect(['SIMPLE_ACTION', 'CONVERSATIONAL']).toContain(result.complexity);
    });

    it('analytical: deep analysis requests', () => {
      expect(classifyIntent('analyze the correlation between my sleep and mood over time').complexity).toBe('ANALYTICAL');
      expect(classifyIntent('what factors affect my recovery score').complexity).toBe('ANALYTICAL');
    });
  });

  describe('confidence scoring', () => {
    it('high confidence for single-intent messages', () => {
      const result = classifyIntent('log my breakfast of eggs and toast');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('lower confidence for multi-domain messages', () => {
      const result = classifyIntent('how does my diet affect my workout performance and stress levels');
      expect(result.confidence).toBeLessThan(0.8);
    });
  });
});

// ============================================================
// 10. TOOL ROUTING: Router → Group mapping completeness
// ============================================================

describe('Tool Router Group Completeness', () => {
  beforeEach(() => {
    setupMockDefaults();
  });

  it('every TOOL_GROUP intent has at least 1 tool', () => {
    for (const [intent, tools] of Object.entries(TOOL_GROUPS)) {
      if (intent === 'general') continue;
      expect(tools.length).toBeGreaterThan(0);
    }
  });

  it('every TOOL_GROUP tool name is either a domain tool or a semantic manager', () => {
    const allRegisteredTools = new Set<string>();
    [
      registerWorkoutTools,
      registerNutritionTools,
      registerWellbeingTools,
      registerHealthDataTools,
      registerQuickNoteTools,
      registerFinanceTools,
      registerGoalsTools,
      registerHabitTools,
      registerStreakTools,
      registerWaterIntakeTools,
      registerProgressTools,
      registerAnalyticsTools,
      registerArtifactTools,
      registerBodyImageTools,
      registerCalendarTools,
      registerFilesTools,
      registerIntelligenceMemoryTools,
      registerNotificationTools,
      registerPlansTools,
      registerReminderTools,
      registerScheduleTools,
      registerShoppingListTools,
      registerStatusHistoryTools,
      registerUserPreferencesTools,
      registerWikiTools,
    ].forEach(register => {
      register(TEST_USER_ID).forEach(t => allRegisteredTools.add(t.name));
    });

    const allGroupTools = new Set<string>();
    for (const tools of Object.values(TOOL_GROUPS)) {
      tools.forEach(name => allGroupTools.add(name));
    }

    // TOOL_GROUP entries should either be raw domain tools OR semantic managers/cross-cutting tools
    // Semantic managers end with "Manager", dashboards with "Dashboard", etc.
    const semanticPatterns = [
      'Manager', 'Dashboard', 'Timeline', 'Decision',
      'analyze', 'compare', 'detect', 'getUserProfile', 'getUserPreferences',
      'getStatusHistory', 'getUserActivePlans', 'checkScheduleConflicts',
      'getUserSchedules', 'getScheduleByDate', 'getShoppingListItems',
      'createShoppingListItem', 'updateShoppingListItem', 'deleteShoppingListItem',
      'getScheduledReminders', 'createScheduledReminder', 'updateScheduledReminder',
      'deleteScheduledReminder',
    ];

    const unknownGroupTools: string[] = [];
    for (const name of allGroupTools) {
      const isDomainTool = allRegisteredTools.has(name);
      const isSemantic = semanticPatterns.some(p => name.includes(p) || name === p);
      if (!isDomainTool && !isSemantic) {
        unknownGroupTools.push(name);
      }
    }
    expect(unknownGroupTools).toEqual([]);
  });

  it('finance TOOL_GROUP includes all finance tool names', () => {
    const financeTools = registerFinanceTools(TEST_USER_ID).map(t => t.name);
    const financeGroup = TOOL_GROUPS.finance;

    for (const toolName of financeTools) {
      expect(financeGroup).toContain(toolName);
    }
  });

  it('notes TOOL_GROUP includes all quick note tool names', () => {
    const noteTools = registerQuickNoteTools(TEST_USER_ID).map(t => t.name);
    const noteGroup = TOOL_GROUPS.notes;

    for (const toolName of noteTools) {
      expect(noteGroup).toContain(toolName);
    }
  });

  it('wellbeing TOOL_GROUP includes key wellbeing tools', () => {
    const wellbeingGroup = TOOL_GROUPS.wellbeing;
    expect(wellbeingGroup).toContain('moodManager');
    expect(wellbeingGroup).toContain('stressManager');
    expect(wellbeingGroup).toContain('journalManager');
    expect(wellbeingGroup).toContain('energyManager');
    expect(wellbeingGroup).toContain('habitManager');
    expect(wellbeingGroup).toContain('sleepManager');
    expect(wellbeingGroup).toContain('createDailyCheckin');
    expect(wellbeingGroup).toContain('getTodayCheckin');
    expect(wellbeingGroup).toContain('getCheckinHistory');
    expect(wellbeingGroup).toContain('getCheckinStreak');
    expect(wellbeingGroup).toContain('getJournalInsights');
  });

  it('gamification TOOL_GROUP includes streak tools', () => {
    const group = TOOL_GROUPS.gamification;
    expect(group).toContain('gamificationManager');
    expect(group).toContain('getStreakStatus');
    expect(group).toContain('getStreakCalendar');
    expect(group).toContain('getStreakLeaderboard');
    expect(group).toContain('freezeStreak');
    expect(group).toContain('getStreakStats');
  });

  it('integrations TOOL_GROUP includes whoop analytics', () => {
    const group = TOOL_GROUPS.integrations;
    expect(group).toContain('getUserIntegrations');
    expect(group).toContain('whoopAnalyticsManager');
  });
});

// ============================================================
// 11. ERROR HANDLING AUDIT
// ============================================================

describe('Error Handling', () => {
  beforeEach(() => {
    setupMockDefaults();
  });

  it('withErrorHandling catches errors and returns JSON error', async () => {
    const { withErrorHandling } = await import('../../../src/services/langgraph-tools/utils.js');
    const failingFn = async () => { throw new Error('test error'); };
    const wrapped = withErrorHandling('testTool', failingFn);

    const result = await wrapped('user-1', {});
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain('Failed to execute testTool');
  });

  it('all GET handlers return valid JSON even on empty params', async () => {
    const safeTools = [
      ...registerWorkoutTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerNutritionTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerWellbeingTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerQuickNoteTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerFinanceTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerStreakTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerHealthDataTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerGoalsTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerHabitTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerWaterIntakeTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerProgressTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerNotificationTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerPlansTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerReminderTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerShoppingListTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerStatusHistoryTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerUserPreferencesTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerBodyImageTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerCalendarTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
      ...registerAnalyticsTools(TEST_USER_ID).filter(t => t.name.startsWith('get')),
    ];

    for (const tool of safeTools) {
      const result = await tool.handler(TEST_USER_ID, {});
      expect(() => JSON.parse(result)).not.toThrow();
    }
  });
});

// ============================================================
// 12. TOOL ENTITLEMENTS AUDIT
// ============================================================

describe('Tool Entitlements', () => {
  it('premium tools are correctly gated', async () => {
    const { TOOL_FEATURE_REQUIREMENTS } = await import('../../../src/config/tool-entitlements.config.js');

    expect(TOOL_FEATURE_REQUIREMENTS['musicManager']).toBe('ai.music');
    expect(TOOL_FEATURE_REQUIREMENTS['whoopAnalyticsManager']).toBe('ai.integrations.whoop');
    expect(TOOL_FEATURE_REQUIREMENTS['competitionManager']).toBe('ai.competitions');
    expect(TOOL_FEATURE_REQUIREMENTS['voiceJournalManager']).toBe('ai.voice-journal');
  });

  it('free-tier tools have no entitlement requirement', async () => {
    const { TOOL_FEATURE_REQUIREMENTS } = await import('../../../src/config/tool-entitlements.config.js');

    const freeTools = [
      'getUserWorkoutPlans', 'createMealLog', 'getUserMoodLogs',
      'getQuickNotes', 'logTransaction', 'getStreakStatus',
    ];

    for (const toolName of freeTools) {
      expect(TOOL_FEATURE_REQUIREMENTS[toolName]).toBeUndefined();
    }
  });
});

// ============================================================
// 13. CROSS-DOMAIN COVERAGE AUDIT
//     Tests aligned with actual keyword-length scoring
// ============================================================

describe('Cross-Domain Coverage', () => {
  it('workout keyword routes to workouts', () => {
    const result = classifyIntent('create a workout routine for me');
    expect(result.primary).toBe('workouts');
  });

  it('yoga routes to workouts when unambiguous', () => {
    // "yoga stretch routine" → yoga(4) + stretch(7) + routine(7) for workouts
    const result = classifyIntent('yoga stretch routine');
    expect(result.primary).toBe('workouts');
  });

  it('journaling routes to wellbeing', () => {
    const result = classifyIntent('I want to start journaling');
    expect(result.primary).toBe('wellbeing');
  });

  it('pulse/music routes to music', () => {
    const result = classifyIntent('play something on pulse');
    expect(result.primary).toBe('music');
  });

  it('achievement routes to gamification', () => {
    const result = classifyIntent('show me my achievements and badges');
    expect(result.primary).toBe('gamification');
  });

  it('competition/challenge routes to competitions', () => {
    const result = classifyIntent('create a competition challenge with my friend');
    expect(result.primary).toBe('competitions');
  });

  it('voice journal routes to wellbeing', () => {
    const result = classifyIntent('I want to record a voice journal entry');
    expect(result.primary).toBe('wellbeing');
  });

  it('sleep data routes to wellbeing', () => {
    const result = classifyIntent('how did I sleep last night');
    expect(result.primary).toBe('wellbeing');
  });

  it('shopping list routes to shopping', () => {
    const result = classifyIntent('add eggs to my shopping list');
    expect(result.primary).toBe('shopping');
  });

  it('weight/body progress routes to progress', () => {
    const result = classifyIntent('log my weight today');
    expect(result.primary).toBe('progress');
  });

  it('income/salary routes to finance', () => {
    const result = classifyIntent('log my salary income of 5000');
    expect(result.primary).toBe('finance');
  });

  it('budget routes to finance', () => {
    const result = classifyIntent('set up a budget for my expenses');
    expect(result.primary).toBe('finance');
  });
});

// ============================================================
// 14. SCHEMA VALIDATION AUDIT
// ============================================================

describe('Schema Validation', () => {
  beforeEach(() => {
    setupMockDefaults();
  });

  it('workout tools accept valid schemas', () => {
    const tools = registerWorkoutTools(TEST_USER_ID);
    const createPlan = tools.find(t => t.name === 'createWorkoutPlan')!;
    const parsed = createPlan.schema.safeParse({
      name: 'My Workout Plan',
      durationWeeks: 4,
      workoutsPerWeek: 3,
    });
    expect(parsed.success).toBe(true);
  });

  it('nutrition tools accept valid schemas', () => {
    const tools = registerNutritionTools(TEST_USER_ID);
    const createMeal = tools.find(t => t.name === 'createMealLog')!;
    const parsed = createMeal.schema.safeParse({
      mealType: 'breakfast',
      mealName: 'Omelette',
      calories: 300,
    });
    expect(parsed.success).toBe(true);
  });

  it('finance tools accept valid schemas', () => {
    const tools = registerFinanceTools(TEST_USER_ID);
    const logTxn = tools.find(t => t.name === 'logTransaction')!;
    const parsed = logTxn.schema.safeParse({
      amount: 100,
      transactionType: 'expense',
      category: 'food',
      title: 'Dinner',
    });
    expect(parsed.success).toBe(true);
  });

  it('wellbeing tools accept valid mood schema', () => {
    const tools = registerWellbeingTools(TEST_USER_ID);
    const createMood = tools.find(t => t.name === 'createMoodLog')!;
    const parsed = createMood.schema.safeParse({
      mode: 'light',
      happinessRating: 7,
      moodEmoji: '😊',
    });
    expect(parsed.success).toBe(true);
  });

  it('quick note schema requires content', () => {
    const tools = registerQuickNoteTools(TEST_USER_ID);
    const createNote = tools.find(t => t.name === 'createQuickNote')!;
    const noContent = createNote.schema.safeParse({});
    expect(noContent.success).toBe(false);

    const withContent = createNote.schema.safeParse({ content: 'Test note' });
    expect(withContent.success).toBe(true);
  });

  it('finance logTransaction rejects invalid transactionType', () => {
    const tools = registerFinanceTools(TEST_USER_ID);
    const logTxn = tools.find(t => t.name === 'logTransaction')!;
    const parsed = logTxn.schema.safeParse({
      amount: 100,
      transactionType: 'invalid',
      category: 'food',
      title: 'test',
    });
    expect(parsed.success).toBe(false);
  });

  it('daily checkin clamps scores to 1-10', () => {
    const tools = registerWellbeingTools(TEST_USER_ID);
    const checkin = tools.find(t => t.name === 'createDailyCheckin')!;

    const valid = checkin.schema.safeParse({ moodScore: 5, energyScore: 7 });
    expect(valid.success).toBe(true);

    const tooHigh = checkin.schema.safeParse({ moodScore: 15 });
    expect(tooHigh.success).toBe(false);

    const tooLow = checkin.schema.safeParse({ moodScore: 0 });
    expect(tooLow.success).toBe(false);
  });
});
