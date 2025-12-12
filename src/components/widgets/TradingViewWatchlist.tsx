"use client";

// ============================================================================
// TRADINGVIEW WATCHLIST WIDGET
// ============================================================================

import { useEffect, useRef, memo } from "react";

interface TradingViewWatchlistProps {
    symbols?: string[];
    colorTheme?: "light" | "dark";
    height?: number;
}

const DEFAULT_SYMBOLS = [
    ["FX:EURUSD", "EUR/USD"],
    ["NASDAQ:NDX", "US100"],
    ["BINANCE:BTCUSDT", "BTC/USD"],
    ["AMEX:SPY", "SPY"],
    ["TVC:GOLD", "Gold"],
    ["FX:GBPUSD", "GBP/USD"],
    ["NASDAQ:AAPL", "Apple"],
    ["NASDAQ:TSLA", "Tesla"],
];

function TradingViewWatchlistComponent({
    symbols,
    colorTheme = "dark",
    height = 400,
}: TradingViewWatchlistProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous content
        containerRef.current.innerHTML = "";

        // Create container div for widget
        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container";
        widgetContainer.style.height = `${height}px`;
        widgetContainer.style.width = "100%";

        const widgetInner = document.createElement("div");
        widgetInner.className = "tradingview-widget-container__widget";
        widgetInner.style.height = "100%";
        widgetInner.style.width = "100%";
        widgetContainer.appendChild(widgetInner);

        containerRef.current.appendChild(widgetContainer);

        // Create and inject the script
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
        script.async = true;
        script.type = "text/javascript";
        
        const symbolsConfig = symbols 
            ? symbols.map(s => [s, s.split(":").pop() || s])
            : DEFAULT_SYMBOLS;

        script.innerHTML = JSON.stringify({
            width: "100%",
            height: "100%",
            symbolsGroups: [
                {
                    name: "Ma Watchlist",
                    symbols: symbolsConfig.map(([symbol, name]) => ({
                        name: symbol,
                        displayName: name,
                    })),
                },
            ],
            showSymbolLogo: true,
            isTransparent: true,
            colorTheme: colorTheme,
            locale: "fr",
            backgroundColor: "transparent",
        });

        widgetContainer.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [symbols, colorTheme, height]);

    return (
        <div className="relative">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Watchlist
            </h3>
            <div 
                ref={containerRef} 
                className="rounded-lg overflow-hidden bg-slate-900/50"
                style={{ height: `${height}px` }}
            />
        </div>
    );
}

export const TradingViewWatchlist = memo(TradingViewWatchlistComponent);
