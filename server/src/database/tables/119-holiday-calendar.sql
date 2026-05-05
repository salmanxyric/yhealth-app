-- Holiday / cultural / religious calendar for schedule-aware AI coaching
CREATE TABLE IF NOT EXISTS holiday_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('religious', 'national', 'cultural', 'personal')),
  region VARCHAR(10) DEFAULT 'global',
  affects_fitness BOOLEAN DEFAULT FALSE,
  affects_nutrition BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holiday_dates ON holiday_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holiday_region ON holiday_calendar(region, start_date);

-- User-specific holiday preferences
CREATE TABLE IF NOT EXISTS user_holiday_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  region VARCHAR(10) DEFAULT 'global',
  religious_calendar VARCHAR(50),  -- 'islamic', 'christian', 'hindu', 'jewish', 'none'
  custom_holidays JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
