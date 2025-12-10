-- ============================================================================
-- JOURNAL DE TRADING HAUTE PERFORMANCE - Schema SQL Initial
-- Supabase/PostgreSQL Database Initialization
-- ============================================================================
-- Ce script crée l'architecture complète de la base de données pour le
-- Journal de Trading SaaS, incluant les tables, enums, relations FK et
-- politiques de sécurité RLS.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS REQUISES
-- ============================================================================

-- Extension pour générer des UUIDs (généralement déjà activée sur Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TYPES ENUM PERSONNALISÉS
-- ============================================================================

-- Niveau d'abonnement utilisateur
CREATE TYPE subscription_tier AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- Type de portefeuille/compte de trading
CREATE TYPE portfolio_type AS ENUM ('DEMO', 'FUNDED', 'PERSONAL', 'PROP_FIRM');

-- Direction du trade
CREATE TYPE trade_direction AS ENUM ('LONG', 'SHORT');

-- Statut du trade
CREATE TYPE trade_status AS ENUM ('PENDING', 'OPEN', 'CLOSED', 'CANCELLED');

-- Mode du trade (Live vs Backtest)
CREATE TYPE trade_mode AS ENUM ('LIVE', 'BACKTEST');

-- Type d'exécution (entrée ou sortie)
CREATE TYPE execution_type AS ENUM ('ENTRY', 'EXIT', 'PARTIAL_ENTRY', 'PARTIAL_EXIT', 'STOP_LOSS', 'TAKE_PROFIT');

-- ============================================================================
-- 3. TABLE: profiles
-- ============================================================================
-- Extension de auth.users pour stocker les informations utilisateur
-- supplémentaires. Liée à auth.users via user_id.

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations utilisateur
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    avatar_url TEXT,
    
    -- Abonnement
    subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
    subscription_expires_at TIMESTAMPTZ,
    
    -- Préférences
    preferred_currency CHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches par username
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================================
-- 4. TABLE: portfolios
-- ============================================================================
-- Gestion de plusieurs comptes de trading (Demo, Funded, Personal, etc.)

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations du portefeuille
    name VARCHAR(100) NOT NULL,
    description TEXT,
    portfolio_type portfolio_type NOT NULL DEFAULT 'PERSONAL',
    
    -- Configuration financière (NUMERIC pour précision monétaire)
    initial_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Broker/Plateforme
    broker_name VARCHAR(100),
    account_number VARCHAR(50),
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte: un seul portefeuille par défaut par utilisateur
    CONSTRAINT unique_default_portfolio EXCLUDE USING btree (user_id WITH =) WHERE (is_default = TRUE)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_type ON portfolios(portfolio_type);

-- ============================================================================
-- 5. TABLE: strategies (Playbook du Trader)
-- ============================================================================
-- Définition des stratégies/setups de trading utilisés

CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de la stratégie
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Règles de la stratégie (stockées en JSON pour flexibilité)
    entry_rules JSONB DEFAULT '[]'::JSONB,
    exit_rules JSONB DEFAULT '[]'::JSONB,
    risk_rules JSONB DEFAULT '[]'::JSONB,
    
    -- Paramètres de risque
    default_risk_percent NUMERIC(5, 2) DEFAULT 1.00,
    max_position_size NUMERIC(18, 2),
    
    -- Tags pour catégorisation
    tags TEXT[] DEFAULT '{}',
    
    -- Statistiques (mises à jour via triggers ou application)
    total_trades INTEGER DEFAULT 0,
    win_rate NUMERIC(5, 2) DEFAULT 0.00,
    average_rr NUMERIC(6, 2) DEFAULT 0.00,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte: nom unique par utilisateur
    CONSTRAINT unique_strategy_name_per_user UNIQUE (user_id, name)
);

-- Index pour les recherches
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_tags ON strategies USING GIN(tags);

