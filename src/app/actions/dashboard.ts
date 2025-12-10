// ============================================================================
// SERVER ACTIONS - Dashboard Analytics
// ============================================================================

"use server";

import { createClient } from "@/lib/supabase/server";
import type {
    TradingStats,
    EquityCurvePoint,
    StrategyPerformance,
    SymbolPerformance,
    RecentTrade,
    PortfolioSummary,
    DashboardFilters,
} from "@/lib/types/dashboard";

type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Récupère les statistiques globales de trading
 */
export async function getTradingStats(
    filters?: DashboardFilters
): Promise<ActionResult<TradingStats>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            // Retourner des données mock pour le développement
            return {
                success: true,
                data: getMockTradingStats(),
            };
        }

        let query = supabase
            .from("trades")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "CLOSED");

        if (filters?.portfolioId) {
            query = query.eq("portfolio_id", filters.portfolioId);
        }
        if (filters?.strategyId) {
            query = query.eq("strategy_id", filters.strategyId);
        }
        if (filters?.mode) {
            query = query.eq("mode", filters.mode);
        }
        if (filters?.dateFrom) {
            query = query.gte("exit_date", filters.dateFrom);
        }
        if (filters?.dateTo) {
            query = query.lte("exit_date", filters.dateTo);
        }

        const { data: trades, error } = await query.order("exit_date", {
            ascending: true,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        if (!trades || trades.length === 0) {
            return { success: true, data: getEmptyStats() };
        }

        // Calcul des statistiques
        const stats = calculateStats(trades);
        return { success: true, data: stats };
    } catch (error) {
        console.error("Error getTradingStats:", error);
        return { success: false, error: "Erreur lors du calcul des statistiques" };
    }
}

/**
 * Récupère la courbe d'équité (PnL cumulatif)
 */
export async function getEquityCurve(
    filters?: DashboardFilters
): Promise<ActionResult<EquityCurvePoint[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: true, data: getMockEquityCurve() };
        }

        let query = supabase
            .from("trades")
            .select("exit_date, net_pnl")
            .eq("user_id", user.id)
            .eq("status", "CLOSED")
            .not("exit_date", "is", null)
            .order("exit_date", { ascending: true });

        if (filters?.portfolioId) {
            query = query.eq("portfolio_id", filters.portfolioId);
        }

        const { data: trades, error } = await query;

        if (error || !trades) {
            return { success: true, data: getMockEquityCurve() };
        }

        let cumulativePnl = 0;
        const equityCurve: EquityCurvePoint[] = trades.map((trade, index) => {
            cumulativePnl += Number(trade.net_pnl) || 0;
            return {
                date: trade.exit_date?.split("T")[0] || "",
                pnl: Number(trade.net_pnl) || 0,
                cumulativePnl,
                tradeCount: index + 1,
            };
        });

        return { success: true, data: equityCurve };
    } catch (error) {
        console.error("Error getEquityCurve:", error);
        return { success: true, data: getMockEquityCurve() };
    }
}

/**
 * Récupère la performance par stratégie
 */
export async function getStrategyPerformance(
    filters?: DashboardFilters
): Promise<ActionResult<StrategyPerformance[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: true, data: getMockStrategyPerformance() };
        }

        const { data, error } = await supabase
            .from("strategy_stats")
            .select("*")
            .eq("user_id", user.id);

        if (error || !data) {
            return { success: true, data: getMockStrategyPerformance() };
        }

        const performance: StrategyPerformance[] = data.map((s) => ({
            id: s.strategy_id,
            name: s.strategy_name,
            trades: s.total_trades,
            winRate: Number(s.win_rate) || 0,
            avgRMultiple: Number(s.avg_r_multiple) || 0,
            totalPnL: Number(s.total_pnl) || 0,
            profitFactor: 0, // À calculer
        }));

        return { success: true, data: performance };
    } catch (error) {
        console.error("Error getStrategyPerformance:", error);
        return { success: true, data: getMockStrategyPerformance() };
    }
}

/**
 * Récupère la performance par symbole
 */
