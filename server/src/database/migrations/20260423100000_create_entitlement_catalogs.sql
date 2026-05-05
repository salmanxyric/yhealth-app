-- Migration: Entitlement Catalogs
-- feature_catalog: stable keys for every gated capability (AI + non-AI)
-- menu_catalog:    hydrated sidebar/mobile-nav source of truth
-- page_catalog:    one row per premium route, drives route-level gating
--
-- These are lookup tables. Seed rows are included. Additive migration only.
-- Part of the Enterprise Subscription, Credit & Entitlement System (Sprint 1).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FEATURE_CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS feature_catalog (
    feature_key         VARCHAR(80)  PRIMARY KEY,
    label               VARCHAR(160) NOT NULL,
    category            VARCHAR(40)  NOT NULL,
    description         TEXT,
    credit_cost_default INTEGER      NOT NULL DEFAULT 0 CHECK (credit_cost_default >= 0),
    is_ai               BOOLEAN      NOT NULL DEFAULT false,
    is_enabled_default  BOOLEAN      NOT NULL DEFAULT false,
    marketing_copy      TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS idx_feature_catalog_category ON feature_catalog(category);
CREATE INDEX IF NOT EXISTS idx_feature_catalog_is_ai ON feature_catalog(is_ai);

-- ============================================
-- MENU_CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS menu_catalog (
    menu_key   VARCHAR(80)  PRIMARY KEY,
    label      VARCHAR(160) NOT NULL,
    section    VARCHAR(60)  NOT NULL DEFAULT 'MAIN',
    parent_key VARCHAR(80)  REFERENCES menu_catalog(menu_key) ON DELETE SET NULL,
    route      VARCHAR(255),
    icon       VARCHAR(80),
    badge      VARCHAR(40),
    sort_order INTEGER      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS idx_menu_catalog_section ON menu_catalog(section, sort_order);

-- ============================================
-- PAGE_CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS page_catalog (
    page_key   VARCHAR(80)  PRIMARY KEY,
    route      VARCHAR(255) NOT NULL UNIQUE,
    label      VARCHAR(160) NOT NULL,
    is_public  BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS idx_page_catalog_route ON page_catalog(route);

-- ============================================
-- SEED: FEATURE CATALOG
-- ============================================
-- AI features (is_ai=true) have a non-zero credit_cost_default.
-- Non-AI gated features have credit_cost_default=0 but are toggled via plan_features.is_enabled.

INSERT INTO feature_catalog (feature_key, label, category, description, credit_cost_default, is_ai, is_enabled_default, marketing_copy) VALUES
    -- AI Chat / Coach
    ('ai.coach.message',           'AI Coach Chat',              'ai_chat',   'Send a message to the AI coach',                     1, true,  false, 'Get personalized coaching from Balencia AI.'),
    ('ai.coach.start',             'Start AI Coach Session',     'ai_chat',   'Begin a new AI coaching session',                    1, true,  false, 'Kick off a guided coaching conversation.'),
    ('ai.coach.goal_generate',     'AI Goal Generation',         'ai_gen',    'Generate personalized goals from assessment',        5, true,  false, 'Let Balencia generate tailored goals for you.'),
    ('ai.coach.diet_plan_generate','AI Diet Plan Generation',    'ai_gen',    'Generate a weekly diet plan',                        5, true,  false, 'Custom diet plans powered by AI.'),
    ('ai.coach.image_analyze',     'AI Image Analysis',          'ai_image',  'Analyze food, body, or progress photos',             3, true,  false, 'Upload photos and get instant AI analysis.'),
    ('ai.coach.chat_with_image',   'AI Chat with Image',         'ai_image',  'Multimodal image + chat',                            3, true,  false, 'Chat about what you see.'),
    -- RAG / Knowledge
    ('ai.rag.chat',                'Knowledge Chat',             'ai_chat',   'RAG-powered knowledge chat',                         1, true,  false, 'Ask anything, backed by your data.'),
    ('ai.rag.chat_stream',         'Knowledge Chat (streaming)', 'ai_chat',   'Streaming RAG chat',                                 1, true,  false, 'Real-time answers streamed to you.'),
    ('ai.rag.title',               'AI Conversation Title',      'ai_gen',    'Auto-title conversations',                           1, true,  false, 'Keep your chat history organized.'),
    ('ai.rag.summary',             'AI Conversation Summary',    'ai_gen',    'Summarize a conversation',                           2, true,  false, 'Condense long chats into key takeaways.'),
    -- Voice
    ('ai.voice.call',              'AI Voice Call',              'ai_voice',  'Initiate an AI voice call session',                  5, true,  false, 'Talk to your AI coach in real time.'),
    ('ai.voice.tts',               'Text-to-Speech',             'ai_voice',  'Synthesize speech from text',                        1, true,  false, 'Natural-sounding voice generation.'),
    ('ai.voice.journal_turn',      'Voice Journal Turn',         'ai_voice',  'One turn in a voice journal session',                2, true,  false, 'Journal hands-free with your voice.'),
    ('ai.voice.journal_summary',   'Voice Journal Summary',      'ai_gen',    'Summarize a voice journal session',                  3, true,  false, 'Let AI summarize your reflections.'),
    ('ai.stt.transcribe',          'Speech-to-Text',             'ai_voice',  'Transcribe audio to text',                           2, true,  false, 'Accurate transcription on demand.'),
    -- Emotion / Wellbeing
    ('ai.emotion.checkin',         'Emotional Check-in',         'ai_chat',   'Start an AI emotional check-in',                     2, true,  false, 'Check in with yourself, guided by AI.'),
    ('ai.emotion.camera_analyze',  'Camera Emotion Analysis',    'ai_image',  'Analyze facial emotion from camera frame',           3, true,  false, 'Real-time emotion insight.'),
    -- Goals
    ('ai.goals.decompose',         'AI Goal Decomposition',      'ai_gen',    'Break a goal into actionable steps',                 3, true,  false, 'Big goals, broken down intelligently.'),
    ('ai.goals.from_assessment',   'AI Goals from Assessment',   'ai_gen',    'Generate goals from onboarding answers',             5, true,  false, 'Your assessment, your roadmap.'),
    -- Summaries
    ('ai.call_summary.generate',   'Call Summary',               'ai_gen',    'Post-call AI summary with action items',             3, true,  false, 'Never lose the key points of a call.'),
    -- Admin AI (content generation)
    ('ai.admin.blog_generate',     'Admin Blog Generation',      'admin_ai',  'Generate blog content (admin only)',                10, true,  false, 'Publish faster with AI assistance.'),
    ('ai.admin.help_generate',     'Admin Help Generation',      'admin_ai',  'Generate help articles',                            10, true,  false, 'Scale your help center.'),
    ('ai.admin.webinar_generate',  'Admin Webinar Generation',   'admin_ai',  'Generate webinar copy',                             10, true,  false, 'Kick-start webinar content.'),
    ('ai.admin.community_generate','Admin Community Generation', 'admin_ai',  'Generate community posts',                          10, true,  false, 'Seed community discussions instantly.'),
    ('ai.competition.challenge_generate','AI Challenge Generation','ai_gen', 'Generate a shared challenge',                        5, true,  false, 'New challenges, powered by AI.'),
    -- Non-AI gated features (entitlement toggles)
    ('webinars.watch',             'Watch Webinars',             'content',   'Access premium webinars',                            0, false, false, 'Unlock our full webinar library.'),
    ('community.post',             'Post in Community',          'social',    'Create community posts',                             0, false, true,  'Share with the community.'),
    ('competitions.join_premium',  'Join Premium Competitions',  'social',    'Access premium-tier competitions',                   0, false, false, 'Compete with everyone.'),
    ('analytics.export',           'Export Analytics',           'analytics', 'Export your analytics as CSV/PDF',                   0, false, false, 'Take your data anywhere.'),
    ('knowledge_graph.query',      'Knowledge Graph',            'analytics', 'Query your personal knowledge graph',                0, false, false, 'Visualize the connections in your life.'),
    ('money_map.view',             'Money Map',                  'analytics', 'Access the personal finance module',                 0, false, false, 'Track and plan your finances.'),
    ('contracts.accountability_ai','AI Accountability Contracts','social',    'Use AI-generated accountability contracts',          0, false, false, 'Stay accountable with AI-drafted commitments.'),
    ('leaderboard.premium',        'Premium Leaderboards',       'social',    'Access premium leaderboards',                        0, false, false, 'See how you rank.'),
    ('voice_assistant.use',        'Voice Assistant',            'ai_voice',  'Use the voice assistant feature',                    0, false, false, 'Hands-free interaction.'),
    ('chat.group',                 'Group Chat',                 'social',    'Create and join group chats',                        0, false, true,  'Chat with friends and coaches.'),
    ('wellbeing.advanced',         'Advanced Wellbeing',         'content',   'Access advanced wellbeing modules',                  0, false, false, 'Go deeper on wellbeing.')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================
-- SEED: MENU CATALOG
-- ============================================
-- Matches the existing hardcoded DashboardSidebar structure so the rewrite is backwards-compatible.

INSERT INTO menu_catalog (menu_key, label, section, route, icon, sort_order) VALUES
    -- MAIN
    ('dashboard',          'Dashboard',          'MAIN',        '/dashboard',          'LayoutDashboard', 10),
    ('ai.coach',           'AI Coach',           'MAIN',        '/ai-coach',           'Bot',             20),
    ('chat',               'Chat',               'MAIN',        '/chat',               'MessageSquare',   30),
    ('voice-assistant',    'Voice Assistant',    'MAIN',        '/voice-assistant',    'Mic',             40),
    ('voice-call',         'Voice Call',         'MAIN',        '/voice-call',         'Phone',           50),
    ('chat-history',       'Chat History',       'MAIN',        '/chat-history',       'History',         60),

    -- ACTIVITY & HEALTH
    ('activity',           'Activity',           'ACTIVITY',    '/activity',           'Activity',        10),
    ('activity-status',    'Activity Status',    'ACTIVITY',    '/activity-status',    'Zap',             20),
    ('workouts',           'Workouts',           'ACTIVITY',    '/workouts',           'Dumbbell',        30),
    ('exercises',          'Exercises',          'ACTIVITY',    '/exercises',          'Flame',           40),
    ('yoga',               'Yoga',               'ACTIVITY',    '/yoga',               'Flower2',         50),
    ('nutrition',          'Nutrition',          'ACTIVITY',    '/nutrition',          'Apple',           60),
    ('whoop',              'WHOOP',              'ACTIVITY',    '/whoop',              'HeartPulse',      70),

    -- WELLBEING
    ('wellbeing',          'Wellbeing',          'WELLBEING',   '/wellbeing',          'Heart',           10),
    ('goals',              'Goals',              'WELLBEING',   '/goals',              'Target',          20),
    ('progress',           'Progress',           'WELLBEING',   '/progress',           'TrendingUp',      30),
    ('achievements',       'Achievements',       'WELLBEING',   '/achievements',       'Trophy',          40),
    ('life-areas',         'Life Areas',         'WELLBEING',   '/life-areas',         'Compass',         50),
    ('obstacles',          'Obstacles',          'WELLBEING',   '/obstacles',          'AlertTriangle',   60),
    ('soundscape',         'Soundscape',         'WELLBEING',   '/soundscape',         'Music2',          70),

    -- SOCIAL
    ('community',          'Community',          'SOCIAL',      '/community',          'Users',           10),
    ('competitions',       'Competitions',       'SOCIAL',      '/competitions',       'Trophy',          20),
    ('leaderboard',        'Leaderboard',        'SOCIAL',      '/leaderboard',        'Crown',           30),
    ('messages',           'Messages',           'SOCIAL',      '/messages',           'Mail',            40),
    ('contracts',          'Accountability',     'SOCIAL',      '/contracts',          'Handshake',       50),

    -- GROWTH
    ('knowledge-graph',    'Knowledge Graph',    'GROWTH',      '/knowledge-graph',    'Network',         10),
    ('money-map',          'Money Map',          'GROWTH',      '/money-map',          'DollarSign',      20),
    ('webinars',           'Webinars',           'GROWTH',      '/webinars',           'Presentation',    30),
    ('blogs',              'Blogs',              'GROWTH',      '/blogs',              'BookOpen',        40),

    -- ACCOUNT
    ('profile',            'Profile',            'ACCOUNT',     '/profile',            'User',            10),
    ('notifications',      'Notifications',      'ACCOUNT',     '/notifications',      'Bell',            20),
    ('preferences',        'Preferences',        'ACCOUNT',     '/preferences',        'Sliders',         30),
    ('settings',           'Settings',           'ACCOUNT',     '/settings',           'Settings',        40),
    ('subscription',       'Subscription',       'ACCOUNT',     '/subscription',       'CreditCard',      50),
    ('help',               'Help Center',        'ACCOUNT',     '/help',               'HelpCircle',      60)
ON CONFLICT (menu_key) DO NOTHING;

-- ============================================
-- SEED: PAGE CATALOG
-- ============================================

INSERT INTO page_catalog (page_key, route, label, is_public) VALUES
    -- Public
    ('about',              '/about',              'About',              true),
    ('careers',            '/careers',            'Careers',            true),
    ('contact',            '/contact',            'Contact',            true),
    ('cookies',            '/cookies',            'Cookies',            true),
    ('faq',                '/faq',                'FAQ',                true),
    ('hipaa',              '/hipaa',              'HIPAA',              true),
    ('press',              '/press',              'Press',              true),
    ('privacy',            '/privacy',            'Privacy',            true),
    ('security',           '/security',           'Security',           true),
    ('terms',              '/terms',              'Terms',              true),

    -- Always-available after auth
    ('dashboard',          '/dashboard',          'Dashboard',          false),
    ('profile',            '/profile',            'Profile',            false),
    ('settings',           '/settings',           'Settings',           false),
    ('preferences',        '/preferences',        'Preferences',        false),
    ('notifications',      '/notifications',      'Notifications',      false),
    ('onboarding',         '/onboarding',         'Onboarding',         false),
    ('subscription',       '/subscription',       'Subscription',       false),
    ('reset-password',     '/reset-password',     'Reset Password',     true),
    ('help',               '/help',               'Help Center',        false),

    -- Gated by plan
    ('ai-coach',           '/ai-coach',           'AI Coach',           false),
    ('chat',               '/chat',               'Chat',               false),
    ('chat-history',       '/chat-history',       'Chat History',       false),
    ('voice-assistant',    '/voice-assistant',    'Voice Assistant',    false),
    ('voice-call',         '/voice-call',         'Voice Call',         false),
    ('activity',           '/activity',           'Activity',           false),
    ('activity-status',    '/activity-status',    'Activity Status',    false),
    ('achievements',       '/achievements',       'Achievements',       false),
    ('workouts',           '/workouts',           'Workouts',           false),
    ('exercises',          '/exercises',          'Exercises',          false),
    ('yoga',               '/yoga',               'Yoga',               false),
    ('nutrition',          '/nutrition',          'Nutrition',          false),
    ('whoop',              '/whoop',              'WHOOP',              false),
    ('wellbeing',          '/wellbeing',          'Wellbeing',          false),
    ('goals',              '/goals',              'Goals',              false),
    ('progress',           '/progress',           'Progress',           false),
    ('life-areas',         '/life-areas',         'Life Areas',         false),
    ('obstacles',          '/obstacles',          'Obstacles',          false),
    ('soundscape',         '/soundscape',         'Soundscape',         false),
    ('community',          '/community',          'Community',          false),
    ('competitions',       '/competitions',       'Competitions',       false),
    ('leaderboard',        '/leaderboard',        'Leaderboard',        false),
    ('messages',           '/messages',           'Messages',           false),
    ('contracts',          '/contracts',          'Accountability',     false),
    ('knowledge-graph',    '/knowledge-graph',    'Knowledge Graph',    false),
    ('money-map',          '/money-map',          'Money Map',          false),
    ('webinars',           '/webinars',           'Webinars',           false),
    ('blogs',              '/blogs',              'Blogs',              false)
ON CONFLICT (page_key) DO NOTHING;

SELECT 'Entitlement catalogs (feature / menu / page) created and seeded' AS status;
