-- Bootstrap required data: roles, AI coach system user, streak tables
-- This migration consolidates startup-time mutations into the migration pipeline.
-- All statements are idempotent (IF NOT EXISTS / ON CONFLICT DO NOTHING).

-- 1. Roles table + default roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, slug, description, is_system) VALUES
  ('11111111-1111-1111-1111-111111111101', 'User', 'user', 'Default application user', true),
  ('11111111-1111-1111-1111-111111111102', 'Admin', 'admin', 'Full administrative access', true),
  ('11111111-1111-1111-1111-111111111106', 'System', 'system', 'System/internal service accounts', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. AI Coach system user
INSERT INTO users (id, email, password, first_name, last_name, role_id, auth_provider, onboarding_status, is_email_verified, is_active)
VALUES (
  COALESCE(current_setting('app.ai_coach_user_id', true)::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  'ai-coach@balencia.system',
  'SYSTEM_USER_NO_LOGIN',
  'AI', 'Coach',
  '11111111-1111-1111-1111-111111111101',
  'local', 'completed', true, true
)
ON CONFLICT (id) DO NOTHING;
