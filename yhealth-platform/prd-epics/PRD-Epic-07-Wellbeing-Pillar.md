# yHealth Platform - Epic 07: Wellbeing Pillar

## EPIC OVERVIEW

### Epic Statement
The Wellbeing Pillar is ONE of yHealth's THREE EQUAL PILLARS (Physical Fitness, Nutrition, Daily Wellbeing) that enables users to track, understand, and improve their mental and emotional health through mood tracking, journaling, habit formation, stress detection, and mindfulness recommendations - all powered by AI insights and cross-domain intelligence.

### Epic Goal
Treat Daily Wellbeing as an EQUAL pillar alongside Fitness and Nutrition, delivering real-time mental health insights and patterns that competitors miss by relegating mental health to monthly surveys. This is yHealth's KEY DIFFERENTIATOR in the market.

### Core Philosophy
**"Daily Wellbeing as Equal Pillar" Strategy:** While competitors like WHOOP and BEVEL treat mental health as an afterthought (monthly surveys), yHealth makes Daily Wellbeing a first-class pillar with real-time tracking, multi-signal stress detection, and cross-pillar correlations that reveal how your mind affects your body and vice versa.

### Wellbeing Pillar Scope (7 Features)

| Feature | Description | MVP Status |
|---------|-------------|------------|
| **F7.1** | Mood Check-ins | Core |
| **F7.2** | Daily Journaling | Core |
| **F7.3** | Habit Tracking | Core |
| **F7.4** | Energy Level Monitoring | Core |
| **F7.5** | Stress Pattern Detection | Core |
| **F7.6** | Wellbeing Goals & Routines | Core |
| **F7.7** | Mindfulness Recommendations | Core |

---

## F7.1: MOOD CHECK-INS

### Description
Quick and flexible mood tracking that captures emotional state throughout the day using a spectrum from simple emoji selections to detailed emotional ratings. Designed to be low-friction enough for daily use while providing rich data for cross-pillar insights and pattern detection.

### User Story
As a **Holistic Health Seeker** (P1), I want to quickly log my mood multiple times per day without effort so that I can discover patterns between my emotional state and my physical health, sleep, and nutrition without mood tracking feeling like a chore.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Single emoji tap for mood (😊😐😟😡😰😴). Optional one-word descriptor. 5-second interaction. |
| **Deep** | Detailed emotional rating across multiple dimensions: Happiness (1-10), Energy (1-10), Stress (1-10), Anxiety (1-10), with optional context note and emotion tags (grateful, frustrated, excited, anxious, etc.). |

### User Decisions Applied
- **Quick emoji to detailed rating:** Light mode = emoji only, Deep mode = multi-dimensional
- **Capture frequency:** Multiple check-ins per day encouraged (morning, afternoon, evening)
- **Non-judgmental:** All moods are valid, no "good" or "bad" labeling
- **Cross-pillar foundation:** Mood data feeds Mental Recovery Score (F5.3) and cross-domain insights

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily mood logging rate | 80% of active users log mood ≥1x/day | Logging analytics |
| Multi-check-in adoption | 50% of users log mood ≥2x/day | Check-in frequency tracking |
| Light mode usage | 70% of check-ins use light mode (validates low friction) | Mode distribution analytics |
| Deep mode engagement | 30% use deep mode ≥1x/week (validates depth option) | Deep mode usage tracking |

### Acceptance Criteria

- [ ] Emoji-based mood selection available: 😊 Great, 😐 Okay, 😟 Low, 😡 Angry, 😰 Anxious, 😴 Tired
- [ ] Light mode: Single tap emoji selection with optional one-word descriptor
- [ ] Deep mode: Multi-dimensional rating scales (Happiness, Energy, Stress, Anxiety) 1-10 each
- [ ] Emotion tag library: Grateful, Frustrated, Excited, Anxious, Content, Overwhelmed, Peaceful, Irritated, Hopeful, Lonely, Confident, Sad, Energized, Calm (15+ tags)
- [ ] Optional context note field: "What's affecting your mood?" (free text)
- [ ] Quick access via all channels: Mobile app widget, Chat quick reply, Voice check-in
- [ ] Morning check-in prompt: "How are you feeling today?" sent at user's preferred time
- [ ] Evening reflection prompt: "How was your day overall?" sent before bedtime
- [ ] Mood timeline visualization: See mood patterns across day, week, month
- [ ] Mood data integrated into Mental Recovery Score (F5.3)
- [ ] Cross-pillar insights: Mood correlated with sleep, workouts, meals, habits

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Missed morning check-in** | No mood logged by 11am | Gentle reminder | "Haven't heard from you today. Quick mood check?" |
| **Multiple contradictory moods** | 😊 logged then 😟 within 1 hour | Accept both, note volatility | Silent: flag mood volatility for pattern detection |
| **Crisis indicators detected** | Extreme low mood + negative text | Escalation protocol (PRD Section 14) | "I'm concerned. Would it help to talk to someone?" + resources |
| **No mood logging for 3+ days** | Engagement gap detected | Re-engagement check-in | "Missed you! Everything okay? Even 'I'm busy' helps me understand." |

### Cross-Pillar Connections

**To Fitness (E5):**
- Mood predicts workout performance and enjoyment
- Exercise as intervention for low mood detection
- Mood impacts Mental Recovery Score which affects workout recommendations

**To Nutrition (E6):**
- Mood patterns reveal emotional eating triggers
- Comfort food consumption correlates with mood dips
- Nutritional deficiencies may contribute to mood instability

**To Cross-Domain Intelligence (E8):**
- "Your mood is 60% better on days with morning workouts and 7+ hours sleep"
- "Low mood days correlate with <5,000 steps and skipped breakfast"
- "Journaling before bed improves next-day mood by 35%"

### Dependencies
- **E4 (Mobile App):** Mood check-in widget, timeline visualization, emoji selection UI
- **E3 (Chat):** Quick emoji reply for mood logging, voice mood check-ins
- **E2 (Voice Coaching):** "How are you feeling?" conversational mood logging
- **E8 (Cross-Domain Intelligence):** Mood correlation engine with other pillars
- **F5.3 (Recovery Monitoring):** Mood data input for Mental Recovery Score

### MVP Status
[X] MVP Core

---

## F7.2: DAILY JOURNALING

### Description
Hybrid journaling system combining research-based prompt templates with AI-personalized prompts to facilitate reflection, emotional processing, and self-discovery. Supports both Light Mode (quick prompts, brief entries) and Deep Mode (extended reflection, multiple prompts) to match user engagement preferences and available time.

### User Story
As a **Busy Professional** (P2), I want guided journaling prompts that help me reflect meaningfully without staring at a blank page so that I can build a consistent journaling habit even with limited time while discovering insights about my mental and emotional patterns.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Single guided prompt, 1-3 sentence response. 2-5 minute session. Example: "What are you grateful for today?" or "What's one thing that went well?" |
| **Deep** | Multiple prompts with extended reflection, voice-to-text option, 10-20 minute session. Example: "Reflect on today's challenges" → "What did you learn?" → "How will you apply this tomorrow?" |

### User Decisions Applied
- **HYBRID prompts:** Templates from best practices/research + AI personalization when needed
- **Light/Deep modes:** Short entries valid, long reflection celebrated
- **Template + Personalization:** Research-based prompts as foundation, AI customizes based on user patterns
- **Non-judgmental space:** No "right" answers, all reflections are valuable

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily journaling rate | 60% of users journal ≥3x/week | Journaling frequency analytics |
| Journaling streak formation | 50% achieve 7+ day streak within first month | Streak tracking |
| Light vs. Deep adoption | 60% Light mode, 40% Deep mode (both valid) | Mode usage distribution |
| Journaling impact on Mental Recovery | +15 point Mental Recovery Score boost on journaling days | Recovery correlation analysis |

### Acceptance Criteria

- [ ] Prompt library with 50+ research-based journaling prompts across categories:
  - Gratitude: "What are you grateful for today?"
  - Reflection: "What's one thing that went well? One thing to improve?"
  - Emotional Processing: "How are you feeling? What's behind that emotion?"
  - Goal Setting: "What's one intention for tomorrow?"
  - Stress Management: "What's causing stress? What's in your control?"
  - Self-Compassion: "What would you say to a friend feeling this way?"
- [ ] AI personalization: Prompts adapt based on user's recent mood, activities, stress levels
- [ ] Light mode: 1-2 prompts, brief responses encouraged, 2-5 min target
- [ ] Deep mode: 3-5 prompts, extended reflection, 10-20 min session
- [ ] Voice-to-text journaling: Speak responses via  chat
- [ ] Structured templates: Morning Pages, Evening Reflection, Weekly Review, Monthly Check-in
- [ ] Unstructured option: "Free write" mode for blank-page journaling
- [ ] Journaling streaks tracked: 3-day, 7-day, 30-day milestones celebrated
- [ ] Private by default: All journal entries encrypted, user-only access
- [ ] Export capability: Download journal entries as text/PDF
- [ ] Journaling bonus: +10 points to Mental Recovery Score on journaling days
- [ ] Cross-pillar prompts: "How did today's workout affect your mood?" or "Notice any connections between meals and energy?"

### Research-Based Prompt Categories

**1. Gratitude Journaling (Evidence: improves wellbeing, reduces depression)**
- "List three things you're grateful for today and why they matter."
- "Who made a positive impact on you today? How did they help?"
- "What's a simple pleasure you enjoyed today?"

**2. Reflection & Growth (Evidence: increases self-awareness, goal achievement)**
- "What's one thing that went well today? What made it successful?"
- "What challenge did you face? What did you learn from it?"
- "How did you show up as your best self today?"

