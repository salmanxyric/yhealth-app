CREATE TABLE IF NOT EXISTS quick_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160),
    content TEXT NOT NULL CHECK (char_length(content) <= 10000),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'pinned', 'archived')),
    color VARCHAR(32) DEFAULT '#facc15',
    tags TEXT[],
    source VARCHAR(20) NOT NULL DEFAULT 'text'
        CHECK (source IN ('text', 'voice', 'ai')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quick_notes_user_status ON quick_notes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quick_notes_user_updated ON quick_notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_notes_pinned ON quick_notes(user_id, updated_at DESC)
    WHERE status = 'pinned';

DROP TRIGGER IF EXISTS update_quick_notes_updated_at ON quick_notes;
CREATE TRIGGER update_quick_notes_updated_at
    BEFORE UPDATE ON quick_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
