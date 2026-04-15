---
title: Universal Self-Improvement Scope — Design Spec
date: 2026-04-15
status: Draft
owner: yhealth-app
---

# Universal Self-Improvement Scope

**Promise**: When a user asks "Can yHealth help me with X?" where X is any self-improvement area (career, relationships, creativity, spirituality, etc.), the answer is ALWAYS yes. The coach listens, schedules, follows up, motivates — it doesn't need domain expertise; it needs to be a great accountability partner for whatever the user wants to do.

## 1. Architecture (Hybrid: Generic Engine + Career Flagship)

```
┌─────────────────────────────────────────────────────────┐
│  UI LAYER                                                │
│  /life-areas (generic hub)  │  /career (flagship)       │
│  — any domain, one UI       │  — 6 tabs: Job Hunt,      │
│                             │    Skills, Reviews,       │
│                             │    Promotion, Salary,     │
│                             │    Side-Projects          │
├─────────────────────────────────────────────────────────┤
│  COACH LOOP (domain-agnostic)                            │
│  Intent Router (LLM + domain registry + correction chip)│
│  Follow-up Orchestrator (unified: chat + check-in + push)│
├─────────────────────────────────────────────────────────┤
│  EXISTING PRIMITIVES (reuse, do not rebuild)             │
│  goals │ schedule │ accountability │ ai-coach │ journal │
│  reminders │ voice-schedule │ streak │ gamification     │
└─────────────────────────────────────────────────────────┘
```

**Key decisions:**
- `LifeArea` is a thin domain record; points at existing goals/schedules/contracts with a `domain` tag.
- `/career` reads the same tables as `/life-areas`, filtered by `domain='career'`, plus its own `career_artifacts` extension.
- No new memory store. Coach pulls recent journal entries + check-in answers + recent goal/schedule changes as per-turn context.

## 2. Data Model

### New tables (`server/src/database/tables/`)

**`116-life-areas.sql`**
```sql
CREATE TABLE life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,               -- 'career', 'relationship-mom', 'guitar'
  display_name TEXT NOT NULL,
  domain_type TEXT NOT NULL,        -- registry key: 'career' | 'relationships' | 'creativity' | 'custom' | ...
  icon TEXT,                        -- lucide icon name
  color TEXT,                       -- hex for theming cards
  is_flagship BOOLEAN DEFAULT false,-- true only for 'career' currently
  preferences JSONB DEFAULT '{}'::jsonb,
                                    -- { preferredTimeOfDay, blockedDays[], tone, followUpFrequency, customNotes[] }
  status TEXT DEFAULT 'active',     -- 'active' | 'paused' | 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);
CREATE INDEX idx_life_areas_user_status ON life_areas(user_id, status);
```

**`117-life-area-links.sql`** — associates existing goals/schedules/contracts with a life area
```sql
CREATE TABLE life_area_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  life_area_id UUID NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,        -- 'goal' | 'schedule' | 'contract' | 'reminder'
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX idx_life_area_links_area ON life_area_links(life_area_id);
CREATE INDEX idx_life_area_links_entity ON life_area_links(entity_type, entity_id);
```

**`118-career-artifacts.sql`** — flagship-only
```sql
CREATE TABLE career_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  life_area_id UUID REFERENCES life_areas(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,      -- 'application' | 'resume' | 'contact' | 'skill' | 'review' | 'promotion_plan' | 'salary_prep' | 'side_project'
  data JSONB NOT NULL,              -- typed per artifact_type; see TS types
  status TEXT,                      -- type-dependent: 'applied'|'interviewing'|'offered'|'rejected' for application, etc.
  next_action_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_career_artifacts_user_type ON career_artifacts(user_id, artifact_type) WHERE archived_at IS NULL;
CREATE INDEX idx_career_artifacts_next_action ON career_artifacts(user_id, next_action_at) WHERE next_action_at IS NOT NULL AND archived_at IS NULL;
```

### Domain registry (`server/src/config/life-area-domains.ts`)

Static TS config — adding a domain is a code change, not a DB row. Each entry:
```ts
{
  type: 'career' | 'relationships' | 'creativity' | 'spirituality' | 'finance' | 'fitness' | 'learning' | 'custom',
  displayName: string,
  description: string,              // fed to intent router LLM
  defaultIcon: string,
  defaultColor: string,
  isFlagship: boolean,
  suggestedCadence: 'daily' | 'weekly' | 'custom',
  coachPromptHints: string[],       // domain-specific phrasing nudges
  examplePhrases: string[],         // for intent matching: "I want a better job", "spend more time with mom"
}
```

## 3. Coach Loop Mechanics

