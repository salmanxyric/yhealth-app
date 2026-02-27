# Health Tracking Enhancement - System Architecture Design

## Status: PROPOSED
## Date: 2025-12-30

---

## 1. Research Summary

### Existing Infrastructure Analyzed

| Component | Status | Notes |
|-----------|--------|-------|
| PostgreSQL Database | Active | 17 tables defined, modular schema approach |
| Cloudflare R2 | Implemented | Full CRUD, signed URLs, 20MB limit |
| AI Coach Service | Implemented | LangChain + OpenAI, image analysis capable |
| Notification Service | Implemented | Multi-type support, priority levels |
| Cache Service | Implemented | NodeCache, pattern-based invalidation |
| Activity Logs | Scaffolded | Basic structure, needs enhancement |
| Diet/Meal Plans | Scaffolded | Weekly structure, macro tracking |

### Current Database Tables

```
users                    - Core user accounts
user_goals               - SMART goals with milestones
user_plans               - AI-generated health plans
user_preferences         - Coaching style, notifications
activity_logs            - Daily activity tracking
diet_plans               - Nutrition plans (scaffolded)
meal_logs                - Meal tracking (scaffolded)
ai_coach_sessions        - Chat history, insights
notifications            - Multi-channel notifications
```

### Architecture Pattern: Modular Monolith

The current codebase follows a modular monolith pattern with:
- Service layer (singleton pattern)
- Controller layer (Express routes)
- Shared types package
- PostgreSQL with raw SQL migrations

**Decision**: Continue with modular monolith. No evidence for microservices extraction.

---

## 2. Entity Relationship Diagram

```
                                    ┌─────────────────────┐
                                    │       users         │
                                    │─────────────────────│
                                    │ id (PK)             │
                                    │ email               │
                                    │ onboarding_status   │
                                    └──────────┬──────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        │                  │                   │                   │                  │
        ▼                  ▼                   ▼                   ▼                  ▼
┌───────────────┐  ┌───────────────┐   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  user_body_   │  │ user_gamifi-  │   │   exercise_   │  │ user_workout_ │  │ progress_     │
│   analysis    │  │   cation      │   │   library     │  │    plans      │  │   photos      │
│───────────────│  │───────────────│   │───────────────│  │───────────────│  │───────────────│
│ id (PK)       │  │ id (PK)       │   │ id (PK)       │  │ id (PK)       │  │ id (PK)       │
│ user_id (FK)  │  │ user_id (FK)  │   │ name          │  │ user_id (FK)  │  │ user_id (FK)  │
│ photos (JSONB)│  │ total_xp      │   │ muscle_groups │  │ goal_id (FK)  │  │ photo_key     │
│ analysis      │  │ level         │   │ difficulty    │  │ current_week  │  │ photo_type    │
│ analyzed_at   │  │ current_streak│   │ equipment     │  │ progression   │  │ measurements  │
└───────────────┘  │ achievements  │   │ instructions  │  │ activities    │  │ ai_analysis   │
        │          └───────────────┘   └───────────────┘  └───────────────┘  └───────────────┘
        │                  │                   │                   │                  │
        │                  │                   │                   │                  │
        ▼                  ▼                   ▼                   ▼                  ▼
┌───────────────┐  ┌───────────────┐   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ body_analysis │  │  xp_events    │   │ workout_sets  │  │ workout_logs  │  │ (links to R2) │
│   _history    │  │───────────────│   │───────────────│  │───────────────│  │               │
│───────────────│  │ id (PK)       │   │ id (PK)       │  │ id (PK)       │  │  Cloudflare   │
│ id (PK)       │  │ user_id (FK)  │   │ workout_id    │  │ user_id (FK)  │  │     R2        │
│ analysis_id   │  │ event_type    │   │ exercise_id   │  │ plan_id (FK)  │  │               │
│ snapshot_date │  │ xp_amount     │   │ set_number    │  │ sets_data     │  │               │
│ metrics       │  │ description   │   │ target_reps   │  │ performance   │  │               │
└───────────────┘  └───────────────┘   │ target_weight │  │ difficulty    │  │               │
                                       │ rest_seconds  │  │ ai_adjustment │  │               │
                           ┌───────────┴───────────────┴──┴───────────────┘  └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  achievement  │
                   │ _definitions  │
                   │───────────────│
                   │ id (PK)       │
                   │ code          │
                   │ name          │
                   │ xp_reward     │
                   │ tier          │
                   │ criteria      │
                   └───────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ user_achieve- │
                   │    ments      │
                   │───────────────│
                   │ id (PK)       │
                   │ user_id (FK)  │
                   │ achievement_id│
                   │ unlocked_at   │
                   │ progress      │
                   └───────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            NUTRITION DOMAIN (Extends Existing)                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐       │
│  │ food_library  │     │  diet_plans   │     │  meal_logs    │     │ daily_routine │       │
│  │ (NEW)         │     │ (EXISTS)      │     │ (EXISTS)      │     │ _checkboxes   │       │
│  │───────────────│     │───────────────│     │───────────────│     │───────────────│       │
│  │ id (PK)       │     │ + regenerate  │     │ + food_ids    │     │ id (PK)       │       │
│  │ name          │     │   _trigger    │     │ + photo_key   │     │ user_id (FK)  │       │
│  │ calories      │     │ + difficulty  │     │ + ai_analysis │     │ date          │       │
│  │ macros        │     │   _level      │     │               │     │ items (JSONB) │       │
│  │ serving_size  │     │               │     │               │     │ completed     │       │
│  │ category      │     └───────────────┘     └───────────────┘     └───────────────┘       │
│  │ verified      │                                                                          │
│  └───────────────┘                                                                          │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Table Schemas

### 3.1 Body Analysis Tables

```sql
-- ============================================
-- BODY ANALYSIS TABLES
-- ============================================