**3. Emotional Processing (Evidence: reduces anxiety, improves emotional regulation)**
- "What emotion are you feeling right now? What triggered it?"
- "What's weighing on your mind? Why does it matter to you?"
- "If this emotion had a message for you, what would it be?"

**4. Stress Management (Evidence: reduces cortisol, improves coping)**
- "What's causing stress right now? What parts are within your control?"
- "What's one action you can take to ease this stress?"
- "What would help you feel calmer right now?"

**5. Self-Compassion (Evidence: reduces self-criticism, improves mental health)**
- "What would you say to a friend going through what you're experiencing?"
- "What do you need to forgive yourself for today?"
- "How can you be kinder to yourself tomorrow?"

**6. Future Focus (Evidence: increases motivation, reduces anxiety)**
- "What's one intention you have for tomorrow?"
- "What are you looking forward to this week?"
- "What would make tomorrow feel successful?"

### AI Personalization Logic

```
Prompt Selection Algorithm:

1. User Context Analysis:
   - Recent mood patterns (from F7.1)
   - Stress levels (from F7.5)
   - Sleep quality (from F5.2)
   - Workout consistency (from F5.1)
   - Recent journal themes (text analysis)

2. Prompt Matching:
   - Low mood → Self-compassion or Gratitude prompts
   - High stress → Stress Management or Emotional Processing prompts
   - Good recovery → Reflection & Growth prompts
   - Missed workouts → Motivational or Future Focus prompts
   - Neutral state → Rotate through categories for variety

3. Personalization:
   - Insert user's name, recent activities, goals
   - Reference cross-pillar data: "How did yesterday's workout affect your sleep?"
   - Build on previous entries: "Last week you mentioned X, how's that going?"

4. Variety Management:
   - Avoid same prompt within 7 days
   - Balance categories across week
   - Introduce new prompts gradually
```

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Harmful content written** | Self-harm keywords detected | Escalation protocol (PRD Section 14) | Resources provided, supportive response |
| **Blank entry submitted** | Empty text field | Accept and encourage | "Even blank pages are valid. Want a different prompt?" |
| **Very short entries consistently** | <10 words for 7+ days | Suggest prompts or voice-to-text | "Quick entries are great! Want to try voice journaling?" |
| **Journaling streak broken** | Missed day after 7+ day streak | Gentle re-engagement | "7-day streak! Don't let one miss break the habit. Quick entry today?" |

### Cross-Pillar Connections

**To Fitness (E5):**
- Journaling completion adds +10 bonus to Mental Recovery Score
- Prompts reference workout patterns: "How did today's workout affect your mood?"
- Physical activity insights: "Notice any connection between movement and mental clarity?"

**To Nutrition (E6):**
- Emotional eating prompts: "What feelings led to food choices today?"
- Nutritional insights: "How did your meals affect your energy and mood?"
- Mindful eating reflection: "Did you eat with awareness or distraction today?"

**To Cross-Domain Intelligence (E8):**
- "Your mental recovery is 25% higher on days you journal"
- "Journaling before bed improves sleep quality by 18%"
- "You write 40% more on days with morning workouts - movement sparks reflection"

### Dependencies
- **E4 (Mobile App):** Journaling interface, prompt display, voice-to-text, entry history
- **E3 (Chat):** Quick journaling via voice messages or text replies
- **E2 (Voice Coaching):** Conversational journaling sessions
- **E8 (Cross-Domain Intelligence):** AI prompt personalization, text sentiment analysis
- **F5.3 (Recovery Monitoring):** Journaling bonus for Mental Recovery Score

### MVP Status
[X] MVP Core

---

## F7.3: HABIT TRACKING

### Description
User-customizable habit tracking system that allows users to define ANY habits they want to track (not limited to predefined categories) and analyze trends from any tracked behavior. Emphasizes flexibility, user ownership, and discovering personal patterns rather than prescribing "correct" habits.

### User Story
As an **Optimization Enthusiast** (P3), I want to track any habits that matter to me - from meditation to reading to screen time - and see correlations with my health so that I can discover my unique patterns and optimize my routines based on data, not assumptions.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Track 3-5 core habits with simple checkboxes. Quick daily completion view. Example: ✓ Meditated, ✓ Read 20min, ✓ No alcohol. |
| **Deep** | Track unlimited habits with custom frequency (daily, weekly, specific days), intensity ratings, notes, trend analysis, correlation insights, export data. |

### User Decisions Applied
- **USER-CUSTOMIZABLE categories:** Users define their own habits, not limited to preset list
- **Work with user:** Suggest common habits but allow full flexibility
- **Make as many trends as possible:** Correlate ANY habit with mood, energy, sleep, workouts, nutrition
- **No judgment:** Track "negative" habits too (e.g., alcohol, procrastination) for awareness

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Habit tracking adoption | 70% of users create ≥1 custom habit | Habit creation analytics |
| Daily habit logging rate | 65% of users log habits ≥5 days/week | Logging frequency tracking |
| Habit-correlation insights | 80% of users receive habit correlation insights within 14 days | Insight delivery tracking |
| Habit formation success | 50% achieve 21+ day streak on ≥1 habit | Streak achievement analytics |

### Acceptance Criteria

- [ ] Users can create unlimited custom habits with fields:
  - Habit name (free text, any habit)
  - Frequency: Daily, Weekly, Specific days (M/T/W/T/F/S/S)
  - Tracking type: Checkbox (yes/no), Counter (quantity), Duration (minutes), Rating (1-10)
  - Category (optional): Suggested categories (Mindfulness, Social, Health, Productivity, Learning, Self-Care, Recreation, Avoidance) but user can create new categories
- [ ] Pre-populated suggestions: Meditation, Journaling, Reading, Gratitude practice, No alcohol, No caffeine after 2pm, Social connection, Creative work, Deep work, Exercise, Healthy breakfast, 8+ hours sleep, Morning routine, Evening routine, Screen-free evening, Outdoor time
- [ ] Light mode: Track 3-5 top priority habits with checkbox completion
- [ ] Deep mode: Unlimited habits, detailed tracking (quantity, duration, ratings), notes per habit
- [ ] Habit streak tracking: Visual streak counters for each habit (3-day, 7-day, 21-day, 30-day milestones)
- [ ] Daily habit dashboard: Morning/evening checklist view for all tracked habits
- [ ] Habit analytics: Completion rate, longest streak, 30-day trend chart
- [ ] Cross-pillar correlations: "Your mood is 45% better on days you meditate" or "Sleep quality improves 20% when you avoid caffeine after 2pm"
- [ ] Habit reminders: Optional daily reminders for specific habits at user-defined times
- [ ] Habit templates: Common habit bundles (Morning Routine, Evening Routine, Wellness Weekend)
- [ ] Export habit data: Download habit logs and correlation insights

### Habit Tracking Types

**Type 1: Checkbox (Binary Yes/No)**
- Example: "Meditated today" → ✓ or ✗
- Use case: Simple completion tracking

**Type 2: Counter (Quantity)**
- Example: "Glasses of water" → 8
- Use case: Quantifiable behaviors

**Type 3: Duration (Time-based)**
- Example: "Deep work" → 90 minutes
- Use case: Time investment tracking

**Type 4: Rating (1-10 Scale)**
- Example: "Social connection quality" → 8/10
- Use case: Qualitative assessment

### Suggested Habit Categories (User Can Customize)

**1. Mindfulness & Wellbeing**
- Meditation, Journaling, Gratitude practice, Breathing exercises, Mindful eating

**2. Social Connection**
- Quality time with loved ones, Meaningful conversation, Social activity, Phone call with friend

**3. Health & Self-Care**
- Morning routine, Evening routine, Skincare, Stretching, Foam rolling, Cold shower, Hot bath

**4. Productivity & Learning**
- Deep work session, Reading, Creative work, Learning new skill, No phone before 9am

**5. Avoidance Habits (Awareness-based)**
- No alcohol, No caffeine after 2pm, No social media, No screens 1hr before bed, No snacking after dinner

**6. Recreation & Joy**
- Outdoor time, Hobby time, Play/fun activity, Music/art, Time in nature

### Cross-Pillar Correlation Engine

```
Habit Correlation Analysis:

For each tracked habit, calculate correlations with:

1. Mood (F7.1):
   - "Your mood is X% better on days you [habit]"
   - "Low mood days have 60% lower [habit] completion"

2. Energy (F7.4):
   - "Energy levels are X points higher when you [habit]"
   - "Afternoon energy crashes 40% less frequent on [habit] days"

3. Sleep (F5.2):
   - "Sleep quality improves X% when you [habit]"
   - "[Habit] before bed correlates with 30min faster sleep onset"

4. Workouts (F5.1):
   - "Workout performance is X% better after [habit]"
   - "You complete [habit] 80% more on workout days"

5. Stress (F7.5):
   - "Stress levels are X% lower on [habit] days"
   - "[Habit] reduces stress reactivity by X%"

Minimum data: 14 days of habit + correlating metric tracking
Confidence threshold: >0.3 correlation coefficient to surface insight
Insight generation: Weekly habit-correlation summary delivered
```

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Too many habits created** | >15 active habits | Suggest prioritization | "Tracking many habits! Focus on 5-7 core habits for better consistency?" |
| **Habit never completed** | 0% completion for 14+ days | Suggest removing or modifying | "Haven't completed [habit]. Adjust goal or remove to keep list focused?" |
| **Conflicting habits** | "Exercise daily" + "Rest every day" | Flag potential conflict | "These habits may conflict. Adjust one to be more realistic?" |
| **Habit streak broken after 21+ days** | Missed day after long streak | Encouragement, reset option | "21-day streak! One miss doesn't erase progress. Keep going?" |

