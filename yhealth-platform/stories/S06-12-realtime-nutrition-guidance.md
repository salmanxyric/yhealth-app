---
type: story
id: S06.5.1
title: Real-Time Nutrition Guidance
epic: E06
feature: F6.5
product: yhealth-platform
priority: P0
status: Draft
---

# Real-Time Nutrition Guidance

### User Story
**As a** Busy Professional (P2),
**I want to** receive contextual nutrition guidance throughout the day,
**So that** I can make better food choices without constantly checking my targets.

### Story Type
- [x] Feature | [ ] Enhancement | [ ] Technical | [ ] Integration

### Priority
- [x] Must Have (P0) | [ ] Should Have (P1) | [ ] Could Have (P2) | [ ] Won't Have (P3)

### Scope Description

**User Experience:**
The AI provides proactive, contextual nutrition prompts at key moments - before meals, after logging, when approaching targets. Guidance is timely, helpful, and never judgmental.

**Contextual Prompt Types:**

| Timing | Example Prompt |
|--------|----------------|
| **Pre-Meal** | "Planning lunch? You have 650 kcal and 35g protein left for the day." |
| **Post-Meal** | "Great choice! That salmon hit your protein target for dinner." |
| **Macro Shortfall** | "You're low on fiber today. Add veggies to your evening snack?" |
| **Macro Excess** | "You've hit your calorie target. Dinner should be light tonight." |
| **Approaching Target** | "Just 15g protein to go! Greek yogurt or chicken would do it." |
| **Achievement** | "You hit your protein target 5 days this week. Nice consistency!" |

**Meal Optimization Suggestions:**
- "Your usual breakfast has 45g carbs. Want a lower-carb option for better energy?"
- "You're eating late (9pm). Earlier dinners improve your sleep quality." (Cross-pillar)
- "No protein logged yet today. Start with eggs or Greek yogurt?"
- "Post-workout window! High-protein snack would help recovery." (Cross-pillar)

**Guidance Delivery Channels:**
- **Mobile App:** In-app cards and contextual tips on dashboard
- **WhatsApp:** Proactive messages at key times
- **Voice Coaching:** Verbal guidance during sessions
- **Push Notifications:** Important prompts (configurable)

**Flexibility Modes:**

| Mode | Experience |
|------|------------|
| **Light** | Brief daily nudges (1-2 per day). Simple suggestions. No detailed explanations. |
| **Deep** | Detailed guidance with explanations. Multiple prompts daily. Full macro context provided. |

**AI Tone:**
- Non-judgmental: Never shame for "bad" choices
- Encouraging: Celebrate progress, no matter how small
- Practical: Specific, actionable suggestions
- Adaptive: Learn user's preference for formal vs. casual

**Data Used for Guidance:**
| Source | How Used |
|--------|----------|
| Today's logged meals | Calculate remaining macros |
| Goals (S06.4.1) | Target comparison |
| Time of day | Meal timing appropriateness |
| Fitness data (E5) | Post-workout recommendations |
| Historical patterns | Personalized suggestions |

### Acceptance Criteria

**AC1: Pre-Meal Guidance**
Given it's approaching a typical meal time and user hasn't logged that meal,
When the guidance engine evaluates context,
Then a pre-meal prompt is delivered: "Planning lunch? You have X kcal and Yg protein left."

**AC2: Post-Meal Acknowledgment**
Given a user logs a meal that contributes significantly to their targets,
When the log is complete,
Then positive acknowledgment is shown: "Great choice! That [food] helped with your [macro] goal."

**AC3: Macro Shortfall Alert**
Given a user is significantly behind on a macro with few meals remaining,
When the guidance engine evaluates end-of-day proximity,
Then a suggestion is made: "You're low on [macro] today. Try [specific food suggestion]?"

**AC4: Over-Target Warning**
Given a user has exceeded their calorie target,
When the next meal timing approaches,
Then gentle guidance is provided: "You've hit your calorie target. Light dinner tonight?"

**AC5: Multi-Channel Delivery**
Given guidance is generated,
When determining delivery channel,
Then it's sent via the user's preferred channel (App/WhatsApp) respecting notification preferences.

**AC6: Non-Judgmental Tone**
Given a user logs a high-calorie meal,
When post-meal guidance is generated,
Then the tone is supportive, not shaming: "Big meal! Tomorrow's a fresh start."

**AC7: Cross-Pillar Integration**
Given workout data is available from E5,
When the user completes a workout,
Then nutrition guidance references it: "Great workout! Time for protein to help recovery."

**AC8: Light Mode Frequency**
Given a user is in Light mode,
When guidance is generated,
Then maximum 2 prompts per day are delivered.

### Success Metrics
- Guidance engagement: 70% of users interact with guidance weekly
- Suggestion action rate: 40% act on recommendation within 2 hours
- User satisfaction: 4.5/5 for guidance helpfulness
- Macro adherence improvement: 15% better target achievement with guidance

### Constraints & Requirements
| Performance | Security | Privacy | Accessibility | Compatibility |
|-------------|----------|---------|---------------|---------------|
| <2s guidance generation | Session auth | Guidance private | Screen reader support | iOS 14+, Android 10+ |
| Respect notification prefs | No external sharing | No tracking sold | Clear, simple language | Multi-channel (E2, E3, E4) |

### Dependencies
- **Prerequisite Stories:** S06.2.1, S06.2.2, S06.4.1
- **Related Stories:** S06.5.2, S06.5.3
- **External Dependencies:** E5 (Fitness - workout data), E4 (Mobile App), E3 (WhatsApp), E2 (Voice)

### Edge Cases & Errors
| Scenario | Expected Behavior |
|----------|-------------------|
| No meals logged all day | Gentle prompt, not aggressive: "Haven't logged today. Need help getting started?" |
| User disables all notifications | In-app only guidance, respect preferences |
| Conflicting guidance (yesterday vs today) | Clarify context: "Yesterday I suggested X, but today's a rest day so Y." |
| User in different timezone | Use local time for meal timing guidance |
| Extreme deviation (200% calories) | Supportive, not alarming: "Big day! No judgment - life happens." |

### Open Questions
- Should guidance include specific food brand suggestions?
- How to handle guidance during travel/vacation?
- Should we offer "guidance-free" days?

### Definition of Done
- [ ] Acceptance criteria met
- [ ] All prompt types implemented
- [ ] Multi-channel delivery working
- [ ] Light/Deep mode frequency respected
- [ ] Non-judgmental tone verified
- [ ] Cross-pillar integration with E5