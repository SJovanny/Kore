// ============================================================================
// DASHBOARD - Composants de Statistiques (KPI Cards)
// ============================================================================

"use client";

import {
    TrendingUp,
    TrendingDown,
    Target,
    Percent,
    DollarSign,
    BarChart3,
    Flame,
    Award,
    AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TradingStats } from "@/lib/types/dashboard";

interface StatsCardsProps {
    stats: TradingStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
    const cards = [
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            description: `${stats.winningTrades}W / ${stats.losingTrades}L`,
            icon: Percent,
            color: stats.winRate >= 50 ? "text-green-500" : "text-red-500",
            bgColor: stats.winRate >= 50 ? "bg-green-500/10" : "bg-red-500/10",
        },
        {
            title: "Net P&L",
            value: `$${stats.netPnL.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            description: `${stats.totalTrades} trades`,
            icon: DollarSign,
            color: stats.netPnL >= 0 ? "text-green-500" : "text-red-500",
            bgColor: stats.netPnL >= 0 ? "bg-green-500/10" : "bg-red-500/10",
        },
        {
            title: "Profit Factor",
            value: stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2),
            description: stats.profitFactor >= 1.5 ? "Excellent" : stats.profitFactor >= 1 ? "Bon" : "À améliorer",
            icon: BarChart3,
            color: stats.profitFactor >= 1.5 ? "text-green-500" : stats.profitFactor >= 1 ? "text-yellow-500" : "text-red-500",
            bgColor: stats.profitFactor >= 1.5 ? "bg-green-500/10" : stats.profitFactor >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
        },
        {
            title: "Avg R-Multiple",
            value: `${stats.avgRMultiple.toFixed(2)}R`,
            description: stats.avgRMultiple >= 2 ? "Très bon" : stats.avgRMultiple >= 1 ? "Correct" : "Faible",
            icon: Target,
            color: stats.avgRMultiple >= 2 ? "text-green-500" : stats.avgRMultiple >= 1 ? "text-yellow-500" : "text-red-500",
            bgColor: stats.avgRMultiple >= 2 ? "bg-green-500/10" : stats.avgRMultiple >= 1 ? "bg-yellow-500/10" : "bg-red-500/10",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

interface DetailedStatsProps {
    stats: TradingStats;
}

export function DetailedStats({ stats }: DetailedStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <StatRow label="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} />
                    <StatRow label="Avg Win" value={`$${stats.avgWin.toFixed(2)}`} positive />
                    <StatRow label="Avg Loss" value={`$${stats.avgLoss.toFixed(2)}`} negative />
                    <StatRow label="Largest Win" value={`$${stats.largestWin.toFixed(2)}`} positive />
                    <StatRow label="Largest Loss" value={`$${stats.largestLoss.toFixed(2)}`} negative />
                </CardContent>
            </Card>

            {/* Streaks */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Séries (Streaks)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Série Actuelle</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${stats.streakType === "winning" ? "text-green-500" : stats.streakType === "losing" ? "text-red-500" : ""}`}>
                                {stats.currentStreak}
                            </span>
                            {stats.streakType === "winning" && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {stats.streakType === "losing" && <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                    </div>
                    <StatRow label="Meilleure Série" value={`${stats.bestStreak} wins`} positive />
                    <StatRow label="Pire Série" value={`${stats.worstStreak} losses`} negative />
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        Résumé
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <StatRow label="Total Trades" value={stats.totalTrades.toString()} />
                    <StatRow label="Trades Ouverts" value={stats.openTrades.toString()} />
                    <StatRow label="Winning" value={stats.winningTrades.toString()} positive />
                    <StatRow label="Losing" value={stats.losingTrades.toString()} negative />
                    <StatRow label="Breakeven" value={stats.breakevenTrades.toString()} />
                    <StatRow label="Total Fees" value={`$${stats.totalFees.toFixed(2)}`} />
                </CardContent>
            </Card>
        </div>
    );
}

interface StatRowProps {
    label: string;
    value: string;
    positive?: boolean;
    negative?: boolean;
}

function StatRow({ label, value, positive, negative }: StatRowProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span
                className={`text-sm font-medium ${positive ? "text-green-500" : negative ? "text-red-500" : ""
                    }`}
            >
                {value}
            </span>
        </div>
    );
}

// Alert card for important notices
interface AlertCardProps {
    type: "warning" | "info" | "success";
    title: string;
    message: string;
}

export function AlertCard({ type, title, message }: AlertCardProps) {
    const styles = {
        warning: {
            bg: "bg-yellow-500/10 border-yellow-500/30",
            icon: AlertTriangle,
            iconColor: "text-yellow-500",
        },
        info: {
            bg: "bg-blue-500/10 border-blue-500/30",
            icon: Target,
            iconColor: "text-blue-500",
        },
        success: {
            bg: "bg-green-500/10 border-green-500/30",
            icon: Award,
            iconColor: "text-green-500",
        },
    };

    const style = styles[type];
    const Icon = style.icon;

    return (
        <Card className={`${style.bg} border`}>
            <CardContent className="flex items-start gap-3 pt-4">
                <Icon className={`h-5 w-5 mt-0.5 ${style.iconColor}`} />
                <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </CardContent>
        </Card>
    );
}
