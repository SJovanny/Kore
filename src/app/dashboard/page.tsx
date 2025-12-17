// ============================================================================
// DASHBOARD PAGE - Tableau de Bord Principal
// ============================================================================

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

import {
    getTradingStats,
    getEquityCurve,
    getStrategyPerformance,
    getSymbolPerformance,
    getRecentTrades,
} from "@/app/actions/dashboard";
import {
    DUMMY_STATS,
    DUMMY_EQUITY_CURVE,
    DUMMY_STRATEGIES,
    DUMMY_SYMBOLS,
} from "@/lib/dummy-data";

import { StatsCards, DetailedStats } from "@/components/dashboard/StatsCards";
import {
    EquityCurveChart,
    StrategyPerformanceChart,
    SymbolPerformanceChart,
    WinRateGauge,
} from "@/components/dashboard/Charts";
import { RecentTradesTable } from "@/components/dashboard/RecentTrades";
import { Calendar } from "@/components/dashboard/Calendar";
import { GoalsNotesPanel } from "@/components/dashboard/GoalsNotesPanel";
import { EconomicCalendarSection } from "@/components/widgets/EconomicCalendarSection";
import { HeatmapCard } from "@/components/widgets/HeatmapCard";

export default async function DashboardPage() {
    // Fetch all data in parallel
    const [statsResult, equityResult, strategyResult, symbolResult, tradesResult] =
        await Promise.all([
            getTradingStats(),
            getEquityCurve(),
            getStrategyPerformance(),
            getSymbolPerformance(),
            getRecentTrades(10),
        ]);

    const stats = statsResult.success ? statsResult.data : null;
    const equity = equityResult.success ? equityResult.data : [];
    const strategies = strategyResult.success ? strategyResult.data : [];
    const symbols = symbolResult.success ? symbolResult.data : [];
    const trades = tradesResult.success ? tradesResult.data : [];

    // Use dummy data if no trades exist to show "demo mode"
    const showDemoData = stats?.totalTrades === 0;

    const displayStats = showDemoData ? DUMMY_STATS : stats;
    const displayEquity = showDemoData ? DUMMY_EQUITY_CURVE : equity;
    const displayStrategies = showDemoData ? DUMMY_STRATEGIES : strategies;
    const displaySymbols = showDemoData ? DUMMY_SYMBOLS : symbols;

    // Transform trades for calendar (map to expected format)
    const calendarTrades = trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        direction: trade.direction as "LONG" | "SHORT",
        net_pnl: trade.netPnL || 0,
        entry_date: trade.entryDate || "",
        exit_date: trade.exitDate || null,
        status: trade.status,
    }));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <Suspense fallback={<StatsCardsSkeleton />}>
                {displayStats && <StatsCards stats={displayStats} />}
            </Suspense>

            {/* Calendar (2/3) + Goals & Notes (1/3) */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar Heatmap - 2/3 width */}
                <div className="lg:col-span-2">
                    <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-xl" />}>
                        <Calendar trades={calendarTrades} />
                    </Suspense>
                </div>

                {/* Goals & Notes Panel - 1/3 width */}
                <div className="lg:col-span-1">
                    <Suspense fallback={<Skeleton className="h-[320px] w-full rounded-xl" />}>
                        <GoalsNotesPanel />
                    </Suspense>
                </div>
            </div>

            {/* Equity Curve - Full Width */}
            <Suspense fallback={<ChartSkeleton />}>
                {displayEquity.length > 0 ? (
                    <EquityCurveChart data={displayEquity} />
                ) : (
                    <div className="flex items-center justify-center h-[300px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500">Aucun trade pour afficher la courbe</p>
                    </div>
                )}
            </Suspense>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Suspense fallback={<ChartSkeleton />}>
                    {displayStats && <WinRateGauge winRate={displayStats.winRate} trades={displayStats.totalTrades} />}
                </Suspense>

                <Suspense fallback={<ChartSkeleton />}>
                    {displayStrategies.length > 0 && <StrategyPerformanceChart data={displayStrategies} />}
                </Suspense>

                <Suspense fallback={<ChartSkeleton />}>
                    {displaySymbols.length > 0 && <SymbolPerformanceChart data={displaySymbols} />}
                </Suspense>
            </div>

            {/* Detailed Stats */}
            <Suspense fallback={<DetailedStatsSkeleton />}>
                {displayStats && <DetailedStats stats={displayStats} />}
            </Suspense>

            {/* Economic Calendar + TradingView Heatmap - Side by Side */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Suspense fallback={<Skeleton className="h-[550px] w-full rounded-xl" />}>
                    <EconomicCalendarSection height={500} />
                </Suspense>

                <Suspense fallback={<Skeleton className="h-[550px] w-full rounded-xl" />}>
                    <HeatmapCard height={460} />
                </Suspense>
            </div>

            {/* Recent Trades */}
            <Suspense fallback={<TableSkeleton />}>
                {trades.length > 0 ? (
                    <RecentTradesTable trades={trades} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-[200px] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 mb-2">Aucun trade enregistré</p>
                        <p className="text-sm text-slate-400">Commencez par ajouter votre premier trade</p>
                    </div>
                )}
            </Suspense>
        </div>
    );
}

// ============================================================================
// SKELETONS
// ============================================================================

function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
            ))}
        </div>
    );
}

function ChartSkeleton() {
    return <Skeleton className="h-[300px] w-full rounded-xl" />;
}

function DetailedStatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-52 w-full" />
            ))}
        </div>
    );
}

function TableSkeleton() {
    return <Skeleton className="h-80 w-full rounded-xl" />;
}
