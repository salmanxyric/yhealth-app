Balencia UI/UX Vision Questionnaire
Purpose: Capture every design decision before a single screen gets built. Your answers here become the
source of truth for the entire UI/UX revamp.
How to use: Answer each question inline below the Answer marker. If a decision is final and locked,
change the status to FINAL. If unsure, mark it OPEN.
Framing: Balencia is an AI Life Coach — not a health app, not a fitness tracker. It connects every part of a
user's life system (career, relationships, spirituality, finance, fitness, creativity, learning) and reveals the
connections they can't see themselves.
Context sources referenced:
- Direction Reset (2026-03-12) — team decisions on Life Coach identity, AI-first UX, motivation tiers
- Old UI/UX meeting (2026-04-23 with Salman) — preliminary design decisions, NOT binding
- Current codebase — 8 life domains, 60+ pages, 220+ services, deep cross-domain AI intelligence

---

## 1. Core Philosophy & Identity

### 1.1 What is the single sentence that describes what Balencia IS?
"If you are striving to improve yourself then Balencia is for you. Identity: Life Coach, not Health Coach."
"Balencia sees what we can't see. Balencia connects different parts of your life system together."
Refine this into the one sentence a user should feel when they open the app.

**Your Answer:** `[OPEN — needs Salman's final wording]`

**Recommendation:** "Balencia is your AI life coach that connects your fitness, finances, faith, career, and relationships into one system — and shows you the patterns you'd never spot alone."

**Rationale from codebase:** The cross-pillar intelligence engine already has 22 rules detecting connections across sleep, nutrition, exercise, stress, mood, and recovery. The knowledge graph tracks entity relationships across goals, habits, activities, and conditions. The system literally sees what humans can't — it correlates WHOOP recovery data with spending patterns, mood logs with nutrition adherence, and workout consistency with career productivity. The sentence should promise exactly what the backend delivers.

---

### 1.2 "Balencia sees what we can't see" — what does this mean concretely in the UI?
This is a powerful positioning statement. But what does the user actually SEE that makes them feel this?
- SIA says "I noticed your spending goes up on days you skip exercise"
- A visual thread connecting your sleep data to your work productivity goal
- A weekly insight card: "3 things connected in your life this week"
- The Knowledge Graph showing relationships between your habits, goals, and outcomes

**Your Answer:** `[OPEN]`

**Recommendation:** All four, but layered by context:

1. **Primary (daily):** SIA proactive messages surface connections in plain language. The backend already scores 40+ proactive message types and picks the top 2-3 per day. Cross-domain observations like "Your mood dips every Tuesday — the same day you skip prayer and have your longest work meetings" are what make this real.

2. **Secondary (home screen):** An "Insight of the Day" card with a cross-domain observation. The cross-pillar intelligence engine produces severity-rated contradictions (e.g., HIGH_EXERCISE_LOW_SLEEP, NUTRITION_MOOD_CORRELATION, SOCIAL_ISOLATION_DECLINE). These should render as visually striking cards with domain-colored accents.

3. **Tertiary (weekly):** A weekly digest (already built as `weekly_digest` proactive message type) that summarizes "3 connections spotted this week" with before/after data.

4. **Power user (on-demand):** The Knowledge Graph is already built with node types (users, goals, habits, activities, exercises, foods, metrics, conditions) and edge types (causes, prevents, supports, conflicts_with). This is the "show me everything" view for users who want to explore.

**The "holy shit" moment:** The first time SIA tells a user something true about their own life that they didn't consciously know — like "Your recovery scores drop 30% the week after you overspend." That's the product in one sentence.

---

### 1.3 What is the emotional arc of a user's first 5 minutes?
Walk through it: they download the app, open it for the first time. What do they see, feel, and do — screen by
screen. Think life system, not health assessment.

**Your Answer:** `[OPEN]`

**Recommended arc:**

1. **0:00–0:15 — "This feels different"** — A cinematic motion sequence (not video — motion graphics) showing abstract life domains connecting. Dark, premium, 3-5 seconds. Text: "Your life is one system. Let's see it clearly." Feeling: curiosity, intrigue.

2. **0:15–0:45 — "It's talking to me"** — SIA introduces herself conversationally: "I'm SIA, your life coach. I'm not a fitness app or a to-do list. I connect the parts of your life you've been managing separately." This is a hybrid onboarding — SIA's personality shows, but the UI is structured (not a freeform chatbot). Feeling: warmth, trust.

3. **0:45–2:00 — "It gets me"** — SIA asks 3 focused questions: "What area of your life needs the most attention right now?" (presents the 10 life domains as beautiful, tappable cards). Then: "What does success look like for you in [chosen domain]?" Then: "How much structure do you want — gentle nudges, balanced guidance, or serious accountability?" Feeling: understood, not overwhelmed.

4. **2:00–3:30 — "It's already working"** — SIA generates a personalized life plan in real-time (the backend already does this — 12-week plan with weekly focuses, activities, milestones). Shows a beautiful plan preview with domain-colored milestones. Feeling: excitement, momentum.

5. **3:30–5:00 — "I want to come back"** — Lands on the Today screen with SIA's first greeting, one cross-domain insight preview ("As we get to know each other, I'll start connecting dots across your life"), and 2-3 immediate actions. Optional: connect WHOOP/Calendar for deeper insights. Feeling: equipped, not overwhelmed.

**Key principle:** Never show an empty state. From minute 1, the app should feel alive and personal.

---

### 1.4 Who is the primary user persona we're designing for?
"Users range from 'wanting to be a better Muslim' to 'reduce screen time' to 'improve marriage' to 'get fit.'"
"90% of users are non-technical, don't know what features exist."
Describe your primary user in 2-3 sentences: age range, tech comfort, what's going on in their life, what brought
them to Balencia, what would make them leave.

**Your Answer:** `[OPEN — needs team alignment]`

**Recommendation:** **Amira, 28.** Muslim professional juggling career growth, marriage, fitness, and faith practice. Comfortable with WhatsApp and Instagram but not "tech-forward" — she won't explore settings or discover features on her own. She downloaded Balencia because she feels like everything in her life is disconnected — she works out but her diet suffers, she prays but feels spiritually stagnant, she earns well but saves nothing. She'd leave if the app feels like another chore to maintain, if it's too "health-bro" in tone, or if she has to figure out what to do next herself.

**Secondary persona:** **Khalid, 35.** High-achiever who already tracks fitness with WHOOP and manages finances. He wants the cross-domain intelligence — the connections he can't see. He'd leave if the AI gives generic advice or can't keep up with his data sophistication.

**Why this matters for design:** Amira needs AI-first UX (SIA tells her what to do). Khalid needs data depth available on demand. The motivation tier system (already built) serves both — Amira is medium/low tier (gentle, minimal), Khalid is high tier (dense, detailed).

---

### 1.5 What are the 3 apps whose feel/vibe you want Balencia to channel?
Not copy — channel. The emotional quality, the polish level, the way they make you feel. Can be from any
category.

**Your Answer:** `[OPEN — needs Salman's input]`

**Suggestions to consider:**
1. **Oura Ring app** — Premium dark UI, personal health insights delivered as "discoveries," not dashboards. Calm confidence. Data-rich but never overwhelming.
2. **Calm** — Emotional warmth, beautiful motion, makes you feel taken care of. The opposite of clinical.
3. **Arc Browser** — Modern, opinionated, AI-first interactions, makes you feel like you're using something from the future. Bold design choices.

Alternative: **Duolingo** (if gamification-forward is the direction) or **Notion** (if customization/power-user is the direction).

---

### 1.6 How do you describe Balencia to someone in 10 seconds?
The elevator pitch. Not a feature list — the feeling and value proposition. This shapes every design decision.

**Your Answer:** `[OPEN — needs Salman's final wording]`

**Recommendation:** "Balencia is an AI life coach that connects your fitness, finances, faith, and relationships into one system — then shows you patterns about yourself you'd never see alone."

**Shorter (5 seconds):** "An AI that coaches your whole life, not just your workouts."

---

## 2. The AI Coach (SIA) Experience

### 2.1 What is SIA's personality in 3 adjectives?
"Brand guidelines: grounded, curious, warm, playful, quietly confident."
"Tone adapts by motivation tier — gentle for low, structured for medium, challenging for high."
Is this still right? Does SIA have a distinct character beyond a generic AI assistant?

**Your Answer:** `[OPEN]`

**Recommendation: Warm, perceptive, direct.**

- **Warm** — SIA cares. Not performatively, but genuinely. She remembers your sister's wedding, your Ramadan goals, your shoulder injury.
- **Perceptive** — This is the differentiator. SIA notices patterns. "You always skip your evening routine when you have a stressful workday. Let's plan for that." The memory engine (confidence-scored, evidence-based) and cross-pillar intelligence make this real.
- **Direct** — SIA doesn't hedge. She gives clear recommendations, not menus of options. Adapted by motivation tier: gentle for low ("Maybe we could try..."), structured for medium ("Here's what I'd suggest..."), challenging for high ("You committed to this. What happened?").

**What makes SIA distinct from ChatGPT/Gemini:** SIA has persistent memory (memory engine with confidence decay), a personal wiki about you, 22 cross-domain rules, and proactive messaging. She doesn't just answer — she initiates, remembers, and connects.

---

### 2.2 What does the SIA chat screen look like?
Should SIA be able to show charts, goal progress, meal plans, financial summaries directly in the conversation?
- A) Full-screen chat like iMessage/WhatsApp — clean and focused
- B) Split view with a side panel showing relevant data
- C) Chat with rich inline cards (like Perplexity or Claude artifacts)
- D) Something else

**Your Answer:** `[OPEN]`