-- Stores current body analysis for each user
CREATE TABLE user_body_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Photo references (stored in R2)
    photos JSONB NOT NULL DEFAULT '{}',  -- {front: key, back: key, left: key, right: key}

    -- AI Analysis Results
    body_composition JSONB,  -- {estimated_bf_pct, muscle_mass, body_type}
    posture_analysis JSONB,  -- {issues: [], recommendations: []}
    fitness_assessment JSONB,  -- {level: 'beginner'|'intermediate'|'advanced', score: 0-100}

    -- Derived Metrics
    estimated_body_fat_pct FLOAT,
    estimated_muscle_mass_pct FLOAT,
    body_type VARCHAR(50),  -- ectomorph, mesomorph, endomorph
    fitness_level VARCHAR(20),  -- beginner, intermediate, advanced

    -- Processing Status
    analysis_status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    analyzed_at TIMESTAMP,
    analysis_model VARCHAR(50),  -- GPT-4 Vision, etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_body_analysis UNIQUE(user_id)
);

-- Historical snapshots for progress tracking
CREATE TABLE body_analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body_analysis_id UUID REFERENCES user_body_analysis(id) ON DELETE SET NULL,

    -- Snapshot date
    snapshot_date DATE NOT NULL,

    -- Copied metrics for historical record
    photos JSONB NOT NULL,
    body_composition JSONB,
    estimated_body_fat_pct FLOAT,
    estimated_muscle_mass_pct FLOAT,
    fitness_level VARCHAR(20),

    -- Comparison to previous
    changes JSONB,  -- {bf_pct_change: -2.5, muscle_change: +1.2}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_snapshot_date UNIQUE(user_id, snapshot_date)
);

-- Indexes
CREATE INDEX idx_body_analysis_user ON user_body_analysis(user_id);
CREATE INDEX idx_body_analysis_history_user_date ON body_analysis_history(user_id, snapshot_date DESC);
```

### 3.2 Progress Photos Table

```sql
-- ============================================
-- PROGRESS PHOTOS TABLE
-- ============================================

CREATE TYPE photo_type AS ENUM ('front', 'back', 'left', 'right', 'custom');
CREATE TYPE photo_category AS ENUM ('onboarding', 'weekly', 'milestone', 'comparison');

CREATE TABLE progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- R2 Storage
    photo_key VARCHAR(500) NOT NULL,  -- R2 key
    thumbnail_key VARCHAR(500),  -- Optional thumbnail

    -- Categorization
    photo_type photo_type NOT NULL,
    category photo_category NOT NULL DEFAULT 'weekly',

    -- Measurements at time of photo (optional)
    measurements JSONB,  -- {weight_kg, waist_cm, chest_cm, etc.}

    -- AI Analysis (optional, async)
    ai_analysis JSONB,
    analyzed_at TIMESTAMP,

    -- Metadata
    taken_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_progress_photos_user_date ON progress_photos(user_id, taken_at DESC);
CREATE INDEX idx_progress_photos_user_type ON progress_photos(user_id, photo_type, category);
```

### 3.3 Exercise Library Tables

```sql
-- ============================================
-- EXERCISE LIBRARY TABLES
-- ============================================

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE muscle_group AS ENUM (
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'forearms', 'core', 'quads', 'hamstrings', 'glutes',
    'calves', 'full_body', 'cardio'
);
CREATE TYPE equipment_type AS ENUM (
    'none', 'dumbbells', 'barbell', 'kettlebell', 'resistance_band',
    'cable_machine', 'pull_up_bar', 'bench', 'machine', 'cardio_equipment'
);

CREATE TABLE exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,

    -- Categorization
    primary_muscle muscle_group NOT NULL,
    secondary_muscles muscle_group[] DEFAULT '{}',
    difficulty difficulty_level NOT NULL,
    equipment equipment_type[] DEFAULT '{none}',

    -- Execution Details
    instructions TEXT[],  -- Step by step
    tips TEXT[],
    common_mistakes TEXT[],

    -- Media
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    animation_url VARCHAR(500),

    -- Metrics
    calories_per_minute FLOAT,  -- Estimated
    met_value FLOAT,  -- Metabolic Equivalent

    -- Progression
    easier_alternatives UUID[],  -- FK to other exercises
    harder_alternatives UUID[],

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercise variations (e.g., narrow grip vs wide grip)
CREATE TABLE exercise_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty_modifier INTEGER DEFAULT 0,  -- -1 easier, 0 same, +1 harder

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_exercise_library_muscle ON exercise_library(primary_muscle);
CREATE INDEX idx_exercise_library_difficulty ON exercise_library(difficulty);
CREATE INDEX idx_exercise_library_equipment ON exercise_library USING GIN(equipment);
CREATE INDEX idx_exercise_library_slug ON exercise_library(slug);
```

### 3.4 Workout Plan Tables (Enhanced)

```sql
-- ============================================
-- WORKOUT PLAN TABLES
-- ============================================

