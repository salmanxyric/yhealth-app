# yHealth Platform - Product Requirements Document (PRD)

## 1. EXECUTIVE SUMMARY

### Product Definition
yHealth is a **Comprehensive AI Health Coach** that unifies three equal pillars - **Physical Fitness, Nutrition, and Daily Wellbeing** - into a single intelligent platform. It serves as a "Second Mind" that delivers unimaginable insights by connecting the complete health ecosystem through multiple interaction channels.

### Core Value Proposition
> *"The AI health companion that knows you better than you know yourself - delivering insights impossible to discover alone by connecting everything about your health."*

### Key Differentiators
1. **Three Equal Pillars** - Fitness, Nutrition, and Wellbeing treated with equal importance
2. **Multi-Modal Interaction** - Voice calls, WhatsApp, and Mobile App unified experience
3. **User-Adaptive Flexibility** - Every feature scales from light touch to deep engagement
4. **Cross-Domain Intelligence** - AI reveals connections between pillars humans can't see
5. **"Second Mind" Coaching** - Proactive, emotionally intelligent AI companion

### MVP Scope (This Document)
- Single-user experience (no family/gamification features)
- Full AI Coach vision with emotional intelligence
- 10 wearable/API integrations
- All three interaction channels equally detailed

---

## 2. PRODUCT VISION & SUCCESS METRICS

### Vision Statement
*"By 2030, yHealth will be the invisible yet indispensable second mind for millions of people worldwide - the AI companion they didn't know they needed but can no longer imagine living without."*

### Mission
Create the ultimate AI health companion that helps every individual become the best version of themselves through unimaginable insights derived from the seamless integration of their complete health ecosystem.

### Primary Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Transformation** | 80% report health improvements in 6 months | Quarterly health assessments |
| **Daily Engagement** | 90% DAU among premium subscribers | Analytics dashboard |
| **Multi-Channel Usage** | 80% use 2+ interaction channels | Cross-platform tracking |
| **Insight Quality** | 4.6/5 rating for AI insights | In-app surveys |
| **Habit Formation** | 75% build 2+ sustainable habits in 90 days | Habit tracking system |
| **Cross-Domain Discovery** | 90% discover pillar connections | Insight engagement metrics |
| **Premium Conversion** | 30% free-to-premium | Subscription analytics |
| **Retention (M6)** | 70% active at 6 months | Cohort analysis |

---

## 3. CORE DESIGN PRINCIPLE: USER-ADAPTIVE FLEXIBILITY

### Philosophy
Every user is different. Some want quick check-ins, others want deep exploration. yHealth adapts to each user's preferred engagement depth across ALL features.

### Flexibility Spectrum

```
LIGHT MODE ◄─────────────────────────────► DEEP MODE

Quick check-ins (30 sec)          Detailed journaling (10+ min)
Emoji mood logging                Rich narrative entries
Summary insights                  Granular analytics
Brief coaching nudges             Extended coaching sessions
Essential notifications           Comprehensive guidance
```

### Application Across Features

| Feature Area | Light Mode | Deep Mode |
|-------------|------------|-----------|
| **Onboarding** | 3-5 min questionnaire | 10-15 min AI conversation |
| **Daily Check-ins** | Emoji + energy rating | Full journaling + reflection |
| **Coaching Calls** | 5 min quick check | 20-30 min deep session |
| **Insights** | Key highlights only | Detailed correlation analysis |
| **Goal Tracking** | Simple progress bar | Comprehensive metrics dashboard |
| **Meal Logging** | Photo + AI estimate | Full macro/calorie breakdown |

### User Preference Controls
- Users set default mode during onboarding
- Can switch modes per interaction
- AI learns and adapts to preferences over time
- No judgment - light mode is valid long-term choice

---

## 4. USER PERSONAS

### Primary Personas (MVP Focus)

#### P1: The Holistic Health Seeker (40% of users)
**Profile:** 28-45, recognizes mind-body connection, interested in self-improvement
**Behavior:** Tracks physical metrics but struggles with consistent wellbeing habits
**Pain Points:** Inconsistent daily routines, can't connect mood to health, wants integration
**Flexibility Preference:** Mixed - deep for insights, light for daily logging
**Success Story:** *"My AI coach helped me realize my Sunday low energy was affecting Monday workouts. Now I have a journaling routine that improved both my mood patterns and fitness consistency."*

#### P2: The Busy Professional (25% of users)
**Profile:** 30-50, high-stress career, wants work-life balance
**Behavior:** Sporadic health efforts, knows lifestyle affects wellbeing
**Pain Points:** Time-constrained, inconsistent routines, work stress
**Flexibility Preference:** Light mode primary - values efficiency
**Success Story:** *"2-minute daily check-ins keep my health habits consistent even during crazy work weeks. I've learned which practices boost my energy without time investment."*

#### P3: The Optimization Enthusiast (20% of users)
**Profile:** 25-40, self-improvement focused, enjoys tracking, fitness enthusiast
**Behavior:** Active in fitness and personal development, wants deeper insights
**Pain Points:** Data overload without actionable synthesis, wants optimization
**Flexibility Preference:** Deep mode - loves detailed analytics
**Success Story:** *"I discovered my workout timing directly impacts productivity. My coach helped me optimize my entire routine for peak performance."*

