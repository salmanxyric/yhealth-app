---
type: story
id: S06.3.1
title: Hydration Logging & Progress Tracking
epic: E06
feature: F6.3
product: yhealth-platform
priority: P0
status: Draft
---

# Hydration Logging & Progress Tracking

### User Story
**As a** Busy Professional (P2),
**I want to** quickly log water intake with one tap,
**So that** I can track hydration without interrupting my workflow.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
Users track daily water intake through quick one-tap logging with preset volumes. Progress visualization shows how close they are to their daily goal. Multiple logging methods support different contexts.

**Quick Logging Methods:**
- **One-Tap Presets:** Small glass (250ml), Large glass (500ml), Bottle (750ml)
- **Custom Entry:** Manual ml/oz input for precise tracking
- **WhatsApp:** "Logged 500ml" or photo of water bottle
- **Voice:** "I drank a bottle of water"

**Beverage Types (Deep Mode):**
| Beverage | Hydration Multiplier | Notes |
|----------|---------------------|-------|
| Water | 1.0x | Default, fully counts |
| Herbal Tea | 1.0x | No caffeine |
| Coffee | 0.7x | Diuretic effect |
| Black Tea | 0.7x | Caffeine content |
| Sports Drink | 1.1x | Electrolyte bonus |
| Other | 1.0x | Custom beverages |

**Daily Goal Calculation:**
- Baseline: 30-35ml per kg body weight
- Activity adjustment: +500-1000ml for high-intensity workouts (from E5)
- Caffeine adjustment: +200ml per cup of coffee/tea logged

**Example:** 70kg user, moderate activity = ~2,500ml (2.5L) base target

**Progress Visualization:**

| Mode | Display |
|------|---------|
| **Light** | Simple progress bar: "1,500 / 2,500 ml (60%)" with color coding |
| **Deep** | Wave animation showing water level rising, hourly distribution chart, beverage breakdown pie chart |

**Data Captured:**
| Field | Format | Validation | Privacy |
|-------|--------|------------|---------|
| Volume | Integer (ml) | 1-5000ml per entry | User-only |
| Beverage Type | Enum | water/coffee/tea/sports/other | User-only |
| Timestamp | ISO 8601 | Auto-captured | User-only |
| Log Method | Enum | tap/manual/whatsapp/voice | System |

**Behaviors:**
- One-tap logging takes <2 seconds
- Progress updates immediately after logging
- Daily goal resets at midnight (user timezone)
- Historical data available for trend analysis
- Syncs across all channels

### Acceptance Criteria

**AC1: One-Tap Logging Speed**
Given a user taps a preset volume button (250ml/500ml/750ml),
When the tap is registered,
Then the hydration is logged and progress updated within 2 seconds.

**AC2: Progress Bar Display**
Given a user has logged hydration today,
When viewing the hydration tracker,
Then a progress bar shows current intake vs. daily goal with percentage.

**AC3: Daily Goal Calculation**
Given a user has entered their weight,
When the daily goal is calculated,
Then it equals 30-35ml per kg body weight, adjusted for activity level.

**AC4: Custom Volume Entry**
Given a user wants to log a non-preset amount,
When they tap "Custom",
Then they can enter exact ml/oz and log.

**AC5: Beverage Type Selection (Deep Mode)**
Given a user is in Deep mode,
When logging a beverage,
Then they can select beverage type (water, coffee, tea, etc.) with appropriate hydration multiplier applied.

**AC6: WhatsApp Logging**
Given a user sends "Logged 500ml" or "drank a glass of water" via WhatsApp,
When the message is processed,
Then hydration is logged and confirmation sent.

**AC7: Voice Logging**
Given a user says "I drank a bottle of water" during Voice Coaching,
When the AI processes the input,
Then 750ml is logged and confirmed verbally.

**AC8: Cross-Channel Sync**
Given a user logs hydration via WhatsApp,
When viewing the Mobile App,
Then the log appears with full details within 5 minutes.

### Success Metrics
- One-tap logging: 90% complete in <2 seconds
- Daily goal achievement: 70% of users hit target 5+ days/week
- Logging frequency: Average 5+ logs per day
- Multi-channel usage: 40% use 2+ logging methods

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s one-tap logging | Data encrypted | Hydration data private | Large tap targets | iOS 14+, Android 10+ |
| Real-time sync | Session auth | No external sharing | Voice input option | All channels (E2, E3) |

### Dependencies
- **Prerequisite Stories:** S06.0.1
- **Related Stories:** S06.3.2, S06.2.1
- **External Dependencies:** E2 (Voice Coaching), E3 (WhatsApp), E5 (Activity data for goal adjustment)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| Unrealistic volume (>2000ml single entry) | Confirm: "Did you mean 2000ml? That's a lot for one drink!" |
| Negative total (too many undos) | Reset to 0, preserve history, show "Hydration reset" |
| Missing weight for goal calculation | Use default 2000ml, prompt to add weight for personalization |
| Midnight timezone edge case | Use user's set timezone, handle DST gracefully |
| Rapid repeated taps | Debounce, log once per 500ms minimum |
| Offline logging | Queue locally, sync when connected |

### Open Questions
- Should we track caffeine separately from hydration?
- Should hydration integrate with meal logging (drink with meal)?
- What's the undo window for accidental logs?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] One-tap presets functional (<2s)
- [ ] Custom entry working
- [ ] Daily goal calculated correctly
- [ ] Progress visualization accurate
- [ ] WhatsApp and Voice logging working
- [ ] Cross-channel sync verified