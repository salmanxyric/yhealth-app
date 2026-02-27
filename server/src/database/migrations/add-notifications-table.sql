-- Migration: Add Notifications Table
-- Run this script to add the notifications table to an existing database

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

-- Notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'achievement',      -- Achievement unlocked
        'goal_progress',    -- Goal progress update
        'goal_completed',   -- Goal completed
        'streak',           -- Streak milestone
        'reminder',         -- Activity reminder
        'plan_update',      -- Plan update/change
        'system',           -- System notification
        'social',           -- Social/community notification
        'integration',      -- Integration status update
        'coaching',         -- AI coaching message
        'celebration',      -- Celebration/milestone
        'warning',          -- Warning notification
        'tip'               -- Health tip
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notification priority enum
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Rich content
    icon VARCHAR(50),                    -- Icon name or emoji
    image_url VARCHAR(500),              -- Optional image
    action_url VARCHAR(500),             -- Deep link URL
    action_label VARCHAR(100),           -- CTA button text

    -- Categorization
    category VARCHAR(50),                -- Custom category for filtering
    priority notification_priority DEFAULT 'normal',

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP,

    -- Delivery
    channels notification_channel[] DEFAULT ARRAY['push']::notification_channel[],
    sent_via JSONB DEFAULT '{}',         -- Track which channels were used

    -- Related entities
    related_entity_type VARCHAR(50),     -- 'goal', 'plan', 'achievement', etc.
    related_entity_id UUID,              -- ID of the related entity

    -- Metadata
    metadata JSONB DEFAULT '{}',         -- Additional data (achievement details, progress info, etc.)

    -- Expiration
    expires_at TIMESTAMP,                -- Auto-expire notification

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_archived ON notifications(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_notifications_user_priority ON notifications(user_id, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample notifications for testing
-- (Uncomment if you want sample data)
/*
INSERT INTO notifications (user_id, type, title, message, icon, priority, action_url, action_label)
SELECT
    id,
    'system',
    'Welcome to YHealth!',
    'Your health journey starts here. Set up your first goal to get started.',
    '🎉',
    'normal',
    '/goals',
    'Set a Goal'
FROM users
LIMIT 1;
*/

SELECT 'Notifications table created successfully!' as status;