### Cross-Pillar Connections

**To Fitness (E5):**
- Exercise-related habits tracked: "Morning workout," "10k steps," "Stretch daily"
- Habit completion correlates with workout consistency
- Habits affect Physical and Mental Recovery Scores

**To Nutrition (E6):**
- Nutrition habits: "Healthy breakfast," "No alcohol," "Hydration goal," "Mindful eating"
- Habits reveal nutritional patterns and triggers

**To Mood/Energy (F7.1, F7.4):**
- Habit correlations with mood and energy are PRIMARY insights
- Users discover which habits boost emotional state

**To Cross-Domain Intelligence (E8):**
- "Your best days: 7+ hours sleep + morning meditation + workout"
- "Reading before bed improves sleep quality 25%"
- "No caffeine after 2pm = 18% better mood next day"

### Dependencies
- **E4 (Mobile App):** Habit tracking UI, checkbox/counter interfaces, analytics dashboard
- **E3 (Chat):** Quick habit logging via chat ("✓ meditated")
- **E2 (Voice Coaching):** Voice habit check-ins ("Did you meditate today?")
- **E8 (Cross-Domain Intelligence):** Habit correlation engine, pattern detection

### MVP Status
[X] MVP Core

---

## F7.4: ENERGY LEVEL MONITORING

### Description
Continuous energy tracking throughout the day that captures energy fluctuations and correlates them with activities, meals, sleep, stress, and habits to reveal personalized energy patterns and optimization opportunities. Unlike one-time daily ratings, this tracks energy as a dynamic metric across the day.

### User Story
As a **Busy Professional** (P2), I want to understand my energy patterns throughout the day and what causes energy dips so that I can optimize my schedule, meals, and activities to maintain consistent energy instead of fighting afternoon crashes.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple 1-10 energy rating 2-3x/day (morning, afternoon, evening). Quick slider input. |
| **Deep** | Energy ratings on-demand throughout day with context tagging (post-meal, post-workout, during work, etc.), historical energy charts, pattern insights, export data. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily energy logging | 70% of users log energy ≥2x/day | Logging frequency analytics |
| Energy pattern insights | 75% receive energy correlation insights within 7 days | Insight delivery tracking |
| Energy optimization | 50% of users report improved energy management in 30 days | User surveys |
| Multi-time-point logging | 40% log energy ≥3x/day (validates granular tracking) | Check-in frequency distribution |

### Acceptance Criteria

- [ ] Energy rating scale: 1-10 (1 = Exhausted, 5 = Neutral, 10 = Highly Energized)
- [ ] Quick energy check-in: Single slider tap, <5 seconds
- [ ] Prompted check-ins: Morning (8-10am), Afternoon (2-4pm), Evening (7-9pm) at user's preferred times
- [ ] On-demand logging: Users can log energy anytime, especially during significant shifts
- [ ] Context tagging: Post-meal, Post-workout, During work, After sleep, After caffeine, After social activity
- [ ] Energy timeline: Visual chart showing energy levels across the day
- [ ] Light mode: 2-3 check-ins/day, simple rating
- [ ] Deep mode: Unlimited check-ins, detailed context notes, pattern analysis
- [ ] Energy trend analysis: 7-day, 30-day energy patterns with average/min/max
- [ ] Cross-pillar correlations:
  - Energy vs. Sleep quality: "7+ hours sleep = +3 energy points average"
  - Energy vs. Meals: "High-protein breakfast = 25% better morning energy"
  - Energy vs. Workouts: "Morning workouts boost all-day energy by 18%"
  - Energy vs. Stress: "High stress days = -2.5 energy points average"
- [ ] Energy dip detection: Alert when afternoon energy crashes consistently (<4 rating)
- [ ] Energy data feeds Mental Recovery Score calculation (F5.3)

### Energy Correlation Analysis

```
Energy Pattern Detection:

1. Time-of-Day Patterns:
   - Morning energy baseline (average 7-10am)
   - Afternoon dip detection (1-4pm energy drop >3 points)
   - Evening energy levels (7-10pm)
   - Identify user's natural energy peaks and valleys

2. Sleep-Energy Correlation:
   - Compare sleep duration/quality with next-day morning energy
   - "7-8 hours sleep → 8/10 morning energy"
   - "5-6 hours sleep → 4/10 morning energy"

3. Meal-Energy Correlation:
   - Track energy before/after meals (30min, 60min, 90min post-meal)
   - Detect energy crashes after high-carb meals
   - Identify energy-boosting meal patterns

4. Activity-Energy Correlation:
   - Exercise impact on energy (immediate post-workout vs. 2-4 hours later)
   - Sedentary periods and energy dips
   - "Movement breaks increase energy by X%"

5. Stress-Energy Correlation:
   - High stress days vs. energy levels
   - Stress management activities and energy recovery

6. Habit-Energy Correlation:
   - Meditation, caffeine, social time impact on energy
   - "No caffeine after 2pm = +1.5 evening energy"

Minimum data: 7 days of energy logging + correlating metrics
Insight generation: Weekly energy report with top 3 correlations
```

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Chronic low energy** | Average energy <4 for 7+ days | Health concern prompt | "Your energy has been low lately. Consider talking to a healthcare provider?" |
| **Missed energy check-ins** | No logging for 3+ days | Re-engagement nudge | "Haven't tracked energy recently. Quick check: How's your energy right now?" |
| **Contradictory energy ratings** | 9/10 then 2/10 within 1 hour | Accept and note volatility | Silent: flag for pattern analysis (e.g., caffeine crash) |
| **No context data for correlation** | Energy logged but no sleep/meal data | Encourage multi-pillar logging | "Track sleep and meals to discover what affects your energy!" |

### Cross-Pillar Connections

**To Fitness (E5):**
- Morning energy level predicts workout performance
- Exercise timing affects energy patterns (morning workout = all-day energy boost)
- Energy data feeds Mental Recovery Score (20% weight)

**To Nutrition (E6):**
- Post-meal energy tracking reveals food-energy connections
- Meal timing and energy correlation: "Eating before 8pm = better morning energy"
- Macronutrient patterns and energy stability

**To Sleep (F5.2):**
- Sleep quality is PRIMARY predictor of morning energy
- Poor sleep = low energy = Mental Recovery Score impacted
- Energy dips may indicate sleep debt accumulation

**To Mood (F7.1):**
- Energy and mood are interconnected: low energy often precedes low mood
- Energy interventions (movement, meals) can boost mood

**To Habits (F7.3):**
- Habit completion correlates with energy levels
- Discover which habits boost energy, which drain it

**To Cross-Domain Intelligence (E8):**
- "Your peak energy: 8+ hours sleep + high-protein breakfast + morning workout"
- "Afternoon energy crashes 60% less when you eat lunch before 1pm"
- "Energy is 30% higher on days you meditate in the morning"

### Dependencies
- **E4 (Mobile App):** Energy rating widget, timeline visualization, trend charts
- **E3 (Chat):** Quick energy check-ins via chat ("Energy check: 7/10")
- **E2 (Voice Coaching):** Voice energy logging ("I'm feeling low energy right now")
- **E8 (Cross-Domain Intelligence):** Energy correlation engine
- **F5.3 (Recovery Monitoring):** Energy data input for Mental Recovery Score

### MVP Status
[X] MVP Core

---

## F7.5: STRESS PATTERN DETECTION

### Description
Multi-signal stress detection system that combines self-reported stress ratings with biometric cues (heart rate variability, resting heart rate), text sentiment analysis from journaling, and app usage patterns to identify stress levels and patterns. This comprehensive approach reveals stress even when users don't explicitly report it.

### User Story
As a **Holistic Health Seeker** (P1), I want the AI to detect stress patterns from multiple signals - not just when I remember to log it - so that I can get proactive recommendations before stress accumulates and affects my health, mood, and performance.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple stress rating 1-10 once daily. AI detects stress from other signals (HRV, mood, journaling tone) and alerts when patterns concerning. |
| **Deep** | Detailed stress tracking: self-ratings multiple times/day, biometric stress monitoring, stress triggers identification, coping strategy effectiveness tracking, stress pattern reports. |

### User Decisions Applied
- **MULTI-SIGNAL approach:** Use ALL available data (self-report + biometrics + text sentiment + app usage patterns)
- **Even if user doesn't use app, that's an insight:** Non-usage may indicate busy/stressed/unmotivated/annoyed - validate later
- **Proactive stress detection:** AI surfaces stress patterns before user consciously recognizes them
- **No crisis intervention system:** Just don't promote self-harm (per PRD Section 14 boundaries)

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Stress detection accuracy | 70% user agreement when AI flags stress | Validation surveys |
| Multi-signal stress insights | 60% receive stress insights from non-self-report signals | Insight source analytics |
| Proactive stress alerts | 50% receive stress pattern alerts before self-reporting high stress | Predictive accuracy tracking |
| Stress management improvement | 55% report better stress awareness in 30 days | User surveys |

### Acceptance Criteria

- [ ] **Signal 1: Self-Report Stress Ratings**
  - 1-10 stress scale (1 = No stress, 5 = Moderate, 10 = Extreme stress)
  - Daily stress check-in prompt (evening)
  - On-demand stress logging anytime
  - Stress triggers tagging: Work, Relationships, Finances, Health, Family, Uncertainty, Other

