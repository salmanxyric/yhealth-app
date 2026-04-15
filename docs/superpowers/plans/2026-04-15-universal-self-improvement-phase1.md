# Universal Self-Improvement — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the foundation of the "Universal Self-Improvement Scope" — a generic `LifeArea` engine with CRUD, a static domain registry, an intent router that auto-routes self-improvement messages from the AI coach into the right life area (with a correction chip for misrouting), and a `/life-areas` hub UI styled to match the Overview + Workouts tabs.

**Architecture:** Three-layer reuse — new `life_areas` + `life_area_links` tables store thin domain records that point at existing `goals`/`schedules`/`accountability_contracts`. A new `life-areas.routes.ts` exposes CRUD. The existing `ai-coach.controller.ts` gains an intent-routing step (LLM classifier + correction chip in response). The `/life-areas` page mirrors the Overview tab's visual language (framer-motion, DashboardCard, gradient blur orbs, underline tabs).

**Tech Stack:** PostgreSQL (pg), Express + Zod + asyncHandler, Next.js 15 App Router, React 19, Tailwind, framer-motion, shadcn/ui, axios (`lib/api-client.ts`), Jest (server), Playwright (e2e).

**Spec:** [`docs/superpowers/specs/2026-04-15-universal-self-improvement-design.md`](../specs/2026-04-15-universal-self-improvement-design.md)

**Phase scope — what Phase 1 includes:**
- `life_areas` + `life_area_links` tables
- Domain registry (static TS config)
- Server: routes/controller/service/validator for life areas
- Client: `/life-areas` hub page (grid, detail drawer, create modal)
- AI coach intent router + correction chip (auto-routing only; follow-up orchestration is Phase 2)

**Out of scope for Phase 1 (later phases):**
- Follow-up orchestrator (Phase 2)
- `/career` flagship + `career_artifacts` (Phase 3)
- Preference persistence polish (Phase 4)

---

## File Structure

**Server — new files:**
- `server/src/database/tables/116-life-areas.sql` — `life_areas` table
- `server/src/database/tables/117-life-area-links.sql` — link table
- `server/src/database/migrations/20260415000001_life_areas.sql` — versioned migration mirroring the two table files so the migration runner picks it up
- `server/src/config/life-area-domains.ts` — static domain registry
- `server/src/validators/life-areas.validator.ts` — Zod schemas
- `server/src/services/life-areas.service.ts` — DB queries, business rules
- `server/src/services/life-area-intent-router.service.ts` — LLM classifier + fallback
- `server/src/controllers/life-areas.controller.ts` — HTTP layer
- `server/src/routes/life-areas.routes.ts` — Express routes
- `server/src/__tests__/life-areas.service.test.ts` — service unit tests
- `server/src/__tests__/life-area-intent-router.test.ts` — router unit tests

**Server — modified files:**
- `server/src/routes/index.ts` — register new route
- `server/src/controllers/ai-coach.controller.ts` — call intent router after coach reply, attach `routingChip` to response
- `server/src/validators/ai-coach.validator.ts` — add optional `routingChip` on response schema (if schema is exported)

**Client — new files:**
- `client/app/(pages)/life-areas/page.tsx`
- `client/app/(pages)/life-areas/layout.tsx`
- `client/app/(pages)/life-areas/LifeAreasPageContent.tsx`
- `client/app/(pages)/life-areas/components/LifeAreaGrid.tsx`
- `client/app/(pages)/life-areas/components/LifeAreaCard.tsx`
- `client/app/(pages)/life-areas/components/CreateLifeAreaModal.tsx`
- `client/app/(pages)/life-areas/components/LifeAreaDetailDrawer.tsx`
- `client/app/(pages)/life-areas/components/EmptyState.tsx`
- `client/app/(pages)/life-areas/components/DomainPicker.tsx`
- `client/app/(pages)/life-areas/types.ts`
- `client/app/(pages)/life-areas/hooks/use-life-areas.ts`
- `client/components/ai-coach/RoutingChip.tsx`
- `client/components/ai-coach/RoutingChipAlternatives.tsx`

**Client — modified files:**
- `client/app/(pages)/chat/ChatPageContent.tsx` or `dashboard/components/tabs/AICoachTab.tsx` — render `<RoutingChip>` when server returns `routingChip` with coach messages
- `client/lib/api-client.ts` — (no changes; use existing `api` object)

---

## Task 1: Create `life_areas` Table

**Files:**
- Create: `server/src/database/tables/116-life-areas.sql`
- Create: `server/src/database/migrations/20260415000001_life_areas.sql`

- [ ] **Step 1: Write `116-life-areas.sql`**

```sql
-- ============================================================================
-- Life Areas — domain-tagged containers linking existing goals/schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  domain_type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_flagship BOOLEAN DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT life_areas_status_check CHECK (status IN ('active', 'paused', 'archived')),
  CONSTRAINT life_areas_user_slug_unique UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_life_areas_user_status
  ON life_areas (user_id, status);

CREATE INDEX IF NOT EXISTS idx_life_areas_user_domain
  ON life_areas (user_id, domain_type) WHERE status = 'active';

-- updated_at trigger (reuses shared trigger function if defined elsewhere)
CREATE OR REPLACE FUNCTION set_life_areas_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS life_areas_updated_at ON life_areas;
CREATE TRIGGER life_areas_updated_at
  BEFORE UPDATE ON life_areas
  FOR EACH ROW EXECUTE FUNCTION set_life_areas_updated_at();
```

- [ ] **Step 2: Mirror into versioned migration**

Copy the same SQL into `server/src/database/migrations/20260415000001_life_areas.sql` so the migration runner (`migrate.ts`) picks it up.

- [ ] **Step 3: Run migration and verify**

Run from `server/`:
```bash
npm run db:migrate
```
Expected: "Applied 1 migration: 20260415000001_life_areas".

Then verify:
```bash
psql "$DATABASE_URL" -c "\d life_areas"
```
Expected: table with 11 columns, 2 indexes, updated_at trigger.

- [ ] **Step 4: Commit**

```bash
git add server/src/database/tables/116-life-areas.sql \
        server/src/database/migrations/20260415000001_life_areas.sql
git commit -m "feat(db): add life_areas table"
```

---

## Task 2: Create `life_area_links` Table

**Files:**
- Create: `server/src/database/tables/117-life-area-links.sql`
- Create: `server/src/database/migrations/20260415000002_life_area_links.sql`

- [ ] **Step 1: Write `117-life-area-links.sql`**

```sql
-- ============================================================================
-- Life Area Links — associates existing entities (goals, schedules, contracts,
-- reminders) with a life area. One entity can belong to at most one area.
-- ============================================================================

CREATE TABLE IF NOT EXISTS life_area_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  life_area_id UUID NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT life_area_links_entity_type_check
    CHECK (entity_type IN ('goal', 'schedule', 'contract', 'reminder')),
  CONSTRAINT life_area_links_entity_unique UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_life_area_links_area
  ON life_area_links (life_area_id);

CREATE INDEX IF NOT EXISTS idx_life_area_links_entity
  ON life_area_links (entity_type, entity_id);
```

- [ ] **Step 2: Mirror into versioned migration**

Copy the same SQL into `server/src/database/migrations/20260415000002_life_area_links.sql`.

- [ ] **Step 3: Run migration and verify**

```bash
npm run db:migrate
psql "$DATABASE_URL" -c "\d life_area_links"
```
Expected: 5 columns, 2 indexes, unique constraint on (entity_type, entity_id).

- [ ] **Step 4: Commit**

```bash
git add server/src/database/tables/117-life-area-links.sql \
        server/src/database/migrations/20260415000002_life_area_links.sql
git commit -m "feat(db): add life_area_links table"
```

---

## Task 3: Domain Registry (Static TS Config)

**Files:**
- Create: `server/src/config/life-area-domains.ts`

- [ ] **Step 1: Write failing test for registry shape**

