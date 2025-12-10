// ============================================================================
// DASHBOARD PAGE - Tableau de Bord Principal
// ============================================================================

import { Suspense } from "react";
import { LayoutDashboard, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
    getTradingStats,
    getEquityCurve,
    getStrategyPerformance,
    getSymbolPerformance,
    getRecentTrades,
} from "@/app/actions/dashboard";

import { StatsCards, DetailedStats } from "@/components/dashboard/StatsCards";
import {
    EquityCurveChart,
    StrategyPerformanceChart,
    SymbolPerformanceChart,
    WinRateGauge,
} from "@/components/dashboard/Charts";
import { RecentTradesTable } from "@/components/dashboard/RecentTrades";

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

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <LayoutDashboard className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    Vue d&apos;ensemble de vos performances
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Actualiser
                            </Button>
                            <Button asChild>
                                <Link href="/trades/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nouveau Trade
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* KPI Cards */}
                <Suspense fallback={<StatsCardsSkeleton />}>
                    {stats && <StatsCards stats={stats} />}
                </Suspense>

                {/* Equity Curve */}
                <Suspense fallback={<ChartSkeleton />}>
                    {equity.length > 0 && <EquityCurveChart data={equity} />}
                </Suspense>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Suspense fallback={<ChartSkeleton />}>
                        {stats && <WinRateGauge winRate={stats.winRate} trades={stats.totalTrades} />}
                    </Suspense>

                    <Suspense fallback={<ChartSkeleton />}>
                        {strategies.length > 0 && <StrategyPerformanceChart data={strategies} />}
                    </Suspense>

                    <Suspense fallback={<ChartSkeleton />}>
                        {symbols.length > 0 && <SymbolPerformanceChart data={symbols} />}
                    </Suspense>
                </div>

                {/* Detailed Stats */}
                <Suspense fallback={<DetailedStatsSkeleton />}>
                    {stats && <DetailedStats stats={stats} />}
                </Suspense>

                {/* Recent Trades */}
                <Suspense fallback={<TableSkeleton />}>
                    {trades.length > 0 && <RecentTradesTable trades={trades} />}
                </Suspense>
            </main>
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
    return <Skeleton className="h-[300px] w-full" />;
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
    return <Skeleton className="h-80 w-full" />;
}