**Recommendation: C) Chat with rich inline cards**, with a strong lean toward how the codebase already works.

**Codebase evidence:** The current chat already supports:
- Artifact generation (plans, recipes, workouts) via `MessagesView.tsx`
- Wiki page linking and save-to-wiki modals
- Check-in cards for structured assessments
- Memory/context cards showing what SIA knows
- Agent timeline showing action execution
- Transparency panel showing reasoning

The infrastructure for rich inline cards is already built. SIA should be able to show workout cards (tappable to start), meal plan cards (tappable to log), progress charts (inline), and goal progress rings — all within the conversation flow.

**Mobile:** Full-width cards. **Desktop:** Consider a collapsible right panel for persistent context (current goals, today's schedule) while chat occupies the main area — but only if the user opens it.

---

### 2.3 How does SIA connect life domains in conversation?
This is the core differentiator. When SIA references cross-domain connections:
- Does SIA proactively surface connections, or only when asked?
- Should there be visual indicators (colored domain tags, connection lines) in the chat?
- How often should SIA make cross-domain observations?

**Your Answer:** `[OPEN]`

**Recommendation:**

- **Proactively, always.** The proactive messaging system already scores 40+ message types and delivers the top 2-3 per day. Cross-domain observations should be the highest-priority message category because they're the core differentiator.

- **Yes, visual domain tags.** Each life domain already has a color assignment in the codebase (Fitness=cyan-teal, Nutrition=emerald-green, Career=sky-blue, Finance=lime-emerald, etc.). When SIA mentions a cross-domain connection, the relevant domains should appear as small colored tags/pills in the message: "Your [🟣 Sleep] quality drops 25% after days when your [🟠 Finance] stress is high."

- **Frequency:** 1-2 cross-domain observations per conversation session. Not every message — that would feel forced. The cross-pillar intelligence engine only fires rules that have actual evidence, so this self-regulates. If there's no real connection to surface, SIA shouldn't fabricate one.

---

### 2.4 How does SIA deep-link into features?
"Old meeting Q2: Unresolved — How does SIA deep-link into modules?"
- A) A rich card appears in chat, tapping it opens the relevant screen
- B) SIA navigates you to that screen directly
- C) SIA creates a task/action in your daily schedule
- D) All of the above depending on context

**Your Answer:** `[OPEN]`

**Recommendation: D) All of the above, context-dependent.**

- **Information/review → A) Rich card.** "Here's your workout plan for today" → tappable card opens workout screen.
- **Urgent action → B) Navigate.** "You haven't logged dinner — let me take you there" → navigates to meal logging.
- **Future action → C) Schedule task.** "Let's schedule your Quran reading for after Fajr tomorrow" → creates a scheduled action.

**Technical note:** The LangGraph tool system already supports 20+ domain-specific tools. The chat already generates artifacts. Deep-linking is a frontend routing concern — SIA generates a card with a route path, the frontend handles navigation.

---

### 2.5 Voice interaction — how prominent?
"Salman uses voice daily with Gemini. Direction Reset mentions voice journaling as lower-friction input."
- A) Prominent mic button + dedicated full-screen voice mode (like Gemini Live)
- B) Mic button available but voice is secondary to text
- C) Voice only for journaling and quick check-ins
- D) Voice-first: the primary way most users interact with SIA

**Your Answer:** `[OPEN]`

**Recommendation: A) Prominent mic button + dedicated full-screen voice mode.**

**Codebase evidence:** Voice infrastructure is substantial:
- WebRTC voice calls with signaling service (recently refactored to remove Twilio TURN)
- Voice assistant page (`/voice-assistant`) with always-on listening mode
- Call coach page (`/call-coach`) for structured voice sessions
- Google Cloud TTS for SIA responses
- Call history tracking with session types
- Voice transcription support

Voice is the lowest-friction input for the primary persona (Amira). Journaling by voice, quick check-ins ("Hey SIA, how's my week going?"), and coaching sessions all work better spoken than typed. The mic button should be prominent in the chat interface, and the full-screen voice mode should feel like calling a friend — warm, ambient, with SIA's animated icon pulsing as she listens.

---

### 2.6 Should SIA have a visual avatar/face?
- A) Yes, a 3D animated avatar that speaks and reacts
- B) A simple animated icon/logo that pulses when SIA is thinking/speaking
- C) No avatar — just conversation
- D) Avatar for voice calls only, text chat has no avatar

**Your Answer:** `[OPEN]`

**Recommendation: B) A simple animated icon/logo that pulses when SIA is thinking/speaking.**

3D avatars are expensive to build, hard to keep out of the uncanny valley, and date quickly. A beautifully animated abstract icon (think: the Balencia continuous stroke line, animated) gives SIA presence without the risks. It pulses when listening, animates when thinking, and settles when presenting. For voice calls, the same icon expands to fill the screen with ambient motion — like talking to an intelligence, not a cartoon person.

---

### 2.7 What's the difference between "AI Coach" and "Chat"?
Current app has both /ai-coach and /chat. Are these separate experiences? Or should they merge into one
unified SIA conversation?

**Your Answer:** `[OPEN]`

**Recommendation: Merge into one unified SIA experience.**

**Codebase evidence:** Both routes exist (`/ai-coach` and `/chat`) and share significant backend infrastructure (both use the LangGraph chatbot service, same context injection, same memory engine). The distinction is confusing for users — "Do I go to AI Coach or Chat?" There should be one SIA, one conversation thread, one entry point.

The unified experience should support multiple interaction modes within it:
- **Text chat** (default)
- **Voice mode** (mic button → full-screen voice)
- **Check-in mode** (SIA initiates structured questions)
- **Deep dive mode** (user requests detailed analysis)

One SIA. One conversation. Multiple ways to interact.

---

### 2.8 Proactive messages from SIA — where do they appear?
"AI-first means SIA initiates. 18 proactive message types already exist in the backend."
- A) As a push notification that opens SIA chat
- B) On the home screen as a card/banner
- C) Both — notification + home card
- D) In a separate 'insights' feed

**Your Answer:** `[OPEN]`

**Recommendation: C) Both — push notification + home card.**

**Codebase evidence:** The proactive messaging system already supports:
- Push notifications (FCM/APNS)
- In-app messaging via Socket.IO
- Daily cap of 4 messages/day per user
- Timezone-aware delivery (6am-10pm local time)
- Scoring system that picks top 2-3 per cycle

**UX flow:** Push notification (short, intriguing) → tap → opens to either:
1. The home screen card (if it's an insight to review), or
2. SIA chat (if it's a conversation starter)

The home screen should show the most recent unread proactive message as a prominent card. Older ones live in SIA's conversation history. No separate "insights feed" — that fragments the experience.

---

## 3. Onboarding & First Experience

### 3.1 How many screens should onboarding have?
"Old meeting: ~3 screens. Direction Reset: Registration → AI assessment → AI suggests goals → AI generates plan →
user customizes."
"Current app: 8-step flow."
What are the mandatory steps before a user can start using Balencia?

**Your Answer:** `[OPEN]`

**Recommendation: 5 screens (down from current 8).**

**Current 7-step flow in codebase:** Welcome → Assessment Mode → Assessment → Life Goals → Integrations → Preferences → Plan Generation.

**Proposed 5-step flow:**
1. **Welcome + Name** (10 seconds) — SIA greets, captures name
2. **Life Focus** (30 seconds) — "What area of your life needs the most attention?" → tap domain cards
3. **Quick Assessment** (60-90 seconds) — 3-5 conversational questions about chosen domain + life context
4. **Plan Preview** (30 seconds) — AI generates plan, user reviews/tweaks
5. **You're In** (immediate) — Land on Today screen, optional integrations shown as enhancement cards

**What's deferred:** Integrations (WHOOP, Calendar, Spotify), detailed preferences, deep assessment, body images. These become "unlock deeper insights" prompts over the first week.

---

### 3.2 Chatbot-driven or traditional screen-based onboarding?
- A) Chatbot-driven: SIA asks life questions conversationally
- B) Traditional: Clean selection screens with pre-built options
- C) Hybrid: SIA introduces each step with personality, but the UI is structured

**Your Answer:** `[OPEN]`

**Recommendation: C) Hybrid.**

Pure chatbot onboarding is slow and unpredictable — users can go off-track, type long answers, or feel confused about progress. Pure traditional screens feel generic and impersonal.

Hybrid: SIA speaks at the top of each screen ("I'd love to understand what matters most to you right now"), but the actual input is structured — beautiful tappable cards, sliders, or simple selections. Best of both worlds: personality + speed.

---

### 3.3 What information do you absolutely need before the user can start?
Pick the minimum viable set. Which can be deferred?

**Your Answer:** `[OPEN]`

**Recommendation:**

**Mandatory (before first use):**
- Name (personalization)
- Life areas of interest (1-3 from the 10 domains — drives initial plan)
- Primary life goal (free text or pre-built — gives SIA something to coach toward)

**Deferred (first week, prompted contextually):**
- Motivation level (SIA can infer from behavior within 3-5 days)
- Age/gender (only if relevant to fitness/nutrition — SIA asks when needed)
- Integrations (prompted when SIA mentions data she could use: "I could give you better recovery insights if you connect WHOOP")
- Subscription plan (free tier should be generous enough for meaningful first week)

**Not needed:**
- What they've tried before (SIA learns this conversationally)
- Biggest obstacle (SIA discovers this organically)

---

### 3.4 Should there be an intro video/animation from SIA?
"Hamza wanted 'a 30-second intro video to amaze the shit out of users.'"
- A) A pre-recorded video showing cross-domain intelligence in action
- B) An animated avatar welcoming you and explaining the life system concept
- C) A cinematic motion sequence showing life domains connecting
- D) Skip it — get users into the experience faster

