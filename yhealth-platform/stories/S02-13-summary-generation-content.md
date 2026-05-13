---
type: story
id: S02.5.1
title: Summary Generation & Content
epic: E02
epic_name: Voice Coaching
feature: F2.5
feature_name: Post-Call Summary
product: yhealth-platform
priority: P0
status: Draft
created: 2025-12-07
---

# S02.5.1: Summary Generation & Content

## User Story

**As an** Optimization Enthusiast (P3),
**I want** an automatic summary of my coaching call generated immediately after we finish,
**So that** I can remember key insights and action items without having to take notes during the conversation.

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
- Summary auto-generated within 30 seconds of call ending
- No user action required
- Content tailored to session type and depth mode
- Action items clearly extracted and highlighted

**Summary Content - Light Mode:**
```
📞 Quick Check-In (5 min) - Dec 2, 8:15am

💡 Key Insight: Your recovery is strong (85) - great day for a tough workout!

✅ Action Items:
- Try the 30-min HIIT workout recommended today
- Log dinner before 7pm for better sleep

👉 View full summary in app
```

**Summary Content - Deep Mode:**
```
📞 Coaching Session (28 minutes)
December 2, 2025 - 8:00am - 8:28am

🎯 Session Goals:
Review weekly progress and plan upcoming week

📊 Pillars Discussed:
- Fitness: Sleep quality, recovery, workout consistency
- Wellbeing: Morning energy, stress levels

💡 Key Insights Discovered:
1. Sleep-Workout Connection
   "Your workout performance is 30% better following 7+ hours of sleep."

2. Morning Routine Impact
   "Days you journal before 9am correlate with higher afternoon energy."

✅ Action Items (This Week):
1. Sleep Goal Adjustment (PRIORITY)
   - New target: 7-7.5 hours/night
   - Deadline: Dec 9

2. Morning Journaling
   - Continue 5x/week streak

3. Stress Reduction
   - Try 10-min meditation 3x this week

😊 Emotional Summary:
You sounded energized about fitness progress but mentioned work stress.

🔗 AI Reasoning:
Sleep recommendation based on your 30-day sleep-performance correlation.

📄 Full Transcript Available
```

---

## Acceptance Criteria

```gherkin
Scenario: Auto-generation timing
  Given a voice call has ended
  When the call duration was >1 minute
  Then a summary is auto-generated within 30 seconds

Scenario: Quick Check-In summary
  Given the call was a Quick Check-In
  When the summary is generated
  Then it includes: call metadata, 1 key insight, 1-2 action items

Scenario: Coaching Session summary
  Given the call was a Coaching Session
  When the summary is generated
  Then it includes: full themes, detailed insights, action items with deadlines, emotional summary

Scenario: Very short call
  Given a very short call (<1 minute)
  When the call ends
  Then minimal or no summary generated: "Call was brief. No summary generated."

Scenario: No action items identified
  Given no clear action items were identified
  When the summary is generated
  Then it notes discussion topics only: "We talked about [topics]. No specific action items set."
```

---

## Success Metrics

- Summary Generation Speed: <30 seconds (95%)
- Summary Accuracy: 90% users agree it captures key points
- Action Item Extraction: 85% of action items correctly identified
- Summary Completeness: Matches session type requirements
- User Engagement: 75% of users view summary within 24 hours

---

## Constraints & Requirements

| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <30s generation | Summary encrypted | Stored per retention policy | Readable by screen readers | All platforms |
| Handles all session types | Access controlled | User can delete | Supports font scaling | |

---

## Dependencies

- **Prerequisite Stories:** S02.2.1 (provides transcript), S02.2.2 (context for insights), S02.3.1 (emotion for emotional summary)
- **Related Stories:** S02.5.2 (delivery), S02.4.x (session type determines content)
- **External Dependencies:** Claude/DeepSeek for summarization

---

## Edge Cases & Errors

| Scenario | Expected Behavior |
|----------|-------------------|
| Summary generation fails | Retry with simplified prompt, notify user of delay |
| Transcript quality poor | Generate best-effort summary, note gaps |
| Very long call (>45 min) | Extended summary with chapters/sections |
| Emergency session summary | Sensitive handling, focus on resources provided |
| Call dropped unexpectedly | Generate summary from available transcript |

---

## Open Questions

- Summary template customization options
- Transcript quality threshold for summary generation

---

## Definition of Done

- [ ] Acceptance criteria met
- [ ] <30s generation time achieved
- [ ] Light mode summary format working
- [ ] Deep mode summary format working
- [ ] Action item extraction working
- [ ] Session type-appropriate content
- [ ] Emotional summary included (Deep mode)
- [ ] Error handling for generation failures

---

*Story S02.5.1 | Epic E02 | Product: yHealth Platform*