- [ ] **Signal 2: Biometric Cues (if available from wearables)**
  - Heart Rate Variability (HRV): Low HRV = higher stress
  - Resting Heart Rate: Elevated RHR = potential stress indicator
  - Sleep disruption patterns: Poor sleep correlates with stress
  - Compare biometrics to user's 30-day baseline

- [ ] **Signal 3: Text Sentiment Analysis**
  - Analyze journaling entries for stress-related language
  - Detect keywords: "overwhelmed," "anxious," "stressed," "can't cope," "too much"
  - Sentiment scoring: Negative sentiment trends indicate stress accumulation
  - Tone shift detection: Sudden change from positive to negative journaling

- [ ] **Signal 4: App Usage Patterns**
  - Reduced engagement = possible stress/overwhelm ("too busy to use app")
  - Irregular logging patterns = life disruption indicator
  - Missed routines (journaling, habits, mood check-ins) = stress signal
  - Sudden increase in mood logging = awareness of emotional shift

- [ ] **Stress Pattern Detection:**
  - Chronic stress: Average stress >7 for 7+ days
  - Stress spikes: Sudden increase >3 points in <24 hours
  - Stress volatility: Large fluctuations day-to-day
  - Time-of-day patterns: Morning stress vs. evening stress
  - Trigger patterns: Recurring stress sources

- [ ] **Stress Alerts & Recommendations:**
  - "Your stress has been high for 5 days. Here are some strategies..."
  - "Biometric data suggests increased stress even though you haven't logged it. Check in?"
  - "Your journaling tone has shifted. Want to talk about what's going on?"
  - "You've been too busy to log lately. Everything okay?"

- [ ] **Stress Management Recommendations:**
  - Immediate: Breathing exercises, short walk, 5-min meditation
  - Short-term: Schedule downtime, reduce commitments, sleep prioritization
  - Long-term: Therapy resources, stress management courses, lifestyle changes
  - Contextual: "Your stress is lowest on days you exercise and journal"

- [ ] Light mode: Daily stress rating, AI-detected stress alerts
- [ ] Deep mode: Multi-signal stress dashboard, trigger analysis, coping strategy tracking
- [ ] Stress data feeds Mental Recovery Score (30% weight)
- [ ] Cross-pillar stress insights: "Stress 40% lower on workout days," "High stress = poor sleep quality"

### Multi-Signal Stress Detection Algorithm

```
Stress Level Calculation (0-10 Scale):

Base Score (if self-reported):
- User's self-reported stress rating (1-10)

Biometric Adjustments (if wearable data available):
- Low HRV (below 30-day baseline): +1 to +3 points
- Elevated RHR (above baseline): +1 to +2 points
- Poor sleep quality (<60/100): +1 point
- Sleep disruption (wake-ups >5): +1 point

Text Sentiment Adjustments:
- Negative journaling sentiment: +1 to +2 points
- Stress keywords detected: +1 point per occurrence (max +3)
- Tone shift (positive → negative): +1 point

Behavioral Adjustments:
- Missed check-ins for 3+ days: +1 point (may indicate overwhelm)
- Irregular logging patterns: +0.5 points
- Decreased engagement: +0.5 points
- Increased mood logging (possible awareness): +0.5 points

Final Stress Score = Base + Adjustments (capped at 10)

Stress Categories:
- 0-3: Low stress (green)
- 4-6: Moderate stress (yellow)
- 7-8: High stress (orange)
- 9-10: Extreme stress (red)

Alert Triggers:
- Score ≥7 for 3+ consecutive days
- Score increase >3 points in 24 hours
- Biometric stress + low self-report (user may not recognize stress)
- Journaling sentiment decline without stress self-report
```

### Stress Pattern Insights

**Time-of-Day Patterns:**
- "Your stress peaks between 2-5pm on workdays. Plan breaks during this window."
- "Morning stress is 60% higher on Mondays. Sunday evening routine could help."

**Trigger Patterns:**
- "Work stress accounts for 70% of high-stress days. Set boundaries?"
- "Relationship stress correlates with sleep disruption. Communication patterns to explore?"

**Coping Effectiveness:**
- "Exercise reduces stress by 35% within 2 hours. Use movement as stress intervention."
- "Journaling before bed lowers next-day stress by 20%."

**Cross-Pillar Connections:**
- "Stress 50% lower on days with 7+ hours sleep and morning workout."
- "High-stress weeks = 40% worse recovery scores. Prioritize rest."

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Chronic extreme stress** | Stress ≥9 for 5+ days | Escalation protocol (PRD Section 14) | "Your stress is very high. Consider talking to a professional?" + resources |
| **Stress detected but not self-reported** | Biometrics + sentiment indicate stress, no self-report | Gentle inquiry | "I'm noticing some stress signals. How are you really feeling?" |
| **User busy, not logging** | No app usage for 5+ days | Non-intrusive check-in | "Haven't heard from you. Busy week? Even 'I'm swamped' helps me understand." |
| **Conflicting signals** | Low self-report stress but high biometric stress | Surface discrepancy | "You said stress is low, but your body signals show tension. Explore this?" |

### Cross-Pillar Connections

**To Fitness (E5):**
- Stress directly impacts recovery: High stress = lower Physical AND Mental Recovery Scores
- Exercise is proven stress reducer: Recommend movement during high-stress periods
- Chronic stress impairs workout performance and recovery

**To Nutrition (E6):**
- Stress affects eating patterns: Comfort food cravings, skipped meals, emotional eating
- Nutritional deficiencies (magnesium, B vitamins) may worsen stress
- Stress-nutrition feedback loop: Poor nutrition → worse stress tolerance

**To Sleep (F5.2):**
- Stress is PRIMARY sleep disruptor: Difficulty falling asleep, frequent wake-ups, poor quality
- Sleep deprivation worsens stress reactivity
- Bi-directional relationship: Stress → poor sleep → more stress

**To Mood/Energy (F7.1, F7.4):**
- Stress correlates with low mood and energy
- Stress management improves mood and energy levels
- Chronic stress leads to mood disorders if unmanaged

**To Habits (F7.3):**
- Stress disrupts habit consistency
- Stress-reducing habits (meditation, journaling) measurably decrease stress scores

**To Cross-Domain Intelligence (E8):**
- "Your stress is 60% lower on days with: 7+ hours sleep + workout + journaling"
- "High stress weeks: recovery scores drop 40%, workout performance declines 25%"
- "Stress patterns: Work peaks Tue-Thu, lowest weekends. Optimize schedule accordingly?"

### Dependencies
- **E9 (Data Integrations):** HRV and RHR data from wearables for biometric stress detection
- **F7.2 (Daily Journaling):** Text sentiment analysis from journal entries
- **E4 (Mobile App):** Stress rating UI, stress dashboard, pattern visualization
- **E8 (Cross-Domain Intelligence):** Multi-signal stress detection engine, pattern analysis
- **F5.3 (Recovery Monitoring):** Stress data input for Mental Recovery Score (30% weight)

### MVP Status
[X] MVP Core

---

## F7.6: WELLBEING GOALS & ROUTINES

### Description
Comprehensive goal-setting and routine-building system for wellbeing improvements including morning/evening routines, stress reduction targets, mood improvement goals, habit formation, and mindfulness practices. Integrates with existing habit tracking (F7.3) while adding routine templates and wellbeing-specific goal frameworks.

### User Story
As a **Habit Formation Seeker** (P4), I want to build sustainable morning and evening routines with gentle accountability so that I can create consistency in my wellbeing practices without feeling overwhelmed by too many changes at once.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Pre-built routine templates (Morning Energizer, Evening Wind-Down), 3-5 steps, simple completion tracking. |
| **Deep** | Custom routine builder, detailed goal setting with SMART criteria, progress analytics, routine optimization recommendations, multiple concurrent goals/routines. |

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Routine adoption | 65% of users create ≥1 routine (morning or evening) | Routine creation analytics |
| Routine consistency | 60% maintain routine ≥5 days/week for 30+ days | Routine completion tracking |
| Wellbeing goal achievement | 55% achieve wellbeing goal within timeframe | Goal completion analytics |
| Morning routine impact | 70% report improved mood/energy on routine-completion days | Correlation analysis |

### Acceptance Criteria

- [ ] **Pre-Built Routine Templates:**
  - **Morning Energizer:** Gratitude (1 min) → Stretch (5 min) → Hydrate (1 glass) → Intention setting (2 min)
  - **Evening Wind-Down:** Screen-free time (30 min before bed) → Journal (5 min) → Breathing exercise (3 min) → Gratitude (1 min)
  - **Stress Reset:** Deep breathing (5 min) → Body scan (5 min) → Stress journaling (5 min)
  - **Mindfulness Morning:** Meditation (10 min) → Journaling (5 min) → Intention setting
  - **Active Recovery Evening:** Light walk (15 min) → Stretching (10 min) → Relaxing activity

- [ ] **Custom Routine Builder:**
  - Add/remove steps from templates
  - Define custom steps with duration, order, and optional reminders
  - Set routine frequency: Daily, Weekdays, Weekends, Specific days
  - Time-based triggers: "Start morning routine at 7am," "Evening routine at 9pm"

- [ ] **Wellbeing Goal Categories:**
  - **Mood Improvement:** "Increase average mood from 6 to 8 within 30 days"
  - **Stress Reduction:** "Reduce stress days >7 from 4/week to 1/week"
  - **Energy Optimization:** "Achieve morning energy ≥7 for 5+ days/week"
  - **Habit Formation:** "Meditate 5 days/week for 21 consecutive days"
  - **Sleep Quality:** "Improve sleep quality score from 70 to 85"
  - **Emotional Regulation:** "Reduce mood volatility (daily mood range <3 points)"

