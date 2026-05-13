# yHealth Platform - Epic 06: Nutrition Pillar

## EPIC OVERVIEW

### Purpose
The Nutrition Pillar is one of yHealth's **three equal pillars** (Fitness, Nutrition, Wellbeing), enabling users to track, understand, and optimize their eating habits through AI-powered insights. This epic delivers comprehensive nutrition tracking from quick photo logging to detailed macro analysis, integrating seamlessly with fitness and wellbeing data to reveal cross-domain insights impossible to discover manually.

### Vision Statement
*"Transform meal logging from tedious calorie counting into an intelligent nutrition coaching experience that adapts to each user's goals, preferences, and lifestyle - revealing patterns between what you eat and how you feel, perform, and recover."*

### Strategic Importance
- **Equal Pillar Status:** Nutrition is critical to yHealth's "Second Mind" vision - you cannot understand complete health without nutrition data
- **Cross-Domain Intelligence:** Nutrition data fuels insights like "Your best workouts happen when you eat protein-rich breakfasts" and "Low energy afternoons correlate with skipped lunches"
- **Competitive Differentiation:** Multi-modal logging (photo AI, barcode, manual, voice) + adaptive flexibility (light/deep modes) + emotional eating integration
- **User Engagement:** Meal logging drives daily app usage and habit formation (target: 75% of users log meals daily)

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Meal Logging Rate** | 75% of active users | Analytics dashboard |
| **Photo AI Accuracy** | ±10-15% calorie variance | Validation against manual entries |
| **Cross-Pillar Correlation Discovery** | 90% discover nutrition-fitness/wellbeing connections | Insight engagement metrics |
| **Nutritional Goal Achievement** | 70% meet macro targets 5+ days/week | Goal tracking system |
| **Emotional Eating Pattern Detection** | 60% receive personalized insights within 30 days | Pattern recognition algorithm |
| **User Satisfaction (Nutrition Features)** | 4.5/5 rating | In-app surveys |

---

## FEATURE BREAKDOWN (6 Features)

### F6.1: Meal Logging (Multi-Modal Input)

#### Description
Enable users to log meals through multiple channels - AI-powered photo recognition, barcode scanning, manual search, and voice input - with seamless sync across all interaction channels (Mobile App, WhatsApp, Voice Coaching). The system intelligently learns from user corrections to improve accuracy over time and builds a personalized food database.

#### User Stories

**As a Busy Professional (P2):**
> "I want to snap a quick photo of my meal and get instant calorie/macro estimates so that I can track nutrition without disrupting my day."

**As an Optimization Enthusiast (P3):**
> "I want to manually adjust AI estimates and add custom foods so that I can maintain precise macro tracking for my fitness goals."

**As a Holistic Health Seeker (P1):**
> "I want to log meals via WhatsApp during lunch breaks so that I can maintain consistent tracking without always opening the app."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Photo upload → AI estimate auto-accepted → Quick confirmation. ~30 seconds total. No macro details shown unless tapped. |
| **Deep** | Photo upload → AI estimate with confidence score → Manual adjustment UI → Custom food creation → Detailed macro breakdown → Save to personal database. ~3-5 minutes for precision. |

#### Photo AI Specifications

**Accuracy Target:** ±10-15% calorie variance (high precision mode)

**AI Capabilities:**
- Multi-food detection (e.g., plate with chicken, rice, salad = 3 separate items)
- Portion size estimation (uses plate/hand as reference)
- Cuisine type recognition (global + regional)
- Confidence scoring (Low <60%, Medium 60-85%, High >85%)
- Learning from corrections (user feedback improves model)

**Processing Time:**
- Standard photo: <10 seconds
- Complex multi-food photo: <15 seconds
- Timeout fallback: >20 seconds prompts manual entry option

**Supported Formats:** JPEG, PNG, HEIC (iOS), max 10MB per photo

#### Barcode Scanning

**Database:** Nutritionix API (~5M+ foods globally)
**Scan Speed:** <2 seconds recognition + nutritional data retrieval
**Offline Support:** Cache top 1000 common products for offline scanning
**Custom Products:** Allow users to create barcode entries for regional/custom foods

#### Manual Search

**Database Priority:**
1. User's personal food database (learned from past entries)
2. Nutritionix API (global food database)
3. Custom yHealth database (curated regional foods + user contributions)

**Search Features:**
- Autocomplete (type-ahead suggestions)
- Recent foods (quick access to frequently logged items)
- Favorites (star foods for instant access)
- Serving size presets (small/medium/large + custom)

#### Voice Input (via Voice Coaching Channel)

**Natural Language Processing:**
- "I had scrambled eggs and toast for breakfast" → AI extracts: 2 foods, meal type, approximate portions
- "Log my lunch: chicken biryani, one plate" → AI recognizes regional cuisine, confirms portion
- Conversational clarification: AI asks follow-ups if details missing

**Integration:** Logs captured during Voice Coaching sessions sync to Mobile App/WhatsApp

#### Success Metrics

- **Multi-Modal Usage:** 80% of users try 2+ logging methods in first 30 days
- **Photo AI Adoption:** 60% of meals logged via photo (primary method)
- **Logging Speed (Light Mode):** 90% complete log in <45 seconds
- **Correction Rate:** <20% of AI estimates manually corrected (indicates accuracy)
- **Personal Database Growth:** Average 50+ custom foods per user after 90 days

#### Acceptance Criteria

- [x] Photo AI recognizes 90% of common foods with >60% confidence
- [x] Barcode scanner retrieves nutritional data in <3 seconds
- [x] Manual search returns relevant results in <1 second
- [x] Voice input extracts meal details with 85%+ accuracy
- [x] All logging methods sync across channels within 5 minutes
- [x] User corrections improve AI model (feedback loop implemented)
- [x] Offline mode supports manual and cached barcode entries
- [x] Photo processing timeout (<20s) gracefully falls back to manual entry

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Photo AI fails to recognize food** | Confidence <40% | Prompt manual entry with photo attached | "Couldn't recognize this meal. Can you help identify it?" |
| **Barcode not found in database** | Nutritionix API 404 | Offer manual nutritional entry | "Barcode not found. Add this product manually?" |
| **Multiple foods detected, unclear portions** | AI uncertainty flag | Show detected items, request portion confirmation | "Found 3 items. Tap each to adjust serving size." |
| **Photo quality too poor** | Image analysis <50 DPI | Request retake | "Photo unclear. Try better lighting or closer angle?" |
| **Voice input ambiguous** | NLP confidence <70% | Ask clarifying questions | "Did you say 'one cup' or 'one plate' of rice?" |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- Pre/post-workout meal tracking correlates with workout performance
- Recovery meal recommendations based on training intensity
- Calorie burn from activity informs daily calorie targets

**→ Wellbeing Pillar (E7):**
- Meal timing correlates with energy levels and mood patterns
- Emotional eating detection (logged meals during low mood times)
- Hydration tracking complements meal logging

**→ Cross-Domain Intelligence (E8):**
- "Your best sleep happens when you eat dinner before 7pm"
- "Protein-rich breakfasts correlate with 15% higher workout intensity"

#### Dependencies

- **E9 (Data Integrations):** Nutritionix API integration for food database
- **E8 (Cross-Domain Intelligence):** AI engine for photo recognition and learning
- **E4 (Mobile App):** Camera access, barcode scanner UI
- **E3 (WhatsApp):** Photo upload via WhatsApp, voice message processing
- **E2 (Voice Coaching):** Voice input meal logging

#### MVP Status
**[x] MVP Core** - Critical for Nutrition Pillar functionality

---

### F6.2: Calorie & Macro Tracking

#### Description
Provide real-time tracking of calories and macronutrients (protein, carbs, fats) against personalized daily targets, with optional deep-dive into complete nutritional profiles (fiber, sugar, sodium, micronutrients). The system tracks comprehensive nutrition in the background for AI insights while displaying simplified views for Light mode users, and detailed breakdowns for Deep mode users.

#### User Stories

**As an Optimization Enthusiast (P3):**
> "I want to see real-time macro breakdowns (protein/carbs/fats) throughout the day so that I can adjust my meals to hit my targets before bedtime."

**As a Busy Professional (P2):**
> "I want a simple visual (like a traffic light) showing if I'm on track with calories so that I don't need to analyze numbers constantly."

**As a Holistic Health Seeker (P1):**
> "I want to understand how my nutrition affects my energy and mood, not just fitness, so that I can optimize my overall wellbeing."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Simple progress rings (calories + optional protein). Color-coded status (green = on track, yellow = close, red = off target). Daily summary notification at end of day. |
| **Deep** | Detailed macro dashboard (P/C/F breakdown), micronutrient tracking, meal-by-meal timeline, trend graphs (7/30/90 days), export data to CSV. Real-time goal adjustments. |