export async function getSymbolPerformance(
    filters?: DashboardFilters
): Promise<ActionResult<SymbolPerformance[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: true, data: getMockSymbolPerformance() };
        }

        const { data: trades, error } = await supabase
            .from("trades")
            .select("symbol, net_pnl, r_multiple")
            .eq("user_id", user.id)
            .eq("status", "CLOSED");

        if (error || !trades) {
            return { success: true, data: getMockSymbolPerformance() };
        }

        // Grouper par symbole
        const symbolMap = new Map<string, { trades: number; wins: number; pnl: number; rMultiples: number[] }>();

        trades.forEach((trade) => {
            const current = symbolMap.get(trade.symbol) || { trades: 0, wins: 0, pnl: 0, rMultiples: [] };
            current.trades++;
            current.pnl += Number(trade.net_pnl) || 0;
            if (Number(trade.net_pnl) > 0) current.wins++;
            if (trade.r_multiple) current.rMultiples.push(Number(trade.r_multiple));
            symbolMap.set(trade.symbol, current);
        });

        const performance: SymbolPerformance[] = Array.from(symbolMap.entries()).map(
            ([symbol, data]) => ({
                symbol,
                trades: data.trades,
                winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
                totalPnL: data.pnl,
                avgRMultiple:
                    data.rMultiples.length > 0
                        ? data.rMultiples.reduce((a, b) => a + b, 0) / data.rMultiples.length
                        : 0,
            })
        );

        return { success: true, data: performance.sort((a, b) => b.totalPnL - a.totalPnL) };
    } catch (error) {
        console.error("Error getSymbolPerformance:", error);
        return { success: true, data: getMockSymbolPerformance() };
    }
}

/**
 * Récupère les trades récents
 */
export async function getRecentTrades(
    limit: number = 10
): Promise<ActionResult<RecentTrade[]>> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: true, data: getMockRecentTrades() };
        }

        const { data: trades, error } = await supabase
            .from("trades")
            .select(`
        id, symbol, direction, status, entry_date, exit_date,
        entry_price, exit_price, quantity, net_pnl, r_multiple,
        strategies(name)
      `)
            .eq("user_id", user.id)
            .order("entry_date", { ascending: false })
            .limit(limit);

        if (error || !trades) {
            return { success: true, data: getMockRecentTrades() };
        }

        const recentTrades: RecentTrade[] = trades.map((t) => {
            // strategies peut être un objet, un tableau, ou null selon la relation Supabase
            const strategyData = t.strategies as { name: string } | { name: string }[] | null;
            const strategyName = Array.isArray(strategyData)
                ? strategyData[0]?.name
                : strategyData?.name;

            return {
                id: t.id,
                symbol: t.symbol,
                direction: t.direction,
                status: t.status,
                entryDate: t.entry_date,
                exitDate: t.exit_date,
                entryPrice: Number(t.entry_price) || 0,
                exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
                quantity: Number(t.quantity) || 0,
                netPnL: Number(t.net_pnl) || 0,
                rMultiple: Number(t.r_multiple) || 0,
                strategyName,
            };
        });

        return { success: true, data: recentTrades };
    } catch (error) {
        console.error("Error getRecentTrades:", error);
        return { success: true, data: getMockRecentTrades() };
    }
}

/**
 * Récupère les résumés des portfolios
 */
export async function getPortfolioSummaries(): Promise<
    ActionResult<PortfolioSummary[]>
