---
type: story
id: S06.3.2
title: Smart Hydration Reminders & Score
epic: E06
feature: F6.3
product: yhealth-platform
priority: P0
status: Draft
---

# Smart Hydration Reminders & Score

### User Story
**As an** Optimization Enthusiast (P3),
**I want to** receive intelligent hydration reminders and see a hydration score,
**So that** I can optimize my water intake timing and understand my hydration quality.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users receive smart reminders that adapt to their activity levels and learn their drinking patterns. Deep mode users see a hydration score that goes beyond volume to measure timing and consistency.

**Smart Reminder Types:**
| Reminder | Trigger | Message Example |
|----------|---------|-----------------|
| Morning | Wake time (from E5 sleep data) | "Good morning! Start your day with water." |
| Pre-Workout | 30 min before scheduled workout | "Hydrate before your workout in 30 minutes." |
| Post-Workout | After workout detected | "Great session! Drink 500ml to recover." |
| Afternoon Slump | Low energy detected (from E7) | "Low energy? You might be dehydrated." |
| Gap Detection | 3+ hours since last log | "It's been a while. Time for water?" |
| Evening Cutoff | 2 hours before sleep time | "Last call for hydration before bed." |

**Reminder Intelligence:**
- Learn user's typical drinking times
- Reduce frequency if user consistently hydrates
- Increase frequency on high-activity days
- Pause during meals (don't interrupt meal logging)
- Respect quiet hours (default: 10pm - 7am)

**Hydration Score (Deep Mode):**
Score calculation (0-100):
| Component | Points | Criteria |
|-----------|--------|----------|
| Daily Goal Achievement | 50 | 100% of goal = 50 pts, proportional below |
| Consistency | 25 | Even distribution throughout day |
| Pre/Post-Workout | 15 | Proper workout hydration timing |
| Morning Hydration | 10 | 500ml before 10am |

**Score Color Coding:**
- 90-100: Excellent (dark blue)
- 70-89: Good (light blue)
- 50-69: Fair (yellow)
- <50: Poor (red)

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Reminder Type | Enum | From trigger | System |
| Reminder Time | ISO 8601 | Calculated | System |
| User Response | Enum | dismissed/logged/snoozed | System |
| Hydration Score | Integer | 0-100, calculated daily | User-only |
| Score Breakdown | Object | Components and points | User-only |

**Behaviors:**
- Reminders respect user notification preferences
- "Do Not Disturb" during quiet hours
- Adaptive timing based on user patterns
- Score updates in real-time with each log
- Weekly score trends available in Deep mode

### Acceptance Criteria

**AC1: Morning Reminder**
Given a user has enabled reminders and wake time is detected,
When the user wakes up,
Then a morning hydration reminder is sent within 30 minutes.

**AC2: Pre-Workout Reminder**
Given a user has a workout scheduled (from E5) in 30 minutes,
When the reminder time is reached,
Then a pre-workout hydration reminder is sent.

**AC3: Gap Detection Reminder**
Given a user hasn't logged hydration for 3+ hours during active hours,
When the gap is detected,
Then a gentle reminder is sent: "It's been a while. Time for water?"

**AC4: Quiet Hours Respect**
Given it's within quiet hours (default 10pm-7am),
When a reminder would normally trigger,
Then the reminder is suppressed until quiet hours end.

**AC5: Reminder Fatigue Prevention**
Given a user has dismissed 5+ reminders in a row,
When the next reminder would trigger,
Then frequency is reduced and user is asked: "Too many reminders? Adjust settings here."

**AC6: Hydration Score Calculation**
Given a user is in Deep mode and has logged hydration today,
When viewing the hydration section,
Then a score (0-100) is displayed with component breakdown.

**AC7: Score Real-Time Update**
Given a user logs hydration,
When the log is complete,
Then the hydration score updates within 2 seconds to reflect the new log.

**AC8: Cross-Pillar Integration**
Given activity data is available from E5 and energy data from E7,
When calculating reminders,
Then workout times and low-energy periods are factored into reminder timing.

### Success Metrics
- Reminder effectiveness: 60% of users log water within 30 min of reminder
- Reminder satisfaction: <10% disable reminders (indicates good timing)
- Score engagement: 50% of Deep mode users view score daily
- Cross-pillar discovery: 80% receive hydration-performance/energy insights within 30 days

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <1s score calculation | Notification auth | Reminder patterns private | Notification accessibility | iOS 14+, Android 10+ |
| Adaptive timing | No external notification | No third-party sharing | Haptic feedback option | E5, E7 integration |

### Dependencies
- **Prerequisite Stories:** S06.3.1
- **Related Stories:** S06.2.1, S06.5.1
- **External Dependencies:** E5 (Fitness - workout times, activity), E7 (Wellbeing - energy levels, sleep)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No workout data from E5 | Skip workout-based reminders, use time-based only |
| User in different timezone | Adjust all reminders to local time |
| System notification permission denied | Show in-app prompts only, guide to enable notifications |
| User hasn't logged in days | Gentle re-engagement: "We miss you! How's your hydration?" |
| Score components missing data | Calculate with available data, note incomplete in breakdown |
| Very irregular schedule | Adapt reminder times weekly based on actual patterns |

### Open Questions
- Should score be visible in Light mode as simplified indicator?
- How many reminders per day maximum?
- Should reminders include motivational messages or be purely informational?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All reminder types implemented
- [ ] Quiet hours respected
- [ ] Adaptive reminder timing working
- [ ] Reminder fatigue prevention active
- [ ] Hydration score calculation accurate
- [ ] Cross-pillar integration with E5/E7 verified