### Intent Routing (auto + correction chip)
1. User sends message to `/api/ai-coach` as usual.
2. If message passes a "self-improvement intent" heuristic (presence of "want to", "should", "I've been [bad at]", etc. OR LLM classifier flag), router calls LLM with: `{ userMessage, registeredDomains, existingLifeAreas }`.
3. LLM returns: `{ domainType, existingLifeAreaId?, suggestedAction: 'create_goal'|'adjust_schedule'|'add_contract', payload }`.
4. Action executes; response includes a `routingChip: { domainType, lifeAreaName, alternatives[] }`.
5. Frontend renders chip: *"Added to Career → Job Hunt · Change"*. Tap → dropdown to reroute to another area or mark "not self-improvement."

### Unified Follow-up (chat + check-in + push)
Single source of truth: `follow_up_tasks` table (reuse existing `reminders` table with added `life_area_id` column if possible; new table if schema conflict).

Each follow-up task has `{ id, life_area_id, prompt, scheduled_for, status, channels: ['chat'|'checkin'|'push'] }`. Orchestrator worker (reuse `server/src/workers/`) fires them at `scheduled_for`:
- **Push**: sends notification with quick-reply actions (Done / Skipped / Reschedule / Talk).
- **Chat**: posts a coach message with the same prompt when user next opens ai-coach.
- **Check-in**: injects the prompt into MorningCheckin/EveningReview on the next ritual.

Any channel's answer marks the task `resolved` and syncs state. First channel wins; others silently drop.

### Adaptive Preferences (your choice: D — reuse journal/check-in history)
No new memory store. When coach generates a follow-up or scheduling decision:
1. Fetch last 20 journal entries + last 7 check-ins for the user, filtered to entries tagged/linked to this life area.
2. Include them in LLM context: *"Recent user signals about this area..."*
3. LLM infers preferences ("user said they prefer mornings") and applies them.

Known tradeoff: preferences may get buried in noise and the coach may forget things >20 entries ago. Mitigation: if a user explicitly states a preference (detected by heuristic "I want to/I prefer/don't ask me about"), persist it to `life_areas.preferences` JSONB as a durable structured note. Structured preferences bypass the LLM inference path.

## 4. API Surface

### New routes (`server/src/routes/life-areas.routes.ts`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/life-areas` | List user's life areas (filter: status, domain_type) |
| POST | `/api/life-areas` | Create area (called by intent router or user) |
| GET | `/api/life-areas/:id` | Area detail + linked goals/schedules/contracts + recent follow-ups |
| PATCH | `/api/life-areas/:id` | Update name/icon/color/preferences/status |
| DELETE | `/api/life-areas/:id` | Archive (soft) |
| POST | `/api/life-areas/:id/links` | Link an existing goal/schedule/contract |
| POST | `/api/life-areas/route-intent` | Explicit intent routing (used by correction chip reroute) |

### New routes (`server/src/routes/career.routes.ts`) — flagship
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/career/artifacts` | List by type, filters |
| POST | `/api/career/artifacts` | Create artifact |
| PATCH | `/api/career/artifacts/:id` | Update |
| DELETE | `/api/career/artifacts/:id` | Archive |
| GET | `/api/career/dashboard` | Aggregated stats (applications this week, next actions, interview pipeline) |

### Extended routes
- `ai-coach.routes.ts` — add intent routing step in message handler; response includes `routingChip` when triggered.
- `reminders.routes.ts` or new `follow-ups.routes.ts` — unified follow-up state + channel resolution.

## 5. Frontend (Design: Overview + Workouts tabs as north star)

### Design language (observed from existing Overview/Workouts tabs)
- `framer-motion` for tab transitions, card entrances, and stat animations.
- Cards: `DashboardCard` wrapper with subtle gradient borders, soft shadows, `bg-slate-900/50 backdrop-blur`.
- Color accents: blue → purple → cyan gradient blurs on backgrounds.
- Tab navigation: `DashboardUnderlineTabs` component.
- Icon + stat + trend pattern (see `StatsCards.tsx`, `WorkoutJourneyStatCards.tsx`).
- Active-state banners (see `ActiveSessionBanner.tsx`) for "today's focus."

### `/life-areas` page
```
client/app/(pages)/life-areas/
├── page.tsx
├── LifeAreasPageContent.tsx
└── components/
    ├── LifeAreaGrid.tsx           (card grid, one per area)
    ├── LifeAreaCard.tsx           (icon, name, streak, next follow-up, mini-progress ring)
    ├── CreateLifeAreaModal.tsx    (domain picker → name → color/icon)
    ├── LifeAreaDetailDrawer.tsx   (slide-in: linked goals/schedules, recent follow-ups, preferences editor)
    ├── EmptyState.tsx             (shown when no areas yet; CTA: "Try: 'I want to read more books'")
    └── RoutingChip.tsx            (used inline in ai-coach chat; reroute affordance)