-- ============================================================================
-- 6. TABLE: trades (Table Principale)
-- ============================================================================
-- Enregistrement de tous les trades avec leurs métadonnées

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    
    -- Informations du trade
    symbol VARCHAR(20) NOT NULL,
    direction trade_direction NOT NULL,
    status trade_status NOT NULL DEFAULT 'PENDING',
    mode trade_mode NOT NULL DEFAULT 'LIVE',
    
    -- Dates
    entry_date TIMESTAMPTZ,
    exit_date TIMESTAMPTZ,
    
    -- Prix et quantités (calculés à partir des exécutions)
    entry_price NUMERIC(18, 8),      -- 8 décimales pour crypto
    exit_price NUMERIC(18, 8),
    quantity NUMERIC(18, 8),
    
    -- Stop Loss et Take Profit planifiés
    planned_stop_loss NUMERIC(18, 8),
    planned_take_profit NUMERIC(18, 8),
    actual_stop_loss NUMERIC(18, 8),
    actual_take_profit NUMERIC(18, 8),
    
    -- Résultats financiers (NUMERIC obligatoire)
    gross_pnl NUMERIC(18, 2) DEFAULT 0.00,
    total_fees NUMERIC(18, 2) DEFAULT 0.00,
    net_pnl NUMERIC(18, 2) DEFAULT 0.00,
    
    -- Métriques de performance
    r_multiple NUMERIC(8, 2),        -- Ratio risque/récompense réalisé
    risk_amount NUMERIC(18, 2),      -- Montant risqué sur ce trade
    risk_percent NUMERIC(5, 2),      -- % du portefeuille risqué
    
    -- Documentation
    setup_notes TEXT,                -- Notes sur le setup identifié
    entry_notes TEXT,                -- Notes sur l'entrée
    exit_notes TEXT,                 -- Notes sur la sortie
    lessons_learned TEXT,            -- Leçons tirées du trade
    
    -- Médias
    screenshot_url TEXT,             -- Screenshot du chart
    chart_timeframe VARCHAR(10),     -- ex: '1H', '4H', 'D1'
    
    -- Tags pour filtrage
    tags TEXT[] DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_portfolio_id ON trades(portfolio_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_entry_date ON trades(entry_date);
CREATE INDEX idx_trades_mode ON trades(mode);
CREATE INDEX idx_trades_tags ON trades USING GIN(tags);

-- Index composite pour les dashboards
CREATE INDEX idx_trades_user_status_date ON trades(user_id, status, entry_date DESC);

-- ============================================================================
-- 7. TABLE: executions
-- ============================================================================
-- Gestion des entrées/sorties partielles pour chaque trade

CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Type d'exécution
    execution_type execution_type NOT NULL,
    
    -- Détails de l'exécution (NUMERIC pour précision)
    price NUMERIC(18, 8) NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    
    -- Frais (NUMERIC obligatoire)
    fees NUMERIC(18, 2) DEFAULT 0.00,
    commission NUMERIC(18, 2) DEFAULT 0.00,
    slippage NUMERIC(18, 8) DEFAULT 0.00,
    
    -- Date d'exécution
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Notes optionnelles
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes
CREATE INDEX idx_executions_trade_id ON executions(trade_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_executed_at ON executions(executed_at);

-- ============================================================================
-- 8. TABLE: psychology_logs
-- ============================================================================
-- Suivi psychologique et émotionnel lié aux trades

CREATE TABLE psychology_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Métriques psychologiques
    tilt_score SMALLINT CHECK (tilt_score >= 1 AND tilt_score <= 10),
    confidence_level SMALLINT CHECK (confidence_level >= 1 AND confidence_level <= 10),
    focus_level SMALLINT CHECK (focus_level >= 1 AND focus_level <= 10),
    stress_level SMALLINT CHECK (stress_level >= 1 AND stress_level <= 10),
    
    -- Tags émotionnels (Array pour multiple sélection)
    emotion_tags TEXT[] DEFAULT '{}',
    -- Exemples: 'FOMO', 'GREED', 'FEAR', 'REVENGE', 'OVERCONFIDENT', 'CALM', 'FOCUSED'
    
    -- Évaluations
    discipline_rating BOOLEAN,        -- A-t-on respecté le plan?
    followed_strategy BOOLEAN,        -- A-t-on suivi la stratégie?
    proper_risk_management BOOLEAN,   -- Gestion du risque respectée?
    
    -- Contexte
    market_conditions TEXT,           -- Description du marché
    pre_trade_state TEXT,             -- État mental avant le trade
    post_trade_state TEXT,            -- État mental après le trade
    
    -- Notes détaillées
    notes TEXT,
    
    -- Horodatage (pour logs non liés à un trade spécifique)
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les analyses
CREATE INDEX idx_psychology_logs_trade_id ON psychology_logs(trade_id);
CREATE INDEX idx_psychology_logs_user_id ON psychology_logs(user_id);
CREATE INDEX idx_psychology_logs_logged_at ON psychology_logs(logged_at);
CREATE INDEX idx_psychology_logs_emotion_tags ON psychology_logs USING GIN(emotion_tags);
CREATE INDEX idx_psychology_logs_tilt ON psychology_logs(tilt_score) WHERE tilt_score >= 7;

-- ============================================================================
-- 9. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Trigger pour profiles
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour portfolios
CREATE TRIGGER trigger_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour strategies
CREATE TRIGGER trigger_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour trades
CREATE TRIGGER trigger_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour psychology_logs
CREATE TRIGGER trigger_psychology_logs_updated_at
    BEFORE UPDATE ON psychology_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 11.1 POLITIQUES RLS: profiles
-- ============================================================================

-- SELECT: Un utilisateur ne peut voir que son propre profil
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT: Un utilisateur ne peut créer que son propre profil
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE: Un utilisateur ne peut modifier que son propre profil
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Un utilisateur ne peut supprimer que son propre profil
CREATE POLICY "profiles_delete_own" ON profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11.2 POLITIQUES RLS: portfolios
-- ============================================================================

CREATE POLICY "portfolios_select_own" ON portfolios
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "portfolios_insert_own" ON portfolios
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_own" ON portfolios
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_own" ON portfolios
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11.3 POLITIQUES RLS: strategies
-- ============================================================================

CREATE POLICY "strategies_select_own" ON strategies
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "strategies_insert_own" ON strategies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strategies_update_own" ON strategies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strategies_delete_own" ON strategies
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11.4 POLITIQUES RLS: trades
-- ============================================================================

CREATE POLICY "trades_select_own" ON trades
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "trades_insert_own" ON trades
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own" ON trades
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_delete_own" ON trades
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11.5 POLITIQUES RLS: executions
-- ============================================================================

CREATE POLICY "executions_select_own" ON executions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "executions_insert_own" ON executions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "executions_update_own" ON executions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "executions_delete_own" ON executions
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 11.6 POLITIQUES RLS: psychology_logs
-- ============================================================================

CREATE POLICY "psychology_logs_select_own" ON psychology_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "psychology_logs_insert_own" ON psychology_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "psychology_logs_update_own" ON psychology_logs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "psychology_logs_delete_own" ON psychology_logs
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- 12. FONCTION: Création automatique du profil utilisateur
-- ============================================================================
-- Cette fonction est appelée automatiquement lors de l'inscription d'un
-- nouvel utilisateur via Supabase Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil après inscription
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 13. VUES UTILITAIRES (Optionnel)
-- ============================================================================

-- Vue pour les statistiques de trading par portefeuille
CREATE OR REPLACE VIEW portfolio_stats AS
SELECT 
    p.id AS portfolio_id,
    p.user_id,
    p.name AS portfolio_name,
    COUNT(t.id) AS total_trades,
    COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl > 0 THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl < 0 THEN 1 END) AS losing_trades,
    COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl = 0 THEN 1 END) AS breakeven_trades,
    COALESCE(SUM(t.net_pnl), 0) AS total_pnl,
    COALESCE(AVG(t.r_multiple), 0) AS avg_r_multiple,
    CASE 
        WHEN COUNT(CASE WHEN t.status = 'CLOSED' THEN 1 END) > 0 
        THEN ROUND(
            COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl > 0 THEN 1 END)::NUMERIC / 
            COUNT(CASE WHEN t.status = 'CLOSED' THEN 1 END) * 100, 
            2
        )
        ELSE 0 
    END AS win_rate
