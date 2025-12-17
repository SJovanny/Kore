"use client";

// ============================================================================
// CALENDAR HEATMAP - Calendrier Interactif avec Trades
// ============================================================================

import { useState, useMemo } from "react";
import { AddTradeModal } from "@/components/trades/AddTradeModal";
import { useRouter } from "next/navigation";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday,
    isFuture,
    addWeeks,
    subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    TrendingUp,
    TrendingDown,
    Minus,
    Plus,
    Wallet,
    Eye,
    CalendarDays,
    LayoutGrid,
} from "lucide-react";

// Types
interface DayData {
    date: Date;
    pnl: number;
    tradesCount: number;
}

interface Trade {
    id: string;
    symbol: string;
    direction: "LONG" | "SHORT";
    net_pnl: number;
    entry_date: string;
    exit_date: string | null;
    status: string;
}

interface Portfolio {
    id: string;
    name: string;
    type: "DEMO" | "FUNDED" | "PERSONAL" | "PROP_FIRM";
    currency: string;
}

interface CalendarProps {
    trades?: Trade[];
    portfolios?: Portfolio[];
    selectedPortfolioId?: string;
    onPortfolioChange?: (portfolioId: string) => void;
    onDayClick?: (date: Date, trades: Trade[]) => void;
}

// Helper: Get PnL color intensity
function getPnLColor(pnl: number, maxAbsPnl: number): string {
    if (pnl === 0) return "bg-slate-100 dark:bg-slate-800";

    const intensity = Math.min(Math.abs(pnl) / (maxAbsPnl || 1), 1);

    if (pnl > 0) {
        if (intensity > 0.75) return "bg-emerald-500 dark:bg-emerald-500";
        if (intensity > 0.5) return "bg-emerald-400 dark:bg-emerald-600";
        if (intensity > 0.25) return "bg-emerald-300 dark:bg-emerald-700";
        return "bg-emerald-200 dark:bg-emerald-800";
    } else {
        if (intensity > 0.75) return "bg-red-500 dark:bg-red-500";
        if (intensity > 0.5) return "bg-red-400 dark:bg-red-600";
        if (intensity > 0.25) return "bg-red-300 dark:bg-red-700";
        return "bg-red-200 dark:bg-red-800";
    }
}

function formatCurrency(amount: number, currency: string = "EUR"): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

// Mock portfolios for demo
const mockPortfolios: Portfolio[] = [
    { id: "all", name: "Tous les comptes", type: "PERSONAL", currency: "EUR" },
    { id: "1", name: "Compte Principal", type: "PERSONAL", currency: "EUR" },
    { id: "2", name: "FTMO 100K", type: "PROP_FIRM", currency: "USD" },
    { id: "3", name: "Demo Trading", type: "DEMO", currency: "EUR" },
];