**Your Answer:** `[OPEN]`

**Recommendation: C) A cinematic motion sequence — but 5-10 seconds max, not 30.**

A beautiful, dark, premium motion sequence showing abstract life domain icons connecting with flowing lines (the continuous stroke line from the brand) — then resolving into SIA's greeting. Think Apple product reveal, not explainer video. Skippable with a tap.

30 seconds is too long. Users are impatient. The "wow" should come from the first cross-domain insight SIA gives, not a pre-rendered video.

---

### 3.5 The AI assessment conversation — how deep does it go?
- A) Immediately generate a plan and let them start (fast, may feel generic)
- B) Ask 2-3 follow-up questions per goal to personalize deeply
- C) Have a full 5-10 minute conversation to deeply understand the user
- D) Depends on motivation tier — low gets fast start, high gets deep conversation

**Your Answer:** `[OPEN]`

**Recommendation: B) Ask 2-3 follow-up questions per goal.**

**Rationale:** The current codebase supports both "Quick" (30 min) and "Deep" (2-3 hour) assessment modes. Neither extreme is right for onboarding.

B is the sweet spot: personal enough to generate a meaningful plan, fast enough to not lose the user. 3 questions per chosen domain × 1-2 domains = 3-6 questions total = ~90 seconds. That's enough for the conversation insight extractor to capture initial goals, preferences, and constraints.

Deep assessment should be something SIA offers after the user has been active for a week: "I know you much better now. Want to do a deeper life assessment so I can give you truly personalized coaching?"

---

### 3.6 How do you handle the "I just want to try it" user?
- A) Force minimum onboarding (1-2 questions, then let them in)
- B) Let them skip entirely and explore, prompt for onboarding later
- C) Give a 'guest mode' preview with sample data
- D) SIA says "No worries, let's just start. Tell me one thing on your mind"

**Your Answer:** `[OPEN]`

**Recommendation: D) SIA says "No worries, let's just start. Tell me one thing on your mind."**

This is the most Balencia-native option. SIA IS the experience. If someone skips structured onboarding, they land in a conversation with SIA who says: "No worries — we can figure things out as we go. Tell me one thing that's on your mind today." From that single response, the conversation insight extractor captures initial context, and SIA can progressively build a profile.

**Minimum gate:** Name + email (for account creation). Everything else is optional.

---

## 4. Navigation & Information Architecture

### 4.1 What are the primary navigation items (max 5)?
"Current app: Sidebar with 30+ items. Old meeting: minimal sidebar, pin system, Explore page."
If the bottom nav (mobile) or sidebar (desktop) shows only 4-5 items, what are they?

**Your Answer:** `[OPEN]`

**Recommendation: 4 items (mobile bottom nav) / 5 items (desktop sidebar):**

**Mobile (bottom nav):**
1. **Today** — Home/daily experience
2. **SIA** — AI coach (chat + voice)
3. **Goals** — Life goals with progress
4. **Me** — Profile, settings, explore

**Desktop (sidebar):**
1. **Today** — Home/daily experience
2. **SIA** — AI coach (chat + voice)
3. **Goals** — Life goals with progress
4. **Explore** — Discover all modules/domains
5. **Me** — Profile, settings, preferences

**Rationale:** Everything else is reachable through SIA ("SIA, show me my finances"), through Goals (each goal links to relevant domain features), or through Explore (full module catalog). The current 30+ sidebar items are the #1 source of overwhelm for the non-technical 90% of users.

---

### 4.2 How do 8 life domains organize in the UI?
"3 pillars (Fitness, Nutrition, Wellbeing) are the DATA FOUNDATION. Life Goals are the USER-FACING LAYER."
- A) Goal-centric: Users see goals, each links to relevant domain features. Domains are invisible.
- B) Domain tabs: Each life area has its own tab/section
- C) AI-organized: SIA decides what to show based on time of day, user state, active goals
- D) Hybrid: Goals are primary, users can drill into domain dashboards from Explore
- E) Something else

**Your Answer:** `[OPEN]`

**Recommendation: D) Hybrid — goals are primary, domain dashboards available from Explore.**

**Rationale:** The codebase has 10 life domains (Fitness, Nutrition, Mindfulness, Career, Finances, Relationships, Spirituality, Education, Creativity, Habits), each with dedicated gradient colors and suggestion examples. These are valuable but shouldn't be the primary navigation.

Users think in goals ("get fit," "save money," "be a better Muslim"), not domains. Goals are the user-facing layer. Each goal card shows which domains it touches (via colored domain tags). Users who want to drill deeper into a domain can find dashboards in Explore.

SIA also personalizes what appears on the Today screen based on time of day, active goals, and user state — so there's a natural AI-organization layer underneath.

---

### 4.3 Pin-to-sidebar system — still want it?
"Old meeting decision D4: Users pin favorite modules from Explore page to sidebar."
If yes: what's the default set of pinned items? How many pins max?

**Your Answer:** `[OPEN]`

**Recommendation: Yes, but desktop only. Max 5 pins.**

On mobile, the bottom nav is fixed at 4 items — no pins needed. On desktop, the sidebar can accommodate user-pinned modules below the primary 5 items.

**Default pins (based on user's chosen domains during onboarding):**
- If user chose Fitness → pin Workouts
- If user chose Nutrition → pin Meal Plan
- If user chose Wellbeing → pin Journal
- If user chose Spirituality → pin Prayer Times
- If user chose Finance → pin Money Map

**Max 5 pins** to prevent sidebar creep back toward 30+ items.

---

### 4.4 The Explore page — what does it look like?
- A) Grid of module cards with domain-colored icons and descriptions
- B) Categorized by life domain (Career section, Finance section, etc.)
- C) AI-curated: 'Recommended for you' based on goals, with full catalog below
- D) Something else

**Your Answer:** `[OPEN]`

**Recommendation: C) AI-curated recommendations first, full catalog below.**

**Layout:**
1. **Top section:** "Recommended for you" — 3-4 module cards SIA thinks are relevant based on goals, recent activity, and gaps. E.g., if user has a finance goal but hasn't explored the Money Map, it surfaces here.
2. **Below:** Full catalog organized by life domain (colored section headers), with each module as a card showing: icon, name, 1-line description, domain color accent.
3. **Search bar** at top for direct lookup.

---

### 4.5 How does navigation differ between mobile and desktop?
Should they show the same items? Does the mobile bottom bar adapt based on user's active goals?

**Your Answer:** `[OPEN]`

**Recommendation:**

- **Mobile:** Fixed 4-item bottom nav (Today, SIA, Goals, Me). Does NOT adapt — consistency builds muscle memory. Adaptive nav is confusing.
- **Desktop:** Collapsible left sidebar with 5 primary items + user-pinned modules + Explore link. More space = more persistent navigation.
- **Both:** SIA is the universal navigation fallback. "SIA, take me to my meal plan" works everywhere.

---

### 4.6 Where does the admin panel live?
Current: /admin with 19+ sub-routes. Completely separate layout, section within settings, or role-based toggle?

**Your Answer:** `[OPEN]`

**Recommendation: Completely separate layout at /admin, role-gated.**

**Codebase evidence:** The admin panel already has 19+ sub-routes covering users, subscriptions (7 sub-routes), content management, community moderation, competitions, analytics, roles, and admin tools. This is a substantial operational tool.

It should remain a completely separate layout — different sidebar, different header, different information density (admin needs data tables, not cards). Visible only to admin/super-admin roles. A small "Admin" link in the user's profile/settings dropdown, not in the main navigation.

---

## 5. Home Screen / Daily Experience

### 5.1 What IS the home screen?
"Old meeting Q4: If SIA is primary, what is the dashboard?"
"AI-first means the home experience is suggestion-driven, not log-driven."
- A) SIA IS the home screen — you open the app to a conversation
- B) A 'Today' view: SIA's greeting, AI-suggested actions, key metrics, quick actions
- C) A full dashboard with KPI cards/charts — but not the default landing
- D) Personalized: users choose what widgets/cards appear on their home

**Your Answer:** `[OPEN]`

**Recommendation: B) A 'Today' view — SIA's greeting + AI-suggested actions + key context.**

**Rationale:** A is too aggressive — not every app open should feel like starting a conversation. C is the current state and it's too dense for 90% of users. D adds configuration complexity.

B is the sweet spot: The Today screen is SIA-curated but not a full chat. It feels like a personal briefing. SIA's greeting at top, 2-3 suggested actions, one cross-domain insight, and quick-access cards. If the user wants to go deeper, they tap into SIA chat.

**Think:** Morning briefing from a personal assistant, not a dashboard full of charts.

---

### 5.2 What are the top 5 things visible on the home/today screen?

**Your Answer:** `[OPEN]`

**Recommendation (in order of visual priority):**

1. **SIA's greeting / proactive message of the day** — Personalized, warm, includes one insight. "Good morning, Amira. Your recovery is strong today — great day for that workout you postponed."
2. **Today's AI-suggested actions (across all life domains)** — 2-4 cards, domain-colored, tappable. "30 min strength workout" (🔵 Fitness), "Log lunch" (🟢 Nutrition), "10 min Quran reading" (🟣 Spirituality).
3. **Active life goals with progress** — Compact horizontal scroll of goal cards with progress rings.
4. **Quick check-in prompt** — "How are you feeling?" with mood/energy quick-tap options (feeds into emotion detection and daily analysis).
5. **Cross-domain insight** — "Insight of the day" card when one exists: "This week: your mood was 40% higher on days you prayed all 5 prayers."