CREATE TABLE user_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES user_goals(id) ON DELETE SET NULL,

    -- Plan Metadata
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Duration & Status
    duration_weeks INTEGER NOT NULL DEFAULT 4,
    current_week INTEGER DEFAULT 1,
    status plan_status DEFAULT 'active',

    -- Difficulty Management
    base_difficulty difficulty_level NOT NULL,
    current_difficulty difficulty_level NOT NULL,
    auto_adjust_difficulty BOOLEAN DEFAULT true,

    -- Progression Settings
    progression_rules JSONB DEFAULT '{}',  -- {reps_increment: 2, weight_increment_pct: 5}
    deload_after_weeks INTEGER DEFAULT 4,

    -- Weekly Structure
    workouts_per_week INTEGER DEFAULT 3,
    rest_days day_of_week[] DEFAULT '{sunday}',

    -- AI Generation Metadata
    ai_generated BOOLEAN DEFAULT true,
    ai_model VARCHAR(50),
    generation_params JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual workout sessions within a plan
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_plan_id UUID NOT NULL REFERENCES user_workout_plans(id) ON DELETE CASCADE,

    -- Scheduling
    week_number INTEGER NOT NULL,
    day_of_week day_of_week NOT NULL,
    session_order INTEGER DEFAULT 1,  -- For multiple sessions per day

    -- Session Details
    name VARCHAR(200) NOT NULL,  -- e.g., "Upper Body A", "Leg Day"
    focus muscle_group[],  -- Primary muscles targeted
    estimated_duration INTEGER,  -- Minutes

    -- Warm-up & Cool-down
    warmup_instructions TEXT[],
    cooldown_instructions TEXT[],

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sets within a workout session
CREATE TABLE workout_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id),

    -- Order
    exercise_order INTEGER NOT NULL,
    set_number INTEGER NOT NULL,

    -- Targets
    target_reps INTEGER,
    target_reps_min INTEGER,  -- For rep ranges
    target_reps_max INTEGER,
    target_weight_kg FLOAT,
    target_weight_pct_1rm FLOAT,  -- Alternative: percentage of 1RM
    target_duration_seconds INTEGER,  -- For timed exercises
    target_distance_meters FLOAT,  -- For cardio

    -- Rest
    rest_seconds INTEGER DEFAULT 60,

    -- Notes
    notes TEXT,
    is_warmup_set BOOLEAN DEFAULT false,
    is_drop_set BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workout_plans_user_status ON user_workout_plans(user_id, status);
CREATE INDEX idx_workout_sessions_plan ON workout_sessions(workout_plan_id, week_number, day_of_week);
CREATE INDEX idx_workout_sets_session ON workout_sets(session_id, exercise_order, set_number);
```

### 3.5 Workout Logging Tables

```sql
-- ============================================
-- WORKOUT LOGGING TABLES
-- ============================================

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_plan_id UUID REFERENCES user_workout_plans(id) ON DELETE SET NULL,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,

    -- When
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,

    -- Duration
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,

    -- Overall Performance
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),  -- RPE
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
    mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
    mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),

    -- Completion Status
    completion_percentage FLOAT DEFAULT 0,
    sets_completed INTEGER DEFAULT 0,
    sets_skipped INTEGER DEFAULT 0,

    -- Notes & AI Feedback
    user_notes TEXT,
    ai_feedback TEXT,
    ai_difficulty_adjustment INTEGER,  -- Suggested adjustment: -1, 0, +1

    -- XP Earned
    xp_earned INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual set logs
CREATE TABLE workout_set_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    workout_set_id UUID REFERENCES workout_sets(id) ON DELETE SET NULL,
    exercise_id UUID NOT NULL REFERENCES exercise_library(id),

    -- Set Details
    set_number INTEGER NOT NULL,

    -- Actual Performance
    actual_reps INTEGER,
    actual_weight_kg FLOAT,
    actual_duration_seconds INTEGER,
    actual_distance_meters FLOAT,

    -- Target vs Actual
    target_reps INTEGER,
    target_weight_kg FLOAT,

    -- Performance Indicators
    reps_in_reserve INTEGER,  -- RIR (0 = failure)
    form_quality INTEGER CHECK (form_quality BETWEEN 1 AND 5),

    -- Status
    completed BOOLEAN DEFAULT false,
    skipped BOOLEAN DEFAULT false,

    -- Timestamps
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, started_at DESC);
CREATE INDEX idx_workout_logs_plan ON workout_logs(workout_plan_id, started_at DESC);
CREATE INDEX idx_workout_set_logs_log ON workout_set_logs(workout_log_id, set_number);
CREATE INDEX idx_workout_set_logs_exercise ON workout_set_logs(exercise_id, completed_at DESC);
```

### 3.6 Gamification Tables

```sql
-- ============================================
-- GAMIFICATION TABLES
-- ============================================