> {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: true, data: getMockPortfolioSummaries() };
        }

        const { data, error } = await supabase
            .from("portfolio_stats")
            .select("*")
            .eq("user_id", user.id);

        if (error || !data) {
            return { success: true, data: getMockPortfolioSummaries() };
        }

        const summaries: PortfolioSummary[] = data.map((p) => ({
            id: p.portfolio_id,
            name: p.portfolio_name,
            type: "PERSONAL",
            initialBalance: 10000,
            currentBalance: 10000 + Number(p.total_pnl),
            totalPnL: Number(p.total_pnl) || 0,
            returnPercent: (Number(p.total_pnl) / 10000) * 100,
            trades: p.total_trades,
            winRate: Number(p.win_rate) || 0,
        }));

        return { success: true, data: summaries };
    } catch (error) {
        console.error("Error getPortfolioSummaries:", error);
        return { success: true, data: getMockPortfolioSummaries() };
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function calculateStats(trades: unknown[]): TradingStats {
    const closedTrades = trades as Array<{
        net_pnl: number;
        r_multiple: number;
        total_fees: number;
        gross_pnl: number;
    }>;

    const wins = closedTrades.filter((t) => Number(t.net_pnl) > 0);
    const losses = closedTrades.filter((t) => Number(t.net_pnl) < 0);
    const breakeven = closedTrades.filter((t) => Number(t.net_pnl) === 0);

    const totalPnL = closedTrades.reduce((sum, t) => sum + Number(t.net_pnl), 0);
    const totalFees = closedTrades.reduce((sum, t) => sum + Number(t.total_fees || 0), 0);
    const grossPnL = closedTrades.reduce((sum, t) => sum + Number(t.gross_pnl || t.net_pnl), 0);

    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + Number(t.net_pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + Number(t.net_pnl), 0) / losses.length) : 0;

    const grossWins = wins.reduce((s, t) => s + Number(t.net_pnl), 0);
    const grossLosses = Math.abs(losses.reduce((s, t) => s + Number(t.net_pnl), 0));

    const avgRMultiple =
        closedTrades.length > 0
            ? closedTrades.reduce((s, t) => s + (Number(t.r_multiple) || 0), 0) / closedTrades.length
            : 0;

    // Calcul des streaks
    let currentStreak = 0;
    let streakType: "winning" | "losing" | "none" = "none";
    let bestStreak = 0;
    let worstStreak = 0;
    let tempStreak = 0;
    let lastWin: boolean | null = null;

    closedTrades.forEach((t) => {
        const isWin = Number(t.net_pnl) > 0;
        if (lastWin === null || isWin === lastWin) {
            tempStreak++;
        } else {
            if (lastWin) bestStreak = Math.max(bestStreak, tempStreak);
            else worstStreak = Math.max(worstStreak, tempStreak);
            tempStreak = 1;
        }
        lastWin = isWin;
    });

    if (lastWin !== null) {
        if (lastWin) {
            bestStreak = Math.max(bestStreak, tempStreak);
            currentStreak = tempStreak;
            streakType = "winning";
        } else {
            worstStreak = Math.max(worstStreak, tempStreak);
            currentStreak = tempStreak;
            streakType = "losing";
        }
    }

    return {
        totalTrades: closedTrades.length,
        openTrades: 0,
        closedTrades: closedTrades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        breakevenTrades: breakeven.length,
        winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
        totalPnL: grossPnL,
        totalFees,
        netPnL: totalPnL,
        avgWin,
        avgLoss,
        largestWin: wins.length > 0 ? Math.max(...wins.map((t) => Number(t.net_pnl))) : 0,
        largestLoss: losses.length > 0 ? Math.min(...losses.map((t) => Number(t.net_pnl))) : 0,
        profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0,
        avgRMultiple,
        expectancy: closedTrades.length > 0 ? totalPnL / closedTrades.length : 0,
        currentStreak,
        streakType,
        bestStreak,
        worstStreak,
    };
}

function getEmptyStats(): TradingStats {
    return {
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalFees: 0,
        netPnL: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        avgRMultiple: 0,
        expectancy: 0,
        currentStreak: 0,
        streakType: "none",
        bestStreak: 0,
        worstStreak: 0,
    };
}

// ============================================================================
// DONNÉES MOCK POUR LE DÉVELOPPEMENT
// ============================================================================

function getMockTradingStats(): TradingStats {
    return {
        totalTrades: 127,
        openTrades: 3,
        closedTrades: 124,
        winningTrades: 78,
        losingTrades: 42,
        breakevenTrades: 4,
        winRate: 62.9,
        totalPnL: 15420.50,
        totalFees: 312.80,
        netPnL: 15107.70,
        avgWin: 287.35,
        avgLoss: 156.82,
        largestWin: 1245.00,
        largestLoss: -567.00,
        profitFactor: 2.14,
        avgRMultiple: 1.87,
        expectancy: 121.83,
        currentStreak: 4,
        streakType: "winning",
        bestStreak: 9,
        worstStreak: 5,
    };
}