**Not on home by default:** Streak counter (visible but not prominent), schedule/calendar (accessible but not primary), community, weather.

---

### 5.3 How much data density is appropriate?
"So many numbers scare people away."
"Depends on motivation tier — low gets minimal, high gets detailed."
- A) Minimal — one or two key numbers, mostly conversational
- B) Moderate — 4-6 cards, one visual, a schedule preview
- C) Dense — multi-section with charts, tables, feeds
- D) Adaptive — density changes based on motivation tier

**Your Answer:** `[OPEN]`

**Recommendation: D) Adaptive — density changes based on motivation tier.**

**Codebase evidence:** The motivation tier system (low/medium/high) is already built with engagement scoring across 5 components (login frequency, suggestion accept rate, task completion, session depth, streak consistency). The tier already drives proactive message frequency and coaching tone.

**Implementation:**
- **Low tier:** Minimal — SIA's greeting, 1-2 actions, one insight. Almost entirely conversational. No charts.
- **Medium tier:** Moderate — SIA's greeting, 3-4 actions, goal progress cards, one insight, quick check-in.
- **High tier:** Dense — Everything above + health score, WHOOP metrics, schedule preview, streak stats. Option to expand into full dashboard view.

The transition should be automatic as user engagement changes, with SIA acknowledging it: "I'm showing you more detail now because you've been really engaged this week."

---

### 5.4 Should there be a daily check-in?
- A) Yes — quick mood/energy/intention check before they see anything else
- B) Yes, but part of SIA's greeting — conversational, not a form
- C) No mandatory check-in — SIA might ask naturally
- D) Optional: user enables/disables daily check-in in preferences

**Your Answer:** `[OPEN]`

**Recommendation: B) Part of SIA's greeting — conversational, not a form.**

**Codebase evidence:** The app already has emotional check-in with camera emotion detection, mood tracking (journal entries with sentiment analysis), stress monitoring, and energy level assessment. The daily analysis service computes mood, stress, and hydration daily.

A mandatory form feels like a chore. Instead, SIA's morning greeting includes a natural check-in: "Morning! How are you feeling today?" with quick-tap mood options (great / good / okay / rough) embedded in the greeting card. One tap, done. If the user ignores it, SIA still functions — she just has less data for that day.

---

### 5.5 How do cross-domain connections surface on the home screen?
- A) An 'Insight of the day' card with a cross-domain observation
- B) Visual connection lines between goal cards
- C) SIA mentions it in the greeting
- D) A dedicated 'Connections' section or widget
- E) Subtly woven in — domain-colored tags on action items

**Your Answer:** `[OPEN]`

**Recommendation: A + C + E — layered approach.**

- **A) Insight of the day card** — When the cross-pillar intelligence engine or daily analysis has a high-confidence cross-domain observation, it renders as a visually distinct card. Not every day — only when there's a real insight.
- **C) SIA mentions it in the greeting** — "Your sleep has been 20% better this week — and I noticed it started when you resumed evening prayer. Connection?"
- **E) Domain-colored tags on action items** — Every action card shows which domain(s) it touches via small colored dots. Users start to see how their actions span multiple life areas.

B (connection lines) is visually cool but hard to make readable on mobile. D (dedicated section) fragments the experience.

---

## 6. Life Domains & Feature Organization

### 6.1 How do the 8 life domains present themselves in the UI?
- A) Invisible infrastructure: Users never see 'domains' — only goals and daily actions
- B) Colored tags: Each domain has a color, actions and insights are tagged
- C) Domain dashboards: Each domain has its own dashboard from Explore
- D) Life wheel: A visual wheel/radar showing all domains with progress
- E) A combination — describe:

**Your Answer:** `[OPEN]`

**Recommendation: E) Combination of B + C + D.**

- **B) Colored tags everywhere** — Every action, insight, and goal shows domain colors. Users learn the color language naturally. (Already defined in codebase: Fitness=cyan-teal, Nutrition=emerald, Career=sky-blue, Finance=lime, Spirituality=indigo-purple, etc.)
- **C) Domain dashboards in Explore** — Each domain has a dedicated dashboard accessible from the Explore page for users who want to drill deep.
- **D) Life wheel on Goals page** — A radar/wheel chart showing all active domains with progress scores. This is the "holistic view" that makes users feel like they're managing their whole life system.

Domains are visible but not the primary navigation. They're the color-coded connective tissue of the UI.

---

### 6.2 The AI-first interaction pattern — does it apply to ALL domains?
"Universal pattern: AI suggests → user reviews → accepts/edits/skips → AI learns."

**Your Answer:** `[OPEN]`

**Recommendation: Yes, but with varying AI-to-user control ratios:**

- **AI-heavy (SIA drives 80%):** Workout plans, meal suggestions, daily schedule, learning recommendations. These are areas where most users benefit from structure and guidance.
- **Balanced (SIA drives 50%):** Budget advice, journal prompts, habit suggestions, career actions. Users have stronger opinions here — SIA suggests, user steers.
- **User-heavy (SIA drives 20%):** Spirituality/prayer practice, relationship actions, creative pursuits. These are deeply personal — SIA reminds and encourages but doesn't prescribe. "It's Dhuhr time" is helpful; "You should pray this way" is not.

The conversation insight extractor learns which domains the user wants more or less AI involvement in, and adapts over time.

---

### 6.3 Per-domain design intent

**Your Answer:** `[OPEN]`

- **Fitness & Movement:** SIA generates workout plans tailored to your recovery (WHOOP data), goals, and equipment. You review, tweak, and start — with real-time tracking. Feels like having a personal trainer who checks in daily.
- **Nutrition & Diet:** AI-generated meal plans that respect your dietary preferences, budget, and goals. Quick meal logging with photo recognition. Weekly shopping lists. Not a calorie-counting app — a coach that helps you eat well for your life.
- **Mental Health & Wellbeing:** Voice journaling (low-friction), mood tracking via quick check-ins, guided breathing exercises. SIA detects emotional patterns and surfaces them gently. Crisis resources available when emotion detection flags distress.
- **Finance & Money:** Goal-oriented financial tracking ("Save $5K for Hajj by December"). SIA monitors spending patterns and connects them to other life areas. Not a full budgeting app — a coach that makes you aware of your financial habits.
- **Career & Work:** Goal decomposition for career ambitions. SIA suggests daily actions, tracks progress, and connects career stress to health patterns. Integrates with Google Calendar for schedule awareness.
- **Relationships:** Accountability check-ins and reminders for relationship goals ("Call mom weekly," "Date night every Thursday"). SIA nudges gently — this domain is high-sensitivity, low-prescription.
- **Spirituality & Religion:** Prayer time reminders, Quran reading tracking, Ramadan planning, spiritual practice streaks. SIA is respectful and supportive — "It's Asr time" not "You should pray." Expandable to other faith traditions.
- **Learning & Growth:** Book tracking, course progress, learning goals with daily time blocks. SIA connects learning activities to career goals and personal growth.
- **Creativity:** Writing prompts, creative project tracking, idea capture. Lightweight — this domain gets fuller treatment in later versions.

---

### 6.4 Custom life domains — how does a user add one?
- A) User types domain name, AI auto-generates tracking suggestions and metrics
- B) User picks from 20+ pre-built domains, 'Custom' is last resort
- C) User just sets a goal — the AI figures out which domain it belongs to

**Your Answer:** `[OPEN]`

**Recommendation: C) User just sets a goal — the AI figures out which domain it belongs to.**

Users don't think in "domains" — they think in goals. "I want to learn Arabic," "I want to run a marathon," "I want to fix my marriage." SIA maps goals to domains automatically and can create custom domains when a goal doesn't fit existing ones: "That doesn't fit neatly into my existing categories — let me create a 'Language Learning' area for you."

---

### 6.5 Which domains are v1 priority vs later?
Rank each domain: Full / Moderate / Light / Later

**Your Answer:** `[OPEN]`

**Recommendation (based on codebase maturity and core value proposition):**

| Domain | Priority | Rationale |
|--------|----------|-----------|
| Fitness & Movement | **Full** | Deepest codebase (1500+ exercise library, WHOOP integration, workout plans, progress tracking) |
| Nutrition & Diet | **Full** | Deep codebase (meal plans, recipes, macro tracking, shopping lists, diet plans) |
| Mental Health & Wellbeing | **Full** | Deep codebase (10+ sub-modules: journal, mood, stress, energy, breathing, emotion detection) |
| Spirituality & Religion | **Moderate** | Core to primary persona. Prayer times, reading tracking, Ramadan features. SIA handles depth. |
| Finance & Money | **Moderate** | Money Map exists but is newer. Goal-oriented tracking + AI insights. Not full budgeting. |
| Career & Work | **Light** | Goal tracking + Google Calendar integration. SIA provides coaching. No standalone career dashboard needed. |
| Relationships | **Light** | Accountability reminders + SIA coaching. Minimal standalone UI needed. |
| Learning & Growth | **Light** | Goal tracking + daily actions. SIA delivers content recommendations. |
| Creativity | **Later** | Lowest demand from primary persona. SIA can handle ad-hoc creative prompts. |

---

### 6.6 Cross-domain intelligence — how are connections shown?
- A) SIA tells them in conversation
- B) A dedicated 'Insights' or 'Connections' screen with visualizations
- C) The Knowledge Graph — interactive visualization
- D) Cards on the home screen: 'Connection spotted' with a visual
- E) All of the above, in different contexts

**Your Answer:** `[OPEN]`

**Recommendation: E) All of the above, in different contexts.**