CREATE TYPE achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE xp_event_type AS ENUM (
    'workout_completed', 'streak_maintained', 'goal_milestone',
    'achievement_unlocked', 'meal_logged', 'perfect_week',
    'first_workout', 'personal_record', 'consistency_bonus'
);

-- User's gamification state (singleton per user)
CREATE TABLE user_gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- XP & Level
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 100,

    -- Streaks
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_start_date DATE,
    last_activity_date DATE,
    streak_freeze_available INTEGER DEFAULT 1,  -- "Freeze" days

    -- Statistics
    total_workouts INTEGER DEFAULT 0,
    total_workout_minutes INTEGER DEFAULT 0,
    total_meals_logged INTEGER DEFAULT 0,
    perfect_weeks INTEGER DEFAULT 0,

    -- Level History
    level_history JSONB DEFAULT '[]',  -- [{level, achieved_at, xp}]

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_gamification UNIQUE(user_id)
);

-- Achievement definitions (system table)
CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),

    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    tier achievement_tier NOT NULL,

    -- Criteria (JSON for flexibility)
    criteria_type VARCHAR(50) NOT NULL,  -- 'streak', 'workout_count', 'weight_lifted', etc.
    criteria JSONB NOT NULL,  -- {target_value: 7, comparison: 'gte'}

    -- Display
    is_hidden BOOLEAN DEFAULT false,  -- Hidden until unlocked
    is_repeatable BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's unlocked achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,

    -- Unlock Status
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- For repeatable achievements
    unlock_count INTEGER DEFAULT 1,

    -- Progress (for partial achievements)
    progress FLOAT DEFAULT 100,  -- 0-100
    progress_data JSONB,  -- Current state for criteria

    -- XP granted
    xp_granted INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- XP Transaction Log
CREATE TABLE xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Event Details
    event_type xp_event_type NOT NULL,
    xp_amount INTEGER NOT NULL,
    description VARCHAR(500),

    -- References
    related_entity_type VARCHAR(50),  -- 'workout_log', 'achievement', etc.
    related_entity_id UUID,

    -- Balance
    xp_before INTEGER NOT NULL,
    xp_after INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id, unlocked_at DESC);
CREATE INDEX idx_xp_events_user_date ON xp_events(user_id, created_at DESC);
CREATE INDEX idx_achievement_definitions_code ON achievement_definitions(code);
```

### 3.7 Daily Routine Checkboxes

```sql
-- ============================================
-- DAILY ROUTINE CHECKBOXES
-- ============================================

CREATE TABLE daily_routine_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Routine Items
    items JSONB NOT NULL DEFAULT '[]',
    -- [{id, title, time, category, is_required, reminder_enabled}]

    -- Active Period
    active_from TIME,  -- When routine starts
    active_to TIME,    -- When routine ends

    -- Days Active
    active_days day_of_week[] DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}',

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_routine_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES daily_routine_templates(id) ON DELETE SET NULL,

    -- Date
    log_date DATE NOT NULL,

    -- Completion Data
    items JSONB NOT NULL DEFAULT '[]',
    -- [{id, title, completed, completed_at, skipped, notes}]

    -- Summary
    total_items INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0,

    -- XP
    xp_earned INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_routine_date UNIQUE(user_id, log_date)
);

-- Indexes
CREATE INDEX idx_daily_routine_templates_user ON daily_routine_templates(user_id, is_active);
CREATE INDEX idx_daily_routine_logs_user_date ON daily_routine_logs(user_id, log_date DESC);
```

### 3.8 Food Library Extension

```sql
-- ============================================
-- FOOD LIBRARY TABLE
-- ============================================

CREATE TYPE food_category AS ENUM (
    'protein', 'carbohydrate', 'vegetable', 'fruit', 'dairy',
    'fat', 'beverage', 'snack', 'condiment', 'supplement'
);

CREATE TABLE food_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(50),

    -- Categorization
    category food_category NOT NULL,
    tags VARCHAR(50)[] DEFAULT '{}',

    -- Serving Info
    serving_size FLOAT NOT NULL,
    serving_unit VARCHAR(50) NOT NULL,  -- 'g', 'ml', 'piece', 'cup'

    -- Macros per serving
    calories INTEGER NOT NULL,
    protein_g FLOAT DEFAULT 0,
    carbs_g FLOAT DEFAULT 0,
    fat_g FLOAT DEFAULT 0,
    fiber_g FLOAT DEFAULT 0,
    sugar_g FLOAT DEFAULT 0,
    sodium_mg FLOAT DEFAULT 0,

    -- Additional Nutrients (optional)
    nutrients JSONB DEFAULT '{}',

    -- Dietary Flags
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_halal BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    allergens VARCHAR(50)[] DEFAULT '{}',

    -- Source
    is_verified BOOLEAN DEFAULT false,
    source VARCHAR(100),  -- 'USDA', 'user_submitted', etc.

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's custom foods
CREATE TABLE user_custom_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES food_library(id) ON DELETE SET NULL,

    -- If custom (not from library)
    name VARCHAR(200),
    calories INTEGER,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    serving_size FLOAT,
    serving_unit VARCHAR(50),

    -- Favorite status
    is_favorite BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_food_library_category ON food_library(category);
