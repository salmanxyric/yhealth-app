# Financial Report Auto-Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the AI coach calls `getFinancialReport`, automatically generate and stream 4-6 chart artifacts (pie, bar, area, gauge, line) alongside the text narrative so users see a visual analytics dashboard inline.

**Architecture:** The `getFinancialReport` tool builds chart artifact objects from the fetched report data (category breakdown, income/expenses, budgets, goals, month comparison, forecast) and returns them in an `artifacts` array. The artifact extraction layer in `langgraph-chatbot.service.ts` is extended to handle arrays, emitting each artifact via SSE to the client. The existing `ArtifactCard` component renders them unchanged.

**Tech Stack:** Recharts (already installed), existing ArtifactCard component, LangGraph tool infrastructure

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/src/services/langgraph-tools/domains/finance.ts` | Modify | Add `buildReportCharts()` helper, call it from `getFinancialReport`, include `artifacts` in response |
| `server/src/services/langgraph-chatbot.service.ts` | Modify | Extend artifact extraction at line ~5216 to handle `parsed.artifacts` array |

---

### Task 1: Extend artifact extraction to support arrays

**Files:**
- Modify: `server/src/services/langgraph-chatbot.service.ts:5216-5247`

- [ ] **Step 1: Read the current artifact extraction block**

Open `server/src/services/langgraph-chatbot.service.ts` at line 5216. The current code is:

```typescript
if (onArtifact) {
  try {
    const parsed = JSON.parse(resultContent);
    if (parsed.artifact) {
      const toolName = toolCall.name || toolCall.function?.name || 'unknown';
      let artifact = parsed.artifact;
      if (!artifact.saved && !artifact.artifactId) {
        try {
          const saved = await artifactGenerationService.saveInlineArtifact({
            userId,
            artifact,
            generatedBy: toolName,
            conversationId: activeConversationId,
            tags: [toolName],
          });
          artifact = {
            ...artifact,
            intelligenceFileId: saved.id,
            persisted: true,
          };
        } catch (persistError) {
          logger.warn('[LangGraphChatbot] Failed to persist generated artifact', {
            userId,
            toolName,
            error: persistError instanceof Error ? persistError.message : 'Unknown error',
          });
        }
      }
      onArtifact({ artifact, toolName });
    }
  } catch { /* not JSON or no artifact */ }
}
```

- [ ] **Step 2: Replace with array-aware extraction**

Replace the block at lines 5216-5247 with:

```typescript
if (onArtifact) {
  try {
    const parsed = JSON.parse(resultContent);
    const toolName = toolCall.name || toolCall.function?.name || 'unknown';

    // Collect artifacts: single `artifact` or `artifacts` array
    const rawArtifacts: Record<string, unknown>[] = [];
    if (parsed.artifact) rawArtifacts.push(parsed.artifact);
    if (Array.isArray(parsed.artifacts)) rawArtifacts.push(...parsed.artifacts);

    for (const raw of rawArtifacts) {
      let artifact = raw;
      if (!artifact.saved && !artifact.artifactId) {
        try {
          const saved = await artifactGenerationService.saveInlineArtifact({
            userId,
            artifact,
            generatedBy: toolName,
            conversationId: activeConversationId,
            tags: [toolName],
          });
          artifact = {
            ...artifact,
            intelligenceFileId: saved.id,
            persisted: true,
          };
        } catch (persistError) {
          logger.warn('[LangGraphChatbot] Failed to persist generated artifact', {
            userId,
            toolName,
            error: persistError instanceof Error ? persistError.message : 'Unknown error',
          });
        }
      }
      onArtifact({ artifact, toolName });
    }
  } catch { /* not JSON or no artifact */ }
}
```

Key changes:
- Collects from both `parsed.artifact` (singular, backwards-compatible) and `parsed.artifacts` (array, new)
- Loops over all collected artifacts, persisting and emitting each one
- Existing `generateChart` tool (which returns `{ artifact }`) continues to work unchanged

- [ ] **Step 3: Verify the server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/src/services/langgraph-chatbot.service.ts
git commit -m "feat(ai-coach): support multiple artifacts per tool result"
```

---

### Task 2: Build chart artifacts in getFinancialReport

**Files:**
- Modify: `server/src/services/langgraph-tools/domains/finance.ts:144-178`

- [ ] **Step 1: Add the chart color palette constant**