- **A) SIA in conversation** — Primary delivery method. Most personal, most contextual.
- **B) Dedicated insights screen** — Weekly/monthly view of all discovered connections. Good for reflection.
- **C) Knowledge Graph** — Power user feature in Explore. Not promoted, but available for those who want it.
- **D) Home screen cards** — When a high-confidence connection is discovered, it surfaces as an insight card.

The 22 cross-pillar rules + daily analysis + conversation insights generate the raw material. The delivery channels spread that material across the appropriate touchpoints.

---

### 6.7 Wellbeing sub-features — consolidate or keep separate?
"Current: 10+ sub-modules under Wellbeing (journal, mood, stress, energy, breathing, etc.)"
- A) Remain as separate screens/modules accessible from Explore
- B) Consolidate into 2-3 screens (Mind, Habits, Mindfulness)
- C) Become SIA-invoked features — no standalone screens
- D) Mix: core ones get standalone screens; rest are SIA-invoked

**Your Answer:** `[OPEN]`

**Recommendation: D) Mix — core standalone, rest SIA-invoked.**

**Standalone screens (in Explore):**
- **Journal** — Users actively choose to journal. Needs a dedicated writing/voice space.
- **Mood & Energy Dashboard** — Shows trends, history, patterns. Users reference this.
- **Habits Tracker** — Daily habit checklist with streaks.

**SIA-invoked (no standalone screen):**
- Breathing exercises (SIA says "Let's do a 2-minute breathing exercise" → inline in chat)
- Stress assessment (SIA initiates when emotion detection flags stress)
- Energy check-in (part of daily check-in, not standalone)
- Yoga sessions (SIA recommends based on recovery/stress)
- Soundscapes (if kept — SIA suggests based on mood)

---

### 6.8 Finance depth — how much of a finance app is this?
- A) A full finance dashboard (like Mint/YNAB) embedded in the life system
- B) Goal-oriented finance tracking tied to life goals, but not full budgeting
- C) Light: AI monitors spending patterns and flags insights only
- D) Depends on user's plan/subscription

**Your Answer:** `[OPEN]`

**Recommendation: B) Goal-oriented finance tracking tied to life goals.**

Balencia is a life coach, not a finance app. Full budgeting (A) is a massive product in itself and distracts from the core value proposition. Light monitoring (C) is too thin to be valuable.

B is the sweet spot: Users set financial goals ("Save $5K for Hajj," "Pay off credit card by December"), track progress, and SIA connects financial behavior to other life domains ("Your spending increases 30% during high-stress weeks — let's address the stress, not just the budget"). The Money Map feature in the codebase supports this level.

---

### 6.9 Spirituality & religion — how explicitly religious vs spiritual?
- A) Explicitly multi-faith: prayer tracking for Islam, Christianity, Judaism, etc.
- B) Spiritually agnostic: 'spiritual practice' that works for any faith or secular
- C) Start with Islamic features as primary, expand later
- D) Let the AI handle it — user states goals, SIA adapts without religion-specific UI

**Your Answer:** `[OPEN — needs Salman's decision]`

**Recommendation: C) Start with Islamic features as primary, expand later.**

**Rationale:** The primary persona (Amira) is Muslim. The existing user base likely skews Muslim (mentioned in the questionnaire: "wanting to be a better Muslim," Ramadan references, Quran reading, prayer tracking). Building genuinely good Islamic features first (prayer time integration, Quran tracking, Ramadan mode, Islamic calendar awareness) is more valuable than a generic "spiritual practice" that doesn't deeply serve anyone.

The backend can be designed to be faith-extensible — prayer tracking abstracts to "spiritual practice tracking," but the UI labels and defaults start Islamic. SIA adapts language per user preference.

---

### 6.10 What existing features should be REMOVED from the app?

**Your Answer:** `[OPEN]`

**Recommendation:**

**Cut entirely:**
- **HIPAA page** — Legal compliance page, not a user feature. Move to legal footer link.
- **Careers page** — This is a marketing/hiring page, not an app feature. Move to marketing site.
- **Blogs (in-app)** — SIA delivers relevant content contextually. Blog content moves to marketing site for SEO. If a blog post is relevant, SIA links to it.
- **Webinars (in-app)** — Cut for v1. Not core to the AI coach experience.

**Deprioritize (hide, don't delete):**
- **Knowledge Graph** — Move to power-user section in Explore. Don't promote.
- **Competitions** — Deprioritize until core AI coach is solid. Keep backend.
- **Leaderboard** — Deprioritize. Opt-in only if kept.
- **Soundscapes/Music Player** — SIA-invoked only (no standalone screen). Or rely on Spotify integration.
- **Yoga Library** — SIA recommends specific sessions rather than a browsable library.
- **Vision Board** — Interesting but niche. Later version.

**Keep but simplify:**
- **Quick Notes** — Merge into Journal as quick capture mode.
- **Voice Calls** — Keep as voice mode within unified SIA experience.
- **Money Map** — Keep as goal-oriented finance tracking (per 6.8).

---

## 7. Goals & Plans System

### 7.1 Goal decomposition — how much does the user see?
"AI decomposes any goal into daily actions, tracking signals, milestones."
- A) Just the daily actions
- B) The full decomposition
- C) Summary with expandable detail
- D) Depends on motivation tier

**Your Answer:** `[OPEN]`

**Recommendation: C) Summary with expandable detail, influenced by motivation tier.**

Default view: "7 actions across 3 life areas this week" with a progress ring. Tap to see the full breakdown: milestones, domain mapping, reasoning, timeline.

Motivation tier influence:
- **Low:** Shows only today's 2-3 actions. Expandable to weekly.
- **Medium:** Shows this week's actions + next milestone. Expandable to full plan.
- **High:** Shows full plan with all milestones, domain breakdown, and reasoning.

---

### 7.2 What do life goal cards look like?
Pick the essential elements for a goal card.

**Your Answer:** `[OPEN]`

**Recommendation — essential elements for a goal card:**

1. **Progress ring/bar** — Visual progress at a glance (mandatory)
2. **Connected domain colors/icons** — Shows which life areas this goal spans (mandatory — this IS the differentiator)
3. **Next action due** — What to do next, tappable (mandatory)
4. **AI coaching note** — One-line from SIA: "Strong momentum this week!" or "Let's get back on track" (mandatory)

**Optional / secondary:**
5. Current streak (if applicable)
6. Time since last activity (only if stalled)

**Not on the card:** Motivation tier badge (internal signal, not user-facing). Full milestone list (expandable detail).

---

### 7.3 Motivation tiers — how do they manifest in the UI?
- A) Low-motivation users see simpler UI; high-motivation sees dense dashboards
- B) No visible change — AI's suggestions/tone change, UI layout stays same
- C) Subtle: same layout, but number of cards/actions shown adapts
- D) User chooses view density independently of motivation tier

**Your Answer:** `[OPEN]`

**Recommendation: C) Subtle — same layout, content density adapts.**

The layout (components, positions, visual hierarchy) stays the same across tiers. What changes:
- **Number of action cards shown** (low: 2-3, medium: 4-5, high: 6+)
- **Data depth** (low: no charts, medium: one chart, high: multiple charts)
- **SIA's tone and length** (low: short and encouraging, high: detailed and analytical)
- **Gamification intensity** (low: celebrate everything, high: focus on metrics)

Users shouldn't feel like they're using a "lesser" version of the app. They should feel like SIA is calibrated to them personally.

---

### 7.4 Progress visualization — per-goal, per-domain, or unified?
- A) Per-goal progress bars/rings
- B) Per-domain scores
- C) Unified 'Life Score'
- D) A life wheel/radar chart showing all domains
- E) Multiple views available

**Your Answer:** `[OPEN]`

**Recommendation: E) Multiple views available.**

- **Default view (Goals page):** Per-goal progress rings (A) — most actionable.
- **Life Areas view:** Life wheel/radar chart (D) — the holistic "Balencia sees everything" visualization.
- **Domain drill-down:** Per-domain scores (B) — when viewing a specific domain dashboard.
- **No unified Life Score (C)** — A single number oversimplifies and can be demotivating if it dips. The life wheel communicates the same information with more nuance.

---

### 7.5 Milestones & celebrations — how big is the moment?
- A) Full-screen celebration with animation, confetti, SIA congratulations
- B) A toast/banner notification
- C) SIA brings it up naturally
- D) Depends on milestone size
- E) Adapted by motivation tier

**Your Answer:** `[OPEN]`

**Recommendation: D + E — size-dependent AND tier-adapted.**

| Milestone size | Low motivation | Medium | High |
|---------------|---------------|--------|------|
| Micro (daily action done) | Animation + SIA praise | Quick acknowledgment | Silent tracking |
| Medium (weekly goal, streak milestone) | Celebration card + SIA message | Toast + SIA message | Toast |
| Major (goal completed, 30-day streak) | Full-screen celebration | Full-screen celebration | SIA congratulations + data summary |

Low-motivation users need every win celebrated. High-motivation users would find that patronizing — they want data and progress, not confetti.

---

## 8. Knowledge System & Intelligence

### 8.1 Knowledge Graph — user-facing or behind the scenes?
- A) User-facing: visual graph users interact with
- B) Behind the scenes: exists for AI intelligence, users see outputs
- C) Power-user feature: available for those who want it
- D) Showcase feature: shown during onboarding, then lives in Explore

**Your Answer:** `[OPEN]`

**Recommendation: C) Power-user feature in Explore.**

The Knowledge Graph (node types: users, goals, habits, activities, exercises, foods, metrics, conditions; edge types: causes, prevents, supports, conflicts_with, tracks, measures, enables, blocks) is technically impressive but visually complex. Most users won't understand or use an interactive graph. It should be available in Explore for users who want to see how their life data connects, but it should NOT be promoted or required.

