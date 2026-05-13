# yHealth Platform - Epic 05: Fitness Pillar

## EPIC OVERVIEW

### Epic Statement
The Fitness Pillar is ONE of yHealth's THREE EQUAL PILLARS (Physical Fitness, Nutrition, Daily Wellbeing) that enables users to track, understand, and optimize their physical activity, sleep, and recovery through AI-driven insights and cross-domain intelligence.

### Epic Goal
Enable users to seamlessly monitor and improve their fitness through wearable integrations, intelligent tracking, and AI coaching - while delivering unique value through cross-pillar connections that reveal how fitness affects and is affected by nutrition and wellbeing.

### Core Philosophy
**"Better Together" Integration Strategy:** While we provide core fitness metrics (feature parity with WHOOP/BEVEL), our competitive moat lies in connecting fitness data with nutrition and wellbeing insights to deliver correlations that dedicated fitness apps cannot provide.

### Fitness Pillar Scope (6 Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F5.1** | Activity Tracking | Core |
| **F5.2** | Sleep Tracking & Analysis | Core |
| **F5.3** | Recovery Monitoring | Core |
| **F5.4** | Fitness Goal Setting & Progress | Core |
| **F5.5** | Workout Recommendations | Core |
| **F5.6** | Strain/Load Management | Core |

---

## F5.1: ACTIVITY TRACKING

### Description
Comprehensive activity and movement tracking that captures steps, workouts, heart rate, and active minutes through wearable integrations and manual logging. Prioritizes automatic wearable tracking with manual entry as a fallback option for users without devices.

### User Story
As a **Holistic Health Seeker** (P1), I want to automatically track my daily activity and workouts from my wearable device so that I can see my movement patterns and understand how physical activity connects to my energy levels and mood without manual effort.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | View daily step count, active minutes summary, and simplified activity timeline. Quick glance at "Did I move enough today?" with yes/no feedback. |
| **Deep** | Detailed activity breakdown by hour, heart rate zones during activities, workout intensity analysis, movement patterns across weeks/months, export activity data. |

### User Decisions Applied
- **Wearable-first approach:** Auto-sync from connected devices (WHOOP, Apple Health, Fitbit, Garmin, Oura)
- **Manual fallback:** Users without wearables can manually log workouts (type, duration, perceived effort)
- **Cross-pillar emphasis:** Activity data feeds into energy correlation, mood-performance insights, sleep quality analysis

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Wearable sync success rate | >95% within 15 minutes | Integration monitoring |
| Daily activity data completeness | >90% users have activity data each day | Data analytics |
| Manual entry fallback usage | <10% of total activity logs (wearable-first working) | Logging analytics |
| User satisfaction with auto-tracking | 4.5/5 rating | In-app survey |

### Acceptance Criteria

- [ ] Syncs activity data from 10+ wearable sources (WHOOP, Apple Health, Google Fit, Fitbit, Garmin, Oura, Samsung, Strava, others)
- [ ] Displays daily step count, active minutes, heart rate zones, and workout sessions
- [ ] Updates activity data within 15 minutes of wearable sync
- [ ] Manual workout entry available with fields: type, duration, perceived effort (1-10 scale)
- [ ] Activity timeline shows hourly movement patterns for deep mode
- [ ] Light mode shows simplified daily summary with clear visual indicators
- [ ] Activity data integrated into holistic health score and cross-domain insights
- [ ] Handles conflicting data from multiple wearables using priority hierarchy (PRD Section 15)
- [ ] Offline mode queues manual entries for sync when reconnected

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Wearable sync failure** | No data >24 hours from connected device | Retry hourly, notify after 48h | "Haven't synced from your [device] in 2 days. Everything okay?" |
| **Conflicting activity data** | Multiple sources report same workout | Apply golden source hierarchy | Silent: use priority rules (WHOOP > Apple Health > Fitbit) |
| **Manual entry validation** | Unrealistic values (e.g., 50,000 steps) | Flag for confirmation | "This seems unusually high. Is this correct?" |
| **Heart rate data gap** | Missing HR during logged workout | Accept workout without HR zones | "Workout logged! HR data unavailable for this session." |

### Cross-Pillar Connections

**To Nutrition (E6):**
- Activity level affects caloric needs and macro recommendations
- Post-workout nutrition timing insights
- Hydration needs based on activity intensity

**To Wellbeing (E7):**
- Movement patterns correlated with mood and energy levels
- Exercise as intervention for low mood detection
- Activity impact on stress and sleep quality

**To Cross-Domain Intelligence (E8):**
- "Your best workouts happen after 7+ hours of sleep and morning journaling"
- "Low energy today correlates with <5,000 steps yesterday"
- "Your mood improves 80% on days with 30+ min cardio"

### Dependencies
- **E9 (Data Integrations):** Wearable OAuth connections, API sync logic
- **E4 (Mobile App):** Activity timeline UI, manual entry forms
- **E3 (WhatsApp):** Quick activity check-ins, voice-to-text workout logging
- **E8 (Cross-Domain Intelligence):** Activity-mood, activity-energy correlations

### MVP Status
[X] MVP Core

---

## F5.2: SLEEP TRACKING & ANALYSIS

### Description
Comprehensive sleep monitoring that imports sleep data from wearables and provides core sleep metrics (duration, quality, stages) with emphasis on cross-pillar insights connecting sleep to workout performance, nutrition, and wellbeing. Hybrid approach: feature parity for basic metrics but unique value through cross-domain correlations.

### User Story
As an **Optimization Enthusiast** (P3), I want to track my sleep quality and understand how it affects my workout performance and mood so that I can optimize my sleep routine for maximum health benefits across all areas of my life.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | View sleep duration, quality score (0-100), and simple "Good/Fair/Poor" rating. One-line insight: "7h 30min sleep, Quality: Good (85/100)". |
| **Deep** | Detailed sleep stages breakdown (Wake, Light, Deep, REM), time in each stage, sleep onset latency, wake-ups, HRV during sleep (if available), historical trends, sleep consistency score, export data. |

