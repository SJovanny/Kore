-- ============================================================================
-- DROP ALL TABLES & RELATED OBJECTS - Supabase Reset Script
-- ============================================================================
-- ⚠️ ATTENTION: Ce script supprime TOUTES les données de façon permanente !
-- Exécutez uniquement si vous êtes sûr de vouloir réinitialiser la base.
-- ============================================================================

-- ============================================================================
-- 1. SUPPRESSION DES TRIGGERS (sur auth.users)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- 2. SUPPRESSION DES VUES
-- ============================================================================

DROP VIEW IF EXISTS portfolio_stats CASCADE;
DROP VIEW IF EXISTS strategy_stats CASCADE;
DROP VIEW IF EXISTS daily_pnl_view CASCADE;

-- ============================================================================
-- 3. SUPPRESSION DES TABLES (ordre inverse des dépendances FK)
-- ============================================================================
-- On supprime d'abord les tables enfants, puis les parents

-- Tables enfants (dépendantes)
DROP TABLE IF EXISTS psychology_logs CASCADE;
DROP TABLE IF EXISTS executions CASCADE;
DROP TABLE IF EXISTS trades CASCADE;

-- Tables intermédiaires
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- Table parent principale
DROP TABLE IF EXISTS profiles CASCADE;

-- Tables additionnelles (trading_goals, quick_notes si elles existent)
DROP TABLE IF EXISTS trading_goals CASCADE;
DROP TABLE IF EXISTS quick_notes CASCADE;

-- ============================================================================
-- 4. SUPPRESSION DES FONCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- 5. SUPPRESSION DES TYPES ENUM
-- ============================================================================

DROP TYPE IF EXISTS subscription_tier CASCADE;
DROP TYPE IF EXISTS portfolio_type CASCADE;
DROP TYPE IF EXISTS trade_direction CASCADE;
DROP TYPE IF EXISTS trade_status CASCADE;
DROP TYPE IF EXISTS trade_mode CASCADE;
DROP TYPE IF EXISTS execution_type CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;

-- ============================================================================
-- FIN DU SCRIPT DE RESET
-- ============================================================================
-- Pour réinitialiser le schéma, exécutez ensuite:
-- 1. 00001_init_schema.sql
-- 2. 00002_assets_table.sql
-- ============================================================================