#### Tracking Capabilities

**Background Tracking (All Users):**
- Complete nutritional profile: Calories, Protein, Carbs, Fats, Fiber, Sugar, Sodium, Cholesterol
- Micronutrients: Vitamins (A, C, D, B12, etc.), Minerals (Iron, Calcium, Magnesium, etc.)
- Meal timing and frequency
- Hydration status (linked to F6.3)

**Display Strategy:**
- **Light Mode Users:** See only calories + 1 optional focus macro (e.g., protein for muscle gain)
- **Deep Mode Users:** Full dashboard access to all tracked nutrients
- **AI Insights:** Use complete data regardless of user display preference (insights may reference nutrients not actively displayed)

**Personalized Daily Targets:**

Calculated based on:
1. User goals (weight loss, maintenance, muscle gain, performance)
2. Activity level (from Fitness Pillar data)
3. Biometric data (age, weight, height, gender from onboarding)
4. Adaptive learning (AI adjusts targets based on progress)

Example target ranges:
- **Weight Loss:** 500 kcal deficit, 30% protein, 40% carbs, 30% fats
- **Muscle Gain:** 300 kcal surplus, 35% protein, 45% carbs, 20% fats
- **Maintenance:** TDEE (Total Daily Energy Expenditure), balanced macros

**Dynamic Target Adjustment:**
- Auto-adjust based on workout intensity (high strain day = higher carb target)
- Account for missed meals (redistribute remaining macros across remaining meals)
- Weekly recalculation based on weight trends and adherence

#### Visual Representations

**Progress Rings (Light Mode):**
- Outer ring: Total calories (color-coded: green/yellow/red)
- Inner ring: Focus macro (e.g., protein for muscle gain goals)
- Simple percentage display: "1,450 / 2,000 kcal (73%)"

**Macro Breakdown (Deep Mode):**
- Stacked bar chart (P/C/F) showing consumed vs. target
- Pie chart for meal distribution (breakfast/lunch/dinner/snacks)
- Line graph for daily trends (7-day rolling average)
- Traffic light indicators for each macro (on/under/over target)

**Meal Timeline:**
- Chronological view of all logged meals
- Macro contribution per meal
- Tap meal to see detailed breakdown

#### Smart Recommendations

**Proactive Coaching:**
- "You have 45g protein left for the day. Try chicken or Greek yogurt for dinner."
- "You're low on fiber. Add veggies or whole grains to your next meal."
- "Great! You hit your protein target 5 days this week."

**Adaptive Insights:**
- "When you eat 30g+ protein at breakfast, your energy levels are 20% higher."
- "Your best workout days follow dinners with <50g carbs the night before."
- "Low fiber days correlate with poor sleep quality."

#### Success Metrics

- **Daily Target Achievement:** 70% of users meet macro targets 5+ days/week
- **Macro Adherence:** 80% within ±10% of daily targets
- **Insight Engagement:** 85% act on macro recommendation within 24 hours
- **Feature Satisfaction:** 4.6/5 for Deep mode macro tracking

#### Acceptance Criteria

- [x] Real-time calorie/macro updates as meals logged (<2 second latency)
- [x] Personalized targets calculated based on goals, biometrics, activity
- [x] Progress visualizations render in <1 second
- [x] Light mode displays simplified view (calories + 1 macro max)
- [x] Deep mode provides access to complete nutritional profile
- [x] Dynamic target adjustment based on daily activity levels
- [x] Weekly summary reports generated and delivered
- [x] Export functionality (CSV) for Deep mode users
- [x] Offline mode displays cached data (last sync timestamp shown)

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Missing nutritional data for logged food** | Incomplete API response | Use average values, flag uncertainty | "Estimated values used. Update if you have exact info." |
| **Daily target calculation fails** | User missing biometric data | Use safe default (2,000 kcal), prompt completion | "Add your weight/height for personalized targets." |
| **Macro percentages don't sum to 100%** | Validation error | Auto-adjust largest macro proportionally | Silent fix, log for review |
| **Extreme variance from target (>150%)** | Threshold check | Gentle reminder, no judgment | "Big meal day! Tomorrow's a fresh start." |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- Calorie burn from workouts informs daily calorie targets
- Pre-workout carb intake correlates with performance
- Post-workout protein timing affects recovery metrics

**→ Wellbeing Pillar (E7):**
- Low energy ratings correlate with inadequate calorie intake
- Sugar spikes detected via mood crashes
- Balanced macro days improve sleep quality scores

**→ Cross-Domain Intelligence (E8):**
- "Your energy dips at 3pm on days with <20g protein at lunch"
- "Best sleep happens when dinner is <30% of daily calories"

#### Dependencies

- **F6.1 (Meal Logging):** Nutritional data source
- **E5 (Fitness Pillar):** Activity level for TDEE calculation
- **E8 (Cross-Domain Intelligence):** AI insights generation
- **E10 (Analytics Dashboard):** Trend visualization

#### MVP Status
**[x] MVP Core** - Essential tracking foundation

---

### F6.3: Hydration Tracking

#### Description
Enable users to track daily water intake through quick logging (tap presets, voice, or manual entry), receive intelligent hydration reminders based on activity levels and environmental factors, and understand hydration's impact on performance, recovery, and wellbeing. The system learns optimal hydration patterns and proactively coaches users.

#### User Stories

**As a Busy Professional (P2):**
> "I want to quickly log water intake with one tap so that I can track hydration without interrupting my workflow."

**As an Optimization Enthusiast (P3):**
> "I want hydration recommendations that adapt to my workout intensity and climate so that I can optimize recovery and performance."

**As a Holistic Health Seeker (P1):**
> "I want to see how dehydration affects my energy and mood so that I can build better daily habits."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | One-tap logging (250ml presets: glass, bottle). Simple progress bar. Daily reminder notification. ~5 seconds per log. |
| **Deep** | Custom volume entry, beverage type tracking (water, coffee, tea, electrolyte drinks), hydration score with breakdown, correlation insights, export history. |

#### Tracking Features

**Quick Logging:**
- Preset volumes: Small glass (250ml), Large glass (500ml), Bottle (750ml), Custom
- Beverage types: Water (default), Coffee, Tea, Sports drink, Other
- WhatsApp quick log: "Logged 500ml" or photo of water bottle
- Voice log: "I drank a bottle of water"
- Manual entry: Custom ml/oz input

**Smart Daily Goals:**

Calculated based on:
1. Body weight (baseline: 30-35ml per kg)
2. Activity level (add 500-1000ml for high-intensity workouts)
3. Climate/temperature (increase in hot weather if available)
4. Caffeine intake (coffee/tea logged = increase water target)

Example: 70kg user, moderate activity = ~2,500ml (2.5L) base target

**Progress Visualization:**
- Simple progress bar (Light mode): "1,500 / 2,500 ml (60%)"
- Hydration waves graphic (Deep mode): Visual water level rising
- Hourly distribution chart (Deep mode): See when you drink most

**Intelligent Reminders:**
- Morning: "Good morning! Start your day with water."
- Pre-workout: "Hydrate before your workout in 30 minutes."
- Post-workout: "Great session! Drink 500ml to recover."
- Afternoon slump: "Low energy detected. Dehydrated? Drink water."
- Evening cutoff: "Last call for hydration before bedtime."