### User Decisions Applied
- **Hybrid approach:** Core sleep metrics (duration, stages, quality) PLUS unique cross-domain insights
- **Integration focus:** Pull sleep data from wearables (WHOOP, Oura, Apple Watch, Fitbit)
- **Differentiation through connections:** Emphasize sleep-mood, sleep-workout, sleep-nutrition correlations

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sleep data sync success | >95% nights tracked for wearable users | Data completeness analytics |
| Cross-domain sleep insights | 80% of users receive sleep correlation insights within 7 days | Insight delivery tracking |
| Sleep quality improvement | 60% of users improve sleep quality score by 10+ points in 30 days | Cohort analysis |
| User engagement with sleep insights | 70% click/engage with sleep-related insights | Insight engagement metrics |

### Acceptance Criteria

- [ ] Imports sleep data from 8+ sources (WHOOP, Oura, Apple Watch, Fitbit, Garmin, Samsung, manual entry, others)
- [ ] Displays core metrics: total sleep time, sleep quality score (0-100), sleep stages (Wake, Light, Deep, REM)
- [ ] Normalizes sleep stage data across different wearable formats (PRD Section 15)
- [ ] Shows sleep trends over 7, 30, 90 days with visual charts
- [ ] Manual sleep entry available: bedtime, wake time, quality rating (1-10)
- [ ] Light mode shows simplified sleep summary with quality indicator
- [ ] Deep mode shows detailed stage breakdown, HRV during sleep (if available), consistency metrics
- [ ] Generates cross-domain insights: "7+ hours sleep = 25% better workout performance"
- [ ] Sleep score integrated into holistic health score and recovery calculation
- [ ] Alerts user to poor sleep patterns affecting other pillars

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Missing sleep data** | No sleep data for >48h | Prompt manual entry | "We haven't tracked your sleep in 2 days. Add it manually?" |
| **Conflicting sleep sources** | Multiple devices report different sleep times | Use golden source (WHOOP > Oura > Apple Watch) | Silent: apply priority hierarchy |
| **Unrealistic sleep values** | Manual entry >12 hours or <2 hours | Flag for confirmation | "Sleep duration seems unusual. Is this correct?" |
| **Sleep stage unavailable** | Device doesn't track stages | Show duration/quality only | "Sleep tracked! Detailed stages unavailable from your device." |

### Cross-Pillar Connections

**To Fitness (F5.1, F5.3):**
- Sleep quality affects next-day recovery score
- Poor sleep triggers lower workout intensity recommendations
- Sleep duration correlates with workout performance

**To Nutrition (E6):**
- Sleep deprivation linked to increased hunger and cravings
- Late-night eating affects sleep quality
- Sleep-nutrition timing insights (avoid caffeine after 2pm)

**To Wellbeing (E7):**
- Sleep quality strongly predicts mood and energy levels
- Poor sleep increases stress and anxiety
- Sleep consistency improves emotional regulation

**To Cross-Domain Intelligence (E8):**
- "You log better moods after 7+ hours sleep and morning workouts"
- "Sleep quality drops 20% on days with >300mg caffeine after 2pm"
- "Your best sleep happens when you journal before bed and eat dinner before 7pm"

### Dependencies
- **E9 (Data Integrations):** Sleep data sync from wearables, normalization logic
- **E4 (Mobile App):** Sleep tracking UI, stage visualization, trends charts
- **E8 (Cross-Domain Intelligence):** Sleep correlation engine with other pillars
- **F5.3 (Recovery Monitoring):** Sleep quality as primary recovery input

### MVP Status
[X] MVP Core

---

## F5.3: RECOVERY MONITORING

### Description
Intelligent recovery tracking that combines physiological metrics (HRV, RHR, sleep) with wellbeing factors (mood, stress, journaling) to generate a Dual Recovery Score: Physical Recovery (body readiness) and Mental Recovery (mind readiness). This multi-pillar approach is yHealth's unique differentiation vs WHOOP/BEVEL's physiology-only recovery.

### User Story
As a **Holistic Health Seeker** (P1), I want to know if my body AND mind are ready for intense activity so that I can make informed decisions about workout intensity and rest without overtraining or burning out mentally.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | View dual recovery scores (Physical: 0-100, Mental: 0-100) with simple color coding (Green/Yellow/Red) and one-line recommendation: "Body ready, mind needs rest - consider gentle yoga". |
| **Deep** | Detailed breakdown of each score component, historical recovery trends, recovery pattern analysis, personalized recovery recommendations based on both scores, export recovery data. |

### User Decisions Applied
- **Dual Score Approach:** Two separate scores (Physical + Mental Recovery) that also incorporate WHOOP-style physiology
- **Multi-pillar methodology:** Physical = HRV + RHR + Sleep Quality, Mental = Mood + Stress + Journaling + Energy
- **Cross-domain foundation:** Recovery score is THE integration point between fitness and wellbeing pillars

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Recovery score accuracy | 75% user agreement with score recommendations | Post-workout feedback surveys |
| Overtraining prevention | 50% reduction in user-reported burnout vs baseline | Monthly health surveys |
| Recovery-based training adoption | 70% of users adjust workouts based on recovery scores | Behavioral analytics |
| Dual score differentiation | 80% of users report value of mental recovery tracking | In-app feedback |

### Acceptance Criteria

- [ ] Calculates Physical Recovery Score (0-100) using: HRV, Resting Heart Rate, Sleep Quality, Sleep Duration
- [ ] Calculates Mental Recovery Score (0-100) using: Morning mood rating, Stress level, Journaling completion, Energy level
- [ ] Displays both scores prominently with color coding: Green (80-100), Yellow (50-79), Red (0-49)
- [ ] Provides personalized recommendations based on score combinations:
  - Both High: "Great day for intense training!"
  - Physical High, Mental Low: "Light activity recommended - your mind needs rest"
  - Physical Low, Mental High: "Focus on mobility and recovery - your body needs rest"
  - Both Low: "Full rest day recommended"
