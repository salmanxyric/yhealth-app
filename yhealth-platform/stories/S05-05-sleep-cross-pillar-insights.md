---
type: story
id: S05.2.2
title: Sleep Cross-Pillar Insights
epic: E05
feature: F5.2
product: yhealth-platform
priority: P0
status: Draft
---

# S05.2.2: Sleep Cross-Pillar Insights

## User Story
**As a** Holistic Health Seeker (P1),
**I want to** see how my sleep affects my workout performance and mood,
**So that** I can optimize my sleep routine for maximum health benefits across all areas of my life.

## Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

## Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

## Scope Description

**User Experience:**
This is where yHealth's "Better Together" integration strategy shines. While core sleep metrics match WHOOP/Oura, cross-pillar insights reveal connections that dedicated fitness apps cannot provide. Users discover how their sleep patterns affect and are affected by nutrition, mood, and exercise.

**Cross-Pillar Sleep Insights:**

| Connection | Example Insight |
|------------|-----------------|
| Sleep → Workout | "You perform 25% better in workouts after 7+ hours of sleep" |
| Sleep → Mood | "Your mood rating is 30% higher on days with quality sleep >80" |
| Sleep → Energy | "Low energy today correlates with <6 hours sleep last night" |
| Nutrition → Sleep | "Sleep quality drops 20% on days with >300mg caffeine after 2pm" |
| Exercise → Sleep | "Your best sleep happens when workouts complete before 6pm" |
| Journaling → Sleep | "Sleep quality improves 15% on nights you journal before bed" |

**Sleep Trends:**
- 7-day, 30-day, 90-day trend visualizations
- Sleep consistency score (how regular is sleep schedule)
- Week-over-week comparisons
- Pattern detection (e.g., worse sleep on weekends)

**Alerts for Poor Sleep Patterns:**
- 3+ consecutive nights with quality <50
- Sleep duration trending down over 7 days
- Irregular sleep schedule (>2h variance in bedtime)
- Poor sleep affecting next-day recovery

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | 1 featured sleep insight per day; simple trend indicator (improving/declining) |
| **Deep** | Multiple insights, detailed trend charts, correlation explorer, export data |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Insight Type | Enum | From insight categories | System |
| Correlation Strength | Float 0-1 | Calculated | System |
| Data Points Used | Integer | Min 7 for validity | System |
| Insight Displayed | Boolean | For engagement tracking | Aggregated |

**Behaviors:**
- Insights generate after minimum 7 days of sleep data
- Cross-pillar insights require data from multiple pillars (sleep + mood, sleep + nutrition)
- Insight relevance improves over time as more data collected
- Alerts trigger proactively when concerning patterns detected
- Sleep score integrated into holistic health score

## Acceptance Criteria

**AC1: Sleep Trend Display**
Given the user has 7+ days of sleep data,
When they view sleep trends,
Then 7/30/90-day trend charts with visual indicators display.

**AC2: Cross-Domain Insight Generation**
Given the user has sleep data AND data from another pillar (mood, nutrition, activity),
When correlation analysis runs,
Then relevant cross-pillar insights generate (e.g., "7+ hours sleep = better workout performance").

**AC3: Minimum Data Requirement**
Given the user has <7 days of sleep data,
When they view insights,
Then a message displays: "Keep logging to unlock personalized sleep insights!"

**AC4: Poor Sleep Pattern Alert**
Given the user has 3+ consecutive nights with sleep quality <50,
When the alert system checks patterns,
Then a proactive alert displays: "Your sleep quality has been low for 3 nights. Let's improve your rest."

**AC5: Holistic Score Integration**
Given sleep data is available,
When the holistic health score calculates,
Then sleep quality contributes to the Fitness pillar score.

**AC6: Light Mode Insight**
Given the user is in Light mode,
When viewing sleep section,
Then 1 featured insight displays with simple trend indicator.

**AC7: Deep Mode Correlation Explorer**
Given the user is in Deep mode,
When viewing sleep analytics,
Then multiple insights, detailed charts, and correlation explorer are available.

## Success Metrics
- 80% of users receive sleep correlation insights within 7 days
- 70% click/engage with sleep-related insights
- 60% of users improve sleep quality score by 10+ points in 30 days

## Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| Insight generation <5s | Correlation data encrypted | Cross-pillar data user-only | Plain language insights | iOS 14+, Android 10+ |
| Chart render <2s | No external sharing | Aggregated for analytics | Chart accessible labels | All screen sizes |

## Dependencies
- **Prerequisite Stories:** S05.2.1 (Sleep Core Metrics)
- **Related Stories:** S05.3.1 (Recovery uses sleep)
- **External Dependencies:** E7 (Wellbeing - mood, stress data), E6 (Nutrition - meal timing, caffeine), E8 (Cross-Domain Intelligence engine)

## Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Only sleep data (no other pillars) | Show sleep-only trends; encourage logging in other pillars |
| Conflicting insights | Show strongest correlation first; note "multiple factors may contribute" |
| Correlation below significance threshold | Don't display insight; require minimum correlation strength |
| User ignores alerts repeatedly | Reduce frequency, don't spam; mark as "acknowledged" |
| Insufficient data for trend (sporadic logging) | Show available data with caveat: "Trends improve with consistent tracking" |

## Open Questions
- What minimum correlation strength makes an insight worth showing?
- Should we allow users to dismiss insights permanently?

## Definition of Done
- [ ] Acceptance criteria met
- [ ] 7/30/90-day trend charts functional
- [ ] Cross-pillar insights generating
- [ ] Alert system detecting poor patterns
- [ ] Light and Deep modes render correctly
- [ ] Integration with E7, E6, E8 verified
