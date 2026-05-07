# Universal AI Coach Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auto-generated chart artifacts to every data-rich AI coach tool so users see visual analytics inline alongside text responses.

**Architecture:** Each domain tool file gets a `buildXxxCharts()` function that constructs chart artifact objects from fetched data, and includes them as an `artifacts` array in the tool response. The extraction layer (already modified) picks up `parsed.artifacts`, persists to DB, streams via SSE. Client `ArtifactCard` renders them unchanged.

**Tech Stack:** Recharts (client, already installed), existing ArtifactCard component, LangGraph tool infrastructure

**Spec:** `docs/superpowers/specs/2026-05-07-universal-ai-coach-charts-design.md`

---

## File Map

| File | Action | Charts Added |
|------|--------|-------------|
| `server/src/services/langgraph-tools/domains/workout.ts` | Modify | 3 (duration bar, difficulty/energy line, status pie) |
| `server/src/services/langgraph-tools/domains/nutrition.ts` | Modify | 3 (daily calories bar, macro pie, macro trend line) |
| `server/src/services/langgraph-tools/domains/wellbeing.ts` | Modify | 5 (mood line, mood/energy area, mood pie, checkin line, stress area) |
| `server/src/services/langgraph-tools/domains/health-data.ts` | Modify | 5 (HRV line, RHR line, sleep bar, steps bar, recovery gauge) |
| `server/src/services/langgraph-tools/domains/water-intake.ts` | Modify | 2 (intake vs goal comparison, trend area) |
| `server/src/services/langgraph-tools/domains/habits.ts` | Modify | 2 (completion bar, streak bar) |
| `server/src/services/langgraph-tools/domains/goals.ts` | Modify | 1 (progress bar) |
| `server/src/services/langgraph-tools/domains/streak.ts` | Modify | 2 (gauge, consistency bar) |
| `server/src/services/langgraph-tools/domains/progress.ts` | Modify | 2 (weight line, body comp area) |

---

## Common Pattern Reference

Every task follows this pattern. The code differs per domain, but the structure is identical:

1. Add `CHART_COLORS` constant near top of file (after imports/existing constants)
2. Add `buildXxxCharts(data)` function that returns `Record<string, unknown>[]`
3. In the target tool function, call `buildXxxCharts()` and add `artifacts` to the response JSON

**CHART_COLORS** (same in every file):
```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

**Integration pattern for `JSON.stringify` tools:**
```typescript
// Before:
return JSON.stringify({ items: formatted, count: formatted.length }, null, 2);

// After:
const artifacts = buildXxxCharts(formatted);
return JSON.stringify({ items: formatted, count: formatted.length, artifacts }, null, 2);
```

**Integration pattern for `successResponse` tools:**
```typescript
// Before:
return successResponse({ data: result });

// After:
const artifacts = buildXxxCharts(result);
return successResponse({ data: result, artifacts });
```

---

### Task 1: Workout Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/workout.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After the imports (around line 10), add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildWorkoutCharts` function**

Add this function before `getUserWorkoutLogs` (before line 218):