### Secondary Personas

#### P4: The Habit Formation Seeker (10% of users)
**Profile:** 25-55, struggles with consistency, wants sustainable routines
**Flexibility Preference:** Light mode with gentle progression to deeper engagement
**Key Need:** Non-judgmental accountability, celebrates small wins

#### P5: The Gentle Wellness Builder (5% of users)
**Profile:** 30-60, prefers gentle approach, values emotional support
**Flexibility Preference:** Always light mode, gradual confidence building
**Key Need:** Compassionate, never overwhelming guidance

---

## 5. EPIC OVERVIEW MAP

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         yHealth Platform                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    E1: ONBOARDING & ASSESSMENT                    │   │
│  │         Account Creation | Flexible Assessment | Plan Gen         │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         ▼                          ▼                          ▼         │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐   │
│  │ E2: VOICE    │          │ E3: WHATSAPP │          │ E4: MOBILE   │   │
│  │   COACHING   │◄────────►│ INTEGRATION  │◄────────►│    APP       │   │
│  │              │          │              │          │              │   │
│  │ AI Calls     │          │ 24/7 Chat    │          │ Dashboard    │   │
│  │ Scheduled    │          │ Quick Logs   │          │ Visualize    │   │
│  │ On-Demand    │          │ Photo Check  │          │ Journal Hub  │   │
│  │ Check-ins    │          │ Voice Msgs   │          │ Goals        │   │
│  └──────────────┘          └──────────────┘          └──────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │                    THREE EQUAL PILLARS                            │   │
│  ├──────────────────┬──────────────────┬─────────────────────────────┤   │
│  │  E5: FITNESS     │  E6: NUTRITION   │  E7: WELLBEING              │   │
│  │                  │                  │                              │   │
│  │  Activity        │  Meal Logging    │  Mood Check-ins             │   │
│  │  Sleep           │  Calories/Macros │  Journaling                 │   │
│  │  Recovery        │  Hydration       │  Habits                     │   │
│  │  Goals           │  AI Coaching     │  Energy Tracking            │   │
│  └──────────────────┴──────────────────┴─────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │              E8: CROSS-DOMAIN INTELLIGENCE                        │   │
│  │                                                                    │   │
│  │  Mood-Performance | Nutrition-Energy | Sleep-Wellbeing            │   │
│  │  Holistic Score | Predictive Insights | "Unimaginable" Engine     │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │                   E9: DATA INTEGRATIONS                           │   │
│  │                                                                    │   │
│  │  WHOOP | Apple Health | Google Fit | Fitbit | Garmin              │   │
│  │  Oura | Samsung | Strava | Nutritionix | Sleep Tracking           │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│  ┌─────────────────────────────────┴─────────────────────────────────┐   │
│  │         E10: ANALYTICS & INSIGHTS DASHBOARD (CORE USP)            │   │
│  │                                                                    │   │
│  │  Personalized Insight Feed | Three-Pillar Harmony View            │   │
│  │  "What's Affecting What" Explorer | Proactive Pattern Alerts      │   │
│  │  Readiness/Strain/Sleep/Nutrition Scores | Trend Visualization    │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Epic Summary Table

| Epic | Name | Features | MVP Status | Sub-Document |
|------|------|----------|------------|--------------|
| **E1** | Onboarding & Assessment | 6 | Core | [PRD-Epic-01](prd-epics/PRD-Epic-01-Onboarding-Assessment.md) |
| **E2** | Voice Coaching | 6 | Core | [PRD-Epic-02](prd-epics/PRD-Epic-02-Voice-Coaching.md) |
| **E3** | WhatsApp Integration | 7 | Core | [PRD-Epic-03](prd-epics/PRD-Epic-03-WhatsApp-Integration.md) |
| **E4** | Mobile App | 7 | Core | [PRD-Epic-04](prd-epics/PRD-Epic-04-Mobile-App.md) |
| **E5** | Fitness Pillar | 6 | Core | [PRD-Epic-05](prd-epics/PRD-Epic-05-Fitness-Pillar.md) |
| **E6** | Nutrition Pillar | 6 | Core | [PRD-Epic-06](prd-epics/PRD-Epic-06-Nutrition-Pillar.md) |
| **E7** | Wellbeing Pillar | 7 | Core | [PRD-Epic-07](prd-epics/PRD-Epic-07-Wellbeing-Pillar.md) |
| **E8** | Cross-Domain Intelligence | 8 | Core (USP) | [PRD-Epic-08](prd-epics/PRD-Epic-08-Cross-Domain-Intelligence.md) |
| **E9** | Data Integrations | 10 | Core | [PRD-Epic-09](prd-epics/PRD-Epic-09-Data-Integrations.md) |
| **E10** | Analytics & Insights Dashboard | 20 | Core (USP) | [PRD-Epic-10](prd-epics/PRD-Epic-10-Analytics-Dashboard.md) |
| | **TOTAL** | **~79 Features** | | |

---

## 6. MVP VS FUTURE SCOPE MATRIX

### MVP Scope (This Release)

