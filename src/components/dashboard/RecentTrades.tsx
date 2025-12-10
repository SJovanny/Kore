// ============================================================================
// DASHBOARD - Tableau des Trades Récents
// ============================================================================

"use client";

import { TrendingUp, TrendingDown, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecentTrade } from "@/lib/types/dashboard";

interface RecentTradesTableProps {
    trades: RecentTrade[];
}

export function RecentTradesTable({ trades }: RecentTradesTableProps) {
    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Trades Récents</CardTitle>
                <CardDescription>Vos dernières positions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b text-left text-sm text-muted-foreground">
                                <th className="pb-3 font-medium">Symbole</th>
                                <th className="pb-3 font-medium">Direction</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Entrée</th>
                                <th className="pb-3 font-medium">Sortie</th>
                                <th className="pb-3 font-medium text-right">P&L</th>
                                <th className="pb-3 font-medium text-right">R</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade) => (
                                <tr
                                    key={trade.id}
                                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                    <td className="py-3">
                                        <span className="font-semibold">{trade.symbol}</span>
                                        {trade.strategyName && (
                                            <span className="block text-xs text-muted-foreground">
                                                {trade.strategyName}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <Badge
                                            variant="outline"
                                            className={
                                                trade.direction === "LONG"
                                                    ? "border-green-500 text-green-500"
                                                    : "border-red-500 text-red-500"
                                            }
                                        >
                                            {trade.direction === "LONG" ? (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                            )}
                                            {trade.direction}
                                        </Badge>
                                    </td>
                                    <td className="py-3">
                                        <StatusBadge status={trade.status} />
                                    </td>
                                    <td className="py-3">
                                        <span className="font-mono text-sm">{trade.entryPrice.toFixed(4)}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            {formatDate(trade.entryDate)}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        {trade.exitPrice ? (
                                            <>
                                                <span className="font-mono text-sm">{trade.exitPrice.toFixed(4)}</span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {trade.exitDate ? formatDate(trade.exitDate) : "-"}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={`font-semibold ${trade.netPnL > 0
                                                    ? "text-green-500"
                                                    : trade.netPnL < 0
                                                        ? "text-red-500"
                                                        : "text-muted-foreground"
                                                }`}
                                        >
                                            {trade.netPnL >= 0 ? "+" : ""}${trade.netPnL.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span
                                            className={`font-semibold ${trade.rMultiple > 0
                                                    ? "text-green-500"
                                                    : trade.rMultiple < 0
                                                        ? "text-red-500"
                                                        : "text-muted-foreground"
                                                }`}
                                        >
                                            {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case "OPEN":
            return (
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Ouvert
                </Badge>
            );
        case "CLOSED":
            return (
                <Badge variant="outline" className="border-green-500 text-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Clôturé
                </Badge>
            );
        default:
            return (
                <Badge variant="outline">
                    {status}
                </Badge>
            );
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
