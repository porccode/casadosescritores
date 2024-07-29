import React from "react";
import { cn } from "@/lib/utils";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContentBlockProps {
    title: string;
    count?: number;
    children: React.ReactNode;
    headerActions?: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    variant?: "default" | "outline";
    icon?: React.ReactNode;
}

/**
 * Reusable visual container for section-like content (Capítulos, Comentários, etc.).
 * Standardizes the visual identity with a blue header and grey body.
 * Optimized for COMPACTNESS and CONSISTENCY: No icons, smaller fonts, unified count badge.
 * 
 * Variants:
 * - neutral: Black header (#000000), Light Grey body (#EEEEEE)
 * - brand: Blue header (#484DB5), Pale Blue body (#EFF0FF)
 * - default: Legacy style
 */
export function ContentBlock({
    title,
    count,
    children,
    headerActions,
    className,
    bodyClassName,
    variant = "default",
    icon,
}: ContentBlockProps) {
    // Styling mapping based on variants
    const styles = {
        outline: {
            header: "bg-transparent border-b",
            body: "bg-background",
        },
        default: {
            header: "bg-[#484DB5]",
            body: "bg-[#EDEDED]",
        },
    };

    const currentStyle = styles[variant] || styles.default;

    return (
        <Card className={cn(
            "w-full overflow-hidden shadow-none rounded-xl",
            variant === "outline" ? "border border-border bg-background" : "border-none bg-transparent",
            className
        )}>
            {/* Header: White text, Compact padding, Regular font */}
            <CardHeader className={cn(
                "px-4 py-2 flex-row items-center justify-between space-y-0",
                variant === "outline" ? "text-muted-foreground py-4" : "text-white",
                currentStyle.header
            )}>
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <div className={cn("flex-shrink-0", variant === "outline" ? "text-muted-foreground" : "text-white")}>{icon}</div>}
                    <CardTitle className={cn(
                        "truncate leading-none",
                        variant === "outline"
                            ? "text-sm font-semibold"
                            : "text-sm md:text-base font-normal text-white"
                    )}>
                        {title}
                    </CardTitle>
                    {count !== undefined && (
                        <Badge
                            variant="secondary"
                            className={cn(
                                "h-4 px-1.5 text-[10px] md:text-[11px] border-none shrink-0 font-medium",
                                variant === "outline"
                                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                                    : "bg-white/20 text-white hover:bg-white/30"
                            )}
                        >
                            {count}
                        </Badge>
                    )}
                </div>
                {headerActions && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {headerActions}
                    </div>
                )}
            </CardHeader>

            {/* Body */}
            <CardContent className={cn(
                "p-4",
                variant === "outline" ? "p-0" : "", // Outline variant often needs custom padding in child
                currentStyle.body,
                bodyClassName
            )}>
                {children}
            </CardContent>
        </Card>
    );
}