| Category | Included | Excluded |
|----------|----------|----------|
| **Users** | Single-user accounts | Family plans, teams |
| **Channels** | Voice + WhatsApp + Mobile | Web dashboard, Alexa/Google |
| **AI** | Full emotional intelligence | Custom AI personalities |
| **Pillars** | All three equally | Specialized clinical features |
| **Integrations** | 10 primary sources | 300+ via Terra API |
| **Social** | None | Groups, challenges, leaderboards |
| **Gamification** | None | Badges, points, streaks |
| **Payments** | Premium subscription | Family plans, enterprise |

### Future Roadmap (Post-MVP)

| Phase | Features | Timeline |
|-------|----------|----------|
| **v1.1** | Family plans (up to 6), gamification basics | +3 months |
| **v1.2** | Terra API (300+ wearables), group challenges | +6 months |
| **v1.5** | Web dashboard, enterprise plans | +9 months |
| **v2.0** | AI personality customization, clinical integrations | +12 months |

---

## 7. SUCCESS CRITERIA CHECKLIST

### Launch Readiness Criteria

#### E1: Onboarding & Assessment
- [ ] Quick path completes in <5 minutes
- [ ] Deep path completes in 10-15 minutes with natural flow
- [ ] Personalized plan generates within 30 seconds
- [ ] 85% onboarding completion rate achieved
- [ ] Preference selection covers all flexibility options

#### E2: Voice Coaching
- [ ] <2 second response latency in conversations
- [ ] Voice tone analysis detects basic emotions accurately
- [ ] Scheduled calls connect within 30 seconds
- [ ] On-demand calls available 24/7
- [ ] AI maintains conversation context across sessions

#### E3: WhatsApp Integration
- [ ] Messages delivered within 5 seconds
- [ ] Photo analysis returns results in <10 seconds
- [ ] Voice message processing accurate for mood detection
- [ ] Proactive nudges respect quiet hours
- [ ] Conversation history maintained indefinitely

#### E4: Mobile App
- [ ] Dashboard loads in <3 seconds
- [ ] All charts render within 2 seconds
- [ ] Offline mode caches 7 days of data
- [ ] Notification management granular and functional
- [ ] Cross-device sync works seamlessly

#### E5-E7: Three Pillars
- [ ] Each pillar has complete light/deep mode implementations
- [ ] Data syncs across all channels within 5 minutes
- [ ] AI coaching available for each pillar
- [ ] Goal setting and tracking functional
- [ ] Historical data accessible for 12+ months

#### E8: Cross-Domain Intelligence
- [ ] Correlations surface within 7 days of use
- [ ] "Unimaginable insights" generate weekly
- [ ] Holistic health score calculates accurately
- [ ] Predictive insights have >70% accuracy
- [ ] Users can explain how insights were generated

#### E9: Data Integrations
- [ ] All 10 integrations connect successfully
- [ ] Data syncs within 15 minutes of source update
- [ ] OAuth flows complete without errors
- [ ] Data permissions clearly explained
- [ ] Manual data entry available as fallback

#### E10: Analytics & Insights Dashboard (Core USP)
- [ ] Personalized Insight Feed delivers 3-5 insights daily
- [ ] "What's Affecting What" explorer functional
- [ ] Three-Pillar Harmony View renders correctly
- [ ] Insight Actions track user engagement
- [ ] Pattern Recognition Alerts trigger proactively
- [ ] Readiness/Strain/Sleep/Nutrition scores calculate accurately
- [ ] Emotional Context Timeline overlays mood on all metrics

### Quality Gates

| Gate | Criteria | Required |
|------|----------|----------|
| **Performance** | <2s response time p95 | Yes |
| **Reliability** | 99.9% uptime | Yes |
| **Security** | Pass penetration testing | Yes |
| **Privacy** | GDPR/HIPAA compliant | Yes |
| **Accessibility** | WCAG 2.1 AA | Yes |
| **User Satisfaction** | 4.5/5 beta rating | Yes |

---

## 8. FEATURE TEMPLATE REFERENCE

Each Epic sub-document uses this standard feature template:

```markdown
## F[X.Y]: [Feature Name]

### Description
[2-3 sentence description of what this feature does]

### User Story
As a [persona], I want to [action] so that [benefit].

### Flexibility Modes
| Mode | Experience |
|------|------------|
| **Light** | [Quick/simple version] |
| **Deep** | [Detailed/comprehensive version] |

### Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]

### Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Dependencies
- [Related features, integrations, or prerequisites]

### MVP Status
[ ] MVP Core  |  [ ] MVP Nice-to-Have  |  [ ] Future
```

---

## 9. CROSS-REFERENCE INDEX

### Related Documents

| Document | Code | Purpose |
|----------|------|---------|
| Executive Vision | YH-VISION-2025-11-17 | Strategic foundation |
| Business Requirements | YH-BRD-* | Business context |
| Technical Architecture | YH-TECH-* | Implementation guide |
| Data Dictionary | YH-DATA-* | Schema reference |
| API Documentation | YH-API-* | Integration specs |
| Testing Strategy | YH-TEST-* | Quality assurance |

### Epic Sub-Documents

