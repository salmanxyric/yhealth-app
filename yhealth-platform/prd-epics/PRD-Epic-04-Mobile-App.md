# yHealth Platform - Epic 04: Mobile App

## EPIC OVERVIEW

### Epic Statement
The Mobile App is yHealth's **PRIMARY INTERFACE** and **HOME BASE** where users view their unified health dashboard, access all three pillars (Fitness, Nutrition, Wellbeing), navigate between channels (Voice, WhatsApp), configure settings, and explore their comprehensive health data through rich visualizations and insights.

### Epic Goal
Create a seamless, intuitive mobile application (iOS + Android) that serves as the central hub for yHealth's multi-channel experience - enabling users to effortlessly monitor their holistic health, discover cross-domain insights, and maintain engagement across all three equal pillars through adaptive flexibility modes.

### Core Philosophy
**"The Dashboard That Adapts to You":** Every user has different engagement preferences. The mobile app respects this by offering Light Mode (quick glances, minimal friction) and Deep Mode (detailed exploration, comprehensive analytics) across ALL features, ensuring the app serves both the busy professional checking their morning score and the optimization enthusiast diving into correlation charts.

### Mobile App Scope (7 Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F4.1** | Unified Dashboard | Core |
| **F4.2** | Navigation & Information Architecture | Core |
| **F4.3** | Data Visualization | Core |
| **F4.4** | Push Notifications | Core |
| **F4.5** | Offline Mode | Core |
| **F4.6** | Settings & Preferences | Core |
| **F4.7** | Accessibility Features | Core |

---

## F4.1: UNIFIED DASHBOARD

### Description
The home screen of yHealth displays a comprehensive yet scannable overview of the user's health across all three pillars (Fitness, Nutrition, Wellbeing), featuring daily scores, quick insights, recent activity, and prominent calls-to-action for logging and coaching interactions. The dashboard is the first thing users see and must deliver immediate value while encouraging deeper engagement.

### User Story
As a **Holistic Health Seeker** (P1), I want to see my complete health picture at a glance when I open the app so that I can quickly understand my status across fitness, nutrition, and wellbeing without navigating through multiple screens.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simplified dashboard with three pillar scores (0-100), today's summary (steps, meals, mood), one featured insight card, and quick action buttons (Log Meal, Check Mood, Start Workout). Minimal scrolling, essential information only. |
| **Deep** | Comprehensive dashboard with detailed pillar scores, 7-day trend sparklines, multiple insight cards (3-5), recent activity timeline, upcoming goals/streaks, recovery status, and expanded quick actions. Full scrollable feed of personalized content. |

### User Decisions Applied
- **Three-Pillar Equality:** Dashboard gives equal visual weight to Fitness, Nutrition, and Wellbeing
- **Adaptive Layout:** Dashboard automatically adjusts based on user's Light/Deep mode preference
- **Insight Priority:** Most actionable insights surface first based on AI prioritization
- **Quick Actions:** One-tap access to most common user actions from dashboard

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard load time | <3 seconds on average connection | Performance monitoring |
| Daily engagement rate | 90% of active users open dashboard daily | Analytics tracking |
| Quick action usage | 70% of users use quick actions 3+ times/week | Interaction analytics |
| Insight engagement | 60% click-through rate on dashboard insights | Insight engagement metrics |

### Acceptance Criteria

- [ ] Dashboard displays three pillar scores prominently with color coding (Green 80-100, Yellow 50-79, Red 0-49)
- [ ] Today's summary shows: Total steps, Active minutes, Sleep duration/quality, Meals logged, Mood rating, Energy level
- [ ] Featured insight card rotates based on AI priority algorithm (most actionable/relevant first)
- [ ] Quick action buttons: Log Meal, Log Mood, Start Voice Coaching, View Full Insights, Log Workout
- [ ] Light mode fits essential information above fold (no scrolling required for key data)
- [ ] Deep mode includes: 7-day trend sparklines per pillar, 3-5 insight cards, recent activity timeline, goal progress indicators
- [ ] Dashboard refreshes on pull-to-refresh gesture
- [ ] Skeleton loading state displays during data fetch (no blank screen)
- [ ] Dashboard data caches for offline viewing (7 days)
- [ ] Smooth transitions to detail views when tapping pillar scores or insights
- [ ] Dashboard personalizes based on time of day (morning: recovery focus, evening: day summary)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Dashboard load failure** | API timeout or network error | Show cached dashboard with timestamp | "Showing data from [time]. Pull to refresh when online." |
| **Partial data load** | Some pillar data unavailable | Display available data, show placeholders for missing | "Some data still syncing. Refresh in a moment." |
| **No data yet (new user)** | Empty state on Day 1 | Welcome message with onboarding prompts | "Welcome! Start by logging your first meal or mood." |
| **Stale cached data (>24h)** | Last sync timestamp >24h old | Visual indicator of data age | Badge: "Data from yesterday. Connect to update." |

### Cross-Pillar Connections

**To Fitness (E5):**
- Dashboard displays Fitness Pillar score, today's activity summary, recovery status
- Quick action: Start Workout opens workout recommendations

**To Nutrition (E6):**
- Dashboard displays Nutrition Pillar score, meals logged today, calorie/macro progress
- Quick action: Log Meal opens meal logging interface

**To Wellbeing (E7):**
- Dashboard displays Wellbeing Pillar score, today's mood/energy, journaling streak
- Quick action: Log Mood opens mood check-in

**To Cross-Domain Intelligence (E8):**
- Dashboard features AI-generated insights connecting pillars
- "What's Affecting What" insight cards preview correlations

**To Analytics & Insights (E10):**
- Dashboard insight cards link to full Analytics Dashboard
- Trend sparklines preview detailed charts in E10

### Dependencies
- **E5, E6, E7 (Three Pillars):** Source of pillar scores and daily summaries
- **E8 (Cross-Domain Intelligence):** AI insight generation for dashboard cards
- **E9 (Data Integrations):** Real-time data sync for dashboard freshness
- **E10 (Analytics Dashboard):** Detailed views accessed from dashboard elements

### MVP Status
[X] MVP Core

---

## F4.2: NAVIGATION & INFORMATION ARCHITECTURE

### Description
The app's primary navigation system enables users to seamlessly move between the three pillars, access settings, view analytics, and switch between interaction channels (Voice, WhatsApp). Navigation is persistent, intuitive, and optimized for one-handed thumb usage with bottom tab bar pattern (iOS/Android standard).

### User Story
As a **Busy Professional** (P2), I want to quickly navigate between fitness tracking, meal logging, and mood check-ins without getting lost or frustrated so that I can complete my health tasks efficiently during short breaks.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Bottom tab bar with 3 primary tabs (Dashboard, Log, Insights), minimal sub-navigation, streamlined information hierarchy. Most actions accessible within 2 taps. |
| **Deep** | Bottom tab bar + top-level navigation drawer with full feature access, advanced settings, pillar-specific deep dives, analytics library, export tools. Power user features accessible within 3 taps. |

### User Decisions Applied
- **Bottom Tab Bar (Standard):** 4 main tabs: Dashboard, Pillars, Insights, Profile
- **Pillar Access:** Pillars tab opens sub-navigation for Fitness, Nutrition, Wellbeing detail views
- **Channel Switching:** Quick access to Voice Coaching and WhatsApp from top nav bar
- **Settings Depth:** Light mode shows essential settings only, Deep mode exposes all configurations

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Navigation efficiency | 90% of actions within 3 taps | User flow analytics |
| Tab usage distribution | 70% use 3+ tabs weekly (balanced engagement) | Tab interaction tracking |
| Lost user rate | <5% users report difficulty finding features | User feedback surveys |
| One-handed usability score | 4.5/5 rating for thumb reachability | UX testing surveys |

### Acceptance Criteria