CREATE INDEX idx_food_library_name ON food_library(name);
CREATE INDEX idx_food_library_barcode ON food_library(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_user_custom_foods_user ON user_custom_foods(user_id, is_favorite);
```

---

## 4. Service Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    API LAYER (Express)                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Auth     │  │ Onboard  │  │ Workout  │  │ Nutrition│  │ Progress │  │ Gamify   │       │
│  │ Routes   │  │ Routes   │  │ Routes   │  │ Routes   │  │ Routes   │  │ Routes   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼──────────────┘
        │             │             │             │             │             │
        ▼             ▼             ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   SERVICE LAYER                                             │
│                                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ Body Analysis   │    │ Workout Plan    │    │ Nutrition       │    │ Gamification    │  │
│  │ Service         │    │ Service         │    │ Service         │    │ Service         │  │
│  │─────────────────│    │─────────────────│    │─────────────────│    │─────────────────│  │
│  │ analyzePhotos() │    │ generatePlan()  │    │ generateMealPlan│    │ awardXP()       │  │
│  │ getProgress()   │    │ adjustDiff()    │    │ logMeal()       │    │ checkAchieve()  │  │
│  │ compare()       │    │ logWorkout()    │    │ analyzePhoto()  │    │ updateStreak()  │  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                      │                      │                      │           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                         │
│  │ Progress Photo  │    │ Exercise        │    │ Daily Routine   │                         │
│  │ Service         │    │ Library Service │    │ Service         │                         │
│  │─────────────────│    │─────────────────│    │─────────────────│                         │
│  │ uploadPhoto()   │    │ getExercises()  │    │ createTemplate()│                         │
│  │ generateComp()  │    │ searchByMuscle()│    │ logCompletion() │                         │
│  │ createTimeline()│    │ getAlternatives()   │ getToday()      │                         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘                         │
│           │                      │                      │                                   │
└───────────┼──────────────────────┼──────────────────────┼───────────────────────────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               INFRASTRUCTURE LAYER                                          │
│                                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │ AI Coach        │    │ R2 Storage      │    │ Cache           │    │ Queue           │  │
│  │ Service         │    │ Service         │    │ Service         │    │ Service (NEW)   │  │
│  │ (EXISTS)        │    │ (EXISTS)        │    │ (EXISTS)        │    │                 │  │
│  │─────────────────│    │─────────────────│    │─────────────────│    │─────────────────│  │
│  │ analyzeImage()  │    │ upload()        │    │ get/set()       │    │ addJob()        │  │
│  │ generatePlan()  │    │ getSignedUrl()  │    │ getOrSet()      │    │ processJob()    │  │
│  │ chat()          │    │ delete()        │    │ invalidate()    │    │ getStatus()     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                                                │
│  │ Notification    │    │ Database        │                                                │
│  │ Service         │    │ Service         │                                                │
│  │ (EXISTS)        │    │ (pg.ts)         │                                                │
│  └─────────────────┘    └─────────────────┘                                                │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility | Dependencies |
|---------|---------------|--------------|
| BodyAnalysisService | Coordinate photo upload, trigger AI analysis, store results | R2, AICoach, Cache |
| WorkoutPlanService | Generate plans, adjust difficulty, track progression | AICoach, ExerciseLibrary, Gamification |
| NutritionService | Meal plans, food logging, calorie tracking | AICoach, FoodLibrary (extends existing) |
| GamificationService | XP, levels, streaks, achievements | Notification, Cache |
| ProgressPhotoService | Upload, organize, generate comparisons | R2, AICoach |
| ExerciseLibraryService | CRUD exercises, search, alternatives | Cache |
| DailyRoutineService | Templates, logging, completion tracking | Gamification |
| QueueService (NEW) | Async job processing for AI tasks | BullMQ/Agenda |

---

## 5. API Design Patterns

### 5.1 RESTful Endpoints

```
# Body Analysis
POST   /api/v1/body-analysis/photos      # Upload 4 body photos
GET    /api/v1/body-analysis             # Get current analysis
GET    /api/v1/body-analysis/history     # Get historical snapshots
POST   /api/v1/body-analysis/compare     # Compare two dates

# Workout Plans
POST   /api/v1/workout-plans             # Generate new plan
GET    /api/v1/workout-plans             # List user's plans
GET    /api/v1/workout-plans/:id         # Get plan details
PUT    /api/v1/workout-plans/:id         # Update plan settings
GET    /api/v1/workout-plans/:id/today   # Get today's workout
POST   /api/v1/workout-plans/:id/adjust  # Trigger difficulty adjustment

# Workout Logging
POST   /api/v1/workouts                  # Start a workout
PUT    /api/v1/workouts/:id              # Update workout (add sets)
POST   /api/v1/workouts/:id/complete     # Complete workout
GET    /api/v1/workouts/history          # Workout history

# Exercises
GET    /api/v1/exercises                 # List/search exercises
GET    /api/v1/exercises/:id             # Get exercise details
GET    /api/v1/exercises/:id/alternatives# Get easier/harder alternatives

# Progress Photos
POST   /api/v1/progress-photos           # Upload photo
GET    /api/v1/progress-photos           # List photos
GET    /api/v1/progress-photos/compare   # Side-by-side comparison
GET    /api/v1/progress-photos/timeline  # Photo timeline view

# Gamification
GET    /api/v1/gamification              # Get user's XP, level, streak
GET    /api/v1/gamification/achievements # List achievements (locked/unlocked)
GET    /api/v1/gamification/leaderboard  # Optional: friends leaderboard
POST   /api/v1/gamification/streak-freeze# Use a streak freeze

# Daily Routines
POST   /api/v1/routines                  # Create routine template
GET    /api/v1/routines                  # List templates
GET    /api/v1/routines/today            # Get today's checklist
POST   /api/v1/routines/today/complete   # Mark items complete
GET    /api/v1/routines/history          # Completion history
```

### 5.2 Request/Response Patterns

```typescript
// Standard paginated response
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Standard error response
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Async job response (for AI operations)
interface AsyncJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: number; // seconds
  resultUrl?: string; // Where to poll for result
}
```

---

## 6. Caching Strategy

### Cache Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│                         CACHE TIERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tier 1: Hot Data (NodeCache - Memory)     TTL: 5-60 minutes   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • User's current workout plan                           │   │
│  │ • Today's activities/routines                           │   │
│  │ • User gamification state                               │   │
│  │ • Active diet plan                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Tier 2: Warm Data (NodeCache - Memory)    TTL: 1-24 hours     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Exercise library (rarely changes)                     │   │
│  │ • Achievement definitions                               │   │
│  │ • Food library (verified items)                         │   │
│  │ • User preferences                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Tier 3: Computed Data (NodeCache)         TTL: 15-60 minutes  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • Weekly statistics aggregations                        │   │
│  │ • Progress charts data                                  │   │
│  │ • Leaderboard positions                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Key Conventions

```typescript
// Extended cache keys
export const cacheKeys = {
  // Existing
  user: (id: string) => `user:${id}`,

  // Body Analysis
  bodyAnalysis: (userId: string) => `body-analysis:${userId}`,
  bodyAnalysisHistory: (userId: string, limit: number) =>
    `body-analysis:${userId}:history:${limit}`,

  // Workout
  workoutPlan: (planId: string) => `workout-plan:${planId}`,
  todayWorkout: (userId: string, date: string) =>
    `workout:${userId}:today:${date}`,

  // Gamification
  gamification: (userId: string) => `gamification:${userId}`,
  achievements: (userId: string) => `achievements:${userId}`,
  leaderboard: (scope: string, limit: number) =>
    `leaderboard:${scope}:${limit}`,

  // Routine
  todayRoutine: (userId: string, date: string) =>
    `routine:${userId}:today:${date}`,

  // Libraries (longer TTL)
  exerciseLibrary: () => `exercise-library`,
  exercisesByMuscle: (muscle: string) => `exercises:muscle:${muscle}`,
  foodLibrary: (category: string) => `food-library:${category}`,
  achievementDefs: () => `achievement-definitions`,

  // Stats
  weeklyStats: (userId: string, week: string) =>
    `stats:${userId}:weekly:${week}`,
  progressChart: (userId: string, range: string) =>
    `chart:${userId}:progress:${range}`,
};
```

### Cache Invalidation Triggers

| Event | Caches to Invalidate |
|-------|---------------------|
| Workout logged | `todayWorkout`, `weeklyStats`, `gamification` |
| Achievement unlocked | `achievements`, `gamification` |
| Plan updated | `workoutPlan`, `todayWorkout` |
| Routine completed | `todayRoutine`, `gamification` |
| Body analysis updated | `bodyAnalysis`, `bodyAnalysisHistory` |

---

## 7. Background Job Requirements

### Job Types

```typescript
type JobType =
  | 'body_photo_analysis'     // Analyze 4 body photos (10-30s)
  | 'workout_plan_generation' // Generate new workout plan (5-15s)
  | 'meal_plan_generation'    // Generate meal plan (5-15s)
  | 'progress_photo_analysis' // Analyze single progress photo (5-10s)
  | 'food_photo_analysis'     // Analyze meal photo (5-10s)
  | 'difficulty_adjustment'   // Recalculate difficulty (1-3s)
  | 'streak_check'            // Daily streak maintenance (< 1s)
  | 'achievement_check'       // Check achievement criteria (< 1s)
  | 'weekly_report'           // Generate weekly summary (2-5s)
  | 'data_aggregation'        // Compute statistics (1-5s);