| Epic | Document | Status |
|------|----------|--------|
| E1 | [PRD-Epic-01-Onboarding-Assessment.md](prd-epics/PRD-Epic-01-Onboarding-Assessment.md) | Pending |
| E2 | [PRD-Epic-02-Voice-Coaching.md](prd-epics/PRD-Epic-02-Voice-Coaching.md) | Pending |
| E3 | [PRD-Epic-03-WhatsApp-Integration.md](prd-epics/PRD-Epic-03-WhatsApp-Integration.md) | Pending |
| E4 | [PRD-Epic-04-Mobile-App.md](prd-epics/PRD-Epic-04-Mobile-App.md) | Pending |
| E5 | [PRD-Epic-05-Fitness-Pillar.md](prd-epics/PRD-Epic-05-Fitness-Pillar.md) | Pending |
| E6 | [PRD-Epic-06-Nutrition-Pillar.md](prd-epics/PRD-Epic-06-Nutrition-Pillar.md) | Pending |
| E7 | [PRD-Epic-07-Wellbeing-Pillar.md](prd-epics/PRD-Epic-07-Wellbeing-Pillar.md) | Pending |
| E8 | [PRD-Epic-08-Cross-Domain-Intelligence.md](prd-epics/PRD-Epic-08-Cross-Domain-Intelligence.md) | Pending |
| E9 | [PRD-Epic-09-Data-Integrations.md](prd-epics/PRD-Epic-09-Data-Integrations.md) | Pending |
| E10 | [PRD-Epic-10-Analytics-Dashboard.md](prd-epics/PRD-Epic-10-Analytics-Dashboard.md) | Pending |

---

## 10. COMPETITIVE ANALYSIS (USP vs BEVEL/WHOOP)

### yHealth's Competitive USP Statement
> **"BEVEL and WHOOP track your body. yHealth understands your whole self - connecting how you FEEL with how you PERFORM through conversational AI coaching."**

### What Competitors Do Well (Feature Parity Target)

**BEVEL ($10M Series A, 100K+ DAU, 80% retention):**
- "Bevel Intelligence" - cross-domain correlation engine
- Customizable Trends Dashboard (3-90 day views, reorganizable)
- Recovery Score + Strain Score + Sleep Performance
- CGM integration (Dexcom, Libre) for nutrition insights
- 5M+ food database via Nutritionix

**WHOOP:**
- Monthly Mental Health Survey (PHQ-9, GAD-2 validated)
- Real-time Stress Monitor
- Journal Feature (mood + habits + behaviors)
- Monthly Performance Assessment (MPA) reports
- Personal records & streaks

### What Competitors Are MISSING (yHealth's Moat)

| Gap in Market | yHealth Solution |
|---------------|------------------|
| Mental health = afterthought | **Daily Wellbeing as EQUAL pillar** - real-time journaling, not monthly surveys |
| Analytics-only AI | **Conversational AI Coach** via Voice + WhatsApp |
| No emotional context in metrics | **Voice tone analysis + mood correlation with biometrics** |
| Siloed domain insights | **True three-pillar "Unimaginable Insights"** |
| One-size-fits-all engagement | **User-Adaptive Flexibility** (light/deep modes) |
| Reactive insights | **Proactive coaching** based on patterns |

### "Unimaginable Insights" Framework (yHealth's Core Moat)

**What Makes Insights "Unimaginable" (4 Pillars):**
1. **Emotional Context** - Mood/wellbeing data competitors don't have
2. **Conversational Delivery** - Through coaching conversations, not just dashboards
3. **Deep Personalization** - AI learns YOUR unique patterns over time
4. **Proactive Intervention** - Reaches out BEFORE problems happen

**Three Insight Categories:**

| Category | Example | Competitor Gap |
|----------|---------|----------------|
| **Predictive** | "Based on your patterns, you'll likely feel low energy tomorrow - here's what to do NOW" | No emotional prediction |
| **Correlational** | "Your best workouts happen when you journal in the morning AND sleep 7+ hours" | No journaling correlation |
| **Actionable** | "Right now: A 10-min walk would boost your afternoon energy based on your patterns" | No real-time coaching |

### Feature Parity + Enhancement Matrix

| Feature | BEVEL/WHOOP | yHealth Enhancement |
|---------|-------------|---------------------|
| **Recovery Score** | ✅ Daily readiness | + Wellbeing impact factor |
| **Strain Score** | ✅ Training load | + Emotional context overlay |
| **Sleep Tracking** | ✅ Quality metrics | + Mood-sleep correlation |
| **Nutrition** | ✅ Calorie/macro | + Emotional eating patterns |
| **Trends Dashboard** | ✅ Customizable | + Three-pillar harmony view |
| **AI Insights** | ✅ Pattern recognition | + Conversational delivery via Voice/WhatsApp |
| **Mental Health** | Monthly survey only | **Daily journaling + real-time mood** |
| **Coaching** | None (analytics only) | **Full AI coach across channels** |

---

## 11. ERROR HANDLING & EDGE CASES

### Philosophy
Every feature must gracefully handle failures and edge cases. Users should never see raw errors or be left without guidance on how to proceed.

### Voice Coaching Error Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Call drops mid-session** | WebSocket disconnect | Auto-reconnect within 10s, resume context | "Connection lost. Reconnecting... We'll pick up where we left off." |
| **AI response timeout (>5s)** | Response timer | Retry with simplified prompt | "Let me think about that differently..." |
| **Voice recognition failure** | Low confidence score (<0.6) | Request clarification | "I didn't quite catch that. Could you say it again?" |
| **Emotion detection uncertainty** | Confidence <0.5 | Default to neutral, ask directly | "How are you feeling right now?" (fallback to explicit check) |
| **Network latency spike** | RTT >3s | Switch to text-based interaction | "Voice quality is low. Would you prefer to continue via text?" |
| **Audio quality issues** | SNR <10dB | Provide feedback | "There's some background noise. Can you move somewhere quieter?" |