- [ ] Shows historical recovery trends over 7, 30, 90 days
- [ ] Deep mode breaks down score components with individual metric values
- [ ] Light mode shows simplified dual score with one-line actionable guidance
- [ ] Recovery scores feed into workout recommendations (F5.5)
- [ ] Alerts user to concerning recovery patterns (e.g., 5+ consecutive days <50)
- [ ] Integrates with coaching channels (WhatsApp, Voice) for recovery check-ins

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Insufficient data for score** | Missing HRV, mood, or sleep data | Generate partial score with disclaimer | "Recovery estimate based on limited data. Add [missing metric] for accuracy." |
| **Score calculation failure** | API error or data corruption | Show last valid score with timestamp | "Using yesterday's recovery score. Recalculating..." |
| **Conflicting score signals** | HRV high but mood very low | Emphasize Mental Recovery score | "Body recovered but mental fatigue detected - rest or light activity recommended." |
| **New user (< 7 days data)** | Insufficient baseline for HRV/RHR | Use population averages with caveat | "Building your baseline. Scores will improve accuracy in 7-14 days." |

### Physical Recovery Score Calculation

```
Physical Recovery Score = Weighted Average:
- HRV (40%): Compared to 30-day baseline, 0-100 scale
- Resting Heart Rate (30%): Compared to 30-day baseline, 0-100 scale
- Sleep Quality (20%): Quality score from F5.2
- Sleep Duration (10%): Compared to user's sleep goal

Green: 80-100 (Fully recovered)
Yellow: 50-79 (Moderately recovered)
Red: 0-49 (Not recovered)
```

### Mental Recovery Score Calculation

```
Mental Recovery Score = Weighted Average:
- Morning Mood Rating (40%): 1-10 scale from E7 (Wellbeing)
- Stress Level (30%): 1-10 scale from E7 (Wellbeing)
- Energy Level (20%): 1-10 scale from E7 (Wellbeing)
- Journaling Completion (10%): Bonus for reflection completion

Green: 80-100 (Mentally fresh)
Yellow: 50-79 (Moderate mental fatigue)
Red: 0-49 (Mental rest needed)
```

### Cross-Pillar Connections

**To Fitness (F5.1, F5.5, F5.6):**
- Recovery scores determine workout intensity recommendations
- Strain/load management adjusts based on recovery trends
- Activity tracking feeds back into next day's recovery calculation

**To Wellbeing (E7):**
- Mood, stress, energy, journaling data power Mental Recovery Score
- Low mental recovery triggers wellbeing check-ins
- Recovery insights reinforce importance of mental health tracking

**To Cross-Domain Intelligence (E8):**
- "Your physical recovery is 25% higher on days you journal"
- "Mental recovery predicts workout enjoyment better than physical recovery"
- "Best overall recovery happens with 7+ hours sleep + morning mood >7"

### Dependencies
- **E9 (Data Integrations):** HRV and RHR data from wearables
- **F5.2 (Sleep Tracking):** Sleep quality and duration inputs
- **E7 (Wellbeing Pillar):** Mood, stress, energy, journaling data
- **E8 (Cross-Domain Intelligence):** Multi-pillar correlation engine
- **F5.5 (Workout Recommendations):** Recovery-aware workout planning

### MVP Status
[X] MVP Core

---

## F5.4: FITNESS GOAL SETTING & PROGRESS

### Description
Comprehensive goal management system that allows users to set, track, and adjust fitness goals across multiple dimensions (activity, sleep, strength, endurance) with AI-driven progress insights and adaptive goal recommendations based on actual performance and recovery patterns.

### User Story
As an **Optimization Enthusiast** (P3), I want to set specific fitness goals and track my progress with intelligent feedback so that I can systematically improve my health while avoiding unrealistic targets that lead to burnout.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple progress bars for 1-3 primary goals (e.g., "Walk 10k steps daily: 7/7 days this week ✓"). Quick visual feedback on goal status. |
| **Deep** | Detailed goal analytics, historical progress charts, goal adjustment recommendations, milestone celebrations, export progress data, multiple concurrent goals with priority settings. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Goal completion rate | 60% of set goals achieved within timeframe | Goal tracking analytics |
| Goal adjustment adoption | 70% of users adjust unrealistic goals when prompted | Goal modification tracking |
| Sustainable goal adherence | 75% of users maintain goals for 30+ days | Goal longevity analysis |
| AI recommendation accuracy | 65% of AI-suggested goals accepted by users | Goal creation source tracking |

### Acceptance Criteria

- [ ] Users can set goals across categories: Daily Steps, Weekly Active Minutes, Sleep Duration, Workout Frequency, Custom Metrics
- [ ] Goal creation wizard guides users through SMART goal setting (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] AI suggests personalized goals based on current baseline and recovery capacity
- [ ] Progress tracking shows: current status, days completed, success percentage, trend direction
- [ ] Visual progress indicators: progress bars, streak counters, charts
- [ ] Automated goal adjustment prompts when goals are consistently missed (>70% failure rate)
- [ ] Celebration messages and milestones for goal achievements
- [ ] Light mode shows 1-3 top priority goals with simple status
- [ ] Deep mode shows all active goals, historical performance, detailed analytics
- [ ] Goals integrate with recovery scores - AI suggests rest days when recovery is low
- [ ] Cross-pillar goal support: "Improve sleep quality" goal tracks correlation with bedtime nutrition

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Unrealistic goal set** | Goal >50% above baseline | Suggest scaled-back version | "This goal is ambitious! Start with [lower target]?" |
| **Consistent goal failure** | <30% success rate for 7+ days | Prompt goal reassessment | "Struggling with this goal. Let's adjust it together?" |
| **Data unavailable for goal** | Goal set but no tracking source | Alert user to connect device | "To track this goal, connect your wearable or log manually." |
| **Goal conflict detection** | Multiple goals competing (e.g., max workouts + max recovery) | Flag conflict | "These goals may conflict. Prioritize one or adjust targets?" |