- [ ] **SMART Goal Framework:**
  - Specific: Clear target metric (mood score, stress days, habit streak)
  - Measurable: Quantifiable progress tracking
  - Achievable: AI suggests realistic targets based on baseline
  - Relevant: Connected to wellbeing improvements
  - Time-bound: 7-day, 21-day, 30-day, 90-day goal windows

- [ ] **Routine Tracking:**
  - Daily completion checklist for each routine step
  - Streak tracking: 3-day, 7-day, 21-day, 30-day milestones
  - Partial completion tracking (completed 3/5 steps = 60%)
  - Routine consistency score: 5/7 days = 71% consistency

- [ ] **Progress Visualization:**
  - Goal progress bars with percentage and days remaining
  - Routine completion calendar view (visual streaks)
  - Trend charts: Mood trend during goal period, stress reduction trajectory

- [ ] **AI Routine Recommendations:**
  - "Based on your patterns, adding meditation to your morning routine could boost mood by 20%"
  - "Evening journaling improves your sleep quality. Add to wind-down routine?"
  - "Your stress is lowest on days you complete morning routine. Prioritize it?"

- [ ] Light mode: Pre-built routines, simple checklist, basic goal tracking
- [ ] Deep mode: Custom routines, multiple goals, detailed analytics, optimization insights
- [ ] Routine reminders: Push notifications or Chat reminders at routine time
- [ ] Routine completion bonus: +5 Mental Recovery Score when routine completed
- [ ] Cross-pillar routine integration: "Morning routine + workout = 35% better all-day energy"

### Pre-Built Routine Details

**Morning Energizer (15 minutes):**
1. Gratitude reflection (1 min): "What are you grateful for today?"
2. Light stretching (5 min): Gentle movement to wake up body
3. Hydrate (1 glass water): Rehydrate after sleep
4. Deep breathing (3 min): 4-7-8 breathing technique
5. Intention setting (2 min): "What's one intention for today?"

**Evening Wind-Down (20 minutes):**
1. Screen-free time (start 30 min before bed): No phones, TV, or bright screens
2. Reflection journaling (5 min): "What went well today? What to release?"
3. Breathing exercise (3 min): Box breathing or progressive relaxation
4. Gratitude practice (2 min): "Three things from today I'm grateful for"
5. Sleep preparation: Dark, cool room, ready for rest

**Stress Reset (15 minutes - can be done anytime):**
1. Find quiet space (1 min): Step away from stressor
2. Deep breathing (5 min): Focus on slowing breath, calming nervous system
3. Body scan (5 min): Notice tension, consciously relax each area
4. Stress journaling (5 min): "What's causing stress? What's in my control?"

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Routine never completed** | 0% completion for 7+ days | Suggest simplifying or removing | "Haven't completed this routine. Make it easier or remove it?" |
| **Partial routine completion** | Consistently completes 2/5 steps only | Suggest focusing on core steps | "You love these 2 steps! Make them your core routine?" |
| **Unrealistic wellbeing goal** | Goal >50% improvement in 7 days | Suggest extended timeframe | "This goal is ambitious! Try 30 days for sustainable change?" |
| **Routine streak broken** | Missed routine after 14+ day streak | Encouragement to resume | "14-day streak! One miss doesn't erase progress. Resume today?" |

### Cross-Pillar Connections

**To Habits (F7.3):**
- Routines are structured habit bundles
- Routine completion can be tracked as single habit or individual steps
- Habits from F7.3 can be added to custom routines

**To Mood/Energy (F7.1, F7.4):**
- Morning routine completion correlates with improved mood and energy
- Evening routine improves next-day mood and energy
- Routine consistency reduces mood volatility

**To Sleep (F5.2):**
- Evening wind-down routine improves sleep quality and onset latency
- Consistent evening routine = better sleep consistency
- Screen-free evening routine targets sleep optimization

**To Stress (F7.5):**
- Stress Reset routine provides acute stress intervention
- Regular routine practice builds stress resilience
- Routine completion during high-stress periods acts as protective factor

**To Recovery (F5.3):**
- Morning and evening routines add bonus to Mental Recovery Score
- Consistent routines improve both Physical and Mental recovery
- Wellbeing goals aligned with recovery optimization

**To Cross-Domain Intelligence (E8):**
- "Completing morning routine before workout = 40% better performance"
- "Evening routine completion = 25% better sleep quality and +2 mood next day"
- "Your best weeks: Morning routine 6+/7 days + meditation 5+/7 days"

### Dependencies
- **E4 (Mobile App):** Routine checklist UI, goal setting wizard, progress tracking
- **E3 (Chat):** Routine reminders, quick routine completion logging
- **E2 (Voice Coaching):** Voice-guided routine steps, conversational goal setting
- **F7.3 (Habit Tracking):** Integration with habit tracking system
- **E8 (Cross-Domain Intelligence):** Routine-outcome correlation analysis

### MVP Status
[X] MVP Core

---

## F7.7: MINDFULNESS RECOMMENDATIONS

### Description
AI coach that suggests mindfulness practices (meditation, breathing exercises, body scans, mindful walking) based on current stress levels, mood, energy, and context - WITHOUT providing guided audio content. Acts as a knowledgeable coach who recommends practices and explains benefits, not a meditation app replacement.

### User Story
As a **Busy Professional** (P2), I want AI to recommend specific mindfulness practices when I'm stressed or low energy so that I know what to do without needing to become a mindfulness expert or use a separate meditation app.

### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple recommendations: "Try 3 minutes of deep breathing right now" or "A 5-minute walk could help." One-tap accept/decline. |
| **Deep** | Detailed practice instructions, context explanations ("Why this helps your stress"), multiple practice options, practice library, effectiveness tracking. |

### User Decisions Applied
- **NOT like meditation apps:** No guided audio content, no meditation courses
- **Just a coach who recommends and suggests:** Text-based recommendations with instructions
- **Context-aware prompts:** Recommendations triggered by stress, mood, energy, time of day
- **Integration not replacement:** Complement existing meditation apps if user has them

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Recommendation acceptance | 55% accept mindfulness recommendation when offered | Acceptance tracking |
| Practice completion | 70% complete recommended practice after accepting | Completion tracking |
| Stress reduction post-practice | 60% report lower stress after mindfulness practice | Post-practice feedback |
| Regular practice adoption | 40% do mindfulness ≥3x/week after 30 days | Practice frequency analytics |

### Acceptance Criteria

- [ ] **Mindfulness Practice Library (15+ practices):**
  - **Breathing Exercises:** Box breathing (4-4-4-4), 4-7-8 breathing, diaphragmatic breathing
  - **Meditation:** Body scan (5/10/20 min), Loving-kindness meditation, Mindfulness meditation, Gratitude meditation
  - **Movement:** Mindful walking, Gentle stretching, Progressive muscle relaxation
  - **Quick Resets:** 1-minute breathing, 2-minute body awareness, 3-minute gratitude
  - **Evening Practices:** Sleep meditation preparation, Evening reflection, Body scan for sleep

- [ ] **Practice Details (Text-Based Instructions):**
  - Step-by-step written instructions
  - Duration options: 1-min, 3-min, 5-min, 10-min, 20-min
  - "Why this helps" explanation: Science-based benefits
  - "When to use" guidance: Best contexts for each practice
  - No audio recordings (user can use external apps if desired)

- [ ] **Context-Aware Recommendations:**
  - **High stress detected (F7.5):** "Your stress is high. Try 5 minutes of box breathing?"
  - **Low energy (F7.4):** "Feeling low energy? A 3-minute breathing exercise could help."
  - **Poor sleep night (F5.2):** "After poor sleep, a gentle body scan might restore you."
  - **Low mood (F7.1):** "Your mood is low. Loving-kindness meditation could lift your spirits."
  - **Pre-workout (F5.1):** "Before your workout, try 2 minutes of breath focus for mental clarity."
  - **Evening routine (F7.6):** "Add 5 minutes of sleep meditation to your wind-down routine?"
  - **Time-based:** "Good morning! Start with 3 minutes of gratitude meditation?"

- [ ] **Practice Tracking:**
  - Log practice completion: Which practice, duration, how it felt (1-10 rating)
  - Track practice effectiveness: "Did this help?" post-practice survey
  - Practice history: See all completed practices, frequency, effectiveness ratings
  - Favorite practices: AI learns which practices user responds to best

- [ ] **Recommendation Logic:**
  - Avoid recommending same practice 2 days in a row (variety)
  - Prioritize practices user has rated highly
  - Adapt duration to user's available time and stress level
  - Escalate practice intensity: 1-min for beginners → 10-min for experienced

- [ ] Light mode: Simple recommendation with one-tap accept, basic instructions
- [ ] Deep mode: Multiple practice options, detailed explanations, effectiveness tracking
- [ ] Chat delivery: "Quick stress reset: Try box breathing. Inhale 4, hold 4, exhale 4, hold 4. Repeat 4 times."
- [ ] Voice delivery: AI coach explains practice verbally, user follows along
- [ ] NO guided audio: yHealth does NOT compete with Headspace/Calm - just recommends practices

### Mindfulness Practice Examples (Text Instructions)

**Box Breathing (4-4-4-4) - 3 minutes:**
*When to use: High stress, anxiety, need to calm down quickly*
*Why it helps: Activates parasympathetic nervous system, reduces stress hormones*

Instructions:
1. Find a comfortable seated position
2. Inhale slowly through your nose for 4 counts
3. Hold your breath for 4 counts
4. Exhale slowly through your mouth for 4 counts
5. Hold empty lungs for 4 counts
6. Repeat for 3 minutes (about 8-10 cycles)