The real value of the Knowledge Graph is what it enables — SIA's cross-domain insights. Users experience the graph through SIA, not through the visualization.

---

### 8.2 Personal Wiki — visible to the user?
- A) Yes — a 'My Life Wiki' to browse
- B) No — it's SIA's memory
- C) Partially — users see key facts but not the full wiki

**Your Answer:** `[OPEN]`

**Recommendation: C) Partially visible — "What SIA knows about me" view.**

**Codebase evidence:** The wiki system has page types (learned_rule, preference, pattern, context, feedback), version control, confidence scores, and evidence counts. It's rich but technical.

Users should see a simplified "What SIA knows about me" page showing key facts, preferences, and patterns — without the full wiki structure. E.g., "Prefers morning workouts," "Recovers better with 8h sleep," "Energy dips on Tuesdays." Each item has a delete button (privacy control) and a "This is wrong" button (feeds back to memory engine as `processUserFeedback('reject')`).

---

### 8.3 Cross-domain insights — how are they delivered?
- A) Dedicated 'Insights' feed/page
- B) SIA mentions them in conversation
- C) Home screen cards
- D) Weekly digest
- E) All of the above, in different contexts

**Your Answer:** `[OPEN]`

**Recommendation: E) All of the above.**

Same answer as 6.6. Cross-domain insights are the core product — they should appear everywhere, in the appropriate format for each context:
- **SIA conversation** — Richest, most contextual delivery
- **Home screen card** — Daily highlight
- **Weekly digest** — Reflection and patterns (already built as `weekly_digest` proactive message type)
- **Insights page** — Historical archive for users who want to review past discoveries

---

### 8.4 Memory transparency — should users see what SIA remembers?
- A) See all stored memories with ability to delete
- B) See memory referenced inline but not browse all
- C) Not see the memory system at all
- D) Privacy control: user manages a 'memory vault'

**Your Answer:** `[OPEN]`

**Recommendation: A) Full transparency with delete control.**

**Codebase evidence:** The memory engine stores memories with types (pattern, preference, context, feedback, relationship, learned_rule), categories (fitness, nutrition, sleep, wellbeing, lifestyle, behavioral, cross_domain), confidence scores, and evidence items. It already supports `processUserFeedback()` with verify, reject, correct, and dismiss actions.

Users should have a "What SIA remembers" page where they can:
- Browse all active memories (grouped by category)
- See the confidence score (as a simple indicator, not a number)
- Delete any memory
- Correct a memory ("Actually, I don't prefer morning workouts anymore")
- Verify a memory ("Yes, this is right")

This builds trust. If users can't see or control what the AI knows, they'll assume the worst. Transparency is a feature, not a risk.

---

## 9. Social & Community

### 9.1 How prominent should social features be?
- A) Core: social is central
- B) Optional add-on
- C) Minimal for v1
- D) None for v1

**Your Answer:** `[OPEN]`

**Recommendation: C) Minimal for v1 — basic accountability, no feed or leaderboard.**

**Rationale:** Balencia's differentiator is the AI coach, not community. Social features done poorly are worse than no social features. For v1, focus entirely on making the SIA + personal coaching experience exceptional.

**What minimal looks like:**
- Invite an accountability partner (shared goal progress, SIA nudges both)
- No feed, no public profiles, no content creation
- Community can be added as a v2 feature once the core loop is proven

---

### 9.2 Leaderboard — motivating or anxiety-inducing?
- A) Keep and make prominent
- B) Keep but opt-in only
- C) Replace with non-competitive comparisons
- D) Remove for v1

**Your Answer:** `[OPEN]`

**Recommendation: D) Remove for v1.**

Leaderboards work for single-dimension apps (Duolingo: language learning). Balencia is multi-domain — what does "winning" even mean? A leaderboard that ranks sleep vs. prayer vs. finance is nonsensical and potentially harmful (promotes optimizing for points over genuine life improvement).

If competitive elements return in v2, they should be domain-specific, opt-in, and friend-group-only.

---

### 9.3 Competitions & shared challenges — keep for v1?
- A) Keep and polish
- B) Simplify to shared challenges
- C) Deprioritize
- D) Remove entirely

**Your Answer:** `[OPEN]`

**Recommendation: C) Deprioritize — build after core AI coach is solid.**

The competition system in the codebase is sophisticated (AI-generated + admin-created, anti-cheat, team competitions, scoring mapping). It's good engineering. But it's not the core product for v1. Keep the backend intact, remove from primary navigation, and reintroduce when the personal AI coaching loop is proven and users are asking for social features.

---

### 9.4 Accountability — AI-driven or social?
- A) AI-driven: SIA is your accountability partner
- B) Social: invite a friend
- C) Both
- D) Neither

**Your Answer:** `[OPEN]`

**Recommendation: A) AI-driven for v1, with C) Both as the v2 target.**

SIA already has the accountability infrastructure: commitment follow-ups, streak risk alerts, plan non-adherence messages, goal stalled notifications. She's a tireless accountability partner.

Social accountability (inviting a friend) adds complexity (notifications, privacy, shared views) that should be a v2 feature.

---

## 10. Gamification & Motivation

### 10.1 How prominent are streaks?
- A) Duolingo-prominent
- B) Present but not central
- C) Subtle
- D) Per-domain streaks

**Your Answer:** `[OPEN]`

**Recommendation: B) Present but not central, with per-domain streaks available.**

**Codebase evidence:** The streak system is mature — single master streak fed by any qualifying activity, streak freezes (earned through milestones), tier progression with badges, leap probability, and a calendar heatmap.

Streaks should be visible on the home screen (small counter in the greeting area) and celebrated at milestones, but they shouldn't be THE motivation. "Balencia sees what you can't see" is the value proposition, not "maintain your streak."

Per-domain streaks (fitness, journaling, prayer) should be available in each domain's dashboard for users who want them, but the home screen shows one master streak.

---

### 10.2 Achievement system — how does it work across all life domains?

**Your Answer:** `[OPEN]`

**Recommendation: Both cross-domain AND domain-specific achievements.**

**Cross-domain achievements (unique to Balencia):**
- "Life Connector: Connected 3+ life areas this week"
- "Life Balanced: All active domains above 50%"
- "Pattern Spotter: Acknowledged 5 cross-domain insights"

**Domain-specific achievements:**
- "30-Day Prayer Streak" (Spirituality)
- "Saved $500 Toward Your Goal" (Finance)
- "Marathon Ready: Completed 12-week running plan" (Fitness)

**Cross-domain achievements should be more celebrated** — they're the unique value proposition. Domain-specific achievements are standard gamification.

---

### 10.3 Micro-wins — surface them or let them accumulate?
- A) Celebrate immediately
- B) Batch them
- C) SIA acknowledges naturally
- D) Adapted by motivation tier

**Your Answer:** `[OPEN]`

**Recommendation: D) Adapted by motivation tier.**

- **Low motivation:** Celebrate immediately. Every completed action gets a small animation and encouraging message. These users need to feel progress constantly.
- **Medium:** SIA acknowledges naturally in conversation: "Nice, that's 3 actions done today — strong start."
- **High:** Batch them. End of day: "7 wins today across 4 life areas." High-motivation users don't want constant interruptions.

---

### 10.4 Does gamification intensity adapt by motivation tier?
"Low motivation: Heavy. Every tiny win celebrated. XP for logging in. | High motivation: Light. Focus on metrics."

**Your Answer:** `[OPEN]`

**Recommendation: Yes — confirmed.**

This is one of Balencia's most thoughtful design decisions. The existing motivation tier system (computed from engagement scoring across 5 components) should directly drive gamification intensity:

- **Low:** Heavy gamification. Every small win celebrated. XP visible. Streak prominent. This tier needs external motivation.
- **Medium:** Moderate gamification. Meaningful milestones celebrated. Streaks visible. XP background.
- **High:** Light gamification. Focus on data, metrics, and progress charts. Celebrations are brief. This tier is self-motivated.

The transition between tiers should be gradual, not sudden. SIA can acknowledge it: "You've been incredibly consistent lately — I'm going to focus less on celebration and more on the data you care about."

---

## 11. Subscription & Monetization

### 11.1 Free vs paid — what can free users access?

**Your Answer:** `[OPEN — needs business decision]`

**Recommendation:**

**Free tier includes:**
- Chat with SIA: 10 messages/day (enough to experience the value, creates desire for more)
- Home/Today screen: Full access
- Track goals in 2 life domains
- Basic features: Journal (text only, no voice), mood tracking, basic habit tracking
- One cross-domain insight per week (enough to show the "sees what you can't see" value)

**Paid tier adds:**
- Unlimited SIA conversations
- Voice mode (calls + voice journaling)
- All 10 life domains
- Full cross-domain intelligence
- WHOOP/Spotify/Calendar integrations
- Detailed analytics and progress charts
- Proactive messaging (SIA initiates)
- Knowledge Graph access
- Priority AI processing

**Key principle:** The free tier should deliver enough cross-domain intelligence to prove the concept. If users get one "holy shit, how did it know that?" moment per week for free, they'll upgrade.

---

### 11.2 Subscription model — tiered plans or modular?
- A) Pre-built tiers (Basic/Pro/Premium)
- B) Modular by life domain
- C) Both
- D) Usage-based

**Your Answer:** `[OPEN]`

**Recommendation: A) Pre-built tiers — simple, clear.**

**Rationale:** Modular pricing (B) creates decision paralysis and doesn't match the cross-domain value proposition. If the product's value is connecting life domains, letting users buy domains individually undermines the core promise.