export function Calendar({
    trades = [],
    portfolios = mockPortfolios,
    selectedPortfolioId = "all",
    onPortfolioChange,
    onDayClick,
}: CalendarProps) {
    const router = useRouter();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentPortfolio, setCurrentPortfolio] = useState(selectedPortfolioId);
    const [openPopoverDay, setOpenPopoverDay] = useState<string | null>(null);

    // Modal state
    const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
    const [modalSelectedDate, setModalSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week">("week");

    // Handle portfolio change
    const handlePortfolioChange = (portfolioId: string) => {
        setCurrentPortfolio(portfolioId);
        onPortfolioChange?.(portfolioId);
    };

    // Filter trades by portfolio
    const filteredTrades = useMemo(() => {
        if (currentPortfolio === "all") return trades;
        // In real app, filter by portfolio_id
        return trades;
    }, [trades, currentPortfolio]);

    // Calculate daily PnL data
    const dailyData = useMemo(() => {
        const dataMap = new Map<string, DayData & { trades: Trade[] }>();

        filteredTrades.forEach((trade) => {
            if (!trade.exit_date) return;

            const dateKey = format(new Date(trade.exit_date), "yyyy-MM-dd");
            const existing = dataMap.get(dateKey);

            if (existing) {
                existing.pnl += trade.net_pnl || 0;
                existing.tradesCount += 1;
                existing.trades.push(trade);
            } else {
                dataMap.set(dateKey, {
                    date: new Date(trade.exit_date),
                    pnl: trade.net_pnl || 0,
                    tradesCount: 1,
                    trades: [trade],
                });
            }
        });

        return dataMap;
    }, [filteredTrades]);

    // Find max absolute PnL for color scaling
    const maxAbsPnl = useMemo(() => {
        let max = 0;
        dailyData.forEach((data) => {
            max = Math.max(max, Math.abs(data.pnl));
        });
        return max || 100;
    }, [dailyData]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        if (viewMode === "week") {
            const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });
            return eachDayOfInterval({ start: weekStart, end: weekEnd });
        }
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth, viewMode]);

    // Navigation
    const goToPrevious = () => {
        if (viewMode === "week") {
            setCurrentMonth(subWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(subMonths(currentMonth, 1));
        }
    };
    const goToNext = () => {
        if (viewMode === "week") {
            setCurrentMonth(addWeeks(currentMonth, 1));
        } else {
            setCurrentMonth(addMonths(currentMonth, 1));
        }
    };
    const goToToday = () => setCurrentMonth(new Date());

    // Handle day click
    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        const dateKey = format(date, "yyyy-MM-dd");
        const dayTrades = filteredTrades.filter((trade) => {
            if (!trade.exit_date) return false;
            return format(new Date(trade.exit_date), "yyyy-MM-dd") === dateKey;
        });
        onDayClick?.(date, dayTrades);
    };

    // Open modal to add trade for specific date
    const handleAddTrade = (date: Date) => {
        setModalSelectedDate(date);
        setIsAddTradeModalOpen(true);
    };

    // Calculate monthly stats
    const monthlyStats = useMemo(() => {
        let totalPnl = 0;
        let winDays = 0;
        let lossDays = 0;
        let totalTrades = 0;

        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        dailyData.forEach((data, dateKey) => {
            const date = new Date(dateKey);
            if (date >= monthStart && date <= monthEnd) {
                totalPnl += data.pnl;
                totalTrades += data.tradesCount;
                if (data.pnl > 0) winDays++;
                else if (data.pnl < 0) lossDays++;
            }
        });

        return { totalPnl, winDays, lossDays, totalTrades };
    }, [currentMonth, dailyData]);

    const currentPortfolioData = portfolios.find((p) => p.id === currentPortfolio);
    const currency = currentPortfolioData?.currency || "EUR";
    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600" />
                        Calendrier de Trading
                    </CardTitle>

                    {/* Portfolio Selector */}
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <Select value={currentPortfolio} onValueChange={handlePortfolioChange}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Compte" />
                            </SelectTrigger>
                            <SelectContent>
                                {portfolios.map((portfolio) => (
                                    <SelectItem key={portfolio.id} value={portfolio.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{portfolio.name}</span>
                                            {portfolio.type !== "PERSONAL" && portfolio.id !== "all" && (
                                                <Badge variant="secondary" className="text-[10px] px-1">
                                                    {portfolio.type}
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={goToPrevious}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToToday} className="px-3 font-semibold">
                            {viewMode === "week"
                                ? `${format(startOfWeek(currentMonth, { weekStartsOn: 1 }), "d MMM", { locale: fr })} - ${format(endOfWeek(currentMonth, { weekStartsOn: 1 }), "d MMM yyyy", { locale: fr })}`
                                : format(currentMonth, "MMMM yyyy", { locale: fr })}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={goToNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* View toggle + Quick add */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                            <Button
                                variant={viewMode === "week" ? "default" : "ghost"}
                                size="sm"
                                className="h-7 px-2 rounded-none"
                                onClick={() => setViewMode("week")}
                            >
                                <CalendarDays className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === "month" ? "default" : "ghost"}
                                size="sm"
                                className="h-7 px-2 rounded-none"
                                onClick={() => setViewMode("month")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => handleAddTrade(new Date())}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Trade
                        </Button>
                    </div>
                </div>

                {/* Monthly summary */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                    <div className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                            {monthlyStats.totalTrades}
                        </p>
                        <p className="text-xs text-slate-500">Trades</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {monthlyStats.winDays}
                        </p>
                        <p className="text-xs text-slate-500">Jours +</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <p className="text-base font-bold text-red-600 dark:text-red-400">
                            {monthlyStats.lossDays}
                        </p>
                        <p className="text-xs text-slate-500">Jours -</p>
                    </div>
                    <div className={cn(
                        "text-center p-2 rounded-lg",
                        monthlyStats.totalPnl >= 0
                            ? "bg-emerald-50 dark:bg-emerald-900/20"
                            : "bg-red-50 dark:bg-red-900/20"
                    )}>
                        <p className={cn(
                            "text-base font-bold",
                            monthlyStats.totalPnl >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                        )}>
                            {monthlyStats.totalPnl >= 0 ? "+" : ""}{formatCurrency(monthlyStats.totalPnl, currency)}
                        </p>
                        <p className="text-xs text-slate-500">PnL</p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-2">
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-slate-500 py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayData = dailyData.get(dateKey);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isDayToday = isToday(day);
                        const isFutureDay = isFuture(day);
                        const hasTrades = dayData && dayData.tradesCount > 0;

                        return (
                            <Popover
                                key={idx}
                                open={openPopoverDay === dateKey}
                                onOpenChange={(open) => setOpenPopoverDay(open ? dateKey : null)}
                            >
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={() => {
                                            handleDayClick(day);
                                            if (isCurrentMonth) {
                                                setOpenPopoverDay(dateKey);
                                            }
                                        }}
                                        disabled={!isCurrentMonth}
                                        className={cn(
                                            "aspect-square p-1 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                                            "hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 dark:hover:ring-offset-slate-900",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500",
                                            !isCurrentMonth && "opacity-30 cursor-not-allowed",
                                            isSelected && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900",
                                            isDayToday && "ring-2 ring-blue-400 dark:ring-blue-500",
                                            dayData
                                                ? getPnLColor(dayData.pnl, maxAbsPnl)
                                                : "bg-slate-100 dark:bg-slate-800"
                                        )}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <span className={cn(
                                                isCurrentMonth ? "text-slate-900 dark:text-white" : "text-slate-400",
                                                dayData && Math.abs(dayData.pnl) > maxAbsPnl * 0.5 && "text-white dark:text-white"
                                            )}>
                                                {format(day, "d")}
                                            </span>
                                            {hasTrades && (
                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                    {dayData.pnl > 0 ? (
                                                        <TrendingUp className="w-3 h-3 text-white" />
                                                    ) : dayData.pnl < 0 ? (
                                                        <TrendingDown className="w-3 h-3 text-white" />
                                                    ) : (
                                                        <Minus className="w-3 h-3" />
                                                    )}
                                                    <span className="text-[10px] text-white">{dayData.tradesCount}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hover indicator for clickable days */}
                                        {isCurrentMonth && !hasTrades && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500/20 rounded-lg">
                                                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                        )}
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="w-72 p-0" align="center">
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {format(day, "EEEE d MMMM", { locale: fr })}
                                            </h4>
                                            {isDayToday && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    Aujourd'hui
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Day PnL Summary */}
                                        {hasTrades ? (
                                            <div className={cn(
                                                "p-3 rounded-lg mb-3",
                                                dayData.pnl >= 0
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                                                    : "bg-red-50 dark:bg-red-900/20"
                                            )}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {dayData.tradesCount} trade{dayData.tradesCount > 1 ? "s" : ""}
                                                    </span>
                                                    <span className={cn(
                                                        "text-lg font-bold",
                                                        dayData.pnl >= 0 ? "text-emerald-600" : "text-red-600"
                                                    )}>
                                                        {dayData.pnl >= 0 ? "+" : ""}{formatCurrency(dayData.pnl, currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 rounded-lg mb-3 bg-slate-50 dark:bg-slate-800/50 text-center">
                                                <p className="text-sm text-slate-500">Aucun trade ce jour</p>
                                            </div>
                                        )}

                                        {/* Trade List Preview */}
                                        {hasTrades && dayData.trades.slice(0, 3).map((trade, i) => (
                                            <div
                                                key={trade.id}
                                                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={trade.direction === "LONG" ? "default" : "destructive"}
                                                        className="text-[10px] px-1.5"
                                                    >
                                                        {trade.direction}
                                                    </Badge>
                                                    <span className="font-mono text-sm">{trade.symbol}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    trade.net_pnl >= 0 ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {trade.net_pnl >= 0 ? "+" : ""}{formatCurrency(trade.net_pnl, currency)}
                                                </span>
                                            </div>
                                        ))}

                                        {hasTrades && dayData.tradesCount > 3 && (
                                            <p className="text-xs text-slate-500 text-center py-2">
                                                +{dayData.tradesCount - 3} autres trades
                                            </p>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                            {hasTrades && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => {
                                                        setOpenPopoverDay(null);
                                                        router.push(`/dashboard/trades?date=${dateKey}`);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Voir détails
                                                </Button>
                                            )}
                                            {!isFutureDay && (
                                                <Button
                                                    size="sm"
                                                    className={cn(
                                                        "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                                                        !hasTrades && "w-full"
                                                    )}
                                                    onClick={() => {
                                                        setOpenPopoverDay(null);
                                                        handleAddTrade(day);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Ajouter un trade
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    })}
                </div>
            </CardContent>

            {/* Add Trade Modal */}
            <AddTradeModal
                open={isAddTradeModalOpen}
                onOpenChange={setIsAddTradeModalOpen}
                selectedDate={modalSelectedDate}
                onSubmit={(data) => {
                    console.log("Trade documentation:", data);
                    // TODO: Handle trade submission
                }}
            />
        </Card>
    );
}
