"use client";

// ============================================================================
// ECONOMIC CALENDAR SECTION - Section complète pour le calendrier économique
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Globe, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EconomicCalendarSectionProps {
    height?: number;
    countries?: string;
}

export function EconomicCalendarSection({
    height = 500,
    countries = "4,5,22,17,35,25,34,10,32", // USA, UK, Eurozone, France, Germany, Japan, Canada, Switzerland, China
}: EconomicCalendarSectionProps) {
    // Investing.com Economic Calendar iframe - Full-featured version
    const iframeSrc = `https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone,times498,filters&countries=${countries}&calType=week&timeZone=58&lang=5`;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        Calendrier Économique
                    </CardTitle>

                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-red-500" />
                            <span className="text-slate-500">Haute importance</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-orange-400" />
                            <span className="text-slate-500">Moyenne</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-yellow-300" />
                            <span className="text-slate-500">Faible</span>
                        </div>
                    </div>
                </div>

                {/* Countries badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇺🇸</span> USD
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇪🇺</span> EUR
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇬🇧</span> GBP
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇯🇵</span> JPY
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇨🇦</span> CAD
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇨🇭</span> CHF
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        <span className="mr-1">🇨🇳</span> CNY
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div
                    className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700"
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

                {/* Footer attribution */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Données en temps réel par{" "}
                        <a
                            href="https://www.investing.com/economic-calendar/"
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-blue-500 hover:underline font-medium"
                        >
                            Investing.com
                        </a>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