### WhatsApp Integration Error Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **API rate limit hit** | 429 response | Queue messages, exponential backoff | "Message queued. You'll receive it shortly." |
| **Message delivery failure** | Webhook timeout | Retry 3x with backoff, then alert | "Having trouble reaching you. Please check your connection." |
| **Photo analysis timeout** | >15s processing | Return partial result or request retry | "Photo is taking longer than usual. Try a clearer image?" |
| **Voice message too long** | >5min duration | Process first 5min, prompt continuation | "Got the first part! Want to continue?" |
| **Unsupported media type** | MIME check | Explain supported types | "I can analyze photos and voice messages. Try sending one of those!" |
| **24-hour window expired** | WhatsApp policy | Use template message to re-engage | [Template] "Checking in! Reply to continue our conversation." |

### Wearable Sync Error Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **OAuth token expired** | 401 response | Refresh token, prompt re-auth if fails | "Please reconnect your [device] to continue syncing." |
| **API unavailable** | 5xx responses | Queue sync, retry hourly | "Your [device] data will sync when service is restored." |
| **Data gap (>24h)** | Missing timestamps | Backfill request, highlight gap | "Some data from [date] is missing. This may affect insights." |
| **Conflicting data sources** | Multiple devices same metric | Apply priority hierarchy | Silent: use golden source rules (Section 15) |
| **Rate limit approached** | 80% quota usage | Reduce sync frequency | Silent: adjust to preserve quota for critical syncs |
| **Device disconnected** | No data >48h | Proactive notification | "Haven't synced from your [device] in 2 days. Everything okay?" |

### Mobile App Error Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Offline mode activation** | Network check fail | Switch to cached data | "You're offline. Using recent data." |
| **Sync conflict** | Offline edits + server changes | User choice or auto-merge | "We found changes. Keep your version or sync with latest?" |
| **Dashboard load failure** | API timeout | Show cached view with timestamp | "Showing data from [time]. Pull to refresh." |
| **Local storage full** | Storage quota exceeded | Clear old cache, prioritize recent | "Storage full. Cleared older data to make room." |
| **App crash recovery** | Crash reporting | Restore session state | "Welcome back! Resuming where you left off." |
| **Push notification failure** | Delivery receipt missing | Retry with in-app notification | Silent: ensure critical alerts reach user |

### AI Coaching Error Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Harmful content request** | Content filter | Redirect conversation | "I'm here to support your health journey. Let's focus on that." |
| **Out-of-scope question** | Topic classification | Set boundary, offer alternative | "I specialize in health coaching. For [topic], please consult [resource]." |
| **Hallucination risk detected** | Confidence scoring | Add uncertainty, cite sources | "Based on your data... but everyone's different. Let's track and see." |
| **Crisis indicators detected** | Sentiment + keyword | Escalation protocol (Section 14) | "I'm concerned. Would it help to talk to someone who specializes in this?" |
| **Insufficient data for insight** | Sample size check | Explain requirement | "I need a few more days of data to spot patterns. Keep logging!" |

---

## 12. ACCESSIBILITY REQUIREMENTS

### Compliance Standard
**Target:** WCAG 2.1 Level AA compliance for all user-facing features

### Visual Accessibility

| Requirement | Implementation | Success Criteria |
|-------------|----------------|------------------|
| **Color contrast** | Minimum 4.5:1 for normal text, 3:1 for large text | Pass automated contrast checker |
| **Color independence** | Never use color alone to convey information | Icons/text accompany all color indicators |
| **Text scaling** | Support 200% zoom without loss of function | All content readable at 200% |
| **Dark mode** | Full dark theme with appropriate contrast | Consistent experience across themes |
| **Focus indicators** | Visible focus states for all interactive elements | 2px solid outline, high contrast |

### Screen Reader Support

| Feature | Screen Reader Behavior | ARIA Implementation |
|---------|----------------------|---------------------|
| **Dashboard charts** | Provide text summary of data | aria-label with trend description |
| **Progress indicators** | Announce progress percentage | aria-valuenow, aria-valuemin, aria-valuemax |
| **Dynamic content** | Announce updates | aria-live="polite" for non-critical, "assertive" for alerts |
| **Navigation** | Logical heading structure | H1-H6 hierarchy, skip links |
| **Forms** | Associate labels with inputs | aria-labelledby, aria-describedby |
| **Modals** | Trap focus, announce | role="dialog", aria-modal="true" |

### Voice Coaching Accessibility

| User Need | Accommodation | Implementation |
|-----------|---------------|----------------|
| **Deaf/Hard-of-hearing** | Real-time transcription | Display AI speech as text during call |
| **Speech impairment** | Text input alternative | "Type your response" option during calls |
| **Cognitive load** | Adjustable pace | "Take your time" mode with slower responses |
| **Memory support** | Conversation summaries | Post-call summary sent via app/WhatsApp |

### Motor Accessibility