Create `server/src/__tests__/life-area-domains.test.ts`:
```typescript
import { describe, it, expect } from '@jest/globals';
import { LIFE_AREA_DOMAINS, getDomainByType, listDomainTypes } from '../config/life-area-domains.js';

describe('life-area-domains registry', () => {
  it('includes career, relationships, creativity, spirituality, finance, fitness, learning, custom', () => {
    const types = listDomainTypes();
    for (const t of ['career', 'relationships', 'creativity', 'spirituality', 'finance', 'fitness', 'learning', 'custom']) {
      expect(types).toContain(t);
    }
  });

  it('marks only career as flagship', () => {
    const flagships = LIFE_AREA_DOMAINS.filter((d) => d.isFlagship);
    expect(flagships.map((d) => d.type)).toEqual(['career']);
  });

  it('getDomainByType returns null for unknown type', () => {
    expect(getDomainByType('nonexistent' as never)).toBeNull();
  });

  it('every domain has at least one examplePhrase for intent routing', () => {
    for (const d of LIFE_AREA_DOMAINS) {
      expect(d.examplePhrases.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npm test -- life-area-domains`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the registry**

Create `server/src/config/life-area-domains.ts`:
```typescript
export type LifeAreaDomainType =
  | 'career'
  | 'relationships'
  | 'creativity'
  | 'spirituality'
  | 'finance'
  | 'fitness'
  | 'learning'
  | 'custom';

export interface LifeAreaDomain {
  type: LifeAreaDomainType;
  displayName: string;
  description: string;
  defaultIcon: string;
  defaultColor: string;
  isFlagship: boolean;
  suggestedCadence: 'daily' | 'weekly' | 'custom';
  coachPromptHints: string[];
  examplePhrases: string[];
}

export const LIFE_AREA_DOMAINS: LifeAreaDomain[] = [
  {
    type: 'career',
    displayName: 'Career',
    description: 'Job hunting, skill building, performance reviews, promotion planning, salary prep, side projects.',
    defaultIcon: 'Briefcase',
    defaultColor: '#6366f1',
    isFlagship: true,
    suggestedCadence: 'daily',
    coachPromptHints: [
      'Ask about applications sent today.',
      'Nudge on resume tweaks weekly.',
      'Check in on networking outreach.',
    ],
    examplePhrases: [
      'I want a better job',
      "I've been lazy about applying",
      'need to update my resume',
      'prep for my review',
      'negotiate my salary',
    ],
  },
  {
    type: 'relationships',
    displayName: 'Relationships',
    description: 'Spending quality time with family, friends, partner; maintaining connections; social routines.',
    defaultIcon: 'Heart',
    defaultColor: '#ec4899',
    isFlagship: false,
    suggestedCadence: 'daily',
    coachPromptHints: ['Ask gently about time spent with the person.', 'Avoid guilt-tripping tone.'],
    examplePhrases: [
      "don't spend enough time with my mother",
      'want to call my friend more',
      'date night with my partner',
      'reconnect with old friends',
    ],
  },
  {
    type: 'creativity',
    displayName: 'Creativity',
    description: 'Creative practice — writing, drawing, music, crafts; projects, portfolio, daily practice.',
    defaultIcon: 'Palette',
    defaultColor: '#f59e0b',
    isFlagship: false,
    suggestedCadence: 'daily',
    coachPromptHints: ['Celebrate any output, however small.', 'Never critique creative work — only consistency.'],
    examplePhrases: ['want to write more', 'practice guitar', 'work on my novel', 'draw every day'],
  },
  {
    type: 'spirituality',
    displayName: 'Spirituality',
    description: 'Prayer, meditation, reflection, faith practices.',
    defaultIcon: 'Sparkles',
    defaultColor: '#8b5cf6',
    isFlagship: false,
    suggestedCadence: 'daily',
    coachPromptHints: ['Respect the user\'s faith tradition.', 'Stay neutral on religious content.'],
    examplePhrases: ['pray more', 'meditation practice', 'read scripture daily'],
  },
  {
    type: 'finance',
    displayName: 'Finance',
    description: 'Budgeting, saving, debt reduction, investing habits.',
    defaultIcon: 'Wallet',
    defaultColor: '#10b981',
    isFlagship: false,
    suggestedCadence: 'weekly',
    coachPromptHints: ['Ask about the number, not feelings about the number.'],
    examplePhrases: ['save more', 'pay off debt', 'track my spending'],
  },
  {
    type: 'fitness',
    displayName: 'Fitness',
    description: 'Exercise consistency, movement habits, sport practice.',
    defaultIcon: 'Dumbbell',
    defaultColor: '#ef4444',
    isFlagship: false,
    suggestedCadence: 'daily',
    coachPromptHints: ['Coordinate with existing workout plans.'],
    examplePhrases: ['exercise more', 'go to the gym', 'run 3x a week'],
  },
  {
    type: 'learning',
    displayName: 'Learning',
    description: 'Courses, books, skills outside career; intellectual curiosity.',
    defaultIcon: 'BookOpen',
    defaultColor: '#06b6d4',
    isFlagship: false,
    suggestedCadence: 'daily',
    coachPromptHints: ['Track pages/minutes, not completion.'],
    examplePhrases: ['read more books', 'learn spanish', 'take a course'],
  },
  {
    type: 'custom',
    displayName: 'Custom',
    description: 'Anything that doesn\'t fit another category — user defines it.',
    defaultIcon: 'Target',
    defaultColor: '#64748b',
    isFlagship: false,
    suggestedCadence: 'custom',
    coachPromptHints: ['Follow the user\'s lead on tone and cadence.'],
    examplePhrases: [],
  },
];

export function getDomainByType(type: LifeAreaDomainType): LifeAreaDomain | null {
  return LIFE_AREA_DOMAINS.find((d) => d.type === type) ?? null;
}

export function listDomainTypes(): LifeAreaDomainType[] {
  return LIFE_AREA_DOMAINS.map((d) => d.type);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npm test -- life-area-domains`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/config/life-area-domains.ts \
        server/src/__tests__/life-area-domains.test.ts
git commit -m "feat(config): add life area domain registry"
```

---

## Task 4: Validator (Zod Schemas)

**Files:**
- Create: `server/src/validators/life-areas.validator.ts`

- [ ] **Step 1: Write the validator**

```typescript
import { z } from 'zod';
import { listDomainTypes } from '../config/life-area-domains.js';

const domainTypeEnum = z.enum(listDomainTypes() as [string, ...string[]]);

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits, or hyphens');

const preferencesSchema = z
  .object({
    preferredTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    blockedDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])).optional(),
    tone: z.enum(['gentle', 'direct', 'playful', 'neutral']).optional(),
    followUpFrequency: z.enum(['daily', 'every-other-day', 'weekly', 'off']).optional(),
    customNotes: z.array(z.string().max(500)).optional(),
  })
  .passthrough();

export const createLifeAreaSchema = z.object({
  slug: slugSchema,
  display_name: z.string().min(1).max(100),
  domain_type: domainTypeEnum,
  icon: z.string().max(64).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'color must be hex like #3366ff')
    .optional(),
  preferences: preferencesSchema.optional(),
});

export const updateLifeAreaSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  icon: z.string().max(64).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  preferences: preferencesSchema.optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

export const linkEntitySchema = z.object({
  entity_type: z.enum(['goal', 'schedule', 'contract', 'reminder']),
  entity_id: z.string().uuid(),
});

export const routeIntentSchema = z.object({
  message: z.string().min(1).max(4000),
  coach_reply: z.string().max(8000).optional(),
});

export type CreateLifeAreaInput = z.infer<typeof createLifeAreaSchema>;
export type UpdateLifeAreaInput = z.infer<typeof updateLifeAreaSchema>;
export type LinkEntityInput = z.infer<typeof linkEntitySchema>;
export type RouteIntentInput = z.infer<typeof routeIntentSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validators/life-areas.validator.ts
git commit -m "feat(validators): add life areas zod schemas"
```

---

## Task 5: Service Layer — Tests First

**Files:**
- Create: `server/src/__tests__/life-areas.service.test.ts`

- [ ] **Step 1: Write failing service tests**

```typescript
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { query } from '../config/database.config.js';
import { lifeAreasService } from '../services/life-areas.service.js';

