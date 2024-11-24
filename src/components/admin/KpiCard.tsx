"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: number; // percentage, positive = up, negative = down
    subtitle?: string;
    className?: string;
}

export function KpiCard({ label, value, icon, trend, subtitle, className }: KpiCardProps) {
    const displayValue = typeof value === "number" ? value.toLocaleString("pt-BR") : value;

    return (
        <Card className={cn("border-border shadow-sm", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                </CardTitle>
                <div className="text-muted-foreground">{icon}</div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trend !== undefined ? (
                        <>
                            {trend > 0 ? (
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                            ) : trend < 0 ? (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : (
                                <Minus className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={cn(
                                "text-xs font-medium",
                                trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-muted-foreground"
                            )}>
                                {trend > 0 ? "+" : ""}{trend}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">vs período anterior</span>
                        </>
                    ) : subtitle ? (
                        <span className="text-xs text-muted-foreground">{subtitle}</span>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