function getMockEquityCurve(): EquityCurvePoint[] {
    const data: EquityCurvePoint[] = [];
    let cumulative = 0;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let i = 0; i < 60; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const pnl = Math.random() > 0.4 ? Math.random() * 500 : -Math.random() * 300;
        cumulative += pnl;
        data.push({
            date: date.toISOString().split("T")[0],
            pnl: Math.round(pnl * 100) / 100,
            cumulativePnl: Math.round(cumulative * 100) / 100,
            tradeCount: i + 1,
        });
    }
    return data;
}

function getMockStrategyPerformance(): StrategyPerformance[] {
    return [
        { id: "1", name: "Breakout H1", trades: 45, winRate: 68.9, avgRMultiple: 2.1, totalPnL: 8750, profitFactor: 2.8 },
        { id: "2", name: "Mean Reversion", trades: 32, winRate: 71.8, avgRMultiple: 1.5, totalPnL: 4230, profitFactor: 2.1 },
        { id: "3", name: "Trend Following", trades: 28, winRate: 53.5, avgRMultiple: 2.8, totalPnL: 3890, profitFactor: 1.9 },
        { id: "4", name: "Scalping M15", trades: 22, winRate: 59.0, avgRMultiple: 0.8, totalPnL: -1120, profitFactor: 0.7 },
    ];
}

function getMockSymbolPerformance(): SymbolPerformance[] {
    return [
        { symbol: "EURUSD", trades: 35, winRate: 71.4, totalPnL: 5420, avgRMultiple: 2.1 },
        { symbol: "BTCUSD", trades: 28, winRate: 64.2, totalPnL: 4180, avgRMultiple: 1.8 },
        { symbol: "GBPUSD", trades: 22, winRate: 59.0, totalPnL: 2340, avgRMultiple: 1.5 },
        { symbol: "XAUUSD", trades: 18, winRate: 55.5, totalPnL: 1890, avgRMultiple: 1.9 },
        { symbol: "USDJPY", trades: 15, winRate: 66.6, totalPnL: 1280, avgRMultiple: 1.4 },
    ];
}

function getMockRecentTrades(): RecentTrade[] {
    return [
        { id: "1", symbol: "EURUSD", direction: "LONG", status: "CLOSED", entryDate: "2024-12-09T10:30:00Z", exitDate: "2024-12-09T14:45:00Z", entryPrice: 1.0542, exitPrice: 1.0578, quantity: 100000, netPnL: 360, rMultiple: 2.4, strategyName: "Breakout H1" },
        { id: "2", symbol: "BTCUSD", direction: "SHORT", status: "CLOSED", entryDate: "2024-12-08T08:15:00Z", exitDate: "2024-12-08T16:20:00Z", entryPrice: 44250, exitPrice: 43800, quantity: 0.5, netPnL: 225, rMultiple: 1.8, strategyName: "Trend Following" },
        { id: "3", symbol: "GBPUSD", direction: "LONG", status: "OPEN", entryDate: "2024-12-10T09:00:00Z", entryPrice: 1.2745, quantity: 50000, netPnL: 0, rMultiple: 0 },
        { id: "4", symbol: "XAUUSD", direction: "LONG", status: "CLOSED", entryDate: "2024-12-07T11:00:00Z", exitDate: "2024-12-07T15:30:00Z", entryPrice: 2035.50, exitPrice: 2028.20, quantity: 10, netPnL: -73, rMultiple: -0.8, strategyName: "Mean Reversion" },
        { id: "5", symbol: "USDJPY", direction: "SHORT", status: "CLOSED", entryDate: "2024-12-06T07:45:00Z", exitDate: "2024-12-06T12:00:00Z", entryPrice: 149.85, exitPrice: 149.32, quantity: 100000, netPnL: 354, rMultiple: 2.1, strategyName: "Breakout H1" },
    ];
}

function getMockPortfolioSummaries(): PortfolioSummary[] {
    return [
        { id: "1", name: "Live Trading", type: "PERSONAL", initialBalance: 10000, currentBalance: 15107.70, totalPnL: 5107.70, returnPercent: 51.07, trades: 85, winRate: 64.7 },
        { id: "2", name: "Demo Account", type: "DEMO", initialBalance: 100000, currentBalance: 112450, totalPnL: 12450, returnPercent: 12.45, trades: 42, winRate: 59.5 },
    ];
}