```typescript
function buildWorkoutCharts(
  logs: { workoutName: string; scheduledDate: string; durationMinutes: number; difficultyRating: number; energyLevel: number; status: string }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (logs.length === 0) return artifacts;

  // 1. Workout Duration bar chart
  const recentLogs = logs.slice(0, 15).reverse();
  artifacts.push({
    type: 'chart',
    chartType: 'bar',
    title: 'Workout Duration',
    data: recentLogs.map((log) => ({
      date: log.scheduledDate?.slice(0, 10) || 'N/A',
      duration: log.durationMinutes || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'duration', label: 'Minutes', color: '#3b82f6' }],
    yAxisLabel: 'Minutes',
    insight: `Average duration: ${Math.round(recentLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0) / recentLogs.length)} min.`,
  });

  // 2. Difficulty & Energy line chart
  const withRatings = recentLogs.filter((l) => l.difficultyRating || l.energyLevel);
  if (withRatings.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Difficulty & Energy Trends',
      data: withRatings.map((log) => ({
        date: log.scheduledDate?.slice(0, 10) || 'N/A',
        difficulty: log.difficultyRating || 0,
        energy: log.energyLevel || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'difficulty', label: 'Difficulty', color: '#ef4444' },
        { key: 'energy', label: 'Energy', color: '#10b981' },
      ],
      yAxisLabel: 'Rating (1-5)',
    });
  }

  // 3. Workout Status pie chart
  const statusCounts: Record<string, number> = {};
  for (const log of logs) {
    const s = log.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  artifacts.push({
    type: 'chart',
    chartType: 'pie',
    title: 'Workout Completion Status',
    data: Object.entries(statusCounts).map(([name, value], i) => ({ name, value })),
    xAxisKey: 'name',
    dataKeys: Object.entries(statusCounts).map(([name], i) => ({
      key: 'value',
      label: name,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    insight: `${statusCounts['completed'] || 0} completed out of ${logs.length} total workouts.`,
  });

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getUserWorkoutLogs`**

In the `getUserWorkoutLogs` function (around line 245), replace the return statement:

```typescript
  return JSON.stringify({ logs: formatted, total: result.total }, null, 2);
```

With:

```typescript
  const artifacts = buildWorkoutCharts(formatted);
  return JSON.stringify({ logs: formatted, total: result.total, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/workout.ts
git commit -m "feat(workout): auto-generate chart artifacts in workout logs"
```

---

### Task 2: Nutrition Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/nutrition.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After the imports at the top of the file, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildNutritionCharts` function**

Add this function before `getUserMealLogs` (before line 368):