**Body Scan Meditation - 10 minutes:**
*When to use: Bedtime, after stressful day, muscle tension*
*Why it helps: Releases physical tension, grounds you in present moment*

Instructions:
1. Lie down or sit comfortably, close your eyes
2. Take 3 deep breaths to settle in
3. Bring attention to your toes - notice any sensation, tension, warmth
4. Slowly move awareness up through: feet, calves, knees, thighs, hips, abdomen, chest, hands, arms, shoulders, neck, face, head
5. Spend 30-60 seconds on each body area
6. If you notice tension, breathe into it and consciously relax
7. Finish with 3 deep breaths, slowly open eyes

**Loving-Kindness Meditation - 5 minutes:**
*When to use: Low mood, feeling disconnected, need emotional warmth*
*Why it helps: Activates compassion, reduces self-criticism, improves mood*

Instructions:
1. Sit comfortably, close your eyes, take 3 deep breaths
2. Bring to mind someone you love - visualize them clearly
3. Silently repeat: "May you be happy. May you be healthy. May you be safe. May you be at peace."
4. Now bring yourself to mind: "May I be happy. May I be healthy. May I be safe. May I be at peace."
5. Extend to someone neutral (acquaintance): Same phrases
6. If you're ready, extend to someone difficult: Same phrases
7. Finally, extend to all beings: "May all beings be happy, healthy, safe, and peaceful."

**Mindful Walking - 10 minutes:**
*When to use: Need movement, stuck indoors too long, low energy*
*Why it helps: Combines mindfulness with gentle movement, grounds you in body*

Instructions:
1. Find a space to walk (indoors or outdoors, 10-20 steps)
2. Walk slowly, deliberately
3. Notice: foot lifting, moving forward, placing down, weight shifting
4. Feel: ground beneath feet, air on skin, body moving through space
5. If mind wanders, gently bring attention back to walking sensation
6. Continue for 10 minutes
7. Finish with 3 deep breaths, notice how you feel

### Recommendation Triggers & Logic

```
Mindfulness Recommendation System:

Context Assessment:
1. Check stress level (F7.5):
   - Stress ≥7: Recommend calming practices (box breathing, body scan)
   - Stress 4-6: Recommend moderate practices (mindful breathing, short meditation)
   - Stress <4: Recommend growth practices (loving-kindness, gratitude)

2. Check mood (F7.1):
   - Low mood: Loving-kindness meditation, gratitude practice
   - Anxious mood: Box breathing, grounding body scan
   - Neutral/good mood: General mindfulness, meditation

3. Check energy (F7.4):
   - Low energy: Gentle practices (breathing, seated meditation)
   - Moderate energy: Movement practices (mindful walking, stretching)
   - High energy: Longer meditation sessions

4. Time of day:
   - Morning (6-9am): Gratitude meditation, intention setting
   - Afternoon (2-5pm): Energy reset, breathing exercises
   - Evening (7-10pm): Wind-down practices, sleep meditation prep

5. Recent activity:
   - Post-workout: Recovery breathing, body scan
   - Pre-sleep: Sleep meditation prep, evening body scan
   - High-stress event: Immediate stress reset (box breathing)

Recommendation Frequency:
- Maximum 2 recommendations per day (avoid overwhelm)
- Minimum 4 hours between recommendations
- Escalate only if user accepts and completes practices

Practice Duration Selection:
- Stressed + busy: 1-3 minutes max
- Moderate stress: 5-10 minutes
- Low stress + time available: 10-20 minutes
- User's historical preference: Default to their average
```

### Error Handling Scenarios

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Recommendation rejected 3x** | User declines 3 consecutive recommendations | Reduce frequency, ask for feedback | "Noticed you've skipped mindfulness suggestions. Prefer different practices or less often?" |
| **Practice never completed** | User accepts but doesn't complete | Reduce recommendation frequency | "Mindfulness isn't resonating right now. Want fewer suggestions?" |
| **Practice rated ineffective** | User rates practice <4 for effectiveness | Remove from recommendation pool for 30 days | "Noted. I'll suggest other practices that might work better for you." |
| **User has meditation app** | User mentions Headspace/Calm/etc. | Acknowledge, offer complementary recommendations | "Great! I'll suggest practices to complement your app, not replace it." |

### Cross-Pillar Connections

**To Stress (F7.5):**
- Mindfulness practices are PRIMARY stress intervention
- Breathing exercises acutely reduce stress levels
- Regular practice builds stress resilience over time

**To Mood (F7.1):**
- Loving-kindness meditation improves mood
- Gratitude practices boost positive emotions
- Mindfulness reduces mood reactivity

**To Energy (F7.4):**
- Breathing exercises can boost energy (energizing breath)
- Body scans for relaxation when energy too high (anxious energy)
- Mindful walking combines movement with mindfulness

**To Sleep (F5.2):**
- Evening body scan improves sleep quality
- Sleep meditation prep reduces sleep onset latency
- Mindfulness practice before bed = better sleep

**To Recovery (F5.3):**
- Mindfulness practices boost Mental Recovery Score
- Regular practice improves overall recovery capacity
- Stress reduction through mindfulness aids physical recovery

**To Habits/Routines (F7.3, F7.6):**
- Mindfulness can be added to morning/evening routines
- Track meditation as habit in F7.3
- Routine consistency improves mindfulness effectiveness

**To Cross-Domain Intelligence (E8):**
- "Meditation before bed improves sleep quality by 22%"
- "5-min breathing exercise reduces stress by 30% within 10 minutes"
- "Your best recovery days: Mindfulness practice + workout + journaling"

### Dependencies
- **E4 (Mobile App):** Practice library UI, instruction display, completion tracking
- **E3 (Chat):** Text-based practice recommendations and instructions
- **E2 (Voice Coaching):** Verbal practice recommendations and guidance
- **F7.5 (Stress Detection):** Stress triggers for mindfulness recommendations
- **E8 (Cross-Domain Intelligence):** Context-aware recommendation engine

### MVP Status
[X] MVP Core

---

## EPIC SUCCESS CRITERIA

### Launch Readiness (All Features)

- [ ] All 7 wellbeing features functional across Light and Deep modes
- [ ] Mood check-ins capture emotional state with emoji and detailed ratings (F7.1)
- [ ] Hybrid journaling with research-based prompts + AI personalization (F7.2)
- [ ] User-customizable habit tracking with unlimited habit creation (F7.3)
- [ ] Energy level monitoring with cross-pillar correlation insights (F7.4)
- [ ] Multi-signal stress detection using self-report + biometrics + sentiment + behavior (F7.5)
- [ ] Wellbeing goals and routine templates with SMART goal framework (F7.6)
- [ ] Mindfulness recommendations with text-based instructions (no audio) (F7.7)
- [ ] Cross-pillar connections operational: wellbeing data feeds into fitness and nutrition insights
- [ ] All features accessible via Mobile App, Chat, and Voice Coaching channels
- [ ] Mental Recovery Score calculation integrates mood, stress, energy, journaling (F5.3 dependency)
- [ ] Error handling graceful for all failure scenarios including crisis detection (PRD Section 14)

### Quality Gates

| Gate | Criteria | Measurement |
|------|----------|-------------|
| **Engagement** | 70% of users engage with ≥3 wellbeing features daily | Feature usage analytics |
| **Mental Recovery Accuracy** | 70% user agreement with Mental Recovery Score | User feedback surveys |
| **Stress Detection Accuracy** | 70% user agreement when AI flags stress | Validation surveys |
| **User Satisfaction** | 4.5/5 rating for wellbeing pillar features | In-app NPS surveys |
| **Cross-Pillar Integration** | 85% of users discover wellbeing-related cross-domain insights within 7 days | Insight engagement analytics |
| **Crisis Handling** | 100% compliance with AI safety boundaries (PRD Section 14) | Safety audit |

### User Experience Validation

| Persona | Key Experience | Success Indicator |
|---------|---------------|-------------------|
| **P1: Holistic Health Seeker** | Discovers how mood affects physical performance | "Aha moment" via mood-workout correlation within 7 days |
| **P2: Busy Professional** | Builds sustainable wellbeing habits with minimal time | Uses light mode features 5+ days/week |
| **P3: Optimization Enthusiast** | Dives deep into stress patterns and habit analytics | Engages with deep mode features 4+ times/week |
| **P4: Habit Formation Seeker** | Establishes morning/evening routines with gentle accountability | Achieves 7+ day routine streak within 30 days |

---

## CROSS-EPIC DEPENDENCIES

### E1: Onboarding & Assessment
- Wellbeing preferences set during onboarding (light vs. deep journaling, routine preferences)
- Initial mood and stress baseline established
- Wellbeing goals identified during onboarding conversation

### E2: Voice Coaching
- "How are you feeling?" mood check-ins via voice
- Voice-to-text journaling: speak journal entries naturally
- Mindfulness practice recommendations delivered conversationally
- "I'm stressed" triggers stress management coaching

### E3: Chat Integration
- Quick mood logging: Emoji reply to "How's your mood?"
- Voice message journaling: Chat voice notes as journal entries
- Habit check-ins: "Did you meditate today?" with ✓ reply
- Stress reset recommendations: "Try box breathing - here's how..."

### E4: Mobile App
- Primary UI for all wellbeing features: mood timeline, journaling interface, habit dashboard
- Deep mode analytics: stress patterns, energy trends, habit correlations
- Routine checklists and goal progress tracking
- Mindfulness practice library and instructions