- [ ] Bottom tab bar with 4 tabs: Dashboard (home icon), Pillars (layers icon), Insights (lightbulb icon), Profile (person icon)
- [ ] Pillars tab opens secondary navigation: Fitness, Nutrition, Wellbeing with icon differentiation
- [ ] Top navigation bar includes: App logo/branding (left), Channel switcher (Voice/WhatsApp icons, center-right), Notifications bell (right)
- [ ] Profile tab contains: Settings, Account, Preferences, Connected Devices, Help & Support, About
- [ ] All interactive elements meet minimum 44x44pt touch target (accessibility)
- [ ] Navigation state persists when switching channels and returning to app
- [ ] Back button behavior follows platform conventions (Android hardware back, iOS swipe)
- [ ] Tab badges show unread counts (insights, notifications)
- [ ] Deep mode includes navigation drawer (hamburger menu) with full feature tree
- [ ] Light mode hides advanced features from primary navigation (accessible via Profile > Advanced)
- [ ] Search functionality accessible from all screens (magnifying glass icon, top right)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Navigation state loss** | App crash or force-close recovery | Restore last screen or default to Dashboard | Silent: smooth restoration |
| **Deep link failure** | Invalid notification link | Navigate to Dashboard with error toast | "Content unavailable. Showing your dashboard." |
| **Feature access restriction** | Free tier accessing premium feature | Show upgrade prompt with clear explanation | "This feature requires Premium. Upgrade to access." |
| **Offline navigation** | No network during navigation attempt | Allow offline-capable screens, block sync-required screens | "This requires internet. Try Dashboard (offline mode)." |

### Information Architecture (App Structure)

```
yHealth App
│
├── Dashboard (Home)
│   ├── Three Pillar Scores
│   ├── Today's Summary
│   ├── Featured Insights
│   └── Quick Actions
│
├── Pillars
│   ├── Fitness
│   │   ├── Activity Tracking
│   │   ├── Sleep Tracking
│   │   ├── Recovery Status
│   │   ├── Fitness Goals
│   │   ├── Workout Recommendations
│   │   └── Strain/Load Management
│   │
│   ├── Nutrition
│   │   ├── Meal Logging
│   │   ├── Calorie/Macro Tracking
│   │   ├── Hydration Tracking
│   │   ├── Nutrition Goals
│   │   ├── Meal Recommendations
│   │   └── Food Insights
│   │
│   └── Wellbeing
│       ├── Mood Tracking
│       ├── Journaling
│       ├── Habit Tracking
│       ├── Energy Levels
│       ├── Stress Monitoring
│       └── Wellbeing Goals
│
├── Insights (E10: Analytics Dashboard)
│   ├── Personalized Insight Feed
│   ├── What's Affecting What Explorer
│   ├── Three-Pillar Harmony View
│   ├── Trend Visualization
│   └── Pattern Recognition Alerts
│
└── Profile
    ├── Settings & Preferences (F4.6)
    ├── Account Management
    ├── Connected Devices (E9)
    ├── Subscription & Billing
    ├── Help & Support
    ├── Privacy & Security
    └── About / Terms / Privacy Policy
```

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Navigation provides equal-weight access to all three pillars
- Pillar tab acts as hub for pillar-specific features

**To Voice & WhatsApp (E2, E3):**
- Channel switcher in top nav enables quick context switching
- Navigation state maintained when returning from other channels

**To Analytics (E10):**
- Insights tab is dedicated gateway to full Analytics Dashboard
- Dashboard insight cards link into Insights tab detail views

### Dependencies
- **E5, E6, E7 (Three Pillars):** Pillar detail screens and features
- **E2 (Voice Coaching):** Voice channel integration and switching
- **E3 (WhatsApp):** WhatsApp channel integration and switching
- **E10 (Analytics Dashboard):** Insights tab content and visualizations
- **F4.6 (Settings):** Profile tab settings screens

### MVP Status
[X] MVP Core

---

## F4.3: DATA VISUALIZATION

### Description
Rich, interactive data visualizations transform complex health metrics into understandable charts, graphs, and visual summaries. Visualizations span all three pillars and include trend lines, correlation charts, heatmaps, progress indicators, and comparative analytics - all designed to reveal patterns and support insight discovery.

### User Story
As an **Optimization Enthusiast** (P3), I want to see my health data visualized in detailed charts and graphs so that I can identify patterns, track progress over time, and understand the relationships between different health metrics.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simplified charts with essential data: single-pillar trend lines (7-day default), basic progress bars for goals, color-coded score indicators, minimal interactivity. Focus on at-a-glance understanding. |
| **Deep** | Advanced visualizations: multi-pillar overlay charts, customizable time ranges (7/30/90/365 days), interactive tooltips with exact values, heatmaps, correlation matrices, exportable chart images, zoom/pan gestures. |

### User Decisions Applied
- **Chart Library:** Use proven React Native charting library (Victory Native or Recharts)
- **Time Range Options:** 7, 30, 90, 365 days + custom date range (Deep mode)
- **Export Capability:** PNG chart export for sharing/records (Deep mode)
- **Accessibility:** Charts include text summaries for screen readers

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Chart load time | <2 seconds for 90 days of data | Performance monitoring |
| Visualization engagement | 60% of users interact with charts weekly | Chart interaction analytics |
| Chart comprehension | 80% users correctly interpret trend direction | User testing surveys |
| Export usage | 30% of Deep mode users export charts monthly | Export action tracking |

### Acceptance Criteria

- [ ] Core chart types supported: Line charts (trends), Bar charts (daily/weekly comparisons), Progress rings (goal completion), Heatmaps (activity patterns), Scatter plots (correlations in E10)
- [ ] All charts render within 2 seconds for 90 days of data
- [ ] Light mode charts: Fixed 7-day view, simplified legends, minimal interactivity
- [ ] Deep mode charts: Time range selector (7/30/90/365/custom), interactive tooltips on tap, zoom/pan gestures, legend filters (show/hide series)
- [ ] Color consistency: Fitness (blue), Nutrition (green), Wellbeing (purple), universal score colors (Green 80-100, Yellow 50-79, Red 0-49)
- [ ] Charts respect dark mode theme with appropriate contrast adjustments
- [ ] ARIA labels and text descriptions for screen reader accessibility
- [ ] Loading state: Skeleton charts during data fetch
- [ ] Empty state: Clear messaging when insufficient data ("Need 7 days of data for trends")
- [ ] Export function (Deep mode): Save chart as PNG with timestamp and legend
- [ ] Charts responsive to device orientation (portrait/landscape)

### Chart Specifications by Use Case

**Dashboard Sparklines (Light Mode):**
- 7-day mini line charts (40px height) for each pillar score
- No axes labels, minimal visual noise
- Color indicates trend direction (green up, red down, gray flat)

**Pillar Detail Charts (Deep Mode):**
- Full-size line charts with axes, gridlines, tooltips
- Multiple series overlay (e.g., sleep duration + quality score)
- Time range selector above chart
- Tap-and-hold for exact values

**Goal Progress Visualization:**
- Circular progress rings (0-100%)
- Color fills based on completion (green >75%, yellow 50-75%, red <50%)
- Center displays percentage and target text

**Activity Heatmaps:**
- 7x24 grid for weekly activity patterns (hour by hour)
- Color intensity indicates activity level
- Used in Fitness pillar for workout timing insights

**Correlation Scatter Plots (E8/E10):**
- X-axis: One metric (e.g., sleep hours), Y-axis: Another metric (e.g., workout performance)
- Each point represents a day
- Trend line shows correlation strength

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for chart** | <3 data points for selected range | Show empty state with guidance | "Need [X] more days of data for this view." |
| **Chart rendering failure** | Rendering exception or timeout | Display text summary as fallback | "Chart unavailable. Summary: [text data]" |
| **Export failure** | Storage permission denied or export error | Retry prompt or permission request | "Unable to save chart. Check storage permissions?" |
| **Data spike anomaly** | Single value >3x standard deviation | Visual indicator + explanation tooltip | "Unusually high value on [date]. Tap to review." |

### Cross-Pillar Connections

**To Fitness (E5):**
- Activity timeline charts, sleep stage breakdowns, recovery trend lines
- Strain/load management charts (weekly strain distribution)

**To Nutrition (E6):**
- Calorie intake trends, macro ratio pie charts, hydration patterns
- Meal timing heatmaps

**To Wellbeing (E7):**
- Mood trend lines, energy level patterns, journaling streak counters
- Stress level heatmaps

**To Cross-Domain Intelligence (E8):**
- Multi-pillar overlay charts (e.g., mood + sleep quality + activity)
- Correlation scatter plots revealing pillar connections

**To Analytics Dashboard (E10):**
- F4.3 provides chart rendering components used by E10
- E10 extends with advanced visualizations (correlation matrices, predictive charts)

