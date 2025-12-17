"use client";

// ============================================================================
// TRADINGVIEW HEATMAP - Widget de visualisation des marchés en temps réel
// ============================================================================

import { useEffect, useRef, memo, useState } from "react";
import { useTheme } from "next-themes";

interface TradingViewHeatmapProps {
    height?: number;
    width?: string;
    blockSize?: "small" | "medium" | "large";
    blockColor?: "change" | "volume";
    locale?: string;
}

function TradingViewHeatmapComponent({
    height = 400,
    width = "100%",
    blockSize = "medium",
    blockColor = "change",
    locale = "fr",
}: TradingViewHeatmapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Ensure we're mounted before reading theme
    useEffect(() => {
        setMounted(true);
    }, []);

    // Determine widget theme based on site theme
    const widgetTheme = resolvedTheme === "dark" ? "dark" : "light";

    useEffect(() => {
        if (!containerRef.current || !mounted) return;

        // Clear previous widget
        containerRef.current.innerHTML = "";

        // Create script element
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
        script.type = "text/javascript";
        script.async = true;

        // Widget configuration - ForexCross for Forex markets
        script.innerHTML = JSON.stringify({
            exchanges: [],
            dataSource: "ForexCross",
            grouping: "sector",
            blockSize: blockSize,
            blockColor: blockColor,
            locale: locale,
            symbolUrl: "",
            colorTheme: widgetTheme,
            hasTopBar: true,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            width: width,
            height: height,
        });

        containerRef.current.appendChild(script);

        // Cleanup
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = "";
            }
        };
    }, [widgetTheme, height, width, blockSize, blockColor, locale, mounted]);

    // Don't render until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div
                className="tradingview-widget-container flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                style={{ height }}
            >
                <span className="text-slate-400">Chargement...</span>
            </div>
        );
    }

    return (
        <div className="tradingview-widget-container">
            <div ref={containerRef} />
            <div className="tradingview-widget-copyright">
                <a
                    href="https://www.tradingview.com/"
                    rel="noopener nofollow noreferrer"
                    target="_blank"
                    className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <span className="text-blue-500">Données</span> par TradingView
                </a>
            </div>
        </div>
    );
}

export const TradingViewHeatmap = memo(TradingViewHeatmapComponent);


