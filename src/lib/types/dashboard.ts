// ============================================================================
// TYPES - Dashboard & Analytics
// ============================================================================

// Statistiques globales du trader
export interface TradingStats {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakevenTrades: number;
    winRate: number;
    totalPnL: number;
    totalFees: number;
    netPnL: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    profitFactor: number;
    avgRMultiple: number;
    expectancy: number;
    currentStreak: number;
    streakType: "winning" | "losing" | "none";
    bestStreak: number;
    worstStreak: number;
}

// Statistiques par période
export interface PeriodStats {
    period: string;
    trades: number;
    pnl: number;
    winRate: number;
    avgRMultiple: number;
}

// Données pour le graphique PnL cumulatif
export interface EquityCurvePoint {
    date: string;
    pnl: number;
    cumulativePnl: number;
    tradeCount: number;
}

// Données pour le graphique des trades par jour
export interface DailyTradingData {
    date: string;
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
}

// Données pour le graphique de distribution R-Multiple
export interface RMultipleDistribution {
    range: string;
    count: number;
    percentage: number;
}

// Performance par stratégie
export interface StrategyPerformance {
    id: string;
    name: string;
    trades: number;
    winRate: number;
    avgRMultiple: number;
    totalPnL: number;
    profitFactor: number;
}

// Performance par symbole
export interface SymbolPerformance {
    symbol: string;
    trades: number;
    winRate: number;
    totalPnL: number;
    avgRMultiple: number;
}

// Performance par direction
export interface DirectionPerformance {
    direction: "LONG" | "SHORT";
    trades: number;
    winRate: number;
    totalPnL: number;
    avgRMultiple: number;
}

// Performance par timeframe
export interface TimeframePerformance {
    timeframe: string;
    trades: number;
    winRate: number;
    totalPnL: number;
}

// Analyse psychologique
export interface PsychologyAnalysis {
    avgTiltScore: number;
    avgConfidence: number;
    avgStress: number;
    disciplineRate: number;
    topEmotions: Array<{ emotion: string; count: number; winRate: number }>;
    tiltCorrelation: number; // Corrélation entre tilt et pertes
}

// Trade récent pour l'affichage
export interface RecentTrade {
    id: string;
    symbol: string;
    direction: "LONG" | "SHORT";
    status: "OPEN" | "CLOSED" | "PENDING";
    entryDate: string;
    exitDate?: string;
    entryPrice: number;
    exitPrice?: number;
    quantity: number;
    netPnL: number;
    rMultiple: number;
    strategyName?: string;
}

// Filtres du dashboard
export interface DashboardFilters {
    portfolioId?: string;
    strategyId?: string;
    mode?: "LIVE" | "BACKTEST";
    dateFrom?: string;
    dateTo?: string;
    symbol?: string;
}

// Résumé du portfolio
export interface PortfolioSummary {
    id: string;
    name: string;
    type: string;
    initialBalance: number;
    currentBalance: number;
    totalPnL: number;
    returnPercent: number;
    trades: number;
    winRate: number;
}
