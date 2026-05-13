# yHealth Platform - Epic 10: Analytics & Insights Dashboard

## EPIC OVERVIEW

### Epic Statement
The Analytics & Insights Dashboard is yHealth's **CORE USP DELIVERY MECHANISM** - the visual proof that transforms raw health data into unimaginable insights by connecting fitness, nutrition, and wellbeing in ways that dedicated single-pillar apps cannot achieve.

### Epic Goal
Deliver a comprehensive, visually compelling, and deeply personalized analytics experience that demonstrates yHealth's unique value proposition: revealing health connections that users cannot discover alone through cross-domain intelligence, trend analysis, and proactive pattern recognition.

### Core Philosophy
**"The Proof of the Second Mind":** While other apps show you your data, yHealth shows you INSIGHTS about your data - the "aha moments" that justify the platform's existence and create unshakeable user retention through continuous discovery.

### Analytics Dashboard Scope (10 Core Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F10.1** | Personalized Insight Feed | Core (USP) |
| **F10.2** | Three-Pillar Harmony View | Core (USP) |
| **F10.3** | Trend Analysis | Core |
| **F10.4** | "What's Affecting What" Explorer | Core (USP) |
| **F10.5** | Pattern Recognition Alerts | Core (USP) |
| **F10.6** | Goal Progress Tracking | Core |
| **F10.7** | Comparative Analytics | Core |
| **F10.8** | Recovery & Strain Overview | Core |
| **F10.9** | Sleep Quality Dashboard | Core |
| **F10.10** | Export & Sharing | Core |

---

## F10.1: PERSONALIZED INSIGHT FEED

### Description
The heart of yHealth's value delivery - a dynamic, AI-generated feed of 3-5 daily insights that surface cross-domain correlations, predictive patterns, and actionable recommendations unique to each user's health ecosystem. This is where "unimaginable insights" become tangible.

### User Story
As a **Holistic Health Seeker** (P1), I want to receive personalized insights that reveal unexpected connections between my fitness, nutrition, and wellbeing so that I can understand my health in ways I never could by looking at metrics in isolation.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | 3-5 headline insights with one-line summaries and quick action buttons. Swipe through cards. Example: "Your best workouts follow 7+ hours sleep AND morning journaling. Try it tomorrow?" |
| **Deep** | Full insight exploration: detailed explanation, supporting data visualization, confidence level, historical pattern, related insights, "Why this matters" context, action plan with specific steps. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily insight delivery | 3-5 insights per user per day | Insight generation analytics |
| Insight engagement rate | 70% of users click/interact with insights | Click-through tracking |
| "Aha moment" rate | 60% of users report discovering something new within 7 days | Post-insight surveys |
| Action completion | 40% of users complete suggested actions | Action tracking system |
| Insight accuracy | 75% user agreement that insights are valuable/accurate | Weekly feedback prompts |

### Acceptance Criteria

- [ ] Generates 3-5 personalized insights daily for each user based on available data
- [ ] Insight categories include: Predictive ("Based on patterns, expect X tomorrow"), Correlational ("Y happens when you do X + Z"), Actionable ("Right now, do this for maximum impact")
- [ ] Light mode shows insight cards with headline, one-line summary, quick action button
- [ ] Deep mode shows: Full explanation, Supporting chart/visualization, Confidence level (High/Medium/Low based on data sample size), Historical pattern view, Related insights, "Why this matters" context, Detailed action plan
- [ ] Insights prioritized by: Novelty (new discoveries first), Actionability (can user do something now?), Impact (potential health benefit), Confidence (data sample size and correlation strength)
- [ ] Each insight includes: "Was this helpful? Yes/No/Tell us more" feedback mechanism
- [ ] Insights refresh: New insights appear daily, older insights archived in history
- [ ] Cross-pillar insights emphasized: At least 2 of 5 daily insights connect multiple pillars
- [ ] Insight sources transparent: Users can see which data points contributed to insight
- [ ] Notifications: 1 push notification for highest-priority insight of the day (customizable timing)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for insights** | <7 days data or <2 pillars tracked | Show generic health tips with data collection prompt | "Still learning your patterns. Keep logging to unlock personalized insights!" |
| **Low confidence insight** | Sample size <10 data points | Display with lower priority and confidence disclaimer | "Early pattern detected. More data will improve accuracy." |
| **Contradictory patterns** | Conflicting correlations detected | Present both patterns with context | "Your patterns vary. Sometimes X leads to Y, other times not. Let's track more to understand why." |
| **Insight generation failure** | AI processing error | Fallback to previously successful insight types | Silent: Use cached insight templates with current data |
| **No new insights available** | All patterns already shown | Surface historical insights with "revisit" framing | "Reminder: Your sleep quality improves 25% with evening journaling." |

### Insight Generation Logic

```
Daily Insight Generation Process:

1. Data Collection Window (7-90 days):
   - Minimum 7 days data required
   - Optimal: 30+ days for strong correlations
   - Long-term patterns: 90+ days

2. Correlation Detection (Multi-Pillar Priority):
   - Fitness ↔ Wellbeing: Sleep-mood, exercise-stress, recovery-energy
   - Nutrition ↔ Fitness: Meal timing-performance, hydration-workout
   - Nutrition ↔ Wellbeing: Food-mood, eating patterns-sleep
   - Three-way: Sleep + nutrition + workout performance

3. Statistical Validation:
   - Minimum correlation threshold (Light/Deep modes):
     - Light mode: |r| > 0.5 (moderate-to-strong correlations only)
     - Deep mode: |r| > 0.3 (weak-to-moderate correlations for exploration)
   - Sample size requirement: n ≥ 10 occurrences
   - Confidence scoring: High (n≥30, |r|>0.7), Medium (n≥15, |r|>0.5), Low (n≥10, |r|>0.3)

4. Novelty Scoring:
   - New discovery (never shown): +10 points
   - Shown >30 days ago: +5 points
   - Shown <30 days ago: -5 points

5. Impact Assessment:
   - Potential health benefit (sleep, recovery, mood): +8 points
   - Performance optimization (workout, energy): +6 points
   - General awareness (interesting but non-critical): +3 points

6. Actionability Check:
   - Immediate action available: +7 points
   - Requires planning: +4 points
   - Awareness-only: +2 points

7. Prioritization & Selection:
   - Rank all insights by total score
   - Select top 5
   - Ensure at least 2 cross-pillar insights
   - Balance categories (1-2 predictive, 2-3 correlational, 1-2 actionable)

8. Personalization Layer:
   - User goals: Prioritize insights aligned with active goals
   - User preferences: Adapt tone (motivational vs. analytical)
   - Historical engagement: More of what user clicks on
```

### Insight Template Examples

**Predictive Insight:**
> "Based on your patterns, you'll likely feel low energy tomorrow afternoon. **Why?** You slept 6 hours tonight (below your 7.5h average) and have a rest day scheduled (you typically need movement for sustained energy). **Action:** Schedule a 15-minute walk at 2pm tomorrow to maintain energy levels."

**Correlational Insight:**
> "Your best workouts (rated 8+/10) happen when you: ✓ Sleep 7+ hours, ✓ Journal in the morning, ✓ Eat breakfast with 20g+ protein. **Pattern strength:** 85% (17 of 20 occurrences). **Try it:** Tomorrow's forecast looks perfect for a great workout - all conditions met!"

**Actionable Insight:**
> "Right now: A 10-minute walk would boost your afternoon energy by 30% based on your patterns. **Why?** It's 2:47pm (your typical low-energy window), you've been sedentary for 3+ hours, and past data shows short movement breaks work best for you at this time."

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- Fitness data (activity, sleep, recovery) is primary input for correlations
- Workout performance insights linked to nutrition and mood patterns
- Recovery score insights explain wellbeing and sleep impacts

**To Nutrition Pillar (E6):**
- Meal timing and composition correlated with energy and performance
- Hydration patterns connected to workout quality
- Food-mood relationships surfaced and explained

**To Wellbeing Pillar (E7):**
- Mood and journaling data unlock emotional context for all insights
- Stress patterns correlated with physical metrics
- Energy levels connected to sleep, nutrition, and activity

**To Cross-Domain Intelligence (E8):**
- Primary consumer of correlation engine outputs
- Insight feed is visual manifestation of "unimaginable insights" promise
- Surfaces the connections E8 discovers behind the scenes

### Dependencies
- **E8 (Cross-Domain Intelligence):** Correlation engine, pattern detection, predictive analytics
- **E4 (Mobile App):** Insight card UI, visualization components
- **E3 (WhatsApp):** Daily insight delivery via WhatsApp messaging
- **E2 (Voice Coaching):** Conversational insight exploration and explanation
- All three pillar epics (E5, E6, E7) for data inputs

### MVP Status
[X] MVP Core (USP)

---

## F10.2: THREE-PILLAR HARMONY VIEW

### Description
A single, unified visualization that displays the user's current balance across Fitness, Nutrition, and Wellbeing - the visual embodiment of yHealth's "three equal pillars" philosophy. Shows at-a-glance whether all areas are thriving, or if one pillar needs attention.

### User Story
As an **Optimization Enthusiast** (P3), I want to see my overall health balance across all three pillars at once so that I can ensure I'm not neglecting any critical area while optimizing for holistic wellbeing.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple three-score display (0-100 each) with color coding and one-line status: "Fitness: 85 (Green), Nutrition: 72 (Yellow), Wellbeing: 68 (Yellow) - Focus on wellbeing today". |
| **Deep** | Detailed breakdown: Each pillar expanded with sub-scores (e.g., Fitness: Activity 90, Sleep 80, Recovery 85), trend arrows (↑↓→), last 7-day mini-chart, specific recommendations per pillar, historical harmony trends. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily harmony view engagement | 80% of users check harmony view daily | View count analytics |
| Balanced health achievement | 50% of users reach all three pillars >70 score within 30 days | Score analytics |
| Neglected pillar intervention | 70% of users act on low-scoring pillar recommendation | Action tracking |
| User understanding | 85% correctly interpret harmony view meaning | Onboarding quiz + surveys |

### Acceptance Criteria