### Cross-Pillar Connections

**To Nutrition (E6):**
- "Calorie goal" and "Activity goal" synchronized recommendations
- Weight management goals combine fitness activity + nutrition tracking
- Hydration goals increase with activity level goals

**To Wellbeing (E7):**
- "Improve mood" goal may recommend increasing movement/exercise
- Stress reduction goals may lower workout intensity targets
- Sleep quality goals inform fitness intensity planning

**To Cross-Domain Intelligence (E8):**
- "Your step goal success rate is 85% higher on days you journal"
- "Sleep goal easier to achieve when workouts complete before 6pm"
- Multi-pillar goals: "Improve overall health" tracks fitness + nutrition + wellbeing

### Dependencies
- **E4 (Mobile App):** Goal setting UI, progress visualization, milestone celebrations
- **E3 (WhatsApp):** Daily goal progress check-ins, voice goal updates
- **E8 (Cross-Domain Intelligence):** Goal recommendation engine, cross-pillar goal analysis
- **F5.1, F5.2 (Activity/Sleep Tracking):** Data sources for goal progress

### MVP Status
[X] MVP Core

---

## F5.5: WORKOUT RECOMMENDATIONS

### Description
AI-powered workout planning system that generates personalized, detailed workout plans (exercises, sets, reps) based on user goals, current recovery state, historical performance, and cross-pillar data (mood, nutrition, sleep). Moderate depth for MVP: specific workout plans vs. generic activity suggestions.

### User Story
As a **Busy Professional** (P2), I want AI to tell me exactly what workout to do today based on my recovery, schedule, and goals so that I don't waste time planning and can maximize results with limited time.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Single "Workout of the Day" recommendation with duration and intensity level. One-tap start. Example: "30-min Moderate Cardio recommended today". |
| **Deep** | Detailed workout plan with specific exercises, sets/reps, rest periods, alternative exercises, workout rationale based on data, historical workout library, custom workout builder. |

### User Decisions Applied
- **Moderate AI personalization:** Detailed workout plans (not just "do cardio"), exercises with sets/reps/duration
- **Recovery-aware:** Adjusts intensity and volume based on dual recovery scores (F5.3)
- **Exercise library:** Pre-built workout templates + AI customization based on user profile

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Workout recommendation acceptance | 70% of recommendations started by user | Workout initiation tracking |
| Workout completion rate | 80% of started workouts completed | Workout completion analytics |
| User satisfaction with variety | 4.5/5 rating on workout diversity | In-app survey |
| Recovery-aligned recommendations | 85% accuracy in matching workout to recovery state | Post-workout recovery impact analysis |

### Acceptance Criteria

- [ ] Daily workout recommendation generated based on: Recovery scores, User goals, Recent workout history, Available time/equipment, Mood/energy level
- [ ] Workout plan includes: Exercise names, Sets/reps (strength) or duration (cardio), Rest periods, Intensity level (Light/Moderate/High), Estimated total time
- [ ] Exercise library covers: Strength training (bodyweight, free weights, machines), Cardio (running, cycling, swimming, rowing), Flexibility (yoga, stretching), Recovery (mobility, foam rolling)
- [ ] AI adjusts recommendations based on recovery: Red recovery (Physical/Mental) → Active recovery or rest, Yellow recovery → Moderate intensity, Green recovery → High intensity option available
- [ ] Light mode shows single "Workout of the Day" with quick start button
- [ ] Deep mode shows detailed plan, alternative exercises, workout history, custom plan builder
- [ ] Workout recommendations available via all channels: Mobile app, WhatsApp ("What should I do today?"), Voice coaching
- [ ] Post-workout feedback: "How was this workout?" to improve AI recommendations
- [ ] Progressive overload logic: AI gradually increases difficulty when user consistently completes workouts
- [ ] Safety checks: Warns against high-intensity workouts with poor recovery, suggests rest days

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **No workout recommendation** | Insufficient user data or conflicting signals | Offer generic beginner-friendly option | "Still learning your patterns. Try this balanced workout today." |
| **User rejects recommendation** | User skips suggested workout 3+ times | Ask for feedback, adjust algorithm | "Noticed you skipped these workouts. What would you prefer?" |
| **Injury reported** | User logs injury or pain | Remove exercises involving injured area | "Adjusted your plan to avoid [injured area]. Focus on recovery." |
| **Equipment unavailable** | User indicates equipment not accessible | Substitute bodyweight or available equipment | "Modified plan for bodyweight exercises." |

### Workout Recommendation Logic

```
Daily Workout Generation Process:

1. Recovery Assessment (from F5.3):
   - Both scores >80: High-intensity option available
   - Either score 50-79: Moderate intensity recommended
   - Either score <50: Light activity or rest recommended

2. Goal Alignment (from F5.4):
   - Strength goal → Strength training emphasis
   - Endurance goal → Cardio emphasis
   - Weight loss goal → Higher calorie burn focus
   - General health → Balanced variety

3. Workout History Analysis:
   - Muscle group rotation (avoid same groups consecutive days)
   - Workout type variety (avoid 5+ days same activity)
   - Progressive overload (gradual difficulty increase)

4. Cross-Pillar Inputs:
   - Low energy (E7) → Shorter, less intense workout
   - High stress (E7) → Mind-body exercises (yoga, tai chi)
   - Poor sleep (F5.2) → Active recovery recommended

5. Time/Equipment Constraints:
   - User's available time (from schedule or input)
   - User's equipment access (home, gym, outdoors)

6. Generate Plan:
   - Select workout type
   - Choose specific exercises
   - Set volume (sets/reps/duration)
   - Add warm-up and cool-down
   - Provide rationale for user transparency
```

### Exercise Library Structure (MVP Minimum)

