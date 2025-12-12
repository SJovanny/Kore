"use client";

// ============================================================================
// ECONOMIC CALENDAR WIDGET - Investing.com
// ============================================================================

import { memo } from "react";
import { CalendarDays } from "lucide-react";

interface EconomicCalendarProps {
    height?: number;
    countries?: string; // e.g., "4,5,22,17,35,25,34,10,32" for major economies
}

function EconomicCalendarComponent({
    height = 450,
    countries = "4,5,22,17,35,25,34", // USA, UK, Eurozone, France, Germany, Japan, Canada
}: EconomicCalendarProps) {
    // Investing.com Economic Calendar iframe
    const iframeSrc = `https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone,times498,filters&countries=${countries}&calType=week&timeZone=58&lang=5`;

    return (
        <div className="relative">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                Calendrier Économique
            </h3>
            <div
                className="rounded-lg overflow-hidden bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                style={{ height: `${height}px` }}
            >
                <iframe
                    src={iframeSrc}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowTransparency={true}
                    style={{
                        overflow: "hidden",
                        backgroundColor: "transparent",
                    }}
                    title="Calendrier Économique Investing.com"
                />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 text-center">
                Powered by{" "}
                <a
                    href="https://www.investing.com/economic-calendar/"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-blue-400 hover:underline"
                >
                    Investing.com
                </a>
            </p>
        </div>
    );
}

export const EconomicCalendar = memo(EconomicCalendarComponent);