- [ ] Displays three scores (0-100 scale): Fitness Score, Nutrition Score, Wellbeing Score
- [ ] Color coding consistent: Green (80-100), Yellow (50-79), Red (0-49)
- [ ] Harmony Balance Indicator: Visual representation of overall balance (e.g., triangle diagram, stacked bars, radial chart)
- [ ] Light mode shows: Three scores, color codes, one-line recommendation ("Focus on [lowest pillar] today")
- [ ] Deep mode shows: Each pillar breakdown with sub-scores (Fitness: Activity, Sleep, Recovery; Nutrition: Meals, Hydration, Macros; Wellbeing: Mood, Stress, Energy, Journaling), 7-day trend for each pillar, Specific action recommendations per pillar
- [ ] Calculation methodology: Fitness Score = weighted avg (Activity 30%, Sleep 30%, Recovery 40%), Nutrition Score = weighted avg (Meal quality 40%, Hydration 20%, Macro balance 40%), Wellbeing Score = weighted avg (Mood 35%, Stress 25%, Energy 25%, Journaling completion 15%)
- [ ] Daily updates: Scores recalculate every morning based on previous day's data
- [ ] Historical view: 7, 30, 90-day harmony trends accessible
- [ ] Alerts: Notify when any pillar drops below 50 for 3+ consecutive days
- [ ] Integration with goals: Harmony scores linked to multi-pillar goals

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for score** | Missing data for 1+ pillars | Display partial scores with disclaimer | "Fitness: 85, Nutrition: -- (log meals to see score), Wellbeing: 72" |
| **New user (<7 days data)** | Baseline not established | Show estimated scores with caveat | "Building your baseline. Scores will stabilize in 7-14 days." |
| **Score calculation failure** | API error or data corruption | Show last valid scores with timestamp | "Showing yesterday's harmony view. Refreshing..." |
| **Extreme imbalance detected** | One pillar <30 while others >80 | Priority alert with specific guidance | "Wellbeing needs attention! Your fitness is great but mood/stress low. Try journaling today?" |

### Three-Pillar Score Calculation

```
Fitness Score Calculation (0-100):
- Activity Score (30%): Steps, active minutes vs. goals
- Sleep Score (30%): Sleep quality, duration vs. target
- Recovery Score (40%): Physical + Mental recovery avg from F5.3

Nutrition Score Calculation (0-100):
- Meal Quality (40%): Logged meals, nutrient balance, AI meal ratings
- Hydration (20%): Water intake vs. daily goal
- Macro Balance (40%): Protein/carbs/fats alignment with targets

Wellbeing Score Calculation (0-100):
- Mood (35%): Average daily mood rating (1-10 scale, normalized)
- Stress (25%): Inverse of stress level (low stress = high score)
- Energy (25%): Average daily energy rating (1-10 scale, normalized)
- Journaling (15%): Completion frequency bonus (daily journal = +15 points)

Overall Harmony Index:
- Average of three pillar scores
- Balance bonus: +10 points if all three pillars within 15 points of each other
- Imbalance penalty: -10 points if any pillar <50 while others >80
```

### Visual Design Specifications

**Triangle Diagram (Recommended):**
- Equilateral triangle with each vertex representing a pillar
- User's current state plotted as inner triangle
- Perfect balance = equilateral inner triangle
- Visual "shape" reveals imbalances immediately

**Color Coding:**
- Green vertex/segment: Pillar score 80-100
- Yellow vertex/segment: Pillar score 50-79
- Red vertex/segment: Pillar score 0-49

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Aggregates scores from each pillar into unified view
- Drives user attention to neglected areas
- Reinforces "three equal pillars" philosophy through equal weighting

**To Cross-Domain Intelligence (E8):**
- Harmony imbalances trigger cross-domain insight generation
- Balanced harmony enables higher-level optimization insights
- Historical harmony trends feed into predictive recommendations

**To Goal Tracking (F5.4, F6.4, F7.6):**
- Multi-pillar goals require all three scores above thresholds
- "Improve overall health" goal = achieve harmony balance
- Goal recommendations consider current harmony state

### Dependencies
- **E5 (Fitness Pillar):** Activity, sleep, recovery data for Fitness Score
- **E6 (Nutrition Pillar):** Meal logging, hydration, macros for Nutrition Score
- **E7 (Wellbeing Pillar):** Mood, stress, energy, journaling for Wellbeing Score
- **E4 (Mobile App):** Harmony visualization UI, interactive chart
- **E8 (Cross-Domain Intelligence):** Score calculation algorithms, balance analysis

### MVP Status
[X] MVP Core (USP)

---

## F10.3: TREND ANALYSIS

### Description
Comprehensive time-series visualization of all health metrics with flexible timeframes (7-day, 30-day, 90-day, 1-year), interactive chart exploration, and AI-identified trend patterns. Users can track any metric over time and see directional movement (improving, stable, declining).

### User Story
As an **Optimization Enthusiast** (P3), I want to see how my health metrics trend over time with multiple timeframe options so that I can identify long-term patterns, seasonal variations, and validate whether my interventions are working.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple line charts for top 3 user-selected metrics with 7/30-day toggle. Trend direction arrows (↑↓→) and percentage change. |
| **Deep** | Detailed multi-metric charts, all timeframe options (7/30/90/365 days), overlay capabilities (compare multiple metrics on same chart), zoom and pan, export data, AI trend annotations ("Sleep improving +12% over 30 days"). |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Trend view engagement | 60% of users view trends weekly | View count analytics |
| Timeframe diversity | 70% of users explore multiple timeframes | Timeframe selection tracking |
| Trend understanding | 75% correctly interpret trend directions | Onboarding quiz + surveys |
| Data export usage | 20% of users export data at least once | Export action tracking |

### Acceptance Criteria

- [ ] Supports timeframes: 7-day, 30-day, 90-day, 1-year
- [ ] Metric categories available: Fitness (activity, sleep, recovery, strain), Nutrition (calories, macros, hydration), Wellbeing (mood, stress, energy), Cross-Domain (harmony scores, correlations)
- [ ] Light mode: 3 user-selected metrics, 7/30-day toggle, trend arrows and % change
- [ ] Deep mode: All metrics available, all timeframes, multi-metric overlay, zoom/pan, annotations
- [ ] Visual indicators: Trend direction (↑ improving, ↓ declining, → stable), Percentage change from period start, Moving averages (7-day, 30-day) optional overlay
- [ ] AI trend annotations: Automatic pattern detection ("Sleep quality improving", "Activity declining last 14 days"), Significant events highlighted (streaks, milestones)
- [ ] Interactive charts: Tap data point to see exact value and date, Swipe to pan timeline, Pinch to zoom
- [ ] Data export: CSV format with selected metrics and timeframe
- [ ] Performance: Charts load <2 seconds for 90-day data, <3 seconds for 1-year data

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for timeframe** | User selects 90-day view with <90 days data | Show available data with disclaimer | "Showing 42 days of data (90-day view requires more data)" |
| **Data gaps in timeline** | Missing data for certain dates | Display gaps clearly, don't interpolate | Visual gap in chart line, tooltip: "No data for [date range]" |
| **Chart rendering failure** | Display error or timeout | Fallback to table view | "Chart unavailable. Showing data in table format." |
| **Metric unavailable** | User selects metric they don't track | Prompt to start tracking | "Start logging [metric] to see trends here." |

### Trend Analysis Features

**Automatic Pattern Detection:**
```
AI identifies and annotates:
- Improving trends: >10% improvement over period
- Declining trends: >10% decline over period
- Plateaus: <5% change for 14+ days
- Streaks: 7+ consecutive days meeting target
- Anomalies: Single-day outliers (>2 standard deviations)
- Cycles: Weekly/monthly recurring patterns
```

**Chart Types Available:**
- Line charts: Time-series data (default)
- Bar charts: Daily discrete events (workout count, meals logged)
- Area charts: Cumulative metrics (total calories, total steps)
- Multi-axis overlays: Compare different scale metrics (steps + mood on same chart)

