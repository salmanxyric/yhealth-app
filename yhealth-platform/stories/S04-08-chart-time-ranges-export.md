---
type: story
id: YH-S04.3.3
title: Chart Time Ranges & Export
epic: E04
epic_name: Mobile App
feature: F4.3
feature_name: Data Visualization
product: yhealth-platform
priority: P0
status: Draft
story_points: 5
created: 2025-12-09
---

# YH-S04.3.3: Chart Time Ranges & Export

## User Story

**As an** Optimization Enthusiast (P3),
**I want to** customize the time range of my charts and export them for my records,
**So that** I can analyze specific periods and share my progress.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)
- [ ] Could Have (P2)
- [ ] Won't Have (P3)

---

## Scope Description

**User Experience:**
Users can select different time ranges for chart views. Deep mode includes custom date ranges and export functionality. All charts include accessibility text summaries.

**Time Range Options:**
- **Light Mode:** Fixed 7-day view only
- **Deep Mode:** 7, 30, 90, 365 days + custom date range

**Time Range Selector:**
- Positioned above chart
- Segmented control for preset ranges (7/30/90/365)
- Custom picker for date range selection
- Chart updates on selection

**Export Functionality (Deep Mode):**
- Export chart as PNG image
- Include chart title, legend, timestamp
- Save to device gallery or share
- Export button visible on each chart

**Accessibility Text Summaries:**
- All charts include screen reader descriptions
- Format: "[Metric] [trend] [X] points from [Y] to [Z] over the last [period]"
- Example: "Fitness score decreased 5 points from 80 to 75 over the last 7 days"

**Behaviors:**
- Time range changes trigger chart re-render
- Export generates high-quality PNG
- Accessibility text announces on chart focus

---

## Acceptance Criteria

```gherkin
Scenario: Light Mode Fixed Range
  Given the user is in Light mode
  When viewing a chart
  Then only 7-day data is displayed with no time range selector

Scenario: Deep Mode Range Selector
  Given the user is in Deep mode
  When viewing a chart
  Then a time range selector displays with options: 7, 30, 90, 365 days, and Custom

Scenario: Range Selection
  Given the time range selector is displayed
  When the user selects a different range (e.g., 30 days)
  Then the chart re-renders with data for the selected period

Scenario: Custom Date Range
  Given the user selects "Custom" range
  When they choose start and end dates
  Then the chart displays data for that specific period

Scenario: Chart Export
  Given the user is in Deep mode viewing a chart
  When they tap the export button
  Then a PNG of the chart (with title, legend, timestamp) is generated and save/share options appear

Scenario: Accessibility Text
  Given any chart is rendered
  When a screen reader focuses on the chart
  Then an accessibility description is announced describing the trend and key values
```

---

## Success Metrics

- 30% of Deep mode users export charts monthly
- Time range changes per session >2 (Deep mode)
- Accessibility text coverage 100%

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Range switch <1s | Export local only | No PII in export | ARIA labels required | iOS + Android |
| Export <3s | No cloud upload | User-initiated only | Screen reader tested | Share sheet support |

---

## Dependencies

- **Prerequisite Stories:** YH-S04.3.1, YH-S04.3.2
- **Related Stories:** YH-S04.6.1 (Settings for preferences)
- **External Dependencies:** Device gallery permissions

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Custom range with no data | Show empty state: "No data available for selected period." |
| Export failure (storage permission) | Show prompt: "Unable to save chart. Check storage permissions?" |
| 365-day load slow | Show progress indicator, cancel option |
| Accessibility text for empty chart | "No data available for this chart." |

---

## Open Questions

- Should export include raw data (CSV) option?
- Should favorite time ranges be saveable?

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Time range selector working (Deep mode)
- [ ] Export to PNG functional
- [ ] Accessibility text implemented for all charts
- [ ] Storage permissions handled

---

*Story YH-S04.3.3 | Epic E04 | Product: yhealth-platform*