| Category | Exercises (Minimum 10 per category) |
|----------|--------------------------------------|
| **Strength (Bodyweight)** | Push-ups, squats, lunges, planks, pull-ups, dips, burpees, mountain climbers, etc. |
| **Strength (Weights)** | Bench press, deadlifts, squats, rows, overhead press, curls, etc. |
| **Cardio** | Running, cycling, swimming, rowing, jump rope, HIIT intervals, etc. |
| **Flexibility** | Yoga flows, static stretches, dynamic stretches, mobility drills, etc. |
| **Recovery** | Foam rolling, light walking, gentle yoga, breathing exercises, etc. |

### Cross-Pillar Connections

**To Recovery (F5.3):**
- Workout intensity directly tied to dual recovery scores
- AI prevents overtraining by recommending rest when recovery low

**To Nutrition (E6):**
- Post-workout nutrition timing recommendations
- Pre-workout meal suggestions for energy optimization
- Calorie burn estimates feed into daily nutrition targets

**To Wellbeing (E7):**
- Mood-based workout selection (energizing vs. calming)
- Stress-reduction workouts (yoga, breathwork) when stress high
- Exercise as intervention for low mood detection

**To Cross-Domain Intelligence (E8):**
- "You perform 30% better in morning workouts after journaling"
- "Strength training on weekends correlates with better Monday mood"
- "Your best cardio sessions follow 8+ hours sleep and high-protein breakfast"

### Dependencies
- **F5.3 (Recovery Monitoring):** Recovery scores input for workout intensity
- **F5.4 (Fitness Goals):** Goal alignment for workout type selection
- **E7 (Wellbeing Pillar):** Mood/stress/energy inputs for workout customization
- **E4 (Mobile App):** Workout plan display, exercise demos (future), workout logging
- **E3 (WhatsApp):** Quick workout recommendations via chat
- **E2 (Voice Coaching):** Conversational workout planning and feedback

### MVP Status
[X] MVP Core

---

## F5.6: STRAIN/LOAD MANAGEMENT

### Description
Comprehensive training load tracking that calculates a proprietary yHealth Strain Score (0-100) using all available data sources (heart rate, duration, activity type, recovery state) to prevent overtraining and optimize workout distribution across the week. Works for all users, not just those with WHOOP/Garmin devices.

### User Story
As an **Optimization Enthusiast** (P3), I want to understand my cumulative training load across the week so that I can avoid overtraining while maximizing performance gains without needing expensive wearables.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Daily strain score (0-100) with color coding and simple guidance: "Today's strain: 65 (Moderate). You have capacity for more." Weekly total strain visible. |
| **Deep** | Detailed strain breakdown by activity, 7-day strain chart, optimal strain range for goals, strain-recovery balance analysis, cumulative fatigue indicator, export strain history. |

### User Decisions Applied
- **Calculate yHealth Strain Score:** Proprietary algorithm (not relying on WHOOP/Garmin scores)
- **Universal approach:** Works with any data source (wearable HR, manual entry, activity type)
- **Integration with recovery:** Strain balanced against recovery capacity for intelligent load management

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Overtraining prevention | 60% reduction in user-reported overtraining symptoms | Monthly health surveys |
| Strain accuracy vs. perceived effort | 75% correlation between strain score and user-rated effort | Post-activity feedback |
| Optimal strain adherence | 70% of users maintain strain within recommended range | Strain analytics |
| Strain-recovery balance | 80% of users achieve 1:1 weekly strain-recovery ratio | Cross-metric analysis |

### Acceptance Criteria

- [ ] Calculates yHealth Strain Score (0-100) for each activity based on: Heart rate data (if available), Activity duration, Activity type intensity multiplier, User's fitness baseline, Recovery state
- [ ] Daily total strain = sum of all activities that day
- [ ] Weekly strain tracking with 7-day rolling average
- [ ] Recommended strain ranges based on user goals: Maintenance (40-60), Progressive training (60-80), Peak performance (80-100+), Recovery week (0-40)
- [ ] Strain-recovery balance indicator: Compares weekly strain to weekly average recovery
- [ ] Alerts for concerning patterns: 3+ consecutive high strain days (>80) with low recovery (<50), Weekly strain >150% higher than previous week (overreaching risk)
- [ ] Light mode shows daily strain score with simple color coding (Green/Yellow/Red)
- [ ] Deep mode shows strain breakdown by activity, trends, recommendations
- [ ] Strain score works with any data source (no WHOOP required): HR-based calculation (most accurate), Duration + type calculation (good), Manual perceived effort input (basic)
- [ ] AI coaching uses strain data to recommend workout intensity and rest days

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **No HR data available** | Activity logged without HR | Use duration + activity type calculation | "Strain estimate based on activity type. Connect wearable for accuracy." |
| **Manual perceived effort** | User enters effort rating (1-10) | Convert to strain score via algorithm | "Strain score estimated from your perceived effort." |
| **Unrealistic strain spike** | Single activity >90% of weekly total | Flag for review | "This activity seems unusually intense. Confirm details?" |
| **Chronic high strain** | 7+ consecutive days >80 strain | Alert with rest recommendation | "High strain for 7 days. Rest day strongly recommended." |

### yHealth Strain Score Calculation

```
Strain Score Calculation (Per Activity):

Method A: HR-based (Most Accurate - requires wearable HR data)
1. Calculate average % of max HR during activity
2. Weight by activity duration
3. Apply activity type multiplier (HIIT 1.5x, Strength 1.2x, Cardio 1.0x, Yoga 0.6x)
4. Normalize to 0-100 scale based on user baseline

Method B: Duration + Type (Good - no HR required)
1. Activity type has baseline strain value (HIIT: 15/hr, Strength: 12/hr, Cardio: 10/hr, Yoga: 5/hr)
2. Multiply by duration in hours
3. Adjust for user fitness level (beginners: +20%, advanced: -10%)
4. Normalize to 0-100 scale

Method C: Perceived Effort (Basic - manual entry fallback)
1. User rates effort 1-10
2. Multiply by duration in 10-min increments
3. Convert to 0-100 scale
4. Less accurate but maintains continuity

Daily Strain = Sum of all activities that day
Weekly Strain = Sum of 7-day rolling window

Strain Categories:
- 0-20: Very Light (recovery activities)
- 21-40: Light (easy workouts, active recovery)
- 41-60: Moderate (typical training day)
- 61-80: High (challenging workout)
- 81-100+: Very High (peak effort, race day)
```