**Suggested tiers:**
- **Free** — 2 domains, limited SIA, basic tracking
- **Pro** ($9.99/mo) — All domains, unlimited SIA, voice, integrations, full intelligence
- **Premium** ($19.99/mo) — Pro + priority AI, family sharing, premium content, white-glove onboarding

Two paid tiers max. Three is confusing.

---

### 11.3 How do you handle "locked" features?
- A) Blurred preview with upgrade prompt
- B) Don't show it at all
- C) One free trial, then lock
- D) Grayed out with lock icon
- E) SIA mentions it naturally

**Your Answer:** `[OPEN]`

**Recommendation: E + D — SIA mentions naturally + lock icon as fallback.**

**Primary:** SIA is the sales channel. When a free user would benefit from a paid feature, SIA says: "I noticed a strong connection between your sleep and finances this week — with Pro, I can track these patterns automatically and alert you in real-time." This is consultative selling, not gatekeeping.

**Fallback:** If the user navigates to a paid feature directly (e.g., via Explore), show the screen with a lock icon and a clear, one-line explanation of what it does + upgrade CTA. Don't blur — blurring teases and frustrates.

Never hide features entirely (B) — users should know what's possible to build desire.

---

### 11.4 AI usage limits — credit system?
"Discussed credit-based system, ~10 min sessions, ~$5/user/month AI cost target."
- A) Unlimited within plan
- B) Credit/token system visible to user
- C) Soft daily limit
- D) Tiered: free gets X messages/day, paid gets unlimited

**Your Answer:** `[OPEN]`

**Recommendation: D) Tiered — free gets X messages/day, paid gets unlimited.**

- **Free:** 10 messages/day with SIA. Enough for a meaningful daily interaction. Counter shown subtly: "7 messages remaining today."
- **Paid:** Unlimited. No visible limits, no credits, no tokens. Users shouldn't feel metered.

**Why not credits (B):** Credit systems add cognitive load ("Should I use a credit for this question?") that undermines the conversational relationship with SIA. You don't count minutes with your life coach.

**Cost management (backend):** Use the model factory's tier system — nano models for classification/routing, light models for simple responses, default models for coaching, reasoning models only when needed. The cascading provider chain (Gemini → OpenAI → Anthropic) with rate limiting already manages costs.

---

## 12. Visual & Emotional Design

### 12.1 Dark mode is primary — how dark?
"Brand spec: ink-900 #0A0A0F primary background."
- A) Near-black everywhere — premium, cinematic
- B) Warmer dark with brown undertones
- C) Mix: pure dark for backgrounds, warm dark for card surfaces

**Your Answer:** `[OPEN]`

**Recommendation: C) Mix — pure dark backgrounds, warm elevated surfaces.**

**Codebase evidence:** Current design tokens show:
- `--yh-canvas: #080C10` (deep background)
- `--yh-surface: #0F1419` (card background)
- `--yh-elevated: #161D26` (elevated elements)

The existing palette is near-black but already uses slightly warmer tones for surface/elevated elements. This is the right approach: pure dark backgrounds create depth and premium feel, while slightly warmer card surfaces feel human and approachable. The domain gradient colors (cyan-teal, emerald, amber, indigo-purple) pop beautifully against near-black.

---

### 12.2 Light mode — how important?
- A) Not needed for v1
- B) Available as toggle, dark is default
- C) Equal priority

**Your Answer:** `[OPEN]`

**Recommendation: B) Available as toggle, dark is default.**

Some users will need light mode (outdoor use, screen sensitivity, personal preference). The codebase already supports light mode theming. But dark is the brand identity — all marketing, screenshots, and demos should use dark mode. Light mode is a support feature, not a design priority.

---

### 12.3 How much animation and motion?
For each area, specify: Cinematic / Polished / Minimal

**Your Answer:** `[OPEN]`

**Recommendation:**

| Area | Level | Rationale |
|------|-------|-----------|
| Landing page (public) | **Cinematic** | First impression. GSAP scroll reveals, particle backgrounds, 3D effects. Already built with Lenis + GSAP + ScrollTrigger. |
| Onboarding | **Polished** | Smooth transitions, spring physics for card interactions, subtle domain color animations. Not cinematic — don't distract from the questions. |
| Home/Dashboard | **Polished** | Smooth card transitions, progress ring animations, subtle parallax. But fast — no delays on daily-use screens. |
| SIA chat | **Minimal** | Chat should be fast and responsive. Subtle typing indicators, smooth message appearance. No flashy animations that slow conversation flow. |
| Feature screens | **Minimal** | Functional. Smooth transitions but no flourish. Users are here to accomplish something. |
| Settings/Profile | **Minimal** | Utility screens. Standard transitions. |
| Celebrations/Achievements | **Cinematic** | This is the moment to shine. Confetti, particle effects, animated badges, SIA congratulations. Make milestone moments feel special. |

---

### 12.4 The continuous stroke line — where does it appear?

**Your Answer:** `[OPEN]`

**Recommendation:**
- **Onboarding** — As the transition element between steps (the line "connects" each life domain as you set them up)
- **SIA's animated icon** — The line forms SIA's visual identity (an abstract, flowing continuous stroke that pulses and moves)
- **Achievement celebrations** — The line traces between domain icons when a cross-domain achievement unlocks
- **Loading states** — Instead of spinners, the line traces a path while content loads

**Not on:** Home screen (too busy), feature screens (distracting), settings (unnecessary).

The line is the visual metaphor for "connecting what you can't see." Use it where that metaphor matters.

---

### 12.5 Photography vs illustration vs abstract?
- A) Warm photography
- B) Custom illustrations
- C) Abstract gradients and shapes
- D) Mix depending on context

**Your Answer:** `[OPEN]`

**Recommendation: D) Mix depending on context.**

- **Landing page / marketing:** Warm photography of real people (diverse, aspirational, not stock-photo-generic)
- **Onboarding:** Custom illustrations (life domain icons, the connecting line, abstract representations of the life system)
- **In-app:** Abstract gradients and shapes (domain-colored gradients, data visualizations, the glassmorphism aesthetic already in the codebase)
- **Empty states:** Custom illustrations (friendly, encouraging)

Photography inside the daily app experience feels heavy and slow to load. Abstract graphics are lightweight and on-brand.

---

### 12.6 Icon style — outlined or filled?
"Brand guidelines: Rounded, 2px stroke, outlined only, 24px minimum."

**Your Answer:** `[OPEN]`

**Recommendation: Outlined default, filled for active/selected states.**

Brand guidelines stand. Outlined icons at 2px stroke for the default state. When an icon represents the currently active section (e.g., active tab in bottom nav), it fills. This creates a clear visual distinction between active and inactive states without needing color changes alone.

---

## 13. Platform & Responsiveness

### 13.1 What is the primary platform?
"Direction Reset: Web-first confirmed. No mobile native app for now."
- A) Mobile-first web
- B) Desktop-first web
- C) Truly equal
- D) Mobile-first, but SIA voice is primary mobile experience while desktop gets full dashboard

**Your Answer:** `[OPEN]`

**Recommendation: D) Mobile-first, with SIA voice as mobile primary + desktop gets full dashboard.**

**Rationale:** The primary persona (Amira) uses her phone for everything. Mobile-first is non-negotiable. But the desktop experience shouldn't be a blown-up phone app — it should take advantage of screen real estate for side panels, data dashboards, and the knowledge graph.

**Mobile experience:** Today screen → SIA (chat + voice) → Goals. Quick, conversational, voice-friendly.
**Desktop experience:** Same core, plus: side panels in SIA chat (context/goals visible alongside conversation), fuller dashboards, knowledge graph visualization, admin panel.

---

### 13.2 Are there features that are mobile-only or desktop-only?

**Your Answer:** `[OPEN]`

**Recommendation:**

**Mobile-optimized (works on desktop but designed for mobile):**
- Voice mode (hold-to-talk, phone-to-ear gestures)
- Quick check-ins (single-tap mood/energy)
- Camera emotion detection
- Push notifications

**Desktop-optimized (works on mobile but designed for desktop):**
- Knowledge Graph visualization
- Admin panel
- Detailed analytics with multiple charts
- Side-by-side SIA chat + context panel

Nothing should be strictly mobile-only or desktop-only. Everything should work on both. But the primary design target differs.

---

### 13.3 Should the mobile experience feel like a native app?

**Your Answer:** `[OPEN]`

**Recommendation: Yes — as native as possible without being a native app.**

- **Bottom tab bar:** Yes (fixed 4-item nav)
- **Swipe gestures:** Yes for navigation (swipe between Today/SIA/Goals tabs)
- **Pull-to-refresh:** Yes for data screens
- **Smooth transitions:** Yes (page transitions that feel native, not web-page-like)
- **PWA support:** Yes (installable, offline-capable for basic features, push notifications)

The codebase already uses Next.js which supports PWA patterns. Framer Motion provides the animation layer for native-feeling transitions. The goal: a user shouldn't be able to tell it's not a native app.

---

## 14. Notifications & Engagement

### 14.1 What are the top 3 notification types?

**Your Answer:** `[OPEN]`

**Recommendation:**

1. **SIA proactive AI insights/suggestions** — The core product. "I noticed a connection between your sleep and stress this week." These drive engagement and demonstrate value.
2. **Streak alerts (about to break)** — High urgency, time-sensitive. "Your 15-day streak ends in 4 hours — log any activity to keep it alive."
3. **Daily check-in prompt** — Consistent touchpoint. "Good morning! Quick check — how are you feeling?" Drives the habit of opening the app daily.

**Runner-up:** Goal progress milestones (celebration moments that drive sharing).

---

### 14.2 Push vs in-app balance?
- A) Most things in-app, push reserved for critical
- B) User configures per category
- C) Adapted by motivation tier
- D) Aggressive push