```

### Processing Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOB PROCESSING                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Option A: In-Process (Current Scale)                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐              │ │
│  │  │ API      │────▶│ Promise  │────▶│ AI Coach │              │ │
│  │  │ Request  │     │ Queue    │     │ Service  │              │ │
│  │  └──────────┘     └──────────┘     └──────────┘              │ │
│  │                                                               │ │
│  │  Pros: Simple, no extra infra                                 │ │
│  │  Cons: Blocks Node.js event loop for long tasks               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Option B: BullMQ + Redis (Recommended at 1K+ users)               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────┐ │ │
│  │  │ API      │────▶│ BullMQ   │────▶│ Worker   │────▶│Redis │ │ │
│  │  │ Request  │     │ Queue    │     │ Process  │     │Store │ │ │
│  │  └──────────┘     └──────────┘     └──────────┘     └──────┘ │ │
│  │                                                               │ │
│  │  Pros: Non-blocking, retry, scheduling, monitoring            │ │
│  │  Cons: Adds Redis dependency                                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  RECOMMENDATION: Start with Option A, extract when needed          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Immediate Implementation (Option A)

```typescript
// Simple in-process async job handler
class SimpleJobQueue {
  private jobs: Map<string, JobStatus> = new Map();

  async enqueue<T>(
    type: JobType,
    data: T,
    handler: (data: T) => Promise<unknown>
  ): Promise<string> {
    const jobId = uuid();
    this.jobs.set(jobId, { status: 'processing', startedAt: new Date() });

    // Fire and forget - don't await
    handler(data)
      .then(result => {
        this.jobs.set(jobId, {
          status: 'completed',
          result,
          completedAt: new Date()
        });
      })
      .catch(error => {
        this.jobs.set(jobId, {
          status: 'failed',
          error: error.message,
          failedAt: new Date()
        });
      });

    return jobId;
  }