### Strain-Recovery Balance Logic

```
Healthy Training Balance:

Weekly Strain / Weekly Average Recovery ≈ 1.0

Examples:
- Weekly Strain: 280, Avg Recovery: 75 → Ratio: 3.7 → OVERREACHING (reduce load)
- Weekly Strain: 320, Avg Recovery: 85 → Ratio: 3.8 → BALANCED
- Weekly Strain: 180, Avg Recovery: 90 → Ratio: 2.0 → UNDERTRAINING (can push more)

Alerts:
- Ratio >4.5: "Overtraining risk detected. Consider rest day."
- Ratio <2.0 and goals active: "You have capacity for more. Try a workout?"
- 3+ days high strain + low recovery: "Fatigue accumulating. Rest needed."
```

### Cross-Pillar Connections

**To Recovery (F5.3):**
- Strain balanced against recovery capacity for load management
- High strain without recovery triggers overtraining alerts
- Recovery recommendations increase with cumulative strain

**To Workout Recommendations (F5.5):**
- AI reduces recommended workout intensity when strain high
- Distributes strain optimally across the week
- Suggests active recovery when cumulative load exceeds threshold

**To Nutrition (E6):**
- High strain days increase caloric and protein recommendations
- Recovery nutrition timing post-high-strain workouts
- Hydration needs scale with strain level

**To Wellbeing (E7):**
- Chronic high strain correlates with mood and stress deterioration
- Alerts to mental fatigue when physical strain excessive
- Recommends stress-reduction activities when strain-recovery imbalanced

**To Cross-Domain Intelligence (E8):**
- "Your ideal weekly strain for best mood and performance: 250-300"
- "High strain without adequate sleep results in 40% longer recovery"
- "You tolerate higher strain when journaling consistently"

### Dependencies
- **E9 (Data Integrations):** HR data from wearables for accurate strain calculation
- **F5.1 (Activity Tracking):** Activity duration and type for strain inputs
- **F5.3 (Recovery Monitoring):** Recovery scores for strain-recovery balance
- **E4 (Mobile App):** Strain charts, trends visualization, balance indicators
- **E8 (Cross-Domain Intelligence):** Strain-recovery optimization recommendations

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 6 fitness features functional across Light and Deep modes
- [ ] Wearable integrations sync data successfully (F5.1, F5.2)
- [ ] Dual Recovery Score calculates accurately with multi-pillar inputs (F5.3)
- [ ] Fitness goal setting and progress tracking operational (F5.4)
- [ ] AI workout recommendations generate personalized plans (F5.5)
- [ ] yHealth Strain Score calculates and alerts for overtraining (F5.6)
- [ ] Cross-pillar connections operational: fitness data feeds into nutrition and wellbeing insights
- [ ] All features accessible via Mobile App, WhatsApp, and Voice Coaching channels
- [ ] Error handling graceful for all failure scenarios
- [ ] Data normalization works across 10+ wearable sources

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Performance** | Wearable sync <15min, Dashboard load <3s | Analytics monitoring |
| **Accuracy** | Recovery score 75% user agreement, Strain score 75% correlation with perceived effort | User feedback surveys |
| **Reliability** | >95% data sync success rate | Integration health metrics |
| **User Satisfaction** | 4.5/5 rating for fitness pillar features | In-app NPS surveys |
| **Cross-Pillar Integration** | 80% of users discover fitness-related cross-domain insights within 7 days | Insight engagement analytics |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Discovers how fitness affects mood and energy | "Aha moment" via cross-pillar insight within 7 days |
| **P2: Busy Professional** | Gets quick workout recommendations without planning effort | Uses AI workout recommendations 4+ times/week |
| **P3: Optimization Enthusiast** | Dives deep into recovery and strain analytics | Engages with deep mode features 3+ times/week |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- Fitness goals and baseline established during onboarding
- Wearable connection wizard guides initial device setup
- Flexibility preference (Light/Deep) set during onboarding

### E2: Voice Coaching
- "How's my recovery today?" voice queries
- "What workout should I do?" conversational planning
- Voice-based workout logging: "I just did a 30-minute run"

### E3: WhatsApp Integration
- Daily recovery score delivered via WhatsApp morning check-in
- Quick workout logging: Photo of workout summary, voice message "just finished leg day"
- Workout reminders and nudges based on goals

### E4: Mobile App
- Primary UI for all fitness features: activity timeline, sleep charts, recovery dashboard
- Deep mode analytics and detailed visualizations
- Goal setting wizard and progress tracking UI

### E6: Nutrition Pillar
- Activity level determines caloric needs
- Post-workout nutrition recommendations
- Sleep quality affects hunger/cravings insights

### E7: Wellbeing Pillar
- Mood, stress, energy, journaling feed Mental Recovery Score
- Exercise recommended as intervention for low mood
- Sleep quality correlates with emotional regulation

### E8: Cross-Domain Intelligence
- Fitness pillar is THE data source for cross-domain correlations
- Insights engine reveals fitness-nutrition-wellbeing connections
- Predictive alerts: "Low sleep predicts poor workout performance tomorrow"

### E9: Data Integrations
- 10+ wearable integrations provide fitness data
- OAuth flows for device connections
- Data normalization across sources (HRV, sleep stages, HR zones)

### E10: Analytics & Insights Dashboard
- Fitness metrics feed into holistic health score
- Readiness, Strain, Sleep scores prominently displayed
- "What's Affecting What" explorer shows fitness correlations

