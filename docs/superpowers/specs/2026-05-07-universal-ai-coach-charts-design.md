# Universal AI Coach Analytics Charts — Design Spec

## Goal

Every data-rich AI coach tool domain auto-generates chart artifacts alongside its text response, giving users visual analytics inline in the chat. The financial report charts (already shipped) established the pattern; this spec extends it to all remaining domains.

## Architecture

**Pattern (proven in finance):**
1. Each domain tool file gets a `buildXxxCharts()` function
2. The function takes the fetched data and returns `Record<string, unknown>[]` — an array of chart artifact objects
3. The tool's return statement includes `artifacts` in `successResponse()`
4. The extraction layer in `langgraph-chatbot.service.ts` (already modified) picks up `parsed.artifacts`, persists each to DB, and streams via SSE
5. Client `ArtifactCard` renders them — no client changes needed

**Conditional generation:** Each chart only appears when its backing data exists. Empty arrays for no-data scenarios.

**Chart artifact shape** (matches existing `ChartArtifact` interface in `ArtifactCard.tsx`):
```typescript
{
  type: 'chart',
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'comparison_bar' | 'gauge' | ...,
  title: string,
  data: Record<string, unknown>[],
  xAxisKey: string,
  dataKeys: { key: string; label: string; color: string }[],
  yAxisLabel?: string,
  xAxisLabel?: string,
  insight?: string,
  referenceLines?: { y?: number; label: string; stroke: string }[],
  stacked?: boolean,
}
```

## Shared Color Palette

Each domain file defines its own `CHART_COLORS` constant (same as finance). This avoids cross-file imports and keeps each domain self-contained.

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

---

## Domain Chart Specifications

### 1. WORKOUT (`workout.ts`)

**Tool:** `getUserWorkoutLogs`
**Function:** `buildWorkoutCharts(logs)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Workout Duration | `bar` | Logs sorted by date | `date` | `duration` | logs.length > 0 |
| Difficulty & Energy | `line` | Per-session ratings | `date` | `difficulty`, `energy` | Any log has ratings |
| Workout Status | `pie` | Count by status | `name` | `value` | logs.length > 0 |

**Aggregation:** Group logs by date, compute counts per status.

---

### 2. NUTRITION (`nutrition.ts`)

**Tool:** `getUserMealLogs`
**Function:** `buildNutritionCharts(meals, totals)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Daily Calories | `bar` | Meals grouped by day | `date` | `calories` | meals.length > 0 |
| Macro Split | `pie` | Totals protein/carbs/fat | `name` | `value` | totals exist |
| Macro Trend | `line` | Daily macro sums | `date` | `protein`, `carbs`, `fat` | > 1 day of data |

**Aggregation:** Group meals by `eatenAt` date, sum calories and macros per day.

---

### 3. WELLBEING — Mood (`wellbeing.ts`)

**Tool:** `getUserMoodLogs`
**Function:** `buildMoodCharts(moodLogs)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Mood Trend | `line` | Happiness rating over time | `date` | `happiness` | logs.length > 1 |
| Mood & Energy | `area` | Happiness + energy + stress | `date` | `happiness`, `energy`, `stress` | logs.length > 1 |
| Mood Distribution | `pie` | Count by moodEmoji | `name` | `value` | logs.length > 0 |

**Aggregation:** Sort by loggedAt, use latest per day if multiple entries.

---

### 4. WELLBEING — Check-in History (`wellbeing.ts`)

**Tool:** `getCheckinHistory`
**Function:** `buildCheckinCharts(checkins)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Check-in Trends | `line` | mood/energy/sleep/stress scores | `date` | `mood`, `energy`, `sleep`, `stress` | checkins.length > 1 |

---

### 5. WELLBEING — Stress (`wellbeing.ts`)

**Tool:** `getStressTrends`
**Function:** `buildStressCharts(trends)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Stress Pattern | `area` | Stress ratings over time | `date` | `stress` | data exists |

---

### 6. HEALTH DATA / WHOOP (`health-data.ts`)

**Tool:** `getUserHealthDataRecords`
**Function:** `buildHealthDataCharts(records)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| HRV Trend | `line` | HRV records sorted by date | `date` | `hrv` | HRV records exist |
| Resting Heart Rate | `line` | RHR records over time | `date` | `rhr` | RHR records exist |
| Sleep Duration | `bar` | Sleep hours per night | `date` | `hours` | Sleep records exist |
| Steps | `bar` | Daily step count | `date` | `steps` | Step records exist |
| Recovery Score | `gauge` | Latest recovery value | — | `value` | Recovery data exists |

