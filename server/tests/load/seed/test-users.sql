-- Load test user seeding script
-- Creates 100 test users with conversations and intelligence memories
-- Run: psql $DATABASE_URL < test-users.sql

DO $$
DECLARE
  user_id UUID;
  conv_id UUID;
  i INTEGER;
  j INTEGER;
  k INTEGER;
  tiers TEXT[] := ARRAY['free', 'pro', 'premium'];
BEGIN
  -- Create 100 test users
  FOR i IN 1..100 LOOP
    user_id := gen_random_uuid();

    INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, is_email_verified, subscription_tier, created_at, updated_at)
    VALUES (
      user_id,
      'loadtest+' || i || '@balancia.app',
      -- bcrypt hash of 'LoadTest2026!'
      '$2b$10$KIXmz5Q5Z5Q5Z5Q5Z5Q5ZuYwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQ',
      'Load',
      'Tester ' || i,
      'user',
      true,
      true,
      tiers[1 + (i % 3)],
      NOW() - INTERVAL '30 days',
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;

    -- Get the user_id (may already exist)
    SELECT id INTO user_id FROM users WHERE email = 'loadtest+' || i || '@balancia.app';

    -- Create 5-15 conversations per user
    FOR j IN 1..(5 + (i % 11)) LOOP
      conv_id := gen_random_uuid();

      INSERT INTO conversations (id, user_id, title, session_type, status, created_at, updated_at)
      VALUES (
        conv_id,
        user_id,
        'Load test conversation ' || j,
        CASE (j % 4)
          WHEN 0 THEN 'quick_checkin'
          WHEN 1 THEN 'coaching_session'
          WHEN 2 THEN 'health_coach'
          ELSE 'wellness'
        END,
        'active',
        NOW() - INTERVAL '1 day' * (j * 2),
        NOW() - INTERVAL '1 day' * j
      )
      ON CONFLICT DO NOTHING;

      -- Add 3-8 messages per conversation
      FOR k IN 1..(3 + (j % 6)) LOOP
        INSERT INTO messages (id, conversation_id, user_id, role, content, created_at)
        VALUES (
          gen_random_uuid(),
          conv_id,
          user_id,
          CASE WHEN k % 2 = 1 THEN 'user' ELSE 'assistant' END,
          CASE WHEN k % 2 = 1
            THEN 'How am I doing with my fitness goals?'
            ELSE 'Based on your recent activity data, you have been making good progress...'
          END,
          NOW() - INTERVAL '1 day' * j + INTERVAL '1 hour' * k
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

    -- Create 10-30 intelligence memories per user
    FOR j IN 1..(10 + (i % 21)) LOOP
      INSERT INTO intelligence_memories (
        id, user_id, memory_type, category, title, description,
        confidence, evidence_count, source, status,
        access_count, decay_rate, created_at, updated_at, last_accessed_at
      )
      VALUES (
        gen_random_uuid(),
        user_id,
        CASE (j % 5)
          WHEN 0 THEN 'pattern'
          WHEN 1 THEN 'preference'
          WHEN 2 THEN 'context'
          WHEN 3 THEN 'feedback'
          ELSE 'relationship'
        END,
        CASE (j % 6)
          WHEN 0 THEN 'fitness'
          WHEN 1 THEN 'nutrition'
          WHEN 2 THEN 'sleep'
          WHEN 3 THEN 'wellbeing'
          WHEN 4 THEN 'lifestyle'
          ELSE 'cross_domain'
        END,
        'Memory ' || j || ' for user ' || i,
        'Auto-generated load test memory ' || j,
        0.3 + (random() * 0.6),  -- confidence 0.3-0.9
        3 + (j % 10),             -- evidence count 3-12
        CASE WHEN j % 3 = 0 THEN 'ai' ELSE 'user' END,
        'active',
        j * 2,                    -- access count
        0.01 + (random() * 0.04), -- decay rate
        NOW() - INTERVAL '1 day' * (j * 3),
        NOW() - INTERVAL '1 day' * j,
        NOW() - INTERVAL '1 day' * (j % 7)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

  END LOOP;

  RAISE NOTICE 'Load test data seeded: 100 users with conversations and memories';
END $$;