| Requirement | Implementation | Success Criteria |
|-------------|----------------|------------------|
| **Touch targets** | Minimum 44x44pt tap targets | All buttons meet minimum |
| **Gesture alternatives** | Single-tap alternatives for swipes | Settings to enable simplified gestures |
| **Timeout extensions** | Configurable session timeouts | User control over timeout duration |
| **One-handed use** | Key actions reachable with thumb | Bottom navigation, reachable CTAs |

### Accessibility Testing Requirements

- [ ] Automated testing with axe-core on all views
- [ ] Manual testing with VoiceOver (iOS) and TalkBack (Android)
- [ ] User testing with accessibility needs community
- [ ] Keyboard-only navigation testing (web views)
- [ ] Color blindness simulation testing

---

## 13. ACCOUNT MANAGEMENT

### Account Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sign Up   │────►│   Active    │────►│   Paused    │────►│   Deleted   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                          │                   │
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Cancelled  │     │ Reactivated │
                    │ (data kept) │     │             │
                    └─────────────┘     └─────────────┘
```

### Account Creation Requirements

| Field | Required | Validation | Privacy Note |
|-------|----------|------------|--------------|
| Email | Yes | Valid format, unique | Primary identifier, recovery |
| Password | Yes | Min 8 chars, 1 number, 1 special | Hashed with bcrypt |
| Name | Yes | 2-50 characters | Display only, editable |
| Date of Birth | Yes | 18+ years old | Age verification, never shared |
| Phone (WhatsApp) | Optional | Valid format with country code | Required for WhatsApp channel |

### Account Recovery

| Scenario | Recovery Method | Verification | Time Limit |
|----------|-----------------|--------------|------------|
| **Forgot password** | Email link | Click within 1 hour | 1 hour |
| **Lost 2FA device** | Recovery codes | 8-digit backup codes | None (one-time use) |
| **Email access lost** | Support ticket | Identity verification | 24-72 hours |
| **Account locked** | Auto-unlock or email | 5 failed attempts = 30min lock | Auto 30min |

### Subscription Management

| Action | Flow | Confirmation |
|--------|------|--------------|
| **Upgrade** | In-app payment → immediate access | Email receipt + app notification |
| **Downgrade** | End of billing cycle transition | Email confirmation + countdown |
| **Cancel** | Retain access until period end | Confirmation + retention offer |
| **Reactivate** | One-click restore within 30 days | Immediate access restoration |
| **Change plan** | Prorated calculation | Preview before confirmation |

### Payment Failure Handling

| Failure Type | Grace Period | User Communication | Final Action |
|--------------|--------------|-------------------|--------------|
| **Card declined** | 7 days | Email + app notification Day 1, 4, 7 | Downgrade to free (if available) |
| **Insufficient funds** | 7 days | Retry automatically Days 1, 3, 5 | Prompt payment method update |
| **Expired card** | 14 days | Advance notice 30 days before expiry | Prompt update before expiry |
| **Disputed charge** | Immediate | Account flagged, contact support | Resolve or terminate |

### Account Deletion (GDPR Right to Erasure)

**Process:**
1. User initiates deletion request
2. 14-day cooling-off period (cancelable)
3. Final confirmation email
4. Data deletion within 30 days
5. Confirmation of completion

**Data Handling:**
| Data Type | Action | Retention Exception |
|-----------|--------|---------------------|
| Personal identifiers | Deleted | None |
| Health data | Deleted | None |
| Usage analytics | Anonymized | Aggregate stats retained |
| Financial records | Retained | 7 years (legal requirement) |
| Support tickets | Anonymized | Audit trail retained |

### Data Export (GDPR Portability)

**Export Contents:**
- Profile information (JSON)
- All health data (JSON + CSV)
- Insights history (JSON)
- Conversation transcripts (text)
- Connected integrations list
- Preferences and settings

**Format:** Machine-readable ZIP with JSON/CSV files
**Timeline:** Available within 48 hours of request
**Delivery:** Secure download link (expires in 7 days)

---

## 14. AI SAFETY BOUNDARIES

### Medical Advice Limitations

**The AI Coach Will NOT:**
- Diagnose medical conditions
- Prescribe medications or dosages
- Recommend stopping prescribed treatments
- Provide emergency medical guidance
- Interpret medical test results
- Override healthcare provider recommendations

**Standard Disclaimers (Always Displayed):**
> "yHealth provides wellness coaching, not medical advice. Always consult healthcare professionals for medical concerns."

### Boundary Enforcement

| User Request | AI Response | Escalation |
|--------------|-------------|------------|
| "What medication should I take?" | "I can't recommend medications. Please consult your doctor or pharmacist." | None |
| "Is this pain serious?" | "I'm not able to assess medical symptoms. If you're concerned, please contact a healthcare provider." | Provide urgent care resources if severe keywords detected |
| "Should I stop my medication?" | "Never change medications without consulting your prescribing doctor first." | None |
| "Am I having a heart attack?" | "If you think you're having a medical emergency, call emergency services immediately." | Display emergency number, log for safety review |

### Crisis Detection & Escalation

**Trigger Keywords/Patterns:**
- Self-harm references
- Suicidal ideation
- Severe depression indicators
- Extreme anxiety/panic
- Eating disorder behaviors
- Substance abuse crisis

**Escalation Protocol:**

```
Level 1: Concern Detected
├── AI acknowledges feelings
├── Offers support resources
└── Continues conversation if user wishes