### E5: Fitness Pillar
- Mood, stress, energy, journaling data feed Mental Recovery Score (F5.3)
- Exercise recommended as intervention for low mood or high stress
- Workout performance correlates with wellbeing metrics
- Recovery-aware workout planning uses Mental Recovery Score

### E6: Nutrition Pillar
- Mood patterns reveal emotional eating triggers
- Energy correlates with meal timing and composition
- Stress affects eating behaviors and food choices
- Nutritional interventions for mood and energy optimization

### E8: Cross-Domain Intelligence
- Wellbeing pillar is KEY DATA SOURCE for cross-domain insights
- Insights engine reveals mood-sleep-workout-nutrition connections
- Predictive alerts: "Low mood today may predict low workout motivation tomorrow"
- Pattern detection: "Your best days: 7+ hours sleep + morning journaling + workout"

### E9: Data Integrations
- HRV and RHR data from wearables for biometric stress detection
- Sleep quality data for mood-sleep correlations
- Activity data for movement-mood insights

### E10: Analytics & Insights Dashboard
- Wellbeing metrics feed into holistic health score
- Mental Recovery Score prominently displayed alongside Physical Recovery
- "What's Affecting What" explorer shows wellbeing correlations
- Emotional Context Timeline overlays mood on all metrics (UNIQUE to yHealth)

---

## COMPETITIVE ANALYSIS (WELLBEING PILLAR)

### Feature Parity Matrix

| Feature | WHOOP | BEVEL | yHealth | Differentiation |
|---------|-------|-------|---------|-----------------|
| **Mental Health Tracking** | Monthly survey only | Monthly survey only | ✅ **Daily Wellbeing Pillar** | Real-time vs. monthly (MAJOR DIFFERENTIATOR) |
| **Mood Tracking** | ❌ | ❌ | ✅ Multiple check-ins/day | Multi-signal mood capture |
| **Journaling** | ❌ | Basic | ✅ **Hybrid prompts** | Research-based + AI personalized |
| **Habit Tracking** | ❌ | ❌ | ✅ **User-customizable** | Unlimited habits, any category |
| **Stress Detection** | ❌ | ❌ | ✅ **Multi-signal** | Self-report + biometrics + sentiment + behavior |
| **Energy Tracking** | ❌ | ❌ | ✅ Throughout day | Dynamic energy monitoring |
| **Mental Recovery Score** | ❌ | ❌ | ✅ **Dual Score** | Physical + Mental (unique to yHealth) |
| **Mindfulness** | ❌ | ❌ | ✅ AI recommendations | Coach-style, not meditation app |
| **Routines** | ❌ | ❌ | ✅ Template + custom | Morning/evening wellbeing routines |

### yHealth's Wellbeing Pillar Moat

**What We Do Better (MAJOR DIFFERENTIATORS):**
1. **Daily Wellbeing as Equal Pillar:** Competitors treat mental health as afterthought (monthly surveys). yHealth treats Daily Wellbeing as EQUAL to Fitness and Nutrition with real-time insights.
2. **Multi-Signal Stress Detection:** Only platform combining self-report + biometrics + text sentiment + behavior patterns for comprehensive stress awareness.
3. **Cross-Pillar Mental-Physical Insights:** Reveal how mood affects workout performance, how stress impacts sleep, how journaling boosts recovery - connections competitors can't make.
4. **Hybrid Journaling:** Research-based prompts + AI personalization (not just blank page or generic prompts).
5. **User-Customizable Habits:** Track ANY habit that matters to you, correlate with ANY metric - not limited to predefined categories.
6. **Dual Recovery Score:** Only platform with separate Physical and Mental Recovery Scores (competitors: physiology only).
7. **AI Coach (Not App):** Mindfulness recommendations without becoming a meditation app - complements existing practices.

**Strategic Positioning:**
> "WHOOP and BEVEL measure your body with monthly mental health surveys. yHealth treats Daily Wellbeing as an equal pillar with real-time insights that competitors miss entirely."

---

## TECHNICAL CONSIDERATIONS

### Data Models (Wellbeing Domain)

**Mood Record:**
```json
{
  "mood_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2025-12-02T08:00:00Z",
  "emoji": "😊",
  "happiness_rating": 8,
  "energy_rating": 7,
  "stress_rating": 3,
  "anxiety_rating": 2,
  "emotion_tags": ["grateful", "content", "energized"],
  "context_note": "Great morning workout and healthy breakfast",
  "mode": "deep"
}
```

**Journal Entry:**
```json
{
  "journal_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2025-12-02T21:00:00Z",
  "prompt": "What are you grateful for today?",
  "prompt_category": "gratitude",
  "entry_text": "Grateful for supportive friends, good health, and meaningful work.",
  "word_count": 12,
  "duration_seconds": 180,
  "sentiment_score": 0.85,
  "mode": "light",
  "voice_entry": false
}
```

**Habit Record:**
```json
{
  "habit_id": "uuid",
  "user_id": "uuid",
  "habit_name": "Morning meditation",
  "habit_category": "Mindfulness",
  "tracking_type": "duration",
  "frequency": "daily",
  "date": "2025-12-02",
  "completed": true,
  "value": 10,
  "unit": "minutes",
  "note": "Felt very calm after"
}
```

**Energy Record:**
```json
{
  "energy_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2025-12-02T14:00:00Z",
  "energy_rating": 6,
  "context_tag": "post-meal",
  "note": "Slight dip after lunch"
}
```

**Stress Record:**
```json
{
  "stress_id": "uuid",
  "user_id": "uuid",
  "date": "2025-12-02",
  "self_reported_stress": 7,
  "stress_triggers": ["work", "deadlines"],
  "biometric_stress_score": 6.5,
  "sentiment_stress_score": 7.2,
  "behavioral_stress_score": 5.8,
  "final_stress_score": 6.8,
  "alert_triggered": false
}
```

**Routine Record:**
```json
{
  "routine_id": "uuid",
  "user_id": "uuid",
  "routine_name": "Morning Energizer",
  "routine_type": "morning",
  "steps": [
    {"step": "Gratitude", "duration_min": 1, "completed": true},
    {"step": "Stretch", "duration_min": 5, "completed": true},
    {"step": "Hydrate", "duration_min": 1, "completed": true},
    {"step": "Intention", "duration_min": 2, "completed": false}
  ],
  "date": "2025-12-02",
  "completion_rate": 0.75,
  "total_duration_min": 7
}
```

**Mindfulness Practice Record:**
```json
{
  "practice_id": "uuid",
  "user_id": "uuid",
  "timestamp": "2025-12-02T15:30:00Z",
  "practice_name": "Box breathing",
  "practice_category": "breathing",
  "duration_min": 3,
  "completed": true,
  "effectiveness_rating": 8,
  "context": "high_stress",
  "note": "Helped calm down before presentation"
}
```

### API Endpoints (Wellbeing Pillar)

```
# Mood
GET    /api/v1/wellbeing/mood                - List mood records
POST   /api/v1/wellbeing/mood                - Log mood check-in
GET    /api/v1/wellbeing/mood/timeline       - Mood timeline visualization
GET    /api/v1/wellbeing/mood/patterns       - Mood pattern insights

# Journaling
GET    /api/v1/wellbeing/journal             - List journal entries
POST   /api/v1/wellbeing/journal             - Create journal entry
GET    /api/v1/wellbeing/journal/{id}        - Get journal entry
DELETE /api/v1/wellbeing/journal/{id}        - Delete journal entry
GET    /api/v1/wellbeing/journal/prompts     - Get recommended prompts
GET    /api/v1/wellbeing/journal/export      - Export all entries

# Habits
GET    /api/v1/wellbeing/habits              - List user habits
POST   /api/v1/wellbeing/habits              - Create new habit
PUT    /api/v1/wellbeing/habits/{id}         - Update habit
DELETE /api/v1/wellbeing/habits/{id}         - Delete habit
POST   /api/v1/wellbeing/habits/{id}/log     - Log habit completion
GET    /api/v1/wellbeing/habits/{id}/analytics - Habit analytics and correlations

# Energy
GET    /api/v1/wellbeing/energy              - List energy records
POST   /api/v1/wellbeing/energy              - Log energy level
GET    /api/v1/wellbeing/energy/timeline     - Energy timeline
GET    /api/v1/wellbeing/energy/patterns     - Energy pattern insights

# Stress
GET    /api/v1/wellbeing/stress              - Get current stress data
POST   /api/v1/wellbeing/stress              - Log stress rating
GET    /api/v1/wellbeing/stress/history      - Stress trends
GET    /api/v1/wellbeing/stress/patterns     - Stress pattern detection

# Routines
GET    /api/v1/wellbeing/routines            - List user routines
POST   /api/v1/wellbeing/routines            - Create routine
PUT    /api/v1/wellbeing/routines/{id}       - Update routine
DELETE /api/v1/wellbeing/routines/{id}       - Delete routine
POST   /api/v1/wellbeing/routines/{id}/complete - Log routine completion
GET    /api/v1/wellbeing/routines/templates  - Get pre-built templates

# Mindfulness
GET    /api/v1/wellbeing/mindfulness/practices - List practice library
GET    /api/v1/wellbeing/mindfulness/recommend - Get AI recommendation
POST   /api/v1/wellbeing/mindfulness/log     - Log practice completion
GET    /api/v1/wellbeing/mindfulness/history - Practice history
```

### Performance Requirements