  getStatus(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId);
  }
}
```

---

## 8. AI Integration Points

### 8.1 Image Analysis Triggers

| Trigger Point | Analysis Type | Async? | Cache? |
|---------------|---------------|--------|--------|
| Onboarding (4 photos) | Full body composition | Yes | 24h |
| Monthly check-in | Body comparison | Yes | 24h |
| Meal photo upload | Nutritional estimate | Yes | No |
| Progress photo | Visual comparison | Yes | No |

### 8.2 Adaptive Difficulty Algorithm

```typescript
interface DifficultyAdjustmentInput {
  recentWorkouts: WorkoutLog[];  // Last 3-5 workouts
  completionRates: number[];     // % of sets completed
  rpeScores: number[];           // Rate of Perceived Exertion
  restTimes: number[];           // Actual vs planned rest
  formQuality: number[];         // If tracked
}

function calculateDifficultyAdjustment(input: DifficultyAdjustmentInput): -1 | 0 | 1 {
  const avgCompletion = average(input.completionRates);
  const avgRPE = average(input.rpeScores);

  // Too easy: High completion + Low RPE
  if (avgCompletion > 95 && avgRPE < 6) {
    return 1; // Increase difficulty
  }

  // Too hard: Low completion + High RPE
  if (avgCompletion < 70 || avgRPE > 9) {
    return -1; // Decrease difficulty
  }

  // Just right
  return 0;
}
```

### 8.3 Meal Plan Regeneration Triggers

```typescript
const REGENERATION_TRIGGERS = [
  'goal_changed',           // User changed their goal
  'dietary_restriction_added',
  'weight_milestone_reached',
  'adherence_below_threshold', // < 60% for 2 weeks
  'user_requested',
  'plan_expired',           // End of plan period
];
```

---

## 9. Performance Considerations

### 9.1 Database Optimizations

```sql
-- Partial indexes for common queries
CREATE INDEX idx_workout_logs_recent ON workout_logs(user_id, started_at DESC)
  WHERE started_at > NOW() - INTERVAL '30 days';

CREATE INDEX idx_meal_logs_recent ON meal_logs(user_id, eaten_at DESC)
  WHERE eaten_at > NOW() - INTERVAL '7 days';

-- Materialized view for weekly stats (refresh daily)
CREATE MATERIALIZED VIEW user_weekly_stats AS
SELECT
  user_id,
  date_trunc('week', started_at) AS week_start,
  COUNT(*) AS workout_count,
  SUM(actual_duration_minutes) AS total_minutes,
  AVG(difficulty_rating) AS avg_rpe,
  SUM(xp_earned) AS xp_earned
FROM workout_logs
WHERE completed_at IS NOT NULL
GROUP BY user_id, date_trunc('week', started_at);