Level 2: Moderate Risk
├── Express care and concern
├── Provide crisis hotline numbers
├── Offer to pause for self-care
└── Flag for human review

Level 3: Immediate Risk
├── Immediate resource provision
├── Emergency numbers prominent
├── Warm handoff message
├── Alert to safety team (if configured)
└── Log with full context
```

**Crisis Resources (Region-Specific):**
| Region | Resource | Contact |
|--------|----------|---------|
| US | 988 Suicide & Crisis Lifeline | 988 |
| US | Crisis Text Line | Text HOME to 741741 |
| UK | Samaritans | 116 123 |
| UAE | Mental Health Support | 800-HOPE (4673) |

### What the Coach Will NOT Do

| Category | Prohibition | Alternative Offered |
|----------|-------------|---------------------|
| **Medical** | Diagnose, prescribe, interpret tests | Refer to healthcare provider |
| **Mental Health** | Therapy, clinical assessment | Suggest professional resources |
| **Legal** | Legal advice, liability guidance | Recommend legal counsel |
| **Financial** | Investment advice, financial planning | General wellness impact only |
| **Emergency** | Handle acute emergencies | Direct to emergency services |
| **Manipulation** | Shame, guilt, or pressure tactics | Supportive, non-judgmental tone |

### Harmful Advice Safeguards

**Pre-Generation Filters:**
- Dangerous exercise recommendations (injury risk)
- Extreme caloric restriction (<1200 kcal without medical supervision)
- Unsafe supplement combinations
- Overtraining recommendations
- Fasting for vulnerable populations

**Response Validation:**
- Medical claim detection → add disclaimer
- Extreme recommendation detection → moderate advice
- Contradiction with user's known conditions → flag for review

### Transparency Requirements

**Users Must Know:**
- They're interacting with AI, not humans
- Data used for personalization
- Limitations of AI capabilities
- How to reach human support
- How to report concerning AI behavior

**Feedback Mechanism:**
- "Was this helpful?" on every insight
- "Report a problem" accessible in all views
- Regular AI safety surveys to users

---

## 15. DATA MANAGEMENT

### Multi-Source Conflict Resolution

When multiple data sources report the same metric, apply this priority hierarchy:

**Golden Source Priority (Highest to Lowest):**

| Metric Type | Priority 1 | Priority 2 | Priority 3 | Priority 4 |
|-------------|------------|------------|------------|------------|
| **Heart Rate** | WHOOP | Apple Watch | Fitbit | Manual entry |
| **Sleep** | WHOOP (primary) | Oura | Apple Watch | Manual entry |
| **Activity/Steps** | Apple Health (aggregated) | Primary wearable | Strava | Manual entry |
| **Nutrition** | Manual entry | Nutritionix scan | AI photo estimate | — |
| **Mood** | Manual entry | Voice analysis | Text sentiment | — |
| **Weight** | Smart scale sync | Manual entry | — | — |

**Conflict Resolution Rules:**
1. **Same timestamp:** Higher priority source wins
2. **Overlapping periods:** Use source with more granular data
3. **Contradictory data:** Flag for user resolution if variance >20%
4. **Manual override:** User can always designate preferred source per metric

### Data Normalization Rules

**Heart Rate Mapping:**
| Source | Raw Format | Normalized Format |
|--------|------------|-------------------|
| WHOOP | Instantaneous BPM, 1-sec intervals | 1-min average BPM |
| Apple Health | Aggregated by activity type | 1-min average BPM |
| Fitbit | 5-sec resolution during exercise | 1-min average BPM |

**Sleep Stage Mapping:**
| Source | Native Stages | yHealth Standard |
|--------|---------------|------------------|
| WHOOP | Wake, Light, Deep, REM | Wake, Light, Deep, REM |
| Oura | Wake, Light, Deep, REM | Direct mapping |
| Apple Watch | Awake, Core, Deep, REM | Wake→Awake, Light→Core |
| Fitbit | Awake, Light, Deep, REM | Direct mapping |

**Activity/Strain Mapping:**
| Source | Native Metric | yHealth Standard |
|--------|---------------|------------------|
| WHOOP | Strain (0-21 scale) | Strain Score (normalized 0-100) |
| Apple Watch | Active Calories + Move | Activity Score (0-100 based on goals) |
| Strava | Relative Effort (0-400+) | Strain Score (capped at 100) |

### Offline Mode Specification

**Features Available Offline:**

| Feature | Offline Capability | Sync Behavior |
|---------|-------------------|---------------|
| **View dashboard** | Last 7 days cached | Full refresh on reconnect |
| **Log mood** | Queue locally | Sync with timestamp on reconnect |
| **Log meals** | Queue locally (no photo AI) | Photo processed on reconnect |
| **View insights** | Cached insights only | New insights on reconnect |
| **Journal entry** | Full functionality | Sync on reconnect |
| **Voice coaching** | ❌ Not available | — |
| **WhatsApp** | ❌ Requires connection | — |
| **Wearable sync** | ❌ Requires connection | Backfill on reconnect |

**Local Storage Allocation:**
- Dashboard data: Up to 50MB
- Cached insights: Up to 10MB
- Queued entries: Up to 20MB
- Conversation history: Up to 20MB
- **Total maximum:** 100MB per user

**Sync Behavior on Reconnect:**
1. Upload queued entries (chronological order)
2. Resolve conflicts (prompt if needed)
3. Fetch new data from integrations
4. Generate updated insights
5. Clear processed queue

### Data Retention by Type

| Data Type | Active Account | Deleted Account |
|-----------|----------------|-----------------|
| Health metrics | Indefinite | Deleted within 30 days |
| Conversation history | 24 months rolling | Deleted within 30 days |
| Insights | 12 months rolling | Deleted within 30 days |
| AI model training data | Anonymized after 90 days | Anonymized at deletion |
| Audit logs | 7 years | 7 years (regulatory) |

---

## 16. FIRST 7 DAYS CRITICAL PATH

### Objective
Achieve "aha moment" and establish habit formation foundation within first week.

### Day-by-Day Journey

**Day 0: Onboarding**
| Milestone | Action | Success Metric |
|-----------|--------|----------------|
| Account created | Sign up complete | — |
| Preference set | Light/Deep mode chosen | Preference stored |
| First integration | 1+ wearable connected | OAuth complete |
| Initial assessment | Quick or deep assessment done | Assessment score generated |
| Personalized plan | First plan presented | Plan viewed |

**Day 1: First Full Day**
| Milestone | Action | Success Metric |
|-----------|--------|----------------|
| Morning check-in | Prompted at user's preferred time | Check-in completed |
| First data sync | Wearable data flows in | ≥1 sync event |
| First insight | Basic insight delivered | Insight viewed |
| First meal log | Photo or manual entry | 1+ meal logged |
| Channel exploration | Try WhatsApp or Voice | 1+ interaction outside app |

**Day 2-3: Building Routine**
| Milestone | Action | Success Metric |
|-----------|--------|----------------|
| Consistent check-ins | Morning routine establishing | 2/2 days check-in |
| Multi-pillar logging | Activity in 2+ pillars | Data in Fitness + 1 other |
| First correlation hint | "We're learning your patterns" | User sees progress indicator |
| First coaching interaction | Meaningful AI conversation | 3+ back-and-forth exchanges |

**Day 4-5: Discovering Value**
| Milestone | Action | Success Metric |
|-----------|--------|----------------|
| Pattern preview | "Early pattern detected" | User engages with preview |
| Personalized nudge | Context-aware suggestion | User acts on nudge |
| Streak awareness | Progress toward first streak | Streak counter visible |
| Multi-channel comfort | Used 2+ channels | Channel diversity metric |

**Day 6-7: Aha Moment**
| Milestone | Action | Success Metric |
|-----------|--------|----------------|
| First real insight | Cross-domain correlation | "I didn't know that!" reaction |
| Habit foundation | 5+ day logging streak | Streak achieved |
| Value demonstration | Summary of week's learnings | Summary viewed |
| Commitment prompt | "Keep going?" affirmation | User confirms continuation |

### Minimum Data Requirements for Insights

| Insight Type | Minimum Data Points | Typical Time to Achieve |
|--------------|--------------------|-----------------------|
| **Basic trends** | 3 days same metric | Day 3 |
| **Sleep quality patterns** | 5 nights | Day 5-7 |
| **Mood-activity correlation** | 7 mood entries + 5 activities | Day 7 |
| **Nutrition impact** | 10 meals + 5 energy ratings | Day 5-7 |
| **Cross-domain insight** | 14 data points across 2 pillars | Day 7-14 |
| **Predictive capability** | 21 days pattern data | Day 21+ |

### "Aha Moment" Definition

**What Qualifies as Aha Moment:**
1. User discovers connection they didn't know existed
2. User receives actionable advice that proves accurate
3. User sees prediction that comes true
4. User achieves goal with AI coach support

**Measurement:**
- Post-insight survey: "Did this surprise you?" + "Was this useful?"
- Engagement depth: Time spent with insight, shares, saves
- Behavioral change: User takes recommended action within 24h

### Re-Engagement Triggers (Days 1-7)

| Trigger Condition | Channel | Message Type |
|-------------------|---------|--------------|
| No activity for 24h | Push + WhatsApp | Gentle check-in |
| Missed morning routine | Push | "Missed you this morning!" |
| One pillar only | In-app | "Have you tried logging [other pillar]?" |
| No voice/WhatsApp used | Push | Feature highlight |
| Day 7 approaching, low engagement | WhatsApp | Value summary + encouragement |

### First Week Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Day 7 retention | 80% | Users active on Day 7 |
| Multi-pillar adoption | 70% | Logged in 2+ pillars |
| Multi-channel usage | 50% | Used 2+ channels |
| Aha moment achieved | 60% | Survey + engagement signal |
| Streak started | 75% | 3+ day logging streak |

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After each Epic completion
**Update Triggers:** Feature changes, scope adjustments, stakeholder feedback
**Version Control:** All changes require version increment and rationale
**Ownership:** Product Team with Engineering review

---

*yHealth Platform Product Requirements Document v4.1*
*Your Comprehensive AI Health Coach - Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Updated: 2025-12-02*
*Structure: Master + 10 Epic Sub-Documents | ~79 Features*
*Competitive Research: BEVEL ($10M Series A) + WHOOP analyzed*
