"use client";

// ============================================================================
// WATCHLIST CARD - Widget TradingView dans une Card
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingViewWatchlist } from "./TradingViewWatchlist";
import { LineChart } from "lucide-react";

interface WatchlistCardProps {
    height?: number;
}

export function WatchlistCard({ height = 400 }: WatchlistCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    Watchlist
                    <span className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-normal text-slate-500">Live</span>
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <TradingViewWatchlist colorTheme="dark" height={height} />
            </CardContent>
        </Card>
    );
}