### Dependencies
- **E5, E6, E7 (Three Pillars):** Data sources for all charts
- **E8 (Cross-Domain Intelligence):** Multi-pillar data for overlay/correlation charts
- **E10 (Analytics Dashboard):** Advanced chart configurations and insights
- **React Native Charting Library:** Victory Native or Recharts (technical dependency)

### MVP Status
[X] MVP Core

---

## F4.4: PUSH NOTIFICATIONS

### Description
Intelligent push notification system that delivers timely, personalized alerts and coaching prompts to drive engagement, habit formation, and insight discovery. Notifications are contextual, respectful of user preferences, and designed to add value without becoming intrusive or overwhelming.

### User Story
As a **Habit Formation Seeker** (P4), I want to receive gentle reminders and encouraging notifications so that I can build consistent health habits without feeling overwhelmed by constant alerts.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Minimal notifications (1-3/day): Morning check-in reminder, featured daily insight, goal milestone celebrations. Essential only, respectful of attention. |
| **Deep** | Comprehensive notifications (up to 8/day): All Light mode notifications PLUS workout reminders, meal logging prompts, recovery alerts, pattern notifications, coaching nudges, insight releases. User maintains granular control. |

### User Decisions Applied
- **Opt-In by Default:** Notifications enabled during onboarding with clear value explanation
- **Granular Control:** Users can enable/disable by category (reminders, insights, coaching, social)
- **Quiet Hours:** Automatic respect for user's sleep schedule (no notifications during sleep window)
- **Adaptive Timing:** AI learns optimal send times based on user engagement patterns

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Notification opt-in rate | 80% users keep notifications enabled | Settings analytics |
| Notification open rate | 40% average across all notification types | Notification engagement tracking |
| Habit formation impact | 70% increase in check-in consistency vs. no notifications | A/B testing |
| Unsubscribe rate | <10% users disable all notifications | Opt-out tracking |

### Acceptance Criteria