FROM portfolios p
LEFT JOIN trades t ON p.id = t.portfolio_id
GROUP BY p.id, p.user_id, p.name;

-- Vue pour les statistiques de stratégie
CREATE OR REPLACE VIEW strategy_stats AS
SELECT 
    s.id AS strategy_id,
    s.user_id,
    s.name AS strategy_name,
    COUNT(t.id) AS total_trades,
    COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl > 0 THEN 1 END) AS winning_trades,
    COALESCE(SUM(t.net_pnl), 0) AS total_pnl,
    COALESCE(AVG(t.r_multiple), 0) AS avg_r_multiple,
    CASE 
        WHEN COUNT(CASE WHEN t.status = 'CLOSED' THEN 1 END) > 0 
        THEN ROUND(
            COUNT(CASE WHEN t.status = 'CLOSED' AND t.net_pnl > 0 THEN 1 END)::NUMERIC / 
            COUNT(CASE WHEN t.status = 'CLOSED' THEN 1 END) * 100, 
            2
        )
        ELSE 0 
    END AS win_rate
FROM strategies s
LEFT JOIN trades t ON s.id = t.strategy_id
GROUP BY s.id, s.user_id, s.name;

-- ============================================================================
-- 14. COMMENTAIRES SUR LES TABLES
-- ============================================================================

COMMENT ON TABLE profiles IS 'Extension de auth.users avec les informations utilisateur et abonnement';
COMMENT ON TABLE portfolios IS 'Comptes de trading (Demo, Funded, Personal, Prop Firm)';
COMMENT ON TABLE strategies IS 'Playbook du trader - définition des stratégies et setups';
COMMENT ON TABLE trades IS 'Table principale des trades avec toutes les métadonnées';
COMMENT ON TABLE executions IS 'Exécutions partielles (entrées/sorties) pour chaque trade';
COMMENT ON TABLE psychology_logs IS 'Journal psychologique et émotionnel lié aux trades';

-- ============================================================================
-- FIN DU SCRIPT D'INITIALISATION
-- ============================================================================