| Operation | Target Latency | Rationale |
|-----------|---------------|-----------|
| Mood check-in logging | <1 second | Immediate feedback for quick interaction |
| Journal entry save | <2 seconds | Acceptable for longer text input |
| Habit completion toggle | <1 second | Instant gratification for habit tracking |
| Energy level logging | <1 second | Quick check-in requirement |
| Stress score calculation | <3 seconds | Multi-signal processing acceptable delay |
| Mindfulness recommendation | <2 seconds | AI processing acceptable for quality suggestion |
| Dashboard load (wellbeing pillar) | <3 seconds | Data-rich view with analytics |

### Security & Privacy

- **Data Encryption:** All wellbeing data (especially journaling) encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Privacy Priority:** Journal entries are MOST SENSITIVE data - highest security standards
- **Access Control:** User-only access to journal entries, no sharing features
- **Data Deletion:** Complete wellbeing data removal within 30 days of account deletion (GDPR)
- **Crisis Detection:** Automated alerts for self-harm indicators (PRD Section 14) with human review
- **Anonymization:** Aggregated insights use fully anonymized data only
- **Third-Party Prohibition:** NO third-party access to wellbeing data (even anonymized)

---

## TESTING STRATEGY

### Unit Testing
- Mental Recovery Score calculation logic (mood + stress + energy + journaling components)
- Stress score multi-signal algorithm (self-report + biometrics + sentiment + behavior)
- Habit correlation calculations
- Energy pattern detection algorithms
- Journal prompt selection and personalization logic

### Integration Testing
- Cross-pillar data flow (wellbeing → Mental Recovery Score → workout recommendations)
- Multi-channel wellbeing logging (app, Chat, voice)
- Biometric stress detection with wearable data sync
- Text sentiment analysis on journal entries
- API endpoint responses and error handling

### User Acceptance Testing
- Light vs. Deep mode experiences validate with personas
- Mental Recovery Score accuracy (user agreement surveys)
- Stress detection validation (user confirms AI-flagged stress)
- Journaling prompt relevance and personalization quality
- Habit tracking flexibility (can users create any habit?)
- Mindfulness recommendation acceptance rates

### Safety Testing
- Crisis detection accuracy (self-harm keyword detection)
- Escalation protocol compliance (PRD Section 14)
- AI safety boundaries enforcement (no harmful recommendations)
- Privacy controls for sensitive journal data
- Data encryption verification

### Performance Testing
- Dashboard load time with 90 days of wellbeing data
- Multi-signal stress calculation speed under load
- Real-time mood timeline rendering
- Concurrent journaling submissions (1000+ users)
- API response times at scale

---

## RISKS & MITIGATIONS

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Users don't value daily wellbeing tracking** | Critical | Medium | Education on cross-pillar insights, demonstrate value early via mood-workout correlations, light mode for minimal effort |
| **Journaling feels like homework** | High | Medium | Hybrid prompts reduce blank-page anxiety, light mode = 2-min entries valid, celebrate all reflection |
| **Mental Recovery Score questioned** | High | Medium | Transparent methodology, user feedback loops, gradual education on mental recovery importance |
| **Multi-signal stress detection privacy concerns** | High | Low | Clear communication on how signals used, user control over data sources, opt-out options |
| **Crisis detection false positives/negatives** | Critical | Medium | Conservative thresholds, human review for escalations, user can dismiss alerts, resources always provided |
| **Mindfulness recommendations ignored** | Medium | Medium | Context-aware timing, accept/decline tracking, reduce frequency if rejected, quality over quantity |
| **Habit tracking too complex** | Medium | Low | Pre-populated suggestions, templates, light mode = simple checkboxes, gradual progression to deep mode |
| **Cross-pillar correlations insufficient data** | High | Medium | Encourage multi-pillar logging, patience messaging ("insights improve with data"), baseline insights from Day 1 |

---

## ROADMAP & FUTURE ENHANCEMENTS

### MVP (Current Scope)
All 7 features (F7.1-F7.7) as defined above

### Post-MVP v1.1 (+3 months)
- **Guided audio mindfulness:** Partner with or build audio meditation library
- **Social support features:** Share anonymous wins, community challenges
- **Advanced journaling:** Voice-to-text improvements, emotion detection from speech
- **Therapist integration:** Share wellbeing data with mental health professionals (user-controlled)

### Post-MVP v1.2 (+6 months)
- **Predictive mood:** "Tomorrow's mood likely to be X based on today's choices"
- **CBT-based interventions:** Cognitive reframing prompts during negative thought patterns
- **Social connection tracking:** Quality time with loved ones as wellbeing metric
- **Seasonal pattern detection:** SAD (Seasonal Affective Disorder) awareness

### Post-MVP v2.0 (+12 months)
- **Clinical mental health integration:** PHQ-9, GAD-7 validated assessments
- **AI therapy chatbot:** Conversational mental health support (adjunct, not replacement)
- **Family mental health:** Shared wellbeing check-ins for families
- **Corporate wellbeing:** Team mental health dashboards (anonymized, aggregated)

---

## DOCUMENT GOVERNANCE

**Review Schedule:** After E8 (Cross-Domain Intelligence) Epic completion to ensure wellbeing correlations functioning
**Update Triggers:** User feedback from beta testing, crisis detection performance, journaling engagement rates, Mental Recovery Score accuracy
**Version Control:** All feature changes require version increment with rationale
**Ownership:** Product Team with input from Clinical Advisors (mental health), Engineering (technical feasibility), and Design (UX consistency)

---

## APPENDIX A: USER FLOWS

### Flow 1: New User - First Week Wellbeing Journey
1. **Day 0:** Onboarding establishes wellbeing preferences (light vs. deep journaling, routine interest)
2. **Day 1:** Morning mood check-in prompt (emoji select), Evening journaling prompt (gratitude)
3. **Day 2-3:** Mood + Energy logging 2x/day, AI learns baseline
4. **Day 4:** First habit created ("Morning meditation"), Routine template suggested
5. **Day 5:** Energy pattern insight: "Morning energy higher on workout days"
6. **Day 7:** First cross-pillar insight: "Mood 40% better on days you journal + workout"

### Flow 2: High Stress Detection & Intervention (Multi-Signal)
1. **User context:** High-stress work week, poor sleep, skipped workouts
2. **Signal 1:** User self-reports stress 8/10 (evening check-in)
3. **Signal 2:** Biometrics show elevated RHR and low HRV from wearable
4. **Signal 3:** Journaling sentiment analysis detects negative tone, keywords "overwhelmed," "can't cope"
5. **Signal 4:** App usage reduced (missed check-ins for 2 days)
6. **AI calculates stress score:** 8.5/10 (multi-signal aggregation)
7. **Alert triggered:** "Your stress has been very high for 3 days. Here's what might help..."
8. **Recommendations:** Box breathing (immediate), stress journaling prompt, suggest rest day instead of workout
9. **User accepts:** Completes 5-min box breathing, logs stress reduced to 6/10
10. **Follow-up:** Next day, AI checks in: "How are you feeling today?" + recovery recommendations

### Flow 3: Routine Formation & Habit Correlation Discovery (Deep Mode)
1. **User creates:** Custom morning routine (meditation 10min, journaling 5min, gratitude 2min)
2. **Week 1:** Completes routine 4/7 days, light mode logging
3. **Week 2:** Completes routine 6/7 days, building consistency
4. **Day 14:** AI insight: "Mental Recovery Score is +15 points higher on routine-completion days"
5. **Day 21:** Routine streak milestone achieved, celebration + encouragement
6. **Day 30:** Cross-pillar insight: "Your best workouts happen after completing morning routine"
7. **User switches to deep mode:** Explores detailed analytics, adds stretching to routine
8. **Outcome:** Sustainable habit formation, data-driven routine optimization

---

## APPENDIX B: TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Mental Recovery Score** | 0-100 score based on mood, stress, energy, journaling - measures mind readiness for activity (counterpart to Physical Recovery) |
| **Multi-Signal Stress Detection** | Stress calculated from self-report + biometrics (HRV, RHR) + text sentiment + app usage patterns for comprehensive awareness |
| **Hybrid Journaling** | Combines research-based prompt templates with AI personalization based on user context and patterns |
| **User-Customizable Habits** | Unlimited habit tracking where users define any habit (not limited to preset categories) and correlate with any metric |
| **Light Mode** | Quick, low-friction wellbeing interactions (emoji mood, short journal, simple habits) for time-constrained users |
| **Deep Mode** | Detailed, comprehensive wellbeing tracking (multi-dimensional ratings, extended journaling, full analytics) for engaged users |
| **Context-Aware Recommendations** | AI suggestions (mindfulness, journaling prompts) triggered by current stress, mood, energy, time of day, and recent activities |
| **Routine Templates** | Pre-built wellbeing routines (Morning Energizer, Evening Wind-Down) with structured steps and completion tracking |
| **Text Sentiment Analysis** | AI analysis of journal entry tone/content to detect stress, mood patterns, and emotional states from written text |
| **Crisis Escalation Protocol** | Safety procedures when AI detects self-harm indicators (PRD Section 14: resources provided, no intervention system) |
| **Emotion Tags** | Granular emotional descriptors (grateful, frustrated, anxious, content, etc.) for nuanced mood tracking beyond simple ratings |
| **Energy Timeline** | Visual chart showing energy fluctuations throughout day/week to identify patterns and optimization opportunities |

---

*yHealth Platform - E7: Wellbeing Pillar PRD v1.0*
*Your Comprehensive AI Health Coach - Physical Fitness, Nutrition, and Daily Wellbeing*

---

*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Epic Specification for MVP Development*
*Total Features: 7 | All MVP Core*
*KEY DIFFERENTIATOR: Daily Wellbeing as Equal Pillar (vs. competitors' monthly surveys)*