```typescript
function buildNutritionCharts(
  meals: { mealType: string; mealName: string; eatenAt: string; calories: number; macros: { protein: number; carbs: number; fat: number; fiber: number } }[],
  totals: { calories: number; protein: number; carbs: number; fat: number },
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (meals.length === 0) return artifacts;

  // Group meals by date for daily aggregation
  const dailyMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
  for (const meal of meals) {
    const date = typeof meal.eatenAt === 'string' ? meal.eatenAt.slice(0, 10) : 'unknown';
    const existing = dailyMap.get(date) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    existing.calories += meal.calories || 0;
    existing.protein += meal.macros?.protein || 0;
    existing.carbs += meal.macros?.carbs || 0;
    existing.fat += meal.macros?.fat || 0;
    dailyMap.set(date, existing);
  }
  const dailyData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  // 1. Daily Calories bar chart
  if (dailyData.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Daily Calorie Intake',
      data: dailyData.map((d) => ({ date: d.date, calories: Math.round(d.calories) })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'calories', label: 'Calories', color: '#f59e0b' }],
      yAxisLabel: 'Calories',
      insight: `Average: ${Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / dailyData.length)} cal/day.`,
    });
  }

  // 2. Macro Split pie chart
  if (totals.protein > 0 || totals.carbs > 0 || totals.fat > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'pie',
      title: 'Macronutrient Split',
      data: [
        { name: 'Protein', value: Math.round(totals.protein), grams: `${Math.round(totals.protein)}g` },
        { name: 'Carbs', value: Math.round(totals.carbs), grams: `${Math.round(totals.carbs)}g` },
        { name: 'Fat', value: Math.round(totals.fat), grams: `${Math.round(totals.fat)}g` },
      ],
      xAxisKey: 'name',
      dataKeys: [
        { key: 'value', label: 'Protein', color: '#3b82f6' },
        { key: 'value', label: 'Carbs', color: '#f59e0b' },
        { key: 'value', label: 'Fat', color: '#ef4444' },
      ],
      insight: `${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat.`,
    });
  }

  // 3. Macro Trend line chart (only if multiple days)
  if (dailyData.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Macro Trends',
      data: dailyData.map((d) => ({
        date: d.date,
        protein: Math.round(d.protein),
        carbs: Math.round(d.carbs),
        fat: Math.round(d.fat),
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'protein', label: 'Protein (g)', color: '#3b82f6' },
        { key: 'carbs', label: 'Carbs (g)', color: '#f59e0b' },
        { key: 'fat', label: 'Fat (g)', color: '#ef4444' },
      ],
      yAxisLabel: 'Grams',
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getUserMealLogs`**

In the `getUserMealLogs` function (around line 417), replace the return statement:

```typescript
  return JSON.stringify({ meals: formatted, totals, count: formatted.length }, null, 2);
```

With:

```typescript
  const artifacts = buildNutritionCharts(formatted, totals);
  return JSON.stringify({ meals: formatted, totals, count: formatted.length, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/nutrition.ts
git commit -m "feat(nutrition): auto-generate chart artifacts in meal logs"
```

---

### Task 3: Wellbeing Charts (Mood, Check-ins, Stress)

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/wellbeing.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After the imports at the top of the file, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildMoodCharts` function**

Add before the `getUserMoodLogs` function (before line 339):

```typescript
function buildMoodCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const logs = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
  if (logs.length === 0) return artifacts;

  const sorted = [...logs].sort((a: any, b: any) =>
    String(a.loggedAt || a.logged_at || '').localeCompare(String(b.loggedAt || b.logged_at || '')),
  );

  // 1. Mood Trend line chart
  if (sorted.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Mood Trend',
      data: sorted.map((log: any) => ({
        date: String(log.loggedAt || log.logged_at || '').slice(0, 10),
        happiness: log.happinessRating || log.happiness_rating || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'happiness', label: 'Happiness', color: '#f59e0b' }],
      yAxisLabel: 'Rating (1-10)',
      insight: `Average mood: ${(sorted.reduce((s: number, l: any) => s + (l.happinessRating || l.happiness_rating || 0), 0) / sorted.length).toFixed(1)}/10.`,
    });
  }

  // 2. Mood & Energy & Stress area chart
  const withMultiple = sorted.filter((l: any) =>
    (l.happinessRating || l.happiness_rating) && (l.energyRating || l.energy_rating),
  );
  if (withMultiple.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Mood, Energy & Stress',
      data: withMultiple.map((log: any) => ({
        date: String(log.loggedAt || log.logged_at || '').slice(0, 10),
        happiness: log.happinessRating || log.happiness_rating || 0,
        energy: log.energyRating || log.energy_rating || 0,
        stress: log.stressRating || log.stress_rating || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [
        { key: 'happiness', label: 'Happiness', color: '#f59e0b' },
        { key: 'energy', label: 'Energy', color: '#10b981' },
        { key: 'stress', label: 'Stress', color: '#ef4444' },
      ],
      yAxisLabel: 'Rating (1-10)',
    });
  }

  // 3. Mood Distribution pie chart
  const emojiCounts: Record<string, number> = {};
  for (const log of logs) {
    const emoji = log.moodEmoji || log.mood_emoji || log.descriptor || 'unknown';
    emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
  }
  if (Object.keys(emojiCounts).length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'pie',
      title: 'Mood Distribution',
      data: Object.entries(emojiCounts).map(([name, value]) => ({ name, value })),
      xAxisKey: 'name',
      dataKeys: Object.entries(emojiCounts).map(([name], i) => ({
        key: 'value',
        label: name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
      insight: `Most frequent mood: ${Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0][0]}.`,
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Add `buildCheckinCharts` function**

Add before the `getCheckinHistory` function (before line 708):

```typescript
function buildCheckinCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const checkins = Array.isArray(data?.checkins) ? data.checkins : Array.isArray(data) ? data : [];
  if (checkins.length < 2) return artifacts;

  const sorted = [...checkins].sort((a: any, b: any) =>
    String(a.checkinDate || a.checkin_date || a.createdAt || '').localeCompare(
      String(b.checkinDate || b.checkin_date || b.createdAt || ''),
    ),
  );

  artifacts.push({
    type: 'chart',
    chartType: 'line',
    title: 'Daily Check-in Trends',
    data: sorted.map((c: any) => ({
      date: String(c.checkinDate || c.checkin_date || c.createdAt || '').slice(0, 10),
      mood: c.moodScore || c.mood_score || 0,
      energy: c.energyScore || c.energy_score || 0,
      sleep: c.sleepQuality || c.sleep_quality || 0,
      stress: c.stressScore || c.stress_score || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [
      { key: 'mood', label: 'Mood', color: '#f59e0b' },
      { key: 'energy', label: 'Energy', color: '#10b981' },
      { key: 'sleep', label: 'Sleep', color: '#8b5cf6' },
      { key: 'stress', label: 'Stress', color: '#ef4444' },
    ],
    yAxisLabel: 'Score',
    insight: `${sorted.length} check-ins tracked.`,
  });

  return artifacts;
}
```

- [ ] **Step 4: Add `buildStressCharts` function**

Add before the `getStressTrends` function (before line 520):

```typescript
function buildStressCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  const patterns = data?.patterns || data?.dailyPatterns || data?.daily_patterns;
  const items = Array.isArray(patterns) ? patterns : [];
  if (items.length < 2) return artifacts;

  artifacts.push({
    type: 'chart',
    chartType: 'area',
    title: 'Stress Pattern',
    data: items.map((item: any) => ({
      date: String(item.date || item.day || '').slice(0, 10),
      stress: item.averageStress || item.average_stress || item.stressLevel || item.stress_level || 0,
    })),
    xAxisKey: 'date',
    dataKeys: [{ key: 'stress', label: 'Stress Level', color: '#ef4444' }],
    yAxisLabel: 'Stress (1-10)',
    insight: `Average stress: ${(items.reduce((s: number, i: any) => s + (i.averageStress || i.average_stress || i.stressLevel || i.stress_level || 0), 0) / items.length).toFixed(1)}/10.`,
  });

  return artifacts;
}
```

- [ ] **Step 5: Integrate `buildMoodCharts` into `getUserMoodLogs`**

In `getUserMoodLogs` (around line 347), replace:

```typescript
  return JSON.stringify({ success: true, data: result }, null, 2);
```

With:

```typescript
  const artifacts = buildMoodCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
```

- [ ] **Step 6: Integrate `buildCheckinCharts` into `getCheckinHistory`**

In `getCheckinHistory` (around line 715), replace:

```typescript
  return JSON.stringify({ success: true, data: result }, null, 2);
```

With:

```typescript
  const artifacts = buildCheckinCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
```

- [ ] **Step 7: Integrate `buildStressCharts` into `getStressTrends`**

In `getStressTrends` (around line 529), replace:

```typescript
  return JSON.stringify({ success: true, data: result }, null, 2);
```

With:

```typescript
  const artifacts = buildStressCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
```

- [ ] **Step 8: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add server/src/services/langgraph-tools/domains/wellbeing.ts
git commit -m "feat(wellbeing): auto-generate chart artifacts in mood, checkin, and stress tools"
```

---

### Task 4: Health Data / WHOOP Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/health-data.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After the imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildHealthDataCharts` function**

Add before the `getHealthDataRecords` function (before line 361):

```typescript
function buildHealthDataCharts(
  records: { provider: string; dataType: string; recordedAt: string; value: any; unit: string }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (records.length === 0) return artifacts;

  // Group records by dataType
  const byType = new Map<string, typeof records>();
  for (const r of records) {
    const type = r.dataType || 'unknown';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(r);
  }

  // Helper to extract numeric value from record
  const numVal = (r: any): number => {
    if (typeof r.value === 'number') return r.value;
    if (typeof r.value === 'object' && r.value !== null) {
      return r.value.value ?? r.value.hrv ?? r.value.rmssd ?? r.value.heart_rate ?? r.value.rhr ??
        r.value.steps ?? r.value.duration ?? r.value.score ?? r.value.hours ?? 0;
    }
    return parseFloat(String(r.value)) || 0;
  };

  const sortByDate = (items: typeof records) =>
    [...items].sort((a, b) => String(a.recordedAt || '').localeCompare(String(b.recordedAt || '')));

  // HRV Trend
  const hrvRecords = byType.get('hrv') || byType.get('heart_rate_variability') || [];
  if (hrvRecords.length > 1) {
    const sorted = sortByDate(hrvRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'HRV Trend',
      data: sorted.map((r) => ({
        date: String(r.recordedAt).slice(0, 10),
        hrv: Math.round(numVal(r)),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'hrv', label: 'HRV (ms)', color: '#3b82f6' }],
      yAxisLabel: 'HRV (ms)',
      insight: `Average HRV: ${Math.round(sorted.reduce((s, r) => s + numVal(r), 0) / sorted.length)} ms.`,
    });
  }

  // Resting Heart Rate
  const rhrRecords = byType.get('resting_heart_rate') || byType.get('rhr') || [];
  if (rhrRecords.length > 1) {
    const sorted = sortByDate(rhrRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Resting Heart Rate',
      data: sorted.map((r) => ({
        date: String(r.recordedAt).slice(0, 10),
        rhr: Math.round(numVal(r)),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'rhr', label: 'RHR (bpm)', color: '#ef4444' }],
      yAxisLabel: 'BPM',
      insight: `Average RHR: ${Math.round(sorted.reduce((s, r) => s + numVal(r), 0) / sorted.length)} bpm.`,
    });
  }

  // Sleep Duration
  const sleepRecords = byType.get('sleep') || byType.get('sleep_duration') || [];
  if (sleepRecords.length > 1) {
    const sorted = sortByDate(sleepRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Sleep Duration',
      data: sorted.map((r) => {
        let hours = numVal(r);
        if (hours > 24) hours = hours / 60;  // Convert minutes to hours
        if (hours > 24) hours = hours / 60;  // Convert seconds to hours
        return { date: String(r.recordedAt).slice(0, 10), hours: Math.round(hours * 10) / 10 };
      }),
      xAxisKey: 'date',
      dataKeys: [{ key: 'hours', label: 'Hours', color: '#8b5cf6' }],
      yAxisLabel: 'Hours',
    });
  }

  // Steps
  const stepRecords = byType.get('steps') || byType.get('step_count') || [];
  if (stepRecords.length > 1) {
    const sorted = sortByDate(stepRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Daily Steps',
      data: sorted.map((r) => ({
        date: String(r.recordedAt).slice(0, 10),
        steps: Math.round(numVal(r)),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'steps', label: 'Steps', color: '#10b981' }],
      yAxisLabel: 'Steps',
    });
  }

  // Recovery Score (gauge for latest value)
  const recoveryRecords = byType.get('recovery') || byType.get('recovery_score') || [];
  if (recoveryRecords.length > 0) {
    const sorted = sortByDate(recoveryRecords);
    const latest = sorted[sorted.length - 1];
    artifacts.push({
      type: 'chart',
      chartType: 'gauge',
      title: 'Recovery Score',
      data: [{ value: Math.round(numVal(latest)) }],
      xAxisKey: 'value',
      dataKeys: [{ key: 'value', label: 'Recovery %', color: '#10b981' }],
      gaugeMax: 100,
      insight: `Latest recovery: ${Math.round(numVal(latest))}%.`,
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getHealthDataRecords`**

In the function (around line 418), replace:

```typescript
  return JSON.stringify({ records: formatted, count: formatted.length }, null, 2);
```

With:

```typescript
  const artifacts = buildHealthDataCharts(formatted);
  return JSON.stringify({ records: formatted, count: formatted.length, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/health-data.ts
git commit -m "feat(health-data): auto-generate chart artifacts for WHOOP, sleep, HRV, steps"
```

---

### Task 5: Water Intake Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/water-intake.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildWaterCharts` function**

Add before `getWaterIntakeLogs` (before line 55):

```typescript
function buildWaterCharts(
  logs: { logDate: string; glassesConsumed: number; mlConsumed: number; targetGlasses: number; targetMl: number; goalAchieved: boolean }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (logs.length === 0) return artifacts;

  const sorted = [...logs].sort((a, b) => String(a.logDate || '').localeCompare(String(b.logDate || '')));

  // 1. Intake vs Goal comparison bar
  artifacts.push({
    type: 'chart',
    chartType: 'comparison_bar',
    title: 'Water Intake vs Goal',
    data: sorted.map((log) => ({
      date: String(log.logDate || '').slice(0, 10),
      consumed: log.glassesConsumed || 0,
      target: log.targetGlasses || 8,
    })),
    xAxisKey: 'date',
    dataKeys: [
      { key: 'consumed', label: 'Consumed', color: '#06b6d4' },
      { key: 'target', label: 'Target', color: '#3b82f6' },
    ],
    yAxisLabel: 'Glasses',
    insight: `Goal achieved on ${sorted.filter((l) => l.goalAchieved).length} of ${sorted.length} days.`,
  });

  // 2. Intake Trend area chart
  if (sorted.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Water Intake Trend',
      data: sorted.map((log) => ({
        date: String(log.logDate || '').slice(0, 10),
        ml: log.mlConsumed || 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'ml', label: 'mL Consumed', color: '#06b6d4' }],
      yAxisLabel: 'mL',
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getWaterIntakeLogs`**

In the function (around line 91), replace:

```typescript
  return JSON.stringify({ logs: formatted, count: formatted.length }, null, 2);
```

With:

```typescript
  const artifacts = buildWaterCharts(formatted);
  return JSON.stringify({ logs: formatted, count: formatted.length, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/water-intake.ts
git commit -m "feat(water): auto-generate chart artifacts in water intake logs"
```

---

### Task 6: Habit Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/habits.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildHabitCharts` function**

Add before `getHabitAnalytics` (before line 157):

```typescript
function buildHabitCharts(data: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (!data) return artifacts;

  // Handle different analytics response shapes
  const completionRate = data.completionRate ?? data.completion_rate;
  const currentStreak = data.currentStreak ?? data.current_streak;
  const longestStreak = data.longestStreak ?? data.longest_streak;
  const habitName = data.habitName ?? data.habit_name ?? 'Habit';
  const dailyData = Array.isArray(data.dailyCompletion || data.daily_completion || data.entries)
    ? (data.dailyCompletion || data.daily_completion || data.entries)
    : [];

  // 1. Completion rate gauge
  if (completionRate !== undefined) {
    artifacts.push({
      type: 'chart',
      chartType: 'gauge',
      title: `${habitName} — Completion Rate`,
      data: [{ value: Math.round(completionRate) }],
      xAxisKey: 'value',
      dataKeys: [{ key: 'value', label: 'Completion %', color: '#10b981' }],
      gaugeMax: 100,
      insight: `${Math.round(completionRate)}% completion rate.${currentStreak ? ` Current streak: ${currentStreak} days.` : ''}`,
    });
  }

  // 2. Daily completion trend bar chart
  if (dailyData.length > 1) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: `${habitName} — Daily Progress`,
      data: dailyData.slice(-30).map((entry: any) => ({
        date: String(entry.date || entry.log_date || '').slice(0, 10),
        completed: entry.completed || entry.value ? 1 : 0,
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'completed', label: 'Completed', color: '#10b981' }],
      yAxisLabel: 'Done',
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getHabitAnalytics`**

In `getHabitAnalytics` (around line 160), replace:

```typescript
  return JSON.stringify({ success: true, data: result }, null, 2);
```

With:

```typescript
  const artifacts = buildHabitCharts(result);
  return JSON.stringify({ success: true, data: result, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/habits.ts
git commit -m "feat(habits): auto-generate chart artifacts in habit analytics"
```

---

### Task 7: Goal Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/goals.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildGoalCharts` function**

Add before `getUserGoals` (before line 75):

```typescript
function buildGoalCharts(
  goals: { title: string; targetValue: number; currentValue: number; progress: number; status: string; category: string }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (goals.length === 0) return artifacts;

  // Goal Progress bar chart — current vs target per goal
  const withTargets = goals.filter((g) => g.targetValue > 0);
  if (withTargets.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Goal Progress',
      data: withTargets.map((g) => ({
        name: g.title || 'Goal',
        current: g.currentValue || 0,
        target: g.targetValue || 0,
      })),
      xAxisKey: 'name',
      dataKeys: [
        { key: 'current', label: 'Current', color: '#10b981' },
        { key: 'target', label: 'Target', color: '#64748b' },
      ],
      yAxisLabel: 'Value',
      insight: (() => {
        const completed = goals.filter((g) => g.status === 'completed' || g.progress >= 100);
        return completed.length > 0
          ? `${completed.length} of ${goals.length} goals completed!`
          : `${goals.length} active goals in progress.`;
      })(),
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getUserGoals`**

In `getUserGoals` (around line 124), replace:

```typescript
  return JSON.stringify({ goals: formatted, count: formatted.length }, null, 2);
```

With:

```typescript
  const artifacts = buildGoalCharts(formatted);
  return JSON.stringify({ goals: formatted, count: formatted.length, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/goals.ts
git commit -m "feat(goals): auto-generate chart artifacts in user goals"
```

---

### Task 8: Streak Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/streak.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildStreakCharts` function**

Add before `getStreakStats` (before line 49):

```typescript
function buildStreakCharts(stats: any): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (!stats) return artifacts;

  const currentStreak = stats.currentStreak ?? stats.current_streak ?? 0;
  const longestStreak = stats.longestStreak ?? stats.longest_streak ?? 0;
  const totalActiveDays = stats.totalActiveDays ?? stats.total_active_days ?? 0;
  const completionRate = stats.completionRate ?? stats.completion_rate ?? 0;

  // 1. Streak Gauge
  if (longestStreak > 0 || currentStreak > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'gauge',
      title: 'Current Streak',
      data: [{ value: currentStreak }],
      xAxisKey: 'value',
      dataKeys: [{ key: 'value', label: 'Days', color: '#f59e0b' }],
      gaugeMax: Math.max(longestStreak, currentStreak, 30),
      insight: `Current: ${currentStreak} days. Longest: ${longestStreak} days.`,
    });
  }

  // 2. Consistency bar chart
  if (totalActiveDays > 0 || completionRate > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Streak Consistency',
      data: [
        { metric: 'Active Days', value: totalActiveDays },
        { metric: 'Current Streak', value: currentStreak },
        { metric: 'Longest Streak', value: longestStreak },
      ],
      xAxisKey: 'metric',
      dataKeys: [{ key: 'value', label: 'Days', color: '#10b981' }],
      yAxisLabel: 'Days',
      insight: `${Math.round(completionRate)}% overall consistency.`,
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getStreakStats`**

In `getStreakStats` (around line 52), find where it uses `successResponse`. Replace:

```typescript
  return successResponse({ stats });
```

With:

```typescript
  const artifacts = buildStreakCharts(stats);
  return successResponse({ stats, artifacts });
```

Note: `successResponse` is imported from `../utils.js`. It spreads the data into `{ success: true, ...data }`, so `artifacts` will be at the top level of the parsed response.

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/streak.ts
git commit -m "feat(streak): auto-generate chart artifacts in streak stats"
```

---

### Task 9: Progress Charts

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/progress.ts`

- [ ] **Step 1: Add CHART_COLORS constant**

After imports, add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add `buildProgressCharts` function**

Add before `getUserProgress` (before line 66):

```typescript
function buildProgressCharts(
  records: { recordType: string; recordDate: string; value: any }[],
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];
  if (records.length === 0) return artifacts;

  // Group by recordType
  const byType = new Map<string, typeof records>();
  for (const r of records) {
    const type = r.recordType || 'unknown';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(r);
  }

  const sortByDate = (items: typeof records) =>
    [...items].sort((a, b) => String(a.recordDate || '').localeCompare(String(b.recordDate || '')));

  // 1. Weight Trend line chart
  const weightRecords = byType.get('weight') || [];
  if (weightRecords.length > 1) {
    const sorted = sortByDate(weightRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: 'Weight Trend',
      data: sorted.map((r) => ({
        date: String(r.recordDate).slice(0, 10),
        weight: typeof r.value === 'object' ? (r.value?.weight ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'weight', label: 'Weight', color: '#3b82f6' }],
      yAxisLabel: 'Weight',
      insight: (() => {
        const vals = sorted.map((r) => typeof r.value === 'object' ? (r.value?.weight ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0));
        const first = vals[0];
        const last = vals[vals.length - 1];
        const diff = last - first;
        if (diff > 0) return `Up ${diff.toFixed(1)} since first record.`;
        if (diff < 0) return `Down ${Math.abs(diff).toFixed(1)} since first record.`;
        return 'Weight stable.';
      })(),
    });
  }

  // 2. Body Composition area chart
  const bodyCompRecords = byType.get('body_composition') || byType.get('body_fat') || [];
  if (bodyCompRecords.length > 1) {
    const sorted = sortByDate(bodyCompRecords);
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Body Composition Trend',
      data: sorted.map((r) => ({
        date: String(r.recordDate).slice(0, 10),
        bodyFat: typeof r.value === 'object' ? (r.value?.bodyFat ?? r.value?.body_fat ?? r.value?.value ?? 0) : (parseFloat(String(r.value)) || 0),
      })),
      xAxisKey: 'date',
      dataKeys: [{ key: 'bodyFat', label: 'Body Fat %', color: '#f59e0b' }],
      yAxisLabel: 'Body Fat %',
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate into `getUserProgress`**

In `getUserProgress` (around line 101), replace:

```typescript
  return JSON.stringify({ records: formatted, count: formatted.length }, null, 2);
```

With:

```typescript
  const artifacts = buildProgressCharts(formatted);
  return JSON.stringify({ records: formatted, count: formatted.length, artifacts }, null, 2);
```

- [ ] **Step 4: Verify compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/progress.ts
git commit -m "feat(progress): auto-generate chart artifacts in progress records"
```

---

### Task 10: Full Compilation Verification & Integration Test

**Files:** None (verification only)

- [ ] **Step 1: Full server compilation**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Verify all 10 domain files are committed**

Run: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app" && git log --oneline -15`

Expected: 9 new commits (Tasks 1-9) after the finance commits.

- [ ] **Step 3: Start dev servers**

Run server: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\server" && npm run dev`
Run client: `cd "e:\Development\xyric-wiki\PRODUCTS\yhealth-app\client" && npm run dev`

- [ ] **Step 4: Test each domain via AI coach**

In the AI coach chat, test these prompts:
- "show my workout history" → expect duration bar, difficulty/energy line, status pie
- "what did I eat this week" → expect calorie bar, macro pie, macro trend line
- "how is my mood this week" → expect mood trend line, mood/energy area, mood distribution pie
- "show my check-in history" → expect multi-metric line chart
- "show my health data" → expect HRV, RHR, sleep, steps charts
- "how much water have I been drinking" → expect intake vs goal, trend area
- "show my habit analytics for [habit]" → expect completion gauge, daily bar
- "what are my goals" → expect progress bar chart
- "show my streak stats" → expect streak gauge, consistency bar
- "show my weight progress" → expect weight trend line

For each: verify charts render, text response still works, no console errors.

- [ ] **Step 5: Test empty data scenarios**

Test with a user/date range that has no data for each domain. Verify no charts appear and text message is appropriate.