CREATE UNIQUE INDEX ON user_weekly_stats(user_id, week_start);
```

### 9.2 Query Optimizations

```typescript
// Batch load related data
async function getTodayDashboard(userId: string) {
  const [
    gamification,
    todayWorkout,
    todayRoutine,
    recentAchievements,
    streak
  ] = await Promise.all([
    getUserGamification(userId),
    getTodayWorkout(userId),
    getTodayRoutine(userId),
    getRecentAchievements(userId, 3),
    getCurrentStreak(userId)
  ]);

  return { gamification, todayWorkout, todayRoutine, recentAchievements, streak };
}
```

### 9.3 Photo Storage Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHOTO LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Onboarding Photos (4 body photos):                             │
│  ├─ Original: Keep indefinitely (body_photos/)                  │
│  ├─ Thumbnail: Generate on upload (thumbnails/)                 │
│  └─ Analysis: Cache 24h, store in DB                           │
│                                                                 │
│  Progress Photos:                                               │
│  ├─ Original: Keep 2 years, then archive                       │
│  ├─ Thumbnail: Generate on upload                              │
│  └─ Comparison: Generate on-demand, cache 1h                   │
│                                                                 │
│  Meal Photos:                                                   │
│  ├─ Original: Keep 90 days                                     │
│  ├─ Thumbnail: Generate on upload                              │
│  └─ After 90 days: Delete original, keep thumbnail             │
│                                                                 │
│  R2 Folder Structure:                                           │
│  ├─ body_photos/{userId}/{timestamp}-{type}.jpg                │
│  ├─ progress_photos/{userId}/{timestamp}.jpg                   │
│  ├─ meal_photos/{userId}/{date}/{timestamp}.jpg                │
│  └─ thumbnails/{original_path}_thumb.jpg                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Scalability Considerations

### Current Scale (MVP - 0-1K users)

- Single PostgreSQL instance
- In-process async jobs
- NodeCache for caching
- Single Node.js server

### Growth Scale (1K-10K users)

- Add Redis for caching + job queue
- Consider read replica for analytics queries
- Add CDN for static exercise media

### Scale Preparation (Built into Design)

1. **Stateless services**: All state in PostgreSQL/Redis
2. **User-scoped data**: Natural sharding key ready
3. **Event-driven hooks**: Achievement/XP events loosely coupled
4. **Materialized views**: Heavy aggregations precomputed

---

## 11. Data Retention & Cleanup

| Data Type | Retention | Cleanup Strategy |
|-----------|-----------|------------------|
| Workout logs | Forever | Archive after 2 years |
| Meal logs | 2 years | Delete, keep aggregates |
| Progress photos | 2 years | Move to cold storage |
| Meal photos | 90 days | Delete, keep thumbnails |
| XP events | 1 year | Aggregate, then delete |
| AI session history | 6 months | Summarize, then delete |
| Cache entries | TTL-based | Auto-expire |

---

## 12. Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] New database tables migration
- [ ] Extended R2 service for photo types
- [ ] Simple job queue implementation
- [ ] Extended cache key system

### Phase 2: Body Analysis (Week 2-3)

- [ ] Body analysis service
- [ ] Photo upload endpoints (4 photos)
- [ ] AI analysis integration
- [ ] History tracking

### Phase 3: Workout System (Week 3-5)

- [ ] Exercise library service + seed data
- [ ] Workout plan generation (AI)
- [ ] Workout logging endpoints
- [ ] Adaptive difficulty algorithm

### Phase 4: Gamification (Week 5-6)

- [ ] Gamification service
- [ ] XP/Level system
- [ ] Streak tracking
- [ ] Achievement definitions + checking

### Phase 5: Nutrition Enhancement (Week 6-7)

- [ ] Food library + seed data
- [ ] Meal plan generation enhancement
- [ ] Meal logging with photos
- [ ] AI nutritional analysis

### Phase 6: Daily Routines (Week 7-8)

- [ ] Routine template service
- [ ] Daily checklist endpoints
- [ ] Completion tracking
- [ ] Gamification integration

### Phase 7: Progress Visualization (Week 8-9)

- [ ] Progress photo service
- [ ] Photo comparison generation
- [ ] Chart data aggregation
- [ ] Timeline views

---

## 13. ADR: Architecture Decisions

### ADR-001: Modular Monolith for Health Tracking Enhancement

**Status**: Proposed

**Context**: Adding significant health tracking features to yHealth app.

**Decision**: Continue with modular monolith architecture.

**Rationale**:
- Team size < 10 developers
- Features share data (gamification spans all domains)
- Single deployment simplifies operations
- No evidence of 10x load differences between features

**Extraction Criteria**:
- If AI processing causes latency issues: Extract to worker service
- If exercise library grows > 10K items with complex search: Consider dedicated search service

### ADR-002: In-Process Job Queue Initially

**Status**: Proposed

**Context**: Need async processing for AI image analysis.

**Decision**: Start with simple in-process Promise-based queue.

**Rationale**:
- Current scale doesn't justify Redis dependency
- AI processing is user-initiated, not high-volume
- Can monitor job latency in production

**Migration Path**:
- When job volume > 100/hour: Add BullMQ + Redis
- Interface designed for easy swap

### ADR-003: PostgreSQL JSONB for Flexible Data

**Status**: Proposed

**Context**: Workout sets, meal plans, achievements have variable structures.

**Decision**: Use JSONB columns for semi-structured data with key metrics as columns.

**Rationale**:
- Flexibility for AI-generated content
- Still queryable and indexable
- Avoid schema changes for new exercise types

**Constraints**:
- Always extract metrics needed for aggregation to columns
- Document JSONB structure in code comments

---

## 14. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI latency spikes | High | Medium | Async processing, timeouts, fallbacks |
| Photo storage costs | Medium | Low | Lifecycle policies, compression |
| XP calculation bugs | Medium | High | Event sourcing for XP, reconciliation job |
| Streak loss complaints | High | High | Streak freeze feature, grace period |
| Exercise library gaps | Medium | Medium | Seed comprehensive data, user suggestions |

---

## 15. Open Questions for User

1. **Streak Definition**: Is a "day" user's timezone or UTC? (Recommendation: User timezone)

2. **XP Decay**: Should XP/level ever decay for inactivity? (Recommendation: No decay, just streak reset)

3. **Photo Privacy**: Should progress photos be analyzable by AI for body composition updates? (Recommendation: Opt-in)

4. **Exercise Video Source**: Integrate with external API (e.g., ExerciseDB) or host own videos? (Recommendation: ExerciseDB API initially)

5. **Leaderboard Scope**: Global, friends-only, or opt-in groups? (Recommendation: Friends-only to start)

---

## Next Steps

1. Review and approve architecture decisions
2. Create database migration scripts
3. Implement Phase 1 infrastructure
4. Seed exercise library data
5. Begin Phase 2 body analysis implementation