---

## TECHNICAL CONSIDERATIONS

### Data Models (Fitness Domain)

**Activity Record:**
```json
{
  "activity_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2025-12-02T08:00:00Z",
  "source": "whoop|apple_health|manual",
  "type": "cardio|strength|yoga|other",
  "duration_minutes": 45,
  "steps": 5000,
  "heart_rate_avg": 145,
  "heart_rate_max": 172,
  "heart_rate_zones": {"zone1": 5, "zone2": 15, "zone3": 20, "zone4": 5},
  "calories_burned": 420,
  "perceived_effort": 7,
  "notes": "Morning run, felt great"
}
```

**Sleep Record:**
```json
{
  "sleep_id": "uuid",
  "user_id": "uuid",
  "sleep_start": "2025-12-02T23:00:00Z",
  "sleep_end": "2025-12-03T07:00:00Z",
  "total_sleep_minutes": 450,
  "sleep_quality_score": 85,
  "stages": {
    "wake_minutes": 30,
    "light_minutes": 180,
    "deep_minutes": 120,
    "rem_minutes": 120
  },
  "hrv_avg": 65,
  "rhr": 52,
  "source": "oura|whoop|apple_watch|manual"
}
```

**Recovery Score Record:**
```json
{
  "recovery_id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-02",
  "physical_recovery_score": 82,
  "physical_components": {
    "hrv_score": 85,
    "rhr_score": 80,
    "sleep_quality_score": 85,
    "sleep_duration_score": 75
  },
  "mental_recovery_score": 78,
  "mental_components": {
    "mood_score": 80,
    "stress_score": 75,
    "energy_score": 80,
    "journaling_bonus": 10
  },
  "recommendation": "Body ready, mind moderately fresh - good day for training"
}
```

**Strain Score Record:**
```json
{
  "strain_id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-02",
  "daily_strain_score": 68,
  "activities": [
    {"activity_id": "uuid", "strain_contribution": 45},
    {"activity_id": "uuid", "strain_contribution": 23}
  ],
  "weekly_strain_total": 312,
  "strain_recovery_ratio": 3.8,
  "alert": null
}
```

### API Endpoints (Fitness Pillar)