**Your Answer:** `[OPEN]`

**Recommendation: B + C — user configures per category, with tier-based defaults.**

Default notification settings should vary by motivation tier:
- **Low:** 1 push/day (morning greeting/check-in), rest in-app. Don't overwhelm.
- **Medium:** 2-3 push/day (check-in + 1-2 insights), rest in-app.
- **High:** 3-5 push/day (check-in + insights + accountability nudges).

Users can override any category (the preferences system already exists in the codebase). Communication preferences service is already built with per-category controls.

Never aggressive push (D) — it drives uninstalls.

---

### 14.3 Proactive AI timing — does it adapt?
"Low motivation = max 1/day, gentle. Medium = 2-3/day. High = 5+/day, accountability nudges."

**Your Answer:** `[OPEN]`

**Recommendation: Yes — confirmed, already built.**

**Codebase evidence:** The proactive messaging system already:
- Runs every 3 hours (8 cycles/day)
- Caps at 4 messages/day per user
- Respects user timezone (6am-10pm delivery window)
- Scores all message types per user and picks the top 2-3 per cycle
- Uses engagement patterns + motivation tier for prioritization

The infrastructure is there. The recommendation is to refine the scoring weights so that cross-domain insights are weighted heavily (they're the product differentiator) and routine reminders are weighted lower.

---

## 15. Data, Privacy & Transparency

### 15.1 How transparent should AI data usage be?

**Your Answer:** `[OPEN]`

**Recommendation: "Show me the data" expandable on every SIA insight.**

When SIA says "Your mood is 40% better on days you pray all 5 prayers," users should be able to tap "How does SIA know this?" to see:
- Data sources used (mood logs: 14 entries, prayer tracking: 14 entries)
- Time period analyzed (last 2 weeks)
- Confidence level (high/medium/low)

This builds trust and differentiates Balencia from AI assistants that feel like black boxes. The comprehensive user context service already tracks all data sources — this is a UI presentation layer over existing data.

---

### 15.2 Data export — is this a feature?

**Your Answer:** `[OPEN]`

**Recommendation: Yes — essential for trust and compliance.**

Users should be able to export all their data (goals, activities, journal entries, mood history, financial records, conversation history) in a standard format (JSON + CSV). This is:
- Required for GDPR compliance (if targeting EU users)
- A trust signal ("We don't hold your data hostage")
- A user expectation in 2026

Location: Settings → Privacy → Export My Data.

---

### 15.3 Integration data — how is it presented?

**Your Answer:** `[OPEN]`

**Recommendation: Both — Connected Services dashboard + silently woven into AI.**

**Connected Services page (in Settings):**
- Shows all integrations (WHOOP, Spotify, Google Calendar) with status (connected/disconnected)
- Last sync timestamp
- Connect/disconnect buttons
- Brief description of what data flows in

**In the app:** Integration data is silently woven into SIA's understanding and displayed in relevant contexts (WHOOP recovery score on the home screen, Spotify playlist suggestion during workout, Calendar events in schedule view). Users don't need to know the data source for every insight — but they can always check in Connected Services.

---

## 16. Content & Education

### 16.1 Blogs and articles — part of the app or separate?

**Your Answer:** `[OPEN]`

**Recommendation: Separate — marketing/SEO play on the marketing site.**

Blog content serves SEO and acquisition, not daily in-app experience. When a blog article is relevant to a user's goal, SIA can link to it in conversation: "There's a great article on intermittent fasting during Ramadan that might help."

The in-app admin blog management tools (already built) can continue to power the marketing site content.

---

### 16.2 Webinars — live or on-demand?

**Your Answer:** `[OPEN]`

**Recommendation: Cut for v1.**

Webinars are a community/content play that doesn't align with the AI-first coaching experience. They require significant operational overhead (scheduling, hosting, promotion, recording). Focus on making SIA's coaching excellent first.

If webinars return, they should be recorded library only (on-demand) — live events have low attendance rates and high coordination costs for early-stage products.

---

### 16.3 Help center — standalone or SIA-powered?
- A) Standalone /help page
- B) SIA-powered
- C) Both
- D) Contextual tooltips only

**Your Answer:** `[OPEN]`

**Recommendation: C) Both — traditional help + SIA-powered.**

- **SIA-powered:** "Hey SIA, how do I connect my WHOOP?" SIA answers naturally. This is the primary help channel.
- **Traditional help page:** FAQ + guides for users who prefer self-service or can't chat with SIA (e.g., free tier limit reached). The admin help management system is already built.
- **Product tour:** Contextual tooltips for first-time feature discovery (the product tour system with `TourTooltip` already exists in the codebase).

---

## 17. Screen Priority Ranking
Rank these screen groups by redesign priority (1 = first):

**Your Answer:** `[OPEN]`

**Recommendation:**

| Priority | Screen Group | Rationale |
|----------|-------------|-----------|
| 1 | **Onboarding flow** | First impression. If onboarding fails, nothing else matters. |
| 2 | **AI Coach (SIA) chat + voice** | The core product experience. Must be exceptional. |
| 3 | **Home / Today** | Daily return experience. The screen users see most. |
| 4 | **Goals & Plans** | The user's personal roadmap. Core to retention. |
| 5 | **Landing page** | Public marketing site drives acquisition. |
| 6 | **Life Areas overview** | The holistic life wheel — key differentiator visualization. |
| 7 | **Wellbeing hub** | Journal + mood + habits are high-frequency daily use. |
| 8 | **Profile & Settings** | Users need to manage account, integrations, preferences. |
| 9 | **Fitness & Workouts** | Deep existing feature, high engagement domain. |
| 10 | **Nutrition** | Deep existing feature, daily use for tracking users. |
| 11 | **Subscription & Billing** | Revenue-critical. Must be clear and trustworthy. |
| 12 | **Explore page** | Module discovery. Important but not daily use. |
| 13 | **Schedule & Calendar** | Nice to have, not core to initial experience. |
| 14 | **Spirituality features** | Important for primary persona, moderate scope. |
| 15 | **Finance / Money Map** | Newer feature, moderate priority. |
| 16 | **Admin panel** | Internal tool. Functional > beautiful. |
| 17 | **Community & Social** | Deprioritized for v1. |
| 18 | **Knowledge Graph** | Power user feature. Low priority. |
| 19 | **Learning features** | Light implementation for v1. |
| 20 | **Creativity features** | Later version. |

---

## 18. Open Questions & Wild Card

### Q5: Community-created modules — scope for v1?

**Your Answer:** `[OPEN]`

**Recommendation: No, not for v1.** Community-created modules require: a module framework/SDK, moderation tools, quality control, distribution, and permissions. This is a massive feature that distracts from the core AI coaching experience. Revisit for v2/v3 when the platform has proven product-market fit.

---

### 18.1 Is there a feature or experience that no existing app does that you want Balencia to pioneer?

**Your Answer:** `[OPEN]`

**Recommendation: Cross-life-domain causal intelligence — already built, just needs to surface beautifully.**

No app on the market connects sleep → finance → relationships → career → spirituality and reveals causal patterns across all of them. Apps like Oura track sleep. YNAB tracks money. Headspace tracks meditation. None of them tell you: "Your financial stress spikes 3 days before your sleep quality drops, and that's the same week you skip prayer most."

The 22 cross-pillar rules, the knowledge graph, the memory engine, the daily analysis service, and the conversation insight extractor — this intelligence infrastructure is already built. The pioneering experience is making it VISIBLE in a way that feels magical, not clinical.

**The pioneer moment:** A user sets up Balencia across 3+ life domains, uses it for 2 weeks, and then SIA says something so insightful about their life patterns that they stop and think, "How did it know that?" That's the moment no other app delivers.

---

### 18.2 What's the one thing from the current app you absolutely want to keep?

**Your Answer:** `[OPEN — needs Salman's input]`

**Recommendation to preserve:** The depth of the AI intelligence backend — the memory engine, cross-pillar intelligence, proactive messaging, comprehensive user context, and knowledge graph. This is 220+ services of carefully built intelligence infrastructure. The UI can change completely, but this backend is the product's moat.

---

### 18.3 What's the one thing from the current app that must change?

**Your Answer:** `[OPEN — needs Salman's input]`

**Recommendation:** The navigation and feature density. A sidebar with 30+ items, 8 dashboard tabs, 10+ wellbeing sub-modules, and two separate AI chat entry points (/ai-coach and /chat) overwhelm users. The redesign should reduce the visible surface area by 70% while keeping 100% of the capability — accessible through SIA and progressive disclosure.

---

### 18.4 Any apps, designs, or experiences that recently inspired you?

**Your Answer:** `[OPEN — needs Salman's input]`

---

### 18.5 What would make a user tell a friend about Balencia?

**Your Answer:** `[OPEN]`

**Recommendation: "It told me something about myself that I didn't know."**

Not a feature. A moment. The moment SIA says: "I noticed that every time you skip your morning prayer, your productivity drops for the entire day — and three days later, you overspend online. These three things are connected." The user has never seen their life that way. They pull out their phone: "Look at what my AI coach just told me."

This moment requires:
1. Enough data (2+ weeks of multi-domain tracking)
2. Real cross-domain intelligence (the 22 rules + daily analysis)
3. SIA surfacing the insight at the right time, in the right tone
4. A visual that makes the connection tangible (domain-colored tags, a mini connection visualization)

Everything in this questionnaire should be designed to make this moment happen faster and more often.

---

*Next step: Once answered and finalized by Salman, these decisions become input for screen design specs — starting with Priority 1: Onboarding flow, Priority 2: SIA chat + voice, Priority 3: Home/Today.*