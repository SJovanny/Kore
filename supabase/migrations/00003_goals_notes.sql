-- ============================================================================
-- GOALS & NOTES TABLES - Objectifs de trading et notes rapides
-- ============================================================================

-- ============================================================================
-- TABLE: trading_goals
-- ============================================================================

CREATE TABLE trading_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de l'objectif
    title VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Valeurs de progression
    target_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    
    -- Type d'objectif
    goal_type VARCHAR(20) NOT NULL DEFAULT 'custom',
    -- Types: 'profit', 'trades', 'winrate', 'custom'
    
    -- Statut
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    deadline DATE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX idx_trading_goals_completed ON trading_goals(is_completed);

-- ============================================================================
-- TABLE: quick_notes
-- ============================================================================

CREATE TABLE quick_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contenu de la note
    content TEXT NOT NULL,
    
    -- Type de note
    note_type VARCHAR(20) NOT NULL DEFAULT 'thought',
    -- Types: 'thought', 'lesson', 'observation'
    
    -- Épinglé en haut
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_quick_notes_user_id ON quick_notes(user_id);
CREATE INDEX idx_quick_notes_pinned ON quick_notes(pinned) WHERE pinned = TRUE;
CREATE INDEX idx_quick_notes_created_at ON quick_notes(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE trading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;

-- Policies for trading_goals
CREATE POLICY "trading_goals_select_own" ON trading_goals
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "trading_goals_insert_own" ON trading_goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_goals_update_own" ON trading_goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_goals_delete_own" ON trading_goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for quick_notes
CREATE POLICY "quick_notes_select_own" ON quick_notes
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "quick_notes_insert_own" ON quick_notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quick_notes_update_own" ON quick_notes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quick_notes_delete_own" ON quick_notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trigger_trading_goals_updated_at
    BEFORE UPDATE ON trading_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE trading_goals IS 'Trading objectives with progress tracking';
COMMENT ON TABLE quick_notes IS 'Quick mental notes and trading observations';