At the top of `server/src/services/langgraph-tools/domains/finance.ts` (after the existing imports/constants, around line 63 after the `formatMoney` function), add:

```typescript
const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#a855f7',
];
```

- [ ] **Step 2: Add the `buildReportCharts` function**

Below the `CHART_COLORS` constant, add:

```typescript
function buildReportCharts(
  month: string,
  summary: { totalIncome: number; totalExpense: number; netSavings: number },
  breakdown: { category: string; amount: number; percentage: number }[],
  budgets: { category: string; monthlyLimit: number; currentSpend: number; status: string }[],
  goals: { title: string; targetAmount: number; currentAmount: number; status: string; emoji: string }[],
  comparison: { current: { totalIncome: number; totalExpense: number; netSavings: number; month: string }; previous: { totalIncome: number; totalExpense: number; netSavings: number; month: string } } | null,
  forecast: { projectedTotal: number; dailyBurnRate: number; daysRemaining: number; projectedByCategory: Record<string, number> } | null,
): Record<string, unknown>[] {
  const artifacts: Record<string, unknown>[] = [];

  // 1. Income vs Expenses bar chart (always show if any data)
  if (summary.totalIncome > 0 || summary.totalExpense > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: `Income vs Expenses — ${month}`,
      data: [
        { category: 'Income', amount: summary.totalIncome },
        { category: 'Expenses', amount: summary.totalExpense },
        { category: 'Net Savings', amount: summary.netSavings },
      ],
      xAxisKey: 'category',
      dataKeys: [{ key: 'amount', label: 'Amount ($)', color: '#10b981' }],
      yAxisLabel: 'Amount ($)',
      insight: summary.netSavings >= 0
        ? `You saved ${formatMoney(summary.netSavings)} this month.`
        : `You overspent by ${formatMoney(Math.abs(summary.netSavings))} this month.`,
    });
  }

  // 2. Category breakdown pie chart
  if (breakdown.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'pie',
      title: `Spending by Category — ${month}`,
      data: breakdown.map((item, i) => ({
        name: item.category,
        value: item.amount,
        percentage: item.percentage,
      })),
      xAxisKey: 'name',
      dataKeys: breakdown.map((item, i) => ({
        key: 'value',
        label: item.category,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
      insight: breakdown.length > 0
        ? `Top category: ${breakdown[0].category} at ${breakdown[0].percentage}% of spending.`
        : undefined,
    });
  }

  // 3. Budget vs Actual comparison bar
  if (budgets.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'comparison_bar',
      title: `Budget Health — ${month}`,
      data: budgets.map((b) => ({
        category: b.category,
        spent: b.currentSpend,
        limit: b.monthlyLimit,
      })),
      xAxisKey: 'category',
      dataKeys: [
        { key: 'spent', label: 'Spent', color: '#ef4444' },
        { key: 'limit', label: 'Budget Limit', color: '#3b82f6' },
      ],
      yAxisLabel: 'Amount ($)',
      insight: (() => {
        const exceeded = budgets.filter((b) => b.currentSpend > b.monthlyLimit);
        return exceeded.length > 0
          ? `${exceeded.length} budget${exceeded.length > 1 ? 's' : ''} exceeded: ${exceeded.map((b) => b.category).join(', ')}.`
          : 'All budgets within limits.';
      })(),
    });
  }

  // 4. Savings goals gauge charts
  const activeGoals = goals.filter((g) => g.status === 'in_progress' || g.status === 'achieved');
  if (activeGoals.length > 0) {
    artifacts.push({
      type: 'chart',
      chartType: 'bar',
      title: 'Savings Goals Progress',
      data: activeGoals.map((g) => ({
        name: `${g.emoji || '🎯'} ${g.title}`,
        saved: g.currentAmount,
        target: g.targetAmount,
      })),
      xAxisKey: 'name',
      dataKeys: [
        { key: 'saved', label: 'Saved', color: '#10b981' },
        { key: 'target', label: 'Target', color: '#64748b' },
      ],
      yAxisLabel: 'Amount ($)',
      insight: (() => {
        const achieved = activeGoals.filter((g) => g.status === 'achieved');
        return achieved.length > 0
          ? `${achieved.length} goal${achieved.length > 1 ? 's' : ''} achieved! 🎉`
          : `${activeGoals.length} goal${activeGoals.length > 1 ? 's' : ''} in progress.`;
      })(),
    });
  }

  // 5. Month-over-month comparison area chart
  if (comparison && (comparison.previous.totalIncome > 0 || comparison.previous.totalExpense > 0)) {
    artifacts.push({
      type: 'chart',
      chartType: 'area',
      title: 'Month-over-Month Comparison',
      data: [
        {
          month: comparison.previous.month,
          income: comparison.previous.totalIncome,
          expenses: comparison.previous.totalExpense,
        },
        {
          month: comparison.current.month,
          income: comparison.current.totalIncome,
          expenses: comparison.current.totalExpense,
        },
      ],
      xAxisKey: 'month',
      dataKeys: [
        { key: 'income', label: 'Income', color: '#10b981' },
        { key: 'expenses', label: 'Expenses', color: '#ef4444' },
      ],
      yAxisLabel: 'Amount ($)',
      insight: (() => {
        const expDiff = comparison.current.totalExpense - comparison.previous.totalExpense;
        if (expDiff > 0) return `Expenses up ${formatMoney(expDiff)} from last month.`;
        if (expDiff < 0) return `Expenses down ${formatMoney(Math.abs(expDiff))} from last month.`;
        return 'Expenses unchanged from last month.';
      })(),
    });
  }

  // 6. Forecast line chart
  if (forecast && forecast.dailyBurnRate > 0) {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = dayOfMonth + forecast.daysRemaining;
    const currentSpend = summary.totalExpense;
    const dataPoints = [
      { day: `Day 1`, amount: 0 },
      { day: `Day ${dayOfMonth}`, amount: currentSpend },
      { day: `Day ${daysInMonth}`, amount: forecast.projectedTotal },
    ];
    artifacts.push({
      type: 'chart',
      chartType: 'line',
      title: `Spending Forecast — ${month}`,
      data: dataPoints,
      xAxisKey: 'day',
      dataKeys: [{ key: 'amount', label: 'Projected Spend', color: '#f59e0b' }],
      yAxisLabel: 'Amount ($)',
      referenceLines: summary.totalIncome > 0
        ? [{ y: summary.totalIncome, label: 'Income', stroke: '#10b981', strokeDasharray: '4 4' }]
        : undefined,
      insight: `At ${formatMoney(forecast.dailyBurnRate)}/day, projected total: ${formatMoney(forecast.projectedTotal)}.`,
    });
  }

  return artifacts;
}
```