**Statistical Overlays (Deep Mode):**
- 7-day moving average (smooth short-term fluctuations)
- 30-day moving average (identify long-term trends)
- Baseline reference line (user's historical average)
- Goal target line (user's target value)
- Confidence intervals (show data variability)

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- All pillar metrics available for trending
- Multi-pillar overlay reveals cross-domain patterns visually
- Trend analysis validates pillar-specific goals

**To Insights (F10.1):**
- Significant trends trigger insight generation
- "Your sleep improved 18% this month" becomes an insight
- Declining trends prompt intervention insights

**To Comparative Analytics (F10.7):**
- Trend data feeds into period-over-period comparisons
- "This month vs. last month" uses trend data
- Year-over-year comparisons for long-term users

### Dependencies
- **All Pillars (E5, E6, E7):** Historical data for all metrics
- **E4 (Mobile App):** Interactive charting library, gesture controls
- **E8 (Cross-Domain Intelligence):** Trend detection algorithms, pattern recognition
- **E9 (Data Integrations):** Historical data backfill from wearables

### MVP Status
[X] MVP Core

---

## F10.4: "WHAT'S AFFECTING WHAT" EXPLORER

### Description
Interactive correlation discovery tool that allows users to explore relationships between any two metrics across all three pillars. The user-driven complement to AI insights - enabling curious users to ask "Does X affect Y?" and see the data-backed answer with visual correlation charts.

### User Story
As an **Optimization Enthusiast** (P3), I want to explore correlations between any metrics I choose so that I can test my own hypotheses about what affects my health and discover insights beyond what the AI proactively suggests.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Top 5 strongest correlations displayed as pre-built cards. Tap to see detail. No custom exploration. |
| **Deep** | Full explorer: Select any two metrics from dropdown menus (e.g., "Sleep Duration" vs. "Workout Performance"), see scatter plot with correlation strength (r-value), trend line, sample size, explore all possible pairs, save favorite correlations. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Explorer engagement | 40% of users use explorer at least once | Feature usage analytics |
| Custom correlation exploration | 25% of users explore custom metric pairs | Custom query tracking |
| User-discovered insights | 30% of explorer users find new correlation | Post-exploration surveys |
| Correlation saves | 50% of explorer users save at least one correlation | Save action tracking |

### Acceptance Criteria

- [ ] Light mode: Displays top 5 strongest correlations from user's data (|r| > 0.5), pre-built correlation cards with headline and visual, tap to expand for details
- [ ] Deep mode: Full explorer interface with metric selection dropdowns (X-axis and Y-axis), scatter plot visualization with trend line, correlation coefficient displayed (r-value: -1.0 to +1.0), statistical significance indicator (p-value), sample size shown (n = X data points)
- [ ] Metric categories available: Fitness (20+ metrics: sleep duration, sleep quality, steps, active minutes, recovery scores, strain, heart rate, etc.), Nutrition (15+ metrics: calories, protein, carbs, fats, hydration, meal timing, etc.), Wellbeing (10+ metrics: mood, stress, energy, journaling frequency, etc.)
- [ ] Correlation strength interpretation: Strong (|r| > 0.7), Moderate-to-Strong (|r| > 0.5), Weak-to-Moderate (|r| > 0.3), None/Not significant (|r| ≤ 0.3)
- [ ] Light mode users see only moderate-to-strong correlations (|r| > 0.5) - high-confidence insights
- [ ] Deep mode users see all statistically significant correlations (|r| > 0.3) - enables exploratory analysis
- [ ] Minimum data requirement: n ≥ 10 paired data points to display correlation
- [ ] Visualization: Scatter plot with each point representing a day, trend line (linear regression), color coding by time (recent vs. older data)
- [ ] "Save Correlation" feature: Users can save frequently checked pairs to favorites for quick access
- [ ] Educational tooltips: Explain correlation strength, causation vs. correlation disclaimer
- [ ] Share functionality: Export correlation chart as image with stats

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for correlation** | <10 paired data points | Disable metric pair, show requirement | "Need at least 10 days of both metrics to calculate correlation. Keep logging!" |
| **No correlation detected** | r < 0.3 | Show result honestly | "No significant correlation found between these metrics (r = 0.12). Try other pairs or keep logging more data." |
| **Identical metric selected** | User selects same metric for X and Y | Prevent selection | "Select two different metrics to explore correlation." |
| **Chart rendering failure** | Visualization error | Fallback to table of values | "Chart unavailable. Showing data in table format." |

### Correlation Calculation Logic

```
Correlation Analysis Process:

1. Data Alignment:
   - Match data points by date (both metrics must exist for same day)
   - Exclude days with missing data for either metric
   - Minimum n = 10 paired observations required

2. Statistical Calculation:
   - Pearson correlation coefficient (r) for linear relationships
   - Range: -1.0 (perfect negative) to +1.0 (perfect positive)
   - r = 0 indicates no linear correlation

3. Significance Testing:
   - Calculate p-value (probability result is due to chance)
   - Threshold: p < 0.05 considered statistically significant
   - Display both r-value and significance indicator

4. Interpretation Labels:
   - Strong Positive (r > 0.7): "X strongly increases with Y"
   - Moderate Positive (r > 0.5): "X moderately increases with Y"
   - Weak Positive (r > 0.3): "X slightly increases with Y"
   - No Correlation (|r| ≤ 0.3): "No clear relationship detected"
   - Weak Negative (r < -0.3): "X slightly decreases with Y"
   - Moderate Negative (r < -0.5): "X moderately decreases with Y"
   - Strong Negative (r < -0.7): "X strongly decreases with Y"

5. Causation Disclaimer (Always Shown):
   - "Correlation does not imply causation. This shows a statistical relationship, not proof that one causes the other."
```

### Example Correlations Users Might Explore

**Fitness ↔ Wellbeing:**
- Sleep Duration vs. Mood (typically strong positive)
- Recovery Score vs. Energy Level
- Workout Intensity vs. Stress (might be negative - exercise reduces stress)

**Nutrition ↔ Fitness:**
- Protein Intake vs. Recovery Score
- Hydration vs. Workout Performance
- Meal Timing vs. Sleep Quality

**Nutrition ↔ Wellbeing:**
- Sugar Intake vs. Energy Crashes
- Meal Regularity vs. Mood Stability
- Caffeine Consumption vs. Sleep Quality

**Three-Way Exploration (Sequential):**
- User explores: Sleep → Workout Performance (strong)
- Then explores: Journaling → Sleep (moderate)
- Insight generated: "Your best workouts follow good sleep, which happens more when you journal"

### Cross-Pillar Connections

**To Cross-Domain Intelligence (E8):**
- User-driven exploration complements AI-driven insights
- Saved correlations feed back into AI prioritization
- Validates AI-surfaced correlations through user interaction

**To Insights (F10.1):**
- Strong user-discovered correlations can trigger new insight generation
- Explorer confirms or refutes AI insights
- User curiosity drives personalization of insight types

**To All Pillars (E5, E6, E7):**
- Enables users to test pillar interconnections themselves
- Reinforces three-pillar philosophy through exploration
- Drives engagement with less-tracked pillars (curiosity motivation)

### Dependencies
- **E8 (Cross-Domain Intelligence):** Correlation calculation engine, statistical algorithms
- **All Pillars (E5, E6, E7):** Complete metric data for analysis
- **E4 (Mobile App):** Interactive chart library, metric selection UI
- **E9 (Data Integrations):** Historical data for sufficient sample sizes

### MVP Status
[X] MVP Core (USP)

---

## F10.5: PATTERN RECOGNITION ALERTS

### Description
Proactive, AI-driven alert system that notifies users when significant patterns are detected in their data - both positive (streaks, improvements) and concerning (declines, imbalances). Transforms yHealth from reactive dashboard to proactive health companion.

### User Story
As a **Busy Professional** (P2), I want to be alerted when important patterns emerge in my health data so that I can take action on concerning trends or celebrate wins without having to manually check dashboards constantly.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple notifications: "7-day sleep streak! Keep it up." or "Activity down 30% this week. Quick walk today?". One-tap quick actions. |
| **Deep** | Detailed pattern analysis: Alert includes full context (trend chart, contributing factors, historical comparison), multiple action recommendations, pattern history (when did this last happen?), dismiss or snooze options. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Alert relevance | 75% of alerts marked as "helpful" by users | Alert feedback tracking |
| Action completion from alerts | 50% of users act on alert recommendations | Action tracking |
| Alert opt-in retention | 85% of users keep alerts enabled after 30 days | Settings analytics |
| False positive rate | <15% of alerts dismissed as irrelevant | Dismiss reason tracking |

### Acceptance Criteria

- [ ] Pattern categories monitored: Streaks (7+ consecutive days meeting target), Improvements (>15% positive change over 14 days), Declines (>15% negative change over 14 days), Imbalances (one pillar <40 while others >70), Anomalies (single-day outliers), Milestones (personal records, goal achievements)
- [ ] Alert timing: Daily digest option (one notification summarizing all patterns), Real-time critical alerts (severe imbalances, health risks), User-defined quiet hours (no alerts during sleep/work)
- [ ] Light mode alerts: Notification title + one-line summary, single quick action button, tap to see brief detail
- [ ] Deep mode alerts: Full pattern context with supporting chart, contributing factors explained, historical comparison ("This is the first time in 60 days"), multiple action recommendations, snooze or dismiss with reason
- [ ] Alert prioritization: Critical (health risk, severe imbalance) - always notify, High (significant decline, missed goal 5+ days) - daily digest, Medium (mild decline, positive streak) - weekly summary, Low (minor variations) - in-app only, no push
- [ ] Customization: Users can enable/disable by pattern type, set thresholds for what constitutes "significant", choose notification channels (push, WhatsApp, email, in-app only)
- [ ] Alert history: Archived alerts accessible for 90 days in app
- [ ] Feedback loop: "Was this helpful? Yes/No" on every alert to improve relevance

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for pattern** | <7 days data in relevant metric | Suppress alert, wait for more data | Silent: no alert sent until data sufficient |
| **Alert fatigue detected** | >50% dismissal rate for user | Reduce alert frequency, adjust thresholds | "We're sending fewer alerts. Adjust settings anytime." |
| **False positive pattern** | Statistical anomaly, not real pattern | User feedback triggers re-calibration | "Thanks for feedback. We'll adjust alert sensitivity." |
| **Notification delivery failure** | Push notification fails | Retry via WhatsApp, then in-app | Silent: attempt multi-channel delivery |

### Pattern Detection Logic

```
Pattern Recognition Algorithms:

1. Streak Detection:
   - Monitors: Goal adherence, daily logging, positive behaviors
   - Trigger: 7 consecutive days meeting criteria
   - Alert: "7-day [activity] streak! You're building a habit."
   - Action: Encourage continuation, explain habit formation science

2. Improvement Detection:
   - Monitors: All tracked metrics (sleep, mood, recovery, etc.)
   - Trigger: >15% improvement over 14-day rolling window vs. previous 14 days
   - Alert: "[Metric] improved 18% over 2 weeks! Here's what's working."
   - Action: Reinforce successful behaviors, suggest maintaining factors

3. Decline Detection:
   - Monitors: All tracked metrics
   - Trigger: >15% decline over 14 days (mild), >25% over 7 days (urgent)
   - Alert: "[Metric] declining. [Contributing factors]. Let's address it."
   - Action: Specific intervention recommendations, coaching offer

4. Imbalance Detection:
   - Monitors: Three-pillar harmony scores
   - Trigger: One pillar <40 while others >70, or all pillars <50
   - Alert: "Wellbeing needs attention. Fitness is great but mood/stress low."
   - Action: Pillar-specific recommendations, cross-domain interventions

5. Anomaly Detection:
   - Monitors: Single-day outliers (>2 standard deviations from mean)
   - Trigger: Unusual data point (very high or very low)
   - Alert: "[Metric] unusually [high/low] today. Everything okay?"
   - Action: Check-in question, data validation, context gathering

6. Milestone Detection:
   - Monitors: Personal records, goal achievements
   - Trigger: New PR or goal completion
   - Alert: "New personal record: [achievement]! Celebrate this win."
   - Action: Celebration message, share option, next goal suggestion

7. Cross-Domain Pattern (Advanced):
   - Monitors: Multi-pillar correlations from E8
   - Trigger: Significant multi-factor pattern emerges
   - Alert: "Pattern: Your mood drops 2 days after poor sleep + low activity."
   - Action: Proactive intervention before predicted low-mood day
```

### Alert Examples by Type

**Positive Alerts (Motivation & Celebration):**
- "7-day sleep streak! You're averaging 7h 45min - 30min above your baseline."
- "Recovery score improved 22% this month. Your consistency is paying off!"
- "Personal record: 12,500 steps today - your highest ever!"

**Concerning Alerts (Intervention Needed):**
- "Activity declining 28% over 14 days. Schedule a workout today?"
- "Sleep quality down 3 consecutive nights. Let's troubleshoot tonight's routine."
- "Wellbeing pillar at 38 (Red). Your mood and stress need attention."

**Predictive Alerts (Proactive Coaching):**
- "Based on patterns, tomorrow's energy will be low. Pre-schedule an afternoon walk?"
- "You usually feel great after morning workouts + journaling. Try tomorrow?"
- "Late dinner tonight (8:30pm) typically affects your sleep. Lighter meal?"

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Monitors patterns across all three pillars
- Alerts drive re-engagement with neglected pillars
- Reinforces holistic health approach

**To Insights (F10.1):**
- Alerts are time-sensitive, actionable insights
- Complement daily insight feed with urgent/important patterns
- Alert patterns feed into insight prioritization

**To Cross-Domain Intelligence (E8):**
- Multi-pillar patterns trigger most valuable alerts
- Predictive alerts rely on E8's correlation engine
- Validates cross-domain connections through real-world impact

### Dependencies
- **E8 (Cross-Domain Intelligence):** Pattern detection algorithms, statistical analysis
- **All Pillars (E5, E6, E7):** Real-time data monitoring for pattern emergence
- **E4 (Mobile App):** Alert display UI, quick action buttons
- **E3 (WhatsApp):** Multi-channel alert delivery
- **E2 (Voice Coaching):** Alert follow-up conversations

### MVP Status
[X] MVP Core (USP)

---

## F10.6: GOAL PROGRESS TRACKING

### Description
Unified dashboard view of all active goals across fitness, nutrition, and wellbeing with visual progress indicators, streak tracking, and achievement celebrations. Consolidates goal tracking from individual pillars into comprehensive overview.

### User Story
As a **Holistic Health Seeker** (P1), I want to see all my health goals in one place with clear progress indicators so that I can stay motivated and understand how I'm doing across all areas of my health without navigating multiple screens.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Top 3 priority goals with simple progress bars, streak counters, and success percentages. Quick glance at "Am I on track?". |
| **Deep** | All active goals displayed, detailed progress analytics per goal (daily/weekly/monthly views), historical success rates, goal adjustment recommendations, milestone timeline, export progress reports. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Goal view engagement | 70% of users check goal progress 3+ times/week | View frequency analytics |
| Goal completion rate | 60% of active goals achieved within timeframe | Goal tracking analytics |
| Multi-pillar goal adoption | 40% of users have goals across all three pillars | Goal distribution analysis |
| Goal adjustment adoption | 65% of users adjust unrealistic goals when prompted | Goal modification tracking |

### Acceptance Criteria

- [ ] Displays all active goals from all three pillars in unified view
- [ ] Goal categories: Fitness (activity, sleep, recovery), Nutrition (calories, macros, hydration), Wellbeing (mood, journaling, stress management), Cross-Pillar (harmony score, overall health)
- [ ] Light mode: Top 3 goals by priority, progress bars (0-100%), streak counters, success rate (days completed / days elapsed)
- [ ] Deep mode: All goals with detailed breakdowns, goal-specific charts, daily/weekly/monthly progress views, adjustment recommendations, milestone timeline
- [ ] Visual indicators: Progress bars (color-coded: Green on track, Yellow at risk, Red behind), Streak flames/icons (7-day, 30-day, 90-day streaks), Success percentage badges
- [ ] Goal status labels: On Track (>80% success rate), At Risk (50-79%), Behind (<50%), Completed (100% achieved)
- [ ] Quick actions: Mark as complete (for today), Adjust goal, View detailed analytics, Share achievement
- [ ] Celebration triggers: Goal completed, milestone reached (7/30/90 day streaks), personal record
- [ ] Historical view: Past goals with completion status, average success rates
- [ ] Cross-pillar goal support: "Improve overall health" goal shows harmony score progress

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **No active goals** | User has not set any goals | Prompt goal creation with templates | "Set your first goal! Choose from fitness, nutrition, or wellbeing." |
| **Goal data unavailable** | Missing data for goal metric | Show last known progress with timestamp | "Last updated: [date]. Log [metric] to update progress." |
| **Unrealistic goal detected** | <30% success rate for 7+ days | Suggest goal adjustment | "This goal seems challenging. Adjust to [suggested target]?" |
| **Completed goal lingering** | Goal completed but still showing as active | Auto-archive after 7 days | "Goal achieved! Moving to completed goals. Set a new goal?" |

### Goal Progress Visualization Examples

**Progress Bar Display:**
```
Daily Steps Goal: 10,000 steps
████████████░░░░░░░░ 8,542 / 10,000 (85%)
Streak: 🔥 12 days | Success Rate: 87% (13/15 days)
[Mark Complete] [View Details]
```

**Multi-Goal Dashboard (Light Mode):**
```
1. Sleep 7+ Hours
   ████████████████████ 7.5 hrs avg (Goal: 7.0) ✓
   Streak: 🔥 21 days | 100% this week

2. Log 3 Meals Daily
   ████████████░░░░░░░░ 2.4 avg (Goal: 3.0)
   Streak: 5 days | 71% this week

3. Morning Journaling
   ███████░░░░░░░░░░░░░ 4/7 days (Goal: 7/7)
   Streak: Broken | 57% this week
```

**Deep Mode Analytics:**
- 30-day success trend chart (daily completion bars)
- Best/worst days of week analysis
- Correlation with other goals (e.g., sleep goal success tied to journaling)
- Recommended adjustments based on patterns

### Cross-Pillar Connections

**To Individual Pillar Goals (F5.4, F6.4, F7.6):**
- Aggregates goals from all three pillars
- Reinforces goal progress from pillar-specific features
- Provides unified motivation and progress view

**To Three-Pillar Harmony (F10.2):**
- Multi-pillar goals ("Achieve Green across all pillars") tied to harmony scores
- Goal progress influences pillar scores
- Harmony view shows which goals drive overall balance

**To Insights (F10.1) & Alerts (F10.5):**
- Goal struggles trigger intervention insights
- Goal achievements trigger celebration alerts
- Goal-related patterns feed into recommendation engine

### Dependencies
- **E5, E6, E7 (All Pillars):** Goal data from pillar-specific goal features
- **E4 (Mobile App):** Goal dashboard UI, progress visualizations
- **E8 (Cross-Domain Intelligence):** Cross-pillar goal analysis, recommendations
- **E3 (WhatsApp):** Daily goal check-ins and reminders

### MVP Status
[X] MVP Core

---

## F10.7: COMPARATIVE ANALYTICS

### Description
Period-over-period comparison tools that allow users to compare current performance against past periods (this week vs. last week, this month vs. last month, current vs. best period). Validates progress and motivates through visible improvements.

### User Story
As an **Optimization Enthusiast** (P3), I want to compare my current health metrics to previous periods so that I can objectively measure progress and understand if my interventions are working over time.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple comparison: "This week vs. last week" with up/down arrows and percentage changes for top 5 metrics. |
| **Deep** | Full comparison tool: Select any two periods to compare (custom date ranges), compare all metrics, side-by-side charts, delta analysis, export comparison reports. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Comparison view engagement | 45% of users use comparisons monthly | Feature usage analytics |
| Period diversity | 60% of comparisons use multiple period types | Comparison type tracking |
| Motivation from comparisons | 70% report comparisons motivate continued effort | Post-comparison surveys |
| Improvement detection | 55% of users identify improvements within 30 days | Comparison outcome analytics |

### Acceptance Criteria

- [ ] Predefined comparison periods: This week vs. last week, This month vs. last month, Last 7 days vs. previous 7 days, Last 30 days vs. previous 30 days, Current vs. best period (all-time best performance), Current vs. worst period (motivational context)
- [ ] Custom period selection (Deep Mode): User-defined date ranges for both periods (e.g., Jan 2025 vs. Jan 2024)
- [ ] Light mode: Top 5 metrics with delta indicators (↑ improved, ↓ declined, → stable), percentage change, simple color coding (Green improvement, Red decline)
- [ ] Deep mode: All metrics available, side-by-side bar charts, trend line overlays, statistical significance indicators, detailed delta analysis (absolute and percentage changes), export comparison as PDF/CSV
- [ ] Metrics compared: All fitness metrics (activity, sleep, recovery, strain), All nutrition metrics (calories, macros, hydration, meal frequency), All wellbeing metrics (mood, stress, energy, journaling), Three-pillar harmony scores
- [ ] Statistical context: Average values for each period, Standard deviation (consistency measure), Best single day in each period, Improvement/decline significance (is change meaningful or noise?)
- [ ] Narrative summary: "Your sleep improved 12% this month vs. last month, while maintaining activity levels and improving mood by 8%."
- [ ] Quick actions from comparisons: Set goal based on best period, Investigate what worked during best period, Get coaching on declining metrics

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for period** | Selected period has <50% data coverage | Show partial comparison with disclaimer | "Limited data for [period]. Comparison based on available days only." |
| **Identical periods selected** | User selects same period twice | Prevent selection | "Select two different periods to compare." |
| **No best period exists** | New user with <30 days data | Disable "vs. best period" option | "Best period comparison available after 30 days of data." |
| **All metrics declined** | 100% negative comparison (unlikely but possible) | Frame constructively | "Tough period, but you logged consistently. Let's turn it around this week." |

### Comparison Display Examples

**Light Mode (This Week vs. Last Week):**
```
Sleep Quality:     85 → 78  ↓ -8%  (Red)
Activity Level:    72 → 89  ↑ +24% (Green)
Mood Average:      7.2 → 7.5 ↑ +4% (Green)
Stress Level:      5.1 → 4.8 ↓ +6% (Green - lower stress is better)
Meals Logged:      18 → 21 ↑ +17% (Green)
```

**Deep Mode Comparison Table:**
| Metric | Last 30 Days | Previous 30 Days | Change | Trend |
|--------|--------------|------------------|--------|-------|
| Sleep Duration | 7.4 hrs | 6.9 hrs | +0.5 hrs (+7%) | ↑ Green |
| Sleep Quality | 82/100 | 76/100 | +6 points (+8%) | ↑ Green |
| Daily Steps | 9,240 | 8,850 | +390 (+4%) | ↑ Green |
| Recovery Score | 79/100 | 73/100 | +6 points (+8%) | ↑ Green |
| Calories | 2,180 | 2,340 | -160 (-7%) | ↓ Yellow |
| Protein | 142g | 128g | +14g (+11%) | ↑ Green |
| Mood | 7.6/10 | 7.1/10 | +0.5 (+7%) | ↑ Green |
| Stress | 4.2/10 | 5.8/10 | -1.6 (-28%) | ↓ Green* |

*Lower stress is improvement, shown as decline but colored green.

**Narrative Summary (AI-Generated):**
> "Great month! Your sleep improved across both duration (+7%) and quality (+8%), likely driving your 8% recovery score increase. Activity stayed consistent with a modest 4% step increase. Nutrition-wise, you reduced overall calories (-7%) while increasing protein (+11%) - excellent for body composition. Most impressively, stress levels dropped 28% and mood improved 7%, showing strong mental health gains. Keep this momentum!"

### Cross-Pillar Connections

**To Trend Analysis (F10.3):**
- Comparisons provide discrete period summaries
- Trends show continuous time-series progression
- Complementary views of same data

**To Insights (F10.1):**
- Significant period-over-period changes trigger insights
- "You improved X by Y% this month" becomes an insight
- Comparisons validate AI-surfaced improvement insights

**To Goals (F10.6):**
- Compare goal success rates across periods
- "Your goal adherence improved 15% this month"
- Period comparisons inform goal adjustments

### Dependencies
- **All Pillars (E5, E6, E7):** Historical data for all metrics
- **E4 (Mobile App):** Comparison UI, side-by-side visualizations
- **E8 (Cross-Domain Intelligence):** Statistical analysis, narrative generation
- **F10.3 (Trend Analysis):** Shares data sources and calculation methods

### MVP Status
[X] MVP Core

---

## F10.8: RECOVERY & STRAIN OVERVIEW

### Description
Dedicated dashboard section for Dual Recovery Scores (Physical + Mental) and Strain Score with detailed breakdowns, 7-day trends, and strain-recovery balance analysis. The fitness-focused analytics that competing apps (WHOOP, BEVEL) excel at, with yHealth's mental recovery differentiation.

### User Story
As an **Optimization Enthusiast** (P3), I want to see my recovery and strain metrics in detail with historical context so that I can optimize my training load and avoid overtraining while maximizing performance.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Today's dual recovery scores (Physical, Mental) and yesterday's strain score with color coding. One-line recommendation: "Physical ready (85), Mental needs rest (62) - light activity today". |
| **Deep** | Detailed breakdowns: recovery score components (HRV, RHR, sleep, mood, stress, energy), strain breakdown by activity, 7-day recovery/strain trends, strain-recovery balance analysis, weekly load management, export data. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Recovery dashboard engagement | 75% of users check recovery daily | Daily view count |
| Training adjustment based on recovery | 65% adjust workout intensity based on scores | Behavioral analytics |
| Overtraining prevention | 50% reduction in overtraining symptoms | Monthly surveys |
| Balance awareness | 70% understand strain-recovery ratio | User comprehension surveys |

### Acceptance Criteria

- [ ] Recovery section displays: Today's Physical Recovery Score (0-100), Today's Mental Recovery Score (0-100), Color coding (Green/Yellow/Red), Recommendation based on both scores
- [ ] Recovery score breakdown (Deep Mode): Physical components: HRV score, RHR score, Sleep quality score, Sleep duration score, Mental components: Mood score, Stress score (inverted), Energy score, Journaling bonus
- [ ] Strain section displays: Yesterday's total strain score, Strain breakdown by activity (if multiple workouts), 7-day cumulative strain
- [ ] Strain breakdown (Deep Mode): Per-activity strain contributions, Strain calculation method shown (HR-based, duration-based, or perceived effort), Historical strain patterns
- [ ] Strain-recovery balance analysis: Weekly strain / weekly avg recovery ratio, Balance indicator (Balanced, Overreaching, Undertraining), Visual balance chart (strain bars vs. recovery line), Alert if ratio >4.5 (overtraining risk)
- [ ] 7-day trends: Line charts for physical recovery, mental recovery, and daily strain, Identify patterns (e.g., weekday vs. weekend recovery)
- [ ] Light mode: Scores + one-line recommendation + quick view of 7-day trend
- [ ] Deep mode: Full component breakdowns, balance analysis, export detailed report
- [ ] Comparison to personal averages: "Your physical recovery is 8% above your 30-day average"

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for recovery** | Missing HRV, mood, or sleep data | Partial score with disclaimer | "Physical recovery: 82 (based on sleep only - connect wearable for HRV)" |
| **New user baseline building** | <7 days data | Use population averages | "Building your baseline. Scores personalize in 7-14 days." |
| **Extreme imbalance detected** | Physical 95, Mental 35 (or vice versa) | Priority alert | "Body ready but mind exhausted. Rest or gentle activity recommended." |
| **No strain data** | User didn't track any activity yesterday | Show zero with prompt | "No activity logged yesterday. Strain score: 0. Log workouts for tracking." |

### Recovery & Strain Dashboard Layout

**Today's Recovery (Light Mode):**
```
Physical Recovery: 85  🟢 Ready
Mental Recovery:   72  🟡 Moderate

Recommendation: Good training day! Body is ready. Mind moderately fresh - avoid extreme intensity.

7-Day Trend: ↗️ Improving
```

**Detailed Recovery Breakdown (Deep Mode):**
```
PHYSICAL RECOVERY: 85/100 🟢

HRV Score:           88/100  (65 ms - above baseline)
Resting HR:          82/100  (52 bpm - good)
Sleep Quality:       85/100  (deep sleep: 1h 45min)
Sleep Duration:      80/100  (7.5 hrs - near target)

Weighted Average:    85/100


MENTAL RECOVERY: 72/100 🟡

Mood Score:          75/100  (7.5/10 rating)
Stress Score:        70/100  (4/10 stress - inverted)
Energy Score:        70/100  (7/10 rating)
Journaling Bonus:    +10     (completed yesterday)

Weighted Average:    72/100
```

**Strain Overview (Deep Mode):**
```
YESTERDAY'S STRAIN: 68/100

Morning Run:         45  (6.2 miles, 45 min, HR avg 152)
Evening Yoga:        23  (30 min, light intensity)

Total Daily Strain:  68

7-DAY CUMULATIVE STRAIN: 312
Weekly Average:      44.6 per day
```

**Strain-Recovery Balance:**
```
WEEKLY BALANCE ANALYSIS

Total Strain (7 days):     312
Avg Recovery (7 days):     81

Strain-Recovery Ratio:     3.85
Status: ✅ BALANCED

Optimal Range: 3.0 - 4.5
Your Range:    3.85 (healthy training load)

Chart: [Strain bars vs Recovery line showing good balance]
```

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- Recovery score (F5.3) and Strain score (F5.6) visualized here
- Dashboard is centralized view of distributed pillar features
- Drives engagement with fitness tracking

**To Wellbeing Pillar (E7):**
- Mental recovery highlights importance of mood/stress tracking
- Users see direct impact of journaling on recovery score
- Reinforces wellbeing as equal pillar

**To Workout Recommendations (F5.5):**
- Recovery scores drive workout intensity recommendations
- Dashboard validates why AI suggested certain workouts
- Users understand rationale behind light/moderate/intense recommendations

### Dependencies
- **F5.3 (Recovery Monitoring):** Dual recovery score calculation
- **F5.6 (Strain/Load Management):** Strain score calculation
- **E7 (Wellbeing Pillar):** Mental recovery inputs (mood, stress, energy, journaling)
- **E9 (Data Integrations):** HRV, RHR data from wearables
- **E4 (Mobile App):** Dashboard UI, charts, component breakdowns

### MVP Status
[X] MVP Core

---

## F10.9: SLEEP QUALITY DASHBOARD

### Description
Comprehensive sleep analytics section displaying sleep duration, quality score, sleep stages, HRV during sleep, and cross-pillar sleep correlations. Emphasizes yHealth's differentiation: how sleep connects to mood, workout performance, and nutrition patterns.

### User Story
As a **Holistic Health Seeker** (P1), I want to understand my sleep quality in depth and see how it affects other areas of my health so that I can optimize my sleep routine for maximum overall wellbeing and performance.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Last night's sleep summary: duration, quality score (0-100), simple rating (Good/Fair/Poor), one-line insight: "7h 30min, Quality: 85/100 (Good). Sleep supports today's recovery." |
| **Deep** | Detailed sleep analysis: sleep stages breakdown (Wake, Light, Deep, REM), time in each stage, sleep onset latency, wake-ups count, HRV during sleep, RHR during sleep, 7/30-day sleep trends, cross-pillar correlations (sleep vs. mood, sleep vs. workout performance, sleep vs. nutrition). |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sleep dashboard engagement | 70% of users check sleep quality daily | View count analytics |
| Sleep improvement | 60% improve sleep quality score by 10+ points in 30 days | Sleep score trend analysis |
| Cross-domain sleep insights | 75% receive sleep correlation insights within 14 days | Insight delivery tracking |
| Sleep optimization actions | 50% act on sleep recommendations | Action tracking |

### Acceptance Criteria

- [ ] Last night's sleep summary: Total sleep time (hours:minutes), Sleep quality score (0-100), Sleep efficiency (time asleep / time in bed), Bedtime and wake time
- [ ] Sleep stages visualization: Bar chart or timeline showing Wake, Light, Deep, REM stages, Time spent in each stage (hours:minutes and %), Target ranges for each stage (age-based recommendations)
- [ ] Sleep metrics: Sleep onset latency (time to fall asleep), Number of wake-ups, HRV during sleep (if available), RHR during sleep, Sleep consistency score (bedtime/wake time regularity)
- [ ] Light mode: Summary scores + simple visualization + one insight
- [ ] Deep mode: All metrics + detailed stages + trends + correlations + recommendations
- [ ] 7-day sleep trend: Line chart showing sleep duration and quality over past week, Identify patterns (weekday vs. weekend, improving vs. declining)
- [ ] 30-day sleep analysis: Average sleep duration, quality, consistency, Best/worst nights highlighted
- [ ] Cross-pillar correlations: "Your mood is 25% better after 7+ hours sleep" (Sleep ↔ Wellbeing), "Workout performance 30% higher with quality sleep >80" (Sleep ↔ Fitness), "Late dinners (after 8pm) reduce sleep quality by 12%" (Sleep ↔ Nutrition)
- [ ] Sleep recommendations: Personalized based on patterns ("Try bedtime 30min earlier for optimal duration"), Evidence-based sleep hygiene tips
- [ ] Export sleep data: CSV format with all metrics and stages

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **No sleep data** | Missing sleep data for last night | Prompt manual entry or wearable connection | "No sleep data for last night. Log manually or connect your device." |
| **Sleep stage unavailable** | Device doesn't track stages | Show duration and quality only | "Sleep duration: 7h 30min. Quality: 82/100. (Stages unavailable from your device)" |
| **Unrealistic sleep values** | Manual entry >12 hours or <2 hours | Flag for confirmation | "Sleep duration seems unusual. Confirm: 13 hours?" |
| **HRV/RHR missing** | Wearable didn't capture biometrics | Show available metrics only | "HRV during sleep unavailable. Other metrics shown." |

### Sleep Quality Score Calculation

```
Sleep Quality Score (0-100):

Components:
1. Sleep Duration (30%):
   - Compare to user's target (default 7-9 hours for adults)
   - 100 points: Within target range
   - Penalty: -10 points per hour deviation

2. Sleep Efficiency (25%):
   - Time asleep / time in bed
   - 100 points: >90% efficiency
   - Scale: 70-90% efficiency = 50-100 points

3. Deep Sleep (20%):
   - Target: 15-25% of total sleep
   - 100 points: Within target range
   - Penalty for insufficient deep sleep

4. REM Sleep (15%):
   - Target: 20-25% of total sleep
   - 100 points: Within target range
   - Bonus for optimal REM

5. Sleep Disruptions (10%):
   - Wake-ups count
   - 100 points: 0-2 wake-ups
   - Penalty: -10 points per additional wake-up

Overall Score: Weighted average of components
```

### Sleep Dashboard Layout Examples

**Light Mode:**
```
LAST NIGHT'S SLEEP

Duration:     7h 32min
Quality:      85/100  🟢 Good
Efficiency:   92%

Simple visualization: [Sleep stages bar]

Insight: "Great sleep! This supports today's physical recovery (88) and should boost mood."
```

**Deep Mode:**
```
SLEEP ANALYSIS - Dec 1, 2025

Overview:
  Bedtime:           11:15 PM
  Wake Time:         6:47 AM
  Total Time in Bed: 7h 32min
  Total Sleep:       6h 55min
  Sleep Efficiency:  92%
  Quality Score:     85/100  🟢

Sleep Stages:
  Wake:    37 min  (8%)   [Target: <10%]
  Light:   3h 28min (50%) [Target: 45-55%]
  Deep:    1h 24min (20%) [Target: 15-25%] ✓
  REM:     1h 33min (22%) [Target: 20-25%] ✓

Biometrics:
  HRV Avg During Sleep: 68 ms (above baseline +6%)
  RHR During Sleep:     48 bpm (excellent)
  Sleep Onset:          12 minutes (good)
  Wake-Ups:             2 (normal)

7-Day Trend:
[Line chart: Sleep duration and quality over past week]
  Average Duration: 7h 18min
  Average Quality:  82/100
  Consistency:      Good (bedtime variance: 45min)

Cross-Pillar Insights:
  🏃 "Your workout performance is 28% better after 7+ hour sleep nights (8 of 10 best workouts)"
  😊 "Mood rating averages 8.2/10 after quality sleep >80 vs. 6.5/10 after poor sleep"
  🍽️ "You consume 280 fewer calories on days following good sleep (better appetite regulation)"

Recommendations:
  ✅ You're getting sufficient deep and REM sleep
  💡 Bedtime consistency could improve - try 11:00 PM daily for 7 days
  💡 Your best sleep happens when you journal before bed (4 of 5 best nights)
```

### Cross-Pillar Connections

**To Fitness Pillar (E5):**
- Sleep data from F5.2 visualized in detail here
- Sleep quality drives recovery score (F5.3)
- Sleep-workout performance correlations highlighted

**To Nutrition Pillar (E6):**
- Late eating patterns correlated with sleep quality
- Sleep deprivation linked to increased calorie intake
- Caffeine timing affects sleep quality

**To Wellbeing Pillar (E7):**
- Sleep quality strongly predicts mood and energy
- Poor sleep correlates with increased stress
- Journaling before bed improves sleep quality

**To Insights (F10.1):**
- Sleep correlations become personalized insights
- "Best sleep follows journaling + light dinner before 7pm"
- Predictive insights based on sleep patterns

### Dependencies
- **F5.2 (Sleep Tracking):** Raw sleep data and quality scores
- **E9 (Data Integrations):** Sleep data from wearables (WHOOP, Oura, Apple Watch, Fitbit)
- **E8 (Cross-Domain Intelligence):** Sleep correlation calculations
- **E4 (Mobile App):** Sleep dashboard UI, stage visualizations
- **E7 (Wellbeing Pillar):** Mood/stress data for correlations

### MVP Status
[X] MVP Core

---

## F10.10: EXPORT & SHARING

### Description
Comprehensive data export capabilities (CSV, PDF reports) and selective sharing features (achievements, insights, progress) for user portability, medical record sharing, and social motivation. Ensures user data ownership and enables external use cases.

### User Story
As a **Holistic Health Seeker** (P1), I want to export my health data for my records or share achievements with friends/healthcare providers so that I maintain ownership of my data and can celebrate progress or seek medical advice when needed.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Quick share buttons for achievements ("Share my 30-day streak!"), pre-built PDF weekly summary, one-tap export last 30 days as CSV. |
| **Deep** | Full export control: custom date ranges, select specific metrics, choose format (CSV, JSON, PDF), comprehensive health report generation, scheduled exports (weekly/monthly email), HIPAA-compliant data portability. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Export usage | 30% of users export data at least once | Export action tracking |
| Share engagement | 20% share achievements via social/messaging | Share action tracking |
| Medical record requests | 10% generate reports for healthcare providers | Report type analytics |
| Scheduled export adoption | 15% set up recurring exports | Automation configuration tracking |

### Acceptance Criteria

- [ ] Export formats supported: CSV (machine-readable data), JSON (API-compatible), PDF (human-readable reports)
- [ ] Export scopes: All data (complete health record), Date range selection (custom start/end dates), Metric selection (specific data types only), Pillar-specific (fitness only, nutrition only, wellbeing only)
- [ ] Light mode quick exports: "Export Last 30 Days" (CSV with all metrics), "Weekly Summary PDF" (pre-built report), "Share Achievement" (image card for social media)
- [ ] Deep mode custom exports: Date range picker (any start/end date), Metric checklist (select which data to include), Format selection (CSV, JSON, PDF), Preview before download, File naming customization
- [ ] PDF report types: Weekly Summary (7 days, key metrics, insights, goals), Monthly Progress Report (30 days, trends, achievements, recommendations), Comprehensive Health Report (all data, formatted for medical review), Custom Report (user-defined metrics and period)
- [ ] Share functionality: Achievement cards (visual images for streaks, milestones, PRs), Insight sharing (share specific insights via WhatsApp, social media), Progress charts (share trend charts as images), Privacy controls (anonymize personal data if desired)
- [ ] Scheduled exports (Deep Mode): Weekly automated email with CSV/PDF, Monthly comprehensive report, Custom schedule configuration
- [ ] Data portability compliance: GDPR "right to portability" - complete data export in machine-readable format (JSON), HIPAA compliance - secure PDF reports for medical providers, Download link expires in 7 days for security
- [ ] Export history: Track all exports (date, type, scope) for 90 days, Re-download recent exports without regenerating

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Export too large** | Data export >50 MB | Split into multiple files or compress | "Large export split into 3 files for easier download." |
| **Export generation timeout** | Processing >30 seconds | Queue for background processing, email link | "Export is processing. We'll email you the download link shortly." |
| **Insufficient data for report** | Selected period has minimal data | Generate partial report with disclaimer | "Limited data for selected period. Report includes available metrics only." |
| **Share feature unavailable** | Platform restriction (e.g., web view) | Copy link to clipboard | "Share link copied. Paste in your preferred app." |
| **Download link expired** | User clicks old export link (>7 days) | Prompt regeneration | "Link expired for security. Regenerate export?" |

### Export Data Schema (CSV Example)

```
Date,Sleep_Duration_hrs,Sleep_Quality_0to100,Steps,Active_Minutes,Calories_Consumed,Protein_g,Mood_1to10,Stress_1to10,Energy_1to10,Journaling_Completed,Physical_Recovery_0to100,Mental_Recovery_0to100,Strain_Score_0to100
2025-12-01,7.5,85,9240,45,2180,142,7.5,4,7,Yes,85,72,68
2025-11-30,6.8,78,8420,38,2340,128,7,5,6,No,76,65,52
...
```

### PDF Report Template (Weekly Summary Example)

```
yHealth Weekly Summary
Week of Nov 25 - Dec 1, 2025
User: [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THREE-PILLAR HARMONY

Fitness:     85/100  🟢 Excellent
Nutrition:   72/100  🟡 Good
Wellbeing:   78/100  🟡 Good

Overall Harmony: 78/100 (Balanced)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FITNESS HIGHLIGHTS

Sleep:       7.3 hrs avg (Target: 7.0) ✓
Activity:    9,240 steps/day avg
Recovery:    81/100 avg (Excellent)
Strain:      312 weekly total (Balanced)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NUTRITION HIGHLIGHTS

Calories:    2,180/day avg (Target: 2,200)
Protein:     142g/day avg (Target: 140g) ✓
Hydration:   2.1L/day avg (Target: 2.5L)
Meals Logged: 21/21 (100% adherence) 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WELLBEING HIGHLIGHTS

Mood:        7.6/10 avg (Excellent)
Stress:      4.2/10 avg (Low - good!)
Energy:      7.4/10 avg (High)
Journaling:  6/7 days (86% completion)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOP INSIGHTS THIS WEEK

1. Your best workouts (8+/10 rating) happened after 7+ hours sleep AND morning journaling (4 of 5 occurrences).

2. Stress levels dropped 28% this week vs. last week - correlates with increased journaling frequency.

3. Sleep quality improved to 82/100 avg (up from 76/100 last week) - keep evening routine consistent!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACHIEVEMENTS THIS WEEK

🔥 7-day sleep streak (7+ hours)
🎯 100% meal logging adherence
📈 Personal record: 12,500 steps (Dec 1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATIONS FOR NEXT WEEK

1. Increase hydration to meet 2.5L daily goal
2. Maintain current sleep routine (it's working!)
3. Try morning workouts 3x this week (they correlate with best mood days)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated by yHealth - Your Comprehensive AI Health Coach
Report Date: Dec 2, 2025
```

### Share Achievement Card Design

Visual card for social sharing (Instagram, WhatsApp, etc.):
- Clean design with yHealth branding
- Headline: "30-Day Sleep Streak!"
- Supporting data: "Averaged 7h 30min per night"
- Metric visualization (small chart or icon)
- Optional: Privacy mode removes personal details
- Watermark: "Powered by yHealth"

### Cross-Pillar Connections

**To All Features:**
- Export/share is horizontal feature across all analytics
- Any insight, trend, or achievement can be exported/shared
- Enables external validation and motivation

**To Medical Use Cases:**
- PDF reports formatted for healthcare provider review
- Complete data export supports medical record integration
- HIPAA-compliant handling for sensitive health data

**To User Retention:**
- Data ownership builds trust and loyalty
- Share features drive social proof and referrals
- Scheduled exports keep users engaged long-term

### Dependencies
- **All Pillars (E5, E6, E7):** Data sources for exports
- **All Analytics Features (F10.1-F10.9):** Export any displayed data
- **E4 (Mobile App):** Export UI, share button integrations
- **Backend:** Report generation engine, secure download link management
- **Email Service:** Scheduled export delivery

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 10 analytics features functional across Light and Deep modes
- [ ] Personalized Insight Feed delivers 3-5 insights daily with 70%+ engagement (F10.1)
- [ ] Three-Pillar Harmony View displays accurate scores with cross-pillar balance (F10.2)
- [ ] Trend Analysis supports all timeframes (7/30/90/365 days) with <3s load time (F10.3)
- [ ] "What's Affecting What" Explorer enables custom correlation discovery (F10.4)
- [ ] Pattern Recognition Alerts trigger proactively with 75%+ helpfulness rating (F10.5)
- [ ] Goal Progress Tracking consolidates all pillar goals in unified view (F10.6)
- [ ] Comparative Analytics enables period-over-period comparisons (F10.7)
- [ ] Recovery & Strain Overview displays dual scores with balance analysis (F10.8)
- [ ] Sleep Quality Dashboard shows detailed sleep analytics with correlations (F10.9)
- [ ] Export & Sharing supports CSV, PDF, and social sharing (F10.10)
- [ ] Dashboard load time <3 seconds for full analytics view
- [ ] All features accessible via Mobile App (primary), WhatsApp (selected), Voice (conversational)
- [ ] Cross-pillar insights operational: fitness-nutrition-wellbeing connections visible
- [ ] Error handling graceful for all insufficient data scenarios

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Performance** | Dashboard load <3s, Insight generation <2s, Chart rendering <2s | Analytics monitoring |
| **Engagement** | 70% daily insight engagement, 60% weekly trend views, 40% explorer usage | Feature usage analytics |
| **Accuracy** | 75% insight helpfulness rating, 70% pattern alert relevance | User feedback surveys |
| **User Satisfaction** | 4.6/5 rating for analytics features overall | In-app NPS surveys |
| **Cross-Pillar Value** | 80% of users discover cross-domain insights within 14 days | Insight engagement tracking |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Discovers unexpected connections between pillars via insights | "Aha moment" within 7 days via cross-pillar insight |
| **P2: Busy Professional** | Quick glance at harmony view and top insights (Light Mode) | Uses Light Mode analytics 5+ times/week |
| **P3: Optimization Enthusiast** | Deep dives into trends, correlations, comparisons (Deep Mode) | Engages with Deep Mode features 3+ times/week |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- User preferences (Light/Deep mode) set during onboarding determine default analytics views
- Baseline data established during assessment feeds into comparative analytics

### E2: Voice Coaching
- "How's my recovery today?" voice queries pull from F10.8
- "What insights do I have?" conversational access to F10.1
- Voice-based data exploration: "Compare my sleep this week to last week"

### E3: WhatsApp Integration
- Daily insight delivery via WhatsApp messaging (F10.1 push notifications)
- Quick analytics check: "Show my harmony scores" returns F10.2 summary
- Pattern alerts delivered via WhatsApp (F10.5)

### E4: Mobile App
- **Primary analytics platform** - all dashboard features built for app
- Interactive charts, visualizations, and deep mode analytics
- Export and share functionality integrated into app UI

### E5-E7: Three Pillars (Fitness, Nutrition, Wellbeing)
- **Primary data sources** for all analytics features
- Pillar-specific metrics feed into harmony scores, trends, insights
- Analytics dashboard is visual proof of three-pillar integration

### E8: Cross-Domain Intelligence
- **Analytics is E8's visual layer** - surfaces the correlations E8 discovers
- Insight generation (F10.1) powered by E8's correlation engine
- "What's Affecting What" Explorer (F10.4) uses E8's statistical analysis
- Pattern Recognition (F10.5) relies on E8's detection algorithms

### E9: Data Integrations
- Wearable data from 10+ sources feeds all analytics features
- Data quality and completeness directly impacts analytics value
- Integration health monitoring affects insight generation

---

## TECHNICAL CONSIDERATIONS

### Data Models (Analytics Domain)

**Insight Record:**
```json
{
  "insight_id": "uuid",
  "user_id": "uuid",
  "generated_at": "2025-12-02T06:00:00Z",
  "category": "correlational|predictive|actionable",
  "pillar_tags": ["fitness", "wellbeing"],
  "headline": "Your best workouts follow 7+ hours sleep AND morning journaling",
  "summary": "Pattern strength: 85% (17 of 20 occurrences)",
  "detailed_explanation": "...",
  "supporting_data": {
    "correlation_coefficient": 0.85,
    "sample_size": 20,
    "confidence": "high"
  },
  "recommended_actions": ["Journal tomorrow morning", "Prioritize 7+ hours sleep tonight"],
  "priority_score": 92,
  "engagement": {
    "viewed": true,
    "clicked": true,
    "action_taken": false,
    "feedback": "helpful"
  }
}
```

**Harmony Score Record:**
```json
{
  "harmony_id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-02",
  "fitness_score": 85,
  "fitness_breakdown": {
    "activity_score": 90,
    "sleep_score": 80,
    "recovery_score": 85
  },
  "nutrition_score": 72,
  "nutrition_breakdown": {
    "meal_quality": 75,
    "hydration": 65,
    "macro_balance": 74
  },
  "wellbeing_score": 78,
  "wellbeing_breakdown": {
    "mood": 80,
    "stress": 75,
    "energy": 80,
    "journaling": 10
  },
  "harmony_index": 78,
  "balance_bonus": 0,
  "recommendation": "Focus on hydration to boost nutrition pillar"
}
```

**Correlation Record:**
```json
{
  "correlation_id": "uuid",
  "user_id": "uuid",
  "metric_x": "sleep_duration_hrs",
  "metric_y": "mood_rating_1to10",
  "correlation_coefficient": 0.72,
  "p_value": 0.003,
  "sample_size": 45,
  "significance": "strong_positive",
  "calculated_at": "2025-12-02T00:00:00Z",
  "user_saved": true
}
```

### API Endpoints (Analytics Dashboard)

```
GET    /api/v1/analytics/insights              - Get daily personalized insights
POST   /api/v1/analytics/insights/feedback     - Submit insight feedback
GET    /api/v1/analytics/insights/history      - Historical insights (30 days)

GET    /api/v1/analytics/harmony               - Current three-pillar harmony scores
GET    /api/v1/analytics/harmony/history       - Harmony trends (7/30/90 days)

GET    /api/v1/analytics/trends                - Trend data for selected metrics and timeframe
POST   /api/v1/analytics/trends/compare        - Compare metrics overlay

GET    /api/v1/analytics/correlations          - Top correlations for user
POST   /api/v1/analytics/correlations/explore  - Custom correlation calculation
POST   /api/v1/analytics/correlations/save     - Save favorite correlation

GET    /api/v1/analytics/patterns/alerts       - Active pattern alerts
POST   /api/v1/analytics/patterns/feedback     - Alert feedback (helpful/dismiss)
GET    /api/v1/analytics/patterns/history      - Alert history (90 days)

GET    /api/v1/analytics/goals/progress        - All goal progress
GET    /api/v1/analytics/goals/{id}/details    - Detailed goal analytics

POST   /api/v1/analytics/compare               - Period-over-period comparison
GET    /api/v1/analytics/compare/presets       - Predefined comparison periods

GET    /api/v1/analytics/recovery-strain       - Current recovery & strain overview
GET    /api/v1/analytics/recovery-strain/trends - 7-day recovery/strain trends

GET    /api/v1/analytics/sleep/detailed        - Detailed sleep analytics
GET    /api/v1/analytics/sleep/correlations    - Sleep cross-pillar correlations

POST   /api/v1/analytics/export                - Generate data export (CSV, JSON, PDF)
GET    /api/v1/analytics/export/{id}/download  - Download generated export
POST   /api/v1/analytics/share                 - Generate shareable achievement card
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Dashboard initial load | <3 seconds | Acceptable for data-rich view with multiple charts |
| Insight generation (daily batch) | <2 seconds per user | Background process, acceptable batch time |
| Insight feed display | <1 second | Real-time user interaction, must feel instant |
| Trend chart rendering | <2 seconds | Interactive charts with 90-365 days data |
| Correlation calculation | <3 seconds | Complex statistical analysis, acceptable wait |
| Harmony score calculation | <1 second | Real-time dashboard updates, frequently accessed |
| Export generation (PDF) | <10 seconds | Report compilation acceptable with progress indicator |
| Export generation (CSV) | <5 seconds | Simpler format, faster generation |

### Caching Strategy

**Insight Cache:**
- Daily insights generated at 6:00 AM user local time
- Cached for 24 hours (no real-time regeneration)
- Refresh when new significant data arrives (e.g., unexpected pattern)

**Harmony Score Cache:**
- Calculated once daily at midnight
- Cached for 24 hours
- Invalidate and recalculate if pillar data changes significantly

**Trend Data Cache:**
- Cache 7/30/90-day trends for 6 hours
- Invalidate when new data synced from wearables
- Pre-generate common timeframes during low-traffic hours

**Correlation Cache:**
- User-saved correlations: calculate on-demand, cache result
- Top correlations: pre-calculate weekly, cache for 7 days
- Custom explorations: calculate on-demand, no persistent cache

### Security & Privacy

- **Data Encryption:** All analytics data encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Access Control:** User can only access their own analytics (strict user_id filtering)
- **Export Security:** Download links expire in 7 days, one-time use tokens
- **Anonymization:** Shared achievement cards can optionally anonymize personal details
- **Data Deletion:** Complete analytics records removed within 30 days of account deletion (GDPR)
- **Insight Transparency:** Users can always see which data points contributed to insights (explainability)

---

## COMPETITIVE ANALYSIS (ANALYTICS DASHBOARD)

### Feature Parity Matrix

| Feature | WHOOP | BEVEL | yHealth | Differentiation |
|---------|-------|-------|---------|-----------------|
| **Recovery Score** | ✅ (physiology only) | ✅ (physiology only) | ✅ **Dual Score** (Physical + Mental) | Mental recovery unique to yHealth |
| **Strain Score** | ✅ (WHOOP device only) | ✅ | ✅ **Universal** (works for all users) | No premium wearable required |
| **Sleep Analytics** | ✅ Advanced | ✅ Advanced | ✅ **Plus cross-pillar correlations** | Sleep-mood, sleep-nutrition insights |
| **Trend Charts** | ✅ Basic | ✅ Customizable | ✅ Multi-metric overlays | Compare any metrics on same chart |
| **Insights** | ❌ Limited | ✅ "Bevel Intelligence" | ✅ **Personalized AI Feed** (3-5 daily) | Multi-pillar, predictive, actionable |
| **Correlations** | ❌ | ✅ Limited | ✅ **"What's Affecting What" Explorer** | User-driven discovery tool |
| **Three-Pillar View** | ❌ (fitness only) | ❌ (fitness only) | ✅ **Unique to yHealth** | Harmony across fitness, nutrition, wellbeing |
| **Pattern Alerts** | ❌ | ❌ | ✅ **Proactive notifications** | Real-time pattern recognition |
| **Export/Share** | ✅ Basic | ✅ PDF reports | ✅ CSV, JSON, PDF, social sharing | Comprehensive data portability |

### yHealth's Analytics Moat

**What We Do Better:**
1. **Three-Pillar Harmony:** Only platform showing balance across fitness, nutrition, AND wellbeing
2. **Dual Recovery Score:** Physical + Mental recovery (competitors only track physical)
3. **Personalized Insight Feed:** 3-5 AI-generated daily insights (competitors have generic tips)
4. **User-Driven Exploration:** "What's Affecting What" tool empowers user curiosity
5. **Proactive Pattern Alerts:** Real-time notifications vs. passive dashboards
6. **Cross-Domain Intelligence:** Nutrition-mood, sleep-performance connections competitors can't make

**Where We Match (Feature Parity):**
- Sleep tracking details (stages, HRV, quality scores)
- Trend analysis over multiple timeframes
- Data export capabilities
- Goal progress tracking

**Strategic Positioning:**
> "WHOOP and BEVEL show you YOUR data. yHealth shows you what your data MEANS - revealing connections between your body and mind that dedicated fitness apps will never see."

---

## TESTING STRATEGY

### Unit Testing
- Insight generation algorithms (correlation detection, priority scoring, novelty ranking)
- Harmony score calculations (weighted averages, component breakdowns)
- Correlation coefficient calculations (Pearson r, p-values, significance)
- Pattern detection logic (streaks, improvements, declines, anomalies)
- Export generation (CSV formatting, PDF rendering, data filtering)

### Integration Testing
- Cross-pillar data flow (fitness + nutrition + wellbeing → insights)
- Real-time dashboard updates when new data arrives
- Multi-channel analytics access (app, WhatsApp, voice)
- Export download link generation and expiration
- Alert notification delivery (push, WhatsApp, in-app)

### User Acceptance Testing
- Light vs. Deep mode experiences validate with personas
- Insight helpfulness and accuracy (user feedback surveys)
- "Aha moment" achievement within 7 days (track discovery rate)
- Dashboard usability (can users find and interpret analytics?)
- Export/share functionality (do files generate correctly? share cards look good?)

### Performance Testing
- Dashboard load time with 365 days of data (target: <3s)
- Concurrent insight generation for 1000+ users (daily batch processing)
- Trend chart rendering speed (90-day, 1-year data)
- Correlation calculation under load (concurrent explorer usage)
- Export generation for large datasets (1+ year of data)

### A/B Testing (Post-MVP)
- Insight headline phrasing (which drives more engagement?)
- Chart types (line vs. bar vs. area for different metrics)
- Notification timing (when do users engage most with alerts?)
- Harmony view design (triangle vs. radial vs. stacked bars)

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Insufficient data for insights** | High | High (new users) | Graceful degradation: show generic tips, communicate data requirements clearly, motivate logging |
| **Insight accuracy questioned** | Critical | Medium | Transparency: show data sources, correlation strength, confidence levels; user feedback loops |
| **Alert fatigue** | High | Medium | Intelligent prioritization, customizable frequency, feedback-driven tuning, easy opt-out |
| **Dashboard performance slow** | High | Medium | Caching strategy, pre-generation of common views, CDN for charts, optimize database queries |
| **Users don't understand analytics** | High | Medium | Onboarding education, tooltips, "Why this matters" explanations, simple language in Light Mode |
| **Export/share privacy concerns** | Critical | Low | Clear privacy controls, anonymization options, secure download links, GDPR/HIPAA compliance |
| **Cross-pillar correlations weak** | High | Low | Encourage multi-pillar logging early, demonstrate value through education, patience messaging |
| **Competitive feature gap** | Medium | Low | Continuous benchmarking vs. WHOOP/BEVEL, prioritize differentiators over parity features |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 10 features (F10.1-F10.10) as defined above

### Post-MVP v1.1 (+3 months)
- **AI Chat with Analytics:** Conversational analytics exploration ("Why did my recovery drop last week?")
- **Predictive Insights:** "Tomorrow you'll likely feel X based on patterns" (requires 60+ days data)
- **Social Leaderboards:** Compare anonymized stats with friends (opt-in)
- **Custom Dashboards:** Users can configure widget layout and priority metrics

### Post-MVP v1.2 (+6 months)
- **Advanced Correlations:** Non-linear relationships, multi-variable analysis (X + Y → Z)
- **Seasonal Patterns:** Year-over-year comparisons, seasonal trend detection
- **Benchmark Comparisons:** Compare to population averages (anonymized user base)
- **AI Coaching Integration:** Analytics trigger proactive coaching sessions

### Post-MVP v2.0 (+12 months)
- **Clinical Integrations:** Share analytics with healthcare providers (EHR integration)
- **Team Analytics:** Family/group dashboards (multi-user accounts)
- **Wearable Device Recommendations:** AI suggests best devices based on user needs
- **Health Score Predictions:** "Your health score in 30 days if you maintain current habits"

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After E8 (Cross-Domain Intelligence) completion to ensure analytics properly surfaces E8's outputs
**Update Triggers:** User feedback from beta testing, insight engagement metrics, dashboard performance data
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from Data Science (algorithms), Engineering (performance), Design (UX)

---

## APPENDIX A: USER FLOWS

### Flow 1: New User - First Insight Discovery (7-Day Journey)
1. **Day 1:** User completes onboarding, connects wearable, logs first meal and mood
2. **Day 2-6:** User logs consistently across 2+ pillars (fitness + wellbeing)
3. **Day 7:** Sufficient data accumulated, first real insight generated
4. **Insight Delivered:** "Your mood is 30% higher on days you sleep 7+ hours (5 of 7 days)"
5. **User Reaction:** "Aha moment" - didn't realize sleep affected mood so strongly
6. **Action Taken:** User prioritizes 7+ hours sleep that night
7. **Day 8:** Prediction validated - user feels great after good sleep, trusts AI coach

### Flow 2: Optimization Enthusiast - Deep Analytics Exploration (Deep Mode)
1. User opens app, navigates to Analytics Dashboard
2. Reviews Three-Pillar Harmony: Fitness 88, Nutrition 72, Wellbeing 80
3. Notices Nutrition is lowest pillar, taps for breakdown
4. Sees hydration is dragging score down (65/100 vs. meal quality 80, macros 75)
5. Navigates to Trend Analysis, views hydration over 30 days - declining trend
6. Opens "What's Affecting What" Explorer
7. Explores: Hydration vs. Workout Performance - finds moderate positive correlation (r=0.58)
8. Insight: "Better hydration = better workout performance. I should fix this."
9. Sets goal: "Drink 2.5L water daily"
10. Returns to dashboard daily to track hydration progress

### Flow 3: Busy Professional - Quick Morning Check-In (Light Mode)
1. User wakes up, opens yHealth app
2. Dashboard loads instantly (cached data)
3. Top of screen: "Physical Recovery: 85 🟢, Mental Recovery: 68 🟡 - Light activity today"
4. Swipes through 3 daily insights:
   - Insight 1: "7-day sleep streak! Averaging 7h 45min"
   - Insight 2: "Your steps are down 20% this week. Quick walk today?"
   - Insight 3: "Best workouts follow morning journaling. Try tomorrow?"
5. Taps "Mark Complete" on journaling goal (quick action)
6. Closes app - total time: 45 seconds
7. Feels informed and motivated for the day

### Flow 4: Pattern Alert - Intervention Scenario
1. **Day 1-3:** User's sleep quality declining (85 → 78 → 72)
2. **Day 4:** Pattern detected: 3 consecutive nights declining sleep
3. **Alert Triggered (8:00 AM):** "Sleep quality declining 3 nights in a row. Let's troubleshoot tonight's routine?"
4. User taps alert, opens detailed sleep analytics
5. Sees: Late dinners past 3 nights (8:30pm, 9:00pm, 8:45pm)
6. Correlation highlighted: "Your best sleep happens with dinner before 7pm"
7. **Action:** User plans earlier dinner tonight (6:30pm)
8. **Day 5:** Sleep quality rebounds to 84 - pattern intervention successful
9. User receives: "Great sleep last night! Earlier dinner helped (we noticed)."

---

## APPENDIX B: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Personalized Insight** | AI-generated discovery unique to user's data, revealing patterns/correlations/predictions not obvious from raw metrics |
| **Three-Pillar Harmony** | Visual representation of balance across Fitness, Nutrition, and Wellbeing pillars (0-100 scores each) |
| **Harmony Index** | Overall score averaging three pillar scores, with bonus for balance and penalty for extreme imbalances |
| **Correlation Coefficient (r)** | Statistical measure of relationship between two variables, ranging from -1.0 (perfect negative) to +1.0 (perfect positive) |
| **Pattern Recognition Alert** | Proactive notification triggered by AI when significant pattern detected (streak, improvement, decline, anomaly) |
| **Light Mode** | Simplified analytics view emphasizing quick insights and essential metrics for time-constrained users |
| **Deep Mode** | Comprehensive analytics view with detailed breakdowns, charts, and exploration tools for data enthusiasts |
| **Aha Moment** | User's first experience discovering unexpected health connection through yHealth insights |
| **Cross-Pillar Insight** | Discovery connecting metrics from 2+ pillars (e.g., sleep quality affects workout performance and mood) |
| **Comparative Analytics** | Period-over-period analysis (this week vs. last week, this month vs. last month) showing progress or regression |
| **Strain-Recovery Balance** | Ratio of weekly training load to weekly average recovery, optimal range ~3.0-4.5 for sustainable training |
| **Export Portability** | User's ability to download complete health data in machine-readable formats (CSV, JSON) per GDPR/HIPAA rights |

---

*yHealth Platform - E10: Analytics & Insights Dashboard PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 10 | All MVP Core (USP Emphasis)*