```
GET    /api/v1/fitness/activity              - List user activities
POST   /api/v1/fitness/activity              - Log manual activity
GET    /api/v1/fitness/activity/{id}         - Get activity details
DELETE /api/v1/fitness/activity/{id}         - Delete activity

GET    /api/v1/fitness/sleep                 - List sleep records
POST   /api/v1/fitness/sleep                 - Log manual sleep
GET    /api/v1/fitness/sleep/{id}            - Get sleep details

GET    /api/v1/fitness/recovery              - Get current recovery scores
GET    /api/v1/fitness/recovery/history      - Recovery trends

GET    /api/v1/fitness/goals                 - List active goals
POST   /api/v1/fitness/goals                 - Create new goal
PUT    /api/v1/fitness/goals/{id}            - Update goal
DELETE /api/v1/fitness/goals/{id}            - Delete goal
GET    /api/v1/fitness/goals/{id}/progress   - Goal progress details

GET    /api/v1/fitness/recommendations/workout - Get daily workout recommendation
POST   /api/v1/fitness/recommendations/feedback - Submit workout feedback

GET    /api/v1/fitness/strain                - Get current strain data
GET    /api/v1/fitness/strain/history        - Strain trends
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Wearable data sync | <15 minutes | Near real-time without excessive API calls |
| Recovery score calculation | <2 seconds | Real-time dashboard updates |
| Workout recommendation generation | <3 seconds | Acceptable wait for AI processing |
| Activity logging (manual) | <1 second | Immediate feedback for user input |
| Dashboard load (fitness pillar) | <3 seconds | Acceptable load time for data-rich view |

### Security & Privacy

- **Data Encryption:** All fitness data encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Access Control:** OAuth 2.0 for wearable integrations, user consent required
- **Data Minimization:** Request only necessary scopes from wearables
- **Data Deletion:** Complete fitness data removal within 30 days of account deletion (GDPR)
- **Anonymization:** Aggregated insights use anonymized data only

---

## COMPETITIVE ANALYSIS (FITNESS PILLAR)

### Feature Parity Matrix

| Feature | WHOOP | BEVEL | yHealth | Differentiation |
|---------|-------|-------|---------|-----------------|
| **Activity Tracking** | ✅ | ✅ | ✅ | Multi-channel (app + WhatsApp + voice) |
| **Sleep Tracking** | ✅ Advanced | ✅ Advanced | ✅ Core + Cross-pillar | Sleep-mood, sleep-nutrition insights |
| **Recovery Score** | ✅ (physiology only) | ✅ (physiology only) | ✅ **Dual Score** | Mental + Physical recovery (unique) |
| **Strain Score** | ✅ (WHOOP only) | ✅ | ✅ **yHealth Score** | Works without WHOOP, all users |
| **Workout Recommendations** | ❌ | Limited | ✅ **AI-powered** | Detailed plans with exercises/sets/reps |
| **Goal Setting** | Basic | ✅ | ✅ | Cross-pillar goals (fitness + nutrition + wellbeing) |
| **Cross-Domain Insights** | ❌ | Limited | ✅ **Core USP** | Fitness-nutrition-wellbeing correlations |

### yHealth's Fitness Pillar Moat

**What We Do Better:**
1. **Dual Recovery Score:** Only platform tracking both physical AND mental recovery
2. **Universal Strain Tracking:** Works for all users, not just premium wearable owners
3. **Cross-Pillar Intelligence:** Fitness insights connected to nutrition and wellbeing
4. **AI Workout Planning:** Detailed, personalized workout plans (not just "do cardio")
5. **Multi-Modal Access:** Fitness data accessible via app, WhatsApp, and voice

**Where We Match (Feature Parity):**
- Core sleep metrics (duration, quality, stages)
- Activity tracking (steps, workouts, heart rate)
- Goal setting and progress tracking

**Strategic Positioning:**
> "WHOOP and BEVEL track your body. yHealth understands your whole self - connecting how you FEEL with how you PERFORM through conversational AI coaching."

---

## TESTING STRATEGY

### Unit Testing
- Recovery score calculation logic (physical + mental components)
- Strain score algorithms (HR-based, duration-based, perceived effort)
- Data normalization across wearable sources
- Goal progress calculations

### Integration Testing
- Wearable OAuth flows and data sync
- Cross-pillar data flow (fitness → nutrition, fitness → wellbeing)
- Multi-channel feature access (app, WhatsApp, voice)
- API endpoint responses and error handling

### User Acceptance Testing
- Light vs. Deep mode experiences validate with personas
- Recovery score accuracy (user agreement surveys)
- Workout recommendation relevance (acceptance rate tracking)
- Goal setting wizard usability

### Performance Testing
- Dashboard load time with 90 days of fitness data
- Recovery score calculation speed under load
- Concurrent wearable sync processing (1000+ users)
- API response times at scale

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Wearable API instability** | High | Medium | Retry logic, fallback to manual entry, multiple integration options |
| **Recovery score accuracy questioned** | High | Medium | Transparent calculation methodology, user feedback loops, gradual rollout |
| **Users don't value mental recovery** | Medium | Low | Education through insights, demonstrate value via cross-pillar connections |
| **AI workout recommendations unsafe** | Critical | Low | Exercise library review, safety checks, conservative initial recommendations, medical disclaimer |
| **Strain score confusing vs. WHOOP** | Medium | Medium | Clear differentiation messaging, transparency on calculation, option to show both |
| **Cross-pillar data insufficient** | High | Medium | Encourage multi-pillar logging, demonstrate value early, patience messaging |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 6 features (F5.1-F5.6) as defined above

### Post-MVP v1.1 (+3 months)
- **Real-time workout coaching:** Voice-guided workouts with biometric monitoring
- **Exercise video library:** Demos for all recommended exercises
- **Workout challenges:** Social/gamification element for engagement
- **Advanced strain:** Muscle group-specific fatigue tracking

### Post-MVP v1.2 (+6 months)
- **Predictive recovery:** "Tomorrow's recovery score will be X based on today's choices"
- **Training periodization:** AI-managed training cycles (base, build, peak, recovery)
- **Injury prevention:** Pattern detection for overuse and imbalance risks
- **Terra API integration:** Expand to 300+ wearable sources

### Post-MVP v2.0 (+12 months)
- **Clinical integrations:** Share fitness data with healthcare providers
- **Team/coach features:** Multi-user management for trainers
- **Advanced biometrics:** Blood oxygen, body temperature, glucose integration
- **AI personality customization:** Adjust coaching tone and style

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After E6 (Nutrition) and E7 (Wellbeing) Epic completion to ensure pillar balance
**Update Triggers:** User feedback from beta testing, wearable integration issues, cross-pillar insight performance
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from Engineering (technical feasibility) and Design (UX consistency)

---

## APPENDIX A: USER FLOWS

### Flow 1: New User - First Recovery Score
1. User completes onboarding (E1), connects WHOOP wearable
2. Day 1: Insufficient data for recovery score, see "Building your baseline..." message
3. Day 2-3: Partial recovery score with disclaimer
4. Day 7: Full dual recovery score with personalized recommendations
5. Cross-pillar insight surfaces: "Your physical recovery is 20% higher when you journal"

### Flow 2: Workout Recommendation Acceptance (Light Mode)
1. User opens app in morning
2. Dashboard shows: "Physical Recovery: 85 (Green), Mental Recovery: 78 (Yellow)"
3. Recommendation: "30-min Moderate Strength recommended today"
4. User taps "Start Workout"
5. Workout logged automatically via wearable sync
6. Post-workout: Strain score updates, recovery projected for tomorrow

### Flow 3: Goal Adjustment After Consistent Failure
1. User sets goal: "Run 5 days/week"
2. Week 1: 2/5 days achieved (40% success rate)
3. Week 2: 1/5 days achieved (20% success rate)
4. AI prompts: "Struggling with this goal. Let's adjust it together?"
5. User accepts, AI suggests: "Start with 3 days/week?"
6. User sets adjusted goal, achieves 3/3 days Week 3
7. Celebration: "Goal achieved! 3-day streak maintained."

---

## APPENDIX B: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Physical Recovery Score** | 0-100 score based on HRV, RHR, sleep quality, sleep duration - measures body readiness for activity |
| **Mental Recovery Score** | 0-100 score based on mood, stress, energy, journaling - measures mind readiness for activity |
| **yHealth Strain Score** | 0-100 score measuring training load/intensity for a single activity or day, calculated from HR/duration/type |
| **Strain-Recovery Ratio** | Weekly strain divided by weekly average recovery - optimal ratio ~1:1, >4.5 indicates overtraining risk |
| **HRV (Heart Rate Variability)** | Variation in time between heartbeats, higher = better recovery and autonomic nervous system balance |
| **RHR (Resting Heart Rate)** | Heart rate at complete rest, lower = better cardiovascular fitness and recovery |
| **Sleep Stages** | Wake, Light, Deep, REM - normalized across wearables to standard yHealth format |
| **Active Minutes** | Minutes spent in moderate-to-vigorous physical activity (heart rate elevated) |
| **Heart Rate Zones** | Zone 1-5 based on % of max HR - used for activity intensity and strain calculation |
| **Perceived Effort** | User's subjective rating of workout difficulty (1-10 scale), used when HR data unavailable |
| **Progressive Overload** | Gradual increase in workout difficulty over time to drive fitness improvements |
| **Active Recovery** | Low-intensity movement (walking, gentle yoga) that aids recovery without adding strain |

---

*yHealth Platform - E5: Fitness Pillar PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 6 | All MVP Core*