const TEST_USER = '00000000-0000-0000-0000-00000000aaaa';

beforeAll(async () => {
  await query(
    `INSERT INTO users (id, email, password_hash, onboarding_status)
     VALUES ($1, 'la-test@example.com', 'x', 'completed')
     ON CONFLICT (id) DO NOTHING`,
    [TEST_USER],
  );
});

beforeEach(async () => {
  await query('DELETE FROM life_area_links WHERE life_area_id IN (SELECT id FROM life_areas WHERE user_id = $1)', [TEST_USER]);
  await query('DELETE FROM life_areas WHERE user_id = $1', [TEST_USER]);
});

afterAll(async () => {
  await query('DELETE FROM life_areas WHERE user_id = $1', [TEST_USER]);
  await query('DELETE FROM users WHERE id = $1', [TEST_USER]);
});

describe('lifeAreasService', () => {
  it('creates a life area with defaults from registry', async () => {
    const area = await lifeAreasService.create(TEST_USER, {
      slug: 'career',
      display_name: 'My Career',
      domain_type: 'career',
    });
    expect(area.id).toBeDefined();
    expect(area.is_flagship).toBe(true);
    expect(area.icon).toBe('Briefcase');
    expect(area.color).toBe('#6366f1');
    expect(area.status).toBe('active');
  });

  it('rejects duplicate slug per user', async () => {
    await lifeAreasService.create(TEST_USER, {
      slug: 'career',
      display_name: 'Career',
      domain_type: 'career',
    });
    await expect(
      lifeAreasService.create(TEST_USER, {
        slug: 'career',
        display_name: 'Career 2',
        domain_type: 'career',
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it('lists only active areas by default', async () => {
    const a = await lifeAreasService.create(TEST_USER, { slug: 'a', display_name: 'A', domain_type: 'custom' });
    await lifeAreasService.create(TEST_USER, { slug: 'b', display_name: 'B', domain_type: 'custom' });
    await lifeAreasService.update(TEST_USER, a.id, { status: 'archived' });
    const list = await lifeAreasService.list(TEST_USER);
    expect(list.map((x) => x.slug)).toEqual(['b']);
  });

  it('updates preferences via JSONB merge', async () => {
    const area = await lifeAreasService.create(TEST_USER, {
      slug: 'relationships',
      display_name: 'Relationships',
      domain_type: 'relationships',
      preferences: { preferredTimeOfDay: 'morning' },
    });
    const updated = await lifeAreasService.update(TEST_USER, area.id, {
      preferences: { tone: 'gentle' },
    });
    expect(updated!.preferences.preferredTimeOfDay).toBe('morning');
    expect(updated!.preferences.tone).toBe('gentle');
  });

  it('returns null when updating an area owned by another user', async () => {
    const otherUser = '00000000-0000-0000-0000-00000000bbbb';
    await query(
      `INSERT INTO users (id, email, password_hash, onboarding_status)
       VALUES ($1, 'la-other@example.com', 'x', 'completed')
       ON CONFLICT (id) DO NOTHING`,
      [otherUser],
    );
    const area = await lifeAreasService.create(otherUser, { slug: 's', display_name: 'S', domain_type: 'custom' });
    const result = await lifeAreasService.update(TEST_USER, area.id, { display_name: 'Hacked' });
    expect(result).toBeNull();
    await query('DELETE FROM life_areas WHERE user_id = $1', [otherUser]);
    await query('DELETE FROM users WHERE id = $1', [otherUser]);
  });

  it('links an existing goal and prevents double-linking', async () => {
    const area = await lifeAreasService.create(TEST_USER, { slug: 'c', display_name: 'C', domain_type: 'custom' });
    const fakeGoalId = '00000000-0000-0000-0000-0000000c0001';
    await lifeAreasService.link(TEST_USER, area.id, { entity_type: 'goal', entity_id: fakeGoalId });
    await expect(
      lifeAreasService.link(TEST_USER, area.id, { entity_type: 'goal', entity_id: fakeGoalId }),
    ).rejects.toThrow(/already linked/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npm test -- life-areas.service`
Expected: FAIL — service module not found.

- [ ] **Step 3: Implement service**

Create `server/src/services/life-areas.service.ts`:
```typescript
import { query } from '../config/database.config.js';
import { getDomainByType, type LifeAreaDomainType } from '../config/life-area-domains.js';
import type {
  CreateLifeAreaInput,
  UpdateLifeAreaInput,
  LinkEntityInput,
} from '../validators/life-areas.validator.js';

export interface LifeArea {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  domain_type: LifeAreaDomainType;
  icon: string | null;
  color: string | null;
  is_flagship: boolean;
  preferences: Record<string, unknown>;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface LifeAreaLink {
  id: string;
  life_area_id: string;
  entity_type: 'goal' | 'schedule' | 'contract' | 'reminder';
  entity_id: string;
  created_at: string;
}

class LifeAreasService {
  async list(userId: string, opts: { status?: string; domain?: LifeAreaDomainType } = {}): Promise<LifeArea[]> {
    const status = opts.status ?? 'active';
    const params: unknown[] = [userId, status];
    let sql = `SELECT * FROM life_areas WHERE user_id = $1 AND status = $2`;
    if (opts.domain) {
      params.push(opts.domain);
      sql += ` AND domain_type = $3`;
    }
    sql += ` ORDER BY created_at DESC`;
    const r = await query<LifeArea>(sql, params);
    return r.rows;
  }

  async getById(userId: string, id: string): Promise<LifeArea | null> {
    const r = await query<LifeArea>(
      `SELECT * FROM life_areas WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return r.rows[0] ?? null;
  }

  async create(userId: string, input: CreateLifeAreaInput): Promise<LifeArea> {
    const domain = getDomainByType(input.domain_type as LifeAreaDomainType);
    if (!domain) throw new Error(`Unknown domain_type: ${input.domain_type}`);

    try {
      const r = await query<LifeArea>(
        `INSERT INTO life_areas
           (user_id, slug, display_name, domain_type, icon, color, is_flagship, preferences)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          input.slug,
          input.display_name,
          input.domain_type,
          input.icon ?? domain.defaultIcon,
          input.color ?? domain.defaultColor,
          domain.isFlagship,
          JSON.stringify(input.preferences ?? {}),
        ],
      );
      return r.rows[0];
    } catch (e) {
      const err = e as { code?: string; constraint?: string };
      if (err.code === '23505' && err.constraint === 'life_areas_user_slug_unique') {
        throw new Error('Life area with that slug already exists for this user');
      }
      throw e;
    }
  }

  async update(userId: string, id: string, input: UpdateLifeAreaInput): Promise<LifeArea | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (input.display_name !== undefined) { sets.push(`display_name = $${i++}`); params.push(input.display_name); }
    if (input.icon !== undefined)         { sets.push(`icon = $${i++}`);         params.push(input.icon); }
    if (input.color !== undefined)        { sets.push(`color = $${i++}`);        params.push(input.color); }
    if (input.status !== undefined)       { sets.push(`status = $${i++}`);       params.push(input.status); }
    if (input.preferences !== undefined) {
      sets.push(`preferences = COALESCE(preferences, '{}'::jsonb) || $${i++}::jsonb`);
      params.push(JSON.stringify(input.preferences));
    }
    if (sets.length === 0) return this.getById(userId, id);

    params.push(id, userId);
    const r = await query<LifeArea>(
      `UPDATE life_areas SET ${sets.join(', ')}
       WHERE id = $${i++} AND user_id = $${i++}
       RETURNING *`,
      params,
    );
    return r.rows[0] ?? null;
  }

  async archive(userId: string, id: string): Promise<boolean> {
    const r = await query(
      `UPDATE life_areas SET status = 'archived' WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async link(userId: string, lifeAreaId: string, input: LinkEntityInput): Promise<LifeAreaLink> {
    const owner = await this.getById(userId, lifeAreaId);
    if (!owner) throw new Error('Life area not found');
    try {
      const r = await query<LifeAreaLink>(
        `INSERT INTO life_area_links (life_area_id, entity_type, entity_id)
         VALUES ($1, $2, $3) RETURNING *`,
        [lifeAreaId, input.entity_type, input.entity_id],
      );
      return r.rows[0];
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === '23505') throw new Error('Entity already linked to a life area');
      throw e;
    }
  }

  async listLinks(userId: string, lifeAreaId: string): Promise<LifeAreaLink[]> {
    const owner = await this.getById(userId, lifeAreaId);
    if (!owner) return [];
    const r = await query<LifeAreaLink>(
      `SELECT * FROM life_area_links WHERE life_area_id = $1 ORDER BY created_at DESC`,
      [lifeAreaId],
    );
    return r.rows;
  }
}

export const lifeAreasService = new LifeAreasService();
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npm test -- life-areas.service`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/services/life-areas.service.ts \
        server/src/__tests__/life-areas.service.test.ts
git commit -m "feat(service): life areas service with CRUD + link"
```

---

## Task 6: Intent Router Service

**Files:**
- Create: `server/src/services/life-area-intent-router.service.ts`
- Create: `server/src/__tests__/life-area-intent-router.test.ts`

- [ ] **Step 1: Write failing router tests**

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import { buildRouterPrompt, parseRouterResponse } from '../services/life-area-intent-router.service.js';

describe('life-area intent router', () => {
  it('builds a prompt containing all active domain examplePhrases and existing areas', () => {
    const p = buildRouterPrompt({
      userMessage: 'I want a better job',
      existingAreas: [{ id: 'a1', display_name: 'My Career', domain_type: 'career' }],
    });
    expect(p).toContain('I want a better job');
    expect(p).toContain('My Career');
    expect(p).toContain('career');
    expect(p).toContain("I've been lazy about applying");
  });

  it('parses a well-formed JSON response', () => {
    const r = parseRouterResponse(
      JSON.stringify({ domainType: 'career', existingLifeAreaId: 'a1', confidence: 0.92 }),
    );
    expect(r).toEqual({ domainType: 'career', existingLifeAreaId: 'a1', confidence: 0.92 });
  });

  it('returns null for garbage JSON', () => {
    expect(parseRouterResponse('not json')).toBeNull();
    expect(parseRouterResponse('{"domainType":"not-a-domain"}')).toBeNull();
  });

  it('returns null when confidence below threshold (0.5)', () => {
    const r = parseRouterResponse(JSON.stringify({ domainType: 'career', confidence: 0.3 }));
    expect(r).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `cd server && npm test -- life-area-intent-router`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement router**

Create `server/src/services/life-area-intent-router.service.ts`:
```typescript
import { LIFE_AREA_DOMAINS, type LifeAreaDomainType, listDomainTypes } from '../config/life-area-domains.js';
import { lifeAreasService, type LifeArea } from './life-areas.service.js';
import { logger } from '../utils/logger.js';

export interface RouterResult {
  domainType: LifeAreaDomainType;
  existingLifeAreaId?: string;
  confidence: number;
}

export interface RouterContext {
  userMessage: string;
  existingAreas: Pick<LifeArea, 'id' | 'display_name' | 'domain_type'>[];
}

const CONFIDENCE_THRESHOLD = 0.5;
const SELF_IMPROVEMENT_HINTS = [
  /\bwant to\b/i,
  /\bshould\b/i,
  /\bi('ve|\s+have)\s+been\s+(lazy|bad|slacking|struggling)/i,
  /\bneed to\b/i,
  /\bhelp me\b/i,
  /\b(start|stop)\s+/i,
];

export function hasSelfImprovementIntent(message: string): boolean {
  return SELF_IMPROVEMENT_HINTS.some((re) => re.test(message));
}

export function buildRouterPrompt(ctx: RouterContext): string {
  const domainsBlock = LIFE_AREA_DOMAINS.map(
    (d) =>
      `- ${d.type}: ${d.description} Examples: ${d.examplePhrases.map((p) => `"${p}"`).join(', ')}`,
  ).join('\n');

  const existingBlock = ctx.existingAreas.length
    ? ctx.existingAreas.map((a) => `- ${a.id}: "${a.display_name}" (domain: ${a.domain_type})`).join('\n')
    : '(none yet)';

  return `You are an intent router for a self-improvement coaching app. Route the user's message into a life-area domain.

Registered domains:
${domainsBlock}

User's existing life areas:
${existingBlock}

User message:
"""${ctx.userMessage}"""

Respond with STRICT JSON only, no prose. Schema:
{"domainType":"<one of: ${listDomainTypes().join('|')}>","existingLifeAreaId":"<uuid or omit>","confidence":<0..1>}

If the message is NOT about self-improvement, respond with {"domainType":"custom","confidence":0}.
If it clearly matches an existing life area, include its id.`;
}

export function parseRouterResponse(raw: string): RouterResult | null {
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  const domainType = o.domainType;
  const confidence = typeof o.confidence === 'number' ? o.confidence : 0;
  if (typeof domainType !== 'string') return null;
  if (!listDomainTypes().includes(domainType as LifeAreaDomainType)) return null;
  if (confidence < CONFIDENCE_THRESHOLD) return null;
  const existingLifeAreaId = typeof o.existingLifeAreaId === 'string' ? o.existingLifeAreaId : undefined;
  return { domainType: domainType as LifeAreaDomainType, existingLifeAreaId, confidence };
}

export interface RoutingChip {
  lifeAreaId: string;
  lifeAreaName: string;
  domainType: LifeAreaDomainType;
  wasAutoCreated: boolean;
  alternatives: { type: LifeAreaDomainType; displayName: string }[];
}

/**
 * Main entry point used by ai-coach.controller.
 * Safe to fail — any error returns null and coach reply proceeds normally.
 */
export async function routeCoachIntent(params: {
  userId: string;
  userMessage: string;
  llm: (prompt: string) => Promise<string>;
}): Promise<RoutingChip | null> {
  try {
    if (!hasSelfImprovementIntent(params.userMessage)) return null;

    const existingAreas = (await lifeAreasService.list(params.userId)).map((a) => ({
      id: a.id, display_name: a.display_name, domain_type: a.domain_type,
    }));

    const prompt = buildRouterPrompt({ userMessage: params.userMessage, existingAreas });
    const raw = await params.llm(prompt);
    const parsed = parseRouterResponse(raw);
    if (!parsed) return null;

    let lifeAreaId: string;
    let lifeAreaName: string;
    let wasAutoCreated = false;

    if (parsed.existingLifeAreaId && existingAreas.some((a) => a.id === parsed.existingLifeAreaId)) {
      const hit = existingAreas.find((a) => a.id === parsed.existingLifeAreaId)!;
      lifeAreaId = hit.id;
      lifeAreaName = hit.display_name;
    } else {
      const domain = LIFE_AREA_DOMAINS.find((d) => d.type === parsed.domainType)!;
      const slug = `${domain.type}-${Date.now().toString(36)}`;
      const created = await lifeAreasService.create(params.userId, {
        slug,
        display_name: domain.displayName,
        domain_type: domain.type,
      });
      lifeAreaId = created.id;
      lifeAreaName = created.display_name;
      wasAutoCreated = true;
    }

    const alternatives = LIFE_AREA_DOMAINS
      .filter((d) => d.type !== parsed.domainType)
      .map((d) => ({ type: d.type, displayName: d.displayName }));

    return { lifeAreaId, lifeAreaName, domainType: parsed.domainType, wasAutoCreated, alternatives };
  } catch (err) {
    logger.warn('[life-area-intent-router] routing failed (non-fatal):', err);
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd server && npm test -- life-area-intent-router`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/services/life-area-intent-router.service.ts \
        server/src/__tests__/life-area-intent-router.test.ts
git commit -m "feat(service): life area intent router with LLM + fallback"
```

---

## Task 7: Controller

**Files:**
- Create: `server/src/controllers/life-areas.controller.ts`

- [ ] **Step 1: Implement controller**

```typescript
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { lifeAreasService } from '../services/life-areas.service.js';
import { LIFE_AREA_DOMAINS } from '../config/life-area-domains.js';

export const listDomains = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  ApiResponse.success(res, { domains: LIFE_AREA_DOMAINS }, 'Domains retrieved');
});

export const listLifeAreas = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const areas = await lifeAreasService.list(userId, {
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    domain: typeof req.query.domain === 'string' ? (req.query.domain as never) : undefined,
  });
  ApiResponse.success(res, { areas }, 'Life areas retrieved');
});

export const getLifeArea = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const area = await lifeAreasService.getById(userId, req.params.id);
  if (!area) throw ApiError.notFound('Life area not found');
  const links = await lifeAreasService.listLinks(userId, area.id);
  ApiResponse.success(res, { area, links }, 'Life area retrieved');
});

export const createLifeArea = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  try {
    const area = await lifeAreasService.create(userId, req.body);
    ApiResponse.created(res, { area }, 'Life area created');
  } catch (e) {
    if (e instanceof Error && /already exists/i.test(e.message)) throw ApiError.badRequest(e.message);
    throw e;
  }
});

export const updateLifeArea = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const area = await lifeAreasService.update(userId, req.params.id, req.body);
  if (!area) throw ApiError.notFound('Life area not found');
  ApiResponse.success(res, { area }, 'Life area updated');
});

export const archiveLifeArea = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  const ok = await lifeAreasService.archive(userId, req.params.id);
  if (!ok) throw ApiError.notFound('Life area not found');
  ApiResponse.success(res, {}, 'Life area archived');
});

export const linkEntity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw ApiError.unauthorized();
  try {
    const link = await lifeAreasService.link(userId, req.params.id, req.body);
    ApiResponse.created(res, { link }, 'Entity linked');
  } catch (e) {
    if (e instanceof Error && /already linked|not found/i.test(e.message)) throw ApiError.badRequest(e.message);
    throw e;
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/life-areas.controller.ts
git commit -m "feat(controller): life areas HTTP handlers"
```

---

## Task 8: Routes + Register

**Files:**
- Create: `server/src/routes/life-areas.routes.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the route file**

```typescript
import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  createLifeAreaSchema,
  updateLifeAreaSchema,
  linkEntitySchema,
} from '../validators/life-areas.validator.js';
import * as ctrl from '../controllers/life-areas.controller.js';

const router = Router();
router.use(authenticate);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateUuidParams(req: Request, res: Response, next: NextFunction): void {
  for (const [key, value] of Object.entries(req.params)) {
    if (typeof value === 'string' && !uuidRegex.test(value)) {
      res.status(400).json({ success: false, message: `Invalid ${key}: must be a valid UUID` });
      return;
    }
  }
  next();
}

const writeRateLimiter = createRateLimiter({ windowMs: 60_000, max: 20, keyGenerator: 'user' });

router.get('/domains', ctrl.listDomains);
router.get('/', ctrl.listLifeAreas);
router.post('/', writeRateLimiter, validate(createLifeAreaSchema), ctrl.createLifeArea);

router.get('/:id', validateUuidParams, ctrl.getLifeArea);
router.patch('/:id', validateUuidParams, writeRateLimiter, validate(updateLifeAreaSchema), ctrl.updateLifeArea);
router.delete('/:id', validateUuidParams, writeRateLimiter, ctrl.archiveLifeArea);
router.post('/:id/links', validateUuidParams, writeRateLimiter, validate(linkEntitySchema), ctrl.linkEntity);

export default router;
```

- [ ] **Step 2: Register in `routes/index.ts`**

In `server/src/routes/index.ts`, add import near other route imports:
```typescript
import lifeAreasRoutes from './life-areas.routes.js';
```

And register with the other `router.use(...)` lines (search for `accountabilityRoutes` for the right neighborhood):
```typescript
router.use('/life-areas', lifeAreasRoutes);
```

- [ ] **Step 3: Smoke test**

Start the server (`cd server && npm run dev`) and in another shell:
```bash
curl -i http://localhost:5000/api/life-areas/domains \
  -H "Authorization: Bearer $TEST_TOKEN"
```
Expected: 200 with a `domains` array of 8 entries.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/life-areas.routes.ts server/src/routes/index.ts
git commit -m "feat(routes): register /api/life-areas"
```

---

## Task 9: Wire Intent Router Into AI Coach Response

**Files:**
- Modify: `server/src/controllers/ai-coach.controller.ts`

- [ ] **Step 1: Read the current ai-coach controller to find the reply handler**

Open `server/src/controllers/ai-coach.controller.ts`. Locate the handler that returns the coach reply (search for the function that calls the LLM service and builds the `ApiResponse.success` with the `message`/`reply` content). Note the exact name.

- [ ] **Step 2: Add routing step after the reply is produced**

At the top of the file, add:
```typescript
import { routeCoachIntent } from '../services/life-area-intent-router.service.js';
import { getLLMCompletion } from '../services/llm.service.js'; // use the project's existing LLM client
```
(If the LLM client is imported under a different name or path in this file, use the same import pattern that already exists in `ai-coach.controller.ts` — do NOT introduce a new LLM client.)

In the reply handler, **after** the coach reply has been computed but **before** sending the response, call:
```typescript
const routingChip = await routeCoachIntent({
  userId,
  userMessage: req.body.message, // adjust to match the actual request field name
  llm: async (prompt) => {
    // use the same LLM call pattern used in this controller, with a strict-JSON instruction
    const response = await getLLMCompletion({
      model: 'fast', // match the project's "fast classifier" profile, not the main chat model
      prompt,
      maxTokens: 200,
      temperature: 0,
    });
    return response.text;
  },
});
```

Then attach it to the response payload, alongside the existing reply fields:
```typescript
ApiResponse.success(res, { ...existingPayload, routingChip }, 'Coach reply');
```

**Important**: `routeCoachIntent` already wraps errors and returns `null` on any failure. Do not add additional try/catch around it.

- [ ] **Step 3: Manual smoke test**

In the running app, open `/ai-coach`, send: *"I've been lazy about applying to jobs"*. Response should include `routingChip` with `domainType: "career"`.

Check DB:
```bash
psql "$DATABASE_URL" -c "SELECT slug, display_name, domain_type FROM life_areas ORDER BY created_at DESC LIMIT 5"
```
Expected: a new `career-...` row for the test user.

- [ ] **Step 4: Commit**

```bash
git add server/src/controllers/ai-coach.controller.ts
git commit -m "feat(ai-coach): attach life-area routing chip to coach replies"
```

---

## Task 10: Client — Types + API Hook

**Files:**
- Create: `client/app/(pages)/life-areas/types.ts`
- Create: `client/app/(pages)/life-areas/hooks/use-life-areas.ts`

- [ ] **Step 1: Write types**

```typescript
// client/app/(pages)/life-areas/types.ts
export type LifeAreaDomainType =
  | 'career' | 'relationships' | 'creativity' | 'spirituality'
  | 'finance' | 'fitness' | 'learning' | 'custom';

export interface LifeAreaPreferences {
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  blockedDays?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  tone?: 'gentle' | 'direct' | 'playful' | 'neutral';
  followUpFrequency?: 'daily' | 'every-other-day' | 'weekly' | 'off';
  customNotes?: string[];
}

export interface LifeArea {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  domain_type: LifeAreaDomainType;
  icon: string | null;
  color: string | null;
  is_flagship: boolean;
  preferences: LifeAreaPreferences;
  status: 'active' | 'paused' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface LifeAreaLink {
  id: string;
  life_area_id: string;
  entity_type: 'goal' | 'schedule' | 'contract' | 'reminder';
  entity_id: string;
  created_at: string;
}

export interface LifeAreaDomain {
  type: LifeAreaDomainType;
  displayName: string;
  description: string;
  defaultIcon: string;
  defaultColor: string;
  isFlagship: boolean;
  suggestedCadence: 'daily' | 'weekly' | 'custom';
  coachPromptHints: string[];
  examplePhrases: string[];
}

export interface RoutingChip {
  lifeAreaId: string;
  lifeAreaName: string;
  domainType: LifeAreaDomainType;
  wasAutoCreated: boolean;
  alternatives: { type: LifeAreaDomainType; displayName: string }[];
}
```

- [ ] **Step 2: Write hook**

```typescript
// client/app/(pages)/life-areas/hooks/use-life-areas.ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { LifeArea, LifeAreaDomain, LifeAreaLink } from '../types';

export function useLifeAreas() {
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [domains, setDomains] = useState<LifeAreaDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [areasRes, domainsRes] = await Promise.all([
        api.get<{ data: { areas: LifeArea[] } }>('/life-areas'),
        api.get<{ data: { domains: LifeAreaDomain[] } }>('/life-areas/domains'),
      ]);
      setAreas(areasRes.data.data.areas);
      setDomains(domainsRes.data.data.domains);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load life areas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: {
    slug: string; display_name: string; domain_type: string;
    icon?: string; color?: string;
  }) => {
    const res = await api.post<{ data: { area: LifeArea } }>('/life-areas', input);
    setAreas((prev) => [res.data.data.area, ...prev]);
    return res.data.data.area;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<LifeArea>) => {
    const res = await api.patch<{ data: { area: LifeArea } }>(`/life-areas/${id}`, patch);
    setAreas((prev) => prev.map((a) => (a.id === id ? res.data.data.area : a)));
    return res.data.data.area;
  }, []);

  const archive = useCallback(async (id: string) => {
    await api.delete(`/life-areas/${id}`);
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getDetail = useCallback(async (id: string) => {
    const res = await api.get<{ data: { area: LifeArea; links: LifeAreaLink[] } }>(`/life-areas/${id}`);
    return res.data.data;
  }, []);

  return { areas, domains, isLoading, error, refresh, create, update, archive, getDetail };
}
```

- [ ] **Step 3: Commit**

```bash
git add "client/app/(pages)/life-areas/types.ts" \
        "client/app/(pages)/life-areas/hooks/use-life-areas.ts"
git commit -m "feat(client): life areas types and data hook"
```

---

## Task 11: Client — Page Shell (Matches Overview Tab Language)

**Files:**
- Create: `client/app/(pages)/life-areas/page.tsx`
- Create: `client/app/(pages)/life-areas/layout.tsx`
- Create: `client/app/(pages)/life-areas/LifeAreasPageContent.tsx`

- [ ] **Step 1: Write `layout.tsx`**

```tsx
// client/app/(pages)/life-areas/layout.tsx
export default function LifeAreasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Write `page.tsx`**

```tsx
// client/app/(pages)/life-areas/page.tsx
import LifeAreasPageContent from './LifeAreasPageContent';

export const metadata = { title: 'Life Areas · yHealth' };

export default function Page() {
  return <LifeAreasPageContent />;
}
```

- [ ] **Step 3: Write `LifeAreasPageContent.tsx`**

```tsx
// client/app/(pages)/life-areas/LifeAreasPageContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useLifeAreas } from './hooks/use-life-areas';
import { LifeAreaGrid } from './components/LifeAreaGrid';
import { CreateLifeAreaModal } from './components/CreateLifeAreaModal';
import { LifeAreaDetailDrawer } from './components/LifeAreaDetailDrawer';
import { EmptyState } from './components/EmptyState';
import type { LifeArea } from './types';

export default function LifeAreasPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { areas, domains, isLoading, error, create, update, archive, getDetail, refresh } = useLifeAreas();
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<LifeArea | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/signin?callbackUrl=/life-areas');
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Ambient gradient orbs — matches Overview/Workouts */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Universal self-improvement
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Your Life Areas
            </h1>
            <p className="mt-2 text-slate-400 max-w-xl">
              Everything you're working on, in one place. The coach listens, schedules, follows up —
              for anything you want to improve.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white
                       bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500
                       shadow-lg shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            New Area
          </button>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {areas.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <LifeAreaGrid areas={areas} onSelect={setSelected} />
        )}
      </div>

      <CreateLifeAreaModal
        open={createOpen}
        domains={domains}
        onClose={() => setCreateOpen(false)}
        onCreate={async (input) => {
          await create(input);
          setCreateOpen(false);
        }}
      />

      <LifeAreaDetailDrawer
        area={selected}
        onClose={() => setSelected(null)}
        onUpdate={update}
        onArchive={async (id) => { await archive(id); setSelected(null); }}
        getDetail={getDetail}
        refresh={refresh}
      />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "client/app/(pages)/life-areas/page.tsx" \
        "client/app/(pages)/life-areas/layout.tsx" \
        "client/app/(pages)/life-areas/LifeAreasPageContent.tsx"
git commit -m "feat(client): life-areas page shell with hero"
```

---

## Task 12: Client — Grid + Card Components

**Files:**
- Create: `client/app/(pages)/life-areas/components/LifeAreaGrid.tsx`
- Create: `client/app/(pages)/life-areas/components/LifeAreaCard.tsx`

- [ ] **Step 1: Write grid**

```tsx
// client/app/(pages)/life-areas/components/LifeAreaGrid.tsx
'use client';
import { motion } from 'framer-motion';
import { LifeAreaCard } from './LifeAreaCard';
import type { LifeArea } from '../types';

export function LifeAreaGrid({ areas, onSelect }: { areas: LifeArea[]; onSelect: (a: LifeArea) => void }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.05 } },
        hidden: {},
      }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {areas.map((a) => (
        <motion.div
          key={a.id}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
          }}
        >
          <LifeAreaCard area={a} onClick={() => onSelect(a)} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Write card (matches DashboardCard style)**

```tsx
// client/app/(pages)/life-areas/components/LifeAreaCard.tsx
'use client';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import type { LifeArea } from '../types';

export function LifeAreaCard({ area, onClick }: { area: LifeArea; onClick: () => void }) {
  const Icon = (Icons[(area.icon ?? 'Target') as keyof typeof Icons] ??
    Icons.Target) as React.ComponentType<{ className?: string }>;
  const accent = area.color ?? '#6366f1';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group relative w-full text-left rounded-2xl border border-white/10
                 bg-slate-900/50 backdrop-blur-sm p-5 hover:border-white/20 transition
                 shadow-lg shadow-black/20 overflow-hidden"
    >
      {/* accent glow */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between mb-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center ring-1 ring-white/10"
          style={{ background: `${accent}22` }}
        >
          <Icon className="w-6 h-6" />
        </div>
        {area.is_flagship && (
          <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-md px-2 py-0.5">
            Flagship
          </span>
        )}
      </div>
      <div className="relative">
        <h3 className="text-white font-semibold text-lg truncate">{area.display_name}</h3>
        <p className="text-xs text-slate-400 mt-1 capitalize">{area.domain_type}</p>
      </div>
    </motion.button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "client/app/(pages)/life-areas/components/LifeAreaGrid.tsx" \
        "client/app/(pages)/life-areas/components/LifeAreaCard.tsx"
git commit -m "feat(client): life area grid and card"
```

---

## Task 13: Client — Empty State + Domain Picker + Create Modal

**Files:**
- Create: `client/app/(pages)/life-areas/components/EmptyState.tsx`
- Create: `client/app/(pages)/life-areas/components/DomainPicker.tsx`
- Create: `client/app/(pages)/life-areas/components/CreateLifeAreaModal.tsx`

- [ ] **Step 1: Empty state**

```tsx
// client/app/(pages)/life-areas/components/EmptyState.tsx
'use client';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm p-10 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-5">
        <Sparkles className="w-7 h-7 text-blue-300" />
      </div>
      <h2 className="text-xl font-semibold text-white">Start your first area</h2>
      <p className="mt-2 text-slate-400 max-w-md mx-auto">
        Try: <em className="text-slate-200">"I want a better job"</em>,{' '}
        <em className="text-slate-200">"spend more time with my mother"</em>,{' '}
        <em className="text-slate-200">"read more books"</em>. Or pick a category to get started.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white
                   bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/20"
      >
        Pick a category
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Domain picker**

```tsx
// client/app/(pages)/life-areas/components/DomainPicker.tsx
'use client';
import * as Icons from 'lucide-react';
import type { LifeAreaDomain } from '../types';

export function DomainPicker({
  domains, value, onChange,
}: { domains: LifeAreaDomain[]; value: string | null; onChange: (type: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {domains.map((d) => {
        const Icon = (Icons[d.defaultIcon as keyof typeof Icons] ?? Icons.Target) as React.ComponentType<{ className?: string }>;
        const active = value === d.type;
        return (
          <button
            key={d.type}
            type="button"
            onClick={() => onChange(d.type)}
            className={[
              'rounded-xl border p-3 text-left transition',
              active
                ? 'border-blue-400/60 bg-blue-500/10'
                : 'border-white/10 bg-slate-900/40 hover:border-white/20',
            ].join(' ')}
            style={active ? { boxShadow: `0 0 0 2px ${d.defaultColor}55` } : undefined}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${d.defaultColor}22` }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium text-white">{d.displayName}</div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create modal**

```tsx
// client/app/(pages)/life-areas/components/CreateLifeAreaModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DomainPicker } from './DomainPicker';
import type { LifeAreaDomain } from '../types';

interface Props {
  open: boolean;
  domains: LifeAreaDomain[];
  onClose: () => void;
  onCreate: (input: { slug: string; display_name: string; domain_type: string }) => Promise<void>;
}

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
}

export function CreateLifeAreaModal({ open, domains, onClose, onCreate }: Props) {
  const [domainType, setDomainType] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setDomainType(null); setName(''); setError(null); setSubmitting(false); }
  }, [open]);

  useEffect(() => {
    if (domainType && !name) {
      const d = domains.find((x) => x.type === domainType);
      if (d) setName(d.displayName);
    }
  }, [domainType, domains, name]);

  async function submit() {
    if (!domainType || !name.trim()) { setError('Pick a category and enter a name'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ slug: slugify(name) || `area-${Date.now().toString(36)}`, display_name: name.trim(), domain_type: domainType });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-semibold text-white">New life area</h2>
            <p className="text-sm text-slate-400 mt-1">Pick a category and name what you're working on.</p>

            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Category</div>
              <DomainPicker domains={domains} value={domainType} onChange={setDomainType} />
            </div>

            <div className="mt-5">
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Job Hunt 2026"
                className="w-full rounded-lg bg-slate-950/50 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500
                           focus:outline-none focus:border-blue-400/60"
              />
            </div>

            {error && <div className="mt-4 text-sm text-red-300">{error}</div>}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !domainType || !name.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white
                           bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {submitting ? 'Creating…' : 'Create area'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "client/app/(pages)/life-areas/components/EmptyState.tsx" \
        "client/app/(pages)/life-areas/components/DomainPicker.tsx" \
        "client/app/(pages)/life-areas/components/CreateLifeAreaModal.tsx"
git commit -m "feat(client): empty state, domain picker, create modal"
```

---

## Task 14: Client — Detail Drawer

**Files:**
- Create: `client/app/(pages)/life-areas/components/LifeAreaDetailDrawer.tsx`

- [ ] **Step 1: Write drawer**

```tsx
// client/app/(pages)/life-areas/components/LifeAreaDetailDrawer.tsx
'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Archive, Link2 } from 'lucide-react';
import type { LifeArea, LifeAreaLink } from '../types';

interface Props {
  area: LifeArea | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<LifeArea>) => Promise<LifeArea>;
  onArchive: (id: string) => Promise<void>;
  getDetail: (id: string) => Promise<{ area: LifeArea; links: LifeAreaLink[] }>;
  refresh: () => Promise<void>;
}

export function LifeAreaDetailDrawer({ area, onClose, onUpdate, onArchive, getDetail }: Props) {
  const [links, setLinks] = useState<LifeAreaLink[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!area) return;
    setName(area.display_name);
    void getDetail(area.id).then((d) => setLinks(d.links));
  }, [area, getDetail]);

  async function saveName() {
    if (!area || name === area.display_name) return;
    setSaving(true);
    try { await onUpdate(area.id, { display_name: name }); } finally { setSaving(false); }
  }

  return (
    <AnimatePresence>
      {area && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900/95 border-l border-white/10 backdrop-blur-xl p-6 overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">{area.domain_type}</p>
                <h2 className="text-2xl font-semibold text-white">{area.display_name}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  className="w-full rounded-lg bg-slate-950/50 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-blue-400/60"
                />
                {saving && <p className="text-xs text-slate-500 mt-1">Saving…</p>}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs uppercase tracking-wider text-slate-400">Linked Items</span>
                </div>
                {links.length === 0 ? (
                  <p className="text-sm text-slate-500">No goals, schedules, or contracts linked yet. When the coach creates them under this area, they'll appear here.</p>
                ) : (
                  <ul className="space-y-2">
                    {links.map((l) => (
                      <li key={l.id} className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                        <span className="capitalize text-slate-400 mr-2">{l.entity_type}</span>
                        <span className="font-mono text-xs">{l.entity_id.slice(0, 8)}…</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => onArchive(area.id)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
                >
                  <Archive className="w-4 h-4" />
                  Archive this area
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "client/app/(pages)/life-areas/components/LifeAreaDetailDrawer.tsx"
git commit -m "feat(client): life area detail drawer"
```

---

## Task 15: Client — Routing Chip in AI Coach

**Files:**
- Create: `client/components/ai-coach/RoutingChip.tsx`
- Create: `client/components/ai-coach/RoutingChipAlternatives.tsx`
- Modify: the ai-coach message renderer (see Step 1)

- [ ] **Step 1: Find where coach messages are rendered**

Search the codebase for the component that renders a single coach reply bubble. Likely candidates:
- `client/app/(pages)/dashboard/components/tabs/AICoachTab.tsx`
- `client/app/(pages)/chat/components/ChatMessageItem.tsx`

```bash
grep -rln "coach" "client/app/(pages)/dashboard/components/tabs/" | head
```
Identify the file where the server's coach reply payload is turned into JSX. Note the exact file.

- [ ] **Step 2: Write `RoutingChip.tsx`**

```tsx
// client/components/ai-coach/RoutingChip.tsx
'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check } from 'lucide-react';
import Link from 'next/link';
import { RoutingChipAlternatives } from './RoutingChipAlternatives';
import type { RoutingChip as ChipData } from '@/app/(pages)/life-areas/types';

interface Props {
  chip: ChipData;
  onReroute: (domainType: string) => Promise<void>;
}

export function RoutingChip({ chip, onReroute }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReroute(type: string) {
    setBusy(true);
    try { await onReroute(type); setOpen(false); } finally { setBusy(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 backdrop-blur px-3 py-1 text-xs text-slate-300"
    >
      <Check className="w-3 h-3 text-emerald-400" />
      <span>
        Added to{' '}
        <Link href="/life-areas" className="font-medium text-white hover:underline">
          {chip.lifeAreaName}
        </Link>
      </span>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
      >
        <Pencil className="w-3 h-3" />
        Change
      </button>
      {open && (
        <RoutingChipAlternatives alternatives={chip.alternatives} onPick={handleReroute} />
      )}
    </motion.div>
  );
}
```

- [ ] **Step 3: Write alternatives popover**

```tsx
// client/components/ai-coach/RoutingChipAlternatives.tsx
'use client';
import { motion } from 'framer-motion';

interface Props {
  alternatives: { type: string; displayName: string }[];
  onPick: (type: string) => Promise<void>;
}

export function RoutingChipAlternatives({ alternatives, onPick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute mt-8 z-10 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-2 shadow-2xl"
    >
      <ul className="min-w-[180px]">
        {alternatives.map((a) => (
          <li key={a.type}>
            <button
              onClick={() => onPick(a.type)}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-200 rounded-md hover:bg-white/5"
            >
              {a.displayName}
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
```

- [ ] **Step 4: Render the chip in the coach message renderer**

In the file identified in Step 1, import:
```tsx
import { RoutingChip } from '@/components/ai-coach/RoutingChip';
import { api } from '@/lib/api-client';
```

Where the coach reply is rendered (the bubble body), add after the message text:
```tsx
{message.routingChip && (
  <RoutingChip
    chip={message.routingChip}
    onReroute={async (domainType) => {
      // Phase 1: reroute simply re-creates under the chosen domain.
      // Full reroute endpoint is Phase 2. For now, open the life area for rename/relink.
      window.location.href = `/life-areas`;
    }}
  />
)}
```

Make sure the message type in that file includes `routingChip?: RoutingChip` (import from `@/app/(pages)/life-areas/types`). If the coach reply state is strongly typed, add the optional field in that type.

- [ ] **Step 5: Commit**

```bash
git add client/components/ai-coach/RoutingChip.tsx \
        client/components/ai-coach/RoutingChipAlternatives.tsx \
        <the-modified-coach-tab-file>
git commit -m "feat(client): routing chip in ai-coach replies"
```

(Replace `<the-modified-coach-tab-file>` with the actual path you modified.)

---

## Task 16: Add Sidebar Link

**Files:**
- Modify: `client/app/(pages)/dashboard/components/DashboardSidebar.tsx` (based on git status this file is already modified in working tree — check its current nav items)

- [ ] **Step 1: Add "Life Areas" nav item**

Open `client/app/(pages)/dashboard/components/DashboardSidebar.tsx`. Locate the array/list of nav items (typically objects like `{ label, href, icon }`). Add a new entry near other primary entries (e.g., after the AI Coach entry):

```tsx
{ label: 'Life Areas', href: '/life-areas', icon: Sparkles },
```

Make sure `Sparkles` (or whichever lucide icon) is imported at the top of the file.

- [ ] **Step 2: Verify in browser**

Run client:
```bash
cd client && npm run dev
```
Open `http://localhost:3000/life-areas`. Expected: hero + empty state, sidebar shows "Life Areas" item, nav highlights when active.

- [ ] **Step 3: Commit**

```bash
git add "client/app/(pages)/dashboard/components/DashboardSidebar.tsx"
git commit -m "feat(client): add Life Areas nav item"
```

---

## Task 17: End-to-End Smoke Test

**Files:**
- Create: `client/e2e/life-areas.spec.ts` (if Playwright config is in `client/` — otherwise wherever existing e2e tests live)

- [ ] **Step 1: Check existing e2e setup**

```bash
find client -name "playwright.config*" -not -path "*node_modules*"
```
If a config exists, place the test next to existing `*.spec.ts` files. If no Playwright is set up in this repo, skip Steps 2-4 and do the manual verification in Step 5 only.

- [ ] **Step 2: Write e2e test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Life Areas — Phase 1', () => {
  test('user can create a life area via UI', async ({ page }) => {
    await page.goto('/life-areas');
    await page.getByRole('button', { name: /new area/i }).click();
    await page.getByRole('button', { name: /career/i }).click();
    await page.getByPlaceholder(/e.g./i).fill('Job Hunt 2026');
    await page.getByRole('button', { name: /create area/i }).click();
    await expect(page.getByText('Job Hunt 2026')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run e2e test**

```bash
cd client && npx playwright test life-areas.spec.ts
```
Expected: PASS.

- [ ] **Step 4: Manual verification**

In a real session:
1. Sign in. Navigate to `/life-areas`. Empty state shown.
2. Click "New Area" → pick Career → name "Job Hunt" → Create. Card appears.
3. Click card → drawer opens with name editor, empty links, Archive action.
4. Rename → close drawer → card updates.
5. Archive → card disappears from grid.
6. Navigate to `/ai-coach`. Send: *"I've been lazy about applying to jobs"*.
7. Coach replies. A chip appears: *"Added to Career · Change"*. Chip link navigates to `/life-areas`.
8. Verify in DB: `SELECT slug, display_name, domain_type FROM life_areas;` — new auto-created career area present.

- [ ] **Step 5: Commit**

```bash
git add client/e2e/life-areas.spec.ts 2>/dev/null || true
git commit -m "test(e2e): life areas Phase 1 smoke test" --allow-empty
```

---

## Task 18: Phase 1 Docs Update

**Files:**
- Modify: `PRODUCTS/yhealth-app/PROGRESS-DEV.md` (create if missing)

- [ ] **Step 1: Append a Phase 1 milestone entry**

Add an entry summarizing:
- What shipped: life areas backend + UI + intent-router chip.
- What's deferred to Phase 2: unified follow-up orchestrator (chat+check-in+push).
- Links to the spec and this plan.

Example block to append:
```markdown
## 2026-04-15 — Universal Self-Improvement Phase 1

**Shipped:**
- `life_areas` + `life_area_links` tables, domain registry (8 domains; career flagship)
- `/api/life-areas` CRUD + linking; `/api/life-areas/domains`
- AI coach intent router: auto-creates or matches an existing life area on self-improvement messages and attaches a `routingChip` to the reply
- `/life-areas` hub page with hero, grid, create modal, detail drawer
- Routing chip UI in the AI coach message bubble

**Deferred:**
- Unified follow-up orchestrator (Phase 2)
- `/career` flagship + `career_artifacts` (Phase 3)
- Structured preference persistence from chat heuristics (Phase 4)

**Refs:**
- Spec: `docs/superpowers/specs/2026-04-15-universal-self-improvement-design.md`
- Plan: `docs/superpowers/plans/2026-04-15-universal-self-improvement-phase1.md`
```

- [ ] **Step 2: Commit**

```bash
git add PRODUCTS/yhealth-app/PROGRESS-DEV.md
git commit -m "docs: record Phase 1 universal self-improvement milestone"
```

---

## Self-Review

**Spec coverage (§ → Task):**
- §1 Architecture: reuse of existing primitives → Tasks 1-2 + link table + router reuses lifeAreasService.
- §2 Data model: `life_areas` (T1), `life_area_links` (T2), registry (T3). `career_artifacts` is Phase 3 (out of scope for this plan — explicitly).
- §3 Coach loop mechanics — intent routing + chip (T6, T9, T15). Unified follow-up and adaptive preferences are Phase 2/4.
- §4 API surface — life-areas routes (T7-T8). Career routes are Phase 3.
- §5 Frontend — `/life-areas` page (T10-T14, T16). `/career` is Phase 3.
- §6 Error handling: router fails-soft (T6 step 3), service handles 23505 (T5), controller maps errors (T7), UUID param guard (T8).
- §7 Testing: service tests (T5), router tests (T6), e2e smoke (T17).
- §8 Phasing: this plan = Phase 1 only. Explicitly stated above.
- §9 Out of scope: matches the Phase 1 scope boundary.
- §10 References: task numbers use existing patterns from `accountability-contract.*`.

**Type consistency check:** `LifeArea`, `LifeAreaLink`, `LifeAreaDomain`, `RoutingChip`, `LifeAreaDomainType` used identically across server (T3, T5, T6) and client (T10, T15). `RoutingChip` server-side returns `lifeAreaId`, `lifeAreaName`, `domainType`, `wasAutoCreated`, `alternatives` — client type matches.

**Placeholder scan:** No "TBD", "handle edge cases", or "similar to Task N". Two places leave room for judgment: Task 9 Step 2 says "use the project's existing LLM client" (explicit because I couldn't verify the exact helper name without reading further), and Task 15 Step 1 says "find the coach message renderer" (same reason). Both include concrete grep commands and explicit signals to identify the right file. These are expected lookups, not placeholders.

**Known open questions for the executor (document in PR):**
- LLM helper name in `ai-coach.controller.ts` — match whatever is already imported there.
- Exact coach-message-bubble file — identified by grep in T15.
- Full reroute endpoint is Phase 2 — T15's chip currently just navigates to `/life-areas`.