```

### `/career` page (flagship)
```
client/app/(pages)/career/
├── page.tsx
├── CareerPageContent.tsx
└── components/
    ├── CareerOverview.tsx         (hero: next-action stack, this-week stats, active application pipeline)
    ├── tabs/
    │   ├── JobHuntTab.tsx         (application kanban: Applied / Screening / Interviewing / Offer / Rejected)
    │   ├── SkillsTab.tsx          (skill goals, learning hours, progress rings)
    │   ├── ReviewsTab.tsx         (performance review prep, 360 notes, talking points)
    │   ├── PromotionTab.tsx       (milestone tracker, feedback log, readiness score)
    │   ├── SalaryTab.tsx          (market research, negotiation scripts, offer comparisons)
    │   └── SideProjectsTab.tsx    (project cards, time logs, links to goals)
    ├── ApplicationFormModal.tsx
    ├── ContactCard.tsx
    ├── ResumeVersionSwitcher.tsx
    └── NextActionsWidget.tsx      (shared widget, renders on overview + embedded into /ai-coach)
```

**Visual style contract**: Match Overview + Workouts:
- Full-bleed background with gradient blur orbs.
- Tab content wrapped in `<TabContent>` with the same motion variants shown in `OverviewTab.tsx`.
- Use existing `DashboardCard`, `DashboardUnderlineTabs`, stat card patterns.
- Every actionable state has a primary CTA in gradient-from-blue-to-purple.
- Empty states are warm and coach-y, not clinical ("Let's add your first application — what role caught your eye?").

## 6. Error Handling & Edge Cases

**Intent router failure** — if LLM classifier times out / returns malformed JSON: fall back to posting the coach message normally (no routing, no chip). Log for metrics. Never block the coach reply on routing.

**Misrouting** — correction chip always present when routing happened; one tap reroutes. Reroutes are logged (fine-tune signal).

**Orphan follow-ups** — if a user deletes a life area with pending follow-ups: follow-ups cascade-delete via `ON DELETE CASCADE`. Push notifications already in flight are suppressed at send-time by re-checking `life_area_id` existence.

**Cross-channel race** — follow-up resolution uses DB transaction with `SELECT ... FOR UPDATE` on the follow-up row; first channel's write wins, others get a "already resolved" no-op.

**Schedule conflicts** — when coach adjusts schedule per user feedback ("move to morning"), uses existing schedule conflict detection in `schedule.routes.ts`. If conflict, coach asks user to resolve rather than silently overwriting.

**Preference persistence bugs** — structured preferences in `life_areas.preferences` JSONB are the durable source; LLM-inferred preferences are advisory. If they conflict, structured wins.

**Privacy** — life areas and artifacts are per-user; standard `user_id` scoping in all queries; enforced via middleware used by existing routes.

**Performance** — `/life-areas` list endpoint paginates at 50; `/career/dashboard` uses aggregated query with indexed `next_action_at`; heavy journal retrieval for coach context caps at 20 entries and caches per session.

## 7. Testing Strategy

- **Unit**: domain registry validation, intent router payload construction, follow-up orchestrator channel dispatch logic.
- **Integration**: create life area → coach adds goal → follow-up fires → user answers in check-in → state resolves in chat + push suppressed.
- **E2E (Playwright)**: user says "I want a better job" → Career area created → application added → next-day check-in shows follow-up → answer "done" → streak increments.
- **Contract**: API routes validated with existing Zod schemas pattern in `server/src/validators/`.

## 8. Phasing

**Phase 1 — Foundation (ships first)**
- Life areas schema + CRUD + domain registry + `/life-areas` hub UI.
- Linking existing goals/schedules/contracts to a life area.
- Intent router + correction chip in ai-coach.

**Phase 2 — Unified follow-up**
- Follow-up orchestrator + multi-channel dispatch.
- Hooks into MorningCheckin / EveningReview.
- Push notification quick-reply actions.

**Phase 3 — Career flagship**
- `career_artifacts` schema.
- `/career` page shell + Job Hunt tab (highest-value per validated use case).
- Remaining 5 tabs (Skills → Reviews → Promotion → Salary → Side-Projects) ship one per sub-phase.

**Phase 4 — Preference persistence polish**
- Heuristic-based structured preference extraction from chat ("I prefer mornings").
- Preferences editor UI in `LifeAreaDetailDrawer`.

## 9. Out of Scope (v1)

- Flagship pages for Relationships / Creativity (generic engine handles them).
- Cross-area correlation insights ("your career stress is hurting sleep") — future.
- Sharing life areas with a buddy/accountability partner — future.
- AI-generated resume/cover-letter drafting inside Career — future.

## 10. References

- Existing infra: `goals`, `schedule`, `accountability`, `ai-coach`, `journal`, `reminders`, `voice-schedule`, `streak`, `gamification` route files.
- Visual north star: `client/app/(pages)/dashboard/components/tabs/overview/OverviewTab.tsx`, `.../tabs/workouts/*`.
- Design language: existing `DashboardCard`, `DashboardUnderlineTabs`, framer-motion tab transitions.
