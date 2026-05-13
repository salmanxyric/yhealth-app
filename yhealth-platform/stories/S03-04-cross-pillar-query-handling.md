---
type: story
id: S03.2.2
title: Cross-Pillar Query Handling
epic: E03
epic_name: WhatsApp Integration
feature: F3.2
feature_name: Text-Based Coaching
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-08
---

# S03.2.2: Cross-Pillar Query Handling

## User Story

**As an** Optimization Enthusiast (P3),
**I want** my AI coach to answer questions that span fitness, nutrition, and wellbeing together,
**So that** I understand how different aspects of my health connect and affect each other.

---

## Story Type

- [x] Feature
- [ ] Enhancement
- [ ] Technical
- [ ] Integration

## Priority

- [x] Must Have (P0)
- [ ] Should Have (P1)

---

## Scope Description

**User Experience:**
- User asks questions that require data from multiple pillars
- AI synthesizes information from Fitness (E5), Nutrition (E6), and Wellbeing (E7)
- Cross-domain insights delivered conversationally
- Pattern correlations explained in natural language

**Cross-Pillar Query Examples:**
| User Question | Pillars Involved | Response Type |
|---------------|------------------|---------------|
| "Why am I so tired?" | Fitness + Nutrition + Wellbeing | Multi-factor analysis |
| "What's affecting my sleep?" | Fitness + Nutrition + Wellbeing | Correlation insights |
| "Why did I sleep poorly last night?" | Fitness (recovery) + Nutrition (late meal) + Wellbeing (stress) | Specific event analysis |
| "What's my best pre-workout meal?" | Fitness + Nutrition | Pattern-based recommendation |
| "When am I most productive?" | Fitness (energy) + Wellbeing (mood) | Trend analysis |

**Light Mode:**
- Concise multi-pillar answer
- "Your tiredness is likely from poor sleep (5h) and skipping breakfast. Try sleeping 7h and eating before 9am."

**Deep Mode:**
- Detailed analysis with data
- "Let me break this down: Your sleep has averaged 5.5h this week (vs your 7h goal). On days you skip breakfast, your energy dips 30% more at 2pm. Your stress was elevated Tuesday-Thursday (7/10 avg). These factors compound - poor sleep increases stress, which makes you skip meals."

**Data Integration:**
- Fitness (E5): Activity, recovery scores, sleep metrics
- Nutrition (E6): Meal timing, calorie intake, hydration
- Wellbeing (E7): Mood, stress, energy, journal entries
- Cross-Domain (E8): Pre-computed correlations and insights

**Response Approach:**
1. Identify pillars relevant to question
2. Query data from each pillar
3. Apply cross-domain intelligence (E8)
4. Synthesize natural language response
5. Offer actionable recommendation

---

## Acceptance Criteria

```gherkin
Scenario: Multi-pillar tiredness query
  Given a user asks "Why am I tired?"
  When AI processes the cross-pillar query
  Then the response includes relevant factors from fitness, nutrition, and wellbeing

Scenario: Multiple contributing factors
  Given a user asks about sleep quality
  When multiple factors are identified
  Then each contributing factor is explained with its relative impact

Scenario: Cross-pillar recommendation
  Given a user asks for a recommendation
  When the recommendation spans pillars
  Then specific actions for each pillar are provided

Scenario: Cross-domain insights
  Given cross-domain insights exist
  When relevant to the user's question
  Then insights are incorporated into the response

Scenario: Missing pillar data
  Given insufficient data in one pillar
  When that pillar is relevant to the question
  Then AI acknowledges the gap: "I don't have enough nutrition data yet to fully answer this."
```

---

## Success Metrics

- Cross-Pillar Query Satisfaction: 4.5/5 helpfulness
- Insight Accuracy: 85% alignment with user perception
- Action Completion: 50% of users act on cross-pillar recommendations

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <5s response | Data isolated per user | Cross-pillar within user only | Plain language explanations | All WhatsApp clients |

---

## Dependencies

- **Prerequisite Stories:** S03.2.1 (coaching engine)
- **Related Stories:** S03.5.1 (proactive insights)
- **External Dependencies:** E8 (Cross-Domain Intelligence)
- **Cross-Epic:** E5, E6, E7 (pillar data), E8 (correlations)

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Missing data in one pillar | Acknowledge gap, answer with available data |
| Conflicting data between pillars | Present both perspectives, suggest investigation |
| Question too broad | Ask clarifying question to narrow scope |
| No cross-domain patterns found | Fall back to single-pillar response |

---

## Open Questions

- Minimum data threshold per pillar for cross-domain analysis

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Cross-pillar queries routed correctly
- [ ] Data from all three pillars accessible
- [ ] E8 cross-domain insights integrated
- [ ] Light/Deep response modes working
- [ ] Data gap handling graceful
- [ ] Response quality verified

---

*Story S03.2.2 | Epic E03 | Product: yHealth Platform*