- [ ] **Step 3: Integrate `buildReportCharts` into `getFinancialReport`**

In the `getFinancialReport` function (line 144), replace lines 165-177:

```typescript
  return successResponse({
    message,
    hasTrackedData,
    report: {
      month,
      summary,
      categoryBreakdown: breakdown,
      budgets,
      savingGoals: goals,
      monthComparison: comparison,
      forecast,
    },
  });
```

With:

```typescript
  const artifacts = hasTrackedData
    ? buildReportCharts(month, summary, breakdown, budgets, goals, comparison, forecast)
    : [];

  return successResponse({
    message,
    hasTrackedData,
    report: {
      month,
      summary,
      categoryBreakdown: breakdown,
      budgets,
      savingGoals: goals,
      monthComparison: comparison,
      forecast,
    },
    artifacts,
  });
```

- [ ] **Step 4: Verify the server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add server/src/services/langgraph-tools/domains/finance.ts
git commit -m "feat(finance): auto-generate chart artifacts in financial report"
```

---

### Task 3: Manual integration test

**Files:** None (verification only)

- [ ] **Step 1: Start the dev server**

Run: `cd server && npm run dev`
Confirm server starts without errors.

- [ ] **Step 2: Start the client**

Run: `cd client && npm run dev`
Open the app in the browser.

- [ ] **Step 3: Test with financial data**

In the AI coach chat, send: "share my financial report last month"

Expected behavior:
- The "Financial report ready" timeline event appears as before
- 4-6 chart artifacts render inline above the text narrative
- Charts include: Income vs Expenses bar, Category pie, Budget health (if budgets exist), Savings goals (if goals exist), Month comparison area, Forecast line
- Text narrative still appears below the charts
- No console errors

- [ ] **Step 4: Test with no financial data**

Create a test scenario with no tracked data (new user or different month with no transactions).

Send: "show my financial report for 2025-01"

Expected: No charts appear, only the "I don't have tracked finance data yet" message.

- [ ] **Step 5: Commit any fixes if needed**

If any issues found, fix and commit:
```bash
git add -A
git commit -m "fix(finance): address chart rendering issues from integration test"
```
