"use client";

// ============================================================================
// HEATMAP CARD - Widget TradingView Heatmap dans une Card
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradingViewHeatmap } from "./TradingViewHeatmap";
import { Flame } from "lucide-react";

interface HeatmapCardProps {
    height?: number;
}

export function HeatmapCard({ height = 400 }: HeatmapCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Heatmap Marchés
                    <span className="ml-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-normal text-slate-500">Live</span>
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <TradingViewHeatmap
                    dataSource="ForexCross"
                    colorTheme="dark"
                    height={height}
                />
            </CardContent>
        </Card>
    );
}