**Reminder Logic:**
- Respect quiet hours (user-defined, default: 10pm - 7am)
- Increase frequency on high-activity days
- Pause during meals (don't interrupt meal logging)
- Adaptive timing (learn when user typically drinks)

#### Hydration Score (Deep Mode)

**Score Calculation (0-100):**
- Daily goal achievement: 50 points (2,500ml target hit = 50 pts)
- Consistency: 25 points (even distribution throughout day)
- Pre/post-workout hydration: 15 points
- Morning hydration: 10 points (500ml before 10am)

**Color Coding:**
- 90-100: Excellent (dark blue)
- 70-89: Good (light blue)
- 50-69: Fair (yellow)
- <50: Poor (red)

#### Beverage Type Tracking (Deep Mode)

**Hydration Multipliers:**
- Water: 1.0x (fully counts toward goal)
- Herbal tea: 1.0x
- Coffee/Black tea: 0.7x (diuretic effect)
- Sports drinks: 1.1x (electrolytes bonus)
- Alcohol: 0x (excluded, triggers dehydration alert)

**Caffeine Tracking:**
- Log coffee/tea → auto-increase water target by 200ml per cup
- Insight: "You had 3 coffees today. Aim for extra 600ml water."

#### Success Metrics

- **Daily Hydration Goal Achievement:** 70% of users hit target 5+ days/week
- **Logging Frequency:** Average 5+ logs per day (indicates consistent tracking)
- **Reminder Effectiveness:** 60% of users log water within 30 min of reminder
- **Cross-Pillar Discovery:** 80% receive hydration-performance/energy insights within 30 days
- **User Satisfaction:** 4.3/5 for hydration tracking features

#### Acceptance Criteria

- [x] One-tap logging with 250ml presets (<2 seconds)
- [x] Custom volume and beverage type entry available
- [x] Daily hydration goal auto-calculated based on weight + activity
- [x] Progress visualization updates in real-time (<2 second latency)
- [x] Smart reminders adapt to activity levels and timing patterns
- [x] Quiet hours respected (no notifications during sleep window)
- [x] Hydration score calculated and displayed (Deep mode)
- [x] All logging methods sync across channels (app, WhatsApp, voice)
- [x] Offline mode caches logs, syncs on reconnect

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Unrealistic volume logged (>2L single entry)** | Threshold check (>2000ml) | Confirm intent | "Did you mean 2000ml? That's a lot for one drink!" |
| **Negative hydration (undo too many logs)** | Sum <0 check | Reset to 0, preserve history | "Hydration reset to 0. History saved." |
| **Missing weight data for goal calculation** | User profile incomplete | Use default (2000ml), prompt completion | "Add your weight for personalized hydration goals." |
| **Reminder fatigue (user dismisses 5+ in a row)** | Dismiss pattern | Reduce frequency, ask preference | "Too many reminders? Adjust settings here." |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- Pre-workout hydration status affects readiness score
- Post-workout hydration recovery tracked
- Dehydration detected = performance decline alerts
- "Your workout intensity drops 12% when under-hydrated"

**→ Wellbeing Pillar (E7):**
- Dehydration correlates with low energy ratings
- Headache logging triggers hydration check
- Sleep quality improves with proper hydration timing
- "You feel 20% more energized on days you hit hydration goals"

**→ Cross-Domain Intelligence (E8):**
- "Your best mornings start with 500ml water within 1 hour of waking"
- "Afternoon energy crashes are 35% less frequent when you're hydrated"

#### Dependencies

- **E5 (Fitness Pillar):** Activity level for dynamic goal adjustment
- **E7 (Wellbeing Pillar):** Energy and mood data for correlation insights
- **E4 (Mobile App):** Quick-log UI, progress visualization
- **E3 (WhatsApp):** Voice/text hydration logging
- **E2 (Voice Coaching):** Natural language hydration logs

#### MVP Status
**[x] MVP Core** - Critical for complete health tracking

---

### F6.4: Nutrition Goals & Plans

#### Description
Enable users to set personalized nutrition goals aligned with their broader health objectives, receive AI-generated meal plans that adapt to preferences and progress, and track goal achievement over time. The system generates actionable plans, not just targets, and continuously optimizes recommendations based on what actually works for each individual.

#### User Stories

**As a Holistic Health Seeker (P1):**
> "I want nutrition goals that align with my fitness and wellbeing objectives so that all three pillars work together toward my transformation."

**As an Optimization Enthusiast (P3):**
> "I want AI-generated meal plans that hit my macro targets while respecting my food preferences so that I can achieve my body composition goals efficiently."

**As a Busy Professional (P2):**
> "I want simple meal suggestions that fit my schedule and don't require complex meal prep so that I can eat healthily without added stress."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Pre-built goal templates (weight loss, muscle gain, general health). Simple meal suggestions (breakfast/lunch/dinner). Weekly check-ins. |
| **Deep** | Custom goal creation (specific macro ratios, micronutrient targets, timing protocols). Full 7-day meal plans with recipes. Daily optimization feedback. Meal prep guidance. |

#### Goal Setting Features

**Pre-Built Templates:**

1. **Weight Loss**
   - 500 kcal daily deficit
   - 30% protein, 40% carbs, 30% fats
   - High satiety focus (fiber, protein)
   - Sustainable pace (0.5-1kg/week)

2. **Muscle Gain**
   - 300 kcal daily surplus
   - 35% protein, 45% carbs, 20% fats
   - Protein timing around workouts
   - Progressive increase (0.25-0.5kg/week)

3. **Performance Optimization**
   - Maintenance calories
   - 30% protein, 45% carbs, 25% fats
   - Pre/post-workout nutrition focus
   - Carb cycling on training vs rest days

4. **General Health**
   - Maintenance calories
   - Balanced macros (30/40/30)
   - Micronutrient diversity emphasis
   - Mediterranean diet principles

5. **Body Recomposition**
   - Slight deficit (-200 kcal)
   - High protein (35%), moderate carbs (35%), moderate fats (30%)
   - Strength training alignment
   - Patient approach (3-6 month timeline)

**Custom Goal Builder (Deep Mode):**
- Manual macro percentage input (with validation: must sum to 100%)
- Micronutrient targets (e.g., 30g fiber, <2300mg sodium)
- Meal timing preferences (e.g., intermittent fasting 16:8)
- Food restrictions (allergies, vegetarian, vegan, halal, kosher, etc.)
- Budget constraints (estimated per meal)
- Cuisine preferences (Mediterranean, Asian, Middle Eastern, etc.)

#### AI Meal Plan Generation (MVP Core)

**Plan Generation Inputs:**
1. Nutritional goals (calories, macros)
2. Dietary restrictions and preferences
3. Past meal history (learns what user actually eats)
4. Regional food availability (Pakistani, Middle Eastern, Western, etc.)
5. Cooking skill level (quick meals vs. complex recipes)
6. Budget range (optional)

**Plan Outputs:**

**7-Day Meal Plan:**
- Breakfast, lunch, dinner, 2 snacks per day
- Each meal includes:
  - Recipe name and description
  - Ingredients list with quantities
  - Macro breakdown (calories, P/C/F)
  - Preparation time estimate
  - Cooking instructions (optional, for Deep mode)
  - Substitution suggestions (e.g., "swap chicken for tofu")

**Smart Features:**
- **Batch Cooking:** Suggest recipes that can be prepped in bulk
- **Ingredient Reuse:** Minimize shopping list by reusing ingredients across meals
- **Variety Optimization:** Ensure diverse nutrients across the week
- **Leftover Planning:** Dinner portions sized for next-day lunch
- **Quick Meal Options:** Flag 15-min meals for busy days

**Adaptive Learning:**
- Track which meal plans user follows vs. skips
- Learn preferred cuisines and cooking styles
- Optimize future plans based on adherence patterns
- "You rarely follow complex dinner recipes. Switching to simpler options."

#### Meal Plan Delivery

**Generation Speed:** <30 seconds for full 7-day plan

**Delivery Channels:**
- Mobile App: Interactive plan with tap-to-log meals
- WhatsApp: Text-based plan with photo examples
- Email: PDF download for printing/sharing

**Plan Flexibility:**
- **Swap Meals:** Drag-and-drop to rearrange days
- **Substitute Items:** AI suggests macro-equivalent swaps
- **Regenerate Day:** Don't like Monday? Regenerate just that day
- **Freestyle Days:** Mark days as "I'll figure it out" (no plan generated)

#### Goal Tracking & Progress

**Weekly Check-Ins:**
- Goal adherence percentage (how many days hit targets)
- Average calorie/macro variance
- Weight trend (if weight goal selected)
- Qualitative feedback: "How sustainable does this feel?" (1-5 scale)

**Progress Insights:**
- "You hit protein targets 6/7 days this week - great consistency!"
- "Your calorie variance is ±8% - very accurate tracking."
- "Weight down 0.6kg this week, on pace for your goal."
- "You skipped meal plans 3 days. Want simpler suggestions?"

**Goal Adjustments:**
- AI recommends changes based on 2-4 week trends
- User can manually adjust targets anytime
- Progressive overload (gradually increase difficulty for muscle gain)
- Deficit reduction (ease into maintenance after weight loss)

#### Success Metrics

- **Goal Setting Adoption:** 85% of users set nutrition goal within first 7 days
- **Meal Plan Generation:** 70% generate at least one 7-day plan in first month
- **Plan Adherence:** 60% follow meal plan 4+ days per week
- **Goal Achievement:** 65% make measurable progress toward goal in 90 days
- **Satisfaction:** 4.5/5 rating for AI meal plan quality

#### Acceptance Criteria

- [x] Pre-built goal templates selectable during onboarding
- [x] Custom goal builder validates inputs (macros sum to 100%, realistic targets)
- [x] AI generates 7-day meal plan in <30 seconds
- [x] Meal plans respect dietary restrictions and preferences
- [x] Each meal includes macros, ingredients, prep time
- [x] Users can swap/substitute meals within plan
- [x] Tap-to-log meals from plan (auto-fills F6.1)
- [x] Weekly progress reports generated and delivered
- [x] AI recommends goal adjustments based on adherence and progress
- [x] Export meal plan to PDF (Deep mode)

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Impossible macro targets (e.g., 200g protein for 1500 kcal)** | Validation logic | Reject, suggest feasible range | "That protein target needs ~2200 kcal. Adjust calories or protein?" |
| **No meals found matching restrictions** | Recipe database query fails | Relax one constraint, notify user | "Vegan + low-carb + <$5 is tough. Relax budget to $8?" |
| **Meal plan generation timeout (>30s)** | API timeout | Retry with simpler parameters | "Complex plan taking long. Trying simpler approach..." |
| **User never follows meal plans** | Adherence <20% for 2 weeks | Ask if they want to pause feature | "Not using meal plans? We can focus on other features instead." |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- Training days get higher carb allocations
- Rest days reduce calories slightly (if body recomposition goal)
- Pre-workout meal timing suggestions
- "Your leg day is tomorrow. Meal plan includes extra carbs tonight."

**→ Wellbeing Pillar (E7):**
- Stress eating patterns trigger simpler meal plans (reduce decision fatigue)
- Low energy days prompt nutrient-dense meal suggestions
- Sleep quality affects next-day meal plan (prioritize magnesium-rich foods)
- "You logged low mood 3 days this week. Adding comfort foods to your plan."

**→ Cross-Domain Intelligence (E8):**
- "Your best energy days follow high-protein breakfasts. Adjusting plan."
- "You sleep better on nights you eat dinner before 7pm. Earlier meal times this week?"

#### Dependencies

- **F6.1 (Meal Logging):** Tap-to-log from meal plan
- **F6.2 (Calorie & Macro Tracking):** Goal targets feed into tracking
- **E8 (Cross-Domain Intelligence):** AI meal plan generation engine
- **E9 (Data Integrations):** Nutritionix API for recipe nutritional data
- **Custom Food Database:** Regional cuisine recipes (Pakistani, Middle Eastern, etc.)

#### MVP Status
**[x] MVP Core** - Critical for goal-oriented users and differentiation

---

### F6.5: AI Nutrition Coaching

#### Description
Provide conversational AI coaching that goes beyond meal plans to offer real-time guidance, answer nutrition questions, provide educational content, and deliver proactive interventions based on detected patterns. The AI coach learns each user's preferences, challenges, and motivations to provide increasingly personalized support across all interaction channels.

#### User Stories

**As a Habit Formation Seeker (P4):**
> "I want an AI coach that gently reminds me to log meals and celebrates small wins so that I build sustainable nutrition habits without feeling judged."

**As an Optimization Enthusiast (P3):**
> "I want to ask specific nutrition questions (e.g., 'Should I eat carbs before or after my workout?') and get personalized answers based on my data so that I can optimize my performance."

**As a Holistic Health Seeker (P1):**
> "I want my AI coach to connect my nutrition choices to how I feel and perform so that I understand the real impact of what I eat."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Brief daily nudges (WhatsApp/push). Simple questions answered. Weekly summary insights. Celebratory messages for streaks. |
| **Deep** | Proactive coaching sessions (via Voice). Detailed Q&A with citations. Daily optimization tips. Behavioral pattern analysis. Educational deep-dives. |

#### Coaching Capabilities

**1. Real-Time Guidance**

**Contextual Prompts:**
- Pre-meal: "Planning lunch? You have 650 kcal and 35g protein left for the day."
- Post-meal: "Great choice! That salmon hit your protein target for dinner."
- Macro shortfall: "You're low on fiber today. Add veggies to your evening snack?"
- Macro excess: "You've hit your calorie target. Dinner should be light."

**Meal Optimization:**
- "Your usual breakfast has 45g carbs. Want a lower-carb option for better energy?"
- "You're eating late (9pm). Earlier dinners improve your sleep quality."
- "No protein logged yet today. Start with eggs or Greek yogurt?"

**2. Question Answering (Nutrition Q&A)**

**Natural Language Understanding:**
- User: "Is honey better than sugar?"
- AI: "For your weight loss goal, both are similar in calories (~60 kcal/tbsp). Honey has trace nutrients but same blood sugar impact. Use sparingly."

**Personalized Responses:**
- User: "Should I eat carbs before my run?"
- AI: "Based on your data: Your 5k runs are 12% faster when you eat 30-50g carbs 1-2 hours before. Try a banana or oatmeal."

**Evidence-Based with Citations:**
- Include references to user's own data ("Your best energy days...")
- Link to reputable sources when discussing general nutrition science
- Clarify when advice is personalized vs. general guidance

**Topic Coverage:**
- Macro timing (when to eat protein/carbs/fats)
- Food swaps (healthier alternatives)
- Portion control (how much is too much)
- Nutrient benefits (why fiber/omega-3s/etc. matter)
- Meal prep tips (batch cooking, storage, reheating)
- Dining out strategies (restaurant choices, portion awareness)
- Supplements (when needed, what to consider - always defer to doctor)

**3. Proactive Pattern Interventions**

**Detected Patterns → Coaching Actions:**

| Pattern Detected | AI Intervention | Timing |
|------------------|-----------------|--------|
| **Meal skipping (3+ days)** | "You've skipped breakfast 3 days this week. Low energy connected?" | Evening check-in |
| **Late-night eating (>9pm regularly)** | "Late dinners affecting your sleep. Want meal timing tips?" | Next morning |
| **Protein consistently low (<80% target)** | "Protein intake low this week. Here's why it matters for your muscle gain goal..." | Weekly summary |
| **Excessive calorie variance (±30%)** | "Your calories swing wildly day-to-day. Let's stabilize for better progress." | After 7-day trend |
| **Weekend overeating pattern** | "Weekends are tough! Here's a strategy that works for others..." | Friday prep nudge |
| **Emotional eating detected** | (See F6.6 for deep integration) | Real-time, compassionate |

**Behavioral Nudges:**
- **Streaks:** "7-day meal logging streak! You're building a powerful habit."
- **Milestones:** "You've logged 100 meals! Your AI coach is getting smarter about your preferences."
- **Recovery:** "Tough week. Remember, one bad day doesn't erase progress."

**4. Educational Content Delivery**

**Micro-Lessons (Light Mode):**
- Daily nutrition tip (150 characters max)
- "Tip: Protein helps you feel full longer. Aim for 20-30g per meal."
- Delivered via WhatsApp or push notification

**Deep-Dive Sessions (Deep Mode):**
- Voice coaching mini-lessons (3-5 minutes)
- Topics requested by user or suggested by AI
- Examples:
  - "Macros 101: What they are and why they matter"
  - "Pre-Workout Nutrition: Timing and Composition"
  - "Reading Nutrition Labels: What to Look For"
  - "Meal Prep Mastery: Save Time and Stay on Track"

**Progressive Education:**
- Onboarding: Basics (calories, macros, logging)
- Week 2-4: Intermediate (meal timing, food quality, hydration)
- Month 2+: Advanced (nutrient timing, carb cycling, supplements)

**5. Multi-Channel Coaching Integration**

**WhatsApp Coaching:**
- Quick questions answered via text
- Daily nudges and reminders
- Photo meal feedback: "That salad looks great! Log it?"
- Voice messages for longer explanations

**Voice Coaching:**
- Dedicated nutrition coaching sessions (5-15 min)
- Conversational Q&A with follow-up questions
- Weekly reflection: "How did your nutrition feel this week?"
- Goal-setting conversations

**Mobile App Coaching:**
- In-app chat for immediate questions
- Contextual tips on dashboard (e.g., "You're 200 kcal over. Here's why that's okay sometimes.")
- Push notifications for important patterns

#### AI Personality & Tone

**Core Traits:**
- **Non-judgmental:** Never shame or guilt users for "bad" choices
- **Encouraging:** Celebrate progress, no matter how small
- **Educational:** Explain the "why" behind recommendations
- **Adaptive:** Learn user's communication preferences (formal vs. casual, detailed vs. brief)
- **Honest:** Reality-check unrealistic goals without discouragement

**Example Conversations:**

**Supportive Recovery:**
- User logs 3,500 kcal (way over target)
- AI: "Big meal day! It happens. Your weekly average is still solid. Back to normal tomorrow?"

**Gentle Accountability:**
- User hasn't logged in 3 days
- AI (WhatsApp): "Hey! Missed you. No judgment - life gets busy. Quick check-in: How's your nutrition been?"

**Educational Reframe:**
- User asks: "Are carbs bad for weight loss?"
- AI: "Carbs aren't bad! Your body needs them for energy. The key is quantity and quality. You're losing weight averaging 150g/day. That's working for you."

#### Success Metrics

- **Engagement Rate:** 80% of users interact with AI coach weekly
- **Question Response Accuracy:** 90% of answered questions rated helpful (thumbs up/down)
- **Intervention Effectiveness:** 70% of users addressed by pattern intervention show improvement within 7 days
- **Retention Impact:** Users who engage with AI coaching have 25% higher 3-month retention
- **Satisfaction:** 4.7/5 rating for AI nutrition coaching quality

#### Acceptance Criteria

- [x] AI responds to nutrition questions in <3 seconds
- [x] Responses are personalized using user's historical data when relevant
- [x] Proactive pattern interventions trigger based on detected behaviors
- [x] Educational content delivered at appropriate user proficiency level
- [x] Multi-channel coaching (WhatsApp, Voice, App) provides consistent experience
- [x] User can provide feedback on AI responses (thumbs up/down)
- [x] AI tone adapts to user preferences (formal/casual, brief/detailed)
- [x] All coaching respects AI safety boundaries (no medical diagnoses, etc.)
- [x] Coaching references user's cross-pillar data (fitness, wellbeing) when relevant

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **User asks medical question** | Medical keyword detection | Politely decline, refer to doctor | "I can't give medical advice. Please consult your doctor about that." |
| **AI unsure of answer** | Low confidence score (<60%) | Admit uncertainty, offer to research | "I'm not certain about that. Want me to find resources?" |
| **User frustrated with repeated nudges** | Multiple dismissals | Back off, ask preferences | "Too many notifications? Let's adjust your settings." |
| **Contradictory advice detected** | Logic validation | Clarify context | "Yesterday I said X for your workout day. Today's a rest day, so Y makes more sense." |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- "Your workout intensity was high today. Increase carbs by 50g for recovery."
- "Rest day tomorrow. Let's reduce calories slightly to stay on track."

**→ Wellbeing Pillar (E7):**
- "You logged low mood 3 days this week. Nutrition affecting energy? Let's optimize."
- "Great sleep last night! Your protein-rich dinner might have helped."

**→ Cross-Domain Intelligence (E8):**
- "Pattern detected: Your energy crashes 2 hours after high-sugar breakfasts. Switch to protein?"
- "You perform best when you eat dinner by 7pm. Adjust tonight's plan?"

#### Dependencies

- **E8 (Cross-Domain Intelligence):** Pattern detection, insight generation
- **F6.1-F6.4:** All nutrition features (coaching references logged data, goals, plans)
- **E2 (Voice Coaching):** Voice-based nutrition coaching sessions
- **E3 (WhatsApp Integration):** Text/voice message coaching
- **E4 (Mobile App):** In-app chat, contextual tips

#### MVP Status
**[x] MVP Core** - Essential for "Second Mind" AI coach vision

---

### F6.6: Food Database & Custom Foods (Including Emotional Eating Integration)

#### Description
Provide a comprehensive food database combining Nutritionix API (5M+ global foods), custom regional cuisine databases, and user-contributed foods that grows smarter over time. Enable users to create and share custom foods/recipes while the system learns individual eating patterns. Includes deep behavioral analysis of emotional eating patterns integrated with Wellbeing Pillar data.

#### User Stories

**As an Optimization Enthusiast (P3):**
> "I want to create custom recipes with precise macro calculations so that I can track my homemade meal prep accurately."

**As a user from Pakistan/UAE (Regional User):**
> "I want to find local foods (biryani, nihari, kunafa) in the database so that I don't have to manually enter nutritional info every time."

**As a Holistic Health Seeker (P1):**
> "I want to understand when I eat emotionally vs. physically hungry so that I can build a healthier relationship with food."

**As a Community Member:**
> "I want to share my healthy recipes with the yHealth community so that others can benefit from my meal prep successes."

#### Flexibility Modes

| Mode | Experience |
|------|------------|
| **Light** | Search database → select food → quick log. Access recently used and favorites. Auto-save new foods to personal database. |
| **Deep** | Create custom recipes with ingredient breakdown. Share recipes publicly. Tag emotional states on meals. View emotional eating analysis reports. Export food database. |

#### Food Database Architecture

**Three-Tier Database System:**

**Tier 1: Nutritionix API (Global Database)**
- 5M+ foods (packaged products, restaurant items, common foods)
- Barcode database (UPC/EAN lookup)
- Auto-updated (new products added regularly)
- Primary source for branded/commercial foods

**Tier 2: yHealth Custom Database (Regional Curation)**
- Curated regional cuisines initially empty, grows with user input
- Example categories:
  - Pakistani: Biryani varieties, daal types, roti/naan, nihari, haleem, samosas, pakoras
  - Middle Eastern: Hummus, shawarma, kunafa, baklava, tabbouleh, falafel
  - Indian: Paneer dishes, curries, dosas, idli, thali meals
  - Local restaurant chains (UAE/Pakistan specific)
- Each food includes:
  - Nutritional breakdown (calories, P/C/F, fiber, sodium, etc.)
  - Common serving sizes
  - Photo reference (optional)
  - Validation status (verified by nutritionist vs. user-submitted)

**Tier 3: User Personal Database**
- Custom foods created by user
- Homemade recipes
- Family/cultural foods not in public databases
- Modifications of existing foods (e.g., "Mom's biryani - less oil")
- Auto-saved foods from AI photo recognition that user corrects

#### Custom Food Creation

**Simple Food Entry:**
- Food name
- Serving size (grams, cups, pieces, etc.)
- Calories
- Macros (protein, carbs, fats) - auto-calculate remaining nutrients if possible
- Optional: Fiber, sugar, sodium, micronutrients

**Recipe Builder (Deep Mode):**
- Recipe name + servings (e.g., "Chicken Stir Fry - serves 4")
- Ingredient list:
  - Search database for each ingredient
  - Specify quantities
  - System auto-calculates total nutrition
  - Divide by servings for per-serving macros
- Cooking instructions (optional)
- Photo upload (optional)
- Tags (meal type, cuisine, dietary flags: vegan, gluten-free, etc.)

**Example Recipe Flow:**
1. User creates "Homemade Protein Pancakes"
2. Adds ingredients:
   - 100g oats (search database, auto-fills nutrition)
   - 2 eggs (search database)
   - 30g protein powder (search database or custom)
   - 200ml almond milk (search database)
3. System calculates total: 650 kcal, 60g P, 70g C, 15g F
4. User sets servings: 3 pancakes
5. Per-serving macros auto-calculated: 217 kcal, 20g P, 23g C, 5g F
6. Saved to personal database for future quick logging

#### Community Sharing (Post-MVP Nice-to-Have for MVP, but architecture supports it)

**Public Recipe Sharing:**
- Users can mark custom recipes as "Public" (opt-in)
- Public recipes searchable by all users
- Rating/review system (5 stars)
- "Made it" counter (tracks usage)
- Report inappropriate content

**Quality Control:**
- Nutritionist review for featured recipes
- User flags for suspicious nutritional data
- Automated validation (e.g., >1000 kcal per 100g triggers review)

**Privacy:**
- Personal foods default to private
- User controls what's shared
- No identifiable information in shared recipes

#### Database Learning & Improvement

**AI Learning from User Corrections:**
- When user corrects photo AI estimate, system learns:
  - Food visual characteristics
  - Common portion sizes for that food
  - Regional naming variations (e.g., "keema" vs. "ground meat curry")
- Corrections improve future AI accuracy for all users (anonymized)

**Personal Database Growth:**
- Average target: 50+ custom foods per user after 90 days
- Frequently logged foods auto-saved for quick access
- AI suggests creating custom foods for recurring manual entries

#### Emotional Eating Integration (Deep Behavioral Analysis)

**Deep Integration with Wellbeing Pillar (E7):**

This feature provides comprehensive emotional eating insights by correlating meal logging (F6.1) with mood tracking, journaling, and stress patterns from the Wellbeing Pillar.

**Data Collection:**

1. **Emotional State Tagging (Optional on Meal Log):**
   - User can tag meals with emotional state: Stressed, Sad, Anxious, Bored, Happy, Neutral, Celebratory
   - Quick emoji selection or text description
   - Not required, but unlocks deeper insights

2. **Automated Correlation:**
   - System cross-references meal logs with:
     - Mood check-ins (from E7 Wellbeing Pillar)
     - Journal entries mentioning food/eating
     - Stress level ratings
     - Energy levels before/after meals
     - Time of day and context (work stress, evening relaxation, etc.)

**Pattern Detection Algorithms:**

| Pattern Type | Detection Method | Example Insight |
|--------------|------------------|-----------------|
| **Stress Eating** | High-calorie snacks logged within 2 hours of "stressed" mood rating | "You eat 40% more snacks on high-stress days, averaging +500 kcal." |
| **Emotional Triggers** | Specific emotions correlate with specific food types | "When you're sad, you crave sweets 80% of the time." |
| **Boredom Eating** | Frequent snacking during low-engagement periods (e.g., evening TV time) | "You snack most between 8-10pm when energy is low." |
| **Celebration Excess** | Large meals logged after positive events/mood spikes | "Happy occasions lead to 35% larger dinners for you." |
| **Skipping Meals Due to Anxiety** | Missed meal logs correlate with anxiety ratings | "You skip lunch on 60% of high-anxiety days." |

**Proactive Coaching Interventions:**

**Real-Time Detection:**
- AI detects user logged "stressed" mood
- AI proactively reaches out via WhatsApp: "Stressful day? Before you reach for a snack, let's check in. Are you physically hungry or seeking comfort?"

**Coping Strategy Suggestions:**
- Alternative activities: "Try a 5-min walk or breathing exercise before eating. See if hunger is still there."
- Mindful eating prompts: "If you do eat, savor it slowly. No judgment - just awareness."
- Healthier substitutions: "Craving sweets when stressed? Try Greek yogurt with honey - satisfies the urge with protein."

**Journaling Prompts (Integrated with E7):**
- "You ate a big snack at 3pm after a stressful meeting. How did you feel before vs. after eating?"
- "You skipped dinner on a tough day. What was going on emotionally?"
- These prompts feed into Wellbeing Pillar journaling feature

**Progress Tracking:**
- Weekly Emotional Eating Report (Deep Mode):
  - "Emotional eating instances: 4 this week (down from 7 last week)"
  - "Most common trigger: Work stress (3 instances)"
  - "Successful interventions: You paused before eating 2 times this week!"
- Visual timeline: Overlay emotional states on meal timeline to see patterns

**Behavioral Analysis Reports (Deep Mode):**

Monthly deep-dive report includes:
1. **Eating Patterns by Emotion:** Chart showing calorie intake vs. emotional state
2. **Trigger Foods:** Which foods you turn to for which emotions
3. **Success Stories:** Times you successfully managed emotional eating
4. **Coping Strategy Effectiveness:** Which AI interventions worked best for you
5. **Recommendations:** Personalized strategies based on your unique patterns

**Clinical Psychology Integration (Future Enhancement):**
- Resources for eating disorder support if concerning patterns detected
- Referral to licensed therapists (when appropriate, with user consent)
- Integration with CBT (Cognitive Behavioral Therapy) techniques for emotional eating
- Crisis detection for severe disordered eating patterns (see AI Safety Boundaries)

**Privacy & Sensitivity:**
- All emotional eating data encrypted and private
- User controls what's shared with AI insights
- Non-judgmental language always ("You turned to food for comfort" vs. "You failed to control eating")
- Option to disable emotional eating tracking if triggering

#### Success Metrics

- **Database Growth:** 50+ custom foods per active user after 90 days
- **Search Success Rate:** 90% of food searches return relevant results in <3 seconds
- **Custom Recipe Creation:** 30% of Deep mode users create 5+ custom recipes in first 3 months
- **Emotional Eating Insight Adoption:** 60% of users who enable emotional tagging receive personalized insights within 30 days
- **Behavioral Change (Emotional Eating):** 50% of users show reduced emotional eating instances (measured by frequency of stress/sad tags on meals) after 90 days
- **User Satisfaction:** 4.6/5 rating for food database quality and emotional eating insights

#### Acceptance Criteria

- [x] Database integrates Nutritionix API with 5M+ foods
- [x] Search returns results in <1 second with autocomplete
- [x] Users can create custom foods with nutritional input
- [x] Recipe builder calculates per-serving macros accurately
- [x] User personal database auto-saves corrected AI estimates
- [x] Recently used and favorite foods quick-accessible
- [x] Emotional state tagging available on all meal logs (optional)
- [x] AI detects emotional eating patterns with 75%+ accuracy
- [x] Proactive coaching interventions trigger based on detected patterns
- [x] Weekly/monthly emotional eating reports generated (Deep mode)
- [x] Journaling prompts integrate with Wellbeing Pillar (E7)
- [x] All emotional data encrypted and private
- [x] User can disable emotional eating tracking anytime

#### Error Handling

| Scenario | Detection | Recovery Behavior | User Communication |
|----------|-----------|-------------------|-------------------|
| **Food search returns no results** | Empty query response | Suggest creating custom food | "Couldn't find that. Want to add it to your personal database?" |
| **Recipe macros don't sum correctly** | Validation logic (P+C+F should equal total kcal via 4/4/9 rule) | Highlight discrepancy, offer correction | "Macros don't match calories. Check your ingredient quantities?" |
| **Nutritionix API down** | API timeout/error | Fall back to custom database only | "Food database temporarily limited. Try again soon or add custom food." |
| **Emotional eating pattern false positive** | User disputes insight | Allow feedback, adjust algorithm | "If this doesn't feel accurate, let me know. I'm learning your patterns." |
| **Concerning disordered eating detected** | Extreme restriction, binge patterns, purge mentions | Gentle resource provision, no alarm | "I've noticed some patterns. Would you like resources for eating disorder support?" |

#### Cross-Pillar Connections

**→ Fitness Pillar (E5):**
- Custom pre-workout meals saved for quick logging
- Recipe database includes performance-focused meals (high-protein, pre-workout carbs, etc.)

**→ Wellbeing Pillar (E7):**
- **DEEP INTEGRATION:** Emotional state from mood tracking correlates with meal logs
- Journal entries mentioning food trigger emotional eating pattern detection
- Stress/anxiety ratings inform real-time eating interventions
- "Your best mood days include balanced breakfasts with 20g+ protein"

**→ Cross-Domain Intelligence (E8):**
- "You sleep 35% better on nights you avoid sugar after 6pm"
- "Your energy crashes 2 hours after meals with >60g simple carbs"
- "Emotional eating instances reduce by 40% on days you journal in the morning"

#### Dependencies

- **E9 (Data Integrations):** Nutritionix API integration
- **F6.1 (Meal Logging):** Photo AI corrections feed database learning
- **E7 (Wellbeing Pillar):** Mood, stress, journal data for emotional eating correlation
- **E8 (Cross-Domain Intelligence):** Pattern detection algorithms
- **E4 (Mobile App):** Recipe builder UI, emotional tagging interface
- **External Resources:** Partnership with eating disorder support organizations (for referrals)

#### MVP Status
**[x] MVP Core** - Food database essential; Emotional eating integration critical for differentiation and "Second Mind" vision

---

## EPIC-LEVEL SPECIFICATIONS

### Cross-Feature Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     NUTRITION PILLAR DATA FLOW                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  F6.1: Meal Logging                                             │
│  ├─ Photo/Barcode/Manual/Voice Input                            │
│  └─ Output: Meal entries (food, quantity, time, macros)         │
│                      │                                           │
│                      ▼                                           │
│  F6.2: Calorie & Macro Tracking                                 │
│  ├─ Aggregate daily totals                                      │
│  ├─ Compare to targets (from F6.4)                              │
│  └─ Output: Progress metrics, variance data                     │
│                      │                                           │
│                      ▼                                           │
│  F6.3: Hydration Tracking                                       │
│  ├─ Parallel tracking (water intake)                            │
│  └─ Correlates with meal timing, activity level                 │
│                      │                                           │
│                      ▼                                           │
│  F6.4: Goals & Plans                                            │
│  ├─ Set targets (calories, macros)                              │
│  ├─ Generate AI meal plans                                      │
│  └─ Track adherence, adjust goals                               │
│                      │                                           │
│                      ▼                                           │
│  F6.5: AI Coaching                                              │
│  ├─ Analyze patterns from F6.1-F6.4 + F6.6                      │
│  ├─ Provide real-time guidance                                  │
│  ├─ Answer questions                                            │
│  └─ Proactive interventions                                     │
│                      │                                           │
│                      ▼                                           │
│  F6.6: Food Database & Emotional Eating                         │
│  ├─ Data source for F6.1 (Nutritionix + Custom)                 │
│  ├─ Learn from corrections → improve database                   │
│  ├─ Correlate meals with emotional states (E7 Wellbeing)        │
│  └─ Detect patterns, trigger interventions                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              CROSS-PILLAR INTEGRATION                      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  E5: Fitness ────► Activity level adjusts calorie targets │  │
│  │                    Pre/post-workout meal timing           │  │
│  │                                                            │  │
│  │  E7: Wellbeing ──► Mood + Stress + Energy correlations   │  │
│  │                    Emotional eating pattern detection     │  │
│  │                                                            │  │
│  │  E8: Cross-Domain► Unimaginable insights generation      │  │
│  │                    "What's affecting what" analysis       │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Architecture Requirements

**Database Schema (High-Level):**

```sql
-- Meal Logs
TABLE meal_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack'),
  logged_at TIMESTAMP,
  logging_method ENUM('photo', 'barcode', 'manual', 'voice'),
  photo_url TEXT,
  confidence_score FLOAT,
  emotional_tag ENUM('stressed', 'sad', 'anxious', 'bored', 'happy', 'neutral', 'celebratory', NULL),
  total_calories INT,
  protein_g FLOAT,
  carbs_g FLOAT,
  fats_g FLOAT,
  fiber_g FLOAT,
  sugar_g FLOAT,
  sodium_mg FLOAT,
  -- Additional micronutrients...
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Meal Items (many-to-one with meal_logs)
TABLE meal_items (
  id UUID PRIMARY KEY,
  meal_log_id UUID REFERENCES meal_logs(id),
  food_id UUID REFERENCES foods(id),
  serving_size FLOAT,
  serving_unit VARCHAR(50),
  calories INT,
  protein_g FLOAT,
  carbs_g FLOAT,
  fats_g FLOAT,
  -- Macros calculated from food + serving size
  created_at TIMESTAMP
);

-- Foods (combined database)
TABLE foods (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  source ENUM('nutritionix', 'custom_yhealth', 'user_personal'),
  created_by UUID REFERENCES users(id) NULL, -- for user-created foods
  barcode VARCHAR(50) NULL,
  nutrition_per_100g JSONB, -- flexible schema for all nutrients
  common_serving_sizes JSONB, -- [{unit: "cup", grams: 240}, ...]
  cuisine_type VARCHAR(100),
  is_public BOOLEAN DEFAULT FALSE,
  validation_status ENUM('verified', 'user_submitted', 'pending_review'),
  photo_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Custom Recipes
TABLE recipes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  servings INT,
  instructions TEXT,
  photo_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags JSONB, -- ["vegan", "gluten-free", "high-protein"]
  created_at TIMESTAMP
);

TABLE recipe_ingredients (
  id UUID PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id),
  food_id UUID REFERENCES foods(id),
  quantity FLOAT,
  unit VARCHAR(50)
);

-- Nutrition Goals
TABLE nutrition_goals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  goal_type ENUM('weight_loss', 'muscle_gain', 'performance', 'general_health', 'body_recomp', 'custom'),
  start_date DATE,
  end_date DATE,
  target_calories INT,
  target_protein_pct FLOAT,
  target_carbs_pct FLOAT,
  target_fats_pct FLOAT,
  custom_targets JSONB, -- for micronutrient targets
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Hydration Logs
TABLE hydration_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  logged_at TIMESTAMP,
  volume_ml INT,
  beverage_type ENUM('water', 'coffee', 'tea', 'sports_drink', 'other'),
  created_at TIMESTAMP
);

-- Emotional Eating Patterns (pre-computed insights)
TABLE emotional_eating_insights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  pattern_type ENUM('stress_eating', 'boredom_eating', 'celebration_excess', 'anxiety_skipping'),
  trigger_emotion VARCHAR(100),
  trigger_food_types JSONB, -- ["sweets", "salty_snacks"]
  frequency_per_week FLOAT,
  avg_calorie_impact INT,
  detected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**API Endpoints (High-Level):**

```
POST   /api/v1/nutrition/meals                    # Log meal
GET    /api/v1/nutrition/meals                    # Get meal history
PATCH  /api/v1/nutrition/meals/{id}               # Update meal log
DELETE /api/v1/nutrition/meals/{id}               # Delete meal

POST   /api/v1/nutrition/meals/photo-analyze      # Upload photo for AI analysis
POST   /api/v1/nutrition/meals/barcode-scan       # Scan barcode

GET    /api/v1/nutrition/tracking/daily           # Get daily calorie/macro summary
GET    /api/v1/nutrition/tracking/trends          # Get weekly/monthly trends

POST   /api/v1/nutrition/hydration                # Log water intake
GET    /api/v1/nutrition/hydration/daily          # Get daily hydration status

POST   /api/v1/nutrition/goals                    # Set nutrition goal
GET    /api/v1/nutrition/goals                    # Get active goals
PATCH  /api/v1/nutrition/goals/{id}               # Update goal

POST   /api/v1/nutrition/meal-plans/generate      # Generate AI meal plan
GET    /api/v1/nutrition/meal-plans/{id}          # Get meal plan details
PATCH  /api/v1/nutrition/meal-plans/{id}/swap     # Swap meal in plan

POST   /api/v1/nutrition/coaching/ask             # Ask nutrition question
GET    /api/v1/nutrition/coaching/insights        # Get proactive insights

GET    /api/v1/nutrition/foods/search             # Search food database
POST   /api/v1/nutrition/foods/custom             # Create custom food
POST   /api/v1/nutrition/recipes                  # Create recipe
GET    /api/v1/nutrition/recipes/{id}             # Get recipe details

GET    /api/v1/nutrition/emotional-eating/patterns # Get emotional eating insights
GET    /api/v1/nutrition/emotional-eating/reports  # Get monthly report
```

**AI/ML Components:**

1. **Photo Recognition Model:**
   - Model: Fine-tuned computer vision model (e.g., ResNet, EfficientNet)
   - Training data: 100K+ labeled food images
   - Accuracy target: ±10-15% calorie estimation
   - Processing time: <10 seconds

2. **Meal Plan Generation:**
   - Model: GPT-based recipe generation + constraint satisfaction
   - Inputs: Goals, preferences, restrictions, past behavior
   - Output: 7-day meal plan with recipes
   - Generation time: <30 seconds

3. **Emotional Eating Pattern Detection:**
   - Model: Time-series analysis + correlation algorithms
   - Inputs: Meal logs, mood ratings, journal text, stress levels
   - Output: Detected patterns, trigger identification
   - Accuracy target: 75%+ pattern detection

4. **Nutrition Q&A:**
   - Model: GPT-based with RAG (Retrieval-Augmented Generation)
   - Knowledge base: Nutrition science, user's personal data
   - Response time: <3 seconds

### Performance Requirements

| Feature | Metric | Target | Priority |
|---------|--------|--------|----------|
| **Photo AI Analysis** | Processing time | <10 seconds (95th percentile) | P0 |
| **Barcode Scan** | Lookup time | <3 seconds | P0 |
| **Manual Search** | Results load time | <1 second | P0 |
| **Macro Dashboard** | Render time | <2 seconds | P0 |
| **Meal Plan Generation** | Generation time | <30 seconds | P1 |
| **AI Coaching Response** | Response latency | <3 seconds | P0 |
| **Data Sync (offline→online)** | Sync completion | <10 seconds for 50 logs | P1 |
| **Database Search** | Autocomplete response | <500ms | P0 |

### Security & Privacy

**Data Classification:**
- **Highly Sensitive:** Meal photos, emotional state tags, eating disorder patterns
- **Sensitive:** Nutritional goals, meal logs, body weight
- **Standard:** Food database entries, recipes

**Encryption:**
- Data at rest: AES-256 encryption
- Data in transit: TLS 1.3
- Photos: Encrypted storage, auto-delete after 90 days (user configurable)

**Privacy Controls:**
- User can delete all meal history anytime
- Emotional eating data never shared (even anonymized)
- Recipe sharing opt-in only (default private)
- Photo AI processing: option to disable cloud processing (on-device only, slower)

**Compliance:**
- GDPR: Right to data export, right to deletion
- HIPAA: Nutrition data treated as PHI (Protected Health Information)
- Data retention: 24 months rolling for meal logs (configurable)

### Testing Strategy

**Unit Testing:**
- Macro calculation accuracy (P+C+F must equal calories via 4/4/9 rule)
- Recipe builder math (ingredient sums)
- Hydration multiplier logic (beverage types)

**Integration Testing:**
- Nutritionix API integration
- Photo AI model integration
- Cross-pillar data flow (Fitness/Wellbeing correlation)

**User Acceptance Testing:**
- Photo AI accuracy validation (100 test meals, compare to manual entry)
- Meal plan quality (user ratings, adherence tracking)
- Emotional eating pattern detection (user validation of insights)

**Performance Testing:**
- Load testing (1000 concurrent photo uploads)
- Database query optimization (meal history retrieval <1s)
- AI response latency under load

**Accessibility Testing:**
- Screen reader support for meal logging
- Voice input accuracy for visually impaired users
- Color contrast for macro visualization

---

## EPIC SUCCESS CRITERIA

### Launch Readiness Checklist

#### F6.1: Meal Logging
- [x] Photo AI accuracy ≥85% (within ±15% of actual calories)
- [x] All logging methods functional (photo, barcode, manual, voice)
- [x] Sync latency <5 minutes across all channels
- [x] Offline mode supports manual/cached barcode entries
- [x] 90% of common foods recognized by photo AI

#### F6.2: Calorie & Macro Tracking
- [x] Real-time tracking updates <2 seconds
- [x] Personalized targets calculated for 95% of users (with complete profiles)
- [x] Progress visualizations render <1 second
- [x] Light/Deep mode display logic working correctly
- [x] Weekly summary reports auto-generated

#### F6.3: Hydration Tracking
- [x] One-tap logging <2 seconds
- [x] Smart reminders adapt to activity and time of day
- [x] Quiet hours respected (no nighttime notifications)
- [x] Hydration score calculation accurate
- [x] Cross-pillar correlations generated (energy, performance)

#### F6.4: Nutrition Goals & Plans
- [x] Pre-built goal templates functional
- [x] AI meal plan generation <30 seconds
- [x] Meal plans respect dietary restrictions 100% of time
- [x] Tap-to-log from meal plan seamless
- [x] Weekly progress reports accurate

#### F6.5: AI Nutrition Coaching
- [x] Question response time <3 seconds
- [x] Personalized answers reference user's data when relevant
- [x] Proactive interventions trigger based on patterns
- [x] Multi-channel coaching consistent (WhatsApp, Voice, App)
- [x] AI safety boundaries enforced (no medical diagnoses)

#### F6.6: Food Database & Emotional Eating
- [x] Nutritionix API integration functional
- [x] Search results <1 second with autocomplete
- [x] Recipe builder macro calculations accurate
- [x] Emotional eating pattern detection 75%+ accuracy
- [x] Proactive interventions trigger within 24 hours of pattern detection
- [x] Monthly emotional eating reports generated

### User Experience Validation

**First Week Experience:**
- [x] 80% of users successfully log 5+ meals in first 7 days
- [x] 60% try photo-based logging
- [x] 70% set a nutrition goal during onboarding
- [x] 50% receive first cross-pillar insight by Day 7
- [x] 75% engage with AI nutrition coaching (ask question or respond to nudge)

**30-Day Retention:**
- [x] 70% of users still actively logging meals at Day 30
- [x] 60% have discovered at least one nutrition-related insight
- [x] 50% have adjusted goals based on progress
- [x] 40% have created at least one custom food or recipe

### Quality Gates

| Gate | Criteria | Pass/Fail |
|------|----------|-----------|
| **Performance** | All P0 metrics meet targets | [ ] |
| **Accuracy** | Photo AI ±10-15%, Pattern detection >75% | [ ] |
| **Security** | Penetration testing passed, encryption verified | [ ] |
| **Privacy** | GDPR/HIPAA compliance validated | [ ] |
| **Accessibility** | WCAG 2.1 AA compliance | [ ] |
| **User Satisfaction** | 4.5/5 beta rating for Nutrition features | [ ] |
| **Cross-Pillar** | 90% discover fitness/wellbeing connections | [ ] |

---

## DEPENDENCIES & RISKS

### External Dependencies

| Dependency | Type | Risk Level | Mitigation |
|------------|------|------------|------------|
| **Nutritionix API** | Critical | Medium | Contract SLA, fallback to custom database, cache common foods |
| **Photo Recognition Model** | Critical | Medium | Multiple model options (Claude Vision, AWS Rekognition, custom), graceful degradation to manual |
| **Wellbeing Pillar (E7)** | High | Low | Emotional eating works standalone, enhanced with E7 data |
| **Cross-Domain Intelligence (E8)** | High | Low | Basic insights work without E8, deep correlations require it |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Photo AI accuracy below target** | Medium | High | Extensive training data, user correction feedback loop, confidence scoring |
| **Meal plan generation too slow** | Low | Medium | Pre-compute common plans, optimize AI prompts, async generation |
| **Nutritionix API rate limits** | Medium | Medium | Caching strategy, upgrade to higher tier, custom database growth |
| **Emotional eating detection false positives** | Medium | Medium | User feedback mechanism, adjustable sensitivity, clear disclaimers |
| **Database performance degradation** | Low | High | TimescaleDB for time-series, query optimization, sharding strategy |

### User Experience Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Users find meal logging tedious** | High | Critical | Multi-modal input (photo primary), quick logging <30 sec, Light mode optimization |
| **AI meal plans feel generic** | Medium | High | Personalization based on past behavior, cuisine variety, easy customization |
| **Emotional eating features feel invasive** | Medium | High | Opt-in tagging, non-judgmental language, clear privacy controls, disable option |
| **Macro tracking overwhelms Light mode users** | Medium | Medium | Hide details by default, progressive disclosure, education |

---

## ROADMAP & FUTURE ENHANCEMENTS

### Post-MVP Enhancements (v1.1 - v2.0)

**v1.1 (3 months post-launch):**
- [ ] Community recipe sharing with ratings
- [ ] Meal prep calendar (plan which days to batch cook)
- [ ] Restaurant menu integration (analyze restaurant meals from photos)
- [ ] Grocery list generation from meal plans

**v1.2 (6 months post-launch):**
- [ ] Nutritionist chat (human expert consultation, premium feature)
- [ ] Advanced carb cycling for athletes
- [ ] Supplement tracking and recommendations
- [ ] Integration with continuous glucose monitors (CGM)

**v1.5 (9 months post-launch):**
- [ ] Family meal planning (shared recipes, family goals)
- [ ] Kids' nutrition tracking (age-appropriate goals)
- [ ] Social dining features (restaurant recommendations with friends)
- [ ] Nutrition challenges and gamification

**v2.0 (12 months post-launch):**
- [ ] Clinical nutrition partnerships (registered dietitians)
- [ ] Medical nutrition therapy for chronic conditions (diabetes, heart disease)
- [ ] DNA-based nutrition recommendations (nutrigenomics)
- [ ] Integration with healthcare providers (EHR systems)

---

## DOCUMENT GOVERNANCE

**Review Schedule:** Bi-weekly during development, monthly post-launch
**Update Triggers:** User feedback, feature changes, dependency updates, new research
**Version Control:** All changes require version increment and change log entry
**Ownership:** Product Team (lead), with Engineering, Design, and Clinical Advisors review

---

## APPENDIX

### Glossary

| Term | Definition |
|------|------------|
| **Macronutrients (Macros)** | Protein, Carbohydrates, and Fats - the three primary nutrients that provide calories |
| **Micronutrients** | Vitamins and minerals required in small amounts for health |
| **TDEE** | Total Daily Energy Expenditure - total calories burned per day |
| **Caloric Deficit** | Consuming fewer calories than TDEE to lose weight |
| **Caloric Surplus** | Consuming more calories than TDEE to gain weight |
| **Nutritionix** | Third-party food database API with 5M+ foods |
| **Emotional Eating** | Eating in response to emotions rather than physical hunger |
| **Meal Timing** | When meals are consumed (e.g., pre-workout, post-workout, before bed) |
| **Carb Cycling** | Alternating between high-carb and low-carb days based on activity |

### References

**Nutritional Science:**
- USDA FoodData Central: https://fdc.nal.usda.gov/
- Academy of Nutrition and Dietetics: https://www.eatright.org/
- International Society of Sports Nutrition: https://www.sportsnutritionsociety.org/

**Emotional Eating Research:**
- Van Strien, T., et al. (2016). "Emotional eating and food intake after sadness and joy." *Appetite*, 100, 253-265.
- Macht, M. (2008). "How emotions affect eating: A five-way model." *Appetite*, 50(1), 1-11.

**AI in Nutrition:**
- Google's Im2Calories: Image-based calorie estimation research
- MyFitnessPal: Food photo recognition accuracy benchmarks
- Nutritionix API Documentation: https://www.nutritionix.com/business/api

---

*Epic 6: Nutrition Pillar - "Your AI Nutrition Coach That Understands Your Whole Self"*
*yHealth Platform | Xyric Solutions | Product Requirements Document*
*Document Classification: INTERNAL USE - Product Foundation*
*Created: 2025-12-02 | Last Updated: 2025-12-02*
*Feature Count: 6 | MVP Status: All Core*
