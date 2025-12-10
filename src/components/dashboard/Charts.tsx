// ============================================================================
// DASHBOARD - Graphiques avec Recharts
// ============================================================================

"use client";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
    EquityCurvePoint,
    StrategyPerformance,
    SymbolPerformance,
} from "@/lib/types/dashboard";

// ============================================================================
// EQUITY CURVE CHART
// ============================================================================

interface EquityCurveChartProps {
    data: EquityCurvePoint[];
}

export function EquityCurveChart({ data }: EquityCurveChartProps) {
    const isPositive = data.length > 0 && data[data.length - 1].cumulativePnl >= 0;

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Courbe d&apos;Équité</CardTitle>
                <CardDescription>
                    P&L cumulatif sur la période sélectionnée
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={isPositive ? "#22c55e" : "#ef4444"}
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                }}
                                className="text-xs"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                                className="text-xs"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as EquityCurvePoint;
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                <p className="text-sm font-medium">{data.date}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Trade #{data.tradeCount}
                                                </p>
                                                <p className={`text-sm font-semibold ${data.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                    P&L: ${data.pnl.toFixed(2)}
                                                </p>
                                                <p className={`text-sm font-bold ${data.cumulativePnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                    Total: ${data.cumulativePnl.toFixed(2)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulativePnl"
                                stroke={isPositive ? "#22c55e" : "#ef4444"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorPnl)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// STRATEGY PERFORMANCE CHART
// ============================================================================

interface StrategyChartProps {
    data: StrategyPerformance[];
}

export function StrategyPerformanceChart({ data }: StrategyChartProps) {
    const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance par Stratégie</CardTitle>
                <CardDescription>P&L total par stratégie</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => `$${value.toLocaleString()}`}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload as StrategyPerformance;
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                <p className="text-sm font-medium">{data.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {data.trades} trades
                                                </p>
                                                <p className="text-sm">
                                                    Win Rate: <span className="font-semibold">{data.winRate.toFixed(1)}%</span>
                                                </p>
                                                <p className={`text-sm font-bold ${data.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                    P&L: ${data.totalPnL.toLocaleString()}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.totalPnL >= 0 ? COLORS[index % COLORS.length] : "#ef4444"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// SYMBOL PERFORMANCE CHART (PIE)
// ============================================================================

interface SymbolChartProps {
    data: SymbolPerformance[];
}

export function SymbolPerformanceChart({ data }: SymbolChartProps) {
    const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

    const pieData = data.slice(0, 6).map((item) => ({
        name: item.symbol,
        value: item.trades,
        pnl: item.totalPnL,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trades par Symbole</CardTitle>
                <CardDescription>Distribution des trades</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                                                <p className="text-sm font-medium">{data.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {data.value} trades
                                                </p>
                                                <p className={`text-sm font-bold ${data.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                                    P&L: ${data.pnl.toLocaleString()}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Legend
                                formatter={(value) => <span className="text-sm">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// WIN RATE GAUGE (Simple visual)
// ============================================================================

interface WinRateGaugeProps {
    winRate: number;
    trades: number;
}

export function WinRateGauge({ winRate, trades }: WinRateGaugeProps) {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (winRate / 100) * circumference;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Win Rate Global</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="none"
                            className="text-muted"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="45"
                            stroke={winRate >= 50 ? "#22c55e" : "#ef4444"}
                            strokeWidth="10"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${winRate >= 50 ? "text-green-500" : "text-red-500"}`}>
                            {winRate.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Sur {trades} trades
                </p>
            </CardContent>
        </Card>
    );
}