- [ ] Notification categories with individual on/off toggles: Check-in Reminders, Insights & Discoveries, Coaching Nudges, Goal Milestones, Recovery Alerts, Meal/Workout Prompts
- [ ] Quiet hours setting: User defines sleep window (default: 10pm - 7am), no notifications sent during this period
- [ ] Notification frequency cap: Maximum 8 notifications per day (Deep mode), 3 per day (Light mode)
- [ ] Smart timing: AI identifies optimal send times based on user's historical engagement (e.g., send workout reminder when user typically exercises)
- [ ] Notification types implemented:
  - **Check-in Reminder:** "Good morning! How are you feeling today?" (daily, user's preferred time)
  - **Featured Insight:** "New insight: Your best workouts happen after 7+ hours sleep" (when new insight available)
  - **Goal Milestone:** "Congrats! 7-day logging streak achieved!" (immediate on milestone)
  - **Recovery Alert:** "Low recovery today. Consider light activity." (morning, when recovery <50)
  - **Workout Reminder:** "Time for your workout? Here's today's recommendation." (user's typical workout time)
  - **Meal Logging Prompt:** "Don't forget to log dinner!" (if no meal logged by 7pm)
  - **Coaching Nudge:** "Haven't chatted in a while. I'm here if you need support!" (if inactive 3+ days)
- [ ] Deep linking: Tapping notification opens relevant app screen (e.g., insight notification → Insight detail view)
- [ ] Rich notifications: Include images, action buttons (e.g., "Log Now", "View Insight", "Snooze")
- [ ] Notification history: View last 30 days of notifications in Profile > Notifications
- [ ] Platform compliance: iOS APNs, Android FCM integration with token management
- [ ] Notification badge: App icon badge shows unread count (insights, messages)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Notification permission denied** | OS-level permission denied | In-app prompt explaining value, request re-enable | "Enable notifications to stay on track with your health goals." |
| **Push token expiration** | Token refresh failure | Re-register device token on next app open | Silent: automatic recovery |
| **Notification send failure** | FCM/APNs delivery failure | Retry 2x with exponential backoff, log failure | Silent: surface content in-app as fallback |
| **Excessive notification frequency** | User receives >10/day (bug/spam scenario) | Automatic throttle, alert to support team | Silent: protect user experience, investigate |

### Notification Content Guidelines

**Tone & Voice:**
- Encouraging, supportive, never judgmental
- Personalized with user's name when appropriate
- Concise (under 100 characters for preview)
- Actionable ("Log Now", "View Insight", not just informational)

**Examples by Type:**

| Type | Example Message | Timing |
|------|-----------------|--------|
| **Check-in Reminder** | "Good morning, Sarah! Quick mood check? It takes just 30 seconds." | 8am (user's preference) |
| **Insight** | "New discovery: Your energy peaks after morning journaling + breakfast. 🌟" | When insight generated |
| **Goal Milestone** | "Amazing! You've logged meals 14 days straight. Keep it up! 🎉" | Immediate on achievement |
| **Recovery Alert** | "Recovery Score: 42 (Low). Your body needs rest today. Try gentle yoga?" | 7am (if recovery <50) |
| **Workout Reminder** | "Workout time! Today's rec: 30-min moderate cardio. Ready? 💪" | 6pm (user's typical time) |
| **Meal Prompt** | "Dinner logged yet? Quick photo or manual entry - your choice! 📸" | 7pm (if not logged) |
| **Coaching Nudge** | "Hey! Haven't heard from you in 3 days. Everything okay? I'm here to help." | Day 3 of inactivity |

### Cross-Pillar Connections

**To Fitness (E5):**
- Recovery alert notifications based on Physical/Mental Recovery Scores
- Workout reminder notifications based on user's workout schedule and preferences

**To Nutrition (E6):**
- Meal logging reminder notifications if meals not logged by typical times
- Hydration reminder notifications if water intake below daily goal

**To Wellbeing (E7):**
- Morning check-in reminder for mood/energy/journaling
- Habit streak celebration notifications

**To Cross-Domain Intelligence (E8):**
- Insight notifications when new cross-pillar correlations discovered
- Pattern alert notifications (e.g., "3 consecutive low-sleep, low-mood days detected")

**To Voice & WhatsApp (E2, E3):**
- Notification option: "Reply via WhatsApp" action button
- Voice coaching nudge notifications

### Dependencies
- **iOS APNs & Android FCM:** Platform notification services (technical dependency)
- **E5, E6, E7 (Three Pillars):** Data sources for notification triggers
- **E8 (Cross-Domain Intelligence):** Insight generation for insight notifications
- **E2 (Voice Coaching):** Coaching nudge triggers
- **User Preferences Database:** Notification settings storage

### MVP Status
[X] MVP Core

---

## F4.5: OFFLINE MODE

### Description
Comprehensive offline functionality that allows users to continue using core app features (view dashboard, log data, read insights) without internet connection. Offline entries are queued locally and automatically sync when connectivity is restored, ensuring seamless experience regardless of network availability.

### User Story
As a **Busy Professional** (P2), I want to log my meals and mood even when I'm on a flight or in areas with poor connectivity so that I can maintain my tracking habits without interruption.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Basic offline functionality: View cached dashboard (last 7 days), log mood/meals/activity with simple text entries, view cached insights. Queue syncs automatically on reconnect. |
| **Deep** | Advanced offline capabilities: Full 7-day data cache, queue any entry type (including journaling), view full analytics (cached), export data offline, manual sync trigger. Conflict resolution UI for complex cases. |

### User Decisions Applied
- **7-Day Cache Window:** Store last 7 days of data locally (100MB max)
- **Auto-Sync on Reconnect:** Automatic background sync when connection restored
- **Conflict Resolution:** User-choice interface when offline edits conflict with server changes
- **Storage Management:** Automatic cache clearing of old data to stay within 100MB limit

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Offline usage rate | 40% of users use app offline at least once/month | Offline mode analytics |
| Sync success rate | >95% of queued entries sync without conflict | Sync monitoring |
| Offline data completeness | 90% of dashboard data available offline | Cache coverage analytics |
| User satisfaction with offline mode | 4.3/5 rating | In-app survey |

### Acceptance Criteria

- [ ] Offline detection: App automatically detects network status and displays offline indicator (top banner)
- [ ] Cached data includes: Dashboard data (7 days), Pillar summaries (7 days), Insights (last 20), Goals & progress, Settings & preferences, User profile
- [ ] Offline-capable features: View dashboard (cached data with timestamp), Log mood check-ins (queued), Log meals (text entry, no photo AI - processed on sync), Log activities (manual entry), Read cached insights, View goals and progress, Browse settings
- [ ] Offline-restricted features (graceful degradation): Voice coaching → "Voice requires internet. Try again when online.", WhatsApp integration → "WhatsApp requires internet.", Photo meal logging → "Photo analysis available when online. Add text description?", Wearable sync → "Wearable data will sync when online.", Real-time insights → "New insights will load when online."
- [ ] Queue management: All offline entries timestamped and queued locally, Queue stored in secure local storage (encrypted), Queue displays in settings with entry count, Manual "Sync Now" button available
- [ ] Sync behavior on reconnect: Automatic sync triggered within 30 seconds of connection restoration, Chronological sync order (oldest entries first), Progress indicator during sync, Completion notification: "Synced [X] entries"
- [ ] Conflict resolution: Detect conflicts (offline edit + server change on same data), Present user with conflict resolution UI: "Keep offline version", "Use server version", "Merge (if applicable)", User choice saves permanently, no data loss
- [ ] Storage allocation: Maximum 100MB local storage (50MB data cache + 20MB queued entries + 20MB conversation history + 10MB insights), Automatic cleanup of data older than 7 days, Warning if storage approaching limit
- [ ] Offline indicator: Persistent top banner when offline: "Offline Mode - Data will sync when online", Banner dismissible but reappears on new screen navigation

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Sync conflict detected** | Server data changed while offline | Conflict resolution UI | "We found changes. Keep your version or sync with latest?" |
| **Sync failure** | Network error during sync | Retry 3x with exponential backoff | "Sync failed. Will retry automatically when connection improves." |
| **Storage quota exceeded** | Cache approaching 100MB limit | Auto-clear oldest data, notify user | "Storage full. Cleared older cached data to make room." |
| **Corrupted local data** | Data integrity check fails | Clear corrupted cache, re-download on reconnect | "Cache error detected. Data will refresh when online." |
| **Long offline period (>7 days)** | Last sync >7 days ago | Flag stale data, prioritize full re-sync | "Data from [date]. Connecting to refresh all data." |

### Offline Mode Technical Specifications

**Local Storage Allocation (100MB Total):**
```
├── Dashboard Data (50MB max)
│   ├── 7-day pillar scores and summaries
│   ├── Recent activity logs
│   └── Goal progress data
│
├── Queued Entries (20MB max)
│   ├── Mood check-ins
│   ├── Meal logs (text only, photos queued for upload)
│   ├── Activity logs
│   └── Journal entries
│
├── Conversation History (20MB max)
│   ├── Last 30 days of WhatsApp conversations
│   └── Voice call transcripts
│
└── Insights Cache (10MB max)
    ├── Last 20 featured insights
    └── Recent trend visualizations
```

**Sync Priority Queue:**
1. User-generated entries (mood, meals, journaling) - Highest priority
2. User actions (goal updates, preferences) - High priority
3. Analytics/usage data - Medium priority
4. Non-critical metadata - Low priority

**Offline vs. Online Feature Matrix:**

| Feature | Offline | Online |
|---------|---------|--------|
| View Dashboard | ✅ (cached, 7 days) | ✅ (real-time) |
| Log Mood | ✅ (queued) | ✅ (instant) |
| Log Meal (text) | ✅ (queued) | ✅ (instant) |
| Log Meal (photo) | ❌ (prompt for text) | ✅ (AI analysis) |
| Log Activity (manual) | ✅ (queued) | ✅ (instant) |
| View Insights | ✅ (cached, last 20) | ✅ (real-time, all) |
| Voice Coaching | ❌ (requires connection) | ✅ |
| WhatsApp | ❌ (requires connection) | ✅ |
| Wearable Sync | ❌ (requires connection) | ✅ |
| Data Visualization | ✅ (cached data) | ✅ (full data) |
| Settings | ✅ (view/edit, queued) | ✅ (instant save) |
| Goal Management | ✅ (view/edit, queued) | ✅ (instant save) |

### Cross-Pillar Connections

**To All Pillars (E5, E6, E7):**
- Offline logging capability for all three pillars (mood, meals, activity)
- Cached pillar data accessible offline for 7 days

**To Data Integrations (E9):**
- Wearable sync disabled offline, resumes on reconnect
- Manual data entry available as offline fallback

**To Analytics Dashboard (E10):**
- Cached insights and visualizations available offline
- New analytics require online connection

### Dependencies
- **Local Storage API:** React Native AsyncStorage or SecureStore for encrypted local storage
- **Network Detection:** NetInfo library for connection monitoring
- **Sync Engine:** Custom background sync service
- **E5, E6, E7 (Three Pillars):** Data logging interfaces
- **Backend API:** Sync endpoints with conflict resolution support

### MVP Status
[X] MVP Core

---

## F4.6: SETTINGS & PREFERENCES

### Description
Comprehensive settings and preferences management that gives users granular control over their yHealth experience, including notification preferences, data & privacy settings, channel configurations, display options, account management, and app behavior customizations. Settings respect user autonomy while providing sensible defaults.

### User Story
As a **Holistic Health Seeker** (P1), I want to customize my app experience, notification preferences, and privacy settings so that yHealth works exactly the way I want it to without compromising my data security.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Essential settings only: Notification on/off toggles by category, basic privacy controls, account email/password, connected devices list, light/dark theme toggle. Minimal configuration burden. |
| **Deep** | Comprehensive settings: All Light mode settings PLUS granular notification timing, data export/delete, advanced privacy controls, channel preferences, display customizations, goal defaults, coaching tone adjustments, data sync frequency. |

### User Decisions Applied
- **Smart Defaults:** Pre-configured settings optimized for typical user (can be overridden)
- **Privacy-First:** Clear data controls, transparent about what's collected and why
- **Grouped Organization:** Settings organized into logical categories for easy navigation
- **Search Functionality:** Deep mode includes settings search (too many options to browse)

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Settings engagement | 80% of users access settings at least once | Settings page analytics |
| Customization adoption | 60% of users modify at least 3 settings | Settings modification tracking |
| Privacy control usage | 70% of users review privacy settings | Privacy settings view tracking |
| Settings satisfaction | 4.5/5 rating for settings organization | User feedback surveys |

### Acceptance Criteria

- [ ] Settings organized into categories: Notifications, Privacy & Data, Account, Connected Devices, Display & Accessibility, Channels (Voice/WhatsApp), Goals & Coaching, About & Support
- [ ] **Notifications Settings:**
  - [ ] Master on/off toggle
  - [ ] Category toggles: Check-in Reminders, Insights, Coaching Nudges, Goal Milestones, Recovery Alerts, Meal/Workout Prompts
  - [ ] Quiet Hours: Start time, End time
  - [ ] Notification frequency: Light (1-3/day), Deep (up to 8/day)
  - [ ] Deep mode: Granular timing per notification type
- [ ] **Privacy & Data Settings:**
  - [ ] Data sharing preferences: Anonymous analytics (on/off), Product improvement research (on/off)
  - [ ] Data retention: Auto-delete data older than [1 year / 2 years / Never]
  - [ ] Data export: Request full data export (ZIP with JSON/CSV)
  - [ ] Data deletion: Delete my account (14-day cooling-off period, Section 13 PRD)
  - [ ] Deep mode: Granular consent per data category (fitness, nutrition, wellbeing, AI training)
- [ ] **Account Settings:**
  - [ ] Profile: Name, Email, Date of Birth, Profile Picture
  - [ ] Password: Change password
  - [ ] Phone: WhatsApp number (for E3 integration)
  - [ ] Subscription: View plan, Upgrade/Downgrade, Billing history, Cancel subscription
- [ ] **Connected Devices (E9 Integration):**
  - [ ] List of connected wearables/apps (WHOOP, Apple Health, Fitbit, etc.)
  - [ ] Connect new device button (OAuth flow)
  - [ ] Disconnect device option (per device)
  - [ ] Sync status indicator (last synced time)
  - [ ] Preferred device priority (for conflict resolution)
- [ ] **Display & Accessibility:**
  - [ ] Theme: Light, Dark, Auto (follow system)
  - [ ] Text size: Small, Medium, Large, Extra Large
  - [ ] Reduce motion: On/Off (for users sensitive to animations)
  - [ ] Color blind mode: Protanopia, Deuteranopia, Tritanopia, None
  - [ ] Screen reader optimizations: On/Off (enhances VoiceOver/TalkBack support)
  - [ ] Deep mode: Chart type preferences, dashboard widget customization
- [ ] **Channels (Voice/WhatsApp):**
  - [ ] Preferred interaction channel: Mobile App, WhatsApp, Voice, No preference
  - [ ] Voice coaching: Scheduled call times, On-demand availability
  - [ ] WhatsApp: Opt-in/opt-out, preferred message frequency
- [ ] **Goals & Coaching:**
  - [ ] Default goal preferences: Fitness focus, Nutrition focus, Wellbeing focus, Balanced
  - [ ] Coaching tone: Supportive, Motivational, Direct, Gentle
  - [ ] Flexibility mode default: Light, Deep
  - [ ] Deep mode: Goal difficulty preference (conservative, moderate, aggressive)
- [ ] **About & Support:**
  - [ ] App version and build number
  - [ ] Terms of Service (link)
  - [ ] Privacy Policy (link)
  - [ ] Help & Support (contact form, FAQs)
  - [ ] Send Feedback (in-app feedback form)
  - [ ] Rate the App (link to App Store/Play Store)
  - [ ] Logout
- [ ] Settings search (Deep mode): Keyword search across all settings labels
- [ ] Settings changes save immediately (no "Save" button required)
- [ ] Settings sync across devices (if user has multiple devices)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Settings save failure** | API error during save | Retry 2x, then queue for sync on reconnect | "Settings saved offline. Will sync when online." |
| **Invalid setting value** | Validation error (e.g., quiet hours end before start) | Highlight error, prevent save | "Quiet hours end time must be after start time." |
| **Device disconnect failure** | OAuth revocation fails | Retry with timeout, manual disconnect option | "Disconnect failed. Try again or contact support." |
| **Data export timeout** | Export takes >5 minutes | Background processing, email when ready | "Your data export is processing. We'll email a download link." |
| **Account deletion confirmation** | User initiates delete | 14-day cooling-off period prompt | "Deleting your account is permanent. You have 14 days to cancel." |

### Settings Screen UI/UX Specifications

**Light Mode Settings (Essential Only):**
```
Settings
├── Notifications
│   ├── Enable Notifications [Toggle]
│   └── Quiet Hours [Time Range Picker]
│
├── Privacy
│   ├── Anonymous Analytics [Toggle]
│   └── Data Export [Button]
│
├── Account
│   ├── Email [Text Field]
│   ├── Password [Change Password Link]
│   └── Subscription [View Plan Link]
│
├── Connected Devices
│   └── [List of Devices with Connect/Disconnect]
│
├── Display
│   ├── Theme [Light / Dark / Auto]
│   └── Text Size [Slider]
│
└── About
    ├── Help & Support [Link]
    ├── Privacy Policy [Link]
    └── Logout [Button]
```

**Deep Mode Settings (All Options):**
- All Light mode settings PLUS:
- Granular notification timing controls
- Per-category data consent toggles
- Advanced display customizations (color blind modes, reduce motion)
- Channel preference details
- Goal defaults and coaching tone
- Settings search bar

### Cross-Pillar Connections

**To Notifications (F4.4):**
- Settings control all notification preferences and quiet hours
- Notification frequency caps configured here

**To Accessibility (F4.7):**
- Display & Accessibility settings drive accessibility features
- Theme, text size, color blind mode, screen reader optimizations

**To Data Integrations (E9):**
- Connected Devices section manages wearable OAuth connections
- Device priority hierarchy set here

**To Privacy/Security:**
- Data export, deletion, consent management
- Aligns with GDPR Right to Erasure and Portability (PRD Section 13)

### Dependencies
- **Backend Settings API:** Save/retrieve user preferences
- **OAuth Providers (E9):** Device connection/disconnection flows
- **Data Export Service:** Generate user data archives
- **Account Management Service:** Password changes, account deletion
- **F4.4 (Push Notifications):** Notification preference enforcement
- **F4.7 (Accessibility):** Accessibility setting application

### MVP Status
[X] MVP Core

---

## F4.7: ACCESSIBILITY FEATURES

### Description
Comprehensive accessibility implementation ensuring yHealth is usable by people with visual, auditory, motor, and cognitive disabilities. Adheres to WCAG 2.1 Level AA standards with features including screen reader support, color contrast compliance, alternative input methods, and cognitive load reduction options.

### User Story
As a **user with visual impairment**, I want to use yHealth with my screen reader (VoiceOver/TalkBack) so that I can track my health independently with full feature access.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Core accessibility features: WCAG 2.1 AA color contrast, minimum touch targets (44x44pt), screen reader labels, keyboard navigation support. Baseline compliance. |
| **Deep** | Advanced accessibility: All Light mode features PLUS customizable text scaling (up to 200%), color blind modes (3 types), reduced motion option, enhanced focus indicators, audio feedback, haptic feedback. |

### User Decisions Applied
- **WCAG 2.1 Level AA Compliance:** Mandatory baseline for all users
- **Platform Standards:** Follow iOS Human Interface Guidelines and Android Material Design accessibility specs
- **User Testing:** Include users with disabilities in beta testing program
- **Accessibility Settings:** Configurable via F4.6 (Settings & Preferences)

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| WCAG 2.1 AA compliance | 100% of screens pass automated testing | Axe DevTools automated scans |
| Screen reader usability | 4.5/5 rating from screen reader users | User testing with blind/low-vision users |
| Color contrast pass rate | 100% of text/UI elements pass 4.5:1 ratio | Automated contrast checking |
| Touch target compliance | 100% of interactive elements ≥44x44pt | Manual UI audit |

### Acceptance Criteria

**Visual Accessibility:**
- [ ] Color contrast: Minimum 4.5:1 for normal text (<18pt), 3:1 for large text (≥18pt or ≥14pt bold)
- [ ] Color independence: Never use color alone to convey information (icons/text accompany all color indicators)
- [ ] Text scaling: Support up to 200% text zoom without loss of functionality
- [ ] Dark mode: Full dark theme with appropriate contrast (tested separately for WCAG compliance)
- [ ] Focus indicators: Visible 2px solid outline (high contrast) on all interactive elements during keyboard/switch navigation
- [ ] Color blind modes: Protanopia (red-blind), Deuteranopia (green-blind), Tritanopia (blue-blind) with adjusted color palettes

**Screen Reader Support:**
- [ ] All interactive elements have descriptive labels (ARIA labels for web views, accessibility labels for native)
- [ ] Charts and graphs include text summaries (e.g., "Fitness score decreased 5 points from 80 to 75 over the last 7 days")
- [ ] Progress indicators announce percentage (aria-valuenow, aria-valuemin, aria-valuemax)
- [ ] Dynamic content announces updates (aria-live="polite" for non-critical, "assertive" for alerts)
- [ ] Logical heading hierarchy (H1-H6 structure for web views)
- [ ] Modals trap focus and announce (role="dialog", aria-modal="true")
- [ ] Tested with VoiceOver (iOS), TalkBack (Android), and NVDA (web fallback)

**Motor Accessibility:**
- [ ] Touch targets: Minimum 44x44pt tap targets for all interactive elements (buttons, links, inputs)
- [ ] Gesture alternatives: Single-tap alternatives for all swipe gestures (e.g., swipe to delete → delete button)
- [ ] Timeout extensions: Configurable session timeouts (users can extend or disable)
- [ ] One-handed use optimization: Key actions reachable with thumb in portrait mode (bottom navigation, primary CTAs)
- [ ] Switch Control support (iOS) and Switch Access (Android): Full app navigation via external switches
- [ ] Voice Control support (iOS): Voice commands for navigation and data entry

**Cognitive Accessibility:**
- [ ] Reduce motion option: Disable animations and transitions when enabled (respects OS-level preference + in-app toggle)
- [ ] Simplified language: Avoid jargon, use plain language, provide tooltips for technical terms
- [ ] Consistent navigation: Navigation patterns consistent across all screens
- [ ] Clear error messages: Descriptive errors with actionable recovery steps (avoid generic "Error occurred")
- [ ] Progress indicators: Visual feedback for all loading states (skeleton screens, spinners with text)
- [ ] Confirmation prompts: Clear confirmations for destructive actions (delete, cancel subscription)

**Auditory Accessibility:**
- [ ] Voice coaching transcription: Real-time text transcription of AI speech during voice calls (deaf/hard-of-hearing accommodation)
- [ ] Text input alternative: "Type your response" option during voice coaching sessions
- [ ] Visual alerts: All audio alerts have visual equivalents (e.g., notification badge + banner)
- [ ] Captions: Any video content (future exercise demos) includes captions

**Additional Accessibility Features:**
- [ ] Haptic feedback: Tactile feedback for key interactions (button taps, completion celebrations) - configurable
- [ ] Audio feedback: Optional audio cues for interactions (useful for blind users) - configurable
- [ ] Skip links: "Skip to main content" for keyboard users (web views)
- [ ] Keyboard navigation: Full app navigation via keyboard (Bluetooth keyboard support on mobile)

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Screen reader announcement failure** | Accessibility label missing | Fallback to placeholder text or element type | "Button" (generic, not ideal but functional) |
| **Color contrast failure** | Automated testing flags low contrast | Manual review and fix, temporary override with warning | Developer alert: "Contrast issue on [screen]" |
| **Touch target too small** | UI audit identifies <44pt target | Increase target size or add padding to hit area | Silent: fix in next release |
| **Voice Control command not recognized** | User's voice command doesn't match | Suggest alternative command | "Try 'tap [element name]' instead." |

### Accessibility Testing Requirements

**Automated Testing:**
- [ ] Axe DevTools integration in CI/CD pipeline (catches 30-40% of issues)
- [ ] Color contrast checker on all screens (Figma plugin or programmatic)
- [ ] Touch target size validation (custom script)

**Manual Testing:**
- [ ] VoiceOver testing (iOS): Navigate entire app with VoiceOver on, screen off
- [ ] TalkBack testing (Android): Navigate entire app with TalkBack on, screen off
- [ ] Keyboard-only navigation: Complete key user flows without touching screen
- [ ] Color blindness simulation: Test all screens with color blind filters
- [ ] Reduced motion: Verify animations disabled when Reduce Motion enabled

**User Testing:**
- [ ] Beta testing with users who have disabilities (blind, low vision, motor impairment, cognitive disabilities)
- [ ] Accessibility consultant review (external audit)
- [ ] Quarterly accessibility audits (ongoing)

### WCAG 2.1 Level AA Compliance Checklist

**Perceivable:**
- [ ] Text alternatives for non-text content (images, icons, charts)
- [ ] Captions for audio content (voice coaching transcripts)
- [ ] Color not used as the only visual means of conveying information
- [ ] Text contrast ratio ≥4.5:1 (normal), ≥3:1 (large)
- [ ] Text resizable up to 200% without loss of content or functionality

**Operable:**
- [ ] All functionality available via keyboard
- [ ] No keyboard trap (focus can move away from any element)
- [ ] Adjustable time limits (session timeouts can be extended)
- [ ] Pause, stop, or hide moving content (animations, auto-updates)
- [ ] Three flashes or below threshold (no seizure-inducing content)
- [ ] Descriptive page titles and headings
- [ ] Visible focus indicator
- [ ] Multiple ways to navigate (navigation bar, search, breadcrumbs in web views)

**Understandable:**
- [ ] Language of page identified programmatically
- [ ] Predictable navigation and functionality
- [ ] Clear input assistance and error messages
- [ ] Error prevention for destructive actions (confirmations)

**Robust:**
- [ ] Compatible with current and future assistive technologies
- [ ] Valid HTML/accessibility markup (web views)
- [ ] Status messages announced to screen readers

### Cross-Pillar Connections

**To Settings (F4.6):**
- Accessibility settings configured in Display & Accessibility section
- Theme, text size, color blind mode, reduce motion, screen reader optimizations

**To Data Visualization (F4.3):**
- Charts include text summaries for screen readers
- Alternative data views for users who can't interpret visual charts

**To Notifications (F4.4):**
- Notifications have visual and auditory options
- Screen reader announces notification content

**To Voice Coaching (E2):**
- Real-time transcription for deaf/hard-of-hearing users
- Text input alternative for speech-impaired users

### Dependencies
- **React Native Accessibility APIs:** Accessibility props, screen reader support
- **Platform Accessibility Services:** VoiceOver (iOS), TalkBack (Android), Switch Control, Voice Control
- **Axe DevTools or similar:** Automated accessibility testing library
- **F4.6 (Settings):** Accessibility preference storage and application
- **Design System:** Accessible component library with built-in compliance

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 7 mobile app features functional across Light and Deep modes
- [ ] Dashboard loads in <3 seconds with three-pillar overview (F4.1)
- [ ] Navigation supports seamless movement between pillars and channels (F4.2)
- [ ] Data visualizations render within 2 seconds for 90 days of data (F4.3)
- [ ] Push notifications deliver with 40% open rate and respect quiet hours (F4.4)
- [ ] Offline mode caches 7 days of data and syncs successfully on reconnect (F4.5)
- [ ] Settings provide granular control over notifications, privacy, display, and channels (F4.6)
- [ ] Accessibility features achieve WCAG 2.1 Level AA compliance (F4.7)
- [ ] Cross-platform parity: iOS and Android feature-identical (platform-specific UI patterns respected)
- [ ] Error handling graceful for all failure scenarios across features
- [ ] App size <100MB (download size), <500MB with full data cache

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Performance** | Dashboard <3s load, Charts <2s render, Notification delivery <5s | Performance monitoring |
| **Reliability** | 99.5% crash-free users, <1% ANR (Application Not Responding) rate | Crash analytics (Firebase Crashlytics) |
| **Accessibility** | 100% WCAG 2.1 AA compliance, 4.5/5 screen reader usability | Automated testing + user testing |
| **User Satisfaction** | 4.5/5 App Store/Play Store rating | Store reviews monitoring |
| **Offline Functionality** | 95% sync success rate, 90% cached data completeness | Offline analytics |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Views unified three-pillar dashboard and discovers cross-domain insights | 80% engage with dashboard insights daily |
| **P2: Busy Professional** | Quick check-ins via Light mode, notifications keep habits consistent | 70% use Light mode, 85% notification engagement |
| **P3: Optimization Enthusiast** | Deep dives into charts, exports data, customizes settings extensively | 60% use Deep mode features 3+ times/week |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- Onboarding sets Light/Deep mode preference, applied across all mobile app features
- Initial dashboard configuration based on onboarding choices

### E2: Voice Coaching
- Mobile app provides "Start Voice Coaching" quick action on dashboard
- Navigation includes channel switcher to Voice
- Voice call history accessible via Profile tab

### E3: WhatsApp Integration
- Mobile app provides "Open WhatsApp" quick action on dashboard
- Navigation includes channel switcher to WhatsApp
- WhatsApp conversation history mirrored in app (read-only)

### E5: Fitness Pillar
- Dashboard displays Fitness Pillar score and today's activity summary
- Pillars > Fitness navigation accesses all fitness features
- Fitness data visualizations (activity charts, sleep stages, recovery trends)

### E6: Nutrition Pillar
- Dashboard displays Nutrition Pillar score and today's meals/macros
- Pillars > Nutrition navigation accesses all nutrition features
- Nutrition data visualizations (calorie trends, macro breakdowns, hydration)

### E7: Wellbeing Pillar
- Dashboard displays Wellbeing Pillar score and today's mood/energy
- Pillars > Wellbeing navigation accesses all wellbeing features
- Wellbeing data visualizations (mood trends, journaling streaks, stress heatmaps)

### E8: Cross-Domain Intelligence
- Dashboard features cross-domain insight cards generated by E8 AI
- Multi-pillar overlay charts in F4.3 powered by E8 correlation engine
- Notifications include pattern alerts from E8

### E9: Data Integrations
- Settings > Connected Devices manages wearable OAuth connections
- Dashboard displays real-time sync status from integrations
- Offline mode handles wearable sync resumption

### E10: Analytics & Insights Dashboard
- Insights tab in navigation is dedicated gateway to E10
- Dashboard insight cards link to full E10 Analytics Dashboard
- F4.3 visualization components reused in E10

---

## TECHNICAL CONSIDERATIONS

### Technology Stack (Mobile App)

**Framework:** React Native (iOS + Android from single codebase)
- Justification: Faster development (55% AI productivity gains + cross-platform reuse), large ecosystem, proven at scale

**State Management:** Redux Toolkit with Redux Persist
- Global app state (user data, settings, auth)
- Offline data persistence

**Navigation:** React Navigation v6
- Bottom tab navigator (primary)
- Stack navigators (drill-down flows)
- Drawer navigator (Deep mode advanced features)

**UI Component Library:** React Native Paper (Material Design) or React Native Elements
- Pre-built accessible components
- Theming support (light/dark)

**Charts/Visualizations:** Victory Native or Recharts
- Line charts, bar charts, pie charts, scatter plots
- Customizable, performant, accessible

**Notifications:** Firebase Cloud Messaging (FCM) + Apple Push Notification Service (APNs)
- Cross-platform push notification delivery
- Rich notifications (images, action buttons)

**Offline Storage:** AsyncStorage (simple data) + SQLite (complex queries, large datasets)
- 100MB local cache with encryption

**Network Layer:** Axios with retry logic + React Query for caching
- API client with automatic retries, caching, background sync

**Accessibility:** React Native Accessibility APIs + react-native-accessibility-info
- Screen reader support, accessibility labels, dynamic type

**Error Tracking:** Sentry or Firebase Crashlytics
- Real-time crash reporting, performance monitoring

**Analytics:** Firebase Analytics + Segment (optional multi-platform analytics)
- User behavior tracking, feature engagement

**Authentication:** Secure token storage (Keychain for iOS, Keystore for Android)
- OAuth token management for wearable integrations

### Data Models (Mobile App Specific)

**Local Cache Schema (SQLite):**

```sql
-- Dashboard Cache
CREATE TABLE dashboard_cache (
  user_id TEXT PRIMARY KEY,
  fitness_score INTEGER,
  nutrition_score INTEGER,
  wellbeing_score INTEGER,
  today_summary JSON,
  featured_insights JSON,
  last_updated TIMESTAMP
);

-- Offline Queue
CREATE TABLE offline_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action_type TEXT, -- 'log_mood', 'log_meal', 'log_activity', etc.
  payload JSON,
  timestamp TIMESTAMP,
  synced BOOLEAN DEFAULT 0
);

-- Settings Cache
CREATE TABLE settings_cache (
  user_id TEXT PRIMARY KEY,
  notification_prefs JSON,
  display_prefs JSON,
  privacy_prefs JSON,
  channel_prefs JSON,
  last_updated TIMESTAMP
);

-- Insights Cache
CREATE TABLE insights_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  insight_type TEXT,
  content JSON,
  created_at TIMESTAMP
);
```

### API Endpoints (Mobile App Backend)

```
# Dashboard
GET    /api/v1/mobile/dashboard              - Get unified dashboard data
GET    /api/v1/mobile/dashboard/refresh      - Force refresh all data

# Notifications
POST   /api/v1/mobile/notifications/register - Register FCM/APNs token
PUT    /api/v1/mobile/notifications/settings - Update notification preferences
GET    /api/v1/mobile/notifications/history  - Get notification history

# Settings
GET    /api/v1/mobile/settings               - Get all user settings
PUT    /api/v1/mobile/settings               - Update settings (bulk)
PUT    /api/v1/mobile/settings/{category}    - Update specific category

# Offline Sync
POST   /api/v1/mobile/sync/upload            - Upload queued offline entries
GET    /api/v1/mobile/sync/conflicts         - Get sync conflicts for resolution
POST   /api/v1/mobile/sync/resolve           - Resolve sync conflict

# Data Export
POST   /api/v1/mobile/export/request         - Request data export (async)
GET    /api/v1/mobile/export/status/{id}     - Check export status
GET    /api/v1/mobile/export/download/{id}   - Download export file

# App Metadata
GET    /api/v1/mobile/config                 - Get app configuration (feature flags, etc.)
GET    /api/v1/mobile/version                - Get minimum supported app version
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Dashboard load (cached) | <1 second | Near-instant for cached data |
| Dashboard load (network) | <3 seconds | Acceptable for real-time data fetch |
| Chart rendering | <2 seconds | Smooth visualization experience |
| Settings save | <1 second | Instant feedback for user actions |
| Offline queue sync | <30 seconds | Background sync without blocking UI |
| Notification delivery | <5 seconds | Timely alerts for engagement |
| App cold start | <4 seconds | Acceptable initial load time |

### Security & Privacy

- **Data Encryption:** All local data encrypted at rest (SQLite Encryption Extension or SecureStore)
- **Token Security:** Auth tokens stored in platform secure storage (Keychain/Keystore)
- **Network Security:** TLS 1.3 for all API calls, certificate pinning
- **Privacy Compliance:** GDPR Right to Erasure and Portability via data export/delete
- **Biometric Auth:** Optional Face ID/Touch ID (iOS), Fingerprint/Face Unlock (Android)
- **Session Management:** Auto-logout after 30 days inactivity, configurable in settings

---

## COMPETITIVE ANALYSIS (MOBILE APP)

### Feature Parity Matrix

| Feature | BEVEL | WHOOP | MyFitnessPal | yHealth | Differentiation |
|---------|-------|-------|--------------|---------|-----------------|
| **Unified Dashboard** | ✅ Customizable | ✅ Recovery-focused | ✅ Calorie-focused | ✅ **Three-Pillar Equal** | Only platform with equal fitness + nutrition + wellbeing |
| **Data Visualization** | ✅ Advanced | ✅ Advanced | ✅ Basic | ✅ **Multi-Pillar Overlay** | Cross-domain charts (mood + sleep + activity) |
| **Offline Mode** | ✅ 7-day cache | ✅ Limited | ✅ Basic | ✅ **Full 7-day + Queue** | Comprehensive offline with conflict resolution |
| **Push Notifications** | ✅ Basic | ✅ Recovery alerts | ✅ Meal reminders | ✅ **Adaptive Frequency** | AI-optimized timing, Light/Deep modes |
| **Accessibility** | ⚠️ Partial | ⚠️ Partial | ⚠️ Basic | ✅ **WCAG 2.1 AA** | Full compliance, screen reader optimized |
| **Multi-Channel** | ❌ App only | ❌ App only | ❌ App only | ✅ **App + Voice + WhatsApp** | Unique multi-channel unified experience |
| **Settings Depth** | ✅ Good | ✅ Good | ✅ Basic | ✅ **Light/Deep Modes** | Adaptive settings complexity |

### yHealth's Mobile App Moat

**What We Do Better:**
1. **Three-Pillar Dashboard:** Only app treating fitness, nutrition, and wellbeing with true equality
2. **Multi-Channel Integration:** Seamless switching between app, voice, and WhatsApp
3. **Offline-First Design:** 7-day cache + queue + conflict resolution exceeds competitors
4. **Adaptive Complexity:** Light/Deep modes respect user preference for simplicity or depth
5. **Cross-Domain Visualizations:** Charts overlaying mood + sleep + activity (impossible in single-pillar apps)
6. **WCAG 2.1 AA Compliance:** Industry-leading accessibility (most competitors WCAG partial)

**Where We Match (Feature Parity):**
- Dashboard customization (BEVEL has this)
- Data visualizations (WHOOP, BEVEL have advanced charts)
- Goal tracking (common feature)
- Settings management (standard)

**Strategic Positioning:**
> "BEVEL and WHOOP give you dashboards. MyFitnessPal gives you nutrition tracking. yHealth gives you YOUR WHOLE SELF - fitness, nutrition, and wellbeing unified in one intelligent app that adapts to how YOU want to engage."

---

## TESTING STRATEGY

### Unit Testing
- Dashboard data formatting logic (score calculations, summary generation)
- Offline queue management (enqueue, dequeue, conflict detection)
- Settings validation (quiet hours, notification frequency caps)
- Chart data transformation (API response → chart-ready format)

### Integration Testing
- Dashboard API integration (fetch, parse, display)
- Offline sync flow (queue upload, conflict resolution)
- Notification delivery (FCM/APNs token registration, push receipt)
- Settings persistence (save, retrieve, sync across devices)
- Navigation state management (deep linking, back button, tab switching)

### UI/UX Testing
- Light vs. Deep mode rendering (visual regression testing)
- Accessibility compliance (automated axe-core scans, manual screen reader testing)
- Responsive layouts (multiple device sizes, orientations)
- Animation performance (reduce motion respects setting)
- Touch target sizes (44x44pt minimum validation)

### Performance Testing
- Dashboard load time with varying data sizes (1 day, 7 days, 90 days)
- Chart rendering performance (1000+ data points)
- Offline cache size limits (100MB quota enforcement)
- Memory usage monitoring (prevent leaks, OOM crashes)
- Battery impact testing (background sync, location services)

### Platform-Specific Testing
- iOS: VoiceOver navigation, Dynamic Type support, Face ID/Touch ID, iPad layout
- Android: TalkBack navigation, Material Design adherence, Fingerprint auth, various screen sizes

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Platform API changes** | High | Medium | Abstract platform dependencies, maintain fallback implementations |
| **Performance on low-end devices** | High | Medium | Performance budgets, progressive feature loading, device capability detection |
| **Offline sync conflicts frequent** | Medium | High | Clear conflict resolution UI, user education, conservative conflict detection |
| **Notification fatigue** | High | High | Adaptive frequency, granular controls, usage analytics to optimize timing |
| **Accessibility audit failure** | Critical | Low | Continuous automated testing, quarterly external audits, user testing with disabled users |
| **App store rejection** | High | Low | Pre-submission compliance review, privacy policy clarity, content moderation |
| **React Native framework limitations** | Medium | Medium | Hybrid approach (native modules for critical features), monitor RN roadmap |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 7 features (F4.1-F4.7) as defined above

### Post-MVP v1.1 (+3 months)
- **iPad/Tablet Optimization:** Landscape layouts, split-view support, Apple Pencil for journaling
- **Widget Support:** iOS Home Screen widgets, Android home screen widgets (dashboard summary, quick actions)
- **Apple Watch / Wear OS Companion App:** Glanceable health scores, quick logging, workout tracking
- **Siri Shortcuts / Google Assistant Actions:** Voice commands for logging ("Hey Siri, log my mood in yHealth")

### Post-MVP v1.2 (+6 months)
- **Advanced Personalization:** AI-customized dashboard layout based on user behavior
- **Social Features:** Share insights with friends, challenges, leaderboards (if demand validated)
- **3D Touch / Haptic Feedback Enhancements:** Contextual haptics for celebrations, alerts
- **Video Content:** Exercise demo videos, guided meditations, coaching video messages

### Post-MVP v2.0 (+12 months)
- **Web Dashboard:** Responsive web app for desktop/tablet browsers (React or Next.js)
- **Family Sharing:** Multi-user accounts with shared insights for families
- **AI Avatar Customization:** Choose visual representation of AI coach in app
- **AR/VR Experiments:** Guided workouts in AR, meditation environments in VR (exploratory)

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After E5 (Fitness), E6 (Nutrition), E7 (Wellbeing) Epic completion to ensure pillar integration consistency
**Update Triggers:** User feedback from beta testing, accessibility audit findings, platform OS updates (iOS/Android major releases)
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from Engineering (technical feasibility), Design (UX consistency), Accessibility Consultant (compliance)

---

## APPENDIX A: USER FLOWS

### Flow 1: New User - First Dashboard View
1. User completes onboarding (E1), selects Light mode preference
2. Opens app, sees Welcome Dashboard with empty state messages
3. Dashboard prompts: "Start by connecting a wearable" (E9) + "Log your first meal" (E6) + "Check your mood" (E7)
4. User connects Apple Watch, logs breakfast, logs mood
5. Dashboard updates with first data points, partial pillar scores
6. Day 7: Full dashboard with 7-day trends and first cross-domain insight

### Flow 2: Busy Professional - Light Mode Morning Check-In
1. User opens app at 7am (morning routine)
2. Dashboard loads in <2 seconds with cached data
3. Views: Fitness Score 85 (Green), Nutrition Score 72 (Yellow), Wellbeing Score 78 (Yellow)
4. Featured Insight: "Your recovery is excellent today - great day for a workout!"
5. Taps "Start Workout" quick action → Workout recommendation opens
6. Accepts recommendation, starts workout (tracked via wearable)
7. Total interaction time: <60 seconds

### Flow 3: Optimization Enthusiast - Deep Mode Chart Exploration
1. User opens app, navigates to Pillars > Fitness
2. Taps "Sleep Tracking" → Sleep detail view
3. Views sleep stages chart (7-day default)
4. Changes time range to 90 days → Chart re-renders with 90-day data
5. Taps on specific day → Tooltip shows exact values (Deep 2h 15m, REM 1h 45m, etc.)
6. Switches to Deep mode correlation chart (Sleep Quality vs. Workout Performance)
7. Exports chart as PNG for personal records
8. Total interaction time: 5+ minutes of deep exploration

### Flow 4: Offline User - Airplane Mode Data Entry
1. User boards flight, phone in airplane mode
2. Opens yHealth app → Offline mode banner appears
3. Dashboard shows cached data with timestamp: "Data from 2 hours ago"
4. Logs lunch manually (text entry, no photo AI)
5. Logs mood check-in (queued)
6. Tries to start voice coaching → "Voice requires internet. Try again when online."
7. Lands, reconnects to WiFi
8. App auto-syncs queued entries within 30 seconds
9. Dashboard refreshes with updated data
10. Notification: "Synced 2 entries. Everything's up to date!"

### Flow 5: Settings Power User - Customizing Experience
1. User navigates to Profile > Settings
2. Changes theme from Light to Dark → App re-renders in dark theme
3. Adjusts notification quiet hours: 10pm - 7am
4. Disables "Meal Logging Prompts" (finds them annoying)
5. Connects Fitbit device via Connected Devices (OAuth flow)
6. Sets Fitbit as preferred device for sleep data (conflict resolution priority)
7. Enables "Reduce Motion" for accessibility
8. All settings save immediately, sync to cloud for multi-device consistency

---

## APPENDIX B: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Unified Dashboard** | Home screen displaying all three pillar scores, daily summary, and featured insights in one view |
| **Three-Pillar Scores** | 0-100 scores for Fitness, Nutrition, and Wellbeing calculated from respective pillar data |
| **Quick Actions** | One-tap buttons on dashboard for common tasks (Log Meal, Log Mood, Start Voice Coaching, etc.) |
| **Light Mode** | Simplified app experience with minimal features, optimized for quick check-ins (<2 minutes) |
| **Deep Mode** | Comprehensive app experience with all features, detailed analytics, power user tools |
| **Bottom Tab Bar** | Persistent navigation bar at bottom of screen with 4 primary tabs (Dashboard, Pillars, Insights, Profile) |
| **Offline Queue** | Local storage of user actions performed offline, synced when connection restored |
| **Sync Conflict** | Situation where offline edit and server change occur on same data, requires user resolution |
| **Quiet Hours** | User-defined time window (e.g., 10pm - 7am) during which no notifications are sent |
| **Push Notification** | Alert sent to user's device from server (e.g., insight notification, reminder, goal celebration) |
| **Skeleton Loading** | Placeholder UI elements (gray boxes) displayed during data fetch to indicate loading state |
| **Pull-to-Refresh** | Gesture where user drags down on screen to manually trigger data refresh |
| **WCAG 2.1 Level AA** | Web Content Accessibility Guidelines standard for accessibility compliance |
| **Screen Reader** | Assistive technology that reads UI elements aloud for blind/low-vision users (VoiceOver, TalkBack) |
| **Touch Target** | Minimum interactive element size (44x44pt) for usability and accessibility |
| **Color Contrast Ratio** | Ratio of foreground to background color luminance (4.5:1 minimum for normal text) |
| **Reduce Motion** | Accessibility setting to disable animations for users sensitive to motion |
| **Data Export** | GDPR-compliant feature allowing users to download all their data (ZIP with JSON/CSV files) |
| **Conflict Resolution UI** | Interface prompting user to choose between offline version and server version during sync conflict |
| **Chart Time Range** | Selectable time period for data visualization (7, 30, 90, 365 days, or custom) |

---

*yHealth Platform - E4: Mobile App PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 7 | All MVP Core*