**Note:** Records come from any provider (WHOOP, Fitbit, Apple Health, etc.) — charts work for all providers, not just WHOOP. Group by `dataType` to build appropriate charts.

---

### 7. WATER INTAKE (`water-intake.ts`)

**Tool:** `getWaterIntakeLogs`
**Function:** `buildWaterCharts(logs)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Intake vs Goal | `comparison_bar` | consumed vs target per day | `date` | `consumed`, `target` | logs.length > 0 |
| Intake Trend | `area` | mL consumed over days | `date` | `ml` | logs.length > 1 |

---

### 8. HABITS (`habits.ts`)

**Tool:** `getHabitAnalytics`
**Function:** `buildHabitCharts(analytics)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Completion Rate | `bar` | % per habit | `habit` | `rate` | analytics data exists |
| Streak Progress | `bar` | Current streak per habit | `habit` | `streak` | streak data exists |

---

### 9. GOALS (`goals.ts`)

**Tool:** `getUserGoals`
**Function:** `buildGoalCharts(goals)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Goal Progress | `bar` | Current vs target per goal | `name` | `current`, `target` | goals.length > 0 |

---

### 10. STREAK (`streak.ts`)

**Tool:** `getStreakStats`
**Function:** `buildStreakCharts(stats)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Streak Gauge | `gauge` | Current streak | — | `value` | stats exist |
| Consistency | `bar` | totalActiveDays, completionRate | `metric` | `value` | stats exist |

---

### 11. PROGRESS (`progress.ts`)

**Tool:** `getUserProgress`
**Function:** `buildProgressCharts(records)`

| Chart | chartType | Data Source | xAxisKey | dataKeys | Condition |
|-------|-----------|------------|----------|----------|-----------|
| Weight Trend | `line` | Weight records over time | `date` | `weight` | weight records exist |
| Body Composition | `area` | Body fat % over time | `date` | `bodyFat` | body comp records exist |

---

## Files Modified

| File | Changes |
|------|---------|
| `server/src/services/langgraph-tools/domains/workout.ts` | Add `CHART_COLORS`, `buildWorkoutCharts()`, integrate into `getUserWorkoutLogs` |
| `server/src/services/langgraph-tools/domains/nutrition.ts` | Add `CHART_COLORS`, `buildNutritionCharts()`, integrate into `getUserMealLogs` |
| `server/src/services/langgraph-tools/domains/wellbeing.ts` | Add `CHART_COLORS`, `buildMoodCharts()`, `buildCheckinCharts()`, `buildStressCharts()`, integrate into respective tools |
| `server/src/services/langgraph-tools/domains/health-data.ts` | Add `CHART_COLORS`, `buildHealthDataCharts()`, integrate into `getUserHealthDataRecords` |
| `server/src/services/langgraph-tools/domains/water-intake.ts` | Add `CHART_COLORS`, `buildWaterCharts()`, integrate into `getWaterIntakeLogs` |
| `server/src/services/langgraph-tools/domains/habits.ts` | Add `CHART_COLORS`, `buildHabitCharts()`, integrate into `getHabitAnalytics` |
| `server/src/services/langgraph-tools/domains/goals.ts` | Add `CHART_COLORS`, `buildGoalCharts()`, integrate into `getUserGoals` |
| `server/src/services/langgraph-tools/domains/streak.ts` | Add `CHART_COLORS`, `buildStreakCharts()`, integrate into `getStreakStats` |
| `server/src/services/langgraph-tools/domains/progress.ts` | Add `CHART_COLORS`, `buildProgressCharts()`, integrate into `getUserProgress` |

## Not Modified

- `finance.ts` — already done
- `analytics.ts` — already generates its own artifacts via dedicated tools
- `artifacts.ts` — manual chart generation, not auto-charts
- `calendar.ts`, `files.ts`, `notifications.ts`, `quick-notes.ts`, `reminders.ts`, `schedule.ts`, `shopping-list.ts`, `status-history.ts`, `user-preferences.ts`, `wiki.ts`, `intelligence-memory.ts`, `body-images.ts`, `plans.ts` — not data-rich enough for meaningful charts

## Testing

After implementation, verify each domain by:
1. Server compiles: `cd server && npx tsc --noEmit`
2. Each tool returns charts when data exists (test via AI coach)
3. Each tool returns no charts when data is empty
4. Charts render correctly in the client ArtifactCard
5. Existing text responses are unchanged
