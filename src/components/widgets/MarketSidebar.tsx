"use client";

// ============================================================================
// MARKET SIDEBAR - Panneau latéral avec Watchlist et Calendrier Économique
// ============================================================================

import { useState } from "react";
import { TradingViewWatchlist } from "./TradingViewWatchlist";
import { EconomicCalendar } from "./EconomicCalendar";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    ChevronLeft,
    LineChart,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketSidebarProps {
    className?: string;
}

export function MarketSidebar({ className }: MarketSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                size="icon"
                variant="outline"
                className="fixed right-4 top-20 z-50 hidden 2xl:flex h-10 w-10 rounded-full shadow-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                title="Ouvrir le panneau de marché"
            >
                <LineChart className="w-5 h-5 text-blue-600" />
            </Button>
        );
    }

    return (
        <>
            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed right-0 top-0 z-40 h-screen pt-16",
                    "hidden 2xl:block",
                    "bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm",
                    "border-l border-slate-200 dark:border-slate-800",
                    "transition-all duration-300 ease-in-out",
                    isMinimized ? "w-12" : "w-80",
                    className
                )}
            >
                {/* Header */}
                <div className={cn(
                    "flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800",
                    isMinimized && "flex-col gap-2"
                )}>
                    {!isMinimized && (
                        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-blue-600" />
                            Marchés
                        </h2>
                    )}
                    <div className={cn("flex items-center gap-1", isMinimized && "flex-col")}>
                        <Button
                            onClick={() => setIsMinimized(!isMinimized)}
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title={isMinimized ? "Agrandir" : "Réduire"}
                        >
                            {isMinimized ? (
                                <ChevronLeft className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </Button>
                        {!isMinimized && (
                            <Button
                                onClick={() => setIsOpen(false)}
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-400 hover:text-red-500"
                                title="Fermer"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {!isMinimized && (
                    <div className="h-[calc(100vh-5rem)] overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        {/* TradingView Watchlist */}
                        <TradingViewWatchlist colorTheme="dark" height={350} />

                        {/* Divider */}
                        <div className="border-t border-slate-200 dark:border-slate-700" />

                        {/* Economic Calendar */}
                        <EconomicCalendar height={400} />
                    </div>
                )}

                {/* Minimized State Icons */}
                {isMinimized && (
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Button
                            onClick={() => setIsMinimized(false)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Voir la Watchlist"
                        >
                            <LineChart className="w-5 h-5 text-emerald-500" />
                        </Button>
                    </div>
                )}
            </aside>
        </>
    );
}
